-- Migration: Update version to v2.6.0-ALPHA.51-PRO
-- Date: 2026-03-20
-- Description: Version bump with documentation updates (Multi-Channel, Live Inputs, System Health)

UPDATE settings
SET system_version = 'v2.6.0-ALPHA.51-PRO',
    release_date = '2026-03-20',
    updated_at = NOW();
