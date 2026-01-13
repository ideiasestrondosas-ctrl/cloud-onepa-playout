-- Add overlay opacity, scale, and SRT mode settings
ALTER TABLE settings
ADD COLUMN overlay_opacity REAL DEFAULT 1.0,
ADD COLUMN overlay_scale REAL DEFAULT 1.0,
ADD COLUMN srt_mode TEXT DEFAULT 'caller';

-- Validate constraints
-- overlay_opacity: 0.0 (fully transparent) to 1.0 (fully opaque)
-- overlay_scale: 0.1 (10%) to 2.0 (200%)
-- srt_mode: 'caller' or 'listener'
