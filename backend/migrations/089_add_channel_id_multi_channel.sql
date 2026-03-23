-- Migration 089: Multi-Channel support — add channel_id to all tables
-- Date: 2026-03-21
-- Description: Adds channel_id FK to playlists, schedule, graphics_layers, templates.
--              Creates channel_settings table for per-channel overrides.
--
-- All existing data is assigned to the default channel (00000000-0000-0000-0000-000000000001).
-- All changes are idempotent (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).

-- ─── 1. playlists ───────────────────────────────────────────────────────────
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE SET NULL
    DEFAULT '00000000-0000-0000-0000-000000000001';

-- Back-fill any existing rows that are still NULL
UPDATE playlists
  SET channel_id = '00000000-0000-0000-0000-000000000001'
  WHERE channel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_playlists_channel_id ON playlists(channel_id);

-- ─── 2. schedule ────────────────────────────────────────────────────────────
ALTER TABLE schedule
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE SET NULL
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE schedule
  SET channel_id = '00000000-0000-0000-0000-000000000001'
  WHERE channel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_channel_id ON schedule(channel_id);

-- ─── 3. graphics_layers ─────────────────────────────────────────────────────
ALTER TABLE graphics_layers
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE SET NULL
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE graphics_layers
  SET channel_id = '00000000-0000-0000-0000-000000000001'
  WHERE channel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_graphics_layers_channel_id ON graphics_layers(channel_id);

-- ─── 4. templates ───────────────────────────────────────────────────────────
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE templates
  SET channel_id = '00000000-0000-0000-0000-000000000001'
  WHERE channel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_templates_channel_id ON templates(channel_id);

-- ─── 5. channel_settings (per-channel overrides) ────────────────────────────
CREATE TABLE IF NOT EXISTS channel_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID        NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,
  value       JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, key)
);

CREATE INDEX IF NOT EXISTS idx_channel_settings_channel_id ON channel_settings(channel_id);

-- ─── 6. Verification ────────────────────────────────────────────────────────
SELECT
  'playlists'       AS tbl,
  COUNT(*)          AS total,
  COUNT(channel_id) AS with_channel_id
FROM playlists
UNION ALL
SELECT
  'schedule',
  COUNT(*),
  COUNT(channel_id)
FROM schedule
UNION ALL
SELECT
  'graphics_layers',
  COUNT(*),
  COUNT(channel_id)
FROM graphics_layers
UNION ALL
SELECT
  'templates',
  COUNT(*),
  COUNT(channel_id)
FROM templates
UNION ALL
SELECT
  'channel_settings',
  COUNT(*),
  0
FROM channel_settings;
