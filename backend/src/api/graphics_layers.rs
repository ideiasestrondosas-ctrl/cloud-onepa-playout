use crate::models::graphics_layer::{CreateGraphicsLayerRequest, GraphicsLayer, UpdateGraphicsLayerRequest};
use actix_web::{web, HttpResponse, Responder};
use sqlx::PgPool;
use serde::Deserialize;
use uuid::Uuid;

/// Touch settings.graphics_updated_at so the engine detects the change and
/// restarts the FFmpeg overlay pipeline on next tick.
async fn touch_graphics_timestamp(pool: &PgPool) {
    let _ = sqlx::query(
        "UPDATE settings SET graphics_updated_at = NOW() WHERE id = TRUE"
    )
    .execute(pool)
    .await;
}

#[derive(Deserialize)]
pub struct LayerQuery {
    pub channel_id: Option<Uuid>,
}

// List all graphics layers
async fn list_layers(
    pool: web::Data<PgPool>,
    query: web::Query<LayerQuery>,
) -> impl Responder {
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = query.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, GraphicsLayer>(
        "SELECT * FROM graphics_layers WHERE channel_id = $1 ORDER BY z_index ASC, id ASC"
    )
    .bind(channel_id)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(layers) => HttpResponse::Ok().json(layers),
        Err(e) => {
            log::error!("Failed to fetch graphics layers: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to fetch graphics layers"}))
        }
    }
}

// Create a new graphics layer
async fn create_layer(
    req: web::Json<CreateGraphicsLayerRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let default_channel: Uuid = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let channel_id = req.channel_id.unwrap_or(default_channel);

    let result = sqlx::query_as::<_, GraphicsLayer>(
        "INSERT INTO graphics_layers 
        (layer_type, name, enabled, z_index, position_x, position_y, anchor, width, height, opacity, config, channel_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *"
    )
    .bind(&req.layer_type)
    .bind(&req.name)
    .bind(req.enabled.unwrap_or(true))
    .bind(req.z_index.unwrap_or(0))
    .bind(req.position_x.unwrap_or(0))
    .bind(req.position_y.unwrap_or(0))
    .bind(req.anchor.as_deref().unwrap_or("top-left"))
    .bind(req.width)
    .bind(req.height)
    .bind(req.opacity.unwrap_or(1.0))
    .bind(&req.config)
    .bind(channel_id)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(layer) => {
            touch_graphics_timestamp(pool.get_ref()).await;
            HttpResponse::Ok().json(layer)
        },
        Err(e) => {
            log::error!("Failed to create graphics layer: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Failed to create layer: {}", e)}))
        }
    }
}

// Update an existing graphics layer
async fn update_layer(
    layer_id: web::Path<i32>,
    req: web::Json<UpdateGraphicsLayerRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let mut sql = String::from("UPDATE graphics_layers SET updated_at = CURRENT_TIMESTAMP");
    let mut counter = 1;

    macro_rules! add_field {
        ($field:expr, $col:expr) => {
            if $field.is_some() {
                sql.push_str(&format!(", {} = ${}", $col, counter));
                counter += 1;
            }
        };
    }

    add_field!(req.name, "name");
    add_field!(req.enabled, "enabled");
    add_field!(req.z_index, "z_index");
    add_field!(req.position_x, "position_x");
    add_field!(req.position_y, "position_y");
    add_field!(req.anchor, "anchor");
    add_field!(req.width, "width");
    add_field!(req.height, "height");
    add_field!(req.opacity, "opacity");
    add_field!(req.config, "config");

    sql.push_str(&format!(" WHERE id = ${} RETURNING *", counter));

    let mut query = sqlx::query_as::<_, GraphicsLayer>(&sql);

    macro_rules! bind_field {
        ($field:expr) => {
            if let Some(ref val) = $field {
                query = query.bind(val);
            }
        };
        (bool, $field:expr) => {
            if let Some(val) = $field {
                query = query.bind(val);
            }
        };
        (num, $field:expr) => {
            if let Some(val) = $field {
                query = query.bind(val);
            }
        };
    }

    bind_field!(req.name);
    bind_field!(bool, req.enabled);
    bind_field!(num, req.z_index);
    bind_field!(num, req.position_x);
    bind_field!(num, req.position_y);
    bind_field!(req.anchor);
    bind_field!(num, req.width);
    bind_field!(num, req.height);
    bind_field!(num, req.opacity);
    bind_field!(req.config);

    query = query.bind(*layer_id);

    let result = query.fetch_one(pool.get_ref()).await;

    match result {
        Ok(layer) => {
            touch_graphics_timestamp(pool.get_ref()).await;
            HttpResponse::Ok().json(layer)
        },
        Err(e) => {
            log::error!("Failed to update graphics layer: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("Failed to update layer: {}", e)}))
        }
    }
}

// Delete a graphics layer
async fn delete_layer(layer_id: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query("DELETE FROM graphics_layers WHERE id = $1")
        .bind(*layer_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => {
            touch_graphics_timestamp(pool.get_ref()).await;
            HttpResponse::Ok().json(serde_json::json!({"message": "Layer deleted successfully"}))
        },
        Err(e) => {
            log::error!("Failed to delete graphics layer: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to delete layer"}))
        }
    }
}

