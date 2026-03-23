use crate::models::template::{CreateTemplateRequest, Template};
use actix_web::{web, HttpResponse, Responder};
use sqlx::PgPool;
use uuid::Uuid;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct TemplateQuery {
    pub channel_id: Option<Uuid>,
}

async fn get_templates(
    pool: web::Data<PgPool>,
    query: web::Query<TemplateQuery>,
) -> impl Responder {
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = query.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, Template>(
        "SELECT * FROM templates WHERE channel_id = $1 ORDER BY created_at DESC"
    )
    .bind(channel_id)
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
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = req.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, Template>(
        "INSERT INTO templates (name, description, structure, duration, channel_id) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.structure)
    .bind(req.duration)
    .bind(channel_id)
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

async fn update_template(
    template_id: web::Path<Uuid>,
    template_data: web::Json<CreateTemplateRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query(
        "UPDATE templates 
         SET name = $1, description = $2, structure = $3, duration = $4
         WHERE id = $5",
    )
    .bind(&template_data.name)
    .bind(&template_data.description)
    .bind(&template_data.structure)
    .bind(template_data.duration)
    .bind(template_id.into_inner())
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "Template updated successfully"}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Template not found"})),
        Err(e) => {
            log::error!("Failed to update template: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to update template"}))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_templates))
        .route("", web::post().to(create_template))
        .route("/{id}", web::put().to(update_template))
        .route("/{id}", web::delete().to(delete_template));
}
