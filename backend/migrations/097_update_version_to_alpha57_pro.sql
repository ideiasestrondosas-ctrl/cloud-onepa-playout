-- Migration 097: Update version to v2.6.0-ALPHA.57-PRO
UPDATE settings 
SET 
    system_version = 'v2.6.0-ALPHA.57-PRO',
    release_date = '2026-03-28',
    updated_at = CURRENT_TIMESTAMP
WHERE id = TRUE;
