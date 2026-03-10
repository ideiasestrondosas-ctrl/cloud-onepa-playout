-- Phase 1: Multi-channel support - channels table and channel_id scoping

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default channel (fixed UUID so migrations are idempotent)
INSERT INTO channels (id, name, slug, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Channel', 'default', 'Primary broadcast channel')
ON CONFLICT (id) DO NOTHING;

-- Add channel_id to core tables (all default to the single default channel)
ALTER TABLE playlists      ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE schedule       ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE media          ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE folders        ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE graphics_layers ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE settings       ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- Indexes for fast channel-scoped queries
CREATE INDEX IF NOT EXISTS idx_playlists_channel_id      ON playlists(channel_id);
CREATE INDEX IF NOT EXISTS idx_schedule_channel_id       ON schedule(channel_id);
CREATE INDEX IF NOT EXISTS idx_media_channel_id          ON media(channel_id);
CREATE INDEX IF NOT EXISTS idx_folders_channel_id        ON folders(channel_id);
CREATE INDEX IF NOT EXISTS idx_graphics_layers_channel_id ON graphics_layers(channel_id);
