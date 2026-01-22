use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistItem {
    pub id: Option<String>, // Can be string or uuid from frontend
    pub filename: Option<String>,
    #[serde(alias = "source")]
    pub path: String,
    pub duration: f64,
    #[serde(default)]
    pub r#in: f64,
    #[serde(default)]
    pub out: f64,
    pub start_time: Option<String>, // HH:MM:SS
    pub end_time: Option<String>,   // HH:MM:SS
    pub media_type: Option<String>,
    pub metadata: Option<serde_json::Value>, // EPG metadata
    pub is_filler: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistContent {
    pub program: Vec<PlaylistItem>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Playlist {
    pub id: Uuid,
    pub name: String,
    pub date: Option<chrono::NaiveDate>,
    pub content: serde_json::Value, // We will keep Value for DB compatibility but parse it
    pub total_duration: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct CreatePlaylist {
    pub name: String,
    pub date: Option<chrono::NaiveDate>,
    pub content: serde_json::Value,
}
