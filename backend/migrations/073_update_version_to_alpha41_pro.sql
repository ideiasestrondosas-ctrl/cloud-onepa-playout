-- Migration 073: Bump system version to v2.3.0-ALPHA.41-PRO (Phase 2 Refinement — UI Consolidation)
UPDATE settings SET system_version = 'v2.3.0-ALPHA.41-PRO' WHERE TRUE;
