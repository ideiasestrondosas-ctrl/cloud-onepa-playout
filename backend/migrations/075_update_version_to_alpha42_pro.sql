-- Migration 075: Bump system version to v2.4.0-ALPHA.42-PRO (Phase 3 — Microservices)
UPDATE settings SET system_version = 'v2.4.0-ALPHA.42-PRO' WHERE TRUE;
