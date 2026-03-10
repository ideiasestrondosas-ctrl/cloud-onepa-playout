use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Channel {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChannelRequest {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateChannelRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub enabled: Option<bool>,
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
    req: web::Json<CreateChannelRequest>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Channel>(
        "INSERT INTO channels (name, slug, description) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&req.name)
    .bind(&req.slug)
    .bind(&req.description)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(channel) => HttpResponse::Created().json(channel),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
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
             updated_at  = NOW()
         WHERE id = $4",
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(req.enabled)
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

async fn delete_channel(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    // Prevent deletion of the default channel
    let default_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    if *id == default_id {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Cannot delete the default channel"}));
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

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_channels))
        .route("", web::post().to(create_channel))
        .route("/{id}", web::get().to(get_channel))
        .route("/{id}", web::put().to(update_channel))
        .route("/{id}", web::delete().to(delete_channel));
}
