-- Migration: Update version to v2.6.0-ALPHA.50-PRO
-- Date: 2026-03-17
-- Description: Version bump for Phase 33 (Version Fix & Migration Chain Repair)

-- Update system_version and release_date in settings table
UPDATE settings 
SET system_version = 'v2.6.0-ALPHA.50-PRO', 
    release_date = '2026-03-17',
    updated_at = NOW()
WHERE id = true;
