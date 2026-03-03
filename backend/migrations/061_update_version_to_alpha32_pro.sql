-- Update system version to ALPHA.32-PRO (UDP Stability & Audit Ports 3.0)
UPDATE settings 
SET 
  system_version = 'v2.2.0-ALPHA.32-PRO',
  release_date = '2026-03-03'
WHERE id = true;
