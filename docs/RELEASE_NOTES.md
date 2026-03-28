# Release Notes - Cloud Onepa Playout

## v2.6.0-ALPHA.57-PRO (2026-03-28)

- **Workspace Cleanup**: Reorganized essential build scripts to `/scripts/` and removed 15+ obsolete diagnostics and temporary files.
- **Repository Audit**: Performed a deep clean of GitHub Releases and Tags, pruning all history prior to `v2.6.0-ALPHA.50-PRO`.
- **Infrastructure Translation**: Completed the professionalization of the repository by translating automation scripts (`release.sh`, `update.sh`) to English.
- **System Version Update**: Global synchronization of version to `v2.6.0-ALPHA.57-PRO` across build configs, database, and documentation.

## v2.6.0-ALPHA.56-PRO (2026-03-28)

### 🚀 Release Highlights
### Goal
Convert the entire GitHub repository presence to English, including technical documentation, user manuals, and automation scripts (`release.sh` and `update.sh`). The goal is to professionalize the repository and ensure that automatic updates inject English content.
### Actions Executed (Planning)
- **Scope Analysis:** Identified all Markdown files in the `docs/` folder, `README.md`, and scripts in `scripts/`.
- **Strategy Definition:**
  - Exclusion of Frontend translation keys (focusing only on Repository/GitHub).
  - Full translation of `release.sh` and `update.sh` (comments, logs, and prompts).
  - Adjustment of regex logic in `release.sh` to support new English headers.
  - Translation of the entire history in `resumes.md` to support English highlights extraction.
- **Plan Creation:** Documented in the internal implementation artifact.
### Completed Actions
- **Script Translation:** Successfully translated `scripts/update.sh` and `scripts/release.sh` to English.
- **Regex Update:** Modified `release.sh` to target English headers in `README.md` and `docs/ROADMAP.md`.
- **Documentation:** Translated all Markdown files (README, ROADMAP, INSTALL, FAQ, DEVELOPMENT, USER_MANUAL, RELEASE_NOTES).
- **History Update:** Fully translated `docs/resumes.md` to English and added this completion summary.
- **Verification:** Bash syntax checked for all modified scripts.
### Next Steps
1. Final review by the user of all English documentation.
2. Maintain English as the standard for all future GitHub repository documentation.
3. Clean up the `/backups/translation-to-english-20260328/` directory once stability is confirmed.
---

## v2.6.0-ALPHA.56-PRO (2026-03-27)

### 🚀 Release Highlights
### Goal
Resolve two critical blocking errors (ReferenceErrors) captured after the extreme refactoring of the system for limited hardware and memory. The first being a global boot impedance, and the second associated with interface failure in settings by the ErrorBoundary Catch.
### Actions Executed (Analysis and Planning)
- **Diagnosis Error 1 (ReferenceError: Va)**:
  - Identification of `Temporal Dead Zone` (TDZ) caused by React hoisting where components with complex virtual rendering functions (`react-window`) were allocated before handlers like `handleOptimize`, causing crashes in the browser's V8 JS Engine.
  - **Planned:** Change the internal architecture of the Virtualization DOM logic to the base of the function tree in `MediaLibrary.jsx`.
- **Diagnosis Error 2 (ReferenceError: userRoles / userProfiles is not defined)**:
  - Context verified that when extracting the users component from within `Settings.jsx` to the encapsulated import by lazy in `UsersTab`, legacy properties `userRoles` and `userProfiles` remained in the main parent JSX tree of injects referenced improperly although they were purged from the system.
  - **Planned:** Elimination of these "ghost" rendering and invocation properties, saving render tree cycles and preventing the triggering of ErrorBoundary failures.
