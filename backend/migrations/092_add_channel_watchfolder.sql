-- ── Migration 092: Add watchfolder_path to channels ──────────────────────────
-- Phase 6: Each channel can have a dedicated watchfolder directory path,
-- making it possible to drop media files for ingestion on a per-channel basis.

ALTER TABLE channels
    ADD COLUMN IF NOT EXISTS watchfolder_path TEXT;

-- Backfill default path for existing channels using their slug
UPDATE channels
    SET watchfolder_path = CONCAT('channels/', id::TEXT, '/watchfolder')
    WHERE watchfolder_path IS NULL;
