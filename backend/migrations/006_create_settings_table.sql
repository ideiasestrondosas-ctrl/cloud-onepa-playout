-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    output_type VARCHAR(50) NOT NULL DEFAULT 'rtmp',
    output_url VARCHAR(500) NOT NULL DEFAULT 'rtmp://localhost:1935/stream',
    resolution VARCHAR(50) NOT NULL DEFAULT '1920x1080',
    fps VARCHAR(10) NOT NULL DEFAULT '25',
    video_bitrate VARCHAR(50) NOT NULL DEFAULT '5000k',
    audio_bitrate VARCHAR(50) NOT NULL DEFAULT '192k',
    media_path TEXT NOT NULL DEFAULT '/var/lib/onepa-playout/media',
    thumbnails_path TEXT NOT NULL DEFAULT '/var/lib/onepa-playout/thumbnails',
    playlists_path TEXT NOT NULL DEFAULT '/var/lib/onepa-playout/playlists',
    fillers_path TEXT NOT NULL DEFAULT '/var/lib/onepa-playout/fillers',
    logo_path TEXT DEFAULT '',
    logo_position VARCHAR(50) DEFAULT 'top-right',
    day_start VARCHAR(10) DEFAULT '06:00',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id)
);

-- Insert default settings if not exists
INSERT INTO settings (id) VALUES (TRUE) ON CONFLICT DO NOTHING;
