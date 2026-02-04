-- Migration 039: Set Final Defaults for Production
-- This ensures the system starts with the correct branding assets configured.

-- 1. Configure Settings with Default Assets
UPDATE settings
SET 
    -- Logo Overlay (Stream Output)
    logo_path = './assets/protected/logo_default.png',
    
    -- Branding: Default Animated Button
    default_video_path = './assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4',
    
    -- Branding: Default Static Button
    default_image_path = './assets/protected/logo_default.png'
WHERE id = TRUE;

-- 2. Register Big Buck Bunny in Media Library (if downloaded/present)
-- We use ON CONFLICT DO NOTHING to avoid errors if it was already added manually or by previous migrations.
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
    596.46, -- 9:56 approx
    1920, 
    1080, 
    'h264', 
    9000000
WHERE NOT EXISTS (
    SELECT 1 FROM media WHERE filename = 'big_buck_bunny_1080p_h264.mov'
);
