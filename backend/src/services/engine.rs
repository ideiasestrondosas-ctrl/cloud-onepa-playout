use crate::models::playlist::Playlist;
use crate::models::schedule::Schedule;
use crate::models::settings::Settings;
use crate::services::ffmpeg::FFmpegService;
use chrono::{Local, NaiveTime};
use sqlx::PgPool;
use std::process::Child;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

pub struct PlayoutEngine {
    pool: PgPool,
    current_process: Arc<Mutex<Option<Child>>>,
    current_clip_id: Arc<Mutex<Option<String>>>,
    pub is_running: Arc<Mutex<bool>>,
    pub last_error: Arc<Mutex<Option<String>>>,
}

impl PlayoutEngine {
    pub fn new(pool: PgPool) -> Self {
        PlayoutEngine {
            pool,
            current_process: Arc::new(Mutex::new(None)),
            current_clip_id: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)), // Will be updated on start
            last_error: Arc::new(Mutex::new(None)),
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

        if !running {
            self.stop_process().await;
        } else {
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

        let now = Local::now();
        let current_date = now.date_naive();
        let current_time = now.time();

        // 1. Fetch settings
        let settings = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        // 2. Find scheduled playlist
        let schedule = sqlx::query_as::<_, Schedule>(
            "SELECT * FROM schedule WHERE date = $1 OR repeat_pattern = 'daily' ORDER BY start_time DESC"
        )
        .bind(current_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let mut active_playlist_id = None;
        let mut playlist_start_time = None;

        for s in schedule {
            if let Some(st) = s.start_time {
                if current_time >= st {
                    active_playlist_id = Some(s.playlist_id);
                    playlist_start_time = Some(st);
                    break;
                }
            }
        }

        if let Some(pid) = active_playlist_id {
            let playlist = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
                .bind(pid)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| e.to_string())?;

            self.play_from_playlist(playlist, playlist_start_time.unwrap(), &settings)
                .await?;
        } else {
            // No schedule, play fillers?
            // For now, if no schedule, stop process
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
            return Ok(()); // Should not happen given tick logic
        }

        // Parse playlist content - support both direct array and {program: []} wrapper
        let items = if playlist.content.is_array() {
            playlist.content.as_array().unwrap()
        } else if let Some(program) = playlist.content.get("program").and_then(|p| p.as_array()) {
            program
        } else {
            return Err("Invalid playlist content: program array not found".to_string());
        };

        let mut accumulated_time = 0.0;
        let mut target_item = None;
        let mut offset = 0.0;

        for item in items {
            let duration = item["duration"].as_f64().unwrap_or(0.0);
            if (seconds_since_start as f64) < (accumulated_time + duration) {
                target_item = Some(item);
                offset = (seconds_since_start as f64) - accumulated_time;
                break;
            }
            accumulated_time += duration;
        }

        if let Some(item) = target_item {
            let clip_path = item["source"]
                .as_str()
                .or_else(|| item["path"].as_str())
                .ok_or("Missing clip path")?;

            let clip_id = item["id"].as_str().unwrap_or(clip_path); // Fallback to path as ID if missing

            let mut current_id = self.current_clip_id.lock().await;
            let mut proc_lock = self.current_process.lock().await;

            // Check if process is still running
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

                // Stop old process
                if let Some(mut child) = proc_lock.take() {
                    child.kill().ok();
                }

                let ffmpeg = FFmpegService::new();
                let hls_preview_path = "/var/lib/onepa-playout/hls";
                std::fs::create_dir_all(hls_preview_path).ok();

                let mut output_url = settings.output_url.clone();
                // If running in Docker, localhost refers to the container itself.
                // We need to use host.docker.internal to reach services (like MediaMTX) on the host machine.
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
            }
        } else {
            // End of playlist
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
