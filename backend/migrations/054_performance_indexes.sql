-- Migration 054: Performance Indexes for Global Access
-- Adds strategic database indexes to speed up common API queries.
-- Critical for multi-user global access with a growing media library.
-- Only indexes columns that actually exist in the current schema.

-- Media table indexes: accelerates library search and path lookups
CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
CREATE INDEX IF NOT EXISTS idx_media_path ON media(path);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_folder_id ON media(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_is_filler ON media(is_filler);

-- Schedule table indexes: speeds up calendar and playlist generation queries
CREATE INDEX IF NOT EXISTS idx_schedule_start_time ON schedule(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
CREATE INDEX IF NOT EXISTS idx_schedule_playlist_id ON schedule(playlist_id);

-- Media folders: fast parent lookup for tree navigation
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);

-- Graphics layers: ordered fetching for on-air rendering
CREATE INDEX IF NOT EXISTS idx_graphics_layers_z_index ON graphics_layers(z_index);
CREATE INDEX IF NOT EXISTS idx_graphics_layers_enabled ON graphics_layers(enabled);
