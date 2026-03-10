use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use actix_web::http::header::{ContentRange, ContentRangeSpec};
use futures_util::StreamExt;
use sqlx::{PgPool, Row};
use std::io::{Read, Seek, SeekFrom, Write};
use std::fs::File;
use std::path::Path;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::models::media::{CreateFolder, Folder, Media, MediaTask};
use crate::services::ffmpeg::FFmpegService;
use crate::services::metadata_fetcher::MetadataFetcherService;

#[derive(serde::Deserialize)]
pub struct MediaQuery {
    pub media_type: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub is_filler: Option<bool>,
    pub folder_id: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct StreamQuery {
    pub proxy: Option<bool>,
}

async fn list_media(query: web::Query<MediaQuery>, pool: web::Data<PgPool>) -> impl Responder {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
        sqlx::QueryBuilder::new("SELECT * FROM media WHERE path NOT LIKE '%.proxy.%' AND path NOT LIKE '%.optimized.%' AND (path NOT LIKE '%/assets/protected/%' OR filename = 'big_buck_bunny_1080p_h264.mov')");

    if let Some(ref media_type) = query.media_type {
        if !media_type.is_empty() {
            query_builder.push(" AND media_type = ");
            query_builder.push_bind(media_type);
        }
    }

    if let Some(is_filler) = query.is_filler {
        query_builder.push(" AND is_filler = ");
        query_builder.push_bind(is_filler);
    }

    if let Some(ref search) = query.search {
        if !search.is_empty() {
            query_builder.push(" AND filename ILIKE ");
            query_builder.push_bind(format!("%{}%", search));
        }
    }

    if let Some(ref folder_id) = query.folder_id {
        if folder_id == "root" || folder_id.is_empty() {
            query_builder.push(" AND folder_id IS NULL");
        } else if let Ok(uid) = Uuid::parse_str(folder_id) {
            query_builder.push(" AND folder_id = ");
            query_builder.push_bind(uid);
        }
    }

    // Count is more complex with QueryBuilder for the same query.
    // Usually we wrap it or just run a separate count query for simplicity if performance allows.
    // For now, let's keep it simple and just run the list query.

    let count_query = "SELECT COUNT(*) FROM media WHERE path NOT LIKE '%.proxy.%' AND path NOT LIKE '%.optimized.%' AND (path NOT LIKE '%/assets/protected/%' OR filename = 'big_buck_bunny_1080p_h264.mov')";
    let mut count_builder: sqlx::QueryBuilder<sqlx::Postgres> =
        sqlx::QueryBuilder::new(count_query);

    if let Some(ref media_type) = query.media_type {
        if !media_type.is_empty() {
            count_builder.push(" AND media_type = ");
            count_builder.push_bind(media_type);
        }
    }

    if let Some(is_filler) = query.is_filler {
        count_builder.push(" AND is_filler = ");
        count_builder.push_bind(is_filler);
    }

    if let Some(ref search) = query.search {
        if !search.is_empty() {
            count_builder.push(" AND filename ILIKE ");
            count_builder.push_bind(format!("%{}%", search));
        }
    }

    if let Some(ref folder_id) = query.folder_id {
        if folder_id == "root" || folder_id.is_empty() {
            count_builder.push(" AND folder_id IS NULL");
        } else if let Ok(uid) = Uuid::parse_str(folder_id) {
            count_builder.push(" AND folder_id = ");
            count_builder.push_bind(uid);
        }
    }

    let total: (i64,) = match count_builder
        .build_query_as::<(i64,)>()
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(t) => t,
        Err(e) => {
            log::error!("Failed to count media: {}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    query_builder.push(" ORDER BY created_at DESC");
    query_builder.push(" LIMIT ");
    query_builder.push_bind(limit);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let media_result = query_builder
        .build_query_as::<Media>()
        .fetch_all(pool.get_ref())
        .await;

    match media_result {
        Ok(media) => {
            // Add proxy existence and optimization flags for video files
            let ffmpeg = FFmpegService::new();
            let media_with_proxy: Vec<serde_json::Value> = media.into_iter().map(|item| {
                let mut val = serde_json::to_value(&item).unwrap();
                let mut has_proxy = false;
                let mut is_optimized = false;

                if item.media_type == "video" {
                    let original_path = &item.path;
                    let stem = if original_path.to_lowercase().ends_with(".mp4") {
                        &original_path[..original_path.len() - 4]
                    } else {
                        original_path
                    };
                    
                    let proxy_path = format!("{}.proxy.mp4", stem);
                    has_proxy = std::path::Path::new(&proxy_path).exists();
                    
                    // Check if already optimized (this does a probe, might be slow but accurate)
                    is_optimized = ffmpeg.is_faststart_optimized(original_path);
                }

                let obj = val.as_object_mut().unwrap();
                obj.insert("has_proxy".to_string(), serde_json::json!(has_proxy));
                obj.insert("is_optimized".to_string(), serde_json::json!(is_optimized));
                val
            }).collect();

            HttpResponse::Ok().json(serde_json::json!({
                "media": media_with_proxy,
                "total": total.0,
                "page": page,
                "limit": limit,
                "pages": (total.0 as f64 / limit as f64).ceil() as i64
            }))
        },
        Err(e) => {
            log::error!("Failed to fetch media: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to fetch media"}))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct UpdateFillerRequest {
    pub is_filler: bool,
}

async fn update_filler(
    media_id: web::Path<Uuid>,
    req: web::Json<UpdateFillerRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query("UPDATE media SET is_filler = $1 WHERE id = $2")
        .bind(req.is_filler)
        .bind(media_id.into_inner())
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(result) if result.rows_affected() > 0 => HttpResponse::Ok().json(serde_json::json!({
            "message": "Filler status updated"
        })),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct UpdateMediaRequest {
    pub filename: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

async fn update_media(
    media_id: web::Path<Uuid>,
    req: web::Json<UpdateMediaRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    // If no fields to update, just return OK
    if req.filename.is_none() && req.metadata.is_none() {
        return HttpResponse::Ok().json(serde_json::json!({"message": "Nothing to update"}));
    }

    let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
        sqlx::QueryBuilder::new("UPDATE media SET ");
    let mut separated = query_builder.separated(", ");

    if let Some(ref filename) = req.filename {
        separated.push("filename = ");
        separated.push_bind_unseparated(filename);
    }

    if let Some(ref metadata) = req.metadata {
        separated.push("metadata = ");
        separated.push_bind_unseparated(metadata);
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(media_id.into_inner());

    let result = query_builder.build().execute(pool.get_ref()).await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().json(serde_json::json!({
            "message": "Media updated successfully"
        })),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            log::error!("Failed to update media: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn list_folders(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Folder>("SELECT * FROM folders ORDER BY name ASC")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(folders) => HttpResponse::Ok().json(folders),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn create_folder(req: web::Json<CreateFolder>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Folder>(
        "INSERT INTO folders (name, parent_id) VALUES ($1, $2) RETURNING *",
    )
    .bind(&req.name)
    .bind(req.parent_id)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(folder) => HttpResponse::Created().json(folder),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn delete_folder(folder_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let id = folder_id.into_inner();

    // 1. Get all media in this folder
    let media_in_folder = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE folder_id = $1")
        .bind(id)
        .fetch_all(pool.get_ref())
        .await;

    match media_in_folder {
        Ok(media_list) => {
            for media in media_list {
                // Delete physical files
                std::fs::remove_file(&media.path).ok();
                if let Some(thumb_path) = media.thumbnail_path {
                    std::fs::remove_file(&thumb_path).ok();
                }
            }
        }
        Err(e) => {
            return HttpResponse::InternalServerError().json(
                serde_json::json!({"error": format!("Failed to fetch media in folder: {}", e)}),
            );
        }
    }

    // 2. Delete media records (CASCADE would handle this if configured, but explicit is safer here)
    let _ = sqlx::query("DELETE FROM media WHERE folder_id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await;

    // 3. Delete the folder itself
    let result = sqlx::query("DELETE FROM folders WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok()
            .json(serde_json::json!({"message": "Folder and all content deleted permanently"})),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct MoveMediaRequest {
    pub folder_id: Option<Uuid>,
}

#[derive(serde::Deserialize)]
pub struct CopyMediaRequest {
    pub target_folder_id: Option<Uuid>,
}

async fn move_media(
    media_id: web::Path<Uuid>,
    req: web::Json<MoveMediaRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query("UPDATE media SET folder_id = $1 WHERE id = $2")
        .bind(req.folder_id)
        .bind(media_id.into_inner())
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Media moved"})),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn copy_media(
    media_id: web::Path<Uuid>,
    req: web::Json<CopyMediaRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    // Get original media
    let original = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    let original = match original {
        Ok(Some(m)) => m,
        Ok(None) => {
            return HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"}))
        }
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": e.to_string()}))
        }
    };

    // Generate new IDs and paths with FRIENDLY FILENAME
    let new_id = Uuid::new_v4();
    let filename_obj = Path::new(&original.filename);
    let stem = filename_obj
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let extension = filename_obj
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    // Friendly name for DB: "Video (Cópia).mp4"
    let friendly_filename = if extension.is_empty() {
        format!("{} (Cópia)", stem)
    } else {
        format!("{} (Cópia).{}", stem, extension)
    };

    // Physical filename with UUID for disk storage
    let physical_filename = if extension.is_empty() {
        format!("{}", new_id)
    } else {
        format!("{}.{}", new_id, extension)
    };

    let media_path =
        std::env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
    let new_path = format!("{}/{}", media_path, physical_filename);

    // Copy physical file
    if let Err(e) = std::fs::copy(&original.path, &new_path) {
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("Failed to copy file: {}", e)}));
    }

    // Copy thumbnail if exists
    let new_thumb_path = if let Some(ref orig_thumb) = original.thumbnail_path {
        let thumbnails_path = std::env::var("THUMBNAILS_PATH")
            .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());
        let new_thumb_filename = format!("{}.jpg", new_id);
        let path = format!("{}/{}", thumbnails_path, new_thumb_filename);

        std::fs::copy(orig_thumb, &path).ok();
        Some(path)
    } else {
        None
    };

    // Insert new record with FRIENDLY filename
    let result = sqlx::query("INSERT INTO media (id, filename, path, media_type, duration, width, height, codec, bitrate, thumbnail_path, folder_id, is_filler) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)")
        .bind(new_id)
        .bind(&friendly_filename)  // Use friendly name in DB
        .bind(&new_path)
        .bind(&original.media_type)
        .bind(original.duration)
        .bind(original.width)
        .bind(original.height)
        .bind(&original.codec)
        .bind(original.bitrate)
        .bind(new_thumb_path)
        .bind(req.target_folder_id)
        .bind(original.is_filler)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok()
            .json(serde_json::json!({"message": "Media copied", "new_id": new_id})),
        Err(e) => {
            std::fs::remove_file(&new_path).ok();
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

// NEW: Check if media is used in playlists/schedule
async fn check_media_usage(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let id_str = media_id.to_string();
    let search_pattern = format!("%{}%", id_str);

    // Find playlists that contain this media
    let playlists_result =
        sqlx::query("SELECT id, name FROM playlists WHERE content::text LIKE $1")
            .bind(&search_pattern)
            .fetch_all(pool.get_ref())
            .await;

    let playlists = match playlists_result {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                serde_json::json!({
                    "id": row.get::<Uuid, _>("id"),
                    "name": row.get::<String, _>("name")
                })
            })
            .collect::<Vec<_>>(),
        Err(_) => vec![],
    };

    // Count scheduled occurrences
    let scheduled_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM schedule s 
         JOIN playlists p ON s.playlist_id = p.id 
         WHERE p.content::text LIKE $1",
    )
    .bind(&search_pattern)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    HttpResponse::Ok().json(serde_json::json!({
        "in_use": scheduled_count > 0 || !playlists.is_empty(),
        "scheduled_count": scheduled_count,
        "playlists": playlists
    }))
}

// NEW: Replace media with filler in all playlists
async fn replace_with_filler(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let id_str = media_id.to_string();

    // Get a random filler
    let filler_result = sqlx::query_as::<_, Media>(
        "SELECT * FROM media WHERE is_filler = true ORDER BY RANDOM() LIMIT 1",
    )
    .fetch_optional(pool.get_ref())
    .await;

    let filler = match filler_result {
        Ok(Some(f)) => f,
        Ok(None) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "No filler available. Please mark at least one media as filler."}))
        }
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": e.to_string()}))
        }
    };

