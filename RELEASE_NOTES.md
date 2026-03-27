# Release Notes - Cloud Onepa Playout

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

## v2.6.0-ALPHA.50-PRO (2026-03-17)

### 🚀 Release Highlights
- **Automated Release**: Version bump and synchronization across documentation and translations.
- **Project Structure**: Updated backend and frontend configurations.

## v2.6.0-ALPHA.49-PRO (2026-03-14)

### 🚀 Release Highlights
- **Automated Release**: Version bump and synchronization.
- **i18n**: All 4 locales synchronized with latest translations.

## v2.6.0-ALPHA.46-PRO (2026-03-12)

### 🎨 UI Refinements & Navigation (Phase 32)
- **Menu Reorganization**: Sidebar now ordered as Dashboard → Live Input → EPG → Media → Playlist → MultiChannel → Calendar → Graphics → Templates → Health → Config for a more intuitive workflow.
- **Logoff Button Styling**: Logoff button now permanently uses the red alpha badge color (`#cc0000`) for a consistent, intentional visual identity.
- **Version Bump**: All components in the stack updated to `v2.6.0-ALPHA.46-PRO`.

## v2.6.0-ALPHA.45-PRO (2026-03-10)

### 🎬 Live Inputs & Multi-Channel UI (Phase 30)
- **Live Input Ingestion Service**: New service for registering and monitoring live sources (WebRTC, NDI, SDI, RTMP, SRT).
- **Social Streaming Integration**: Multi-destination streaming to YouTube Live and Facebook Live.
- **Multi-Channel Visual UI**: Grid layout dashboard with live preview thumbnails and emergency override controls.

### 🤖 AI Automation & High Availability (Phase 31)
- **AI Playlist Generation**: Media content analysis with scene detection and metadata enrichment.
- **High Availability Architecture**: Active-active playout nodes, automatic failover, and health checks.

## v2.5.0-ALPHA.44-PRO (2026-03-10)

### ☁️ Kubernetes + MinIO + CI/CD (Phase 5)
- **Helm Charts**: Complete Kubernetes manifests for all 9 services.
- **MinIO S3 Storage**: S3-compatible object storage integrated for media assets.
- **GitHub Actions**: Automated CI/CD pipeline for testing and Docker image builds.

## v2.4.0-ALPHA.43-PRO (2026-03-10)

### 📡 SCTE-35 Ad Insertion + Low-Latency HLS (Phase 4)
- **SCTE-35 REST API**: Manage ad insertion markers per playlist item.
- **LL-HLS**: Integrated low-latency HLS for sub-1s delivery.

## v2.3.0-ALPHA.41-PRO (2026-03-10)

### 🔀 UI Consolidation & Navigation Refinement (Phase 26.1)
- **Analytics → Health merge**: Combined monitoring pages into a unified Health/Analytics view.
- **Template Editor → Graphics merge**: Integrated template management directly into the Graphics menu.

## v2.3.0-ALPHA.40-PRO (2026-03-10)

### 🎨 Frontend Transformation (Phase 2)
- **Theme Personalization Engine**: Runtime theme switching from database-stored preferences.
- **Real-Time Analytics Dashboard**: Live telemetry monitoring via WebSocket and Recharts.

## v2.2.0-ALPHA.38-PRO (2026-03-10)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Transcription**: Optimized engine settings for better accuracy.
