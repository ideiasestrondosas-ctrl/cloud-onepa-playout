use crate::models::playlist::Playlist;
use crate::models::schedule::Schedule;
use crate::models::settings::Settings;
use crate::services::ffmpeg::FFmpegService;
use chrono::{Datelike, Local, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::process::Child;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayoutStatus {
    pub status: String, // playing, stopped, paused
    pub current_clip: Option<ClipInfo>,
    pub next_clips: Vec<ClipInfo>,
    pub uptime: i64,
    pub clips_played_today: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfo {
    pub filename: String,
    pub duration: f64,
    pub position: f64,
}

pub struct PlayoutEngine {
    pool: PgPool,
    current_process: Arc<Mutex<Option<Child>>>,
    current_clip_id: Arc<Mutex<Option<String>>>,
    pub is_running: Arc<Mutex<bool>>,
    pub last_error: Arc<Mutex<Option<String>>>,
    pub status: Arc<Mutex<PlayoutStatus>>,
    engine_start_time: Arc<Mutex<Option<chrono::DateTime<Local>>>>,
}

impl PlayoutEngine {
    pub fn new(pool: PgPool) -> Self {
        PlayoutEngine {
            pool,
            current_process: Arc::new(Mutex::new(None)),
            current_clip_id: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
            last_error: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(PlayoutStatus {
                status: "stopped".to_string(),
                current_clip: None,
                next_clips: Vec::new(),
                uptime: 0,
                clips_played_today: 0,
            })),
            engine_start_time: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn set_running(&self, running: bool) {
        let mut r = self.is_running.lock().await;
        *r = running;

        // Persist to DB
        let _ = sqlx::query("UPDATE settings SET is_running = $1 WHERE id = TRUE")
            .bind(running)
            .execute(&self.pool)
            .await;

        let mut status = self.status.lock().await;
        let mut start_time = self.engine_start_time.lock().await;

        if !running {
            status.status = "stopped".to_string();
            status.current_clip = None;
            status.next_clips.clear();
            *start_time = None;
            self.stop_process().await;
        } else {
            status.status = "playing".to_string();
            if start_time.is_none() {
                *start_time = Some(Local::now());
            }
            // Clear last error when manually starting
            let mut err = self.last_error.lock().await;
            *err = None;
            let _ = sqlx::query("UPDATE settings SET last_error = NULL WHERE id = TRUE")
                .execute(&self.pool)
                .await;
        }
    }

    pub async fn get_running(&self) -> bool {
        *self.is_running.lock().await
    }

    pub async fn start(self: Arc<Self>) {
        log::info!("Playout Engine started");

        // Load initial state from DB
        if let Ok(settings) =
            sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
                .fetch_one(&self.pool)
                .await
        {
            let mut r = self.is_running.lock().await;
            *r = settings.is_running;
            let mut err = self.last_error.lock().await;
            *err = settings.last_error;
        }

        loop {
            if let Err(e) = self.tick().await {
                log::error!("Engine tick error: {}", e);
                let mut err = self.last_error.lock().await;
                *err = Some(e.clone());

                // Persist error to DB
                let _ = sqlx::query("UPDATE settings SET last_error = $1 WHERE id = TRUE")
                    .bind(&e)
                    .execute(&self.pool)
                    .await;
            }
            sleep(Duration::from_secs(5)).await;
        }
    }

    async fn tick(&self) -> Result<(), String> {
        // Check if engine is enabled
        if !*self.is_running.lock().await {
            return Ok(());
        }

        // Update uptime
        {
            let mut status = self.status.lock().await;
            if let Some(start) = *self.engine_start_time.lock().await {
                status.uptime = (Local::now() - start).num_seconds();
            }
        }

        let now = Local::now();
        let current_date = now.date_naive();
        let current_time = now.time();

        // 1. Fetch settings
        let settings = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        // 2. Find scheduled playlist (Better logic)
        // a. Today's direct schedule
        let mut schedule = sqlx::query_as::<_, Schedule>(
            "SELECT * FROM schedule WHERE date = $1 ORDER BY start_time DESC",
        )
        .bind(current_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // b. Daily repeats
        let daily = sqlx::query_as::<_, Schedule>(
            "SELECT * FROM schedule WHERE repeat_pattern = 'daily' AND date <= $1 ORDER BY start_time DESC"
        )
        .bind(current_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        schedule.extend(daily);

        // c. Weekly repeats
        let day_of_week = current_date.weekday().num_days_from_monday();
        let weekly = sqlx::query_as::<_, Schedule>(
            "SELECT * FROM schedule WHERE repeat_pattern = 'weekly' AND EXTRACT(DOW FROM date) = $1 AND date <= $2 ORDER BY start_time DESC"
        )
        .bind(day_of_week as i32)
        .bind(current_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        schedule.extend(weekly);

        // Sort all by start_time descending to find the most recent one that started
        schedule.sort_by(|a, b| b.start_time.cmp(&a.start_time));

        let mut active_playlist_id = None;
        let mut playlist_start_time = None;

        for s in schedule {
            if let Some(st) = s.start_time {
                if current_time >= st {
                    active_playlist_id = Some(s.playlist_id);
                    playlist_start_time = Some(st);
                    log::info!(
                        "Found active schedule starting at {} for playlist ID: {}",
                        st,
                        s.playlist_id
                    );
                    break;
                }
            }
        }

        if let Some(pid) = active_playlist_id {
            log::debug!("Loading playlist {}", pid);
            let playlist = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
                .bind(pid)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| e.to_string())?;

            self.play_from_playlist(playlist, playlist_start_time.unwrap(), &settings)
                .await?;
        } else {
            // Log once if we enter idle state to avoid spam
            {
                let status = self.status.lock().await;
                if status.status != "stopped" && status.status != "idle" {
                    log::info!("No active schedule found. Stopping playout.");
                }
            }

            let mut status = self.status.lock().await;
            status.status = "idle".to_string(); // Change to idle instead of stopped so we know engine is on
            status.current_clip = None;
            status.next_clips.clear();
            self.stop_process().await;
        }

        Ok(())
    }

    async fn play_from_playlist(
        &self,
        playlist: Playlist,
        start_time: NaiveTime,
        settings: &Settings,
    ) -> Result<(), String> {
        let now = Local::now().time();
        let seconds_since_start = (now - start_time).num_seconds();

        if seconds_since_start < 0 {
            return Ok(());
        }

        let items = if playlist.content.is_array() {
            playlist.content.as_array().unwrap()
        } else if let Some(program) = playlist.content.get("program").and_then(|p| p.as_array()) {
            program
        } else {
            return Err("Invalid playlist content".to_string());
        };

        let mut accumulated_time = 0.0;
        let mut target_item = None;
        let mut offset = 0.0;
        let mut target_index = 0;

        for (i, item) in items.iter().enumerate() {
            let duration = item["duration"].as_f64().unwrap_or(0.0);
            if (seconds_since_start as f64) < (accumulated_time + duration) {
                target_item = Some(item);
                offset = (seconds_since_start as f64) - accumulated_time;
                target_index = i;
                break;
            }
            accumulated_time += duration;
        }

        if let Some(item) = target_item {
            let clip_path = item["source"]
                .as_str()
                .or_else(|| item["path"].as_str())
                .ok_or("Missing clip path")?;

            let filename = std::path::Path::new(clip_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(clip_path)
                .to_string();

            let clip_id = item["id"].as_str().unwrap_or(clip_path);
            let duration = item["duration"].as_f64().unwrap_or(0.0);

            // Update Status
            {
                let mut status = self.status.lock().await;

                // Only log if changing clip
                if status
                    .current_clip
                    .as_ref()
                    .map(|c| c.filename != filename)
                    .unwrap_or(true)
                {
                    log::info!("Now playing: {} (offset: {:.2}s)", filename, offset);
                }

                status.status = "playing".to_string();
                status.current_clip = Some(ClipInfo {
                    filename: filename.clone(),
                    duration,
                    position: offset,
                });

                // Set next clips
                status.next_clips = items
                    .iter()
                    .skip(target_index + 1)
                    .take(5)
                    .map(|it| {
                        let it_path = it["source"]
                            .as_str()
                            .or_else(|| it["path"].as_str())
                            .unwrap_or("");
                        let it_filename = std::path::Path::new(it_path)
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or(it_path)
                            .to_string();
                        ClipInfo {
                            filename: it_filename,
                            duration: it["duration"].as_f64().unwrap_or(0.0),
                            position: 0.0,
                        }
                    })
                    .collect();
            }

            let mut current_id = self.current_clip_id.lock().await;
            let mut proc_lock = self.current_process.lock().await;

            let is_running = if let Some(ref mut child) = *proc_lock {
                match child.try_wait() {
                    Ok(None) => true,
                    _ => false,
                }
            } else {
                false
            };

            if !is_running || current_id.as_ref() != Some(&clip_id.to_string()) {
                log::info!("Switching/Starting clip: {} at offset {}", clip_id, offset);

                if let Some(mut child) = proc_lock.take() {
                    child.kill().ok();
                }

                let ffmpeg = FFmpegService::new();
                let hls_preview_path = "/var/lib/onepa-playout/hls";
                std::fs::create_dir_all(hls_preview_path).ok();

                let mut output_url = settings.output_url.clone();
                if output_url.contains("localhost") || output_url.contains("127.0.0.1") {
                    output_url = output_url
                        .replace("localhost", "host.docker.internal")
                        .replace("127.0.0.1", "host.docker.internal");
                }

                let child = ffmpeg.start_stream(
                    clip_path,
                    &output_url,
                    offset,
                    &settings.resolution,
                    &settings.video_bitrate,
                    &settings.audio_bitrate,
                    Some(hls_preview_path),
                )?;

                *proc_lock = Some(child);
                *current_id = Some(clip_id.to_string());
                log::info!("FFmpeg process started successfully for clip: {}", filename);

                // Increment clips played today (simplified)
                let mut status = self.status.lock().await;
                status.clips_played_today += 1;
            }
        } else {
            // Playlist finished or gap
            log::info!("Playlist finished or gap detected. Entering idle state.");
            let mut status = self.status.lock().await;
            status.status = "idle".to_string();
            status.current_clip = None;
            status.next_clips.clear();
            self.stop_process().await;
        }

        Ok(())
    }

    async fn stop_process(&self) {
        let mut proc_lock = self.current_process.lock().await;
        if let Some(mut child) = proc_lock.take() {
            log::info!("Stopping playout process");
            child.kill().ok();
        }
        let mut current_id = self.current_clip_id.lock().await;
        *current_id = None;
    }
}
