-- Migration 019: Add independent protocol settings
ALTER TABLE settings
ADD COLUMN rtmp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN hls_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN srt_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN udp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN rtmp_output_url TEXT,
ADD COLUMN srt_output_url TEXT,
ADD COLUMN udp_output_url TEXT;

-- Initialize URLs from existing output_url based on output_type
UPDATE settings 
SET rtmp_output_url = CASE WHEN output_type = 'rtmp' THEN output_url ELSE 'rtmp://mediamtx:1935/live/stream' END,
    srt_output_url = CASE WHEN output_type = 'srt' THEN output_url ELSE 'srt://mediamtx:8890?mode=caller&streamid=publish:live/stream' END,
    udp_output_url = CASE WHEN output_type = 'udp' THEN output_url ELSE 'udp://@239.0.0.1:1234' END,
    rtmp_enabled = CASE WHEN output_type = 'rtmp' AND is_running = TRUE THEN TRUE ELSE FALSE END,
    hls_enabled = CASE WHEN output_type = 'hls' AND is_running = TRUE THEN TRUE ELSE FALSE END,
    srt_enabled = CASE WHEN output_type = 'srt' AND is_running = TRUE THEN TRUE ELSE FALSE END,
    udp_enabled = CASE WHEN output_type = 'udp' AND is_running = TRUE THEN TRUE ELSE FALSE END
WHERE id = TRUE;

-- Update version to 1.9.4-PRO (since I already did some fixes in 1.9.3 context)
UPDATE settings 
SET system_version = '1.9.4-PRO', 
    release_date = '2026-01-16'
WHERE id = TRUE;
