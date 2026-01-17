-- Add columns for new distribution protocols and low-latency features
ALTER TABLE settings 
ADD COLUMN dash_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN mss_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN rist_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN rtsp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN webrtc_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN llhls_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN dash_output_url TEXT,
ADD COLUMN mss_output_url TEXT,
ADD COLUMN rist_output_url TEXT,
ADD COLUMN rtsp_output_url TEXT,
ADD COLUMN webrtc_output_url TEXT;

-- Set default URLs for evaluation/local testing
UPDATE settings SET 
    dash_output_url = '/var/lib/onepa-playout/hls/dash.mpd',
    mss_output_url = '/var/lib/onepa-playout/hls/stream.ism',
    rist_output_url = 'rist://127.0.0.1:1234',
    rtsp_output_url = 'rtsp://localhost:8554/live/stream',
    webrtc_output_url = 'http://localhost:8889/live/stream'
WHERE id = TRUE;
