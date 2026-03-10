-- Migration 074: Extend existing media_tasks table for AI job queue (Phase 3)
-- The table already exists (from earlier migration) with schema:
--   id, media_id, task_type, status, error_message, progress, created_at, updated_at
-- We extend it with AI-worker-specific columns and performance indexes.

ALTER TABLE media_tasks ADD COLUMN IF NOT EXISTS priority     INTEGER     NOT NULL DEFAULT 5;
ALTER TABLE media_tasks ADD COLUMN IF NOT EXISTS metadata     JSONB       NOT NULL DEFAULT '{}';
ALTER TABLE media_tasks ADD COLUMN IF NOT EXISTS started_at   TIMESTAMPTZ;
ALTER TABLE media_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_media_tasks_status_type ON media_tasks (status, task_type);
CREATE INDEX IF NOT EXISTS idx_media_tasks_media_id    ON media_tasks (media_id);
CREATE INDEX IF NOT EXISTS idx_media_tasks_created_at  ON media_tasks (created_at DESC);
