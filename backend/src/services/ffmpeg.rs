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

    /// Start a live stream from a file with HLS preview
    pub fn start_stream(
        &self,
        input_path: &str,
        output_url: &str,
        offset: f64,
        resolution: &str,
        video_bitrate: &str,
        audio_bitrate: &str,
        hls_preview_path: Option<&str>,
        logo_path: Option<&str>,
        logo_position: Option<&str>,
    ) -> Result<std::process::Child, String> {
        let mut args = vec![
            "-re".to_string(), // Read at native frame rate
        ];

        // 1. INPUTS

        // Input 0: Main Video
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
        let mut filter_complex = format!("scale={}", resolution);

        if has_logo {
            // Determine overlay position coordinates
            let pos_coords = match logo_position.unwrap_or("top-right") {
                "top-left" => "50:50",
                "bottom-left" => "50:H-h-50",
                "bottom-right" => "W-w-50:H-h-50",
                _ => "W-w-50:50", // top-right default
            };

            filter_complex = format!(
                "[0:v]scale={}[bg];[1:v]scale=-1:250[logo];[bg][logo]overlay={}[v_out]",
                resolution, pos_coords
            );
        } else {
            // No logo, just scale and label
            filter_complex = format!("[0:v]scale={}[v_out]", resolution);
        }

        args.extend(vec!["-filter_complex".to_string(), filter_complex]);

        // 3. OUTPUT CODECS & OPTIONS (Applied to mapped streams)
        args.extend(vec![
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "veryfast".to_string(),
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
            "50".to_string(), // 2 sec gop for 25fps
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            audio_bitrate.to_string(),
            "-ar".to_string(),
            "44100".to_string(),
        ]);

        // 4. OUTPUT MAPPING & FORMAT (Tee or Single)
        if let Some(hls_path) = hls_preview_path {
            args.extend(vec![
                "-f".to_string(),
                "tee".to_string(),
                "-map".to_string(),
                "[v_out]".to_string(),
                "-map".to_string(),
                "0:a?".to_string(),
                format!(
                    "[f=flv]{}|[f=hls:hls_time=2:hls_list_size=5:hls_flags=delete_segments]{}/stream.m3u8",
                    output_url, hls_path
                ),
            ]);
        } else {
            // Single output (RTMP only)
            args.extend(vec![
                "-f".to_string(),
                "flv".to_string(),
                "-map".to_string(),
                "[v_out]".to_string(),
                "-map".to_string(),
                "0:a?".to_string(),
                output_url.to_string(),
            ]);
        }

        let child = Command::new(&self.ffmpeg_path)
            .args(&args)
            .spawn()
            .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

        Ok(child)
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
