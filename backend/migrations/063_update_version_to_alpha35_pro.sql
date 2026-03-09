-- Update system version to ALPHA.35-PRO (LTS Readiness & Multi-Language Models)
UPDATE settings 
SET 
  system_version = 'v2.2.0-ALPHA.35-PRO',
  release_date = '2026-03-08'
WHERE id = true;
