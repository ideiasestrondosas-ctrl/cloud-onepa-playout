use crate::models::graphics_layer::GraphicsLayer;
use crate::models::settings::Settings;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// Build FFmpeg drawtext filters from graphics layers (Phase 1)
/// Returns filter string fragment to be applied after logo overlay
/// Escape a string for use in an FFmpeg drawtext `text=` option.
/// FFmpeg's filtergraph parser treats `:` as an option separator and `'` as a
/// quote delimiter even inside single-quoted values, so both must be escaped.
fn escape_drawtext(s: &str) -> String {
    s.replace('\\', "\\\\")  // backslash first
     .replace(':', "\\:")     // colon — option separator in filter syntax
     .replace('\'', "\\'" )    // single-quote — string delimiter
     .replace('[', "\\[")     // prevents user text being parsed as a pad label
     .replace(']', "\\]")     // closing pad label
     .replace(';', "\\;")     // prevents user text being parsed as a filter separator
}

/// Normalize any CSS colour string to an FFmpeg-safe format and extract alpha.
///
/// FFmpeg's filtergraph parser splits on commas, so `rgba(0,229,255,0.9)` would shatter
/// the drawtext option string.  This function converts known CSS formats to FFmpeg's
/// `0xRRGGBB` hex notation and returns the alpha separately so callers can render
/// `boxcolor=0xRRGGBB@alpha` without any embedded commas.
///
/// Supports:
/// - `rgba(r, g, b, a)` → `("0xRRGGBB", a)`
/// - `rgb(r, g, b)`     → `("0xRRGGBB", 1.0)`
/// - `#RRGGBB`          → passed through as-is, alpha = 1.0
/// - `white`, `black`   → passed through as-is, alpha = 1.0
/// - Anything else      → passed through as-is, alpha = 1.0
fn normalize_color_for_ffmpeg(color: &str) -> (String, f64) {
    let c = color.trim();

    // rgba(r, g, b, a)
    if let Some(inner) = c.strip_prefix("rgba(").and_then(|s| s.strip_suffix(')')) {
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 4 {
            let r = parts[0].trim().parse::<u8>().unwrap_or(0);
            let g = parts[1].trim().parse::<u8>().unwrap_or(0);
            let b = parts[2].trim().parse::<u8>().unwrap_or(0);
            let a = parts[3].trim().parse::<f64>().unwrap_or(1.0).clamp(0.0, 1.0);
            return (format!("0x{:02X}{:02X}{:02X}", r, g, b), a);
        }
    }

    // rgb(r, g, b)
    if let Some(inner) = c.strip_prefix("rgb(").and_then(|s| s.strip_suffix(')')) {
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 3 {
            let r = parts[0].trim().parse::<u8>().unwrap_or(0);
            let g = parts[1].trim().parse::<u8>().unwrap_or(0);
            let b = parts[2].trim().parse::<u8>().unwrap_or(0);
            return (format!("0x{:02X}{:02X}{:02X}", r, g, b), 1.0);
        }
    }

    // Hex or named colour — pass through unchanged, alpha comes from layer.opacity
    (c.to_string(), 1.0)
}

