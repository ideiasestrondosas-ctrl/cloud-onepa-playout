// ── api/scte35.rs — SCTE-35 Ad-Insertion Marker API (Phase 4) ─────────────────
use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Scte35Marker {
    pub id: Uuid,
    pub playlist_item_id: String,
    pub playlist_id: Option<Uuid>,
    pub splice_insert_type: String,
    pub pts_offset: i64,
    pub duration_frames: Option<i32>,
    pub auto_return: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScte35Request {
    pub playlist_item_id: String,
    pub playlist_id: Option<Uuid>,
    /// Type of SCTE-35 cue: "splice_insert" (default) or "time_signal"
    pub splice_insert_type: Option<String>,
    /// PTS offset in 90kHz ticks (0 = immediate)
    pub pts_offset: Option<i64>,
    /// Duration in frames (None = no auto-return)
    pub duration_frames: Option<i32>,
    pub auto_return: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ListScte35Query {
    pub playlist_id: Option<Uuid>,
    pub playlist_item_id: Option<String>,
}

async fn list_markers(
    pool: web::Data<PgPool>,
    query: web::Query<ListScte35Query>,
) -> impl Responder {
    let result = if let Some(pid) = query.playlist_id {
        sqlx::query_as::<_, Scte35Marker>(
            "SELECT * FROM scte_35_markers WHERE playlist_id = $1 ORDER BY created_at ASC",
        )
        .bind(pid)
        .fetch_all(pool.get_ref())
        .await
    } else if let Some(ref item_id) = query.playlist_item_id {
        sqlx::query_as::<_, Scte35Marker>(
            "SELECT * FROM scte_35_markers WHERE playlist_item_id = $1 ORDER BY created_at ASC",
        )
        .bind(item_id)
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query_as::<_, Scte35Marker>(
            "SELECT * FROM scte_35_markers ORDER BY created_at DESC LIMIT 200",
        )
        .fetch_all(pool.get_ref())
        .await
    };

    match result {
        Ok(markers) => HttpResponse::Ok().json(markers),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn get_marker(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, Scte35Marker>(
        "SELECT * FROM scte_35_markers WHERE id = $1",
    )
    .bind(*id)
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(m)) => HttpResponse::Ok().json(m),
        Ok(None) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "SCTE-35 marker not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn create_marker(
    pool: web::Data<PgPool>,
    req: web::Json<CreateScte35Request>,
) -> impl Responder {
    let splice_type = req
        .splice_insert_type
        .clone()
        .unwrap_or_else(|| "splice_insert".to_string());
    let pts_offset = req.pts_offset.unwrap_or(0);
    let auto_return = req.auto_return.unwrap_or(true);

    let result = sqlx::query_as::<_, Scte35Marker>(
        r#"INSERT INTO scte_35_markers
             (playlist_item_id, playlist_id, splice_insert_type, pts_offset, duration_frames, auto_return)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(&req.playlist_item_id)
    .bind(req.playlist_id)
    .bind(&splice_type)
    .bind(pts_offset)
    .bind(req.duration_frames)
    .bind(auto_return)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(marker) => HttpResponse::Created().json(marker),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn delete_marker(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query("DELETE FROM scte_35_markers WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "SCTE-35 marker deleted"}))
        }
        Ok(_) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "SCTE-35 marker not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_markers))
        .route("", web::post().to(create_marker))
        .route("/{id}", web::get().to(get_marker))
        .route("/{id}", web::delete().to(delete_marker));
}
