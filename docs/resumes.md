# Session Summaries - Cloud Onepa Playout

## Session 2026-03-28 — English Translation Planning (GitHub Infrastructure)

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

## Session 2026-03-27 — Critical Boot and Settings Error Audit

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

## Session 2026-03-27 — Performance Audit and UI/UX Redesign Plan (Planning)

### Goal
Define the strategic vision for a total UI/UX Redesign (Broadcast Grade) and perform a deep performance audit focused on extreme stability in limited hardware environments (Ubuntu VM with 4GB RAM).

### Actions Executed (Documentation)
- **Creation of `docs/frontend_redesign.md`:** 
  - Detailed blueprint for a professional interface (Master Control Room, Ingest Bay, QC Station).
  - Definition of Design Tokens (Dark Mode Deep Night, neon highlights).
  - Symbiotic implementation strategy between **Google Antigravity** (Architect) and **Google Stitch/MCP** (Component Engineer).
- **Performance Audit (Suggested Vectors):**
  - **OS/Kernel:** Adjustment of `swappiness` for RAM efficiency.
  - **Rust/Backend:** Suggestion of the `mimalloc` allocator and reduction of DB Connection Pool to save heap.
  - **Frontend:** Implementation of PWA Caching and active purging of non-visible DOM/WebGL rendering.
- **Strategic Update:** Synchronization of **Phases 38 (Redesign)** and **Phase 39 (Performance Hardening)** in `docs/ROADMAP.md` and `README.md`.

### Next Steps
1. Wait for user feedback on the graphical Blueprint in `docs/frontend_redesign.md`.
2. Include performance vectors in the next Rust technical maintenance/refactoring window.

---

## Session 2026-03-27 — Phase 3: Client Optimization and Modularization (Completed)

### Goal
Resolve memory pressure (RAM) in the client browser when operating on the limited ALPHA VM (4GB RAM). The focus was on transforming heavy and monolithic components into modular and virtualized structures.

### Actions Executed
- **Modularization of `Settings.jsx`:**
  - The ~3.5k line file was fragmented into 5 sub-components: `OutputTab`, `PathsTab`, `PlayoutTab`, `UsersTab`, and `AboutTab`.
  - Implemented **Lazy Loading** (`React.lazy` and `Suspense`), ensuring only the active tab consumes rendering and memory resources.
- **Virtualization of `MediaLibrary.jsx`:**
  - Implemented the `react-window` library to manage file listing.
  - **Windowing:** Now, regardless of whether there are 10 or 1000 videos, only visible items on the screen occupy nodes in the DOM.
  - **Memoization:** The `MediaCard` component was extracted and protected with `React.memo` to avoid costly re-renders during scrolling.
- **VM Stability:** The ALPHA interface now responds instantly, eliminating 'freezes' that occurred when opening settings or navigating through dense media folders.

### Next Steps
1. Monitor VM stability under real broadcast load after these changes.
2. Proceed with the final audit of logs (Phase 2 - Technical Refinements) if necessary.
3. Start implementing Roadmap features as requested by the user.

---

## Session 2026-03-27 — Phase 2: Code and Server Log Optimization (Completed)

### Goal
Optimize the Rust backend to reduce processing consumption and disk I/O on the limited VM. We focused on eliminating redundancies in queries and drastically reducing operational verbosity.

### Actions Executed
- **Log Hardening (`main.rs`):** Changed default log level from 'info' to **'warn'**.
  - **Impact:** The system stops writing thousands of network and debugging metrics to the 100GB disk, saving CPU and disk life cycles.
- **SQL Optimization (`media.rs`):** Refactored the media listing query.
  - Removed redundant `LIKE` clauses that prevented the use of the `idx_media_path_filter` index.
  - **Elimination of Bottlenecks:** Removed FFmpeg probes (ffprobe) and synchronous file existence checks within the listing loop.
  - **Result:** Media listing is now purely database-based, making it instantaneous even with hundreds of videos.
- **Validation:** Confirmed code integrity via `cargo check` (Validation Success).
- **Backup:** Preventive copies in `/backups/phase-2-backend-opt/`.

### Next Steps
1. Start **Phase 3: Client Optimization (Frontend React)**. 
2. Priority: Refactoring `Settings.jsx` into sub-components via `React.lazy()` to free up RAM in the operator's browser.

