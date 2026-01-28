-- Add custom overlay coordinates to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS overlay_x INTEGER DEFAULT 50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS overlay_y INTEGER DEFAULT 50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS overlay_anchor VARCHAR(50) DEFAULT 'top-right';

-- Update version
UPDATE settings SET system_version = 'v2.2.0-ALPHA.1', last_error = 'Applied Phase 24 Migration' WHERE id = TRUE;