/// Build a properly-chained FFmpeg filter_complex fragment for graphics overlays.
///
/// Returns `(filter_chain, output_label)`.
/// - `filter_chain` is the segment to append to the existing filter_complex string
///   (without a trailing semicolon).
/// - `output_label` is the named pad that the chain terminates with and that should
///   be used for downstream `-map` arguments (always `[v_out]`).
///
/// When there are no enabled layers the returned chain is empty and `output_label`
/// equals `input_label`, so the caller can use `input_label` directly for `-map`.
pub fn build_graphics_filters(
    layers: &[GraphicsLayer],
    resolution: &str,
    input_label: &str,
) -> (String, String) {
    // Parse resolution
    let res_parts: Vec<&str> = resolution.split('x').collect();
    let width: i32 = res_parts.first().and_then(|s| s.parse().ok()).unwrap_or(1920);
    let height: i32 = res_parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(1080);

    // Pre-filter to only known, renderable layer types and sort by z_index.
    let mut renderable: Vec<&GraphicsLayer> = layers.iter()
        .filter(|l| l.enabled)
        .filter(|l| matches!(l.layer_type.as_str(), "clock" | "lower_third" | "marquee"))
        .collect();
    renderable.sort_by_key(|l| l.z_index);

    if renderable.is_empty() {
        log::info!("[Graphics-F1] No renderable layers — passing through as {}", input_label);
        return (String::new(), input_label.to_string());
    }

    log::info!(
        "[Graphics-F1] Building chained filters for {} layers ({}x{}), input={}",
        renderable.len(), width, height, input_label
    );

    let total = renderable.len();
    let mut chain_parts: Vec<String> = Vec::new();
    let mut current_label = input_label.to_string();

    for (idx, layer) in renderable.iter().enumerate() {
        let (x_pos, y_pos) = calculate_position(
            layer.position_x,
            layer.position_y,
            layer.anchor.as_str(),
            width,
            height,
        );

        let font_size = layer.config.get("font_size")
            .and_then(|v| v.as_i64())
            .unwrap_or(32) as i32;
        // Lower-third and marquee use "text_color"; clock uses "font_color".
        let font_color = layer.config.get("font_color")
            .or_else(|| layer.config.get("text_color"))
            .and_then(|v| v.as_str())
            .unwrap_or("white");
        let bg_color_raw = layer.config.get("background_color")
            .and_then(|v| v.as_str())
            .unwrap_or("black@0.5");
        let layer_opacity = layer.opacity.clamp(0.0, 1.0);
        // Convert any CSS rgba()/rgb() to FFmpeg-safe hex.  Commas inside rgba()
        // shatter the filtergraph chain parser, so this conversion is mandatory.
        let (bg_color_hex, color_alpha) = normalize_color_for_ffmpeg(bg_color_raw);
        // Final alpha = color's own alpha * layer opacity (both 0-1).
        let box_alpha = (color_alpha * layer_opacity as f64 * 100.0).round() / 100.0;

        // Each element is one drawtext segment (some layers emit two).
        // Each segment gets its own intermediate label; the *very last segment
        // of the very last layer* gets [v_out].
        let is_last_layer = idx == total - 1;

        // Build ordered list of drawtext segments for this layer.
        let segments: Vec<String> = match layer.layer_type.as_str() {
            "clock" => {
                // Map the UI format string to a strftime pattern.
                // Colons inside the text='' value are already safe here because
                // they are inside the strftime pattern, not bare option separators.
                let fmt = layer.config.get("format")
                    .and_then(|v| v.as_str())
                    .unwrap_or("HH:mm:ss");
                let strftime_fmt = match fmt {
                    "HH:mm:ss"   => "%H\\:%M\\:%S",
                    "hh:mm:ss A" => "%I\\:%M\\:%S %p",
                    "HH:mm"      => "%H\\:%M",
                    "hh:mm A"    => "%I\\:%M %p",
                    _            => "%H\\:%M\\:%S",
                };
                // NOTE: FFmpeg's strftime expansion uses the SERVER timezone.
                // The UI lets the user pick a timezone but we cannot pass it
                // to drawtext directly (no TZ-aware strftime option). Best-effort
                // for now; a future improvement may prefix an `setpts` / `settb`
                // or run per-channel TZ via the process env.
                let seg = format!(
                    "drawtext=expansion=strftime:text='{}':fontsize={}:fontcolor={}:x={}:y={}:box=1:boxcolor=black@0.5:boxborderw=5",
                    strftime_fmt, font_size, font_color, x_pos, y_pos
                );
                log::info!("[Graphics-F1] Clock '{}': {}", layer.name, seg);
                vec![seg]
            },

            "lower_third" => {
                let primary_text = layer.config.get("primary_text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let secondary_text = layer.config.get("secondary_text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let text_color = layer.config.get("text_color")
                    .or_else(|| layer.config.get("font_color"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("white");
                let primary_size = layer.config.get("primary_font_size")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(32) as i32;
                let secondary_size = layer.config.get("secondary_font_size")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(24) as i32;

                let primary_escaped  = escape_drawtext(primary_text);
                let secondary_escaped = escape_drawtext(secondary_text);

                // Primary text bar
                let seg1 = format!(
                    "drawtext=text={}:fontsize={}:fontcolor={}:x={}:y={}:box=1:boxcolor={}@{}:boxborderw=10",
                    primary_escaped, primary_size, text_color, x_pos, y_pos, bg_color_hex, box_alpha
                );

                let mut segs = vec![seg1];

                // Secondary text — only if provided
                if !secondary_text.is_empty() {
                    let y2 = y_pos + primary_size + 4;
                    let seg2 = format!(
                        "drawtext=text={}:fontsize={}:fontcolor={}:x={}:y={}:box=1:boxcolor={}@{}:boxborderw=8",
                        secondary_escaped, secondary_size, text_color, x_pos, y2, bg_color_hex, box_alpha
                    );
                    segs.push(seg2);
                }

                log::info!("[Graphics-F1] LowerThird '{}': {} segment(s)", layer.name, segs.len());
                segs
            },

            "marquee" => {
                let raw = layer.config.get("text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let text = escape_drawtext(raw);
                let text_color = layer.config.get("text_color")
                    .or_else(|| layer.config.get("font_color"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("white");
                let speed = layer.config.get("scroll_speed")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(50.0);
                let direction = layer.config.get("direction")
                    .and_then(|v| v.as_str())
                    .unwrap_or("right_to_left");

                // px per frame at 25 fps; escape the comma so FFmpeg doesn't
                // treat it as a separator inside the expression.
                let px_per_frame = speed / 25.0;
                let x_expr = if direction == "left_to_right" {
                    // starts off left edge, moves right
                    format!("mod(n*{:.3}\\,w+tw)-tw", px_per_frame)
                } else {
                    // starts off right edge, moves left (default)
                    format!("w-mod(n*{:.3}\\,w+tw)", px_per_frame)
                };

                let seg = format!(
                    "drawtext=text={}:fontsize={}:fontcolor={}:x={}:y={}:box=1:boxcolor={}@{}",
                    text, font_size, text_color, x_expr, y_pos, bg_color_hex, box_alpha
                );
                log::info!("[Graphics-F1] Marquee '{}': speed={} dir={}", layer.name, speed, direction);
                vec![seg]
            },

            // Pre-filtered above — unreachable.
            _ => continue,
        };

        // Push each segment as a separate chain step with its own label.
        let seg_count = segments.len();
        for (seg_idx, drawtext) in segments.into_iter().enumerate() {
            let is_last_seg = seg_idx == seg_count - 1;
            let is_absolute_last = is_last_layer && is_last_seg;

            let out_label = if is_absolute_last {
                "[v_out]".to_string()
            } else {
                format!("[v_gfx{}]", chain_parts.len())
            };

            chain_parts.push(format!("{}{}{}", current_label, drawtext, out_label));
            current_label = out_label;
        }
    }

    // Guard: if somehow nothing was pushed, return input label.
    if chain_parts.is_empty() {
        return (String::new(), input_label.to_string());
    }

    let filter_chain = chain_parts.join(";");
    (filter_chain, current_label)
}



/// Calculate x,y position based on anchor
fn calculate_position(x: i32, y: i32, anchor: &str, width: i32, height: i32) -> (i32, i32) {
    match anchor {
        "top-left" => (x, y),
        "top-right" => (width - x - 200, y),
        "bottom-left" => (x, height - y - 50),
        "bottom-right" => (width - x - 200, height - y - 50),
        "center" => ((width - 200) / 2, (height - 50) / 2),
        _ => (x, y),
    }
}

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
    pub hw_encoder: String,
}

lazy_static! {
    static ref HW_ENCODER_CACHE: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
    static ref FASTSTART_CACHE: Mutex<HashMap<String, (bool, Instant)>> =
        Mutex::new(HashMap::new());
    pub static ref FFMPEG_SERVICE: FFmpegService = FFmpegService::new();
}

const FASTSTART_CACHE_TTL: Duration = Duration::from_secs(600);
const FASTSTART_CACHE_MAX: usize = 5000;

fn detect_hw_encoder_with_path(ffmpeg_path: &str) -> String {
    let output = Command::new(ffmpeg_path)
        .args(&["-encoders", "-hide_banner"])
        .output();

    let encoders_list = match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout).to_string(),
        Err(_) => return "libx264".to_string(),
    };

    // Priority order: Apple Silicon > NVIDIA > VAAPI > QSV > CPU
    // We also check for the device path to ensure it's not just a software stub
    let hw_encoders = [
        ("h264_videotoolbox", "Apple VideoToolbox (macOS)", None),
        ("h264_nvenc", "NVIDIA NVENC", Some("/dev/nvidia0")),
        ("h264_vaapi", "VAAPI (Intel/AMD)", Some("/dev/dri")),
        ("h264_qsv", "Intel QuickSync", Some("/dev/dri")),
    ];

    for (encoder, label, device) in &hw_encoders {
        if encoders_list.contains(encoder) {
            // If a device path is required, check if it exists
            let device_exists = if let Some(path) = device {
                std::path::Path::new(path).exists()
            } else {
                true // No device required or handled by OS (like VideoToolbox)
            };

            if device_exists {
                log::info!(
                    "[FFmpeg] Hardware encoder available and verified: {} ({})",
                    encoder,
                    label
                );
                return encoder.to_string();
            }
        }
    }

    log::info!(
        "[FFmpeg] No usable hardware encoder found (or device nodes missing), using CPU (libx264)"
    );
    "libx264".to_string()
}

fn get_cached_hw_encoder(ffmpeg_path: &str) -> String {
    let mut cache = HW_ENCODER_CACHE.lock().unwrap();
    if let Some(enc) = cache.get(ffmpeg_path) {
        return enc.clone();
    }
    let enc = detect_hw_encoder_with_path(ffmpeg_path);
    cache.insert(ffmpeg_path.to_string(), enc.clone());
    enc
}

impl FFmpegService {
    pub fn new() -> Self {
        let mut service = FFmpegService {
            ffmpeg_path: env::var("FFMPEG_PATH").unwrap_or_else(|_| "ffmpeg".to_string()),
            ffprobe_path: env::var("FFPROBE_PATH").unwrap_or_else(|_| "ffprobe".to_string()),
            hw_encoder: "libx264".to_string(), // Default placeholder
        };
        // Detect and store the best encoder (cached)
        service.hw_encoder = get_cached_hw_encoder(&service.ffmpeg_path);
        log::info!("[FFmpeg] Auto-detected H.264 encoder: {}", service.hw_encoder);
        service
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

    /// Optimize MP4 for web streaming by moving moov atom to the beginning
    /// This allows the video to start playing immediately without downloading the entire file
    pub fn optimize_for_streaming(
        &self,
        input_path: &str,
        output_path: &str,
    ) -> Result<(), String> {
        log::info!("Optimizing MP4 for streaming: {} -> {}", input_path, output_path);
        
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i",
                input_path,
                "-c",
                "copy",           // No re-encoding, just copy streams
                "-movflags",
                "+faststart",     // Move moov atom to beginning
                "-y",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg streaming optimization failed: {}", error));
        }

        log::info!("Successfully optimized MP4 for streaming: {}", output_path);
        Ok(())
    }

    /// Generate a lightweight proxy version of a video for web preview
    /// Target: 720p, H.264, AAC, CRF 23, +faststart
    pub fn generate_proxy(
        &self,
        input_path: &str,
        output_path: &str,
    ) -> Result<(), String> {
        log::info!("Generating web proxy: {} -> {}", input_path, output_path);

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", input_path,
                "-vf", "scale=-1:720", // Resize to 720p height, keep aspect ratio
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "23",          // High quality, but very efficient
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                "-y",
                output_path,
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg for proxy: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg proxy generation failed: {}", error));
        }

        log::info!("Successfully generated web proxy: {}", output_path);
        Ok(())
    }

    pub fn is_faststart_optimized(&self, file_path: &str) -> bool {
        // Cache result to avoid repeated ffprobe calls on list endpoints
        {
            let cache = FASTSTART_CACHE.lock().unwrap();
            if let Some((cached, ts)) = cache.get(file_path) {
                if ts.elapsed() <= FASTSTART_CACHE_TTL {
                    return *cached;
                }
            }
        }

        // Use ffprobe to check atom positions
        // Optimized files (faststart) have the 'moov' atom before the 'mdat' atom
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v",
                "trace",
                "-show_format",
                file_path,
            ])
            .output();

        let result = match output {
            Ok(o) => {
                if o.status.success() {
                    let stderr = String::from_utf8_lossy(&o.stderr);
                    let moov_pos = stderr.find("type='moov'");
                    let mdat_pos = stderr.find("type='mdat'");
                    
                    match (moov_pos, mdat_pos) {
                        (Some(moov), Some(mdat)) => moov < mdat,
                        _ => false,
                    }
                } else {
                    false
                }
            }
            Err(_) => false,
        };

        let mut cache = FASTSTART_CACHE.lock().unwrap();
        if cache.len() > FASTSTART_CACHE_MAX {
            cache.clear();
        }
        cache.insert(file_path.to_string(), (result, Instant::now()));

        result
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

    /// Convert media to standard format with web-optimized streaming
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
                "-movflags",
                "+faststart",  // Move moov atom to beginning for fast streaming
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
        let mut final_url = output_url.to_string();

        if output_url.starts_with("rtmp://") {
            log::debug!("📡 RTMP mapping for host: {}", output_url);
            final_url = final_url
                .replace("rtmp://localhost", "rtmp://mediamtx")
                .replace("rtmp://127.0.0.1", "rtmp://mediamtx");
        } else if output_url.starts_with("srt://") {
            if output_url.contains("mode=listener") || output_url.contains("listen=1") {
                log::info!("🎧 SRT LISTENER: Binding to all interfaces (empty host)");
                final_url = final_url
                    .replace("localhost", "")
                    .replace("127.0.0.1", "")
                    .replace("0.0.0.0", "");
            } else {
                log::info!("📞 SRT CALLER: Mapping host to mediamtx logic");
                final_url = final_url
                    .replace("localhost", "mediamtx")
                    .replace("127.0.0.1", "mediamtx");
            }
            // Ensure pkt_size=1316 for SRT to avoid MTU issues and reduce latency
            if !final_url.contains("pkt_size=") {
                if final_url.contains("?") {
                    final_url.push_str("&pkt_size=1316");
                } else {
                    final_url.push_str("?pkt_size=1316");
                }
            }
        } else if output_url.starts_with("udp://") {
            if output_url.contains("@") && (output_url.contains("localhost") || output_url.contains("127.0.0.1") || output_url.contains("://@:")) {
                log::info!("📡 UDP UNICAST HOST PUSH: Mapping to host.docker.internal (Pusher mode)");
                // To push to a listener on the host (like VLC), we MUST NOT use '@'
                // and we must use the Docker host gateway.
                final_url = final_url
                    .replace("://@", "://")
                    .replace("localhost", "host.docker.internal")
                    .replace("127.0.0.1", "host.docker.internal");
                
                if final_url.contains("://:") {
                    final_url = final_url.replace("://:", "://host.docker.internal:");
                }
            } else if output_url.contains("@") {
                log::info!("📡 UDP MULTICAST/STATIC LISTENER: Binding to all interfaces");
                final_url = final_url
                    .replace("localhost", "0.0.0.0")
                    .replace("127.0.0.1", "0.0.0.0");
                
                if !final_url.contains("://0.0.0.0") && final_url.contains("://@") {
                    final_url = final_url.replace("://@", "://@0.0.0.0");
                }
            } else {
                log::info!("📡 UDP PUSH: Mapping localhost to host.docker.internal");
                final_url = final_url
                    .replace("localhost", "host.docker.internal")
                    .replace("127.0.0.1", "host.docker.internal");
            }
            // Ensure pkt_size=1316 for UDP to avoid fragment issues and reduce latency
            if !final_url.contains("pkt_size=") {
                if final_url.contains("?") {
                    final_url.push_str("&pkt_size=1316");
                } else {
                    final_url.push_str("?pkt_size=1316");
                }
            }
        }

        final_url
    }

    /// Start a live stream from a file with HLS preview
    /// graphics_layers: Optional layers from graphics_layers table to render as overlays
    pub fn start_stream(
        &self,
        input_path: &str,
        output_url: &str,
        offset: f64,
        settings: &Settings,
        _hls_preview_path: Option<&str>,
        logo_path: Option<&str>,
        graphics_layers: Option<&[GraphicsLayer]>,
    ) -> Result<std::process::Child, String> {
        let resolution = &settings.resolution;
        let video_bitrate = &settings.video_bitrate;
        let audio_bitrate = &settings.audio_bitrate;
        let _logo_position = settings.logo_position.as_deref();
        let overlay_opacity = settings.overlay_opacity;
        let overlay_scale = settings.overlay_scale;
        let overlay_x = settings.overlay_x.unwrap_or(50);
        let overlay_y = settings.overlay_y.unwrap_or(50);
        let overlay_anchor = settings.overlay_anchor.as_deref().unwrap_or("top-right");
        let fps = &settings.fps;

        // Automatic Docker Network Fix
        let effective_output_url = self.map_output_url(output_url);

        // Log the final URL
        log::info!("✅ Final output URL: {}", effective_output_url);

        let mut args = vec![
            "-re".to_string(),
            "-fflags".to_string(),
            "+genpts+igndts".to_string(),
            "-avoid_negative_ts".to_string(),
            "make_zero".to_string(),
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

        args.extend(vec!["-i".to_string(), input_path.to_string()]);
        if offset > 0.0 {
            args.extend(vec!["-ss".to_string(), offset.to_string()]);
        }

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
        // 1. Initial scale of input video
        filter_complex.push_str(&format!("[0:v]scale={}[v_src_scaled];", resolution));

        // 2. Prepare graphics backdrop (if has logo)
        // We split the source so we can send a "clean" feed (without logo) to the Graphics editor preview.
        filter_complex.push_str("[v_src_scaled]split=2[v_to_logo][v_clean_scaled];");
        filter_complex.push_str("[v_clean_scaled]scale=640:-2[v_clean];");

        if has_logo {
            // Get opacity and scale values with defaults
            let opacity = overlay_opacity.unwrap_or(1.0).clamp(0.0, 1.0);
            let scale = overlay_scale.unwrap_or(1.0).clamp(0.1, 2.0);

            // Determine overlay position coordinates based on anchor + offsets
            let pos_coords = match overlay_anchor {
                "top-left" => format!("{}:{}", overlay_x, overlay_y),
                "bottom-left" => format!("{}:H-h-{}", overlay_x, overlay_y),
                "bottom-right" => format!("W-w-{}:H-h-{}", overlay_x, overlay_y),
                _ => format!("W-w-{}:{}", overlay_x, overlay_y), // top-right default
            };

            // Scale logo as percentage of OUTPUT VIDEO WIDTH, not its own pixels (iw).
            // Calculate absolute pixel width ahead of time to avoid FFmpeg expression format errors.
            let res_w_str = resolution.split('x').next().unwrap_or("1920");
            let res_w = res_w_str.parse::<f32>().unwrap_or(1920.0);
            let logo_pixel_width = (res_w * scale).round() as i32;

            filter_complex.push_str(&format!(
                "[1:v]scale={}:-1,format=rgba,colorchannelmixer=aa={}[logo];[v_to_logo][logo]overlay={}[v_with_logo];",
                logo_pixel_width, opacity, pos_coords
            ));
            
            // FASE 1: Add graphics layers filter after logo
            let (gfx_chain, gfx_out) = build_graphics_filters(
                graphics_layers.unwrap_or(&[]),
                resolution,
                "[v_with_logo]",
            );
            if !gfx_chain.is_empty() {
                // Chained drawtext filters already include input/output labels.
                // Append them with a trailing semicolon, then rename the final
                // output to [v_out] only if build_graphics_filters didn't already
                // produce it (it always does, but be explicit).
                filter_complex.push_str(&format!("{}", gfx_chain));
                if gfx_out != "[v_out]" {
                    filter_complex.push_str(&format!("[v_out];"));
                } else {
                    filter_complex.push_str(";");
                }
            } else {
                // No graphics layers - pipe logo output straight to [v_out]
                filter_complex.push_str(&format!("{}copy[v_out];", gfx_out));
            }
        } else {
            // No logo - check for graphics layers
            let (gfx_chain, gfx_out) = build_graphics_filters(
                graphics_layers.unwrap_or(&[]),
                resolution,
                "[v_to_logo]",
            );
            if !gfx_chain.is_empty() {
                filter_complex.push_str(&format!("{}", gfx_chain));
                if gfx_out != "[v_out]" {
                    filter_complex.push_str(&format!("[v_out];"));
                } else {
                    filter_complex.push_str(";");
                }
            } else {
                // No graphics layers - pipe input straight to [v_out]
                filter_complex.push_str(&format!("{}copy[v_out];", gfx_out));
            }
        }

        // 3. Audio Chain (Standardize to EBU R128 and split for dual output)
        filter_complex.push_str("[0:a]volume=0.8,asplit=2[a_out1][a_out2]");

        // 3. CODEC SELECTION LOGIC
        // Force transcoding if logo/overlay or graphics layers are enabled, even if "copy" was selected.
        // Filters require re-encoding.
        let has_graphics = has_logo || graphics_layers.map(|l| !l.is_empty()).unwrap_or(false);
        let v_codec = if has_graphics && settings.video_codec == "copy" {
            log::info!("[FFmpeg] Graphics enabled, forcing libx264 transcoding instead of 'copy'");
            "h264"
        } else {
            &settings.video_codec
        };

        let a_codec = if has_graphics && settings.audio_codec == "copy" {
            log::info!("[FFmpeg] Graphics enabled, forcing aac transcoding instead of 'copy'");
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
            "h264" => {
                args.extend(vec![
                    "-c:v".to_string(),
                    self.hw_encoder.clone(),
                ]);

                // Only add libx264 specific options if we are actually using libx264
                if self.hw_encoder == "libx264" {
                    args.extend(vec![
                        "-tune".to_string(), "zerolatency".to_string(),
                        "-preset".to_string(), "ultrafast".to_string(),
                        "-profile:v".to_string(), "high".to_string(),
                        "-level".to_string(), "4.1".to_string(),
                        "-threads".to_string(), "4".to_string(),
                        "-bf".to_string(), "0".to_string(),
                    ]);
                } else if self.hw_encoder.contains("vaapi") {
                    // VAAPI specific optimizations
                    args.extend(vec![
                        "-preset".to_string(), "ultrafast".to_string(), // Some vaapi versions support this
                    ]);
                } else if self.hw_encoder.contains("nvenc") {
                    args.extend(vec![
                        "-preset".to_string(), "p1".to_string(), // fastest
                        "-tune".to_string(), "ull".to_string(), // ultra low latency
                    ]);
                }

                args.extend(vec![
                    "-flags".to_string(),
                    "+global_header".to_string(),
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
                ]);
            },
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
                "-ac".to_string(),
                "2".to_string(),
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
                // FFmpeg SRT expects integer milliseconds, NOT "200ms" suffix
                final_output_url = format!("{}{}latency=200", final_output_url, separator2);
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
            // NOTE: listen=1 (FFmpeg binds and waits for receiver) is ONLY meaningful
            // when UDP is the PRIMARY output (output_type == udp). When the master
            // stream goes to MediaMTX via RTMP and the UDP relay is a separate process,
            // adding listen=1 here would cause the master FFmpeg process to bind the
            // UDP port unnecessarily, causing EADDRINUSE when the relay also starts.
            
            let is_relay_enabled = settings.udp_enabled;
            let is_primary_udp = settings.output_type == "udp";

            if final_output_url.contains("@") {
                 // Add reuse_port=1 for all listeners to facilitate rapid restart
                let separator = if final_output_url.contains('?') { "&" } else { "?" };
                if !final_output_url.contains("reuse_port=") {
                    final_output_url = format!("{}{}reuse_port=1", final_output_url, separator);
                }

                if !final_output_url.contains("listen=1") && is_primary_udp && !is_relay_enabled {
                    let sep = if final_output_url.contains('?') { "&" } else { "?" };
                    final_output_url = format!("{}{}listen=1", final_output_url, sep);
                    log::info!("📡 Primary UDP output detected. Adding listen=1 to master process.");
                } else {
                    log::debug!("📡 UDP listener detected but relay is active or not primary. Skipping master bind.");
                }
            }
        }

        let _output_format = if final_output_url.starts_with("rtmp://") {
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

        // 4. OUTPUT MAPPING & FORMAT (Dual Output: Branded Master + Clean Graphics Background)
        // Master Branded Output
        args.extend(vec![
            "-f".to_string(),
            "flv".to_string(),
            "-map".to_string(),
            "[v_out]".to_string(),
            "-map".to_string(),
            "[a_out1]".to_string(),
            final_output_url.to_string(),
        ]);

        let clean_output_url = if let Some(idx) = final_output_url.find('?') {
            format!("{}_clean{}", &final_output_url[..idx], &final_output_url[idx..])
        } else {
            format!("{}_clean", final_output_url)
        };
        // Clean feed: use ultrafast preset to minimize encoding latency.
        // This stream is only used internally by the GraphicsEditor preview \u2014
        // quality is less important than low latency here.
        args.extend(vec![
            "-f".to_string(),
            "flv".to_string(),
            "-map".to_string(),
            "[v_clean]".to_string(),
            "-map".to_string(),
            "[a_out2]".to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "ultrafast".to_string(),
            "-tune".to_string(),
            "zerolatency".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            clean_output_url,
        ]);

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
            "+genpts+igndts".to_string(),
            "-avoid_negative_ts".to_string(),
            "make_zero".to_string(),
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
            // Direct RTMP output
            args.extend(vec![
                "-f".to_string(),
                "flv".to_string(),
                final_output_url.to_string(),
            ]);
        } else if final_output_url.starts_with("srt://") {
            // SRT distribution
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
                final_output_url = format!("{}{}latency=1000", final_output_url, separator2);
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
                "mpegts".to_string(),
                "-bsf:v".to_string(),
                "h264_mp4toannexb".to_string(),
                "-bsf:a".to_string(),
                "aac_adtstoasc".to_string(),
                "-pat_period".to_string(),
                "0.1".to_string(),
                "-pcr_period".to_string(),
                "40".to_string(),
                "-mpegts_flags".to_string(),
                "+latm+initial_discontinuity+pat_pmt_at_frames".to_string(),
                "-mpegts_copyts".to_string(),
                "1".to_string(),
                "-max_delay".to_string(),
                "500000".to_string(),
                final_output_url.to_string(),
            ]);
        } else if final_output_url.starts_with("udp://") {
            // Robust multicast detection: check both with and without '@' prefix
            // Multicast range: 224.0.0.0 – 239.255.255.255
            let url_for_check = final_output_url.replace('@', "");
            let is_multicast = url_for_check.contains("://224.")
                || url_for_check.contains("://225.")
                || url_for_check.contains("://226.")
                || url_for_check.contains("://227.")
                || url_for_check.contains("://228.")
                || url_for_check.contains("://229.")
                || url_for_check.contains("://230.")
                || url_for_check.contains("://231.")
                || url_for_check.contains("://232.")
                || url_for_check.contains("://233.")
                || url_for_check.contains("://234.")
                || url_for_check.contains("://235.")
                || url_for_check.contains("://236.")
                || url_for_check.contains("://237.")
                || url_for_check.contains("://238.")
                || url_for_check.contains("://239.");

            if is_multicast {
                // Multicast PUSH: remove '@' (FFmpeg sender must use the group address directly)
                // Do NOT add listen=1 — that would make FFmpeg receive instead of send.
                final_output_url = final_output_url.replace('@', "");

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
                // reuse_port=1 allows the kernel to rebind quickly after restart (avoids EADDRINUSE)
                let separator3 = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("reuse_port=") {
                    final_output_url = format!("{}{}reuse_port=1", final_output_url, separator3);
                }
                log::info!("📡 UDP MULTICAST PUSH: {}", final_output_url);
            }

            // Unicast PUSH to Host: udp://@:port or udp://@localhost:port
            // VLC on host listens on udp://@:1234 — we push to host.docker.internal:1234
            if !is_multicast
                && (final_output_url.contains("@:") || final_output_url.contains("@localhost") || final_output_url.contains("@127.0.0.1"))
            {
                let port = final_output_url.split(':').last().unwrap_or("1234").trim_matches(|c: char| !c.is_numeric());
                final_output_url = format!("udp://host.docker.internal:{}", port);
                log::info!(
                    "📡 UDP UNICAST PUSH to host (VLC mode): {}",
                    final_output_url
                );
            } else if !is_multicast && final_output_url.contains("listen=1") {
                // Explicit listener mode: normalize binding address and add reuse_port
                if final_output_url.contains("@:") {
                    final_output_url = final_output_url.replace("@:", "0.0.0.0:");
                }
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                if !final_output_url.contains("reuse_port=") {
                    final_output_url = format!("{}{}reuse_port=1", final_output_url, separator);
                }
            }

            if !final_output_url.contains("pkt_size=") {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}pkt_size=1316", final_output_url, separator);
            }

            if !final_output_url.contains("flush_packets=") {
                let separator = if final_output_url.contains('?') {
                    "&"
                } else {
                    "?"
                };
                final_output_url = format!("{}{}flush_packets=1", final_output_url, separator);
            }

            // Direct UDP output without FIFO overhead for real-time
            args.extend(vec![
                "-f".to_string(),
                "mpegts".to_string(),
                "-bsf:v".to_string(),
                "h264_mp4toannexb".to_string(),
                "-bsf:a".to_string(),
                "aac_adtstoasc".to_string(),
                "-pat_period".to_string(),
                "0.1".to_string(),
                "-pcr_period".to_string(),
                "40".to_string(),
                "-mpegts_flags".to_string(),
                "+latm+initial_discontinuity+pat_pmt_at_frames".to_string(),
                "-mpegts_copyts".to_string(),
                "1".to_string(),
                "-buffer_size".to_string(),
                "10000000".to_string(),
                "-max_delay".to_string(),
                "500000".to_string(),
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

    /// Build FFmpeg arguments to inject SCTE-35 splice_insert markers into the stream.
    ///
    /// Each marker produces a `-bsf:v` metadata event at the given PTS offset.
    /// Call this before spawning the FFmpeg process to append the relevant args.
    ///
    /// Returns a flat Vec<String> of additional args to append to the FFmpeg command.
    pub fn build_scte35_args(markers: &[Scte35Marker]) -> Vec<String> {
        let mut args: Vec<String> = Vec::new();
        for marker in markers {
            // Insert via stream metadata — supported by FFmpeg's mpegts muxer
            args.push("-metadata:s:v:0".to_string());
            args.push(format!(
                "scte35_pts_offset={},scte35_type={},scte35_auto_return={}{}",
                marker.pts_offset,
                marker.splice_insert_type,
                if marker.auto_return { "1" } else { "0" },
                marker.duration_frames
                    .map(|d| format!(",scte35_duration_frames={}", d))
                    .unwrap_or_default(),
            ));
        }
        if !args.is_empty() {
            log::info!("[SCTE-35] Injecting {} cue marker(s) into stream", markers.len());
        }
        args
    }
}

/// Lightweight SCTE-35 marker descriptor — mirrors the DB row.
/// Defined here so ffmpeg.rs has no dependency on the sqlx model.
#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct Scte35Marker {
    pub pts_offset: i64,
    pub splice_insert_type: String,
    pub duration_frames: Option<i32>,
    pub auto_return: bool,
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
