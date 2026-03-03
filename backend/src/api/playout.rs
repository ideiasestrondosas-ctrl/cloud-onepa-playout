use crate::services::engine::PlayoutEngine;
use actix_web::{web, HttpResponse, Responder};
use chrono::Datelike;
use serde::Serialize;
use sqlx::{PgPool, Row};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct DebugReport {
    pub has_active_schedule: bool,
    pub active_schedule_id: Option<Uuid>,
    pub active_schedule_name: Option<String>,
    pub has_playlist: bool,
    pub playlist_id: Option<Uuid>,
    pub playlist_name: Option<String>,
    pub media_files_count: i32,
    pub missing_media_files: Vec<String>,
    pub overlay_configured: bool,
    pub warnings: Vec<String>,
}

async fn get_status(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    let state = engine.status.lock().await;
    HttpResponse::Ok().json(state.clone())
}

async fn start_playout(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    log::info!("API: Starting playout engine...");
    engine.set_running(true).await;
    let state = engine.status.lock().await;

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout started successfully",
        "status": state.clone()
    }))
}

async fn stop_playout(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    log::info!("API: Stopping playout engine...");
    engine.set_running(false).await;

    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout stopped successfully"
    }))
}

async fn skip_clip(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    engine.skip_current_clip().await;
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Skip requested"
    }))
}

async fn pause_playout(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    log::info!("API: Pausing playout engine...");
    engine.pause_playout().await;
    let state = engine.status.lock().await;
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout paused",
        "status": state.clone()
    }))
}

async fn resume_playout(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    log::info!("API: Resuming playout engine...");
    engine.resume_playout().await;
    let state = engine.status.lock().await;
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Playout resumed",
        "status": state.clone()
    }))
}

async fn get_logs(engine: web::Data<Arc<PlayoutEngine>>) -> impl Responder {
    // 1. In-memory engine logs (recent events, relay status, etc.)
    let in_memory_logs: Vec<String> = {
        let logs = engine.logs.lock().await;
        logs.iter().cloned().collect()
    };

    // 2. Disk logs from /var/log/onepa/ (tail of current log file)
    // This is the data that was previously inaccessible in the container UI viewer.
    let log_path = std::env::var("LOG_PATH").unwrap_or_else(|_| "/var/log/onepa".to_string());
    let disk_logs: Vec<String> = read_disk_logs(&log_path, 200);

    // 3. Merge: disk logs first (older), then in-memory (newest)
    let mut combined = disk_logs;
    combined.extend(in_memory_logs);

    HttpResponse::Ok().json(serde_json::json!({
        "logs": combined
    }))
}

/// Read the last `max_lines` from the most recent log file in log_dir.
/// Tries playout_rCURRENT.log first, then falls back to newest rotated file.
fn read_disk_logs(log_dir: &str, max_lines: usize) -> Vec<String> {
    // Try the symlink/current file first
    let current = std::path::Path::new(log_dir).join("playout_rCURRENT.log");
    let target = if current.exists() {
        current
    } else {
        // Fall back to the newest file by modification time
        let dir = std::fs::read_dir(log_dir).ok();
        let newest = dir.and_then(|entries| {
            entries
                .flatten()
                .filter(|e| {
                    e.file_name()
                        .to_string_lossy()
                        .starts_with("playout_r")
                })
                .max_by_key(|e| {
                    e.metadata()
                        .and_then(|m| m.modified())
                        .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
                })
                .map(|e| e.path())
        });
        match newest {
            Some(p) => p,
            None => return vec!["[No log files found in /var/log/onepa/]".to_string()],
        }
    };

    match std::fs::read_to_string(&target) {
        Ok(contents) => {
            let lines: Vec<String> = contents
                .lines()
                .rev()
                .take(max_lines)
                .map(|l| l.to_string())
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
            lines
        }
        Err(e) => vec![format!(
            "[Could not read log file {}: {}]",
            target.display(),
            e
        )],
    }
}

