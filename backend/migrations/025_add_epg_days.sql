-- Add epg_days column to system_settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS epg_days INTEGER DEFAULT 7;
