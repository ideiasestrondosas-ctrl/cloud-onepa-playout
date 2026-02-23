-- Migration 043: Bump version to ALPHA.19 PRO
-- Changes in this release:
--   Black screen fix: GlobalErrorBoundary in main.jsx, HelpSystem toggleHelpMode fix
--   Login: replaced external Unsplash image with local CSS gradient (offline-safe)
--   Settings: curated 19-version history, scrollable release notes panel
--   Versioning: corrected all hardcoded fallbacks from ALPHA.4 to ALPHA.19
--   Docs: fixed -PRO typo in README/RELEASE_NOTES, corrected v2.3→v2.2 in DEPLOY.md

UPDATE settings
SET system_version = 'v2.2.0-ALPHA.19-PRO',
    release_date = '2026-02-18'
WHERE id = TRUE;
