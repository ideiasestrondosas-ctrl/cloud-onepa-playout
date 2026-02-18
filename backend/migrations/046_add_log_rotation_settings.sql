-- Migration 046: Add log rotation and multi-streaming UI defaults
-- Ensures DASH/MSS/RTSP/WebRTC are disabled by default (never visible on dashboard)
-- Adds log rotation configuration columns

-- Log rotation settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS log_max_size_mb      INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS log_max_files        INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS log_compress_old     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS log_retention_days   INTEGER DEFAULT 30;

-- Ensure extended protocols are OFF by default (they are in development)
UPDATE settings SET
  dash_enabled   = FALSE,
  mss_enabled    = FALSE,
  rtsp_enabled   = FALSE,
  webrtc_enabled = FALSE,
  llhls_enabled  = FALSE,
  rist_enabled   = FALSE
WHERE id = TRUE
  AND (dash_enabled IS NULL OR mss_enabled IS NULL OR rtsp_enabled IS NULL);

-- Make sure the defaults are set on the columns too
ALTER TABLE settings
  ALTER COLUMN dash_enabled   SET DEFAULT FALSE,
  ALTER COLUMN mss_enabled    SET DEFAULT FALSE,
  ALTER COLUMN rtsp_enabled   SET DEFAULT FALSE,
  ALTER COLUMN webrtc_enabled SET DEFAULT FALSE,
  ALTER COLUMN llhls_enabled  SET DEFAULT FALSE,
  ALTER COLUMN rist_enabled   SET DEFAULT FALSE;
