use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Settings {
    pub id: bool,
    pub output_type: String,
    pub output_url: String,
    pub resolution: String,
    pub fps: String,
    pub video_bitrate: String,
    pub audio_bitrate: String,
    pub media_path: String,
    pub thumbnails_path: String,
    pub playlists_path: String,
    pub fillers_path: String,
    pub logo_path: Option<String>,
    pub logo_position: Option<String>,
    pub day_start: Option<String>,
    pub default_image_path: Option<String>,
    pub default_video_path: Option<String>,
    pub is_running: bool,
    pub last_error: Option<String>,
    pub overlay_enabled: bool,
    pub app_logo_path: Option<String>,
    pub channel_name: Option<String>,
    pub clips_played_today: Option<i32>,
    pub overlay_opacity: Option<f32>,
    pub overlay_scale: Option<f32>,
    pub overlay_x: Option<i32>,
    pub overlay_y: Option<i32>,
    pub overlay_anchor: Option<String>,
    pub srt_mode: Option<String>,
    pub updated_at: DateTime<Utc>,
    pub system_version: Option<String>,
    pub release_date: Option<String>,
    #[sqlx(default)]
    pub protected_path: Option<String>,
    #[sqlx(default)]
    pub docs_path: Option<String>,
    pub rtmp_enabled: bool,
    pub hls_enabled: bool,
    pub srt_enabled: bool,
    pub udp_enabled: bool,
    pub rtmp_output_url: Option<String>,
    pub srt_output_url: Option<String>,
    pub udp_output_url: Option<String>,
    pub udp_mode: Option<String>,
    pub auto_start_protocols: bool,
    pub video_codec: String,
    pub audio_codec: String,
    pub dash_enabled: bool,
    pub mss_enabled: bool,
    pub rist_enabled: bool,
    pub rtsp_enabled: bool,
    pub webrtc_enabled: bool,
    pub llhls_enabled: bool,
    pub dash_output_url: Option<String>,
    pub mss_output_url: Option<String>,
    pub rist_output_url: Option<String>,
    pub rtsp_output_url: Option<String>,
    pub webrtc_output_url: Option<String>,
    pub epg_url: Option<String>,
    pub epg_days: Option<i32>,
    #[sqlx(default)]
    pub tmdb_api_key: Option<String>,
    #[sqlx(default)]
    pub omdb_api_key: Option<String>,
    #[sqlx(default)]
    pub tvmaze_api_key: Option<String>,
    #[sqlx(default)]
    pub branding_type: Option<String>,
    #[sqlx(default)]
    pub log_path: Option<String>,
    #[sqlx(default)]
    pub graphics_updated_at: Option<DateTime<Utc>>,
}

