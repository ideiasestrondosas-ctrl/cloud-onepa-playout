-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE,
    content JSONB NOT NULL, -- JSON playlist structure (ffplayout format)
    total_duration DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playlists_date ON playlists(date);
CREATE INDEX IF NOT EXISTS idx_playlists_name ON playlists(name);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);

-- Create GIN index for JSONB content search
CREATE INDEX IF NOT EXISTS idx_playlists_content ON playlists USING GIN (content);
