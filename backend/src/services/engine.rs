use crate::models::playlist::Playlist;
use crate::models::schedule::Schedule;
use crate::models::settings::Settings;
use crate::services::ffmpeg::FFmpegService;
use chrono::{Datelike, Local, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
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
    pub logs: Vec<String>,
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
    skip_requested: Arc<Mutex<bool>>,
    last_overlay_opacity: Arc<Mutex<f32>>,
    last_overlay_scale: Arc<Mutex<f32>>,
    last_output_url: Arc<Mutex<String>>,
    last_resolution: Arc<Mutex<String>>,
    last_video_bitrate: Arc<Mutex<String>>,
    last_audio_bitrate: Arc<Mutex<String>>,
    // Gapless Playout: Track the list of clip IDs currently in the running concat sequence
    current_sequence: Arc<Mutex<Vec<String>>>,
    pub logs: Arc<Mutex<VecDeque<String>>>,
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
                logs: Vec::new(),
            })),
            engine_start_time: Arc::new(Mutex::new(None)),
            skip_requested: Arc::new(Mutex::new(false)),
            last_overlay_opacity: Arc::new(Mutex::new(1.0)),
            last_overlay_scale: Arc::new(Mutex::new(1.0)),
            last_output_url: Arc::new(Mutex::new(String::new())),
            last_resolution: Arc::new(Mutex::new(String::new())),
            last_video_bitrate: Arc::new(Mutex::new(String::new())),
            last_audio_bitrate: Arc::new(Mutex::new(String::new())),
            current_sequence: Arc::new(Mutex::new(Vec::new())),
            logs: Arc::new(Mutex::new(VecDeque::with_capacity(100))),
        }
    }

    pub async fn skip_current_clip(&self) {
        let mut skip = self.skip_requested.lock().await;
        *skip = true;
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
            status.uptime = 0;
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

            // Clear logs when starting
            let mut logs = self.logs.lock().await;
            logs.clear();
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

            // If running, initialize start time
            if settings.is_running {
                let mut start_time = self.engine_start_time.lock().await;
                *start_time = Some(Local::now());
            }

            // Sync clips counter from DB
            let mut status = self.status.lock().await;
            status.clips_played_today = settings.clips_played_today.unwrap_or(0);
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

            // --- Handle Skip Request ---
            let mut skip = self.skip_requested.lock().await;
            if *skip {
                log::info!("Processing skip request...");
                if let Err(e) = self.process_skip().await {
                    log::error!("Failed to process skip: {}", e);
                }
                *skip = false;
            }
            // ---------------------------

            sleep(Duration::from_secs(1)).await;
        }
    }

    async fn process_skip(&self) -> Result<(), String> {
        let status = self.status.lock().await;
        if let Some(ref current) = status.current_clip {
            let remaining = current.duration - current.position;
            if remaining > 0.0 {
                log::info!(
                    "Skipping clip. Advancing schedule by {} seconds.",
                    remaining
                );
                // Update schedule start_time by shifting it back
                // We target the current ACTIVE schedule item
                let _ = sqlx::query("UPDATE schedule SET start_time = start_time - ($1 * interval '1 second') WHERE id = (
                    SELECT id FROM schedule 
                    WHERE (date = current_date OR repeat_pattern != 'none')
                    AND start_time <= current_time 
                    ORDER BY CASE WHEN date = current_date THEN 0 ELSE 1 END, start_time DESC 
                    LIMIT 1
                )")
                    .bind(remaining)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| e.to_string())?;

                log::info!(
                    "Skip: Schedule shifted by {}s. Stopping process for reload.",
                    remaining
                );

                // Force immediate process stop to pick up new clip on next tick
                self.stop_process().await;
            }
        }
        Ok(())
    }

    async fn tick(&self) -> Result<(), String> {
        // Check if engine is enabled
        if !*self.is_running.lock().await {
            return Ok(());
        }

        // Update uptime only if playing
        {
            let mut status = self.status.lock().await;
            if status.status == "playing" {
                if let Some(start) = *self.engine_start_time.lock().await {
                    status.uptime = (Local::now() - start).num_seconds();
                }
                // Update logs in status
                let logs_buffer = self.logs.lock().await;
                status.logs = logs_buffer.iter().cloned().collect();
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
        let duration_since_start = now - start_time;
        let seconds_since_start = duration_since_start.num_milliseconds() as f64 / 1000.0;

        if seconds_since_start < 0.0 {
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

            // Try to get the original filename from the media library
            let filename = if let Ok(media_row) =
                sqlx::query("SELECT filename FROM media WHERE path = $1 LIMIT 1")
                    .bind(clip_path)
                    .fetch_one(&self.pool)
                    .await
            {
                media_row
                    .try_get::<String, _>("filename")
                    .unwrap_or_else(|_| {
                        std::path::Path::new(clip_path)
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or(clip_path)
                            .to_string()
                    })
            } else {
                // Fallback to path-based filename if not found in media library
                std::path::Path::new(clip_path)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(clip_path)
                    .to_string()
            };

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
                let mut next_clips_vec = Vec::new();
                for it in items.iter().skip(target_index + 1).take(5) {
                    let it_path = it["source"]
                        .as_str()
                        .or_else(|| it["path"].as_str())
                        .unwrap_or("");

                    // Try to get the original filename from the media library
                    let it_filename = if let Ok(media_row) =
                        sqlx::query("SELECT filename FROM media WHERE path = $1 LIMIT 1")
                            .bind(it_path)
                            .fetch_one(&self.pool)
                            .await
                    {
                        media_row
                            .try_get::<String, _>("filename")
                            .unwrap_or_else(|_| {
                                std::path::Path::new(it_path)
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or(it_path)
                                    .to_string()
                            })
                    } else {
                        // Fallback to path-based filename if not found in media library
                        std::path::Path::new(it_path)
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or(it_path)
                            .to_string()
                    };

                    next_clips_vec.push(ClipInfo {
                        filename: it_filename,
                        duration: it["duration"].as_f64().unwrap_or(0.0),
                        position: 0.0,
                    });
                }
                status.next_clips = next_clips_vec;
            }

            let mut current_id = self.current_clip_id.lock().await;
            let mut proc_lock = self.current_process.lock().await;
            let mut last_opacity = self.last_overlay_opacity.lock().await;
            let mut last_scale = self.last_overlay_scale.lock().await;
            let mut last_url = self.last_output_url.lock().await;
            let mut last_res = self.last_resolution.lock().await;
            let mut last_vb = self.last_video_bitrate.lock().await;
            let mut last_ab = self.last_audio_bitrate.lock().await;

            let current_opacity = settings.overlay_opacity.unwrap_or(1.0);
            let current_scale = settings.overlay_scale.unwrap_or(1.0);

            // Detect overlay changes
            let overlay_changed = settings.overlay_enabled
                && ((current_opacity - *last_opacity).abs() > 0.01
                    || (current_scale - *last_scale).abs() > 0.01);

            // Detect output settings changes (Restart required)
            let settings_changed = settings.output_url != *last_url
                || settings.resolution != *last_res
                || settings.video_bitrate != *last_vb
                || settings.audio_bitrate != *last_ab;

            if overlay_changed || settings_changed {
                log::info!(
                    "Stream settings changed (URL: {}->{}, Res: {}->{}, Bitrate: {}/{}->{}/{}). Restarting stream.",
                    *last_url, settings.output_url,
                    *last_res, settings.resolution,
                    *last_vb, *last_ab, settings.video_bitrate, settings.audio_bitrate
                );
                *last_opacity = current_opacity;
                *last_scale = current_scale;
                *last_url = settings.output_url.clone();
                *last_res = settings.resolution.clone();
                *last_vb = settings.video_bitrate.clone();
                *last_ab = settings.audio_bitrate.clone();
            }

            let is_running = if let Some(ref mut child) = *proc_lock {
                match child.try_wait() {
                    Ok(None) => !overlay_changed && !settings_changed, // Force restart if settings changed
                    _ => false,
                }
            } else {
                false
            };

            // ---------------------------------------------------------
            // GAPLESS PLAYOUT LOGIC (Replace single-clip with sequence)
            // ---------------------------------------------------------

            // 1. Determine if we are "covered" by the current sequence
            let mut seq = self.current_sequence.lock().await;
            let current_clip_id_str = clip_id.to_string();

            // If the process is healthy AND the target clip is inside the currently running sequence...
            // We assume FFmpeg is handling the transition internally.
            let in_sequence = is_running && seq.contains(&current_clip_id_str);

            if !in_sequence {
                log::info!(
                    "Starting NEW sequence starting with: {} (offset {:.2}s)",
                    clip_id,
                    offset
                );

                if let Some(mut child) = proc_lock.take() {
                    child.kill().ok();
                }

                // 2. Build the Concat Playlist (Current + Next 5 items)
                let mut sequence_ids = Vec::new();
                use std::io::Write;

                // Temp file for playlist
                let playlist_filename = format!("playlist_{}.txt", Local::now().timestamp_millis());
                let playlist_path = std::env::temp_dir().join(&playlist_filename);
                let mut playlist_file =
                    std::fs::File::create(&playlist_path).map_err(|e| e.to_string())?;

                // Add Current Item
                writeln!(playlist_file, "file '{}'", clip_path).map_err(|e| e.to_string())?;
                sequence_ids.push(current_clip_id_str.clone());

                // Add Next Items (Limit to 10 to avoid huge restart times ?)
                for next_item in items.iter().skip(target_index + 1).take(10) {
                    let next_path = next_item["source"]
                        .as_str()
                        .or_else(|| next_item["path"].as_str())
                        .unwrap_or("");

                    if !next_path.is_empty() {
                        writeln!(playlist_file, "file '{}'", next_path)
                            .map_err(|e| e.to_string())?;
                        let next_id = next_item["id"].as_str().unwrap_or(next_path).to_string();
                        sequence_ids.push(next_id);
                    }
                }

                // Update Sequence State
                *seq = sequence_ids;
                log::info!(
                    "Generated gapless sequence with {} items at {:?}",
                    seq.len(),
                    playlist_path
                );

                let ffmpeg = FFmpegService::new();
                let hls_preview_path_str = std::env::var("HLS_PATH")
                    .unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
                let hls_preview_path = hls_preview_path_str.as_str();
                std::fs::create_dir_all(hls_preview_path).ok();

                // Protocol-specific URL routing
                let output_url = if settings.output_type == "rtmp" {
                    // RTMP uses internal mediamtx server
                    "rtmp://mediamtx:1935/live/stream".to_string()
                } else {
                    // For SRT, UDP, and others: use the database URL
                    // The ffmpeg service will handle hostname mapping (localhost → 0.0.0.0 for Listener, etc.)
                    settings.output_url.clone()
                };

                let logo_path = if settings.overlay_enabled {
                    settings
                        .logo_path
                        .as_ref()
                        .map(|p| {
                            if p.starts_with("/assets/") {
                                let assets_path =
                                    std::env::var("ASSETS_PATH").unwrap_or_else(|_| {
                                        "/var/lib/onepa-playout/assets".to_string()
                                    });
                                p.replace("/assets/", &format!("{}/", assets_path))
                            } else {
                                p.clone()
                            }
                        })
                        .as_deref()
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                } else {
                    None
                };

                // START FFmpeg with the PLAYLIST file, NOT the single clip
                let mut child = ffmpeg.start_stream(
                    playlist_path.to_str().unwrap(),
                    &output_url,
                    offset,
                    &settings.resolution,
                    &settings.video_bitrate,
                    &settings.audio_bitrate,
                    Some(hls_preview_path),
                    logo_path.as_deref(),
                    settings.logo_position.as_deref().filter(|s| !s.is_empty()),
                    settings.overlay_opacity,
                    settings.overlay_scale,
                )?;

                // Capture logs from FFmpeg stderr
                if let Some(stderr) = child.stderr.take() {
                    let logs_clone = self.logs.clone();
                    std::thread::spawn(move || {
                        let reader = BufReader::new(stderr);
                        for line in reader.lines() {
                            if let Ok(line) = line {
                                let mut logs = logs_clone.blocking_lock();
                                if logs.len() >= 100 {
                                    logs.pop_front();
                                }
                                logs.push_back(line);
                            }
                        }
                    });
                }

                *proc_lock = Some(child);
                *current_id = Some(clip_id.to_string());
                log::info!("FFmpeg GAPLESS process started for sequence.");

                // Clips Played Today Counter
                // logic here is tricky in gapless. We'll count "starts" for now.
                if current_id.as_ref() != Some(&clip_id.to_string()) {
                    let mut status = self.status.lock().await;
                    status.clips_played_today += 1;
                    let new_count = status.clips_played_today;
                    let pool = self.pool.clone();
                    tokio::spawn(async move {
                        let _ = sqlx::query(
                            "UPDATE settings SET clips_played_today = $1 WHERE id = TRUE",
                        )
                        .bind(new_count)
                        .execute(&pool)
                        .await;
                    });
                }
                *current_id = Some(clip_id.to_string());
            } else {
                // We are IN SEQUENCE. Just update metadata (clips played) if ID changed
                if current_id.as_ref() != Some(&clip_id.to_string()) {
                    log::info!(
                        "Gapless Transition: Detected crossing into next clip: {}",
                        filename
                    );
                    let mut status = self.status.lock().await;
                    status.clips_played_today += 1;
                    let new_count = status.clips_played_today;
                    let pool = self.pool.clone();
                    tokio::spawn(async move {
                        let _ = sqlx::query(
                            "UPDATE settings SET clips_played_today = $1 WHERE id = TRUE",
                        )
                        .bind(new_count)
                        .execute(&pool)
                        .await;
                    });
                    *current_id = Some(clip_id.to_string());
                }
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

        // Cleanup HLS cache
        self.cleanup_cache().await;
    }

    async fn cleanup_cache(&self) {
        let hls_path =
            std::env::var("HLS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
        log::info!("Cleaning up HLS cache in {}", hls_path);

        if let Ok(entries) = std::fs::read_dir(&hls_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let _ = std::fs::remove_file(path);
                }
            }
        }
    }
}
