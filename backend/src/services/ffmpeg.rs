use crate::models::settings::Settings;
use serde::{Deserialize, Serialize};
use std::env;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaInfo {
    pub duration: Option<f64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub codec: Option<String>,
    pub bitrate: Option<i64>,
    pub has_audio: bool,
    pub has_video: bool,
}

pub struct FFmpegService {
    ffmpeg_path: String,
    ffprobe_path: String,
}

impl FFmpegService {
    pub fn new() -> Self {
        FFmpegService {
            ffmpeg_path: env::var("FFMPEG_PATH").unwrap_or_else(|_| "ffmpeg".to_string()),
            ffprobe_path: env::var("FFPROBE_PATH").unwrap_or_else(|_| "ffprobe".to_string()),
        }
    }

    /// Extract media information using ffprobe
    pub fn get_media_info(&self, file_path: &str) -> Result<MediaInfo, String> {
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                file_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

        if !output.status.success() {
            return Err("FFprobe failed".to_string());
        }

        let json_str = String::from_utf8_lossy(&output.stdout);
        let probe_data: serde_json::Value = serde_json::from_str(&json_str)
            .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;

        let mut info = MediaInfo {
            duration: None,
            width: None,
            height: None,
            codec: None,
            bitrate: None,
            has_audio: false,
            has_video: false,
        };

        // Extract duration from format
        if let Some(format) = probe_data.get("format") {
            if let Some(duration_str) = format.get("duration").and_then(|d| d.as_str()) {
                info.duration = duration_str.parse::<f64>().ok();
            }
            if let Some(bitrate_str) = format.get("bit_rate").and_then(|b| b.as_str()) {
                info.bitrate = bitrate_str.parse::<i64>().ok();
            }
        }

        // Extract stream information
        if let Some(streams) = probe_data.get("streams").and_then(|s| s.as_array()) {
            for stream in streams {
                let codec_type = stream.get("codec_type").and_then(|t| t.as_str());

                match codec_type {
                    Some("video") => {
                        info.has_video = true;
                        info.width = stream
                            .get("width")
                            .and_then(|w| w.as_i64())
                            .map(|w| w as i32);
                        info.height = stream
                            .get("height")
                            .and_then(|h| h.as_i64())
                            .map(|h| h as i32);
                        info.codec = stream
                            .get("codec_name")
                            .and_then(|c| c.as_str())
                            .map(String::from);
                    }
                    Some("audio") => {
                        info.has_audio = true;
                    }
                    _ => {}
                }
            }
        }

        Ok(info)
    }

