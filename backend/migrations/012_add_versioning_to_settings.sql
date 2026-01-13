-- Migration 012: Add versioning and release info to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS system_version VARCHAR(50) DEFAULT '1.9.0-PRO';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS release_date VARCHAR(50) DEFAULT '2026-01-12';

-- Update the existing record if it exists
UPDATE settings SET system_version = '1.9.0-PRO', release_date = '2026-01-12' WHERE id = TRUE;
