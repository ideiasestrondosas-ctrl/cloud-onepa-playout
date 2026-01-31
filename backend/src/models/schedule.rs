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
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSchedule {
    pub playlist_id: Uuid,
    pub date: NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub repeat_pattern: Option<String>,
}
