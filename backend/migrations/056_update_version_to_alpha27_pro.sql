-- Migration 056: Update version to ALPHA.27-PRO
UPDATE settings SET system_version = 'v2.2.0-ALPHA.27-PRO' WHERE id = TRUE;
