use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct GraphicsLayer {
    pub id: i32,
    pub layer_type: String,
    pub name: String,
    pub enabled: bool,
    pub z_index: i32,
    pub position_x: i32,
    pub position_y: i32,
    pub anchor: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub opacity: f32,
    pub config: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGraphicsLayerRequest {
    pub layer_type: String,
    pub name: String,
    pub enabled: Option<bool>,
    pub z_index: Option<i32>,
    pub position_x: Option<i32>,
    pub position_y: Option<i32>,
    pub anchor: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub opacity: Option<f32>,
    pub config: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGraphicsLayerRequest {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub z_index: Option<i32>,
    pub position_x: Option<i32>,
    pub position_y: Option<i32>,
    pub anchor: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub opacity: Option<f32>,
    pub config: Option<serde_json::Value>,
}
