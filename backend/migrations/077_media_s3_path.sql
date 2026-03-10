-- Migration 077: Add s3_path column to media table (Phase 5 — MinIO S3 Storage)
-- Allows each media asset to store its S3/MinIO object key when STORAGE_BACKEND=s3.
-- Null means the asset is stored on the local volume (legacy / default).

ALTER TABLE media ADD COLUMN IF NOT EXISTS s3_path TEXT;

CREATE INDEX IF NOT EXISTS idx_media_s3_path ON media (s3_path) WHERE s3_path IS NOT NULL;
