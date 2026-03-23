-- Migration 090: User-Channel Access Control
-- Date: 2026-03-23
-- Description: Creates user_channel_access join table so each user can be
--              scoped to specific channels. If no rows exist for a user they
--              have access to all channels (backwards-compatible default).
--
-- Fixed: user_id is UUID (not INTEGER) — matches users.id column type.
-- Idempotent: CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS user_channel_access (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id  UUID        NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_channel_access_user_id    ON user_channel_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_access_channel_id ON user_channel_access(channel_id);

-- Verification
SELECT
  'user_channel_access' AS tbl,
  COUNT(*) AS total
FROM user_channel_access;
