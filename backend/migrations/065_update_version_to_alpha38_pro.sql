-- Update system version to ALPHA.38-PRO (Automated Sync & Transcription Optimization)
UPDATE settings 
SET 
  system_version = 'v2.2.0-ALPHA.38-PRO',
  release_date = '2026-03-10'
WHERE id = true;
