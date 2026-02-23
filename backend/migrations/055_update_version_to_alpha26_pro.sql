-- Migration 055: Update version to v2.2.0-ALPHA.26-PRO
-- Standardizing the version across all system settings

UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.26-PRO'
WHERE id = TRUE;
