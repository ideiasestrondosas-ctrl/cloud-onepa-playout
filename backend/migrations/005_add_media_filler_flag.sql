-- Add is_filler column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_filler BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_media_is_filler ON media(is_filler);
