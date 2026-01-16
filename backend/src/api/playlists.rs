use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::playlist::Playlist;

#[derive(Deserialize)]
pub struct PlaylistQuery {
    pub date: Option<String>,
    pub search: Option<String>,
}

async fn list_playlists(
    query: web::Query<PlaylistQuery>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
        sqlx::QueryBuilder::new("SELECT * FROM playlists WHERE 1=1");

    if let Some(ref date_str) = query.date {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            query_builder.push(" AND date = ");
            query_builder.push_bind(date);
        }
    }

    if let Some(ref search) = query.search {
        if !search.is_empty() {
            query_builder.push(" AND name ILIKE ");
            query_builder.push_bind(format!("%{}%", search));
        }
    }

    query_builder.push(" ORDER BY created_at DESC");

    let result = query_builder
        .build_query_as::<Playlist>()
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(playlists) => HttpResponse::Ok().json(serde_json::json!({
            "playlists": playlists
        })),
        Err(e) => {
            log::error!("Failed to fetch playlists: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to fetch playlists"}))
        }
    }
}

async fn get_playlist(playlist_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(playlist_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(playlist)) => HttpResponse::Ok().json(playlist),
        Ok(None) => {
            HttpResponse::NotFound().json(serde_json::json!({"error": "Playlist not found"}))
        }
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

#[derive(Deserialize)]
pub struct CreatePlaylistRequest {
    pub name: String,
    pub date: Option<String>,
    pub content: serde_json::Value,
}

async fn create_playlist(
    req: web::Json<CreatePlaylistRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    // Calculate total duration from content
    let total_duration = calculate_playlist_duration(&req.content);

    let date = req
        .date
        .as_ref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let result = sqlx::query_as::<_, Playlist>(
        "INSERT INTO playlists (name, date, content, total_duration) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *",
    )
    .bind(&req.name)
    .bind(date)
    .bind(&req.content)
    .bind(total_duration)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(playlist) => HttpResponse::Created().json(playlist),
        Err(e) => {
            log::error!("Failed to create playlist: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to create playlist"}))
        }
    }
}

#[derive(Deserialize)]
pub struct UpdatePlaylistRequest {
    pub name: Option<String>,
    pub date: Option<String>,
    pub content: Option<serde_json::Value>,
}

async fn update_playlist(
    playlist_id: web::Path<Uuid>,
    req: web::Json<UpdatePlaylistRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    // Get existing playlist
    let existing = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(playlist_id.as_ref())
        .fetch_optional(pool.get_ref())
        .await;

    let mut playlist = match existing {
        Ok(Some(p)) => p,
        Ok(None) => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Playlist not found"}))
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}))
        }
    };

    // Update fields
    if let Some(ref name) = req.name {
        playlist.name = name.clone();
    }

    if let Some(ref date_str) = req.date {
        playlist.date = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok();
    }

    if let Some(ref content) = req.content {
        playlist.content = content.clone();
        playlist.total_duration = calculate_playlist_duration(content);
    }

    // Update in database
    let result = sqlx::query_as::<_, Playlist>(
        "UPDATE playlists 
         SET name = $1, date = $2, content = $3, total_duration = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 
         RETURNING *"
    )
    .bind(&playlist.name)
    .bind(playlist.date)
    .bind(&playlist.content)
    .bind(playlist.total_duration)
    .bind(playlist_id.into_inner())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(updated) => HttpResponse::Ok().json(updated),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update playlist"})),
    }
}

async fn delete_playlist(playlist_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query("DELETE FROM playlists WHERE id = $1")
        .bind(playlist_id.into_inner())
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "Playlist deleted successfully"}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Playlist not found"})),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to delete playlist"})),
    }
}

#[derive(Deserialize)]
pub struct ValidatePlaylistRequest {
    pub content: serde_json::Value,
}

async fn validate_playlist(req: web::Json<ValidatePlaylistRequest>) -> impl Responder {
    let total_duration = calculate_playlist_duration(&req.content);
    let target_duration = 24.0 * 3600.0; // 24 hours in seconds

    let is_valid =
        total_duration >= target_duration * 0.95 && total_duration <= target_duration * 1.05;
    let difference = target_duration - total_duration;

    HttpResponse::Ok().json(serde_json::json!({
        "valid": is_valid,
        "total_duration": total_duration,
        "target_duration": target_duration,
        "difference": difference,
        "difference_formatted": format_duration(difference.abs()),
        "needs_filler": difference > 0.0
    }))
}

/// Calculate total duration from playlist content (ffplayout JSON format)
fn calculate_playlist_duration(content: &serde_json::Value) -> f64 {
    let mut total = 0.0;

    if let Some(program) = content.get("program").and_then(|p| p.as_array()) {
        for clip in program {
            if let Some(duration) = clip.get("duration").and_then(|d| d.as_f64()) {
                total += duration;
            }
        }
    }

    total
}

/// Format duration in seconds to human-readable format
fn format_duration(seconds: f64) -> String {
    let hours = (seconds / 3600.0).floor() as i32;
    let minutes = ((seconds % 3600.0) / 60.0).floor() as i32;
    let secs = (seconds % 60.0).floor() as i32;

    format!("{}h {}m {}s", hours, minutes, secs)
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_playlists))
        .route("", web::post().to(create_playlist))
        .route("/{id}", web::get().to(get_playlist))
        .route("/{id}", web::put().to(update_playlist))
        .route("/{id}", web::delete().to(delete_playlist))
        .route("/validate", web::post().to(validate_playlist));
}
