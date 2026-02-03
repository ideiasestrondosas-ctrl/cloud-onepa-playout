-- Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Profiles
INSERT INTO profiles (name, permissions, is_system) 
VALUES 
    ('Administrator', '{"read", "write", "delete", "execute"}', TRUE),
    ('Editor', '{"read", "write", "execute"}', FALSE),
    ('Viewer', '{"read"}', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Add profile_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id);

-- Migrate existing users based on role (Best Effort)
UPDATE users 
SET profile_id = (SELECT id FROM profiles WHERE name = 'Administrator') 
WHERE role = 'admin' AND profile_id IS NULL;

UPDATE users 
SET profile_id = (SELECT id FROM profiles WHERE name = 'Editor') 
WHERE role = 'editor' AND profile_id IS NULL;

UPDATE users 
SET profile_id = (SELECT id FROM profiles WHERE name = 'Viewer') 
WHERE role = 'viewer' AND profile_id IS NULL;

-- Default fallback for any others
UPDATE users 
SET profile_id = (SELECT id FROM profiles WHERE name = 'Viewer') 
WHERE profile_id IS NULL;
