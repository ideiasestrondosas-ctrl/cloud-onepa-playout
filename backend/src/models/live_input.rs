use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveInput {
    pub id: Uuid,
    pub name: String,
    pub protocol: String,  // rtmp, srt, webrtc, ndi, sdi
    pub url: String,
    pub port: Option<i32>,
    pub status: String,    // active, inactive, error, connecting
    pub health_status: serde_json::Value,
    pub channel_id: Option<Uuid>,
    pub preview_url: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLiveInput {
    pub name: String,
    pub protocol: String,
    pub url: String,
    pub port: Option<i32>,
    pub channel_id: Option<Uuid>,
    pub preview_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLiveInput {
    pub name: Option<String>,
    pub protocol: Option<String>,
    pub url: Option<String>,
    pub port: Option<i32>,
    pub status: Option<String>,
    pub health_status: Option<serde_json::Value>,
    pub channel_id: Option<Uuid>,
    pub preview_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialStream {
    pub id: Uuid,
    pub name: String,
    pub platform: String,  // youtube, facebook
    pub stream_key: Option<String>,
    pub stream_url: Option<String>,
    pub status: String,    // active, inactive, error, connecting
    pub health_status: serde_json::Value,
    pub channel_id: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSocialStream {
    pub name: String,
    pub platform: String,
    pub stream_key: Option<String>,
    pub stream_url: Option<String>,
    pub channel_id: Option<Uuid>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSocialStream {
    pub name: Option<String>,
    pub platform: Option<String>,
    pub stream_key: Option<String>,
    pub stream_url: Option<String>,
    pub status: Option<String>,
    pub health_status: Option<serde_json::Value>,
    pub channel_id: Option<Uuid>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveInputRoute {
    pub id: Uuid,
    pub live_input_id: Uuid,
    pub channel_id: Uuid,
    pub priority: i32,
    pub is_active: bool,
    pub switch_on_loss: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLiveInputRoute {
    pub live_input_id: Uuid,
    pub channel_id: Uuid,
    pub priority: Option<i32>,
    pub is_active: Option<bool>,
    pub switch_on_loss: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveInputStatus {
    pub input_id: Uuid,
    pub status: String,
    pub bitrate: Option<u64>,
    pub resolution: Option<String>,
    pub fps: Option<f64>,
    pub audio_codec: Option<String>,
    pub video_codec: Option<String>,
    pub errors: Option<Vec<String>>,
}
