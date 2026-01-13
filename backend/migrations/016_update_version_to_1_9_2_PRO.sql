-- Migration 016: Update version to 1.9.2-PRO
UPDATE settings 
SET system_version = '1.9.2-PRO', 
    release_date = '2026-01-13'
WHERE id = TRUE;