    /// Generate thumbnail from video
    pub fn generate_thumbnail(
        &self,
        input_path: &str,
        output_path: &str,
        timestamp: f64,
    ) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-ss",
                &timestamp.to_string(),
                "-i",
                input_path,
                "-vframes",
                "1",
                "-vf",
                "scale=320:-1",
                "-y",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg thumbnail generation failed: {}", error));
        }

        Ok(())
    }

    /// Validate media file
    #[allow(dead_code)]
    pub fn validate_media(&self, file_path: &str) -> Result<bool, String> {
        let info = self.get_media_info(file_path)?;

        // Check if file has at least video or audio
        if !info.has_video && !info.has_audio {
            return Ok(false);
        }

        // Check if duration is valid
        if let Some(duration) = info.duration {
            if duration <= 0.0 {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }

        Ok(true)
    }

    /// Check if audio is muted (silent)
    #[allow(dead_code)]
    pub fn check_audio_muted(&self, file_path: &str) -> Result<bool, String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&["-i", file_path, "-af", "volumedetect", "-f", "null", "-"])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);

        // Check for mean_volume or max_volume in output
        if stderr.contains("mean_volume: -inf") || stderr.contains("max_volume: -inf") {
            return Ok(true); // Audio is muted
        }

        Ok(false)
    }

    /// Convert media to standard format
    #[allow(dead_code)]
    pub fn normalize_media(
        &self,
        input_path: &str,
        output_path: &str,
        resolution: &str,
        fps: i32,
    ) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i",
                input_path,
                "-vf",
                &format!("scale={},fps={}", resolution, fps),
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "23",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-y",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg normalization failed: {}", error));
        }

        Ok(())
    }

    /// Process media to remove background (Green or Black)
    pub fn process_transparency(
        &self,
        input_path: &str,
        output_path: &str,
        color: &str, // "green" or "black"
    ) -> Result<(), String> {
        let filter = match color {
            "green" => "chromakey=0x00FF00:0.1:0.2",
            "black" => "colorkey=0x000000:0.01:0.02",
            _ => return Err("Unsupported color for transparency".to_string()),
        };

        // Use VP9 for transparency support in web/overlay context
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i",
                input_path,
                "-vf",
                filter,
                "-c:v",
                "libvpx-vp9",
                "-lossless",
                "1",
                "-y",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg transparency processing failed: {}", error));
        }

        Ok(())
    }

    fn map_output_url(&self, output_url: &str) -> String {
        if output_url.contains("localhost")
            || output_url.contains("127.0.0.1")
            || output_url.contains("mediamtx")
        {
            if output_url.starts_with("rtmp://") {
                log::info!("📡 RTMP: Mapping host to mediamtx with query auth");
                if !output_url.contains("@") && !output_url.contains("user=") {
                    let separator = if output_url.contains('?') { "&" } else { "?" };
                    output_url
                        .replace("localhost", "mediamtx")
                        .replace("127.0.0.1", "mediamtx")
                        + separator
                        + "user=backend&pass=backend"
                } else {
                    output_url
                        .replace("localhost", "mediamtx")
                        .replace("127.0.0.1", "mediamtx")
                }
            } else if output_url.starts_with("srt://") {
                if output_url.contains("mode=listener") || output_url.contains("listen=1") {
                    log::info!("🎧 SRT LISTENER: Binding to all interfaces (empty host)");
                    output_url
                        .replace("localhost", "")
                        .replace("127.0.0.1", "")
                        .replace("0.0.0.0", "")
                } else {
                    log::info!("📞 SRT CALLER: Mapping host to mediamtx with logic");
                    let mut final_url = output_url
                        .replace("localhost", "mediamtx")
                        .replace("127.0.0.1", "mediamtx");

                    if final_url.contains("mediamtx") && !final_url.contains("user=") {
                        // However, streamid is usually srt://host:port?streamid=...
                        // If it already has streamid, we append ;user=...
                        if final_url.contains("streamid=") {
                            // MediaMTX SRT authentication format (v1.x):
                            // action:pathname:user:pass[:query]
                            // We generically inject :user:pass after the pathname part
                            if let Some(pos) = final_url.find("publish:") {
                                let after_publish = &final_url[pos + 8..];
                                // The pathname ends at the first '?' or '&' or end of string
                                let end_pos = after_publish
                                    .find(|c| c == '?' || c == '&')
                                    .unwrap_or(after_publish.len());
                                let pathname = &after_publish[..end_pos];

                                if !pathname.contains(":backend:backend") {
                                    let new_streamid_val = format!("{}:backend:backend", pathname);
                                    let mut new_url = final_url.clone();
                                    new_url.replace_range(
                                        pos + 8..pos + 8 + end_pos,
                                        &new_streamid_val,
                                    );
                                    final_url = new_url;
                                }
                            }
                        } else {
                            // Fallback if streamid is missing (unlikely in our engine)
                            let q_sep = if final_url.contains('?') { "&" } else { "?" };
                            final_url = format!("{}{}user=backend&pass=backend", final_url, q_sep);
                        }
                    }
                    final_url
                }
            } else if output_url.starts_with("udp://") {
                if output_url.contains("@") {
                    log::info!("📡 UDP LISTENER: Mapping to all interfaces (empty host)");
                    output_url.replace("localhost", "").replace("127.0.0.1", "")
                } else {
                    log::info!("📡 UDP PUSH: Mapping localhost to host.docker.internal");
                    output_url
                        .replace("localhost", "host.docker.internal")
                        .replace("127.0.0.1", "host.docker.internal")
                }
            } else {
                output_url.to_string()
            }
        } else {
            output_url.to_string()
        }
    }

    /// Start a live stream from a file with HLS preview
    pub fn start_stream(
        &self,
        input_path: &str,
        output_url: &str,
        offset: f64,
        settings: &Settings,
        hls_preview_path: Option<&str>,
        logo_path: Option<&str>,
    ) -> Result<std::process::Child, String> {
        let resolution = &settings.resolution;
        let video_bitrate = &settings.video_bitrate;
        let audio_bitrate = &settings.audio_bitrate;
        let logo_position = settings.logo_position.as_deref();
        let overlay_opacity = settings.overlay_opacity;
        let overlay_scale = settings.overlay_scale;
        let fps = &settings.fps;

        // Automatic Docker Network Fix
        let effective_output_url = self.map_output_url(output_url);

        // Log the final URL
        log::info!("✅ Final output URL: {}", effective_output_url);

        let mut args = vec![
            "-re".to_string(), // Read at native frame rate
        ];

        // 1. INPUTS

        // Input 0: Main Video
        if input_path.ends_with(".txt") {
            args.extend(vec![
                "-f".to_string(),
                "concat".to_string(),
                "-safe".to_string(),
                "0".to_string(),
            ]);
        }

        if offset > 0.0 {
            args.extend(vec!["-ss".to_string(), offset.to_string()]);
        }
        args.extend(vec!["-i".to_string(), input_path.to_string()]);

        // Input 1: Logo/Overlay (if present)
        let has_logo = if let Some(logo_path) = logo_path {
            if !logo_path.is_empty() {
                // Add loop for video files (INPUT OPTION)
                if logo_path.ends_with(".mp4") || logo_path.ends_with(".webm") {
                    args.extend(vec!["-stream_loop".to_string(), "-1".to_string()]);
                }

                // Add loop for image files to ensure they persist
                if logo_path.ends_with(".jpg")
                    || logo_path.ends_with(".jpeg")
                    || logo_path.ends_with(".png")
                    || logo_path.ends_with(".webp")
                {
                    args.extend(vec!["-loop".to_string(), "1".to_string()]);
                }

                args.extend(vec!["-i".to_string(), logo_path.to_string()]);
                true
            } else {
                false
            }
        } else {
            false
        };

        // 2. FILTER COMPLEX
        let mut filter_complex = String::new();

        // Video Chain
        if has_logo {
            // Get opacity and scale values with defaults
            let opacity = overlay_opacity.unwrap_or(1.0).clamp(0.0, 1.0);
            let scale = overlay_scale.unwrap_or(1.0).clamp(0.1, 2.0);

            // Determine overlay position coordinates
            let pos_coords = match logo_position.unwrap_or("top-right") {
                "top-left" => "50:50",
                "bottom-left" => "50:H-h-50",
                "bottom-right" => "W-w-50:H-h-50",
                _ => "W-w-50:50", // top-right default
            };

            filter_complex.push_str(&format!(
                "[0:v]scale={}[bg];[1:v]scale=iw*{}:ih*{},format=rgba,colorchannelmixer=aa={}[logo];[bg][logo]overlay={}[v_out];",
                resolution, scale, scale, opacity, pos_coords
            ));
        } else {
            filter_complex.push_str(&format!("[0:v]scale={}[v_out];", resolution));
        }

        // Audio Chain (Standardize to EBU R128)
        filter_complex.push_str("[0:a]volume=0.8[a_out]");

        // 3. CODEC SELECTION LOGIC
        // Force transcoding if logo/overlay is enabled, even if "copy" was selected.
        // Filters require re-encoding.
        let v_codec = if has_logo && settings.video_codec == "copy" {
            log::info!("[FFmpeg] Logo enabled, forcing libx264 transcoding instead of 'copy'");
            "h264"
        } else {
            &settings.video_codec
        };

        let a_codec = if has_logo && settings.audio_codec == "copy" {
            log::info!("[FFmpeg] Logo/Filters enabled, forcing aac transcoding instead of 'copy'");
            "aac"
        } else {
            &settings.audio_codec
        };

        args.extend(vec!["-filter_complex".to_string(), filter_complex]);

        // 4. OUTPUT CODECS & OPTIONS (Applied to mapped streams)
        // FPS for GOP calculation
        let fps_val = fps.parse::<i32>().unwrap_or(30);
        let gop = fps_val * 2;

        match v_codec {
            "h264" => args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-tune".to_string(),
                "zerolatency".to_string(),
                "-flags".to_string(),
                "+global_header".to_string(),
                "-profile:v".to_string(),
                "high".to_string(),
                "-level".to_string(),
                "4.1".to_string(),
                "-preset".to_string(),
                "veryfast".to_string(),
                "-bf".to_string(),
                "0".to_string(),
                "-b:v".to_string(),
                video_bitrate.to_string(),
                "-maxrate".to_string(),
                video_bitrate.to_string(),
                "-bufsize".to_string(),
                format!(
                    "{}k",
                    video_bitrate
                        .replace("k", "")
                        .parse::<i32>()
                        .unwrap_or(5000)
                        * 2
                ),
                "-pix_fmt".to_string(),
                "yuv420p".to_string(),
                "-g".to_string(),
                format!("{}", gop),
            ]),
            "hevc" => args.extend(vec![
                "-c:v".to_string(),
                "libx265".to_string(),
                "-tune".to_string(),
                "zerolatency".to_string(),
                "-flags".to_string(),
                "+global_header".to_string(),
                "-preset".to_string(),
                "ultrafast".to_string(),
                "-b:v".to_string(),
                video_bitrate.to_string(),
                "-maxrate".to_string(),
                video_bitrate.to_string(),
                "-bufsize".to_string(),
                format!(
                    "{}k",
                    video_bitrate
                        .replace("k", "")
                        .parse::<i32>()
                        .unwrap_or(5000)
                        * 2
                ),
                "-pix_fmt".to_string(),
                "yuv420p".to_string(),
                "-g".to_string(),
                format!("{}", gop),
            ]),
            "vp8" => args.extend(vec![
                "-c:v".to_string(),
                "libvpx".to_string(),
                "-b:v".to_string(),
                video_bitrate.to_string(),
                "-g".to_string(),
                format!("{}", gop),
            ]),
            "vp9" => args.extend(vec![
                "-c:v".to_string(),
                "libvpx-vp9".to_string(),
                "-b:v".to_string(),
                video_bitrate.to_string(),
                "-g".to_string(),
                format!("{}", gop),
            ]),
            "av1" => args.extend(vec![
                "-c:v".to_string(),
                "libaom-av1".to_string(),
                "-b:v".to_string(),
                video_bitrate.to_string(),
                "-g".to_string(),
                format!("{}", gop),
            ]),
            _ => {
                if v_codec == "copy" {
                    args.extend(vec!["-c:v".to_string(), "copy".to_string()]);
                } else {
                    args.extend(vec![
                        "-c:v".to_string(),
                        "libx264".to_string(),
                        "-preset".to_string(),
                        "veryfast".to_string(),
                        "-b:v".to_string(),
                        video_bitrate.to_string(),
                    ]);
                }
            }
        }

        // Audio Codec Configuration
        match a_codec {
            "aac" => args.extend(vec![
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                audio_bitrate.to_string(),
                "-ar".to_string(),
                "44100".to_string(),
            ]),
            "opus" => args.extend(vec![
                "-c:a".to_string(),
                "libopus".to_string(),
                "-b:a".to_string(),
                audio_bitrate.to_string(),
            ]),
            _ => {
                if a_codec == "copy" {
                    args.extend(vec!["-c:a".to_string(), "copy".to_string()]);
                } else {
                    args.extend(vec![
                        "-c:a".to_string(),
                        "aac".to_string(),
                        "-b:a".to_string(),
                        audio_bitrate.to_string(),
                    ]);
                }
            }
        }

        // Determine output format based on protocol and apply packet size limits for UDP/SRT
        let mut final_output_url = effective_output_url.clone();

        // Detect Multicast and tune parameters
        if final_output_url.starts_with("udp://") {
            // Very basic multicast range check (224.x.x.x to 239.x.x.x)
            let is_multicast = final_output_url.contains("://224.")
                || final_output_url.contains("://225.")
                || final_output_url.contains("://226.")
                || final_output_url.contains("://227.")
                || final_output_url.contains("://228.")
                || final_output_url.contains("://229.")
                || final_output_url.contains("://230.")
                || final_output_url.contains("://231.")
                || final_output_url.contains("://232.")
                || final_output_url.contains("://233.")
                || final_output_url.contains("://234.")
                || final_output_url.contains("://235.")
                || final_output_url.contains("://236.")
                || final_output_url.contains("://237.")
                || final_output_url.contains("://238.")
                || final_output_url.contains("://239.");

            if is_multicast {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("ttl=") {
                    final_output_url = format!("{}{}ttl=2", final_output_url, separator);
                }
                let separator2 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("buffer_size=") {
                    final_output_url =
                        format!("{}{}buffer_size=10000000", final_output_url, separator2);
                }
                let separator3 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("localaddr=") {
                    final_output_url =
                        format!("{}{}localaddr=0.0.0.0", final_output_url, separator3);
                }
            }
        } else if final_output_url.starts_with("srt://") {
            // Add robust SRT parameters
            let separator = if final_output_url.contains('?') {
                "&"
            } else {
                "?"
            };
            if !final_output_url.contains("transtype=") {
                final_output_url = format!("{}{}transtype=live", final_output_url, separator);
            }
            let separator2 = if final_output_url.contains('?') {
                "&"
            } else {
                "?"
            };
            if !final_output_url.contains("latency=") {
                final_output_url = format!("{}{}latency=200ms", final_output_url, separator2);
            }
            let separator3 = if final_output_url.contains('?') {
                "&"
            } else {
                "?"
            };
            if !final_output_url.contains("overhead_bandwidth=") {
                final_output_url =
                    format!("{}{}overhead_bandwidth=25", final_output_url, separator3);
            }
            // CRITICAL: For Listener mode, we MUST add listen=1 for FFmpeg to bind
            if final_output_url.contains("mode=listener") && !final_output_url.contains("listen=1")
            {
                let separator4 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}listen=1", final_output_url, separator4);
            }
        } else if final_output_url.starts_with("udp://") {
            // Support for UDP Listener mode (udp://@:port)
            if final_output_url.contains("@") && !final_output_url.contains("listen=1") {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}listen=1", final_output_url, separator);
                log::info!(
                    "📡 UDP LISTENER: Enabled listen=1 for URL: {}",
                    final_output_url
                );
            }
        }

        let output_format = if final_output_url.starts_with("rtmp://") {
            "flv"
        } else if final_output_url.starts_with("srt://") || final_output_url.starts_with("udp://") {
            // Add pkt_size=1316 for MPEG-TS over UDP/SRT to avoid fragmentation
            if !final_output_url.contains("pkt_size=") {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}pkt_size=1316", final_output_url, separator);
            }
            "mpegts"
        } else {
            "flv" // Default fallback
        };

        // 4. OUTPUT MAPPING & FORMAT (Tee or Single)
        // Explicitly map [v_out] and [a_out] from the filter complex
        if let Some(hls_path) = hls_preview_path {
            // Escape any existing single quotes for the tee muxer
            let escaped_url = final_output_url.replace("'", "'\\''");

            let slave_url = if final_output_url.starts_with("srt://") {
                // SRT NEEDS fifo + onfail=ignore to prevents blocking the whole pipeline
                // restart_with_keyframe=1: Ensures we only send complete GOPs after a drop/connect
                format!(
                    "[f=fifo:fifo_format=mpegts:onfail=ignore:drop_pkts_on_overflow=1:restart_with_keyframe=1:queue_size=60000]'{}'",
                    escaped_url
                )
            } else if final_output_url.starts_with("rtmp://") {
                // RTMP with FIFO for robustness against network blips (MediaMTX restarts)
                // Using onfail=ignore so HLS preview keeps working even if distribution drops
                // restart_with_keyframe=1: Ensures we only send complete GOPs after a drop/connect
                format!(
                    "[f=fifo:fifo_format=flv:onfail=ignore:drop_pkts_on_overflow=1:attempt_recovery=1:recovery_wait_time=3:restart_with_keyframe=1:queue_size=60000]'{}'",
                    escaped_url
                )
            } else {
                // UDP and others (Standard direct mapping)
                format!("[f={}]'{}'", output_format, escaped_url)
            };

            // 1. Primary Distribution Output (RTMP/SRT)
            let mut tee_outputs = vec![slave_url];

            // 2. Mandatory HLS Output (for internal preview)
            tee_outputs.push(format!(
                "[f=hls:hls_time=2:hls_list_size=10:hls_flags=delete_segments+independent_segments]{}/stream.m3u8",
                hls_path
            ));

            // 3. Optional DASH Output
            if settings.dash_enabled {
                if let Some(ref url) = settings.dash_output_url {
                    tee_outputs.push(format!(
                        "[f=dash:window_size=5:extra_window_size=5:remove_at_exit=1:dash_segment_type=webm]'{}'",
                        url
                    ));
                }
            }

            // 4. Optional MSS Output (Smooth Streaming)
            if settings.mss_enabled {
                if let Some(ref url) = settings.mss_output_url {
                    tee_outputs.push(format!("[f=ismv]'{}'", url));
                }
            }

            // 5. Optional RIST Output (Reliable Transport)
            if settings.rist_enabled {
                if let Some(ref url) = settings.rist_output_url {
                    tee_outputs.push(format!("[f=rist:pkt_size=1316]'{}'", url));
                }
            }

            args.extend(vec![
                "-f".to_string(),
                "tee".to_string(),
                "-map".to_string(),
                "[v_out]".to_string(),
                "-map".to_string(),
                "[a_out]".to_string(),
                tee_outputs.join("|"),
            ]);
        } else {
            // Single output
            args.extend(vec![
                "-f".to_string(),
                output_format.to_string(),
                "-map".to_string(),
                "[v_out]".to_string(),
                "-map".to_string(),
                "[a_out]".to_string(),
                final_output_url.to_string(),
            ]);
        }

        // Log the complete FFmpeg command for debugging
        log::info!("FFmpeg command: {} {}", self.ffmpeg_path, args.join(" "));

        let child = Command::new(&self.ffmpeg_path)
            .args(&args)
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

        Ok(child)
    }

    /// Start a relay process that copies a stream to a destination
    pub fn start_relay(
        &self,
        input_url: &str,
        output_url: &str,
    ) -> Result<std::process::Child, String> {
        let final_input_url = self.map_output_url(input_url);
        let mut final_output_url = self.map_output_url(output_url);
        let mut args = vec![
            "-thread_queue_size".to_string(),
            "1024".to_string(),
            "-fflags".to_string(),
            "+genpts".to_string(),
        ];

        args.extend(vec![
            "-rw_timeout".to_string(),
            "10000000".to_string(), // 10s timeout to survive clip transitions
            "-i".to_string(),
            final_input_url.to_string(),
            "-map".to_string(),
            "0".to_string(),
            "-c".to_string(),
            "copy".to_string(),
        ]);

        // Format specific adjustments
        // Format specific adjustments with FIFO robustness
        // We use the FIFO muxer to prevent the relay process from crashing if the destination is temporarily unavailable
        if final_output_url.starts_with("rtmp://") {
            // RTMP FIFO
            args.extend(vec![
                "-f".to_string(),
                "fifo".to_string(),
                "-fifo_format".to_string(),
                "flv".to_string(),
                "-queue_size".to_string(),
                "60000".to_string(),
                "-attempt_recovery".to_string(),
                "1".to_string(),
                "-recovery_wait_time".to_string(),
                "1".to_string(),
                "-drop_pkts_on_overflow".to_string(),
                "1".to_string(),
                final_output_url.to_string(),
            ]);
        } else if final_output_url.starts_with("srt://") {
            // SRT FIFO
            // Add robust SRT parameters first
            let separator = if final_output_url.contains('?') {
                "&"
            } else {
                "?"
            };
            if !final_output_url.contains("transtype=") {
                final_output_url = format!("{}{}transtype=live", final_output_url, separator);
            }
            let separator2 = if final_output_url.contains('?') {
                "&"
            } else {
                "?"
            };
            if !final_output_url.contains("latency=") {
                final_output_url = format!("{}{}latency=200ms", final_output_url, separator2);
            }
            if !final_output_url.contains("pkt_size=") {
                let separator3 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}pkt_size=1316", final_output_url, separator3);
            }

            args.extend(vec![
                "-f".to_string(),
                "fifo".to_string(),
                "-fifo_format".to_string(),
                "mpegts".to_string(),
                "-queue_size".to_string(),
                "60000".to_string(),
                "-attempt_recovery".to_string(),
                "1".to_string(),
                "-drop_pkts_on_overflow".to_string(),
                "1".to_string(),
                "-recovery_wait_time".to_string(),
                "1".to_string(),
                final_output_url.to_string(),
            ]);
        } else if final_output_url.starts_with("udp://") {
            // Very basic multicast range check (224.x.x.x to 239.x.x.x)
            let is_multicast = final_output_url.contains("://224.")
                || final_output_url.contains("://225.")
                || final_output_url.contains("://226.")
                || final_output_url.contains("://227.")
                || final_output_url.contains("://228.")
                || final_output_url.contains("://229.")
                || final_output_url.contains("://230.")
                || final_output_url.contains("://231.")
                || final_output_url.contains("://232.")
                || final_output_url.contains("://233.")
                || final_output_url.contains("://234.")
                || final_output_url.contains("://235.")
                || final_output_url.contains("://236.")
                || final_output_url.contains("://237.")
                || final_output_url.contains("://238.")
                || final_output_url.contains("://239.");

            if is_multicast {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("ttl=") {
                    final_output_url = format!("{}{}ttl=2", final_output_url, separator);
                }
                let separator2 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("buffer_size=") {
                    final_output_url =
                        format!("{}{}buffer_size=10000000", final_output_url, separator2);
                }
            }

            // Support for UDP Listener mode (udp://@:port)
            if (final_output_url.contains('@') || final_output_url.contains("listen=1"))
                && !final_output_url.contains("://2")
            {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };

                if !final_output_url.contains("listen=1") {
                    final_output_url = format!("{}{}listen=1", final_output_url, separator);
                }

                // FFmpeg 6 compatibility: Replace @ with 0.0.0.0 for binding
                if final_output_url.contains('@') {
                    // Try to isolate the part after @ (the port)
                    let parts: Vec<&str> = final_output_url.split('@').collect();
                    if parts.len() > 1 {
                        let after_at = parts[1];
                        // If it's like @:1234 or @mediamtx:1234, we want 0.0.0.0:1234
                        if let Some(colon_pos) = after_at.find(':') {
                            let port_part = &after_at[colon_pos..]; // includes the colon
                            final_output_url = format!("udp://0.0.0.0{}", port_part);
                        } else {
                            // fallback simple replace
                            final_output_url = final_output_url.replace('@', "0.0.0.0");
                        }
                    }
                }

                log::info!(
                    "📡 UDP RELAY LISTENER: Normalized URL for FFmpeg 6: {}",
                    final_output_url
                );
            }

            if !final_output_url.contains("pkt_size=") {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}pkt_size=1316", final_output_url, separator);
            }

            // Direct UDP output without FIFO overhead for real-time
            args.extend(vec![
                "-f".to_string(),
                "mpegts".to_string(),
                final_output_url.to_string(),
            ]);
        } else {
            args.push(final_output_url);
        }

        let cmd_str = format!("{} {}", self.ffmpeg_path, args.join(" "));
        log::info!("FFmpeg Relay command: {}", cmd_str);

        match Command::new(&self.ffmpeg_path)
            .args(&args)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
        {
            Ok(child) => {
                log::info!(
                    "✓ Relay process started successfully (PID: {:?})",
                    child.id()
                );
                Ok(child)
            }
            Err(e) => {
                let error_msg = format!("Failed to spawn FFmpeg relay: {}", e);
                log::error!("✗ {}", error_msg);
                Err(error_msg)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffmpeg_service_creation() {
        let service = FFmpegService::new();
        assert!(!service.ffmpeg_path.is_empty());
        assert!(!service.ffprobe_path.is_empty());
    }
}
