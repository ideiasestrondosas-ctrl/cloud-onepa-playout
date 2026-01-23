use crate::models::playlist::{Playlist, PlaylistContent, PlaylistItem};
use crate::models::schedule::Schedule;
use crate::models::settings::Settings;
use actix_web::{web, HttpResponse, Responder};
use chrono::{Datelike, Utc};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct PlaylistQuery {
    pub name: Option<String>,
    pub date: Option<String>,
}

#[derive(Deserialize)]
pub struct CreatePlaylistRequest {
    pub name: String,
    pub content: serde_json::Value,
}

#[derive(Deserialize)]
pub struct ValidatePlaylistRequest {
    pub content: serde_json::Value,
}

#[derive(Deserialize)]
pub struct UpdatePlaylistRequest {
    pub name: Option<String>,
    pub content: Option<serde_json::Value>,
}

async fn list_playlists(
    pool: web::Data<PgPool>,
    query: web::Query<PlaylistQuery>,
) -> impl Responder {
    let result = if let Some(name) = &query.name {
        sqlx::query_as::<_, Playlist>(
            "SELECT * FROM playlists WHERE name ILIKE $1 ORDER BY name ASC",
        )
        .bind(format!("%{}%", name))
        .fetch_all(pool.get_ref())
        .await
    } else if let Some(date_str) = &query.date {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            let dow = date.weekday().num_days_from_monday() as i32;

            // 1. Fetch all relevant scheduled slots joined with playlist data
            // We need individual slots to calculate exact start times for recurring events
            // 1. Fetch all relevant scheduled slots joined with playlist data
            // We use UNION to combine specific date matches with recurring pattern matches
            // This ensures we only get playlists that are ACTUAL scheduled for this day
            let rows = sqlx::query_as::<_, (Uuid, String, serde_json::Value, f64, chrono::NaiveTime, String)>(
                "SELECT p.id, p.name, p.content, p.total_duration, s.start_time, s.repeat_pattern
                 FROM playlists p
                 JOIN schedule s ON p.id = s.playlist_id
                 WHERE 
                    -- Single date match
                    (s.repeat_pattern = 'none' AND s.date = $1)
                    OR
                    -- Daily match (started on or before today)
                    (s.repeat_pattern = 'daily' AND s.date <= $1)
                    OR
                    -- Weekly match (same day of week, started on or before today)
                    (s.repeat_pattern = 'weekly' AND (EXTRACT(DOW FROM s.date) + 6)::int % 7 = $2 AND s.date <= $1)
                 
                 -- Filter out potential duplicates or inactive if we had an active flag (we rely on date logic)
                 ORDER BY s.start_time ASC",
            )
            .bind(date)
            .bind(dow)
            .fetch_all(pool.get_ref())
            .await;

            match rows {
                Ok(rows) => {
                    // Group by Playlist ID to merge multiple occurrences into one "EPG Row"
                    // key: playlist_id, value: (PlaylistBase, Vec<PlaylistItem>)
                    let mut playlist_map: std::collections::HashMap<
                        Uuid,
                        (String, f64, Vec<PlaylistItem>),
                    > = std::collections::HashMap::new();

                    for (id, name, content_val, total_dur, start_time, _) in rows {
                        // Parse content
                        let items = if let Ok(c) =
                            serde_json::from_value::<PlaylistContent>(content_val.clone())
                        {
                            c.program
                        } else if let Ok(i) =
                            serde_json::from_value::<Vec<PlaylistItem>>(content_val.clone())
                        {
                            i
                        } else {
                            vec![]
                        };

                        // Calculate items with absolute time for this slot
                        let base_dt = chrono::NaiveDateTime::new(date, start_time);
                        let mut current_dt = base_dt;

                        let mut scheduled_items = Vec::new();
                        for item in items {
                            let duration = item.duration;
                            let item_end_dt =
                                current_dt + chrono::Duration::seconds(duration as i64);

                            let mut new_item = item.clone();
                            // Generate a unique ID for React keys by appending a suffix
                            // We use Uuid since rand is not in dependencies
                            let suffix = uuid::Uuid::new_v4().to_string();
                            let suffix = &suffix[0..6];

                            if let Some(orig_id) = item.id {
                                new_item.id =
                                    Some(format!("{}_{}", orig_id, suffix.to_lowercase()));
                            } else {
                                new_item.id = Some(format!("item_{}", suffix.to_lowercase()));
                            }

                            new_item.start_time = Some(current_dt.format("%H:%M:%S").to_string());
                            new_item.end_time = Some(item_end_dt.format("%H:%M:%S").to_string());

                            scheduled_items.push(new_item);
                            current_dt = item_end_dt;
                        }

                        let entry = playlist_map
                            .entry(id)
                            .or_insert((name, total_dur, Vec::new()));
                        entry.2.extend(scheduled_items);
                    }

                    // Convert map back to Vec<Playlist>
                    let mut playlists: Vec<Playlist> = playlist_map
                        .into_iter()
                        .map(|(id, (name, total_duration, items))| {
                            Playlist {
                                id,
                                name,
                                date: Some(date),
                                content: serde_json::to_value(PlaylistContent { program: items })
                                    .unwrap_or(json!({})),
                                total_duration,
                                created_at: Utc::now(), // dummy
                                updated_at: Utc::now(), // dummy
                            }
                        })
                        .collect();

                    // Sort by name for consistency
                    playlists.sort_by(|a, b| a.name.cmp(&b.name));

                    Ok(playlists)
                }
                Err(e) => {
                    log::error!("Database error in EPG fetch: {}", e);
                    Err(e)
                }
            }
        } else {
            // If date parsing fails, log it and return empty rather than raw playlists
            log::warn!("Invalid date format received for EPG: {:?}", query.date);
            Ok(vec![])
        }
    } else {
        // This is the standard "List All Playlists" for the Playlists sidebar
        sqlx::query_as::<_, Playlist>("SELECT * FROM playlists ORDER BY name ASC")
            .fetch_all(pool.get_ref())
            .await
    };

    match result {
        Ok(playlists) => HttpResponse::Ok().json(json!({ "playlists": playlists })),
        Err(e) => {
            log::error!("Failed to fetch playlists: {}", e);
            HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch playlists"}))
        }
    }
}

