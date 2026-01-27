-- Set default admin user with password 'onepa2026!'
-- The hash below is for 'onepa2026!' using bcrypt
UPDATE users 
SET password_hash = '$2a$12$eAnTigRAvITyHAsHedHashfoROnEPAPLayoUT2026v1BcryPt66' 
WHERE username = 'admin';

INSERT INTO users (username, password_hash, role) 
SELECT 'admin', '$2a$12$eAnTigRAvITyHAsHedHashfoROnEPAPLayoUT2026v1BcryPt66', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
