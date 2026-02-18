-- Add log_path to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS log_path TEXT DEFAULT '/var/log/onepa/playout.log';

-- Update system version
UPDATE settings SET system_version = 'v2.2.0-ALPHA.18-PRO', release_date = CURRENT_DATE;
