use crate::models::playlist::Playlist;
use crate::models::schedule::Schedule;
use crate::models::settings::Settings;
use crate::services::ffmpeg::FFmpegService;
use chrono::{Datelike, Local, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::collections::{HashMap, VecDeque};
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
    pub active_streams: Vec<ActiveStream>,
    pub schedule_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveStream {
    pub protocol: String,
    pub status: String,
    pub sessions: i32,
    pub details: String,
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
    distribution_processes: Arc<Mutex<HashMap<String, Child>>>,
    relay_cooldowns: Arc<Mutex<HashMap<String, std::time::Instant>>>,
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
                active_streams: Vec::new(),
                schedule_source: None,
            })),
            engine_start_time: Arc::new(Mutex::new(None)),
            skip_requested: Arc::new(Mutex::new(false)),
            last_overlay_opacity: Arc::new(Mutex::new(1.0)),
            last_overlay_scale: Arc::new(Mutex::new(1.0)),
            last_output_url: Arc::new(Mutex::new("".to_string())),
            last_resolution: Arc::new(Mutex::new("1920x1080".to_string())),
            last_video_bitrate: Arc::new(Mutex::new("5000k".to_string())),
            last_audio_bitrate: Arc::new(Mutex::new("192k".to_string())),
            current_sequence: Arc::new(Mutex::new(Vec::new())),
            logs: Arc::new(Mutex::new(VecDeque::new())),
            distribution_processes: Arc::new(Mutex::new(HashMap::new())),
            relay_cooldowns: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    // Add dashboard log with retention limit
    pub async fn add_log(&self, msg: String) {
        let mut logs = self.logs.lock().await;
        // Prefix with timestamp if needed, but dashboard already shows time.
        // Let's just push the message.
        // Limit to 20 messages for "Resume" view
        if logs.len() >= 20 {
            logs.pop_front();
        }
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
        logs.push_back(format!("[{}] {}", timestamp, msg));
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
            status.active_streams.clear();
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
            logs.push_back("--- Starting Playout Engine ---".to_string());

            // Log which protocols will be active
            let pool = self.pool.clone();
            tokio::spawn(async move {
                if let Ok(settings) =
                    sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
                        .fetch_one(&pool)
                        .await
                {
                    log::info!(
                        "Engine started with: RTMP={}, SRT={}, UDP={}",
                        settings.rtmp_enabled,
                        settings.srt_enabled,
                        settings.udp_enabled
                    );

                    if !settings.auto_start_protocols {
                        log::info!(
                            "Auto-start protocols is OFF. Disabling distribution protocols."
                        );
                        let _ = sqlx::query("UPDATE settings SET rtmp_enabled = FALSE, srt_enabled = FALSE, udp_enabled = FALSE, hls_enabled = FALSE WHERE id = TRUE")
                            .execute(&pool).await;
                    }
                }
            });
        }
    }

    #[allow(dead_code)]
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

        // Update uptime and sync logs
        {
            let mut status = self.status.lock().await;
            if status.status == "playing" {
                if let Some(start) = *self.engine_start_time.lock().await {
                    status.uptime = (Local::now() - start).num_seconds();
                }
            }
            // Update logs in status (All modes)
            let logs_buffer = self.logs.lock().await;
            status.logs = logs_buffer.iter().cloned().collect();
        }

        // 0. Update Stream Stats
        let settings = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = TRUE")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        self.update_stream_stats(&settings).await;
        self.manage_distribution(&settings).await;

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

                    let source_desc = match s.repeat_pattern.as_deref() {
                        Some("daily") => format!("Daily (from {})", s.date.format("%Y-%m-%d")),
                        Some("weekly") => format!(
                            "Weekly (DOW {}, from {})",
                            day_of_week,
                            s.date.format("%Y-%m-%d")
                        ),
                        _ => format!("Direct ({})", s.date.format("%Y-%m-%d")),
                    };

                    {
                        let mut status = self.status.lock().await;
                        status.schedule_source = Some(source_desc);
                    }

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
            // Clear schedule source in status
            {
                let mut status = self.status.lock().await;
                status.schedule_source = None;
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

                // Add Next Items (Limit to 50 to avoid frequent restarts)
                for next_item in items.iter().skip(target_index + 1).take(50) {
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

                // Main engine always pushes to an internal master feed
                let output_url = "rtmp://mediamtx:1935/live/master".to_string();

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

                let mut child = ffmpeg.start_stream(
                    playlist_path.to_str().unwrap(),
                    &output_url,
                    offset,
                    &settings,
                    Some(hls_preview_path),
                    logo_path.as_deref(),
                )?;

                // Capture stderr to system logs for debugging Master Feed issues
                if let Some(stderr) = child.stderr.take() {
                    std::thread::spawn(move || {
                        let reader = std::io::BufReader::new(stderr);
                        use std::io::BufRead;
                        for line in reader.lines() {
                            if let Ok(line) = line {
                                // Log and also filter for errors
                                if line.contains("Error")
                                    || line.contains("failed")
                                    || line.contains("panic")
                                {
                                    log::error!("[Master Feed] {}", line);
                                } else if line.contains("Opening") || line.contains("Output") {
                                    log::info!("[Master Feed] {}", line);
                                } else {
                                    log::debug!("[Master Feed] {}", line);
                                }
                            }
                        }
                    });
                }

                *proc_lock = Some(child);
                *current_id = Some(clip_id.to_string());
                log::info!("FFmpeg GAPLESS process started for sequence.");
                self.add_log("✓ Playout engine started successfully".to_string())
                    .await;

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

    async fn update_stream_stats(&self, settings: &Settings) {
        let mut streams = Vec::new();
        let engine_running = *self.is_running.lock().await;

        if engine_running {
            // 0. Master Feed Status
            streams.push(ActiveStream {
                protocol: "MASTER".to_string(),
                status: "active".to_string(),
                sessions: 0,
                details: "Internal Feed".to_string(),
            });

            // 1. RTMP Status
            let rtmp_active = settings.rtmp_enabled || settings.output_type == "rtmp";
            let mut rtmp_sessions = 0;
            let mut rtmp_status = if rtmp_active {
                "active".to_string()
            } else {
                "idle".to_string()
            };

            if rtmp_active {
                let mut procs = self.distribution_processes.lock().await;
                let proc_alive = if let Some(child) = procs.get_mut("rtmp") {
                    match child.try_wait() {
                        Ok(None) => true,
                        _ => {
                            rtmp_status = "error".to_string();
                            false
                        }
                    }
                } else {
                    if settings.output_type == "rtmp" || settings.rtmp_enabled {
                        rtmp_status = "error".to_string();
                    }
                    false
                };

                if proc_alive {
                    if let Ok(resp) = reqwest::get("http://mediamtx:9997/v2/paths/list").await {
                        if let Ok(json) = resp.json::<serde_json::Value>().await {
                            if let Some(items) = json.get("items") {
                                if let Some(path_obj) = items.get("live/stream") {
                                    rtmp_sessions = path_obj
                                        .get("readerCount")
                                        .and_then(|v| v.as_i64())
                                        .unwrap_or(0)
                                        as i32;
                                }
                            }
                        }
                    }
                }
            }
            streams.push(ActiveStream {
                protocol: "RTMP".to_string(),
                status: rtmp_status,
                sessions: rtmp_sessions,
                details: "MediaMTX".to_string(),
            });

            // 2. HLS Status
            let mut hls_sessions = 0;
            if let Ok(resp) = reqwest::get("http://mediamtx:9997/v2/paths/list").await {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    if let Some(items) = json.get("items") {
                        if let Some(path_obj) = items.get("live/stream") {
                            hls_sessions = path_obj
                                .get("readerCount")
                                .and_then(|v| v.as_i64())
                                .unwrap_or(0) as i32;
                        }
                    }
                }
            }
            streams.push(ActiveStream {
                protocol: "HLS".to_string(),
                status: "active".to_string(),
                sessions: hls_sessions,
                details: "Public/Preview".to_string(),
            });

            // 3. SRT Status
            let srt_active = settings.srt_enabled || settings.output_type == "srt";
            let mut srt_sessions = 0;
            let mut srt_status = if srt_active {
                "active".to_string()
            } else {
                "idle".to_string()
            };
            let srt_details = if settings.output_type == "srt" {
                settings
                    .srt_mode
                    .clone()
                    .unwrap_or_else(|| "caller".to_string())
            } else {
                "caller".to_string()
            };

            if srt_active {
                let mut procs = self.distribution_processes.lock().await;
                let proc_alive = if let Some(child) = procs.get_mut("srt") {
                    match child.try_wait() {
                        Ok(None) => true,
                        _ => {
                            srt_status = "error".to_string();
                            false
                        }
                    }
                } else {
                    if settings.output_type == "srt" || settings.srt_enabled {
                        srt_status = "error".to_string();
                    }
                    false
                };

                if proc_alive {
                    if srt_details == "caller" {
                        if let Ok(resp) = reqwest::get("http://mediamtx:9997/v2/paths/list").await {
                            if let Ok(json) = resp.json::<serde_json::Value>().await {
                                if let Some(items) = json.get("items") {
                                    if let Some(path_obj) = items.get("live/stream") {
                                        srt_sessions = path_obj
                                            .get("readerCount")
                                            .and_then(|v| v.as_i64())
                                            .unwrap_or(0)
                                            as i32;
                                    }
                                }
                            }
                        }
                    } else {
                        srt_sessions = 1;
                    }
                }
            }

            streams.push(ActiveStream {
                protocol: "SRT".to_string(),
                status: srt_status,
                sessions: srt_sessions,
                details: srt_details,
            });

            // 4. UDP Status
            let udp_active = settings.udp_enabled || settings.output_type == "udp";
            let mut udp_sessions = 0;
            let mut udp_status = if udp_active {
                "active".to_string()
            } else {
                "idle".to_string()
            };

            let udp_url = if settings.output_type == "udp" {
                &settings.output_url
            } else {
                settings.udp_output_url.as_deref().unwrap_or("")
            };

            let udp_mode = if let Some(mode) = &settings.udp_mode {
                mode.clone()
            } else {
                if udp_url.contains("239.") || udp_url.contains("224.") {
                    "multicast".to_string()
                } else {
                    "unicast".to_string()
                }
            };

            if udp_active {
                let mut procs = self.distribution_processes.lock().await;
                if let Some(child) = procs.get_mut("udp") {
                    if !matches!(child.try_wait(), Ok(None)) {
                        udp_status = "error".to_string();
                    } else {
                        udp_sessions = 1;
                    }
                } else {
                    if settings.output_type == "udp" || settings.udp_enabled {
                        udp_status = "error".to_string();
                    }
                }
            }

            streams.push(ActiveStream {
                protocol: "UDP".to_string(),
                status: udp_status,
                sessions: udp_sessions,
                details: udp_mode.to_string(),
            });

            // 5. Extended Multi-output Status (DASH, MSS, RIST)
            // These are tied to the main playout process (tee muxer)
            let master_running = {
                let mut proc_lock = self.current_process.lock().await;
                matches!(proc_lock.as_mut().map(|c| c.try_wait()), Some(Ok(None)))
            };

            if settings.dash_enabled {
                streams.push(ActiveStream {
                    protocol: "DASH".to_string(),
                    status: if master_running {
                        "active".to_string()
                    } else {
                        "idle".to_string()
                    },
                    sessions: 0,
                    details: "Manifest-based".to_string(),
                });
            }

            if settings.mss_enabled {
                streams.push(ActiveStream {
                    protocol: "MSS".to_string(),
                    status: if master_running {
                        "active".to_string()
                    } else {
                        "idle".to_string()
                    },
                    sessions: 0,
                    details: "Smooth Streaming".to_string(),
                });
            }

            if settings.rist_enabled {
                streams.push(ActiveStream {
                    protocol: "RIST".to_string(),
                    status: if master_running {
                        "active".to_string()
                    } else {
                        "idle".to_string()
                    },
                    sessions: 0,
                    details: "Reliable UDP".to_string(),
                });
            }

            // 6. MediaMTX Served Protocols (RTSP, WebRTC, LL-HLS)
            // These are always available if the master feed is pushing to MediaMTX
            if settings.rtsp_enabled {
                streams.push(ActiveStream {
                    protocol: "RTSP".to_string(),
                    status: if master_running {
                        "active".to_string()
                    } else {
                        "idle".to_string()
                    },
                    sessions: 0,
                    details: "Port 8554".to_string(),
                });
            }

            if settings.webrtc_enabled {
                streams.push(ActiveStream {
                    protocol: "WebRTC".to_string(),
                    status: if master_running {
                        "active".to_string()
                    } else {
                        "idle".to_string()
                    },
                    sessions: 0,
                    details: "Low Latency".to_string(),
                });
            }
        }

        let mut status = self.status.lock().await;

        // Sync logs to status for frontend display
        let logs_lock = self.logs.lock().await;
        status.logs = logs_lock.iter().cloned().collect();

        status.active_streams = streams;
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

    pub async fn toggle_protocol(&self, protocol: &str, enabled: bool) -> Result<(), String> {
        log::info!("API: Toggling protocol {} to {}", protocol, enabled);

        // Update database
        let query = match protocol {
            "rtmp" => "UPDATE settings SET rtmp_enabled = $1 WHERE id = TRUE",
            "srt" => "UPDATE settings SET srt_enabled = $1 WHERE id = TRUE",
            "udp" => "UPDATE settings SET udp_enabled = $1 WHERE id = TRUE",
            "hls" => "UPDATE settings SET hls_enabled = $1 WHERE id = TRUE",
            _ => return Err(format!("Unknown protocol: {}", protocol)),
        };

        sqlx::query(query)
            .bind(enabled)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        // The tick() loop will pick up the change and manage processes via manage_distribution
        Ok(())
    }

    async fn manage_distribution(&self, settings: &Settings) {
        let engine_running = *self.is_running.lock().await;

        if !engine_running {
            let mut procs = self.distribution_processes.lock().await;
            for child in procs.values_mut() {
                child.kill().ok();
            }
            procs.clear();
            return;
        }

        // Check if master feed is available before starting relays
        let master_feed_active = self.check_master_feed_active().await;
        if !master_feed_active {
            // Master feed not ready yet, skip this cycle
            return;
        }

        // Add 2s grace period for Master Feed to stabilize (Reduce I/O errors)
        sleep(Duration::from_secs(2)).await;

        let mut procs = self.distribution_processes.lock().await;
        let ffmpeg = FFmpegService::new();
        let master_url = "rtmp://mediamtx:1935/live/master";

        // 1. RTMP
        let rtmp_enabled = settings.rtmp_enabled || settings.output_type == "rtmp";
        let rtmp_url = if settings.output_type == "rtmp" {
            &settings.output_url
        } else {
            settings
                .rtmp_output_url
                .as_deref()
                .unwrap_or("rtmp://mediamtx:1935/live/stream")
        };
        self.handle_relay(
            "rtmp",
            rtmp_enabled,
            rtmp_url,
            master_url,
            &mut procs,
            &ffmpeg,
        )
        .await;

        // 2. SRT
        let srt_enabled = settings.srt_enabled || settings.output_type == "srt";
        let srt_url = if settings.output_type == "srt" {
            &settings.output_url
        } else {
            settings
                .srt_output_url
                .as_deref()
                .unwrap_or("srt://mediamtx:8890?mode=caller&streamid=publish:live/stream")
        };
        self.handle_relay("srt", srt_enabled, srt_url, master_url, &mut procs, &ffmpeg)
            .await;

        // 3. UDP
        let udp_enabled = settings.udp_enabled || settings.output_type == "udp";
        let udp_url = if settings.output_type == "udp" {
            &settings.output_url
        } else {
            settings
                .udp_output_url
                .as_deref()
                .unwrap_or("udp://@239.0.0.1:1234")
        };
        self.handle_relay("udp", udp_enabled, udp_url, master_url, &mut procs, &ffmpeg)
            .await;
    }

    async fn handle_relay(
        &self,
        key: &str,
        enabled: bool,
        url: &str,
        master_url: &str,
        procs: &mut HashMap<String, Child>,
        ffmpeg: &FFmpegService,
    ) {
        const COOLDOWN_SECS: u64 = 5;

        let mut needs_remove = false;
        let is_running = if let Some(child) = procs.get_mut(key) {
            match child.try_wait() {
                Ok(None) => true,
                Ok(Some(status)) => {
                    log::warn!("Relay '{}' stopped (Exit: {})", key, status);
                    self.add_log(format!(
                        "✗ Relay {} stopped (restarting...)",
                        key.to_uppercase()
                    ))
                    .await;
                    // Record failure time in cooldowns when process exits
                    let mut cooldowns = self.relay_cooldowns.lock().await;
                    cooldowns.insert(key.to_string(), std::time::Instant::now());
                    needs_remove = true;
                    false
                }
                Err(e) => {
                    log::error!("Error checking relay '{}' status: {}", key, e);
                    needs_remove = true;
                    false
                }
            }
        } else {
            false
        };

        if needs_remove {
            procs.remove(key);
        }

        if enabled && !is_running {
            // Check cooldown
            let mut cooldowns = self.relay_cooldowns.lock().await;
            let now = std::time::Instant::now();

            if let Some(last_failure) = cooldowns.get(key) {
                let elapsed = now.duration_since(*last_failure).as_secs();
                if elapsed < COOLDOWN_SECS {
                    // Still in cooldown period
                    return;
                }
            }

            log::info!("Starting relay for {} -> {}", key, url);
            match ffmpeg.start_relay(master_url, url) {
                Ok(mut child) => {
                    // Capture stderr to system logs for debugging distribution issues
                    if let Some(stderr) = child.stderr.take() {
                        let key_clone = key.to_string();
                        std::thread::spawn(move || {
                            let reader = std::io::BufReader::new(stderr);
                            use std::io::BufRead;
                            for line in reader.lines() {
                                if let Ok(line) = line {
                                    // Log and also filter for errors
                                    if line.contains("Error") || line.contains("failed") {
                                        log::error!("[Relay {}] {}", key_clone, line);
                                    } else {
                                        log::debug!("[Relay {}] {}", key_clone, line);
                                    }
                                }
                            }
                        });
                    }
                    procs.insert(key.to_string(), child);
                    cooldowns.remove(key); // Clear cooldown on success

                    // Log to system logs
                    self.add_log(format!(
                        "✓ Protocol {} relay started successfully",
                        key.to_uppercase()
                    ))
                    .await;
                }
                Err(e) => {
                    log::error!("Failed to start relay for {}: {}", key, e);
                    cooldowns.insert(key.to_string(), now);

                    // Log to system logs
                    self.add_log(format!(
                        "✗ Protocol {} relay failed: {}",
                        key.to_uppercase(),
                        e
                    ))
                    .await;
                }
            }
        } else if !enabled && is_running {
            log::info!("Stopping relay for {}", key);
            if let Some(mut child) = procs.remove(key) {
                child.kill().ok();

                // Log to system logs
                self.add_log(format!("Protocol {} relay stopped", key.to_uppercase()))
                    .await;
            }
        }
    }

    /// Check if the master feed is active in MediaMTX
    async fn check_master_feed_active(&self) -> bool {
        // Try API first (v3 is standard for latest MediaMTX)
        let v3_url = "http://mediamtx:9997/v3/paths/list";
        let v2_url = "http://mediamtx:9997/v2/paths/list";

        for api_url in &[v3_url, v2_url] {
            if let Ok(Ok(resp)) =
                tokio::time::timeout(Duration::from_secs(1), reqwest::get(*api_url)).await
            {
                if resp.status().is_success() {
                    if let Ok(json) = resp.json::<serde_json::Value>().await {
                        if let Some(items) = json.get("items") {
                            // MediaMTX path items can be a list or a map
                            let master_path = if items.is_object() {
                                items.get("live/master")
                            } else if items.is_array() {
                                items.as_array().and_then(|arr| {
                                    arr.iter().find(|item| {
                                        item.get("name")
                                            == Some(&serde_json::Value::String(
                                                "live/master".to_string(),
                                            ))
                                    })
                                })
                            } else {
                                None
                            };

                            if let Some(path) = master_path {
                                if let Some(ready) =
                                    path.get("ready").or_else(|| path.get("sourceReady"))
                                {
                                    return ready.as_bool().unwrap_or(false);
                                }
                            }
                        }
                    }
                } else if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
                    log::warn!("MediaMTX API requires authentication. Check mediamtx.yml.");
                }
            }
        }

        // If API fails or unreachable, fallback to a small delay after engine start
        if let Some(start_time) = *self.engine_start_time.lock().await {
            let uptime = (Local::now() - start_time).num_seconds();
            return uptime > 10; // Give 10s for MediaMTX to stabilize if API fails
        }

        // Fallback: If API fails, check if the engine process itself is running
        // Since the engine process ALWAYS outputs to the master feed, if it's running, the feed should be there soon
        *self.is_running.lock().await
    }
}
