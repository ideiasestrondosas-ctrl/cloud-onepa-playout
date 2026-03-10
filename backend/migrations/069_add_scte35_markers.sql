-- Phase 1: SCTE-35 ad insertion cue markers tied to playlist items

CREATE TABLE IF NOT EXISTS scte_35_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_item_id TEXT NOT NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    splice_insert_type VARCHAR(50) DEFAULT 'splice_insert',
    pts_offset BIGINT DEFAULT 0,
    duration_frames INTEGER,
    auto_return BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scte35_markers_playlist_id      ON scte_35_markers(playlist_id);
CREATE INDEX IF NOT EXISTS idx_scte35_markers_playlist_item_id ON scte_35_markers(playlist_item_id);
