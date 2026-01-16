use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use futures_util::StreamExt;
use sqlx::{PgPool, Row};
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

use crate::models::media::{CreateFolder, Folder, Media};
use crate::services::ffmpeg::FFmpegService;

#[derive(serde::Deserialize)]
pub struct MediaQuery {
    pub media_type: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub is_filler: Option<bool>,
    pub folder_id: Option<String>,
}

async fn list_media(query: web::Query<MediaQuery>, pool: web::Data<PgPool>) -> impl Responder {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
        sqlx::QueryBuilder::new("SELECT * FROM media WHERE 1=1");

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

    let count_query = "SELECT COUNT(*) FROM media WHERE 1=1";
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
        Ok(media) => HttpResponse::Ok().json(serde_json::json!({
            "media": media,
            "total": total.0,
            "page": page,
            "limit": limit,
            "pages": (total.0 as f64 / limit as f64).ceil() as i64
        })),
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
        let thumb_url = format!("/api/media/{}/thumbnail", id);

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

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Media deleted successfully"
    }))
}

async fn stream_media(
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
            let path = std::path::Path::new(&media.path);

            // Security check: ensure path is within MEDIA_PATH or ASSETS_PATH
            let media_dir = std::env::var("MEDIA_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
            let assets_dir = std::env::var("ASSETS_PATH")
                .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

            if !path.starts_with(&media_dir) && !path.starts_with(&assets_dir) {
                log::warn!("Unauthorized access attempt to path: {:?}", path);
                return HttpResponse::Forbidden()
                    .json(serde_json::json!({"error": "Unauthorized path"}));
            }

            if !path.exists() {
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "File not found on disk"}));
            }
            match NamedFile::open_async(path).await {
                Ok(named_file) => named_file.into_response(&req),
                Err(_) => HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to open file"})),
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"})),
        Err(_) => {
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

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_media))
        .route("/folders", web::get().to(list_folders))
        .route("/folders", web::post().to(create_folder))
        .route("/folders/{id}", web::delete().to(delete_folder))
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
        .route("/upload", web::post().to(upload_media))
        .route("/{id}", web::delete().to(delete_media));
}
