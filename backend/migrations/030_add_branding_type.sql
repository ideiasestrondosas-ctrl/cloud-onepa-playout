-- Migration 030: Add branding_type field for logo/video selection
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS branding_type VARCHAR(20) DEFAULT 'video';

-- Set default to 'video' (ANIMADO) for existing record
UPDATE settings 
SET branding_type = 'video' 
WHERE id = TRUE AND branding_type IS NULL;
