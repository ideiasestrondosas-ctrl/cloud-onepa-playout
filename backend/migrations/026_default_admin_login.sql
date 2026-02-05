-- Set default admin user with password 'admin'
-- The hash below is for 'admin' using bcrypt (cost 5)
UPDATE users 
SET password_hash = '$2y$05$IJ1yULEbPMcwHzziYiqp6eQjAlTrPWPyez4IhogK4DcLMBaasPJwe' 
WHERE username = 'admin';

INSERT INTO users (username, password_hash, role) 
SELECT 'admin', '$2y$05$IJ1yULEbPMcwHzziYiqp6eQjAlTrPWPyez4IhogK4DcLMBaasPJwe', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