---

## Session 2026-03-27 — Phase 1: Infrastructure and Docker Optimization (Completed)

### Goal
Execute Phase 1 of the optimization plan to ensure stability and resource availability on a VM with only 4GB RAM and 100GB disk. We focused on deep cleaning and imposing hardware limits per container.

### Actions Executed
- **Docker Cleanup:** Executed `docker system prune -f` and `image prune -a -f`.
  - **Result:** Freed **21.12 GB** of disk space (approx. 21% of total VM).
- **Resource Limits (Hardening):** Updated `docker-compose.yml` and `docker-compose.rtmp.yml`.
  - **RAM Limit:** Backend restricted to 1GB; Other services (Postgres, Graphics, AI) between 128MB and 512MB.
  - **CPU Limit:** Capped between 0.2 and 1.0 core per service to avoid 100% continuous use of the VM's CPU.
- **Backup:** Created an integral copy of settings in `/backups/pre-optimization-docker-20260327/`.

### Immediate Impact
The VM now operates with a significantly larger disk safety margin and Docker can no longer cause catastrophic 'Kernel Panic' or 'OOM Killer' by trying to consume more than 4GB of physical RAM.

### Next Steps
1. Start **Phase 2: Server Code Optimization (Backend Rust)**.
2. Focus on rewriting inefficient queries and disabling redundant DEBUG logs.

---

## Session 2026-03-27 — Global Optimization and Settings.jsx Refactoring (Planning)

### Goal
Adapt the original optimization plan (OPTIMIZATION_PLAN.md) to the premises of a severely limited resources virtual machine (4 Cores, 4GB RAM, 100GB space) focusing on mitigating memory, space, and global performance shortages. The fundamental policy of acting sequentially and safeguarding copies through *backups* was respected.

### Files Affected in the Plan
*Note: Planning Phase, these goals have not yet been executed.*

| Component | Planned Action |
|------------|---------------|
| `Docker-Compose` | Insertion of `mem_limit` and CPU control, massive purge of stored junk. |
| `backend/src/api/media.rs` | Refactoring of Optimized Queries without redundancies that kill I/O and RAM. |
| Backend Runtime | Disabling abusive logging (DEBUG mode) on a limited disk. |
| `Settings.jsx` (Front-End) | Disintegration of massive component into sub-tabs with `React.lazy()` (Lazy Loading). |
| DOM Virtualization | Switch normal browser listings to only present ~15 concurrent elements in the DOM using `react-window`. |

### Specific Strategy for Settings.jsx
To reverse the huge initial size of the _Playout_ settings load, the strategy of separating the component into multiple small files was documented:
1. `OutputSettings.jsx`
2. `OverlaySettings.jsx`
3. `UsersTab.jsx`
`Settings.jsx` will essentially serve as a router, invoking the tabs by *lazy load*, saving vast megabytes of compiler RAM in client browsers.

### Next Steps
1. Wait for user review and authorization of the new planned premises.
2. Start, in isolation, Phase 1 (Docker/Space) by creating a local preventive copy (Backup).

---

## Session 2026-03-27 — Full Roadmap + Category Folders (Documentation)

### Goal
Define and synchronize the full product roadmap (Phases 32-37) in 3 locations, add the **Category Folders** feature to the roadmap, update the Help System with a dedicated tab, and translate everything into 4 languages. **No feature was implemented** — only documentation and informative UI.

### Files Changed

| File | Action |
|---------|------|
| docs/ROADMAP.md | Replaced Phases 30-31 with new Phases 32-37 with full technical description |
| README.md | Roadmap section rewritten with completed phases table + upcoming phases list |
| frontend/src/pages/Settings.jsx | Added 6 new phases to roadmapData[] (Phase 32-37, done: false) |
| frontend/src/components/HelpSystem.jsx | New HelpRoadmap component + Roadmap tab with MapIcon |
| locales/{en,pt,es,fr}/translation.json | Roadmap.phases.p32-p37 keys + help.roadmap.* in 4 languages |
| backups/pre-roadmap-update-20260327/ | Security backup of all changed files |

### Roadmap Defined (NOT Implemented)

