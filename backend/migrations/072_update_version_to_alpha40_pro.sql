-- Migration 072: Bump system version to v2.3.0-ALPHA.40-PRO (Phase 2 — Frontend Transformation)
UPDATE settings SET system_version = 'v2.3.0-ALPHA.40-PRO' WHERE TRUE;
