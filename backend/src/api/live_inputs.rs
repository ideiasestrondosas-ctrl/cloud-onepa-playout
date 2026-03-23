use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct LiveInput {
    pub id: Uuid,
    pub name: String,
    pub protocol: String,
    pub url: String,
    pub port: Option<i32>,
    pub status: String,
    pub health_status: serde_json::Value,
    pub channel_id: Option<Uuid>,
    pub preview_url: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SocialStream {
    pub id: Uuid,
    pub name: String,
    pub platform: String,
    pub stream_key: Option<String>,
    pub stream_url: Option<String>,
    pub status: String,
    pub health_status: serde_json::Value,
    pub channel_id: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct LiveInputRoute {
    pub id: Uuid,
    pub live_input_id: Uuid,
    pub channel_id: Uuid,
    pub priority: i32,
    pub is_active: bool,
    pub switch_on_loss: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLiveInput {
    pub name: String,
    pub protocol: String,
    pub url: String,
    pub port: Option<i32>,
    pub channel_id: Option<Uuid>,
    pub preview_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSocialStream {
    pub name: String,
    pub platform: String,
    pub stream_key: Option<String>,
    pub stream_url: Option<String>,
    pub channel_id: Option<Uuid>,
    pub metadata: Option<serde_json::Value>,
}

// Live Inputs handlers
#[derive(Deserialize)]
pub struct LiveInputQuery {
    pub channel_id: Option<Uuid>,
}

async fn list_live_inputs(
    pool: web::Data<PgPool>,
    query: web::Query<LiveInputQuery>,
) -> impl Responder {
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = query.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, LiveInput>(
        "SELECT * FROM live_inputs WHERE channel_id = $1 ORDER BY created_at DESC"
    )
    .bind(channel_id)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(inputs) => HttpResponse::Ok().json(inputs),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn get_live_input(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, LiveInput>("SELECT * FROM live_inputs WHERE id = $1")
        .bind(*id)
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(input)) => HttpResponse::Ok().json(input),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn create_live_input(
    pool: web::Data<PgPool>,
    req: web::Json<CreateLiveInput>,
) -> impl Responder {
    let metadata = req.metadata.clone().unwrap_or(serde_json::json!({}));
    let result = sqlx::query_as::<_, LiveInput>(
        "INSERT INTO live_inputs (name, protocol, url, port, channel_id, preview_url, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.protocol)
    .bind(&req.url)
    .bind(req.port)
    .bind(req.channel_id)
    .bind(&req.preview_url)
    .bind(metadata)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(input) => HttpResponse::Created().json(input),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn delete_live_input(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query("DELETE FROM live_inputs WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => HttpResponse::NoContent().finish(),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// Social Streams handlers
async fn list_social_streams(
    pool: web::Data<PgPool>,
    query: web::Query<LiveInputQuery>,
) -> impl Responder {
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = query.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, SocialStream>(
        "SELECT * FROM social_streams WHERE channel_id = $1 ORDER BY created_at DESC"
    )
    .bind(channel_id)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(streams) => HttpResponse::Ok().json(streams),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn get_social_stream(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, SocialStream>("SELECT * FROM social_streams WHERE id = $1")
        .bind(*id)
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(stream)) => HttpResponse::Ok().json(stream),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn create_social_stream(
    pool: web::Data<PgPool>,
    req: web::Json<CreateSocialStream>,
) -> impl Responder {
    let metadata = req.metadata.clone().unwrap_or(serde_json::json!({}));
    let result = sqlx::query_as::<_, SocialStream>(
        "INSERT INTO social_streams (name, platform, stream_key, stream_url, channel_id, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.platform)
    .bind(&req.stream_key)
    .bind(&req.stream_url)
    .bind(req.channel_id)
    .bind(metadata)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(stream) => HttpResponse::Created().json(stream),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn delete_social_stream(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query("DELETE FROM social_streams WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => HttpResponse::NoContent().finish(),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn start_social_stream(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, SocialStream>(
        "UPDATE social_streams SET status = 'active', started_at = NOW(), ended_at = NULL WHERE id = $1 RETURNING *"
    )
    .bind(*id)
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(stream)) => HttpResponse::Ok().json(stream),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn stop_social_stream(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, SocialStream>(
        "UPDATE social_streams SET status = 'inactive', ended_at = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(*id)
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(stream)) => HttpResponse::Ok().json(stream),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/inputs")
            .route("", web::get().to(list_live_inputs))
            .route("", web::post().to(create_live_input))
            .route("/{id}", web::get().to(get_live_input))
            .route("/{id}", web::delete().to(delete_live_input))
    )
    .service(
        web::scope("/streams")
            .route("", web::get().to(list_social_streams))
            .route("", web::post().to(create_social_stream))
            .route("/{id}", web::get().to(get_social_stream))
            .route("/{id}", web::delete().to(delete_social_stream))
            .route("/{id}/start", web::post().to(start_social_stream))
            .route("/{id}/stop", web::post().to(stop_social_stream))
    );
}
