-- Migration: Update version to v2.6.0-ALPHA.45-PRO
-- Date: 2026-03-10
-- Description: Version bump for Phase 30 (Live Inputs & Multi-Channel UI) and Phase 31 (AI Automation & High Availability)

-- Update system_version in settings table
UPDATE settings 
SET system_version = 'v2.6.0-ALPHA.45-PRO', 
    release_date = '2026-03-10',
    updated_at = NOW()
WHERE id = true;
