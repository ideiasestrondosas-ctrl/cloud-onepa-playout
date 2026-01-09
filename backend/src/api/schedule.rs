use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::schedule::Schedule;

#[derive(Deserialize)]
pub struct ScheduleQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

async fn list_schedule(
    query: web::Query<ScheduleQuery>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let mut sql = String::from(
        "SELECT s.*, p.name as playlist_name 
         FROM schedule s 
         JOIN playlists p ON s.playlist_id = p.id 
         WHERE 1=1",
    );

    if let Some(ref start_date) = query.start_date {
        sql.push_str(&format!(" AND s.date >= '{}'", start_date));
    }

    if let Some(ref end_date) = query.end_date {
        sql.push_str(&format!(" AND s.date <= '{}'", end_date));
    }

    sql.push_str(" ORDER BY s.date ASC");

    let result = sqlx::query_as::<_, Schedule>(&sql)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(schedules) => HttpResponse::Ok().json(serde_json::json!({
            "schedules": schedules
        })),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch schedule"})),
    }
}

#[derive(Deserialize)]
pub struct CreateScheduleRequest {
    pub playlist_id: Uuid,
    pub date: String,
    pub start_time: Option<String>,
    pub repeat_pattern: Option<String>,
}

async fn create_schedule(
    req: web::Json<CreateScheduleRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    // Verify playlist exists
    let playlist_check = sqlx::query("SELECT id FROM playlists WHERE id = $1")
        .bind(&req.playlist_id)
        .fetch_optional(pool.get_ref())
        .await;

    if playlist_check.is_err() || playlist_check.unwrap().is_none() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Playlist not found"}));
    }

    let date = match chrono::NaiveDate::parse_from_str(&req.date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Invalid date format. Use YYYY-MM-DD"}))
        }
    };

    let start_time = req.start_time.as_ref().and_then(|t| {
        chrono::NaiveTime::parse_from_str(t, "%H:%M:%S")
            .ok()
            .or_else(|| chrono::NaiveTime::parse_from_str(t, "%H:%M").ok())
    });

    let result = sqlx::query_as::<_, Schedule>(
        "INSERT INTO schedule (playlist_id, date, start_time, repeat_pattern) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *",
    )
    .bind(&req.playlist_id)
    .bind(date)
    .bind(start_time)
    .bind(&req.repeat_pattern)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(schedule) => HttpResponse::Created().json(schedule),
        Err(e) => {
            log::error!("Failed to create schedule: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to create schedule"}))
        }
    }
}

async fn delete_schedule(schedule_id: web::Path<Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query("DELETE FROM schedule WHERE id = $1")
        .bind(schedule_id.into_inner())
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({"message": "Schedule deleted successfully"}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Schedule not found"})),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to delete schedule"})),
    }
}

#[derive(Deserialize)]
pub struct GetPlaylistForDateRequest {
    pub date: String,
}

async fn get_playlist_for_date(
    req: web::Query<GetPlaylistForDateRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let date = match chrono::NaiveDate::parse_from_str(&req.date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Invalid date format. Use YYYY-MM-DD"}))
        }
    };

    // First, try to find a direct schedule for this date
    let direct_schedule = sqlx::query(
        "SELECT p.* FROM playlists p 
         JOIN schedule s ON p.id = s.playlist_id 
         WHERE s.date = $1 AND s.repeat_pattern IS NULL 
         LIMIT 1",
    )
    .bind(date)
    .fetch_optional(pool.get_ref())
    .await;

    if let Ok(Some(_)) = direct_schedule {
        return HttpResponse::Ok().json(serde_json::json!({
            "found": true,
            "source": "direct_schedule"
        }));
    }

    // Check for repeating schedules
    let day_of_week = date.weekday().num_days_from_monday();

    // Check daily repeats
    let daily_schedule = sqlx::query(
        "SELECT p.* FROM playlists p 
         JOIN schedule s ON p.id = s.playlist_id 
         WHERE s.repeat_pattern = 'daily' AND s.date <= $1 
         ORDER BY s.date DESC 
         LIMIT 1",
    )
    .bind(date)
    .fetch_optional(pool.get_ref())
    .await;

    if let Ok(Some(_)) = daily_schedule {
        return HttpResponse::Ok().json(serde_json::json!({
            "found": true,
            "source": "daily_repeat"
        }));
    }

    // Check weekly repeats (same day of week)
    let weekly_schedule = sqlx::query(
        "SELECT p.* FROM playlists p 
         JOIN schedule s ON p.id = s.playlist_id 
         WHERE s.repeat_pattern = 'weekly' 
         AND EXTRACT(DOW FROM s.date) = $1 
         AND s.date <= $2 
         ORDER BY s.date DESC 
         LIMIT 1",
    )
    .bind(day_of_week as i32)
    .bind(date)
    .fetch_optional(pool.get_ref())
    .await;

    if let Ok(Some(_)) = weekly_schedule {
        return HttpResponse::Ok().json(serde_json::json!({
            "found": true,
            "source": "weekly_repeat"
        }));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "found": false,
        "message": "No playlist scheduled for this date"
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_schedule))
        .route("", web::post().to(create_schedule))
        .route("/{id}", web::delete().to(delete_schedule))
        .route("/for-date", web::get().to(get_playlist_for_date));
}
