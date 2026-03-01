-- Update system version to ALPHA.31-PRO (EPG Dynamic Hydration Fix)
UPDATE settings 
SET 
  system_version = 'v2.2.0-ALPHA.31-PRO',
  release_date = '2026-03-01'
WHERE id = true;
