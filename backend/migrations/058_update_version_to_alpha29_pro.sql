-- Update system version to v2.2.0-ALPHA.29-PRO
-- Destaques: Auditoria de Tráfego 2.0, Clean Feed para Gráficos, Dual-Stream Playout Engine

UPDATE settings 
SET system_version = 'v2.2.0-ALPHA.29-PRO',
    release_date = '2026-02-27'
WHERE id = TRUE;