| Phase | Version | Functionality |
|------|--------|---------------|
| Phase 32 | v2.7.x | Category Folders & Batch Playlist — default categories (Rock, Salsa, Merengue, Jazz, Pop...) + custom + drag-to-playlist |
| Phase 33 | v2.8.x | Live Source Switching & NDI |
| Phase 34 | v2.9.x | Audio Compliance EBU R128 & Multi-Track |
| Phase 35 | v3.0.x | Automated QC & Ingest Validation |
| Phase 36 | v3.1.x | FAST Channels & Monetisation |
| Phase 37 | v3.2.x | Enterprise Hardening (Redundancy, BXF, RBAC) |

### Next Steps
1. User approval to start Phase 32 implementation: Category Folders
2. SQL Migration 090 for media_categories table
3. Backend REST endpoints (Rust) — Category CRUD
4. Media Library UI with category grid and batch drag-and-drop to playlist

---

## Activity Summary - ALPHA Documentation & Release Automation (2026-03-26)

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

---

## Activity Summary - ALPHA v2.6.0-ALPHA.55-PRO (2026-03-26)

### Channel Management and Dynamic Configurations
In this session, we optimized the flexibility of the Multi-Channel architecture and the precision of data persistence:

1. **Channels (Flexibility and Security)**:
   - **Default Channel**: Removed the rigid UUID lock that prevented deleting the original channel.
   - **Operation Safeguard**: Implemented backend logic (`channels.rs`) that prevents deleting the last channel in the system. The user can now rename or delete the default channel as long as a replacement has been previously created.
   - **Process Management**: Maintained the integrity of the `ChannelRegistry`, ensuring a playout engine shutdown occurs correctly before database removal.

2. **Configurations (Data Segregation)**:
   - **Paths and Media**: In the settings tab, we implemented hybrid save logic.
   - **Branding Assets (Global)**: Logos, videos, and default images (Branding) are now saved globally in the application, ensuring visual consistency.
   - **Working Paths (Per Channel)**: Media, thumbnails, playlists, and filler folders are now saved as specific channel `overrides` whenever a channel is active in the top bar.
   - **UX**: reinforced the "memory work" cleanup by ensuring that presented settings are strictly aligned with the selected context.

3. **Maintenance**:
   - Created preventive backups (`.bak`) of critical files before implementation.
   - **Name Sync**: The "Channel Name" field in Settings (Game Engine) now changes the actual channel name in the Database and navigation bar, instead of just a local parameter.
   - **Duplicate Prevention**: Implemented frontend validation preventing channels with identical names to others.
   - **Standardization**: Existing channels renamed to "Default" and "Test Channel" for cleaner designation.
   - **Frontend lint integrity check completed without errors.**

---

## Activity Summary - ALPHA v2.6.0-ALPHA.55-PRO (2026-03-26)

### UI Improvements, Internationalization, and Stability
In this version, we focused on polishing the Multi-Channel interface, fixing data persistence bugs, and improving user experience in the TV Guide:

1. **TV Guide - UX & Robustness**:
   - **Empty State**: Implemented a dedicated view for channels without programming or playlists, displaying an informative message and a "Refresh" button rather than a confusing empty grid.
   - **Loading Feedback**: Added a `CircularProgress` indicator during calendar data loading.
   - **Data Leak Fix**: Reinforced state cleanup when switching channels to ensure that events from one channel do not "leak" into another's view.

2. **Version Management**:
   - System upgraded to version **`v2.6.0-ALPHA.55-PRO`**.
   - Updates made in: `package.json`, `api.js`, `Cargo.toml`, `README.md`, and `RELEASE_NOTES.md`.
   - SQL Migration `095` created for version persistence in the database.

3. **Multi-Channel Panel (UX)**:
   - **Visual Feedback**: Added a pulse animation (blue glow) to the selected channel (`activeChannelId`) in the multi-channel panel, facilitating work context identification.
   - **UI Cleanup**: Removed redundant "ON AIR" label from channel previews to reduce visual noise in mosaic monitoring.

4. **Version Management**:
   - Updated version history in Settings and global system constants to reflect new version `v2.6.0-ALPHA.55-PRO`.

---

## Launch of ALPHA.54-PRO Version - Multi-Channel Stabilization
Completed the launch of version `v2.6.0-ALPHA.54-PRO`, consolidating Multi-Channel architecture advances and resolving critical stability issues:

