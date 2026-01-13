-- Migration 014: Update version to 1.9.1-PRO
UPDATE settings SET system_version = '1.9.1-PRO', release_date = '2026-01-12' WHERE id = TRUE;
