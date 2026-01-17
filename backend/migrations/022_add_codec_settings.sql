-- Add codec selection columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_codec TEXT DEFAULT 'copy';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS audio_codec TEXT DEFAULT 'copy';

-- Update existing row
UPDATE settings SET video_codec = 'copy', audio_codec = 'copy' WHERE id = TRUE;
