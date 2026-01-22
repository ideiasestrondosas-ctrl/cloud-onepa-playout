-- Add metadata column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
