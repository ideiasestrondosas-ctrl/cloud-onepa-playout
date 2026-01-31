-- Set default admin user with password 'onepa2026!'
-- The hash below is for 'onepa2026!' using bcrypt
UPDATE users 
SET password_hash = '$2b$12$gsKXwYvQNBXPNXAlt1Z02OlzM8im8il14R9yGpRO2dWivngZ/xqIi' 
WHERE username = 'admin';

INSERT INTO users (username, password_hash, role) 
SELECT 'admin', '$2b$12$gsKXwYvQNBXPNXAlt1Z02OlzM8im8il14R9yGpRO2dWivngZ/xqIi', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
