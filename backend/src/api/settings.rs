use crate::models::settings::{Settings, UpdateSettingsRequest};
use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use base64::{engine::general_purpose, Engine as _};
use futures::TryStreamExt;
use reqwest::Client;
use serde::Deserialize;
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
        Ok(Some(settings)) => {
            let mut val = serde_json::to_value(&settings).unwrap();
            let obj = val.as_object_mut().unwrap();

            // Add virtual paths
            obj.insert("protected_path".to_string(), protected_path.into());
            obj.insert("docs_path".to_string(), docs_path.into());

            // Add standardized display URLs
            let host = std::env::var("SERVER_HOST").unwrap_or_else(|_| "localhost".to_string());
            let public_host = if host == "0.0.0.0" || host == "127.0.0.1" {
                "localhost".to_string()
            } else {
                host
            };
            let display_urls = settings.get_display_urls(&public_host);
            obj.insert(
                "display_urls".to_string(),
                serde_json::to_value(display_urls).unwrap(),
            );

            HttpResponse::Ok().json(val)
        }
        Ok(None) => {
            // Insert default settings
            let _ = sqlx::query(
                "INSERT INTO settings (id, output_url) VALUES (TRUE, 'rtmp://localhost:2035/stream')"
            )
            .execute(pool.get_ref())
            .await;

            // Return default structure (or re-fetch)
            HttpResponse::Ok().json(Settings {
                id: true,
                output_type: "rtmp".to_string(),
                output_url: "rtmp://localhost:2035/stream".to_string(),
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
                overlay_x: Some(50),
                overlay_y: Some(50),
                overlay_anchor: Some("top-right".to_string()),
                srt_mode: Some("caller".to_string()),
                updated_at: chrono::Utc::now(),
                system_version: Some("v2.0.1-DEBUG".to_string()),
                release_date: Some("2026-01-24".to_string()),
                protected_path: Some(protected_path),
                docs_path: Some(docs_path),
                rtmp_enabled: false,
                hls_enabled: false,
                srt_enabled: false,
                udp_enabled: false,
                rtmp_output_url: Some(format!(
                    "rtmp://{}:2035/live/stream",
                    std::env::var("MEDIAMTX_HOST").unwrap_or_else(|_| "localhost".to_string())
                )),
                srt_output_url: Some(format!(
                    "srt://{}:8990?mode=caller&streamid=publish:live/stream",
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
                epg_url: Some("".to_string()),
                epg_days: Some(7),
                tmdb_api_key: None,
                omdb_api_key: None,
                tvmaze_api_key: None,
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
    log::info!("Received update_settings request: {:?}", req);
    let mut sql = String::from("UPDATE settings SET updated_at = CURRENT_TIMESTAMP");
    let mut counter = 1;

    macro_rules! add_field {
        ($field:expr, $col:expr) => {
            if $field.is_some() {
                sql.push_str(&format!(", {} = ${}", $col, counter));
                counter += 1;
            }
        };
    }

    // Explicitly handle all fields from UpdateSettingsRequest
    add_field!(req.output_type, "output_type");
    add_field!(req.output_url, "output_url");
    add_field!(req.resolution, "resolution");
    add_field!(req.fps, "fps");
    add_field!(req.video_bitrate, "video_bitrate");
    add_field!(req.audio_bitrate, "audio_bitrate");
    add_field!(req.media_path, "media_path");
    add_field!(req.thumbnails_path, "thumbnails_path");
    add_field!(req.playlists_path, "playlists_path");
    add_field!(req.fillers_path, "fillers_path");
    add_field!(req.logo_path, "logo_path");
    add_field!(req.logo_position, "logo_position");
    add_field!(req.day_start, "day_start");
    add_field!(req.channel_name, "channel_name");
    add_field!(req.default_image_path, "default_image_path");
    add_field!(req.default_video_path, "default_video_path");
    add_field!(req.clips_played_today, "clips_played_today");
    add_field!(req.overlay_opacity, "overlay_opacity");
    add_field!(req.overlay_scale, "overlay_scale");
    add_field!(req.overlay_x, "overlay_x");
    add_field!(req.overlay_y, "overlay_y");
    add_field!(req.overlay_anchor, "overlay_anchor");
    add_field!(req.srt_mode, "srt_mode");
    add_field!(req.system_version, "system_version");
    add_field!(req.release_date, "release_date");
    add_field!(req.overlay_enabled, "overlay_enabled");
    add_field!(req.app_logo_path, "app_logo_path");
    add_field!(req.rtmp_enabled, "rtmp_enabled");
    add_field!(req.hls_enabled, "hls_enabled");
    add_field!(req.srt_enabled, "srt_enabled");
    add_field!(req.udp_enabled, "udp_enabled");
    add_field!(req.rtmp_output_url, "rtmp_output_url");
    add_field!(req.srt_output_url, "srt_output_url");
    add_field!(req.udp_output_url, "udp_output_url");
    add_field!(req.udp_mode, "udp_mode");
    add_field!(req.auto_start_protocols, "auto_start_protocols");
    add_field!(req.video_codec, "video_codec");
    add_field!(req.audio_codec, "audio_codec");
    add_field!(req.dash_enabled, "dash_enabled");
    add_field!(req.mss_enabled, "mss_enabled");
    add_field!(req.rist_enabled, "rist_enabled");
    add_field!(req.rtsp_enabled, "rtsp_enabled");
    add_field!(req.webrtc_enabled, "webrtc_enabled");
    add_field!(req.llhls_enabled, "llhls_enabled");
    add_field!(req.dash_output_url, "dash_output_url");
    add_field!(req.mss_output_url, "mss_output_url");
    add_field!(req.rist_output_url, "rist_output_url");
    add_field!(req.rtsp_output_url, "rtsp_output_url");
    add_field!(req.webrtc_output_url, "webrtc_output_url");
    add_field!(req.epg_url, "epg_url");
    add_field!(req.epg_days, "epg_days");
    add_field!(req.tmdb_api_key, "tmdb_api_key");
    add_field!(req.omdb_api_key, "omdb_api_key");
    add_field!(req.tvmaze_api_key, "tvmaze_api_key");
    let _ = counter;

    sql.push_str(" WHERE id = TRUE");
    log::info!("Updating settings SQL: {}", sql);

    let mut query = sqlx::query(&sql);

    // Bind all fields in the same order
    macro_rules! bind_field {
        ($field:expr) => {
            if let Some(ref val) = $field {
                query = query.bind(val);
            }
        };
        (bool, $field:expr) => {
            if let Some(val) = $field {
                query = query.bind(val);
            }
        };
        (num, $field:expr) => {
            if let Some(val) = $field {
                query = query.bind(val);
            }
        };
    }

    bind_field!(req.output_type);
    bind_field!(req.output_url);
    bind_field!(req.resolution);
    bind_field!(req.fps);
    bind_field!(req.video_bitrate);
    bind_field!(req.audio_bitrate);
    bind_field!(req.media_path);
    bind_field!(req.thumbnails_path);
    bind_field!(req.playlists_path);
    bind_field!(req.fillers_path);
    bind_field!(req.logo_path);
    bind_field!(req.logo_position);
    bind_field!(req.day_start);
    bind_field!(req.channel_name);
    bind_field!(req.default_image_path);
    bind_field!(req.default_video_path);
    bind_field!(num, req.clips_played_today);
    bind_field!(num, req.overlay_opacity);
    bind_field!(num, req.overlay_scale);
    bind_field!(num, req.overlay_x);
    bind_field!(num, req.overlay_y);
    bind_field!(req.overlay_anchor);
    bind_field!(req.srt_mode);
    bind_field!(req.system_version);
    bind_field!(req.release_date);
    bind_field!(bool, req.overlay_enabled);
    bind_field!(req.app_logo_path);
    bind_field!(bool, req.rtmp_enabled);
    bind_field!(bool, req.hls_enabled);
    bind_field!(bool, req.srt_enabled);
    bind_field!(bool, req.udp_enabled);
    bind_field!(req.rtmp_output_url);
    bind_field!(req.srt_output_url);
    bind_field!(req.udp_output_url);
    bind_field!(req.udp_mode);
    bind_field!(bool, req.auto_start_protocols);
    bind_field!(req.video_codec);
    bind_field!(req.audio_codec);
    bind_field!(bool, req.dash_enabled);
    bind_field!(bool, req.mss_enabled);
    bind_field!(bool, req.rist_enabled);
    bind_field!(bool, req.rtsp_enabled);
    bind_field!(bool, req.webrtc_enabled);
    bind_field!(bool, req.llhls_enabled);
    bind_field!(req.dash_output_url);
    bind_field!(req.mss_output_url);
    bind_field!(req.rist_output_url);
    bind_field!(req.rtsp_output_url);
    bind_field!(req.webrtc_output_url);
    bind_field!(req.epg_url);
    bind_field!(num, req.epg_days);
    bind_field!(req.tmdb_api_key);
    bind_field!(req.omdb_api_key);
    bind_field!(req.tvmaze_api_key);

    let result = query.execute(pool.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Settings updated"})),
        Err(e) => {
            log::error!("Failed to update settings: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Failed to update settings: {}", e)}))
        }
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

#[derive(Deserialize)]
struct TestApiRequest {
    service: String,
    api_key: String,
}

async fn test_api_keys(req: web::Json<TestApiRequest>) -> impl Responder {
    let client = Client::new();
    let result = match req.service.as_str() {
        "tmdb" => {
            let url = format!(
                "https://api.themoviedb.org/3/configuration?api_key={}",
                req.api_key
            );
            client.get(&url).send().await
        }
        "omdb" => {
            let url = format!("http://www.omdbapi.com/?apikey={}&s=test", req.api_key);
            client.get(&url).send().await
        }
        "tvmaze" => {
            let url = format!("https://api.tvmaze.com/search/shows?q=test");
            client.get(&url).send().await
        }
        _ => {
            return HttpResponse::BadRequest().json(serde_json::json!({"error": "Unknown service"}))
        }
    };

    match result {
        Ok(res) => {
            if res.status().is_success() {
                HttpResponse::Ok()
                    .json(serde_json::json!({"success": true, "message": "API Key is Valid!"}))
            } else {
                HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": format!("API Error: {}", res.status())}))
            }
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("Request failed: {}", e)})),
    }
}

async fn apply_defaults(pool: web::Data<PgPool>) -> impl Responder {
    let defaults_path = Path::new("backend/data/api_defaults.enc");
    if !defaults_path.exists() {
        return HttpResponse::NotFound()
            .json(serde_json::json!({"error": "Defaults file not found"}));
    }

    let encoded_data = match std::fs::read_to_string(defaults_path) {
        Ok(s) => s,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Read failed: {}", e)}))
        }
    };

    let decoded_bytes = match general_purpose::STANDARD.decode(encoded_data.trim()) {
        Ok(b) => b,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Decode failed: {}", e)}))
        }
    };

    let decoded_str = String::from_utf8_lossy(&decoded_bytes);
    let defaults: serde_json::Value = match serde_json::from_str(&decoded_str) {
        Ok(v) => v,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Parse failed: {}", e)}))
        }
    };

    let tmdb_key = defaults["tmdb_api_key"].as_str().unwrap_or_default();
    let omdb_key = defaults["omdb_api_key"].as_str().unwrap_or_default();
    let tvmaze_key = defaults["tvmaze_api_key"].as_str().unwrap_or_default();

    // Update settings table
    let result = sqlx::query(
        "UPDATE settings SET tmdb_api_key = $1, omdb_api_key = $2, tvmaze_api_key = $3 WHERE id = TRUE"
    )
    .bind(tmdb_key)
    .bind(omdb_key)
    .bind(tvmaze_key)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok()
            .json(serde_json::json!({"success": true, "message": "Defaults applied successfully"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("Update failed: {}", e)})),
    }
}

