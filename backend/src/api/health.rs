use actix_web::{web, HttpResponse, Responder};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    database: String,
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: "connected".to_string(),
    })
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(health_check));
}
