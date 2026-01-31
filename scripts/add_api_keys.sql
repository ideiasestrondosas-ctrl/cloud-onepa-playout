-- Add all missing API key columns for metadata fetching
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tmdb_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS omdb_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tvmaze_api_key TEXT;
