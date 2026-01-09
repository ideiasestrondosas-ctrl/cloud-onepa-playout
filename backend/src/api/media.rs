use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use futures_util::StreamExt;
use sqlx::PgPool;
use std::env;
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

use crate::models::media::{CreateMedia, Media};
use crate::services::ffmpeg::FFmpegService;

#[derive(serde::Deserialize)]
pub struct MediaQuery {
    pub media_type: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

async fn list_media(query: web::Query<MediaQuery>, pool: web::Data<PgPool>) -> impl Responder {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    let mut sql = String::from("SELECT * FROM media WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) FROM media WHERE 1=1");

    // Filter by media type
    if let Some(ref media_type) = query.media_type {
        sql.push_str(&format!(" AND media_type = '{}'", media_type));
        count_sql.push_str(&format!(" AND media_type = '{}'", media_type));
    }

    // Search by filename
    if let Some(ref search) = query.search {
        sql.push_str(&format!(" AND filename ILIKE '%{}%'", search));
        count_sql.push_str(&format!(" AND filename ILIKE '%{}%'", search));
    }

    sql.push_str(" ORDER BY created_at DESC");
    sql.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let media_result = sqlx::query_as::<_, Media>(&sql)
        .fetch_all(pool.get_ref())
        .await;

    let total_result: Result<(i64,), _> =
        sqlx::query_as(&count_sql).fetch_one(pool.get_ref()).await;

    match (media_result, total_result) {
        (Ok(media), Ok((total,))) => HttpResponse::Ok().json(serde_json::json!({
            "media": media,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total as f64 / limit as f64).ceil() as i64
        })),
        _ => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch media"})),
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

async fn upload_media(mut payload: Multipart, pool: web::Data<PgPool>) -> impl Responder {
    let media_path =
        env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
    let thumbnails_path = env::var("THUMBNAILS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());

    // Create directories if they don't exist
    std::fs::create_dir_all(&media_path).ok();
    std::fs::create_dir_all(&thumbnails_path).ok();

    let mut uploaded_files = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(_) => continue,
        };

        let content_disposition = field.content_disposition();
        let filename = content_disposition
            .get_filename()
            .unwrap_or("unknown")
            .to_string();

        let file_id = Uuid::new_v4();
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("bin");

        let new_filename = format!("{}.{}", file_id, file_extension);
        let filepath = format!("{}/{}", media_path, new_filename);

        // Write file to disk
        let mut file = match std::fs::File::create(&filepath) {
            Ok(file) => file,
            Err(_) => {
                return HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to create file"}));
            }
        };

        while let Some(chunk) = field.next().await {
            let data = match chunk {
                Ok(data) => data,
                Err(_) => continue,
            };
            file.write_all(&data).ok();
        }

        // Get media info using FFmpeg
        let ffmpeg = FFmpegService::new();
        let media_info = match ffmpeg.get_media_info(&filepath) {
            Ok(info) => info,
            Err(e) => {
                log::error!("Failed to get media info: {}", e);
                std::fs::remove_file(&filepath).ok();
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Invalid media file"}));
            }
        };

        // Determine media type
        let media_type = if media_info.has_video {
            "video"
        } else if media_info.has_audio {
            "audio"
        } else {
            // Check if it's an image
            let ext_lower = file_extension.to_lowercase();
            if ["jpg", "jpeg", "png", "gif", "webp"].contains(&ext_lower.as_str()) {
                "image"
            } else {
                "unknown"
            }
        };

        // Generate thumbnail for videos
        let thumbnail_path = if media_type == "video" {
            let thumb_filename = format!("{}.jpg", file_id);
            let thumb_path = format!("{}/{}", thumbnails_path, thumb_filename);

            match ffmpeg.generate_thumbnail(&filepath, &thumb_path, 1.0) {
                Ok(_) => Some(thumb_path),
                Err(e) => {
                    log::warn!("Failed to generate thumbnail: {}", e);
                    None
                }
            }
        } else {
            None
        };

        // Insert into database
        let result = sqlx::query_as::<_, Media>(
            "INSERT INTO media (filename, path, media_type, duration, width, height, codec, bitrate, thumbnail_path) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *"
        )
        .bind(&filename)
        .bind(&filepath)
        .bind(media_type)
        .bind(media_info.duration)
        .bind(media_info.width)
        .bind(media_info.height)
        .bind(media_info.codec)
        .bind(media_info.bitrate)
        .bind(thumbnail_path)
        .fetch_one(pool.get_ref())
        .await;

        match result {
            Ok(media) => uploaded_files.push(media),
            Err(e) => {
                log::error!("Failed to insert media: {}", e);
                std::fs::remove_file(&filepath).ok();
            }
        }
    }

    if uploaded_files.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "No files uploaded"}));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Files uploaded successfully",
        "files": uploaded_files
    }))
}

async fn delete_media(media_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    // Get media info first
    let media_result = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id.as_ref())
        .fetch_optional(pool.get_ref())
        .await;

    let media = match media_result {
        Ok(Some(m)) => m,
        Ok(None) => {
            return HttpResponse::NotFound().json(serde_json::json!({"error": "Media not found"}))
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}))
        }
    };

    // Delete from database
    let delete_result = sqlx::query("DELETE FROM media WHERE id = $1")
        .bind(media_id.into_inner())
        .execute(pool.get_ref())
        .await;

    if delete_result.is_err() {
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to delete media"}));
    }

    // Delete files from disk
    std::fs::remove_file(&media.path).ok();
    if let Some(thumb_path) = media.thumbnail_path {
        std::fs::remove_file(&thumb_path).ok();
    }

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Media deleted successfully"
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_media))
        .route("/{id}", web::get().to(get_media))
        .route("/upload", web::post().to(upload_media))
        .route("/{id}", web::delete().to(delete_media));
}
