use crate::models::template::{CreateTemplateRequest, Template};
use actix_web::{web, HttpResponse, Responder};
use sqlx::PgPool;
use uuid::Uuid;

async fn get_templates(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Template>("SELECT * FROM templates ORDER BY created_at DESC")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(templates) => HttpResponse::Ok().json(templates),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn create_template(
    pool: web::Data<PgPool>,
    req: web::Json<CreateTemplateRequest>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Template>(
        "INSERT INTO templates (name, description, structure, duration) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.structure)
    .bind(req.duration)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(template) => HttpResponse::Created().json(template),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

async fn delete_template(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query("DELETE FROM templates WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Template deleted"})),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_templates))
        .route("", web::post().to(create_template))
        .route("/{id}", web::delete().to(delete_template));
}
