-- Migration 091: Add channel_id to media table
-- Date: 2026-03-25

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE SET NULL
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE media
  SET channel_id = '00000000-0000-0000-0000-000000000001'
  WHERE channel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_channel_id ON media(channel_id);
