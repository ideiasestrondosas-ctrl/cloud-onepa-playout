-- Migration 050: Update version to v2.2.0-ALPHA.23-PRO
-- This migration updates the hardcoded system version in the database

UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.23-PRO'
WHERE id = TRUE;