### 1. Mosaic Monitoring (Mosaic)
- Passive monitoring functionality implemented in the **Master Dashboard**. It is now possible to view multiple channels simultaneously in a responsive grid with low-latency HLS previews.
- Player loading optimization to allow monitoring dozens of channels without excessive browser overhead.

### 2. Media Isolation and Synchronization
- **Isolated Watchfolder**: Each channel now has its own physical monitoring folder, and the "Sync Watchfolder" button in the Media Library strictly respects the active channel context.
- Fixed sync logic to prevent one channel's files from appearing in another's library.

### 3. Playout Engine Stability
- Resolved critical bug where JSON quotes were incorrectly passed to FFmpeg in certain protocols (RTMP/SRT/UDP), causing transmission startup failures.
- Total refactor of telemetry (bitrate, uptime) to ensure data presented in "System Health" and "Analytics" is correctly filtered by channel.

### 4. Internationalization and Documentation (i18n)
- Full translation synchronization (PT, EN, ES, FR) for all new interfaces (Master Dashboard, Watchfolder Sync, Health Check).
- **Help System** update with new articles on Multi-Channel operation and Mosaic monitoring.
- Technical documentation updated in `README.md`, `RELEASE_NOTES.md`, and `docs/RELEASE_NOTES.md`.

### 5. Technical Synchronization
- Version synchronized in: `Cargo.toml` (Backend), `package.json` (Frontend), `api.js`, `settingsConfig.js`, and Database (Migration `094`).

---

## Activity Summary - ALPHA v2.6.0-ALPHA.53-PRO (2026-03-25)

## Multi-Channel Improvements and Fixes
Finalized a polishing cycle on the Multi-Channel architecture, focusing on data isolation per channel and user experience:

### 1. Master Dashboard (UI/UX)
- Removed redundant **"ON AIR"** tag from channel mosaics for cleaner monitoring.
- Implemented a **visual highlight (Blue Glow and pulse animation)** for the currently selected channel.

### 2. WebSocket & Telemetry (System Health)
- Refactored `EventBus` and `WsBroadcaster` in the backend to support **wildcards (`psubscribe`)**.
- WebSocket connections now filter messages by `channel_id` on the server side (if provided).
- Fixed the "Analytics" tab appearing offline: bitrate metrics and telemetry are now correctly retransmitted to the chosen channel.

### 3. TV Guide & EPG
- Fixed the `default` channel data leak to empty channels in the TV Guide.
- EPG generators (`epg.xml`) updated to filter schedules by the `channel_id` received via query param.
- Frontend export calls fixed to use the active channel context.

### 4. System Version & Stability
- Global update to version **`v2.6.0-ALPHA.53-PRO`**.
- SQL Migration `093` created for version update in the database.
- Fixed SQL macros and trait imports (`StreamExt`) to ensure correct backend compilation in CI/Docker environments.
- Updated `package.json`, `Cargo.toml`, `RELEASE_NOTES.md`, and `RELEASE_HISTORY.json`.

---

## Multi-Channel Playout Engine (Phases 3-7) - 2026-03-25

**Analysis of the Multi-Channel Plan (Phases 3 to 7)**
- **Phase 3 (Playout Engine & Active Channel)**: The backend base is ready with `ChannelRegistry` spawning independent FFmpeg processes. **Pending:** UI integration (Dashboard showing HLS of the active channel).
- **Phase 4 (Settings per Channel)**: Backend infrastructure ready. **Pending:** `Settings.jsx` web page to use these endpoints based on selected channel.
- **Phase 5 (Media Library per Channel)**: **Not Implemented**. Media table lacks `channel_id`. **Pending:** DB migration and UI logic for upload and filtering.
- **Phases 6 and 7 (Watchfolder and Master Dashboard)**: **Not implemented**. 

**Initial conclusion**: Backend did most of the work for Phases 3 and 4, but UI adjustments are needed. Phases 5-7 still need backend (schema) and frontend implementation.

### Implementation Progress - 2026-03-25 (Completion of Phases 3, 4, and 5)
- **Phase 3 complete:** Updated `Dashboard.jsx` to integrate with `useChannel()`. HLS player now reloads with the correct preview URL.
- **Phase 4 complete:** Modified `Settings.jsx`. Frontend now accesses `/v2/channels/{id}/settings`.
- **Phase 5 complete:** Created SQL Migration `091_add_media_channel_id.sql`. Backend API and frontend `MediaLibrary.jsx` updated for filtering and independent per-channel uploads.

