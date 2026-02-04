-- Update system version to v2.2.0-ALPHA.4-PRO
UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.4-PRO', 
    release_date = '2026-02-03',
    updated_at = CURRENT_TIMESTAMP
WHERE id = TRUE;
