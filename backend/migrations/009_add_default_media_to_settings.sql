-- Add default media paths to settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS default_image_path TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS default_video_path TEXT DEFAULT '';
