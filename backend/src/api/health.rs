use actix_web::{web, HttpResponse, Responder};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    database: String,
}

pub async fn health_check(pool: web::Data<sqlx::PgPool>) -> impl Responder {
    let db_status = match sqlx::query("SELECT 1").execute(pool.get_ref()).await {
        Ok(_) => "connected",
        Err(e) => {
            log::error!("Health check database failure: {:?}", e);
            "disconnected"
        }
    };

    let status = if db_status == "connected" { "ok" } else { "degraded" };

    HttpResponse::Ok().json(HealthResponse {
        status: status.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: db_status.to_string(),
    })
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(health_check));
}
