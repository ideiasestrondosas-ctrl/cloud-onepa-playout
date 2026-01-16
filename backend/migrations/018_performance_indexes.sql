-- Migration 018: Performance Indexes
-- Optimize joins and searches for schedules and playlists

-- Index for schedule lookup by date range (very common for dashboard/calendar)
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);

-- Index for playlist lookup by ID in schedule
CREATE INDEX IF NOT EXISTS idx_schedule_playlist_id ON schedule(playlist_id);

-- Index for media lookup by ID in listings
CREATE INDEX IF NOT EXISTS idx_media_is_filler ON media(is_filler) WHERE is_filler = true;

-- Index for folder searches
CREATE INDEX IF NOT EXISTS idx_media_folder_search ON media(folder_id, created_at DESC);
