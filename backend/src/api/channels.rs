use crate::services::channel_registry::ChannelRegistry;
use crate::services::engine::PlayoutEngine;
use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Channel {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub enabled: bool,
    pub hls_stream_path: Option<String>,
    pub output_url: Option<String>,
    pub preview_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChannelRequest {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub output_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateChannelRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub enabled: Option<bool>,
    pub output_url: Option<String>,
}

async fn list_channels(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Channel>(
        "SELECT * FROM channels ORDER BY created_at ASC",
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(channels) => HttpResponse::Ok().json(channels),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn get_channel(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, Channel>("SELECT * FROM channels WHERE id = $1")
        .bind(*id)
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(channel)) => HttpResponse::Ok().json(channel),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn create_channel(
    pool: web::Data<PgPool>,
    registry: web::Data<Arc<ChannelRegistry>>,
    req: web::Json<CreateChannelRequest>,
) -> impl Responder {
    // Auto-generate preview_url and hls_stream_path from slug
    let hls_base = std::env::var("HLS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
    let hls_stream_path = format!("{}/{}/index.m3u8", hls_base, req.slug);
    let preview_url = format!("/hls/{}/index.m3u8", req.slug);
    let output_url = req.output_url.clone().unwrap_or_default();

    let result = sqlx::query_as::<_, Channel>(
        "INSERT INTO channels (name, slug, description, hls_stream_path, output_url, preview_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(&req.name)
    .bind(&req.slug)
    .bind(&req.description)
    .bind(&hls_stream_path)
    .bind(&output_url)
    .bind(&preview_url)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(channel) => {
            // Spawn a new PlayoutEngine for this channel
            let engine = Arc::new(PlayoutEngine::new_with_channel(
                pool.get_ref().clone(),
                channel.id,
            ));
            registry.insert(channel.id, engine.clone()).await;
            let engine_for_spawn = engine.clone();
            tokio::spawn(async move {
                engine_for_spawn.start().await;
            });
            log::info!("Created and started engine for channel '{}'", channel.name);
            HttpResponse::Created().json(channel)
        }
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("unique") || msg.contains("duplicate") {
                HttpResponse::Conflict().json(serde_json::json!({"error": "Slug already exists"}))
            } else {
                HttpResponse::InternalServerError().json(serde_json::json!({"error": msg}))
            }
        }
    }
}

async fn update_channel(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: web::Json<UpdateChannelRequest>,
) -> impl Responder {
    let result = sqlx::query(
        "UPDATE channels
         SET name        = COALESCE($1, name),
             description = COALESCE($2, description),
             enabled     = COALESCE($3, enabled),
             output_url  = COALESCE($4, output_url),
             updated_at  = NOW()
         WHERE id = $5",
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(req.enabled)
    .bind(&req.output_url)
    .bind(*id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "Channel updated"}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn delete_channel(
    pool: web::Data<PgPool>,
    registry: web::Data<Arc<ChannelRegistry>>,
    id: web::Path<Uuid>,
) -> impl Responder {
    // Prevent deletion of the default channel
    let default_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    if *id == default_id {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Cannot delete the default channel"}));
    }

    // Stop and remove engine from registry
    if let Some(engine) = registry.remove(*id).await {
        engine.set_running(false).await;
    }

    let result = sqlx::query("DELETE FROM channels WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "Channel deleted"}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// ── Channel-scoped playout endpoints ─────────────────────────────────────────

async fn channel_playout_status(
    registry: web::Data<Arc<ChannelRegistry>>,
    id: web::Path<Uuid>,
) -> impl Responder {
    match registry.get(*id).await {
        Some(engine) => {
            let state = engine.status.lock().await;
            HttpResponse::Ok().json(state.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel engine not found"})),
    }
}

async fn channel_playout_start(
    registry: web::Data<Arc<ChannelRegistry>>,
    id: web::Path<Uuid>,
) -> impl Responder {
    match registry.get(*id).await {
        Some(engine) => {
            engine.set_running(true).await;
            let state = engine.status.lock().await;
            HttpResponse::Ok().json(serde_json::json!({
                "message": "Playout started",
                "status": state.clone()
            }))
        }
        None => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel engine not found"})),
    }
}

async fn channel_playout_stop(
    registry: web::Data<Arc<ChannelRegistry>>,
    id: web::Path<Uuid>,
) -> impl Responder {
    match registry.get(*id).await {
        Some(engine) => {
            engine.set_running(false).await;
            HttpResponse::Ok().json(serde_json::json!({"message": "Playout stopped"}))
        }
        None => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel engine not found"})),
    }
}

async fn channel_playout_skip(
    registry: web::Data<Arc<ChannelRegistry>>,
    id: web::Path<Uuid>,
) -> impl Responder {
    match registry.get(*id).await {
        Some(engine) => {
            engine.skip_current_clip().await;
            HttpResponse::Ok().json(serde_json::json!({"message": "Skip requested"}))
        }
        None => HttpResponse::NotFound().json(serde_json::json!({"error": "Channel engine not found"})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_channels))
        .route("", web::post().to(create_channel))
        .route("/{id}", web::get().to(get_channel))
        .route("/{id}", web::put().to(update_channel))
        .route("/{id}", web::delete().to(delete_channel))
        // Per-channel playout control
        .route("/{id}/playout/status", web::get().to(channel_playout_status))
        .route("/{id}/playout/start", web::post().to(channel_playout_start))
        .route("/{id}/playout/stop", web::post().to(channel_playout_stop))
        .route("/{id}/playout/skip", web::post().to(channel_playout_skip));
}