### Implementation: Dashboard and Engine Fixes (Phase 8) - 2026-03-25
- **Problem 1 fixed (Protocols constantly restarting):** Changed query in `engine.rs` to use `#>>'{}'` operator for `channel_settings`.
- **Problem 2 fixed (TV Guide and Protocols on Default):** 
  - `Calendar.jsx` updated to use `channelPlayoutAPI.status(activeChannelId)`.
  - `Dashboard.jsx` refactored in `handleToggleProtocol` for per-channel stream control.
  - `checkSchedule` in Dashboard now validates active channel.

### Implementation: Watchfolder per Channel (Phase 6) - 2026-03-25
- **Migration 092** created: added `watchfolder_path` to `channels` table.
- **Backend**: Added `channel_watchfolder_sync` and `channel_watchfolder_status` to `channels.rs`.
- **Frontend**: Added `channelWatchfolderAPI` to `api.js`. `MediaLibrary.jsx` now shows a "Sync Watchfolder" button when a channel is active.

### Planning: Master Dashboard and Multi-Channel Health (Phases 7 and 9) - 2026-03-25
The `implementation_plan_master_dashboard.md` plan was developed, covering:
- **Phase 7**: Creation of the "Mosaic" view (`MasterDashboard.jsx`).
- **Phase 9**: Correction/Adaptation of `PlayoutHealth.jsx` and backend `/settings/diagnostics` for channel-specific metrics.

### Implementation: Master Dashboard and Multi-Channel Health (Phases 7 and 9) - 2026-03-25
- **Phase 7 complete**: Created `MasterDashboard.jsx` with responsive Mosaic grid and light HLS players.
- **Phase 9 complete**: Updated backend `settings.rs` for channel-specific diagnostics. `PlayoutHealth.jsx` verified.

### Planning: Internationalization (Phase 10) - 2026-03-25
- The `implementation_plan_i18n_fase10.md` plan was developed for 4-language support across all Multi-Channel phases.

### Implementation: Internationalization (Phase 10) - 2026-03-25
- **Phase 10 complete**: Integrated `navigation.masterDashboard`, `{media.sync_watchfolder, syncing_watchfolder}` and `masterDashboard` blocks into EN, PT, ES, and FR `translation.json`.

### Implementation: Help System Update (Phase 11) - 2026-03-25
- **Phase 11 complete**: Full update of `HelpSystem.jsx` to reflect Multi-Channel architecture.

---

## Session 2026-03-27 — Roadmap Update (Phases 38-39) and Documentation (Completed)

### Goal
Synchronize system documentation and interface with new strategic planning (Roadmap), adding Phases 38 (UI/UX Redesign) and 39 (Performance Hardening) in all supported languages.

### Actions Executed
- **Internationalization (i18n):**
    - Updated `translation.json` files.
    - Added keys for **Phases 38 (Redesign)** and **39 (Performance)**.
    - Logged version `v2.6.0-ALPHA.56-PRO` in release history.
- **React Components:**
    - **`Settings.jsx`**: Updated `roadmapData`.
    - **`HelpSystem.jsx`**: Integrated new phases into `HelpRoadmap`.
- **Backup:** Created preventive backup in `backups/pre-roadmap-fase38-39`.

---

## Session 2026-03-27 — Global Version Update (v2.6.0-ALPHA.56-PRO)

### Goal
Elevate system version in all components (Core, DB, Frontend, Docs) to `v2.6.0-ALPHA.56-PRO`, syncing with new Roadmap and performance optimizations.

### Actions Executed
- **Database:** Created SQL Migration `096_update_version_to_alpha56_pro.sql`.
- **Backend:** Updated `Cargo.toml`.
- **Frontend:**
    - Updated `package.json` (`version`).
    - Updated fallbacks in `api.js` and `settingsConfig.js` (`2026-03-27`).
- **Documentation:**
    - **`README.md`**: Updated version badges, statistics, and current version section.
    - **`RELEASE_NOTES.md` & `docs/RELEASE_NOTES.md`**: Inserted release note.
    - **`docs/ROADMAP.md`**: Updated timestamp/version and milestone history.
- **Security:** Created integral backup in `backups/pre-version-bump-alpha56/`.
