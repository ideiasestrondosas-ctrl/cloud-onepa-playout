-- Migration 045: Add graphics_updated_at to settings
-- Used by the playout engine to detect when graphics layers change
-- and force FFmpeg restart with updated overlay composition.

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS graphics_updated_at TIMESTAMPTZ;
