-- Migration 051: Update version to v2.2.0-ALPHA.24-PRO
-- This migration updates the hardcoded system version in the database

UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.24-PRO'
WHERE id = TRUE;
