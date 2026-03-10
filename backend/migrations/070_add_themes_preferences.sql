-- Phase 1: UI theme personalization engine

CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default dark theme matching the existing neon design
INSERT INTO themes (name, config, is_default)
VALUES (
    'Default Dark',
    '{"primary":"#00e5ff","secondary":"#9c27b0","background":"#050608","surface":"rgba(13,15,20,0.7)"}',
    TRUE
)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS frontend_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
    language VARCHAR(5) DEFAULT 'en',
    config JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_themes_is_default ON themes(is_default);
