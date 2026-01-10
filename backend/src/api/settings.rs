use crate::models::settings::{Settings, UpdateSettingsRequest};
use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use futures::TryStreamExt;
use sqlx::{PgPool, Row};
use std::io::Write;
use std::path::Path;

async fn get_settings(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(settings)) => HttpResponse::Ok().json(settings),
        Ok(None) => {
            // Insert default settings
            let _ = sqlx::query(
                "INSERT INTO settings (id, output_url) VALUES (TRUE, 'rtmp://localhost/live/stream')"
            )
            .execute(pool.get_ref())
            .await;

            // Return default structure (or re-fetch)
            HttpResponse::Ok().json(Settings {
                id: true,
                output_type: "rtmp".to_string(),
                output_url: "rtmp://localhost/live/stream".to_string(),
                resolution: "1920x1080".to_string(),
                fps: "30".to_string(),
                video_bitrate: "5000".to_string(),
                audio_bitrate: "192".to_string(),
                media_path: "/var/lib/onepa-playout/media".to_string(),
                thumbnails_path: "/var/lib/onepa-playout/thumbnails".to_string(),
                playlists_path: "/var/lib/onepa-playout/playlists".to_string(),
                fillers_path: "/var/lib/onepa-playout/fillers".to_string(),
                logo_path: None,
                logo_position: Some("top-left".to_string()),
                day_start: Some("06:00:00".to_string()),
                is_running: false,
                last_error: None,
                updated_at: chrono::Utc::now(),
                // Add any other missing fields here with default values if necessary
                // For example, if `stream_key` was added to Settings:
                // stream_key: None,
            })
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch settings"})),
    }
}

async fn update_settings(
    req: web::Json<UpdateSettingsRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let mut sql = String::from("UPDATE settings SET updated_at = CURRENT_TIMESTAMP");

    if let Some(ref output_type) = req.output_type {
        sql.push_str(&format!(", output_type = '{}'", output_type));
    }
    if let Some(ref output_url) = req.output_url {
        sql.push_str(&format!(", output_url = '{}'", output_url));
    }
    if let Some(ref resolution) = req.resolution {
        sql.push_str(&format!(", resolution = '{}'", resolution));
    }
    if let Some(ref fps) = req.fps {
        sql.push_str(&format!(", fps = '{}'", fps));
    }
    if let Some(ref video_bitrate) = req.video_bitrate {
        sql.push_str(&format!(", video_bitrate = '{}'", video_bitrate));
    }
    if let Some(ref audio_bitrate) = req.audio_bitrate {
        sql.push_str(&format!(", audio_bitrate = '{}'", audio_bitrate));
    }
    if let Some(ref media_path) = req.media_path {
        sql.push_str(&format!(", media_path = '{}'", media_path));
    }
    if let Some(ref thumbnails_path) = req.thumbnails_path {
        sql.push_str(&format!(", thumbnails_path = '{}'", thumbnails_path));
    }
    if let Some(ref playlists_path) = req.playlists_path {
        sql.push_str(&format!(", playlists_path = '{}'", playlists_path));
    }
    if let Some(ref fillers_path) = req.fillers_path {
        sql.push_str(&format!(", fillers_path = '{}'", fillers_path));
    }
    if let Some(ref logo_path) = req.logo_path {
        sql.push_str(&format!(", logo_path = '{}'", logo_path));
    }
    if let Some(ref logo_position) = req.logo_position {
        sql.push_str(&format!(", logo_position = '{}'", logo_position));
    }
    if let Some(ref day_start) = req.day_start {
        sql.push_str(&format!(", day_start = '{}'", day_start));
    }

    sql.push_str(" WHERE id = TRUE");

    let result = sqlx::query(&sql).execute(pool.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Settings updated"})),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update settings"})),
    }
}

async fn upload_logo(mut payload: Multipart, pool: web::Data<PgPool>) -> impl Responder {
    let mut filepath = String::new();

    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name().unwrap_or("");

        if field_name == "file" {
            let original_filename = content_disposition.get_filename().unwrap_or("logo.png");
            let filename = format!("{}_{}", chrono::Utc::now().timestamp(), original_filename);

            // We'll save it in the media directory for now or a dedicated logo dir
            // Let's assume /var/lib/onepa-playout/media/logos exists or just media
            let upload_dir = "/var/lib/onepa-playout/media";
            filepath = format!("{}/{}", upload_dir, filename);

            let mut f = match std::fs::File::create(&filepath) {
                Ok(f) => f,
                Err(e) => {
                    return HttpResponse::InternalServerError().json(
                        serde_json::json!({"error": format!("Failed to create file: {}", e)}),
                    )
                }
            };

            while let Ok(Some(chunk)) = field.try_next().await {
                f.write_all(&chunk).unwrap();
            }
        }
    }

    if filepath.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "No file uploaded"}));
    }

    // Update logo_path in settings
    let result = sqlx::query("UPDATE settings SET logo_path = $1 WHERE id = TRUE")
        .bind(&filepath)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "message": "Logo uploaded successfully",
            "path": filepath
        })),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update logo path in settings"})),
    }
}

async fn get_logo(pool: web::Data<PgPool>, req: HttpRequest) -> impl Responder {
    let result = sqlx::query("SELECT logo_path FROM settings WHERE id = TRUE")
        .fetch_one(pool.get_ref())
        .await;

    match result {
        Ok(row) => {
            let path_str: String = row.get("logo_path");
            if path_str.is_empty() {
                return HttpResponse::NotFound().json(serde_json::json!({"error": "Logo not set"}));
            }
            let path = Path::new(&path_str);
            if !path.exists() {
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "Logo file not found"}));
            }
            match NamedFile::open_async(path).await {
                Ok(named_file) => named_file.into_response(&req),
                Err(_) => HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to open logo"})),
            }
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch logo path"})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_settings))
        .route("", web::put().to(update_settings))
        .route("/logo", web::get().to(get_logo))
        .route("/upload-logo", web::post().to(upload_logo));
}
