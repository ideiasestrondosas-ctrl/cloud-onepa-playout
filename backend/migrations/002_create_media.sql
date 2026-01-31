-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    path TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- video, audio, image
    duration DOUBLE PRECISION,
    width INTEGER,
    height INTEGER,
    codec VARCHAR(100),
    bitrate BIGINT,
    thumbnail_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
