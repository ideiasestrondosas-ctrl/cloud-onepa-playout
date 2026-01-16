use crate::models::media::Media;
use crate::services::ffmpeg::FFmpegService;
use sqlx::PgPool;
use std::env;
use std::path::Path;
use uuid::Uuid;

pub async fn ensure_default_assets(pool: &PgPool) -> Result<(), String> {
    log::info!("🚀 Starting system restoration & asset check...");

    let assets_path =
        env::var("ASSETS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());
    let thumbnails_path = env::var("THUMBNAILS_PATH")
        .unwrap_or_else(|_| "/var/lib/onepa-playout/thumbnails".to_string());
    let protected_dir = format!("{}/protected", assets_path);

    let ffmpeg = FFmpegService::new();

    // 1. ENSURE DEFAULT VIDEO
    let video_filename = "big_buck_bunny_1080p_h264.mov";
    let video_path = format!("{}/{}", protected_dir, video_filename);

    if Path::new(&video_path).exists() {
        log::info!("✅ Default video found at {}", video_path);

        // Extract metadata
        let info = ffmpeg
            .get_media_info(&video_path)
            .map_err(|e| format!("Failed to probe default video: {}", e))?;

        // Generate thumbnail if missing
        let thumb_filename = format!("default_video_thumb.jpg");
        let thumb_path = format!("{}/{}", thumbnails_path, thumb_filename);
        if !Path::new(&thumb_path).exists() {
            log::info!("🖼️ Generating thumbnail for default video...");
            let _ = ffmpeg.generate_thumbnail(&video_path, &thumb_path, 1.0);
        }

        // UPSERT into media table with ABSOLUTE CONTAINER PATH
        // Check if exists by filename (since path might change from relative to absolute)
        let existing = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE filename = $1")
            .bind(video_filename)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(m) = existing {
            log::info!("🔄 Updating existing default media record metadata and path...");
            sqlx::query("UPDATE media SET path = $1, duration = $2, width = $3, height = $4, codec = $5, bitrate = $6, thumbnail_path = $7 WHERE id = $8")
                .bind(&video_path)
                .bind(info.duration)
                .bind(info.width)
                .bind(info.height)
                .bind(&info.codec)
                .bind(info.bitrate)
                .bind(Some(thumb_path))
                .bind(m.id)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            log::info!("➕ Inserting new default media record...");
            let media_id = Uuid::new_v4();
            sqlx::query("INSERT INTO media (id, filename, path, media_type, duration, width, height, codec, bitrate, thumbnail_path, is_filler) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
                .bind(media_id)
                .bind(video_filename)
                .bind(&video_path)
                .bind("video")
                .bind(info.duration)
                .bind(info.width)
                .bind(info.height)
                .bind(&info.codec)
                .bind(info.bitrate)
                .bind(Some(thumb_path))
                .bind(false)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    } else {
        log::warn!(
            "⚠️ Default video NOT FOUND at {}. Playout might fail to initialize default.",
            video_path
        );
    }

    // 2. ENSURE DEFAULT LOGO
    let logo_filename = "logo_default.png";
    let logo_path = format!("{}/{}", protected_dir, logo_filename);

    if Path::new(&logo_path).exists() {
        log::info!(
            "✅ Default logo found at {}. Correcting settings path...",
            logo_path
        );

        // Update settings table with absolute path
        sqlx::query("UPDATE settings SET logo_path = $1 WHERE id = TRUE")
            .bind(&logo_path)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        log::warn!("⚠️ Default logo NOT FOUND at {}.", logo_path);
    }

    // 3. GLOBAL PATH CORRECTION (Playlists & Media Cleanup)
    log::info!("🧹 Cleaning up database paths and duplicates...");

    // Fix paths in playlists JSON
    let _ = sqlx::query(
        "UPDATE playlists SET content = CAST(REPLACE(content::text, './assets/protected/', $1) AS jsonb) WHERE content::text LIKE '%./assets/protected/%'"
    )
    .bind(format!("{}/", protected_dir))
    .execute(pool)
    .await;

    // Remove duplicates from media table (keep the first one, usually the one with the smallest/original ID if possible,
    // but here we just want one that works. The startup logic already updated one.)
    let _ = sqlx::query(
        "DELETE FROM media WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER(PARTITION BY filename ORDER BY path DESC, id ASC) as row_num 
                FROM media WHERE filename = $1
            ) t WHERE row_num > 1
        )"
    )
    .bind(video_filename)
    .execute(pool)
    .await;

    log::info!("✨ System restoration check complete.");
    Ok(())
}
