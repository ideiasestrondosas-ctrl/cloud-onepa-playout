-- Fix SRT Listener URL in database
-- This updates the output_url to use the correct SRT Listener configuration

UPDATE settings 
SET output_url = 'srt://0.0.0.0:9900?mode=listener'
WHERE output_url LIKE 'srt://mediamtx%' OR output_url LIKE 'srt://host.docker.internal%';

-- Verify the update
SELECT output_url, output_type FROM settings;
