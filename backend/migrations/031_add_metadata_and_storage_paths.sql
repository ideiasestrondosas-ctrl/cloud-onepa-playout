-- Migration 031: Add metadata API keys and storage paths to settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS tmdb_api_key TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS omdb_api_key TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tvmaze_api_key TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS protected_path TEXT DEFAULT '/var/lib/onepa-playout/assets/protected',
ADD COLUMN IF NOT EXISTS docs_path TEXT DEFAULT '/app/docs';
