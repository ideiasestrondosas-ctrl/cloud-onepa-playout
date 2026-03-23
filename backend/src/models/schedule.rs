use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Schedule {
    pub id: Uuid,
    pub playlist_id: Uuid,
    pub date: NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub repeat_pattern: Option<String>, // daily, weekly, monthly
    pub playlist_name: Option<String>,
    pub playlist_content: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channel_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSchedule {
    pub playlist_id: Uuid,
    pub date: NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub repeat_pattern: Option<String>,
    pub channel_id: Option<Uuid>,
}
