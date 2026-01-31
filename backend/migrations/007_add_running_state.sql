-- Add is_running to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS is_running BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS last_error TEXT;