async fn create_playlist(
    pool: web::Data<PgPool>,
    req: web::Json<CreatePlaylistRequest>,
) -> impl Responder {
    let result = sqlx::query_as::<_, Playlist>(
        "INSERT INTO playlists (name, content) VALUES ($1, $2) RETURNING *",
    )
    .bind(&req.name)
    .bind(&req.content)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(playlist) => HttpResponse::Created().json(playlist),
        Err(_) => {
            HttpResponse::InternalServerError().json(json!({"error": "Failed to create playlist"}))
        }
    }
}

async fn get_playlist(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    let result = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(*id)
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(playlist)) => HttpResponse::Ok().json(playlist),
        Ok(None) => HttpResponse::NotFound().json(json!({"error": "Playlist not found"})),
        Err(_) => {
            HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch playlist"}))
        }
    }
}

async fn update_playlist(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: web::Json<UpdatePlaylistRequest>,
) -> impl Responder {
    let mut query = String::from("UPDATE playlists SET ");
    let mut params_count = 0;

    if req.name.is_some() {
        query.push_str(&format!("name = ${}", params_count + 1));
        params_count += 1;
    }

    if req.content.is_some() {
        if params_count > 0 {
            query.push_str(", ");
        }
        query.push_str(&format!("content = ${}", params_count + 1));
        params_count += 1;
    }

    if params_count == 0 {
        return HttpResponse::BadRequest().json(json!({"error": "No fields to update"}));
    }

    query.push_str(&format!(" WHERE id = ${} RETURNING *", params_count + 1));

    let mut db_query = sqlx::query_as::<_, Playlist>(&query);
    if let Some(name) = &req.name {
        db_query = db_query.bind(name);
    }
    if let Some(content) = &req.content {
        db_query = db_query.bind(content);
    }
    db_query = db_query.bind(*id);

    match db_query.fetch_one(pool.get_ref()).await {
        Ok(playlist) => HttpResponse::Ok().json(playlist),
        Err(_) => {
            HttpResponse::InternalServerError().json(json!({"error": "Failed to update playlist"}))
        }
    }
}

