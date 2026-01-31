-- Create schedule_exceptions table to handle occurrences that should be skipped
CREATE TABLE IF NOT EXISTS schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(schedule_id, exception_date)
);