async fn diagnose_playout(pool: web::Data<PgPool>) -> impl Responder {
    let mut report = DebugReport {
        has_active_schedule: false,
        active_schedule_id: None,
        active_schedule_name: None,
        has_playlist: false,
        playlist_id: None,
        playlist_name: None,
        media_files_count: 0,
        missing_media_files: Vec::new(),
        overlay_configured: false,
        warnings: Vec::new(),
    };

    // Check schedule using actual schema (date, start_time, repeat_pattern)
    let now_dt = chrono::Local::now();
    let today = now_dt.date_naive();

    let current_time = now_dt.time();

    // First, check for a direct schedule for today that has already started
    // JOIN with playlists to get the playlist name for the diagnostic report
    let direct_schedule = sqlx::query(
        "SELECT s.id, s.playlist_id, p.name as playlist_name 
         FROM schedule s 
         JOIN playlists p ON s.playlist_id = p.id
         WHERE s.date = $1 AND s.start_time <= $2 
         ORDER BY s.start_time DESC LIMIT 1"
    )
    .bind(today)
    .bind(current_time)
    .fetch_optional(pool.get_ref())
    .await;

    let mut found_playlist_id: Option<Uuid> = None;

    if let Ok(Some(row)) = direct_schedule {
        report.has_active_schedule = true;
        report.active_schedule_id = Some(row.get("id"));
        found_playlist_id = Some(row.get("playlist_id"));
        report.playlist_id = found_playlist_id;
        let pname: Option<String> = row.try_get("playlist_name").ok();
        report.active_schedule_name = pname.clone();
        report.playlist_name = pname;
    }

    // If no direct schedule, check for repeating schedules that have started
    if !report.has_active_schedule {
        // Check daily repeats (must have started by current_time)
        let daily_schedule = sqlx::query(
            "SELECT s.id, s.playlist_id, p.name as playlist_name
             FROM schedule s
             JOIN playlists p ON s.playlist_id = p.id
             WHERE s.repeat_pattern = 'daily' AND s.date <= $1 AND s.start_time <= $2 
             ORDER BY s.date DESC, s.start_time DESC LIMIT 1"
        )
        .bind(today)
        .bind(current_time)
        .fetch_optional(pool.get_ref())
        .await;

        if let Ok(Some(row)) = daily_schedule {
            report.has_active_schedule = true;
            report.active_schedule_id = Some(row.get("id"));
            found_playlist_id = Some(row.get("playlist_id"));
            report.playlist_id = found_playlist_id;
            let pname: Option<String> = row.try_get("playlist_name").ok();
            report.active_schedule_name = pname.clone();
            report.playlist_name = pname;
        }

        // Check weekly repeats if still not found
        if !report.has_active_schedule {
            let day_of_week = today.weekday().num_days_from_monday();
            let weekly_schedule = sqlx::query(
                "SELECT s.id, s.playlist_id, p.name as playlist_name
                 FROM schedule s
                 JOIN playlists p ON s.playlist_id = p.id
                 WHERE s.repeat_pattern = 'weekly' AND EXTRACT(DOW FROM s.date) = $1 AND s.date <= $2 AND s.start_time <= $3 
                 ORDER BY s.date DESC, s.start_time DESC LIMIT 1"
            )
            .bind(day_of_week as i32)
            .bind(today)
            .bind(current_time)
            .fetch_optional(pool.get_ref())
            .await;

            if let Ok(Some(row)) = weekly_schedule {
                report.has_active_schedule = true;
                report.active_schedule_id = Some(row.get("id"));
                found_playlist_id = Some(row.get("playlist_id"));
                report.playlist_id = found_playlist_id;
                let pname: Option<String> = row.try_get("playlist_name").ok();
                report.active_schedule_name = pname.clone();
                report.playlist_name = pname;
            }
        }
    }

    // Check playlist if we found a schedule
    if let Some(playlist_id) = found_playlist_id {
        let playlist = sqlx::query("SELECT content, name FROM playlists WHERE id = $1")
            .bind(playlist_id)
            .fetch_optional(pool.get_ref())
            .await;

        match playlist {
            Ok(Some(row)) => {
                report.has_playlist = true;
                let content: serde_json::Value = row.get("content");
                // Capture playlist name if not already set
                if report.playlist_name.is_none() {
                    report.playlist_name = row.try_get::<String, _>("name").ok();
                }

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
        sqlx::query("SELECT logo_path FROM settings WHERE id = TRUE AND overlay_enabled = TRUE")
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

#[derive(Debug, serde::Deserialize)]
pub struct ProtocolToggleRequest {
    pub protocol: String,
    pub enabled: bool,
}

async fn toggle_protocol(
    engine: web::Data<Arc<PlayoutEngine>>,
    req: web::Json<ProtocolToggleRequest>,
) -> impl Responder {
    match engine.toggle_protocol(&req.protocol, req.enabled).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "message": format!("Protocol {} {}", req.protocol, if req.enabled { "enabled" } else { "disabled" })
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({ "error": e })),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/status", web::get().to(get_status))
        .route("/start", web::post().to(start_playout))
        .route("/stop", web::post().to(stop_playout))
        .route("/skip", web::post().to(skip_clip))
        .route("/pause", web::post().to(pause_playout))
        .route("/resume", web::post().to(resume_playout))
        .route("/diagnose", web::get().to(diagnose_playout))
        .route("/protocol/toggle", web::post().to(toggle_protocol))
        .route("/logs", web::get().to(get_logs));
}
