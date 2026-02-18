-- Migration 042: Bump version to ALPHA.7 PRO
-- Changes in this release:
--   #1/#3 - Dual HLS output: stream.m3u8 (full-res) + stream_low.m3u8 (640x360 monitor feed)
--   #2    - Relay cooldown increased 5s→15s; master-feed inactive threshold 10→20 ticks
--   #4    - Live Monitor dot turns green when HLS stream is ready (orange while waiting)
--   #5    - Quality preset change confirmation dialog in Settings
--   #6    - HLS player retry loop: up to 6 attempts × 8s = 48s before giving up
--   #7    - GraphicsEditor logo preview refreshes immediately after save (cache-bust)

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.7-PRO',
    release_date = '2026-02-18'
WHERE id = TRUE;
