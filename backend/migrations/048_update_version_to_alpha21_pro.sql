-- Migration 048: Version bump to ALPHA-21 PRO
-- Changes:
-- - Dashboard: uptime display with ms precision (00h 00m 00s 000ms)
-- - Graphics Engine: clean preview stream (stream_clean.m3u8 without overlay)
-- - Protocol status: real-time based on relay process alive state
-- - SRT relay URL fix (publish: streamid)
-- - Settings: REPOR PADRÕES button for branding defaults

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.21-PRO',
    release_date   = '2026-02-18'
WHERE id = TRUE;