async fn get_release_history() -> impl Responder {
    let history_path = Path::new("backend/data/RELEASE_HISTORY.json");
    // Fallback to local path if running from root
    let history_path = if !history_path.exists() {
        Path::new("data/RELEASE_HISTORY.json")
    } else {
        history_path
    };

    if !history_path.exists() {
        // Return default/empty if not found
        return HttpResponse::Ok().json(serde_json::json!([]));
    }

    match std::fs::read_to_string(history_path) {
        Ok(content) => {
            let history: serde_json::Value =
                serde_json::from_str(&content).unwrap_or(serde_json::json!([]));
            HttpResponse::Ok().json(history)
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to read release history"})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_settings))
        .route("", web::put().to(update_settings))
        .route("/test-api", web::post().to(test_api_keys))
        .route("/apply-defaults", web::post().to(apply_defaults))
        .route("/logo", web::get().to(get_logo))
        .route("/upload-logo", web::post().to(upload_logo))
        .route("/app-logo", web::get().to(get_app_logo))
        .route("/upload-app-logo", web::post().to(upload_app_logo))
        .route("/upload-overlay-pair", web::post().to(upload_overlay_pair))
        .route("/reset-all", web::post().to(reset_all))
        .route("/release-history", web::get().to(get_release_history));
}
