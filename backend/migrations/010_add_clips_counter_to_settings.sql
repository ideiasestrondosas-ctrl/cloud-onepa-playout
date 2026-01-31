-- Add clips_played_today to settings table
ALTER TABLE settings ADD COLUMN clips_played_today INTEGER DEFAULT 0;
