-- Update system version to v2.2.0-ALPHA.28-PRO
-- Destaques: Redesign Compacto Help System, Estabilização Migration 056, Correção RTMP Blank Fallback

UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.28-PRO',
    release_date = '2026-02-24'
WHERE id = TRUE;
