-- Migration 049: Version bump to ALPHA-22 PRO
-- Changes:
-- - Dashboard: professional icon-based control panel (PlayCircle/StopCircle/Cast/Terminal/SkipNext)
-- - Dashboard: dynamic visual states with color + icon + glow animations per ON AIR/OFF AIR state
-- - Dashboard: pulse/glow animations on main button and active distribution
-- - Settings: complete release history up to ALPHA.22

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.22-PRO',
    release_date   = '2026-02-18'
WHERE id = TRUE;
