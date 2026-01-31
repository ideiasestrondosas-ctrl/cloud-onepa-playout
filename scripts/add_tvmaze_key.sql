-- Add TVMaze API key for metadata fetching
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tvmaze_api_key TEXT;
