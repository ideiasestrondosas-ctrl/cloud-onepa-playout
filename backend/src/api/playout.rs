use actix_web::{web, HttpResponse, Responder};
use chrono::Datelike;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::sync::{Arc, Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayoutStatus {
    pub status: String, // playing, stopped, paused
    pub current_clip: Option<ClipInfo>,
    pub next_clips: Vec<ClipInfo>,
    pub uptime: i64,
    pub clips_played_today: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfo {
    pub filename: String,
    pub duration: f64,
    pub position: f64,
}

#[derive(Debug, Serialize)]
pub struct DebugReport {
    pub has_active_schedule: bool,
    pub active_schedule_id: Option<Uuid>,
    pub has_playlist: bool,
    pub playlist_id: Option<Uuid>,
    pub media_files_count: i32,
    pub missing_media_files: Vec<String>,
    pub overlay_configured: bool,
    pub warnings: Vec<String>,
}

lazy_static! {
    static ref PLAYOUT_STATE: Arc<Mutex<PlayoutStatus>> = Arc::new(Mutex::new(PlayoutStatus {
        status: "stopped".to_string(),
        current_clip: None,
        next_clips: Vec::new(),
        uptime: 0,
        clips_played_today: 0,
    }));
}

async fn get_status() -> impl Responder {
    let state = PLAYOUT_STATE.lock().unwrap();
    HttpResponse::Ok().json(state.clone())
}

async fn start_playout() -> impl Responder {
    let mut state = PLAYOUT_STATE.lock().unwrap();

    if state.status == "playing" {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Playout is already running"}));
    }

    state.status = "playing".to_string();

    // TODO: Actually start FFmpeg playout process
    log::info!("Starting playout...");

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout started successfully",
        "status": state.clone()
    }))
}

async fn stop_playout() -> impl Responder {
    let mut state = PLAYOUT_STATE.lock().unwrap();

    if state.status == "stopped" {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Playout is not running"}));
    }

    state.status = "stopped".to_string();
    state.current_clip = None;
    state.next_clips.clear();

    // TODO: Actually stop FFmpeg playout process
    log::info!("Stopping playout...");

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout stopped successfully"
    }))
}

async fn skip_clip() -> impl Responder {
    let mut state = PLAYOUT_STATE.lock().unwrap();

    if state.status != "playing" {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Playout is not running"}));
    }

    // Move to next clip
    if !state.next_clips.is_empty() {
        state.current_clip = Some(state.next_clips.remove(0));
    }

    // TODO: Actually skip to next clip in FFmpeg
    log::info!("Skipping to next clip...");

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Skipped to next clip",
        "current_clip": state.current_clip
    }))
}

async fn pause_playout() -> impl Responder {
    let mut state = PLAYOUT_STATE.lock().unwrap();

    if state.status != "playing" {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Playout is not running"}));
    }

    state.status = "paused".to_string();

    // TODO: Actually pause FFmpeg playout
    log::info!("Pausing playout...");

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout paused"
    }))
}

async fn resume_playout() -> impl Responder {
    let mut state = PLAYOUT_STATE.lock().unwrap();

    if state.status != "paused" {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Playout is not paused"}));
    }

    state.status = "playing".to_string();

    // TODO: Actually resume FFmpeg playout
    log::info!("Resuming playout...");

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout resumed"
    }))
}

