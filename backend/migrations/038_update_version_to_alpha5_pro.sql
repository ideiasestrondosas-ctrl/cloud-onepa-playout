-- Update system version to v2.2.0-ALPHA.5-PRO
UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.5-PRO', 
    release_date = '2026-02-04',
    updated_at = CURRENT_TIMESTAMP
WHERE id = TRUE;
