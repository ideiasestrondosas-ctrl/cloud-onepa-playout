use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub ffmpeg: FfmpegConfig,
    pub storage: StorageConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FfmpegConfig {
    pub ffmpeg_path: String,
    pub ffprobe_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageConfig {
    pub media_path: String,
    pub thumbnails_path: String,
    pub playlists_path: String,
}
