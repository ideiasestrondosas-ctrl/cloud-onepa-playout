-- Update system version to ALPHA.30-PRO (Final v30 release with UDP push and HLS audit)
UPDATE settings 
SET 
  system_version = 'v2.2.0-ALPHA.30-PRO',
  release_date = '2026-03-01'
WHERE id = true;
