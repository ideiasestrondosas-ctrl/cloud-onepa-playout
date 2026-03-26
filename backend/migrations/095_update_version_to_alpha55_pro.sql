-- Migration 095: Update version to v2.6.0-ALPHA.55-PRO
UPDATE settings 
SET 
    system_version = 'v2.6.0-ALPHA.55-PRO',
    release_date = '2026-03-26'
WHERE id = TRUE;
