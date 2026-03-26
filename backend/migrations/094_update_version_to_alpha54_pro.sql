-- Migration 094: Update version to v2.6.0-ALPHA.54-PRO
UPDATE settings 
SET 
    system_version = 'v2.6.0-ALPHA.54-PRO',
    release_date = '2026-03-25'
WHERE id = TRUE;
