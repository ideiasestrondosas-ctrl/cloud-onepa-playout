use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Settings {
    pub id: bool,
    pub output_type: String,
    pub output_url: String,
    pub resolution: String,
    pub fps: String,
    pub video_bitrate: String,
    pub audio_bitrate: String,
    pub media_path: String,
    pub thumbnails_path: String,
    pub playlists_path: String,
    pub fillers_path: String,
    pub logo_path: Option<String>,
    pub logo_position: Option<String>,
    pub day_start: Option<String>,
    pub default_image_path: Option<String>,
    pub default_video_path: Option<String>,
    pub is_running: bool,
    pub last_error: Option<String>,
    pub overlay_enabled: bool,
    pub app_logo_path: Option<String>,
    pub channel_name: Option<String>,
    pub clips_played_today: Option<i32>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub output_type: Option<String>,
    pub output_url: Option<String>,
    pub resolution: Option<String>,
    pub fps: Option<String>,
    pub video_bitrate: Option<String>,
    pub audio_bitrate: Option<String>,
    pub media_path: Option<String>,
    pub thumbnails_path: Option<String>,
    pub playlists_path: Option<String>,
    pub fillers_path: Option<String>,
    pub logo_path: Option<String>,
    pub logo_position: Option<String>,
    pub day_start: Option<String>,
    pub default_image_path: Option<String>,
    pub default_video_path: Option<String>,
    pub overlay_enabled: Option<bool>,
    pub app_logo_path: Option<String>,
    pub channel_name: Option<String>,
    pub clips_played_today: Option<i32>,
}