// Toggle layer enabled state
async fn toggle_layer(layer_id: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, GraphicsLayer>(
        "UPDATE graphics_layers SET enabled = NOT enabled, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *"
    )
    .bind(*layer_id)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(layer) => {
            touch_graphics_timestamp(pool.get_ref()).await;
            HttpResponse::Ok().json(layer)
        },
        Err(e) => {
            log::error!("Failed to toggle graphics layer: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to toggle layer"}))
        }
    }
}

// Update layer position
#[derive(Deserialize)]
pub struct UpdatePositionRequest {
    pub position_x: i32,
    pub position_y: i32,
}

async fn update_position(
    id: web::Path<i32>,
    req: web::Json<UpdatePositionRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query_as::<_, GraphicsLayer>(
        "UPDATE graphics_layers SET position_x = $1, position_y = $2 WHERE id = $3 RETURNING *"
    )
    .bind(req.position_x)
    .bind(req.position_y)
    .bind(id.into_inner())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(layer) => {
            // NOTE: We intentionally do NOT call touch_graphics_timestamp here.
            // Position changes are saved to DB immediately, but do NOT trigger an FFmpeg
            // restart. This prevents the dashboard from flickering to "starting" on every
            // pixel moved during drag-and-drop. The new position will take effect on the
            // next natural FFmpeg restart (layer toggle, settings change, or manual restart).
            HttpResponse::Ok().json(layer)
        },
        Err(e) => {
            log::error!("Failed to update layer position: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to update position"}))
        }
    }
}

// Bulk reorder layers
#[derive(Deserialize)]
pub struct ReorderLayersRequest {
    pub layer_ids: Vec<i32>,
}

async fn reorder_layers(
    req: web::Json<ReorderLayersRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let total = req.layer_ids.len();
    for (index, layer_id) in req.layer_ids.iter().enumerate() {
        let z_index = (total - 1 - index) as i32;
        let result = sqlx::query(
            "UPDATE graphics_layers SET z_index = $1 WHERE id = $2"
        )
        .bind(z_index)
        .bind(layer_id)
        .execute(pool.get_ref())
        .await;

        if let Err(e) = result {
            log::error!("Failed to update z_index for layer {}: {}", layer_id, e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to reorder layers"}));
        }
    }

    touch_graphics_timestamp(pool.get_ref()).await;
    HttpResponse::Ok().json(serde_json::json!({"message": "Layers reordered successfully"}))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_layers))
        .route("", web::post().to(create_layer))
        .route("/reorder", web::put().to(reorder_layers))
        .route("/{id}/toggle", web::put().to(toggle_layer))
        .route("/{id}/position", web::put().to(update_position))
        .route("/{id}", web::put().to(update_layer))
        .route("/{id}", web::delete().to(delete_layer));
}