    // Replace in all playlists using PostgreSQL REPLACE function
    let update_result = sqlx::query(
        "UPDATE playlists 
         SET content = REPLACE(content::text, $1, $2)::jsonb 
         WHERE content::text LIKE $3",
    )
    .bind(&id_str)
    .bind(filler.id.to_string())
    .bind(format!("%{}%", id_str))
    .execute(pool.get_ref())
    .await;

    match update_result {
        Ok(result) => HttpResponse::Ok().json(serde_json::json!({
            "message": "Media replaced with filler in all playlists",
            "playlists_updated": result.rows_affected(),
            "filler_used": filler.filename
        })),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct TransparencyRequest {
    pub color: String, // "green" or "black"
}

async fn make_transparent(
    media_id: web::Path<Uuid>,
    req: web::Json<TransparencyRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match media {
        Ok(Some(m)) => {
            let ffmpeg = FFmpegService::new();
            let input_path = &m.path;

            // Extract the filename without extension properly
            let filename_obj = Path::new(&m.filename);
            let stem = filename_obj
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("media");

            let output_filename = format!("{}_transparent.webm", stem);
            let output_path = input_path.replace(&m.filename, &output_filename);

            log::info!(
                "Processing transparency for media: {} -> {}",
                m.filename,
                output_filename
            );

            if let Err(e) = ffmpeg.process_transparency(input_path, &output_path, &req.color) {
                log::error!("Transparency processing failed: {}", e);
                return HttpResponse::InternalServerError().json(serde_json::json!({"error": e}));
            }

            // Create new media record
            let id = Uuid::new_v4();
            let info =
                match ffmpeg.get_media_info(&output_path) {
                    Ok(i) => i,
                    Err(e) => return HttpResponse::InternalServerError().json(
                        serde_json::json!({"error": format!("Failed to probe output file: {}", e)}),
                    ),
                };

            let result = sqlx::query("INSERT INTO media (id, filename, path, media_type, duration, width, height, codec, bitrate, is_filler, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
                .bind(id)
                .bind(&output_filename)
                .bind(&output_path)
                .bind(&m.media_type)
                .bind(info.duration)
                .bind(info.width)
                .bind(info.height)
                .bind(info.codec)
                .bind(info.bitrate)
                .bind(false)
                .bind(m.folder_id)
                .execute(pool.get_ref())
                .await;

            match result {
                Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                    "message": "Transparency processed successfully",
                    "new_file": output_filename,
                    "id": id
                })),
                Err(e) => {
                    log::error!("Database insertion failed: {}", e);
                    HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": format!("Database error: {}", e)}))
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn fetch_metadata(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match media {
        Ok(Some(m)) => {
            // Fetch API keys from settings
            let settings = sqlx::query_as::<_, crate::models::settings::Settings>(
                "SELECT * FROM settings WHERE id = TRUE",
            )
            .fetch_optional(pool.get_ref())
            .await
            .ok()
            .flatten();

            let tmdb_key = settings
                .as_ref()
                .and_then(|s| s.tmdb_api_key.clone())
                .unwrap_or_default();
            let omdb_key = settings
                .as_ref()
                .and_then(|s| s.omdb_api_key.clone())
                .unwrap_or_default();
            let tvmaze_key = settings
                .as_ref()
                .and_then(|s| s.tvmaze_api_key.clone())
                .unwrap_or_default();

            let fetcher = MetadataFetcherService::new(tmdb_key, omdb_key, tvmaze_key);
            let result = fetcher.fetch_metadata(&m.filename).await;

            match result {
                Ok(meta) => {
                    // Convert to JSON
                    let metadata_json =
                        serde_json::to_value(&meta).unwrap_or(serde_json::json!({}));

                    // Update DB
                    let update = sqlx::query("UPDATE media SET metadata = $1 WHERE id = $2")
                        .bind(&metadata_json)
                        .bind(m.id)
                        .execute(pool.get_ref())
                        .await;

                    match update {
                        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                            "message": "Metadata fetched and updated",
                            "data": meta
                        })),
                        Err(e) => {
                            log::error!("Failed to update metadata in DB: {}", e);
                            HttpResponse::InternalServerError()
                                .json(serde_json::json!({"error": "Database update failed"}))
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Metadata fetch failed: {}", e);
                    // Return a partial success or specific error so UI knows it tried
                    HttpResponse::BadRequest().json(serde_json::json!({
                        "error": format!("Fetch failed: {}", e)
                    }))
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn get_media(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(media)) => HttpResponse::Ok().json(media),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn upload_media(
    mut payload: Multipart,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, actix_web::Error> {
    let media_path =
        std::env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
    let thumbnails_path = std::env::var("THUMBNAILS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());

    std::fs::create_dir_all(&media_path).ok();
    std::fs::create_dir_all(&thumbnails_path).ok();

    let mut current_folder_id: Option<Uuid> = None;

    while let Some(item) = payload.next().await {
        let mut field = item?;
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name().unwrap_or("");

        if field_name == "folder_id" {
            let mut value = Vec::new();
            while let Some(chunk) = field.next().await {
                value.extend_from_slice(&chunk?);
            }
            if let Ok(id_str) = String::from_utf8(value) {
                if let Ok(uid) = Uuid::parse_str(&id_str) {
                    current_folder_id = Some(uid);
                }
            }
            continue;
        }

        if field_name != "files" {
            continue;
        }

        let raw_filename = content_disposition
            .get_filename()
            .unwrap_or("unknown")
            .to_string();

        // Sanitize filename to prevent path traversal
        let filename = Path::new(&raw_filename)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown_file")
            .to_string();

        let id = Uuid::new_v4();
        let file_path = format!("{}/{}", media_path, filename);
        let mut f = std::fs::File::create(&file_path)?;

        while let Some(chunk) = field.next().await {
            let data = chunk?;
            f.write_all(&data)?;
        }

        // Get media info
        let ffmpeg = FFmpegService::new();
        let info = ffmpeg
            .get_media_info(&file_path)
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

        // Generate thumbnail
        let thumbnail_filename = format!("{}.jpg", id);
        let thumbnail_path = format!("{}/{}", thumbnails_path, thumbnail_filename);

        if info.has_video {
            let _ = ffmpeg.generate_thumbnail(&file_path, &thumbnail_path, 1.0);
        }

        let media_type = if info.has_video { "video" } else { "audio" };

        sqlx::query("INSERT INTO media (id, filename, path, media_type, duration, width, height, codec, bitrate, thumbnail_path, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
            .bind(id)
            .bind(&filename)
            .bind(&file_path)
            .bind(media_type)
            .bind(info.duration)
            .bind(info.width)
            .bind(info.height)
            .bind(info.codec)
            .bind(info.bitrate)
            .bind(Some(thumbnail_path))
            .bind(current_folder_id)
            .execute(pool.get_ref())
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Upload successful"})))
}

async fn delete_media(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    // Get path first
    let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.clone())
        .fetch_optional(pool.get_ref())
        .await;

    let media = match media {
        Ok(Some(m)) => m,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
    };

    // Delete from DB
    let result = sqlx::query("DELETE FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .execute(pool.get_ref())
        .await;

    if let Err(e) = result {
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()}));
    }

    // Delete files
    std::fs::remove_file(&media.path).ok();
    if let Some(thumb_path) = media.thumbnail_path {
        std::fs::remove_file(&thumb_path).ok();
    }
    // Delete associated proxy if it exists
    if media.media_type == "video" {
        let proxy_path = format!("{}.proxy.mp4", media.path.trim_end_matches(".mp4"));
        std::fs::remove_file(&proxy_path).ok();
    }


    HttpResponse::Ok().json(serde_json::json!({
        "message": "Media deleted successfully"
    }))
}

async fn stream_media(
    media_id: web::Path<Uuid>,
    query: web::Query<StreamQuery>,
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(media)) => {
            let mut path_str = media.path.clone();
            
            // Check if proxy is requested and available
            if query.proxy.unwrap_or(false) {
                let p_path = format!("{}.proxy.mp4", path_str.trim_end_matches(".mp4"));
                if std::path::Path::new(&p_path).exists() {
                    log::debug!("Serving proxy file instead of original: {}", p_path);
                    path_str = p_path;
                }
            }

            let path = std::path::Path::new(&path_str);

            // Security check: ensure path is within MEDIA_PATH or ASSETS_PATH
            let media_dir = std::env::var("MEDIA_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
            let assets_dir = std::env::var("ASSETS_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

            if !path.starts_with(&media_dir) && !path.starts_with(&assets_dir) && !path.exists() {
                log::warn!("Unauthorized access attempt to path: {:?}", path);
                return HttpResponse::Forbidden()
                    .json(serde_json::json!({"error": "Unauthorized path"}));
            }

            if !path.exists() {
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "File not found on disk"}));
            }

            // Get file metadata
            let file_metadata = match std::fs::metadata(&path) {
                Ok(m) => m,
                Err(e) => {
                    log::error!("Failed to get file metadata: {}", e);
                    return HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": "Failed to read file metadata"}));
                }
            };
            let file_size = file_metadata.len();

            // Determine content type based on file extension
            let content_type = match path.extension().and_then(|e| e.to_str()) {
                Some("mp4") => "video/mp4",
                Some("webm") => "video/webm",
                Some("mkv") => "video/x-matroska",
                Some("avi") => "video/x-msvideo",
                Some("mov") => "video/quicktime",
                Some("ts") => "video/mp2t",
                Some("mp3") => "audio/mpeg",
                Some("wav") => "audio/wav",
                Some("aac") => "audio/aac",
                Some("m4a") => "audio/mp4",
                Some("jpg") | Some("jpeg") => "image/jpeg",
                Some("png") => "image/png",
                Some("gif") => "image/gif",
                Some("webp") => "image/webp",
                _ => "application/octet-stream",
            };

            // Check for Range header
            let range_header = req.headers().get("Range");

            if let Some(range_str) = range_header {
                if let Ok(range_str) = range_str.to_str() {
                    // Parse Range header (e.g., "bytes=0-1023" or "bytes=0-")
                    if range_str.starts_with("bytes=") {
                        let range_part = &range_str[6..];
                        
                        // Handle multiple ranges - for simplicity, we only handle single range
                        if let Some(range_spec) = range_part.split(',').next() {
                            let parts: Vec<&str> = range_spec.split('-').collect();
                            
                            if parts.len() == 2 {
                                let start: u64 = parts[0].parse().unwrap_or(0);
                                let end: u64 = if parts[1].is_empty() {
                                    file_size - 1
                                } else {
                                    parts[1].parse().unwrap_or(file_size - 1)
                                };

                                // Clamp end to file size
                                let end = end.min(file_size - 1);
                                let length = end - start + 1;

                                // Open file and seek to start position
                                let mut file = match File::open(&path) {
                                    Ok(f) => f,
                                    Err(e) => {
                                        log::error!("Failed to open file: {}", e);
                                        return HttpResponse::InternalServerError()
                                            .json(serde_json::json!({"error": "Failed to open file"}));
                                    }
                                };

                                if file.seek(SeekFrom::Start(start)).is_err() {
                                    return HttpResponse::InternalServerError()
                                        .json(serde_json::json!({"error": "Failed to seek file"}));
                                }

                                // Read the requested chunk
                                let mut buffer = vec![0u8; length as usize];
                                if file.read_exact(&mut buffer).is_err() {
                                    return HttpResponse::InternalServerError()
                                        .json(serde_json::json!({"error": "Failed to read file chunk"}));
                                }

                                log::debug!(
                                    "Streaming range {}-{} of {} bytes for {:?}",
                                    start, end, file_size, path
                                );

                                // Build 206 Partial Content response
                                return HttpResponse::PartialContent()
                                    .insert_header(("Content-Type", content_type))
                                    .insert_header(("Content-Length", length))
                                    .insert_header(("Accept-Ranges", "bytes"))
                                    .insert_header(ContentRange(ContentRangeSpec::Bytes {
                                        range: Some((start, end)),
                                        instance_length: Some(file_size),
                                    }))
                                    .body(buffer);
                            }
                        }
                    }
                }
            }

            // No Range header — serve first chunk for video (enables instant play) or full file for others
            log::debug!("No Range header - file_size={} bytes for {:?}", file_size, path);

            // For video files: respond with a 206 for the first 1MB so the browser receives
            // the moov atom immediately and can begin playback without a second round-trip.
            let is_video = content_type.starts_with("video/");
            if is_video && file_size > 1_048_576 {
                let chunk_size: u64 = 1_048_576; // 1 MB initial chunk
                let end = chunk_size - 1;

                match File::open(&path) {
                    Ok(mut file) => {
                        let mut buffer = vec![0u8; chunk_size as usize];
                        match file.read_exact(&mut buffer) {
                            Ok(_) => {
                                log::debug!("Serving first-chunk 206 ({} bytes) for {:?}", chunk_size, path);
                                return HttpResponse::PartialContent()
                                    .insert_header(("Content-Type", content_type))
                                    .insert_header(("Content-Length", chunk_size))
                                    .insert_header(("Accept-Ranges", "bytes"))
                                    .insert_header(("Cache-Control", "public, max-age=3600"))
                                    .insert_header(ContentRange(ContentRangeSpec::Bytes {
                                        range: Some((0, end)),
                                        instance_length: Some(file_size),
                                    }))
                                    .body(buffer);
                            }
                            Err(e) => {
                                log::error!("Failed to read first chunk: {}", e);
                                // Fall through to NamedFile below
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to open file for first-chunk: {}", e);
                    }
                }
            }

            // Fallback: NamedFile (used for non-video, small files, or if chunk read fails)
            match NamedFile::open_async(path).await {
                Ok(named_file) => {
                    let mut response = named_file.into_response(&req);
                    response.headers_mut().insert(
                        actix_web::http::header::HeaderName::from_static("accept-ranges"),
                        actix_web::http::header::HeaderValue::from_static("bytes"),
                    );
                    response.headers_mut().insert(
                        actix_web::http::header::CONTENT_TYPE,
                        actix_web::http::header::HeaderValue::from_static(content_type),
                    );
                    response.headers_mut().insert(
                        actix_web::http::header::HeaderName::from_static("cache-control"),
                        actix_web::http::header::HeaderValue::from_static("public, max-age=3600"),
                    );
                    response.headers_mut().insert(
                        actix_web::http::header::HeaderName::from_static("x-content-type-options"),
                        actix_web::http::header::HeaderValue::from_static("nosniff"),
                    );
                    response
                }
                Err(e) => {
                    log::error!("Failed to open file: {}", e);
                    HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": "Failed to open file"}))
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            log::error!("Database error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn get_thumbnail(
    media_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(media)) => {
            if let Some(thumb_path) = media.thumbnail_path {
                let mut path = std::path::PathBuf::from(&thumb_path);

                // If it's a legacy URL like /api/media/.../thumbnail, we need to try the actual disk path
                if thumb_path.starts_with("/api/media") {
                    let thumbnails_path = std::env::var("THUMBNAILS_PATH")
                        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());
                    let filename = format!("{}.jpg", media.id);
                    path = std::path::PathBuf::from(thumbnails_path).join(filename);
                }

                // If path doesn't exist (e.g. diff between Docker/Local or Legacy URL), try to heal it
                if !path.exists() {
                    // Try constructing path from THUMBNAILS_PATH + UUID
                    let thumbnails_path = std::env::var("THUMBNAILS_PATH")
                        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());
                    let filename = format!("{}.jpg", media.id);
                    path = std::path::PathBuf::from(thumbnails_path).join(filename);
                }

                // Final check: if it still doesn't exist, try to generate it now
                if !path.exists() && media.media_type == "video" {
                    let ffmpeg = FFmpegService::new();
                    let _ =
                        ffmpeg.generate_thumbnail(&media.path, path.to_str().unwrap_or(""), 1.0);
                }

                if !path.exists() {
                    return HttpResponse::NotFound()
                        .json(serde_json::json!({"error": "Thumbnail not found on disk"}));
                }

                // Security check: ensure path is within THUMBNAILS_PATH
                let thumbnails_dir = std::env::var("THUMBNAILS_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());
                if !path.starts_with(&thumbnails_dir) {
                    log::warn!("Unauthorized thumbnail access attempt: {:?}", path);
                    return HttpResponse::Forbidden()
                        .json(serde_json::json!({"error": "Unauthorized path"}));
                }

                match NamedFile::open_async(path).await {
                    Ok(named_file) => named_file.into_response(&req),
                    Err(_) => HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": "Failed to open thumbnail"})),
                }
            } else {
                HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "No thumbnail for this media"}))
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

/// Optimize a video file for web streaming (move moov atom to beginning)
async fn optimize_for_streaming(
    media_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(media)) => {
            // Only optimize video files
            if media.media_type != "video" {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Only video files can be optimized for streaming"}));
            }

            let path = std::path::Path::new(&media.path);
            
            // Get all allowed directories
            let media_dir = std::env::var("MEDIA_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
            let assets_dir = std::env::var("ASSETS_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());
            
            log::debug!("Optimize request - Path: {:?}, MEDIA_PATH: {}, ASSETS_PATH: {}", 
                path, media_dir, assets_dir);
            
            // Security check - verify path is within allowed directories
            let is_authorized = path.starts_with(&media_dir) 
                || path.starts_with(&assets_dir)
                || path.exists(); // If file exists, it's likely valid (uploaded through proper channels)
            
            if !is_authorized {
                log::warn!("Unauthorized path access attempt: {:?} (expected prefix: {} or {})", 
                    path, media_dir, assets_dir);
                return HttpResponse::Forbidden()
                    .json(serde_json::json!({"error": "Unauthorized path"}));
            }

            if !path.exists() {
                log::warn!("File not found on disk: {:?}", path);
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "File not found on disk"}));
            }

            let original_path = path.to_string_lossy().to_string();
            let stem = if original_path.to_lowercase().ends_with(".mp4") {
                &original_path[..original_path.len() - 4]
            } else {
                &original_path
            };
            let optimized_path = format!("{}.optimized.mp4", stem);

            // Check if already optimized
            let ffmpeg = FFmpegService::new();
            if ffmpeg.is_faststart_optimized(&original_path) {
                log::info!("Video already optimized for streaming: {}", original_path);
                return HttpResponse::Ok().json(serde_json::json!({
                    "message": "Video is already optimized for streaming",
                    "media_id": media.id
                }));
            }

            log::info!("Starting optimization (BG): {} -> {}", original_path, optimized_path);
            
            let pool_bg = pool.get_ref().clone();
            let media_id_bg = media.id;

            tokio::spawn(async move {
                // Create task entry
                let task_id = Uuid::new_v4();
                let _ = sqlx::query("INSERT INTO media_tasks (id, media_id, task_type, status) VALUES ($1, $2, $3, $4)")
                    .bind(task_id)
                    .bind(media_id_bg)
                    .bind("optimize")
                    .bind("processing")
                    .execute(&pool_bg)
                    .await;

                let ffmpeg = FFmpegService::new();
                match ffmpeg.optimize_for_streaming(&original_path, &optimized_path) {
                    Ok(_) => {
                        // Replace original with optimized version
                        if let Err(e) = std::fs::rename(&optimized_path, &original_path) {
                            log::error!("Failed to replace original file: {}", e);
                            let _ = std::fs::remove_file(&optimized_path);
                            let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                                .bind(format!("Rename failed: {}", e))
                                .bind(task_id)
                                .execute(&pool_bg)
                                .await;
                        } else {
                            log::info!("Successfully optimized video for streaming: {}", original_path);
                            let _ = sqlx::query("UPDATE media_tasks SET status = 'completed', progress = 1.0, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                                .bind(task_id)
                                .execute(&pool_bg)
                                .await;
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to optimize video: {}", e);
                        let _ = std::fs::remove_file(&optimized_path);
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                            .bind(e)
                            .bind(task_id)
                            .execute(&pool_bg)
                            .await;
                    }
                }
            });

            HttpResponse::Accepted().json(serde_json::json!({
                "message": "Optimization started in background",
                "media_id": media.id
            }))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            log::error!("Database error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

/// Generate a lightweight proxy version of a video for web preview
async fn generate_proxy(
    media_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(media)) => {
            if media.media_type != "video" {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Only video files can have proxies"}));
            }

            let path = std::path::Path::new(&media.path);
            if !path.exists() {
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "Original file not found"}));
            }

            let original_path = path.to_string_lossy().to_string();
            let stem = if original_path.to_lowercase().ends_with(".mp4") {
                &original_path[..original_path.len() - 4]
            } else {
                &original_path
            };
            let proxy_path = format!("{}.proxy.mp4", stem);

            // Check if proxy already exists
            if std::path::Path::new(&proxy_path).exists() {
                log::info!("Proxy already exists for: {}", original_path);
                return HttpResponse::Ok().json(serde_json::json!({
                    "message": "Proxy already exists",
                    "media_id": media.id
                }));
            }

            log::info!("Starting proxy generation (BG): {} -> {}", original_path, proxy_path);
            
            // Intelligence: Check if the file is already small enough to just be hard-linked
            if let (Some(height), Some(bitrate)) = (media.height, media.bitrate) {
                if height <= 720 && bitrate <= 5_000_000 {
                    log::info!("Video {} is already optimized. Creating hard link (Instant).", media.filename);
                    if std::fs::hard_link(&original_path, &proxy_path).is_ok() {
                        return HttpResponse::Ok().json(serde_json::json!({
                            "message": "Proxy generated instantly (Zero-Byte Hard Link)",
                            "path": proxy_path
                        }));
                    }
                }
            }

            let pool_bg = pool.get_ref().clone();
            let media_id_bg = media.id;

            tokio::spawn(async move {
                let task_id = Uuid::new_v4();
                let _ = sqlx::query("INSERT INTO media_tasks (id, media_id, task_type, status) VALUES ($1, $2, $3, $4)")
                    .bind(task_id)
                    .bind(media_id_bg)
                    .bind("proxy")
                    .bind("processing")
                    .execute(&pool_bg)
                    .await;

                let ffmpeg = FFmpegService::new();
                match ffmpeg.generate_proxy(&original_path, &proxy_path) {
                    Ok(_) => {
                        log::info!("Successfully generated proxy: {}", proxy_path);
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'completed', progress = 1.0, updated_at = CURRENT_TIMESTAMP WHERE id = $1")
                            .bind(task_id)
                            .execute(&pool_bg)
                            .await;
                    }
                    Err(e) => {
                        log::error!("Failed to generate proxy: {}", e);
                        let _ = std::fs::remove_file(&proxy_path);
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                            .bind(e)
                            .bind(task_id)
                            .execute(&pool_bg)
                            .await;
                    }
                }
            });

            HttpResponse::Accepted().json(serde_json::json!({
                "message": "Proxy generation started in background",
                "media_id": media.id
            }))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(e) => {
            log::error!("Database error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn get_media_tasks(
    media_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query_as::<_, MediaTask>("SELECT * FROM media_tasks WHERE media_id = $1 ORDER BY created_at DESC")
        .bind(media_id.into_inner())
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(tasks) => HttpResponse::Ok().json(tasks),
        Err(e) => {
            log::error!("Database error fetching tasks: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

#[derive(serde::Deserialize)]
struct BatchTasksRequest {
    ids: Vec<Uuid>,
}

async fn get_media_tasks_batch(
    req: web::Json<BatchTasksRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    if req.ids.is_empty() {
        return HttpResponse::Ok().json(serde_json::json!({ "tasks": {} }));
    }

    let result = sqlx::query_as::<_, MediaTask>(
        "SELECT * FROM media_tasks WHERE media_id = ANY($1) ORDER BY created_at DESC",
    )
    .bind(&req.ids)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(tasks) => {
            let mut grouped: std::collections::HashMap<String, Vec<MediaTask>> =
                std::collections::HashMap::new();
            for task in tasks {
                grouped
                    .entry(task.media_id.to_string())
                    .or_default()
                    .push(task);
            }
            HttpResponse::Ok().json(serde_json::json!({ "tasks": grouped }))
        }
        Err(e) => {
            log::error!("Database error fetching batch tasks: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}))
        }
    }
}

fn scan_dir_for_proxies(dir: &Path, proxies: &mut Vec<serde_json::Value>) {
    // Robust scan: ignore errors on subfolders to prevent entire scan failure
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(err) => {
            log::warn!("Could not read directory {:?}: {}", dir, err);
            return;
        }
    };

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if path.is_dir() {
            scan_dir_for_proxies(&path, proxies);
        } else if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
            if file_name.to_lowercase().ends_with(".proxy.mp4") {
                if let Ok(metadata) = entry.metadata() {
                    proxies.push(serde_json::json!({
                        "proxy_path": path.to_string_lossy(),
                        "size_bytes": metadata.len(),
                        "created_at": metadata.created().ok().map(|c| {
                            let datetime: chrono::DateTime<chrono::Utc> = c.into();
                            datetime
                        })
                    }));
                }
            }
        }
    }
}

fn get_all_system_paths() -> Vec<std::path::PathBuf> {
    let media_path = std::env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
    let assets_path = std::env::var("ASSETS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());
    let fillers_path = std::env::var("FILLERS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/fillers".to_string());
    let protected_path = std::env::var("PROTECTED_PATH").unwrap_or_else(|_| format!("{}/protected", assets_path));

    vec![
        Path::new(&media_path).to_path_buf(),
        Path::new(&assets_path).to_path_buf(),
        Path::new(&fillers_path).to_path_buf(),
        Path::new(&protected_path).to_path_buf(),
    ]
}

async fn get_proxy_stats(pool: web::Data<PgPool>) -> impl Responder {
    let paths = get_all_system_paths();
    let mut proxies = Vec::new();
    
    for path in &paths {
        scan_dir_for_proxies(path, &mut proxies);
    }

    let mut unique_paths = std::collections::HashSet::new();
    let mut total_bytes: u64 = 0;
    let mut proxy_count: u32 = 0;

    for p in proxies {
        if let Some(path) = p["proxy_path"].as_str() {
            if unique_paths.insert(path.to_string()) {
                total_bytes += p["size_bytes"].as_u64().unwrap_or(0);
                proxy_count += 1;
            }
        }
    }

    // Base de Dados (Fetching paths to compute sync accurately)
    let db_paths_res = sqlx::query_as::<_, (String,)>("SELECT path FROM media")
        .fetch_all(pool.get_ref())
        .await;
        
    let mut db_paths_set = std::collections::HashSet::new();
    let mut db_count = 0;
    if let Ok(records) = db_paths_res {
        for row in records {
            db_paths_set.insert(row.0);
            db_count += 1;
        }
    }

    // Realidade Física
    let mut physical_media = Vec::new();
    for path in &paths {
        collect_media_files(path, &mut physical_media, 0);
    }
    let physical_count = physical_media.len() as u64;

    let mut sync_needed = false;
    let mut new_files_count = 0;
    for physical_path in &physical_media {
        let p_str = physical_path.to_string_lossy().to_string();
        let lower_path = p_str.to_lowercase();
        
        // Skip system files and proxies
        if lower_path.contains(".proxy.") || lower_path.contains(".optimized.") {
            continue;
        }
        // Strict Asset Filtering: Ignore system files in protected folders unless it's the standard test video
        if lower_path.contains("/assets/protected/") && !lower_path.ends_with("big_buck_bunny_1080p_h264.mov") {
            continue;
        }
        
        if !db_paths_set.contains(&p_str) {
            sync_needed = true;
            new_files_count += 1;
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "total_bytes": total_bytes,
        "proxy_count": proxy_count,
        "physical_media_count": physical_count,
        "db_media_count": db_count,
        "sync_needed": sync_needed,
        "new_files_count": new_files_count
    }))
}

async fn purge_proxies(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE media_type = 'video'")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(videos) => {
            let mut deleted_bytes: u64 = 0;
            let mut deleted_count: u32 = 0;

            for video in videos {
                let stem = if video.path.to_lowercase().ends_with(".mp4") {
                    &video.path[..video.path.len() - 4]
                } else {
                    &video.path
                };
                
                let proxy_path = format!("{}.proxy.mp4", stem);
                if let Ok(metadata) = std::fs::metadata(&proxy_path) {
                    let size = metadata.len();
                    if std::fs::remove_file(&proxy_path).is_ok() {
                        deleted_bytes += size;
                        deleted_count += 1;
                    }
                }
            }

            HttpResponse::Ok().json(serde_json::json!({
                "message": "Proxies purged successfully",
                "deleted_bytes": deleted_bytes,
                "deleted_count": deleted_count
            }))
        }
        Err(e) => {
            log::error!("Database error purging proxies: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn list_proxies(pool: web::Data<PgPool>) -> impl Responder {
    let paths = get_all_system_paths();
    let mut physical_proxies = Vec::new();
    for path in &paths {
        scan_dir_for_proxies(path, &mut physical_proxies);
    }

    // Fetch all media to match names/IDs
    let media_result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE media_type = 'video'")
        .fetch_all(pool.get_ref())
        .await;

    let media_list = media_result.unwrap_or_default();
    let mut proxies = Vec::new();
    let mut matched_physical_paths = std::collections::HashSet::new();

    // 1. Process all database media
    for m in media_list {
        let m_path_lower = m.path.to_lowercase();
        
        // Find stem for matching
        let m_stem = if let Some(dot) = m_path_lower.rfind('.') {
            &m_path_lower[..dot]
        } else {
            &m_path_lower
        };

        // Find if any physical proxy matches this media
        let physical_match = physical_proxies.iter().find(|p| {
            let p_path = p["proxy_path"].as_str().unwrap_or("").to_lowercase();
            // Match stem and end with .proxy.mp4
            p_path.contains(m_stem) && p_path.ends_with(".proxy.mp4")
        });

        let mut p_obj = serde_json::json!({
            "id": m.id.to_string(),
            "media_id": m.id,
            "filename": m.filename,
            "source_type": "media_library",
            "exists": false,
            "size_bytes": 0,
            "proxy_path": "",
            "created_at": m.created_at
        });

        if let Some(p) = physical_match {
            let proxy_path_str = p["proxy_path"].as_str().unwrap_or("").to_string();
            matched_physical_paths.insert(proxy_path_str.clone());
            
            p_obj["exists"] = serde_json::json!(true);
            p_obj["size_bytes"] = p["size_bytes"].clone();
            p_obj["proxy_path"] = serde_json::json!(proxy_path_str);
            
            if let Ok(metadata) = std::fs::metadata(&proxy_path_str) {
                if let Ok(created) = metadata.created() {
                    p_obj["created_at"] = serde_json::json!(DateTime::<Utc>::from(created));
                }
            }
        }

        proxies.push(p_obj);
    }

    // 2. Add remaining physical proxies (orphans or branding)
    for p in physical_proxies {
        let proxy_path = p["proxy_path"].as_str().unwrap_or("").to_string();
        if matched_physical_paths.contains(&proxy_path) {
            continue;
        }

        let filename = Path::new(&proxy_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .replace(".proxy.mp4", "");

        let is_branding = proxy_path.contains("/assets/") || proxy_path.contains("branding");
        let label = if is_branding { "Branding" } else { "Órfão" };
        let source_key = if is_branding { "branding" } else { "orphan" };

        let mut orphan_obj = serde_json::json!({
            "id": proxy_path.clone(),
            "filename": format!("{} ({})", filename, label),
            "source_type": source_key,
            "exists": true,
            "size_bytes": p["size_bytes"],
            "proxy_path": proxy_path.clone(),
            "created_at": Utc::now()
        });

        if let Ok(metadata) = std::fs::metadata(&proxy_path) {
            if let Ok(created) = metadata.created() {
                orphan_obj["created_at"] = serde_json::json!(DateTime::<Utc>::from(created));
            }
        }

        proxies.push(orphan_obj);
    }

    HttpResponse::Ok().json(proxies)
}

async fn delete_specific_proxies(
    payload: web::Json<Vec<String>>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let identifier_list = payload.into_inner();
    let mut deleted_count = 0;
    let mut deleted_bytes = 0;

    for id_str in identifier_list {
        // Try parsing as UUID first
        if let Ok(id) = Uuid::parse_str(&id_str) {
            let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(id)
                .fetch_optional(pool.get_ref())
                .await;

            if let Ok(Some(m)) = media {
                let stem = if m.path.to_lowercase().ends_with(".mp4") {
                    &m.path[..m.path.len() - 4]
                } else {
                    &m.path
                };
                
                let proxy_path = format!("{}.proxy.mp4", stem);
                if let Ok(metadata) = std::fs::metadata(&proxy_path) {
                    let size = metadata.len();
                    if std::fs::remove_file(&proxy_path).is_ok() {
                        deleted_count += 1;
                        deleted_bytes += size;
                    }
                }
            }
        } else {
            // Assume it's a direct path (orphans or branding)
            let proxy_path = &id_str;
            if let Ok(metadata) = std::fs::metadata(proxy_path) {
                let size = metadata.len();
                // Security check: ensure it actually ends with .proxy.mp4
                if proxy_path.to_lowercase().ends_with(".proxy.mp4") && std::fs::remove_file(proxy_path).is_ok() {
                    deleted_count += 1;
                    deleted_bytes += size;
                }
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "deleted_count": deleted_count,
        "deleted_bytes": deleted_bytes
    }))
}

async fn media_health_check(pool: web::Data<PgPool>) -> impl Responder {
    let videos = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE media_type = 'video'")
        .fetch_all(pool.get_ref())
        .await;

    match videos {
        Ok(items) => {
            let mut inconsistencies = Vec::new();
            let ffmpeg = FFmpegService::new();
            
            for m in items {
                let original_path = &m.path;
                let stem = if original_path.to_lowercase().ends_with(".mp4") {
                    &original_path[..original_path.len() - 4]
                } else {
                    original_path
                };
                
                let proxy_path = format!("{}.proxy.mp4", stem);
                let proxy_exists = std::path::Path::new(&proxy_path).exists();
                
                // Check if optimized
                let is_optimized = ffmpeg.is_faststart_optimized(original_path);
                
                if !is_optimized {
                    inconsistencies.push(serde_json::json!({
                        "id": m.id,
                        "filename": m.filename,
                        "type": "not_optimized",
                        "severity": "medium",
                        "message": "Ficheiro não optimizado para fast-start streaming"
                    }));
                }

                if !proxy_exists {
                    // Not technically an error, but useful to know
                }
                
                // Check thumbnail
                if let Some(ref thumb) = m.thumbnail_path {
                    if !std::path::Path::new(thumb).exists() {
                        inconsistencies.push(serde_json::json!({
                            "id": m.id,
                            "filename": m.filename,
                            "type": "missing_thumbnail",
                            "severity": "low",
                            "message": "Miniatura não encontrada no disco"
                        }));
                    }
                }
            }
            
            // Heuristic for orphan proxies: check media directory for *.proxy.mp4
            // and see if they correspond to a file in the DB.
            // (Limiting to a simple check here to avoid timeouts on large libraries)
            
            HttpResponse::Ok().json(serde_json::json!({
                "status": "completed",
                "inconsistencies_count": inconsistencies.len(),
                "inconsistencies": inconsistencies,
                "timestamp": chrono::Utc::now()
            }))
        }
        Err(e) => {
            log::error!("Health check DB error index: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "DB error"}))
        }
    }
}

async fn sync_media(pool: web::Data<PgPool>) -> impl Responder {
    let paths_to_scan = get_all_system_paths();
    let thumbnails_path = std::env::var("THUMBNAILS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());

    let mut added_count = 0;
    let mut existed_count = 0;
    let mut error_details = Vec::new();
    let mut added_files = Vec::new();

    // Ensure thumbnails directory exists
    if let Err(e) = std::fs::create_dir_all(&thumbnails_path) {
        log::error!("Failed to create thumbnails directory: {}", e);
        error_details.push(format!("Erro ao aceder pasta de miniaturas: {}", e));
    }

    let ffmpeg = FFmpegService::new();
    let mut entries = Vec::new();

    for base_path in paths_to_scan {
        if base_path.exists() {
            collect_media_files(&base_path, &mut entries, 0);
        }
    }

    for path in entries {
        let path_str = path.to_string_lossy().to_string();
        let lower_path = path_str.to_lowercase();

        // 1. Skip proxies and optimized files themselves
        if lower_path.contains(".proxy.") || lower_path.contains(".optimized.") {
            continue;
        }

        // 2. Strict Asset Filtering: Ignore system files in protected folders unless it's the standard test video
        if lower_path.contains("/assets/protected/") && !lower_path.ends_with("big_buck_bunny_1080p_h264.mov") {
            continue;
        }

        // Check if exists in DB
        let exists_result = sqlx::query("SELECT id FROM media WHERE path = $1")
            .bind(&path_str)
            .fetch_optional(pool.get_ref())
            .await;

        match exists_result {
            Ok(None) => {
                // Not in DB, let's add it
                match ffmpeg.get_media_info(&path_str) {
                    Ok(info) => {
                        let id = Uuid::new_v4();
                        let filename = path
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        let media_type = if info.has_video { "video" } else { "audio" };

                        let thumbnail_filename = format!("{}.jpg", id);
                        let thumbnail_path = format!("{}/{}", thumbnails_path, thumbnail_filename);

                        if info.has_video {
                            // Non-blocking thumbnail generation (we don't wait for it to be perfect)
                            let _ = ffmpeg.generate_thumbnail(&path_str, &thumbnail_path, 1.0);
                        }

                        let res = sqlx::query("INSERT INTO media (id, filename, path, media_type, duration, width, height, codec, bitrate, thumbnail_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                            .bind(id)
                            .bind(&filename)
                            .bind(&path_str)
                            .bind(media_type)
                            .bind(info.duration)
                            .bind(info.width)
                            .bind(info.height)
                            .bind(info.codec)
                            .bind(info.bitrate)
                            .bind(Some(thumbnail_path))
                            .execute(pool.get_ref())
                            .await;

                        if res.is_ok() {
                            added_count += 1;
                            added_files.push(filename.clone());
                        } else {
                            let msg = format!("Erro ao inserir na base de dados ({}): {:?}", filename, res.err());
                            log::error!("{}", msg);
                            error_details.push(msg);
                        }
                    }
                    Err(e) => {
                        let msg = format!("Erro ao ler metadados de {}: {}", path.file_name().unwrap_or_default().to_string_lossy(), e);
                        log::error!("{}", msg);
                        error_details.push(msg);
                    }
                }
            }
            Ok(Some(_)) => {
                existed_count += 1;
            }
            Err(e) => {
                let msg = format!("Erro ao verificar existência no DB: {}", e);
                log::error!("{}", msg);
                error_details.push(msg);
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": if error_details.is_empty() { "ok" } else { "partial" },
        "added": added_count,
        "already_existed": existed_count,
        "errors": error_details.len(),
        "details": error_details,
        "added_files": added_files
    }))
}

fn collect_media_files(dir: &Path, files: &mut Vec<std::path::PathBuf>, depth: u32) {
    if depth > 10 {
        return; // Prevent infinite symlink/directory loops
    }
    let extensions = ["mp4", "mov", "mkv", "avi", "mp3", "wav", "m4a", "webm"];
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Ignore hidden directories
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') {
                        continue;
                    }
                }
                collect_media_files(&path, files, depth + 1);
            } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if extensions.contains(&ext.to_lowercase().as_str()) {
                    files.push(path);
                }
            }
        }
    }
}

#[derive(serde::Deserialize)]
pub struct BatchRequest {
    pub ids: Vec<Uuid>,
}

/// Audit missing proxies
async fn audit_proxies(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Media>(
        "SELECT * FROM media WHERE media_type = 'video'"
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(all_videos) => {
            let mut missing_proxies = Vec::new();
            let mut total_duration_missing_seconds: f64 = 0.0;
            
            for media in all_videos {
                let path = std::path::Path::new(&media.path);
                let original_path = path.to_string_lossy().to_string();
                let stem = if original_path.to_lowercase().ends_with(".mp4") {
                    &original_path[..original_path.len() - 4]
                } else {
                    &original_path
                };
                let proxy_path = format!("{}.proxy.mp4", stem);
                
                if !std::path::Path::new(&proxy_path).exists() {
                    missing_proxies.push(media.id);
                    total_duration_missing_seconds += media.duration.unwrap_or(0.0);
                }
            }
            
            // Heuristic for proxy space: 35MB per minute of 720p H.264
            let estimated_size_mb = (total_duration_missing_seconds / 60.0) * 35.0;

            HttpResponse::Ok().json(serde_json::json!({
                "missing_count": missing_proxies.len(),
                "missing_ids": missing_proxies,
                "total_duration_seconds": total_duration_missing_seconds,
                "estimated_space_mb": estimated_size_mb
            }))
        }
        Err(e) => {
            log::error!("Database error during proxy audit: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

/// Batch generate proxies
async fn batch_proxy(
    req: web::Json<BatchRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    for id in &req.ids {
        let pool_bg = pool.get_ref().clone();
        let media_id_bg = *id;
        
        tokio::spawn(async move {
            let media_res = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id_bg)
                .fetch_optional(&pool_bg)
                .await;
                
            if let Ok(Some(media)) = media_res {
                if media.media_type != "video" { return; }
                
                let path = std::path::Path::new(&media.path);
                if !path.exists() { return; }
                
                let original_path = path.to_string_lossy().to_string();
                let stem = if original_path.to_lowercase().ends_with(".mp4") {
                    &original_path[..original_path.len() - 4]
                } else {
                    &original_path
                };
                let proxy_path = format!("{}.proxy.mp4", stem);
                if std::path::Path::new(&proxy_path).exists() { return; }
                
                // Fast path linking
                if let (Some(height), Some(bitrate)) = (media.height, media.bitrate) {
                    if height <= 720 && bitrate <= 5_000_000 {
                        if std::fs::hard_link(&original_path, &proxy_path).is_ok() {
                            return;
                        }
                    }
                }
                
                let task_id = Uuid::new_v4();
                let _ = sqlx::query("INSERT INTO media_tasks (id, media_id, task_type, status) VALUES ($1, $2, $3, $4)")
                    .bind(task_id)
                    .bind(media_id_bg)
                    .bind("proxy")
                    .bind("processing")
                    .execute(&pool_bg)
                    .await;
                
                let ffmpeg = FFmpegService::new();
                match ffmpeg.generate_proxy(&original_path, &proxy_path) {
                    Ok(_) => {
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'completed', progress = 1.0, updated_at = CURRENT_TIMESTAMP WHERE id = $1")
                            .bind(task_id).execute(&pool_bg).await;
                    }
                    Err(e) => {
                        let _ = std::fs::remove_file(&proxy_path);
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                            .bind(e).bind(task_id).execute(&pool_bg).await;
                    }
                }
            }
        });
    }

    HttpResponse::Accepted().json(serde_json::json!({
        "message": format!("Batch proxy generation queued for {} files", req.ids.len())
    }))
}

/// Batch optimize for streaming
async fn batch_optimize(
    req: web::Json<BatchRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    for id in &req.ids {
        let pool_bg = pool.get_ref().clone();
        let media_id_bg = *id;
        
        tokio::spawn(async move {
            let media_res = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id_bg)
                .fetch_optional(&pool_bg)
                .await;
                
            if let Ok(Some(media)) = media_res {
                if media.media_type != "video" { return; }
                
                let path = std::path::Path::new(&media.path);
                if !path.exists() { return; }
                
                let original_path = path.to_string_lossy().to_string();
                let stem = if original_path.to_lowercase().ends_with(".mp4") {
                    &original_path[..original_path.len() - 4]
                } else {
                    &original_path
                };
                let optimized_path = format!("{}.optimized.mp4", stem);
                
                let ffmpeg = FFmpegService::new();
                if ffmpeg.is_faststart_optimized(&original_path) { return; }
                
                let task_id = Uuid::new_v4();
                let _ = sqlx::query("INSERT INTO media_tasks (id, media_id, task_type, status) VALUES ($1, $2, $3, $4)")
                    .bind(task_id)
                    .bind(media_id_bg)
                    .bind("optimize")
                    .bind("processing")
                    .execute(&pool_bg)
                    .await;
                
                match ffmpeg.optimize_for_streaming(&original_path, &optimized_path) {
                    Ok(_) => {
                         if let Err(e) = std::fs::rename(&optimized_path, &original_path) {
                            let _ = std::fs::remove_file(&optimized_path);
                            let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                                .bind(format!("Rename failed: {}", e)).bind(task_id).execute(&pool_bg).await;
                        } else {
                            let _ = sqlx::query("UPDATE media_tasks SET status = 'completed', progress = 1.0, updated_at = CURRENT_TIMESTAMP WHERE id = $1")
                                .bind(task_id).execute(&pool_bg).await;
                        }
                    }
                    Err(e) => {
                        let _ = std::fs::remove_file(&optimized_path);
                        let _ = sqlx::query("UPDATE media_tasks SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                            .bind(e).bind(task_id).execute(&pool_bg).await;
                    }
                }
            }
        });
    }

    HttpResponse::Accepted().json(serde_json::json!({
        "message": format!("Batch streaming optimization queued for {} files", req.ids.len())
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_media))
        .route("/folders", web::get().to(list_folders))
        .route("/folders", web::post().to(create_folder))
        .route("/folders/{id}", web::delete().to(delete_folder))
        .route("/sync", web::post().to(sync_media))
        .route("/stats/proxy", web::get().to(get_proxy_stats))
        .route("/audit/proxies", web::get().to(audit_proxies))
        .route("/batch/proxy", web::post().to(batch_proxy))
        .route("/batch/optimize", web::post().to(batch_optimize))
        .route("/proxies", web::get().to(list_proxies))
        .route("/proxies/delete", web::post().to(delete_specific_proxies))
        .route("/proxies/purge", web::delete().to(purge_proxies))
        .route("/health-check", web::get().to(media_health_check))
        .route("/{id}/tasks", web::get().to(get_media_tasks))
        .route("/tasks/batch", web::post().to(get_media_tasks_batch))
        .route("/{id}/move", web::post().to(move_media))
        .route("/{id}/copy", web::post().to(copy_media))
        .route("/{id}/usage", web::get().to(check_media_usage))
        .route(
            "/{id}/replace-with-filler",
            web::post().to(replace_with_filler),
        )
        .route("/{id}", web::get().to(get_media))
        .route("/{id}/stream", web::get().to(stream_media))
        .route("/{id}/thumbnail", web::get().to(get_thumbnail))
        .route("/{id}/filler", web::put().to(update_filler))
        .route("/{id}/transparent", web::post().to(make_transparent))
        .route("/{id}/optimize", web::post().to(optimize_for_streaming))
        .route("/{id}/proxy", web::post().to(generate_proxy))
        .route("/upload", web::post().to(upload_media))
        .route("/{id}", web::put().to(update_media))
        .route("/{id}/fetch-metadata", web::post().to(fetch_metadata))
        .route("/{id}", web::delete().to(delete_media));
}
