-- Migration 041: Bump version to ALPHA.6-PRO
-- Playout Engine & Protocol Stabilization release
-- Changes: SRT latency fix, MediaMTX path fix, stale sequence guard,
--          instance-level inactive counter, pause/resume, extended protocol toggles,
--          diagnose time validation, mediamtx path definitions

UPDATE settings
SET
    system_version = 'v2.2.0-ALPHA.6-PRO',
    release_date   = '2026-02-18'
WHERE id = TRUE;
