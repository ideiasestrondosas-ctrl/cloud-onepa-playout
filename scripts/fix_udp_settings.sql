-- SQL Script to resolve UDP URL typos and reset protocol auto-start behavior
-- Fix manual typos in udp_output_url
UPDATE settings 
SET udp_output_url = REPLACE(udp_output_url, '@localhost1234', '@localhost:1234')
WHERE udp_output_url LIKE '%@localhost1234%';

-- Ensure default UDP listener format if it was corrupted
UPDATE settings
SET udp_output_url = 'udp://@localhost:1234'
WHERE udp_output_url = 'udp://@:1234' OR udp_output_url IS NULL;

-- If you want to disable ALL protocol auto-starting by default:
-- UPDATE settings SET auto_start_protocols = FALSE;

-- Monitor current protocol states
SELECT is_running, output_type, rtmp_enabled, srt_enabled, udp_enabled, auto_start_protocols, udp_output_url FROM settings;
