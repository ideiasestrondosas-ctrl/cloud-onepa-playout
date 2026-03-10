-- Phase 1: As-run log for broadcast compliance (proof-of-play)

CREATE TABLE IF NOT EXISTS as_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES media(id) ON DELETE SET NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    clip_id TEXT,
    clip_filename TEXT,
    actual_start TIMESTAMPTZ NOT NULL,
    actual_end TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'playing',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_run_logs_channel_id   ON as_run_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_as_run_logs_actual_start ON as_run_logs(actual_start DESC);
CREATE INDEX IF NOT EXISTS idx_as_run_logs_playlist_id  ON as_run_logs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_as_run_logs_status       ON as_run_logs(status);