impl Settings {
    pub fn get_display_urls(&self, host: &str) -> std::collections::HashMap<String, String> {
        let mut urls = std::collections::HashMap::new();

        // 1. RTMP
        let rtmp = self
            .rtmp_output_url
            .as_deref()
            .unwrap_or("rtmp://mediamtx:1935/stream");
        urls.insert(
            "RTMP".to_string(),
            rtmp.replace("mediamtx", host)
                .replace("localhost", host)
                .replace("127.0.0.1", host),
        );

        // 2. SRT
        // 2. SRT (Fixed for VLC Reader)
        let srt = self
            .srt_output_url
            .as_deref()
            .unwrap_or("srt://mediamtx:8890?mode=caller&streamid=publish:stream_srt");
        let mut srt_final = srt
            .replace("mediamtx", host)
            .replace("localhost", host)
            .replace("127.0.0.1", host);

        // Readers (VLC) MUST be CALLER and use read: streamid
        if srt_final.contains("streamid=publish") {
            srt_final = srt_final.replace("streamid=publish", "streamid=read");
        } else if !srt_final.contains("streamid=") {
            let separator = if srt_final.contains('?') { "&" } else { "?" };
            srt_final = format!("{}{}streamid=read:stream_srt", srt_final, separator);
        }
        
        if srt_final.contains("mode=listener") {
            srt_final = srt_final.replace("mode=listener", "mode=caller");
        } else if !srt_final.contains("mode=") {
            let separator = if srt_final.contains('?') { "&" } else { "?" };
            srt_final = format!("{}{}mode=caller", srt_final, separator);
        }
        
        urls.insert("SRT".to_string(), srt_final);

        // 3. UDP (Smart formatting)
        let udp = self.udp_output_url.as_deref().unwrap_or("udp://@:1234");
        let udp_final = if udp.contains("@:") || udp.contains("@localhost") || udp.contains("@127.0.0.1") {
            // Unicast mode: FFmpeg now PUSHES to host.docker.internal
            // Client (VLC) must LISTEN on the port
            let port = udp.split(':').last().unwrap_or("1234").trim_matches(|c: char| !c.is_numeric());
            format!("udp://@:{}", port)
        } else {
            // Multicast or explicit destination: keep as is but replace host tokens
            udp.replace("mediamtx", host)
               .replace("localhost", host)
               .replace("127.0.0.1", host)
        };
        urls.insert("UDP".to_string(), udp_final);

        // 4. HLS (proxied via nginx at /hls-live/ → mediamtx:8888)
        urls.insert(
            "HLS".to_string(),
            format!("http://{}/hls-live/master/index.m3u8", host),
        );

        // 5. MASTER
        urls.insert("MASTER".to_string(), "Internal System Feed".to_string());

        urls
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub output_type: Option<String>,
    pub output_url: Option<String>,
    pub resolution: Option<String>,
    pub fps: Option<String>,
    pub video_bitrate: Option<String>,
    pub audio_bitrate: Option<String>,
    pub media_path: Option<String>,
    pub thumbnails_path: Option<String>,
    pub playlists_path: Option<String>,
    pub fillers_path: Option<String>,
    pub logo_path: Option<String>,
    pub logo_position: Option<String>,
    pub day_start: Option<String>,
    pub default_image_path: Option<String>,
    pub default_video_path: Option<String>,
    pub overlay_enabled: Option<bool>,
    pub app_logo_path: Option<String>,
    pub channel_name: Option<String>,
    pub clips_played_today: Option<i32>,
    pub overlay_opacity: Option<f32>,
    pub overlay_scale: Option<f32>,
    pub overlay_x: Option<i32>,
    pub overlay_y: Option<i32>,
    pub overlay_anchor: Option<String>,
    pub srt_mode: Option<String>,
    pub system_version: Option<String>,
    pub release_date: Option<String>,
    pub rtmp_enabled: Option<bool>,
    pub hls_enabled: Option<bool>,
    pub srt_enabled: Option<bool>,
    pub udp_enabled: Option<bool>,
    pub rtmp_output_url: Option<String>,
    pub srt_output_url: Option<String>,
    pub udp_output_url: Option<String>,
    pub udp_mode: Option<String>,
    pub auto_start_protocols: Option<bool>,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub dash_enabled: Option<bool>,
    pub mss_enabled: Option<bool>,
    pub rist_enabled: Option<bool>,
    pub rtsp_enabled: Option<bool>,
    pub webrtc_enabled: Option<bool>,
    pub llhls_enabled: Option<bool>,
    pub dash_output_url: Option<String>,
    pub mss_output_url: Option<String>,
    pub rist_output_url: Option<String>,
    pub rtsp_output_url: Option<String>,
    pub webrtc_output_url: Option<String>,
    pub epg_url: Option<String>,
    pub epg_days: Option<i32>,
    pub tmdb_api_key: Option<String>,
    pub omdb_api_key: Option<String>,
    pub tvmaze_api_key: Option<String>,
    pub branding_type: Option<String>,
    pub log_path: Option<Option<String>>,
}