async fn debug_playout(pool: web::Data<PgPool>) -> impl Responder {
    let mut report = DebugReport {
        has_active_schedule: false,
        active_schedule_id: None,
        has_playlist: false,
        playlist_id: None,
        media_files_count: 0,
        missing_media_files: Vec::new(),
        overlay_configured: false,
        warnings: Vec::new(),
    };

    // Check schedule using actual schema (date, start_time, repeat_pattern)
    let now_dt = chrono::Local::now();
    let today = now_dt.date_naive();

    // First, check for a direct schedule for today
    let direct_schedule =
        sqlx::query("SELECT id, playlist_id FROM schedule WHERE date = $1 LIMIT 1")
            .bind(today)
            .fetch_optional(pool.get_ref())
            .await;

    let mut found_playlist_id: Option<Uuid> = None;

    if let Ok(Some(row)) = direct_schedule {
        report.has_active_schedule = true;
        report.active_schedule_id = Some(row.get("id"));
        found_playlist_id = Some(row.get("playlist_id"));
        report.playlist_id = found_playlist_id;
    }

    // If no direct schedule, check for repeating schedules
    if !report.has_active_schedule {
        // Check daily repeats
        let daily_schedule = sqlx::query("SELECT id, playlist_id FROM schedule WHERE repeat_pattern = 'daily' AND date <= $1 ORDER BY date DESC LIMIT 1")
            .bind(today)
            .fetch_optional(pool.get_ref())
            .await;

        if let Ok(Some(row)) = daily_schedule {
            report.has_active_schedule = true;
            report.active_schedule_id = Some(row.get("id"));
            found_playlist_id = Some(row.get("playlist_id"));
            report.playlist_id = found_playlist_id;
        }

        // Check weekly repeats if still not found
        if !report.has_active_schedule {
            let day_of_week = today.weekday().num_days_from_monday();
            let weekly_schedule = sqlx::query("SELECT id, playlist_id FROM schedule WHERE repeat_pattern = 'weekly' AND EXTRACT(DOW FROM date) = $1 AND date <= $2 ORDER BY date DESC LIMIT 1")
                .bind(day_of_week as i32)
                .bind(today)
                .fetch_optional(pool.get_ref())
                .await;

            if let Ok(Some(row)) = weekly_schedule {
                report.has_active_schedule = true;
                report.active_schedule_id = Some(row.get("id"));
                found_playlist_id = Some(row.get("playlist_id"));
                report.playlist_id = found_playlist_id;
            }
        }
    }

    // Check playlist if we found a schedule
    if let Some(playlist_id) = found_playlist_id {
        let playlist = sqlx::query("SELECT content FROM playlists WHERE id = $1")
            .bind(playlist_id)
            .fetch_optional(pool.get_ref())
            .await;

        match playlist {
            Ok(Some(row)) => {
                report.has_playlist = true;
                let content: serde_json::Value = row.get("content");

                // Check media files
                if let Some(clips) = content.as_array() {
                    report.media_files_count = clips.len() as i32;
                    for clip in clips {
                        if let Some(path) = clip
                            .get("path")
                            .or(clip.get("source"))
                            .and_then(|v| v.as_str())
                        {
                            if !std::path::Path::new(path).exists() {
                                report.missing_media_files.push(path.to_string());
                            }
                        }
                    }
                } else if let Some(program) = content.get("program").and_then(|p| p.as_array()) {
                    report.media_files_count = program.len() as i32;
                    for clip in program {
                        if let Some(path) = clip
                            .get("path")
                            .or(clip.get("source"))
                            .and_then(|v| v.as_str())
                        {
                            if !std::path::Path::new(path).exists() {
                                report.missing_media_files.push(path.to_string());
                            }
                        }
                    }
                }
            }
            _ => report
                .warnings
                .push("Playlist associada não encontrada".to_string()),
        }
    } else {
        report
            .warnings
            .push("Nenhum horário ativo encontrado para este momento".to_string());
    }

    // Check overlay
    let settings =
        sqlx::query("SELECT logo_path FROM settings WHERE id = TRUE AND logo_enabled = TRUE")
            .fetch_optional(pool.get_ref())
            .await;

    if let Ok(Some(row)) = settings {
        let logo_path: String = row.get("logo_path");
        if !logo_path.is_empty() && std::path::Path::new(&logo_path).exists() {
            report.overlay_configured = true;
        } else {
            report
                .warnings
                .push("Logo de overlay habilitado mas ficheiro não encontrado".to_string());
        }
    }

    HttpResponse::Ok().json(report)
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/status", web::get().to(get_status))
        .route("/start", web::post().to(start_playout))
        .route("/stop", web::post().to(stop_playout))
        .route("/skip", web::post().to(skip_clip))
        .route("/pause", web::post().to(pause_playout))
        .route("/resume", web::post().to(resume_playout))
        .route("/debug", web::get().to(debug_playout));
}
