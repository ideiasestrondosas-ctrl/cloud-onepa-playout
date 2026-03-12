-- Migration: Update version to v2.6.0-ALPHA.46-PRO
-- Date: 2026-03-12
-- Description: Version bump for Phase 32 (Menu Reorganization & UI Refinements)

-- Update system_version in settings table
UPDATE settings 
SET system_version = 'v2.6.0-ALPHA.46-PRO', 
    release_date = '2026-03-12',
    updated_at = NOW()
WHERE id = true;
