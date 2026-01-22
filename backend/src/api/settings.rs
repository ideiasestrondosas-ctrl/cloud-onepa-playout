use crate::models::settings::{Settings, UpdateSettingsRequest};
use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use futures::TryStreamExt;
use sqlx::{PgPool, Row};
use std::io::Write;
use std::path::Path;

async fn get_settings(pool: web::Data<PgPool>) -> impl Responder {
    let assets_path = std::env::var("ASSETS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());
    let protected_path = format!("{}/protected", assets_path);
    let docs_path = std::env::var("DOCS_PATH").unwrap_or_else(|_| "/app/docs".to_string());

    let result = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(mut settings)) => {
            settings.protected_path = Some(protected_path.clone());
            settings.docs_path = Some(docs_path.clone());
            HttpResponse::Ok().json(settings)
        }
        Ok(None) => {
            // Insert default settings
            let _ = sqlx::query(
                "INSERT INTO settings (id, output_url) VALUES (TRUE, 'rtmp://localhost:1935/stream')"
            )
            .execute(pool.get_ref())
            .await;

            // Return default structure (or re-fetch)
            HttpResponse::Ok().json(Settings {
                id: true,
                output_type: "rtmp".to_string(),
                output_url: "rtmp://localhost:1935/stream".to_string(),
                resolution: "1920x1080".to_string(),
                fps: "30".to_string(),
                video_bitrate: "5000".to_string(),
                audio_bitrate: "192".to_string(),
                media_path: std::env::var("MEDIA_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string()),
                thumbnails_path: std::env::var("THUMBNAILS_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string()),
                playlists_path: std::env::var("PLAYLISTS_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/playlists".to_string()),
                fillers_path: std::env::var("FILLERS_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/fillers".to_string()),
                logo_path: None,
                logo_position: Some("top-left".to_string()),
                day_start: Some("06:00:00".to_string()),
                default_image_path: Some("".to_string()),
                default_video_path: Some("".to_string()),
                is_running: false,
                last_error: None,
                overlay_enabled: true,
                app_logo_path: None,
                channel_name: Some("Cloud Onepa".to_string()),
                clips_played_today: Some(0),
                overlay_opacity: Some(0.4),
                overlay_scale: Some(0.2),
                srt_mode: Some("caller".to_string()),
                updated_at: chrono::Utc::now(),
                system_version: Some("1.9.4-PRO".to_string()),
                release_date: Some("2026-01-16".to_string()),
                protected_path: Some(protected_path),
                docs_path: Some(docs_path),
                rtmp_enabled: false,
                hls_enabled: false,
                srt_enabled: false,
                udp_enabled: false,
                rtmp_output_url: Some(format!(
                    "rtmp://{}:1935/live/stream",
                    std::env::var("MEDIAMTX_HOST").unwrap_or_else(|_| "localhost".to_string())
                )),
                srt_output_url: Some(format!(
                    "srt://{}:8890?mode=caller&streamid=publish:live/stream",
                    std::env::var("MEDIAMTX_HOST").unwrap_or_else(|_| "localhost".to_string())
                )),
                udp_output_url: Some("udp://@239.0.0.1:1234".to_string()),
                udp_mode: Some("multicast".to_string()),
                auto_start_protocols: true,
                video_codec: "copy".to_string(),
                audio_codec: "copy".to_string(),
                dash_enabled: false,
                mss_enabled: false,
                rist_enabled: false,
                rtsp_enabled: false,
                webrtc_enabled: false,
                llhls_enabled: false,
                dash_output_url: Some("/var/lib/onepa-playout/hls/dash.mpd".to_string()),
                mss_output_url: Some("/var/lib/onepa-playout/hls/stream.ism".to_string()),
                rist_output_url: Some("rist://127.0.0.1:1234".to_string()),
                rtsp_output_url: Some("rtsp://localhost:8554/live/stream".to_string()),
                webrtc_output_url: Some("http://localhost:8889/live/stream".to_string()),
                epg_days: Some(7),
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
    if let Some(ref channel_name) = req.channel_name {
        sql.push_str(&format!(", channel_name = '{}'", channel_name));
    }
    if let Some(ref default_image_path) = req.default_image_path {
        if default_image_path.is_empty() || default_image_path == "null" {
            sql.push_str(", default_image_path = NULL");
        } else {
            sql.push_str(&format!(", default_image_path = '{}'", default_image_path));
        }
    }
    if let Some(ref default_video_path) = req.default_video_path {
        if default_video_path.is_empty() || default_video_path == "null" {
            sql.push_str(", default_video_path = NULL");
        } else {
            sql.push_str(&format!(", default_video_path = '{}'", default_video_path));
        }
    }
    if let Some(clips_played_today) = req.clips_played_today {
        sql.push_str(&format!(", clips_played_today = {}", clips_played_today));
    }
    if let Some(overlay_opacity) = req.overlay_opacity {
        sql.push_str(&format!(", overlay_opacity = {}", overlay_opacity));
    }
    if let Some(overlay_scale) = req.overlay_scale {
        sql.push_str(&format!(", overlay_scale = {}", overlay_scale));
    }
    if let Some(ref srt_mode) = req.srt_mode {
        sql.push_str(&format!(", srt_mode = '{}'", srt_mode));
    }
    if let Some(ref system_version) = req.system_version {
        sql.push_str(&format!(", system_version = '{}'", system_version));
    }
    if let Some(ref release_date) = req.release_date {
        sql.push_str(&format!(", release_date = '{}'", release_date));
    }
    if let Some(overlay_enabled) = req.overlay_enabled {
        sql.push_str(&format!(", overlay_enabled = {}", overlay_enabled));
    }
    if let Some(ref app_logo_path) = req.app_logo_path {
        sql.push_str(&format!(", app_logo_path = '{}'", app_logo_path));
    }

    // Multi-protocol settings
    if let Some(enabled) = req.rtmp_enabled {
        sql.push_str(&format!(", rtmp_enabled = {}", enabled));
    }
    if let Some(enabled) = req.hls_enabled {
        sql.push_str(&format!(", hls_enabled = {}", enabled));
    }
    if let Some(enabled) = req.srt_enabled {
        sql.push_str(&format!(", srt_enabled = {}", enabled));
    }
    if let Some(enabled) = req.udp_enabled {
        sql.push_str(&format!(", udp_enabled = {}", enabled));
    }
    if let Some(ref url) = req.rtmp_output_url {
        sql.push_str(&format!(", rtmp_output_url = '{}'", url));
    }
    if let Some(ref url) = req.srt_output_url {
        sql.push_str(&format!(", srt_output_url = '{}'", url));
    }
    if let Some(ref url) = req.udp_output_url {
        sql.push_str(&format!(", udp_output_url = '{}'", url));
    }
    if let Some(ref mode) = req.udp_mode {
        sql.push_str(&format!(", udp_mode = '{}'", mode));
    }
    if let Some(auto_start) = req.auto_start_protocols {
        sql.push_str(&format!(", auto_start_protocols = {}", auto_start));
    }
    if let Some(ref vc) = req.video_codec {
        sql.push_str(&format!(", video_codec = '{}'", vc));
    }
    if let Some(ref ac) = req.audio_codec {
        sql.push_str(&format!(", audio_codec = '{}'", ac));
    }
    if let Some(enabled) = req.dash_enabled {
        sql.push_str(&format!(", dash_enabled = {}", enabled));
    }
    if let Some(enabled) = req.mss_enabled {
        sql.push_str(&format!(", mss_enabled = {}", enabled));
    }
    if let Some(enabled) = req.rist_enabled {
        sql.push_str(&format!(", rist_enabled = {}", enabled));
    }
    if let Some(enabled) = req.rtsp_enabled {
        sql.push_str(&format!(", rtsp_enabled = {}", enabled));
    }
    if let Some(enabled) = req.webrtc_enabled {
        sql.push_str(&format!(", webrtc_enabled = {}", enabled));
    }
    if let Some(enabled) = req.llhls_enabled {
        sql.push_str(&format!(", llhls_enabled = {}", enabled));
    }
    if let Some(ref url) = req.dash_output_url {
        sql.push_str(&format!(", dash_output_url = '{}'", url));
    }
    if let Some(ref url) = req.mss_output_url {
        sql.push_str(&format!(", mss_output_url = '{}'", url));
    }
    if let Some(ref url) = req.rist_output_url {
        sql.push_str(&format!(", rist_output_url = '{}'", url));
    }
    if let Some(ref url) = req.rtsp_output_url {
        sql.push_str(&format!(", rtsp_output_url = '{}'", url));
    }
    if let Some(ref url) = req.webrtc_output_url {
        sql.push_str(&format!(", webrtc_output_url = '{}'", url));
    }
    if let Some(epg_days) = req.epg_days {
        sql.push_str(&format!(", epg_days = {}", epg_days));
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

async fn upload_app_logo(mut payload: Multipart, pool: web::Data<PgPool>) -> impl Responder {
    let mut filepath = String::new();

    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name().unwrap_or("");

        if field_name == "file" {
            let original_filename = content_disposition.get_filename().unwrap_or("app_logo.png");
            let filename = format!(
                "app_{}_{}",
                chrono::Utc::now().timestamp(),
                original_filename
            );

            // We'll save it in the media directory for now or a dedicated logo dir
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

    // Update app_logo_path in settings
    let result = sqlx::query("UPDATE settings SET app_logo_path = $1 WHERE id = TRUE")
        .bind(&filepath)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "message": "App Logo uploaded successfully",
            "path": filepath
        })),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update app logo path in settings"})),
    }
}

async fn upload_overlay_pair(mut payload: Multipart, pool: web::Data<PgPool>) -> impl Responder {
    let mut original_path = String::new();
    let mut converted_path = String::new();
    let upload_dir = "/var/lib/onepa-playout/media";
    let timestamp = chrono::Utc::now().timestamp();

    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let name = content_disposition.get_name().unwrap_or("");
        let filename = content_disposition.get_filename().unwrap_or("image.png");

        let dest_path = if name == "original" {
            let path = format!("{}/{}_orig_{}", upload_dir, timestamp, filename);
            original_path = path.clone();
            path
        } else if name == "converted" {
            let path = format!("{}/{}_conv_{}", upload_dir, timestamp, filename);
            converted_path = path.clone();
            path
        } else {
            continue;
        };

        let mut f = match std::fs::File::create(&dest_path) {
            Ok(f) => f,
            Err(e) => {
                return HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": format!("Failed to create file: {}", e)}))
            }
        };

        while let Ok(Some(chunk)) = field.try_next().await {
            f.write_all(&chunk).unwrap();
        }
    }

    if converted_path.is_empty() {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Converted file is missing"}));
    }

    // Update settings with the converted path
    let result = sqlx::query("UPDATE settings SET logo_path = $1 WHERE id = TRUE")
        .bind(&converted_path)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "message": "Overlay pair uploaded successfully",
            "original_path": original_path,
            "converted_path": converted_path
        })),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update logo path in settings"})),
    }
}

