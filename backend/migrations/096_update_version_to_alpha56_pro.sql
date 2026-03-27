-- Migration 096: Update version to v2.6.0-ALPHA.56-PRO
UPDATE settings
SET
    system_version = 'v2.6.0-ALPHA.56-PRO',
    release_date = '2026-03-27',
    updated_at = '2026-03-27 23:43:00'
WHERE id = TRUE;