async fn delete_playlist(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> impl Responder {
    // Check if playlist is in use in schedule
    let count: i64 =
        match sqlx::query_scalar("SELECT COUNT(*) FROM schedule WHERE playlist_id = $1")
            .bind(*id)
            .fetch_one(pool.get_ref())
            .await
        {
            Ok(c) => c,
            Err(_) => {
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to check usage"}))
            }
        };

    if count > 0 {
        return HttpResponse::BadRequest().json(json!({"error": "Playlist is in use in schedule"}));
    }

    let result = sqlx::query("DELETE FROM playlists WHERE id = $1")
        .bind(*id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(_) => {
            HttpResponse::InternalServerError().json(json!({"error": "Failed to delete playlist"}))
        }
    }
}

async fn validate_playlist(req: web::Json<ValidatePlaylistRequest>) -> impl Responder {
    let total_duration = calculate_duration_from_json(&req.content);
    let target_duration = 24.0 * 3600.0; // 24 hours in seconds

    let is_valid = (total_duration - target_duration).abs() < 1.0;
    HttpResponse::Ok().json(json!({
        "is_valid": is_valid,
        "total_duration": total_duration,
        "total_duration_formatted": format_duration(total_duration),
        "diff_seconds": total_duration - target_duration
    }))
}

fn format_duration(seconds: f64) -> String {
    let h = (seconds / 3600.0) as i32;
    let m = ((seconds % 3600.0) / 60.0) as i32;
    let s = (seconds % 60.0) as i32;
    format!("{:02}:{:02}:{:02}", h, m, s)
}

fn calculate_duration_from_json(content: &serde_json::Value) -> f64 {
    match serde_json::from_value::<PlaylistContent>(content.clone()) {
        Ok(p_content) => p_content.program.iter().map(|item| item.duration).sum(),
        Err(e) => {
            log::error!(
                "[EPG] Failed to parse playlist content to calculate duration: {}. value: {:?}",
                e,
                content
            );
            0.0
        }
    }
}

async fn get_epg(pool: web::Data<PgPool>) -> impl Responder {
    let settings = match sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(s) => s,
        Err(_) => {
            return HttpResponse::InternalServerError().body("Error fetching settings");
        }
    };

    let epg_days = settings.epg_days.unwrap_or(7);
    let now_local = Utc::now().with_timezone(&chrono::Local);
    let now_naive = now_local.naive_local();
    let timezone_offset = now_local.offset().to_string().replace(":", "");

    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<!DOCTYPE tv SYSTEM \"xmltv.dtd\">\n");
    xml.push_str("<tv generator-info-name=\"ONEPA Playout PRO\">\n");
    xml.push_str("  <channel id=\"onepa.1\">\n");
    xml.push_str(&format!(
        "    <display-name>{}</display-name>\n",
        escape_xml(settings.channel_name.as_deref().unwrap_or("ONEPA TV"))
    ));
    xml.push_str("  </channel>\n");

    for day_offset in 0..epg_days {
        let current_date = (now_local + chrono::Duration::days(day_offset as i64)).date_naive();
        let dow = current_date.weekday().num_days_from_monday() as i32;

        let query = "
            SELECT s.*, p.name as playlist_name 
            FROM schedule s
            LEFT JOIN playlists p ON s.playlist_id = p.id
            WHERE (s.date = $1 
               OR (s.repeat_pattern = 'daily' AND s.date <= $1)
               OR (s.repeat_pattern = 'weekly' AND (EXTRACT(DOW FROM s.date) + 6)::int % 7 = $2 AND s.date <= $1))
              AND NOT EXISTS (
                  SELECT 1 FROM schedule_exceptions se 
                  WHERE se.schedule_id = s.id AND se.exception_date = $1
              )
            ORDER BY s.start_time ASC";

        log::debug!(
            "[EPG] Fetching schedules for date: {}, dow: {}",
            current_date,
            dow
        );

        let schedules_result = sqlx::query_as::<_, Schedule>(query)
            .bind(current_date)
            .bind(dow)
            .fetch_all(pool.get_ref())
            .await;

        match schedules_result {
            Ok(schedules) => {
                log::debug!(
                    "[EPG] Found {} schedules for {}",
                    schedules.len(),
                    current_date
                );
                for schedule in schedules {
                    if let Ok(Some(playlist)) =
                        sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
                            .bind(schedule.playlist_id)
                            .fetch_optional(pool.get_ref())
                            .await
                    {
                        let start_time = schedule
                            .start_time
                            .unwrap_or_else(|| chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap());
                        let schedule_start = chrono::NaiveDateTime::new(current_date, start_time);

                        let duration = calculate_duration_from_json(&playlist.content);
                        // Defensive: If parsing failed or empty, default to 1 hour to ensure visibility
                        let effective_duration = if duration < 1.0 { 3600.0 } else { duration };

                        let schedule_end =
                            schedule_start + chrono::Duration::seconds(effective_duration as i64);

                        let is_active = now_naive >= schedule_start && now_naive < schedule_end;

                        // Only skip if it's a FUTURE day AND the schedule is in the past (sanity check)
                        // For day_offset 0 (today), we show everything scheduled for today for completeness.
                        if day_offset > 0 && schedule_end < now_naive {
                            continue;
                        }

                        log::debug!(
                            "[EPG] XML Entry: Playlist={}, Start={}, End={}, Active={}",
                            playlist.name,
                            schedule_start,
                            schedule_end,
                            is_active
                        );

                        append_playlist_to_xml(
                            &mut xml,
                            &playlist,
                            &schedule,
                            is_active,
                            now_naive,
                            current_date,
                            &timezone_offset,
                        );
                    }
                }
            }
            Err(e) => {
                log::error!("[EPG] Error fetching schedules for {}: {}", current_date, e);
            }
        }
    }

    xml.push_str("</tv>\n");
    HttpResponse::Ok().content_type("application/xml").body(xml)
}

