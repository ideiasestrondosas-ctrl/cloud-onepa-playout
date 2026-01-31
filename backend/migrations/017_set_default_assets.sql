-- Migration 017: Set Default Assets
-- Set the default logo path in settings
UPDATE settings 
SET logo_path = './assets/protected/logo_default.png'
WHERE id = TRUE;

-- Insert default media if it doesn't exist
INSERT INTO media (
    filename, 
    path, 
    media_type,
    duration, 
    width, 
    height, 
    codec, 
    bitrate
) 
SELECT 
    'big_buck_bunny_1080p_h264.mov', 
    './assets/protected/big_buck_bunny_1080p_h264.mov', 
    'video',
    596.46, 
    1920, 
    1080, 
    'h264', 
    9725434
WHERE NOT EXISTS (
    SELECT 1 FROM media WHERE filename = 'big_buck_bunny_1080p_h264.mov'
);
