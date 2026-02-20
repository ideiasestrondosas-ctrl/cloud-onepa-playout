-- Create media_tasks table for background job tracking
CREATE TABLE IF NOT EXISTS media_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'proxy', 'optimize'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    progress FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups by media_id
CREATE INDEX IF NOT EXISTS idx_media_tasks_media_id ON media_tasks(media_id);