async fn get_app_logo(pool: web::Data<PgPool>, req: HttpRequest) -> impl Responder {
    let result = sqlx::query("SELECT app_logo_path FROM settings WHERE id = TRUE")
        .fetch_one(pool.get_ref())
        .await;

    match result {
        Ok(row) => {
            let path_str: String = row.try_get("app_logo_path").unwrap_or_default();
            if path_str.is_empty() {
                // If no custom logo, we can redirect or return 404. Let's return 404 so caller uses default.
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "App Logo not set"}));
            }
            let path = Path::new(&path_str);
            if !path.exists() {
                return HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "App Logo file not found"}));
            }
            match NamedFile::open_async(path).await {
                Ok(named_file) => named_file.into_response(&req),
                Err(_) => HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to open app logo"})),
            }
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch app logo path"})),
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

async fn reset_all(pool: web::Data<PgPool>) -> impl Responder {
    log::info!("Starting factory reset...");

    // Truncate playlists and schedule
    if let Err(e) = sqlx::query("TRUNCATE TABLE playlists CASCADE")
        .execute(pool.get_ref())
        .await
    {
        log::error!("Failed to truncate playlists: {}", e);
    }
    if let Err(e) = sqlx::query("TRUNCATE TABLE schedule CASCADE")
        .execute(pool.get_ref())
        .await
    {
        log::error!("Failed to truncate schedule: {}", e);
    }

    // Reset settings to defaults
    let result = sqlx::query(
        "UPDATE settings SET 
        output_type = 'rtmp', 
        output_url = 'rtmp://localhost:1935/stream', 
        resolution = '1920x1080', 
        fps = '25', 
        video_bitrate = '5000k', 
        audio_bitrate = '192k',
        is_running = false,
        overlay_enabled = true,
        clips_played_today = 0,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = TRUE",
    )
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Factory reset complete"})),
        Err(e) => {
            log::error!("Failed to reset settings: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to reset settings"}))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_settings))
        .route("", web::put().to(update_settings))
        .route("/logo", web::get().to(get_logo))
        .route("/upload-logo", web::post().to(upload_logo))
        .route("/app-logo", web::get().to(get_app_logo))
        .route("/upload-app-logo", web::post().to(upload_app_logo))
        .route("/upload-overlay-pair", web::post().to(upload_overlay_pair))
        .route("/reset-all", web::post().to(reset_all));
}
