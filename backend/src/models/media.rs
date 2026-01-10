use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Media {
    pub id: Uuid,
    pub filename: String,
    pub path: String,
    pub media_type: String, // video, audio, image
    pub duration: Option<f64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub codec: Option<String>,
    pub bitrate: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub is_filler: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMedia {
    pub filename: String,
    pub path: String,
    pub media_type: String,
}
