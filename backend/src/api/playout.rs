use actix_web::{web, HttpResponse, Responder};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

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

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/status", web::get().to(get_status))
        .route("/start", web::post().to(start_playout))
        .route("/stop", web::post().to(stop_playout))
        .route("/skip", web::post().to(skip_clip))
        .route("/pause", web::post().to(pause_playout))
        .route("/resume", web::post().to(resume_playout));
}
