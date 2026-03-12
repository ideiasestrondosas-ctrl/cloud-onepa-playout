-- Migration 067: Add per-channel playout columns
ALTER TABLE channels
    ADD COLUMN IF NOT EXISTS hls_stream_path TEXT,
    ADD COLUMN IF NOT EXISTS output_url TEXT,
    ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Populate defaults for the default channel
UPDATE channels
SET
    hls_stream_path = '/var/lib/onepa-playout/hls/default/index.m3u8',
    output_url      = '',
    preview_url     = '/hls/default/index.m3u8'
WHERE id = '00000000-0000-0000-0000-000000000001';
