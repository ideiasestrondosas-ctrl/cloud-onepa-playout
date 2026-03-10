use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

// ─── As-Run Log ──────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AsRunLog {
    pub id: Uuid,
    pub channel_id: Option<Uuid>,
    pub asset_id: Option<Uuid>,
    pub playlist_id: Option<Uuid>,
    pub clip_id: Option<String>,
    pub clip_filename: Option<String>,
    pub actual_start: DateTime<Utc>,
    pub actual_end: Option<DateTime<Utc>>,
    pub status: String,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AsRunQuery {
    pub channel_id: Option<Uuid>,
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

async fn get_as_run_logs(
    pool: web::Data<PgPool>,
    query: web::Query<AsRunQuery>,
) -> impl Responder {
    let limit = query.limit.unwrap_or(100).min(1000);
    let offset = query.offset.unwrap_or(0);

    let result = sqlx::query_as::<_, AsRunLog>(
        "SELECT * FROM as_run_logs
         WHERE ($1::uuid IS NULL OR channel_id = $1)
           AND ($2::timestamptz IS NULL OR actual_start >= $2)
           AND ($3::timestamptz IS NULL OR actual_start <= $3)
         ORDER BY actual_start DESC
         LIMIT $4 OFFSET $5",
    )
    .bind(query.channel_id)
    .bind(query.start)
    .bind(query.end)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(logs) => HttpResponse::Ok().json(logs),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub channel_id: Option<Uuid>,
    pub action: String,
    pub resource: Option<String>,
    pub resource_id: Option<String>,
    pub metadata: serde_json::Value,
    pub ip_address: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AuditQuery {
    pub user_id: Option<Uuid>,
    pub channel_id: Option<Uuid>,
    pub action: Option<String>,
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

async fn get_audit_logs(
    pool: web::Data<PgPool>,
    query: web::Query<AuditQuery>,
) -> impl Responder {
    let limit = query.limit.unwrap_or(100).min(1000);
    let offset = query.offset.unwrap_or(0);

    let result = sqlx::query_as::<_, AuditLog>(
        "SELECT id, user_id, channel_id, action, resource, resource_id,
                metadata, ip_address::text, created_at
         FROM audit_logs
         WHERE ($1::uuid IS NULL OR user_id = $1)
           AND ($2::uuid IS NULL OR channel_id = $2)
           AND ($3::text IS NULL OR action ILIKE $3)
           AND ($4::timestamptz IS NULL OR created_at >= $4)
           AND ($5::timestamptz IS NULL OR created_at <= $5)
         ORDER BY created_at DESC
         LIMIT $6 OFFSET $7",
    )
    .bind(query.user_id)
    .bind(query.channel_id)
    .bind(query.action.as_ref().map(|a| format!("%{}%", a)))
    .bind(query.start)
    .bind(query.end)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(logs) => HttpResponse::Ok().json(logs),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// ─── Theme / Preferences ─────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Theme {
    pub id: Uuid,
    pub name: String,
    pub config: serde_json::Value,
    pub is_default: bool,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateThemeRequest {
    pub name: String,
    pub config: serde_json::Value,
}

async fn list_themes(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Theme>(
        "SELECT * FROM themes ORDER BY is_default DESC, created_at ASC",
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(themes) => HttpResponse::Ok().json(themes),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn create_theme(
    pool: web::Data<PgPool>,
    req: web::Json<CreateThemeRequest>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Theme>(
        "INSERT INTO themes (name, config) VALUES ($1, $2) RETURNING *",
    )
    .bind(&req.name)
    .bind(&req.config)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(theme) => HttpResponse::Created().json(theme),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FrontendPreferences {
    pub user_id: Uuid,
    pub theme_id: Option<Uuid>,
    pub language: String,
    pub config: serde_json::Value,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePreferencesRequest {
    pub theme_id: Option<Uuid>,
    pub language: Option<String>,
    pub config: Option<serde_json::Value>,
}

async fn get_preferences(
    pool: web::Data<PgPool>,
    user_id: web::Path<Uuid>,
) -> impl Responder {
    let result = sqlx::query_as::<_, FrontendPreferences>(
        "SELECT * FROM frontend_preferences WHERE user_id = $1",
    )
    .bind(*user_id)
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(prefs)) => HttpResponse::Ok().json(prefs),
        Ok(None) => {
            // Return defaults if no preferences saved yet
            HttpResponse::Ok().json(serde_json::json!({
                "user_id": user_id.to_string(),
                "theme_id": null,
                "language": "en",
                "config": {},
                "updated_at": Utc::now()
            }))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

async fn upsert_preferences(
    pool: web::Data<PgPool>,
    user_id: web::Path<Uuid>,
    req: web::Json<UpdatePreferencesRequest>,
) -> impl Responder {
    let result = sqlx::query(
        "INSERT INTO frontend_preferences (user_id, theme_id, language, config, updated_at)
         VALUES ($1, $2, COALESCE($3, 'en'), COALESCE($4, '{}'), NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET theme_id   = COALESCE(EXCLUDED.theme_id, frontend_preferences.theme_id),
             language   = COALESCE(EXCLUDED.language, frontend_preferences.language),
             config     = COALESCE(EXCLUDED.config, frontend_preferences.config),
             updated_at = NOW()",
    )
    .bind(*user_id)
    .bind(req.theme_id)
    .bind(&req.language)
    .bind(&req.config)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Preferences saved"})),
        Err(e) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg
        // As-run logs
        .route("/as-run", web::get().to(get_as_run_logs))
        // Audit logs
        .route("/audit-logs", web::get().to(get_audit_logs))
        // Themes
        .route("/themes", web::get().to(list_themes))
        .route("/themes", web::post().to(create_theme))
        // User preferences
        .route("/preferences/{user_id}", web::get().to(get_preferences))
        .route("/preferences/{user_id}", web::put().to(upsert_preferences));
}
