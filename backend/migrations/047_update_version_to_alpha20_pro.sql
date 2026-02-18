-- Migration 047: Version bump to ALPHA.20-PRO
-- Changes included in this release:
-- - Dashboard: UDP icon redesign + real protocol state
-- - Settings: DASH/MSS/RTSP/WebRTC UI (disabled, coming soon)
-- - Graphics: 16:9 preview proportional without external images
-- - EPG: TV Guide bar with date + open/download icons
-- - Dashboard diagnostics: full schedule name + playlist name + protocol state
-- - Logs: rotation config (size, files, compress, retention), filter, export
-- - Branding: RESTAURAR DEFAULTS button + auto-assign on new video

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.20-PRO',
    release_date   = '2026-02-18'
WHERE id = TRUE;
