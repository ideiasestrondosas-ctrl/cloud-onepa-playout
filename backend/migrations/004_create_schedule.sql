-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    repeat_pattern VARCHAR(50), -- daily, weekly, monthly, null for one-time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
CREATE INDEX IF NOT EXISTS idx_schedule_playlist_id ON schedule(playlist_id);

-- Create unique constraint to prevent duplicate schedules for same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_unique_date 
ON schedule(date) WHERE repeat_pattern IS NULL;
