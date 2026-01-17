-- Add auto_start_protocols column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_start_protocols BOOLEAN DEFAULT TRUE;

-- Set initial value for existing row
UPDATE settings SET auto_start_protocols = TRUE WHERE id = TRUE;
