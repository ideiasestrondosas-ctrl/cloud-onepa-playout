-- Phase 1: Enterprise Foundation (Multi-Channel DB, Redis Event Bus, WebSocket)
-- Bumps system version to v2.3.0-ALPHA.39-PRO
UPDATE settings
SET
  system_version = 'v2.3.0-ALPHA.39-PRO',
  release_date   = '2026-03-10'
WHERE id = TRUE;
