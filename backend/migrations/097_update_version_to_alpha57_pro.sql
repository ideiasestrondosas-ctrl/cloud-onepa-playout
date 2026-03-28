-- Migration 097: Update version to v2.6.0-ALPHA.57-PRO
UPDATE settings 
SET 
    system_version = 'v2.6.0-ALPHA.57-PRO',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
