-- Migration 044: Force version to ALPHA.19-PRO in all environments
-- This migration ensures the correct version is set regardless of whether
-- migration 043 was applied or not (idempotent update for VM deployments).
-- All UI screens read system_version from the DB via /api/settings — no
-- hardcoded strings in the frontend. Change version here to update everywhere.

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.19-PRO',
    release_date   = '2026-02-18'
WHERE id = TRUE;
