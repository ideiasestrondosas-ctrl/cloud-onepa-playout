use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Playlist {
    pub id: Uuid,
    pub name: String,
    pub date: Option<chrono::NaiveDate>,
    pub content: serde_json::Value, // JSON playlist structure
    pub total_duration: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaylist {
    pub name: String,
    pub date: Option<chrono::NaiveDate>,
    pub content: serde_json::Value,
}