fn append_playlist_to_xml(
    xml: &mut String,
    playlist: &Playlist,
    schedule: &Schedule,
    _is_active: bool,
    _now: chrono::NaiveDateTime,
    current_date: chrono::NaiveDate,
    timezone_offset: &str,
) {
    // Try parsing as PlaylistContent (object with 'program' field) or fallback to raw Vec<PlaylistItem> (raw array)
    let program = if let Ok(content) =
        serde_json::from_value::<PlaylistContent>(playlist.content.clone())
    {
        content.program
    } else if let Ok(items) = serde_json::from_value::<Vec<PlaylistItem>>(playlist.content.clone())
    {
        items
    } else {
        log::error!(
            "[EPG] Failed to parse playlist content for ID: {}. Content: {}",
            playlist.id,
            playlist.content
        );
        return;
    };

    let date_str = current_date.format("%Y%m%d").to_string();
    let base_start_time = schedule
        .start_time
        .unwrap_or_else(|| chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap());
    let mut current_start = chrono::NaiveDateTime::new(current_date, base_start_time);

    if program.is_empty() {
        // Fallback for empty playlist: show a single 1-hour block so it's not invisible
        let current_end = current_start + chrono::Duration::hours(1);
        let start_fmt = current_start.format("%H%M%S").to_string();
        let end_fmt = current_end.format("%H%M%S").to_string();

        xml.push_str(&format!(
            "  <programme start=\"{}{} {}\" stop=\"{}{} {}\" channel=\"onepa.1\">\n",
            date_str, start_fmt, timezone_offset, date_str, end_fmt, timezone_offset
        ));
        xml.push_str(&format!(
            "    <title lang=\"pt\">{} (Vazio)</title>\n",
            escape_xml(&playlist.name)
        ));
        xml.push_str("    <desc lang=\"pt\">Playlist sem clips configurados</desc>\n");
        xml.push_str("  </programme>\n");
    } else {
        for item in program {
            let current_end = current_start + chrono::Duration::seconds(item.duration as i64);

            let start_fmt = current_start.format("%H%M%S").to_string();
            let end_fmt = current_end.format("%H%M%S").to_string();

            let title = item
                .metadata
                .as_ref()
                .and_then(|m| m.get("title"))
                .and_then(|t| t.as_str())
                .or_else(|| item.filename.as_deref())
                .unwrap_or("Sem título");

            xml.push_str(&format!(
                "  <programme start=\"{}{} {}\" stop=\"{}{} {}\" channel=\"onepa.1\">\n",
                date_str, start_fmt, timezone_offset, date_str, end_fmt, timezone_offset
            ));
            xml.push_str(&format!(
                "    <title lang=\"pt\">{}</title>\n",
                escape_xml(title)
            ));
            xml.push_str(&format!(
                "    <desc lang=\"pt\">Clip da playlist: {}</desc>\n",
                escape_xml(&playlist.name)
            ));
            xml.push_str("  </programme>\n");

            current_start = current_end;
        }
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_playlists))
        .route("", web::post().to(create_playlist))
        .route("/epg.xml", web::get().to(get_epg))
        .route("/{id}", web::get().to(get_playlist))
        .route("/{id}", web::put().to(update_playlist))
        .route("/{id}", web::delete().to(delete_playlist))
        .route("/validate", web::post().to(validate_playlist));
}
