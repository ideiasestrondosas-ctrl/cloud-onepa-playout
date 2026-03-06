-- Add system_language column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS system_language VARCHAR(5) DEFAULT 'pt';