- **Diagnosis Error 3 (ReferenceError: handleEditUser is not defined)**:
  - Confirmation of severe desynchronization in the React interface between `Settings.jsx` (Parent) and `UsersTab.jsx` (Child). Property variables were passed (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) that **no longer existed** locally in the Parent, and were also **not expected or used** by the Child.
  - Additionally, vital dependencies were left out (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessary to manage the modest internal state logic of the Users tab.
  - **Planned:** Full remapping of all attributes in the `<UsersTab />` segment in the `Settings.jsx` file.
### Next Steps
1. Obtain approval of the plan for clean and safe modification in these components.
2. Inspect results by restarting UI frames.

---

## v2.6.0-ALPHA.56-PRO (2026-03-27)

### 🚀 Release Highlights
#### Roadmap and ALPHA Documentation Update
In this session, we synchronized the ALPHA documentation and interface with the new strategic roadmap:
1. **Roadmap Phases 38 and 39**: Added to the Help and About sections of the system.
2. **Internationalization**: Full translation synchronization (PT, EN, ES, FR) for the product roadmap and release history.
3. **Version Consistency**: Global version bump across the stack and database to v2.6.0-ALPHA.56-PRO.
4. **Security and Backup**: Created backup folder `backups/pre-version-bump-alpha56/` containing original states before the transition.

## v2.6.0-ALPHA.55-PRO (2026-03-26)

### 🚀 Release Highlights
### Release Automation and Dynamic Documentation
In this session, we focused on improving the release process and automatically updating public documentation:
1. **Release Script (`release.sh`)**:
   - **Automatic Date**: Implemented the `RELEASE_DATE` variable to capture the actual release date.
   - **Interactive Highlights**: The script now prompts the user to enter release highlights (`RELEASE_HIGHLIGHTS`) during the release process.
   - **Full Automation**: The script now automatically updates `README.md`, `docs/ROADMAP.md`, `RELEASE_NOTES.md`, and `docs/RELEASE_NOTES.md` with the new version, date, and highlights.
2. **Internal Documentation (`README.md` & `ROADMAP.md`)**:
   - **New Section**: Created the `### 🆕 News & Changes` section in `README.md`, strategically located after the Roadmap for immediate visibility.
   - **Roadmap History**: `docs/ROADMAP.md` now automatically receives a new entry in the version history table on each release.
   - **Version Formatting**: Standardized the "Current Version" format to include the full date: `vX.X.X (YYYY-MM-DD)`.
3. **Security and Backup**:
   - Created a backup folder (`backups/pre-release-update-...`) containing the original states of all modified files before implementing improvements.

## v2.6.0-ALPHA.55-PRO (2026-03-25)

### 🧩 Mosaic Monitoring & Multi-Channel Isolation
- **Master Dashboard**: Implemented new Mosaic view for passive monitoring of all channels. Designed for master control rooms, providing a low-latency grid of all active HLS streams.
- **Playout Engine**: Fixed critical bug where protocol settings (RTMP/SRT/UDP) were sometimes parsed with extra JSON quotes, causing FFmpeg to crash upon startup.
- **Watchfolder**: Implemented per-channel isolation. The synchronization service now respects the `activeChannelId`, preventing cross-contamination of media libraries.
- **System Health**: Complete refactoring of diagnostics and telemetry to be fully channel-aware. Bitrate charts and status indicators now map correctly to each channel instance.
- **i18n Translation**: Completed full localization for all Multi-Channel features across English, Portuguese, Spanish, and French.
- **Help System**: Added comprehensive documentation and step-by-step guides for the new Multi-Channel architecture and Mosaic features.

## v2.6.0-ALPHA.53-PRO (2026-03-25)

### ✨ Multi-Channel Polish & Diagnostics
- **Master Dashboard**: Removed redundant "ON AIR" labels from channel mosaics for a cleaner, unified monitor look.
- **Master Dashboard**: Added a new visual heartbeat animation and glowing azure border for the currently active channel to improve navigation context.
- **System Health**: Refactored the backend WebSocket bridge (`EventBus`) to support dynamic multi-channel telemetry. Analytics and bitrate monitoring are now correctly isolated by the selected channel.
- **TV Guide (Calendar)**: Fixed a long-standing issue where EPG data from the default channel would leak into empty channels. Exports and previews now strictly respect the `activeChannelId`.
- **Global Versioning**: Synchronized all stack components (DB, Backend, Frontend) to the `v2.6.0-ALPHA.53-PRO` release.

## v2.6.0-ALPHA.52-PRO (2026-03-20)

### 🎨 Graphics Templates Integration
- **Templates Manager**: Migration of standalone Templates page into the Graphics menu as a dedicated tab.
- **Presets**: Integrated three new production-ready templates (Morning Show, Full Day, Loop Content).
- **Automation**: Added "Generate Playlist from Template" functionality to streamline daily scheduling.

## v2.6.0-ALPHA.51-PRO (2026-03-20)

### 📚 Documentation & i18n
- **Help System**: Comprehensive help articles added for Multi-Channel, Live Inputs, and System Health.
- **Localization**: Full parity between PT, EN, FR, and ES for all new enterprise features.

### 🚀 Release Highlights
- **Automated Release**: Version bump and synchronization across documentation and translations.
- **Project Structure**: Updated backend and frontend configurations.

## v2.6.0-ALPHA.49-PRO (2026-03-14)

### 🐛 Bug Fixes & i18n Synchronization

**Bug Fixes**
- `HelpSystem` component: Added missing `HelpTemplates`, `HelpLiveInputs`, `HelpHealth`, `HelpMultiChannel` sub-components.
- Missing Material-UI icons (`FavoriteIcon`, `TableChartIcon`) added to imports.

**Language Selector**
- Fixed i18n persistence and language change detection — selected language now correctly persists across page reloads.

**Graphics Preview**
- Optimized rendering performance with memoization and lazy loading.

**Multi-Channel Preview**
- Fixed WebSocket connection and state synchronization issues.

**Version History**
- Updated About/System panel with ALPHA.49-PRO release notes.

**i18n**
- All 4 locales (PT, EN, ES, FR) synchronized with latest translations.

---

## v2.3.0-ALPHA.40-PRO (2026-03-10)

### 🎨 Frontend Transformation — Phase 2

_Version series: v2.3.x — Enterprise Broadcast Platform Upgrade_

**Theme Personalization Engine**
- `ThemeContext.jsx`: `buildMuiTheme(config)` builds a full MUI theme from a config object. `applyCssVars(config)` sets `--primary-color`, `--secondary-color`, `--bg-color`, `--surface-color` on `:root`. `ThemeContextProvider` loads user preferences from `/api/v2/analytics/preferences/{userId}` on login and applies the theme via `onThemeChange` callback.
- `App.jsx`: `useState(() => buildMuiTheme())` holds active MUI theme state; `ThemeProvider` receives live state for runtime switching.

**Mobile Responsive Layout**
- `Layout.jsx`: Mobile drawer closes on any route navigation.
- Analytics (`/analytics`) and Template Editor (`/graphics/template-editor`) added to sidebar with icons.
- All 4 i18n locales (EN/PT/ES/FR) updated with `navigation.analytics` and `navigation.templateEditor` keys.

**Real-Time Analytics Dashboard (`/analytics`)**
- WebSocket connection to `/api/v2/events?token=<JWT>` with auto-reconnect.
- Recharts `LineChart` for live stream bitrate; `BarChart` for clips/day (last 7 days from as-run REST).
- KPI cards: Clips Today, Stream Health, Error Rate, Live Events.

**Drag-and-Drop Graphics Template Editor (`/graphics/template-editor`)**
- 16:9 canvas, @dnd-kit drag-from-palette, absolute-positioned elements.
- Component types: Text, Clock, Lower Third, Marquee, Shape, Image.
- Property Inspector with position, size, opacity, type-specific fields.
- Save to templates API via `POST /api/templates`.

**Dependencies & Migrations**
- `recharts@^2.12.0` added to frontend.
- Migration 072: `system_version` → `v2.3.0-ALPHA.40-PRO`.

## v2.3.0-ALPHA.39-PRO (2026-03-10)

### 🏗️ Enterprise Foundation — Phase 1

_Version series: v2.3.x — Enterprise Broadcast Platform Upgrade_

**Database & Schema**
- New `channels` table with UUID PK + slug routing. Default channel pre-seeded for zero-disruption migration of all existing data.
- `channel_id` FK added to: `playlists`, `schedule`, `media`, `folders`, `graphics_layers`, `settings`.
- New `audit_logs`: immutable user action trail.
- New `as_run_logs`: frame-accurate broadcast compliance log (proof-of-play).
- New `scte_35_markers`: ad-insertion cue points.
- New `themes` + `frontend_preferences`: per-user UI theme personalization.

**Infrastructure**
- Redis 7-alpine added to Docker Compose (`alpha-redis`, port 6379).

**Backend**
- `EventBus` service: Redis Pub/Sub, publishes `clip_start` on every clip transition.
- WebSocket `GET /api/v2/events?token=<JWT>`: live telemetry streaming.
- Engine: inserts `as_run_logs` row on clip start and gapless crossings.

**New v2 API**
- `/api/v2/channels` CRUD
- `/api/v2/analytics/as-run` — compliance logs
- `/api/v2/analytics/audit-logs` — audit trail
- `/api/v2/analytics/themes` — theme management
- `/api/v2/analytics/preferences/{user_id}` — user preferences

---

## v2.2.0-ALPHA.38-PRO (2026-03-10)

### 🚀 Release Highlights
- **Automated Release**: Version bump to ALPHA.38-PRO.
- **Documentation**: Synced README.md, RELEASE_NOTES.md and frontend constants.
- **Improved Transcription**: Optimized engine settings for better accuracy.

## v2.2.0-ALPHA.35-PRO (2026-03-08)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.
- **i18n Health**: Added system health dashboard translations.

## v2.2.0-ALPHA.34-PRO (2026-03-05)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.32-PRO (2026-03-03)

### 🚀 Release Highlights
- **UDP Stability**: Corrected Unicast PUSH mode to resolve "Address already in use" errors on Host, allowing VLC to act as the sole listener.
- **Audit Ports 3.0**: New diagnostic engine with intelligent receiver detection (VLC) and refined socket filtering.
- **Log Management**: Implemented log rotation (10MB/3-files) and enhanced container persistence to prevent disk space issues.
- **Script Versioning**: Standardized application version output across all operational scripts (.sh and .bat) for cross-platform transparency.
- **Process Guard**: Internal protection against port collisions between master and relay processes in the Playout Engine.
- **System Sync**: Full synchronization of version v2.2.0-ALPHA.32-PRO across Database, Backend, and Frontend.

## v2.2.0-ALPHA.31-PRO (2026-03-01)

### 🚀 Release Highlights
- **Dynamic EPG Hydration**: Resolved major issue where TV Guide metadata became stale. Metadata is now fetched in real-time from the Media Library.
- **Improved Duplication Support**: Clips duplicated in playlists (with ID suffixes) are now correctly hydrated with their latest metadata.
- **EPG XML Enhancements**: Exported XML now includes rich descriptions and categories for better IPTV compatibility.
- **Automation**: Synchronized application versioning across Frontend, Backend, and Database.

## v2.2.0-ALPHA.30-PRO (2026-02-28)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.29-PRO (2026-02-27)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.28-PRO (2026-02-24)

### 🚀 Release Highlights
- **High-Density Help System**: Massive redesign of the `?` menu for maximum occupancy and efficient readability.
- **Protocol Stability**: Fixed RTMP failure when output URL is empty (smart fallback).
- **Backend Recovery**: Resolved `VersionMismatch` conflict and stabilized container startup.
- **Automation Integrity**: Corrected version suffix logic in build and release scripts.

## v2.2.0-ALPHA.27-PRO (2026-02-23)

### 🚀 Release Highlights
- **Surgical Compact Redesign**: Massive refining of paddings (3->1.5) and margins (4->2) across all main views for maximum information density.
- **EPG & Calendar Optimization**: Reduction of line heights and compaction of sidebars, allowing more events to be seen without scrolling.
- **Dashboard Protocol Focus**: Protocol bar and live monitor adjusted to prioritize real-time telemetry and logs.
- **Bug Fix (Stability)**: Resolved `ReferenceError: EditIcon is not defined` causing crash in user profile management.

## v2.2.0-ALPHA.26-PRO (2026-02-23)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.25-PRO (2026-02-22)

### 🚀 Release Highlights
- **ALPHA.25 Consolidation**: Full synchronization of version v2.2.0-ALPHA.25-PRO across the ecosystem (DB, Backend, Frontend).
- **Reality Sync Engine**: Robust engine with global path support (Media, Assets, Fillers, Protected) for physical file detection.
- **Storage Transparency**: MB/GB diagnostics restored in Settings with real-time visualization.
- **Professional Filter**: Protected system assets (Logos/Vortex) hidden from Media Library, keeping only standard video.
- **Streaming Performance**: Native Range Request support and network optimization for instant loading.
- **Data Cleanup**: Automatic database cleaning to remove system asset residues.

## v2.2.0-ALPHA.24-PRO (2026-02-20)

### 🚀 Release Highlights
- **Pending Details**: This version needs consolidation of release notes.
