-- Add epg_url column to system_settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS epg_url TEXT;
