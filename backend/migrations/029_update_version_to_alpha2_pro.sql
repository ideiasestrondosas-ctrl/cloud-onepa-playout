-- Update system version to v2.2.0-ALPHA.2-PRO
UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.2-PRO', 
    release_date = '2026-01-30',
    updated_at = CURRENT_TIMESTAMP
WHERE id = TRUE;
