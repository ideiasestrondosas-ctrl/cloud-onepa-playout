# Cloud Onepa Playout - Roadmap

_Status updated on 2026-03-28 (v2.6.0-ALPHA.57-PRO)_

---

## 🏁 Completed Milestones

- [x] **Phase 1-18**: Core System & Beta Release (v1.0 – v1.8.0-PRO)
  - Full Playout Engine setup (Rust + Actix-web)
  - React/Material-UI Frontend
  - Scheduling & Calendar
  - Docker Containerization
  - Setup Wizard
  - Branding & Theming

- [x] **Phase 19-21**: UI Refinement & Security (v1.9.3-PRO)
- [x] **Phase 22**: SRT caller v2, Master Feed Auth & Repeat Indicators (v1.9.5-PRO)
- [x] **Phase 23**: EPG Generator, Timeline & Session Accuracy (v2.0.0-PRO)

- [x] **Phase 24**: Alpha Series — Advanced Features (v2.2.0-ALPHA.1 → ALPHA.38-PRO)

  _Focus: Expanding core capabilities and professional reliability_

  - [x] **EPG Intelligence 2.0**: Enhanced tooltips with Director, Rating, and Genre; real-time metadata hydration from Media Library; XMLTV export with rich descriptions.
  - [x] **Metadata Transparency**: Persistent source links (TMDB/OMDb/TVMaze) in library; instant sync between library metadata and EPG guides.
  - [x] **Reality Sync Engine**: Robust file detection across Media, Assets, Fillers, and Protected paths.
  - [x] **Storage Transparency**: Real-time MB/GB diagnostics in Settings.
  - [x] **Performance Streaming**: Native Range Request support and network optimisation for instant loading.
  - [x] **Media Library**: Automatic data hygiene; duplicated clip support with correct metadata hydration.
  - [x] **UI Density Overhaul (Surgical Compact)**: Massively refined paddings/margins; EPG & Calendar optimised for more visible events.
  - [x] **High-Density Help System**: Redesigned `?` menu for maximum readability.
  - [x] **Multi-Layer Graphics Engine**: Initial placeholder for multi-layer graphics overlay.
  - [x] **Protocol Stability**: Fixed RTMP failure on empty URL; resolved FFmpeg flickering in UDP multicast.
  - [x] **UDP Stability & Process Guard**: Corrected Unicast PUSH mode; internal protection against port collisions.
  - [x] **Audit Ports 3.0**: New diagnostic engine with intelligent receiver detection (VLC).
  - [x] **Log Management**: Log rotation (10 MB / 3 files) and enhanced container persistence.
  - [x] **Backend Recovery**: Resolved `VersionMismatch` conflict and stabilised container startup.
  - [x] **Script Versioning**: Standardised application version output across all `.sh` and `.bat` scripts.
  - [x] **i18n & Translations**: Full internationalisation across EN / FR / ES / PT.
  - [x] **Program Templates API**: Morning Program, 24H Playlist, and Loop Content templates.
  - [x] **Transcription Engine**: Optimised accuracy settings for improved speech recognition.
  - [x] **Logo Branding Alignment**: Synchronised graphics assignment with system logo across all views.

---

- [x] **Phase 25**: Enterprise Foundation — v2.3.0-ALPHA.39-PRO

  _Focus: Multi-channel infrastructure and real-time event system_

  - [x] **Multi-Channel Database**: `channels` table + `channel_id` FK scoping on playlists, schedule, media, folders, graphics_layers, settings. Zero-disruption — all existing data auto-assigned to default channel.
  - [x] **Redis Event Bus**: Redis 7-alpine integrated. `EventBus` service publishes `clip_start` events to `playout:default` channel.
  - [x] **As-Run Compliance Logs**: `as_run_logs` — frame-accurate, industry-standard proof-of-play.
  - [x] **Audit Trail**: `audit_logs` — immutable user action history (compliance-ready).
  - [x] **SCTE-35 Schema**: `scte_35_markers` table ready for ad-insertion cue management.
  - [x] **Theme Personalization Schema**: `themes` + `frontend_preferences` DB tables for per-user UI customisation.
  - [x] **WebSocket Real-Time Events**: `GET /api/v2/events?token=<JWT>` — live telemetry via Redis→WS bridge.
  - [x] **v2 REST API**: `/api/v2/channels`, `/api/v2/analytics/as-run`, `/api/v2/analytics/audit-logs`, `/api/v2/analytics/themes`, `/api/v2/analytics/preferences/{user_id}`.
  - [x] **DB Migrations**: Migrations 066–070 + docker-compose Redis service.

---

- [x] **Phase 26**: Frontend Transformation — v2.3.0-ALPHA.40-PRO

  _Focus: Theme engine, analytics dashboard, and drag-and-drop template editor_

  - [x] **Theme Personalization Engine**: `ThemeContext.jsx` — runtime CSS variable switching. Colors loaded from DB on login. MUI `createTheme` rebuilt dynamically via `buildMuiTheme()`. CSS vars: `--primary-color`, `--secondary-color`, `--bg-color`, `--surface-color`.
  - [x] **Mobile Responsive Layout**: `Layout.jsx` — navigation drawer closes on route change; Analytics and Template Editor added to sidebar with i18n keys in EN/PT/ES/FR.
  - [x] **Real-Time Analytics Dashboard** (`/analytics`): Recharts `LineChart` for stream bitrate via WebSocket, `BarChart` for clips/day (as-run REST), 4 KPI cards (Clips Today, Stream Health, Error Rate, Live Events).
  - [x] **Drag-and-Drop Graphics Template Editor** (`/graphics/template-editor`): 16:9 canvas, @dnd-kit drag-from-palette, component palette (Text, Clock, Lower Third, Marquee, Shape, Image), property inspector, JSON save to templates API.
  - [x] **Recharts**: `recharts@^2.12.0` added to frontend dependencies; `package-lock.json` regenerated.
  - [x] **Migration 072**: `system_version` → `v2.3.0-ALPHA.40-PRO`.

---

- [x] **Phase 26.1**: UI Consolidation & Navigation Refinement — v2.3.0-ALPHA.41-PRO

  _Focus: Merge standalone pages into unified views; reduce nav clutter_

  - [x] **Analytics merged into Playout Health** (`/health`): Tabbed interface — Health tab (existing diagnostics, score gauge, live log console) + Analytics tab (WebSocket bitrate chart, clips/day bar chart, 4 KPI cards). Single route, single nav entry.
  - [x] **Graphics Template Editor merged into Graphics Editor** (`/graphics`): 4th "Templates" tab added to the header-level tab bar. Tabs promoted from panel-level to page-level (always visible). When Templates tab active: full-width `<GraphicsTemplateEditor embedded />` replaces the preview grid; RESET/SAVE buttons hidden automatically.
  - [x] **GraphicsTemplateEditor `embedded` prop**: When `embedded=true`, component uses `height: 100%` and `p: 0` for seamless host integration.
  - [x] **Sidebar cleanup**: Removed standalone `/analytics` and `/graphics/template-editor` nav entries and icon imports. Sidebar reduced from 11 to 9 items.
  - [x] **App.jsx cleanup**: Removed lazy imports and routes for `Analytics` and `GraphicsTemplateEditor`; retained as embedded components only.
  - [x] **Migration 073**: `system_version` → `v2.3.0-ALPHA.41-PRO`.

---

- [x] **Phase 27**: Microservices Architecture — v2.4.0-ALPHA.42-PRO

  _Focus: Distributed processing for analytics ingestion, HTML5 graphics rendering, and AI content tagging_

  - [x] **Analytics & Audit Microservice** (`service-analytics` — Node.js + ioredis + pg): Redis `psubscribe playout:*`; writes `as_run_logs` on `clip_start`, finalises on `clip_end`, writes `audit_logs` on `audit` events. REST: `GET /health`, `GET /internal/as-run`, `GET /internal/audit-logs`. Port 4001.
  - [x] **HTML5 Graphics Compositor** (`service-graphics` — Node.js + Puppeteer): `POST /render` → headless Chromium 1920×1080, transparent PNG for FFmpeg overlay; `POST /preview` → base64 PNG for UI. Port 3002.
  - [x] **AI Metadata Worker** (`service-ai` — Python 3.12 + faster-whisper): `FOR UPDATE SKIP LOCKED` job polling; Whisper ASR → WebVTT; silence detection via ffmpeg `silencedetect`; results written to `media.metadata` JSONB; completion published to Redis.
  - [x] **Docker Compose**: Three new services with health checks and `depends_on`.
  - [x] **Dockerfiles**: `Dockerfile.analytics`, `Dockerfile.graphics` (Alpine + Chromium), `Dockerfile.ai` (python:3.12-slim + ffmpeg).
  - [x] **Migration 074**: `media_tasks` job queue.
  - [x] **Migration 075**: `system_version` → `v2.4.0-ALPHA.42-PRO`.

---

- [x] **Phase 28**: SCTE-35 & Low-Latency HLS — v2.4.0-ALPHA.43-PRO

  _Focus: Broadcast-grade ad insertion and sub-second latency delivery_

  - [x] **SCTE-35 REST API**: `GET/POST/DELETE /api/v2/scte35` — manage `splice_insert` markers per playlist item (PTS offset, duration frames, auto-return flag).
  - [x] **FFmpeg SCTE-35 injection**: `FFmpegService::build_scte35_args()` builds `-metadata:s:v:0` args; local `Scte35Marker` struct in `ffmpeg.rs` decouples from DB model.
  - [x] **Playlist Editor — Ad Cue button**: Per-clip `Tv` icon opens SCTE-35 dialog. Lists active markers with delete, form to add new cue (PTS offset, duration frames, auto-return). Fetches/saves via `/api/v2/scte35`.
  - [x] **LL-HLS**: `docker/mediamtx.yml` → `hlsVariant: lowLatency`, `hlsSegmentDuration: 1s`, `hlsPartDuration: 100ms`. Sub-1s glass-to-glass latency.
  - [x] **Version History (About System)**: All 4 i18n locales updated with full ALPHA.39–43 release history; `APP_VERSION_FALLBACK` and boot log updated.
  - [x] **Migration 076**: `system_version` → `v2.4.0-ALPHA.43-PRO`.

---

- [x] **Phase 29**: Infrastructure — Kubernetes + MinIO + CI/CD — v2.5.0-ALPHA.44-PRO

  _Focus: Cloud-native deployment and high availability_

  - [x] **Helm Charts** (`deployment/helm/`): 9 service manifests — backend, frontend, analytics, graphics, AI, postgres StatefulSet, redis, minio StatefulSet, mediamtx. `Chart.yaml`, `values.yaml`, `_helpers.tpl`.
  - [x] **NGINX Ingress**: `templates/ingress.yaml` — routing for `/api`, `/hls`, `/minio-console`, `/`. TLS via cert-manager.
  - [x] **HPA**: `templates/hpa.yaml` — HorizontalPodAutoscaler for frontend (2–8) and backend (1–4) on CPU.
  - [x] **MinIO S3 Storage**: `docker-compose.yml` — `minio/minio:latest` ports 9000+9001. Helm StatefulSet with PVC.
  - [x] **Storage Service** (`backend/src/services/storage.rs`): Trait-based `Storage` — `LocalStorage` and `S3Storage` (object_store crate). `storage_from_env()` factory via `STORAGE_BACKEND=local|s3`.
  - [x] **GitHub Actions CI/CD** (`.github/workflows/ci.yml`): On PR → fmt + clippy + test + lint + build. On push → GHCR Docker matrix for 5 services.
  - [x] **Migration 077**: `media.s3_path TEXT` — S3 object key column.
  - [x] **Migration 078**: `system_version` → `v2.5.0-ALPHA.44-PRO`.

---

## 🔜 Upcoming Phases

### Phase 32: Category Folders & Batch Playlist — v2.7.x

_Focus: Smart media organisation by genre/category with batch drag-and-drop to playlists_

- [ ] **Category System**: `media_categories` table with full CRUD — default categories (Rock, Salsa, Merengue, Jazz, Pop, Reggaeton, Classical, News, Movies, Series, Documentary, Sports, Filler) + user-created custom categories.
- [ ] **Media Library Categories View**: Visual grid of categories with icon, colour, name, and file count. Drag-and-drop files into categories. Contextual menu for bulk assignment.
- [ ] **Drag Category → Playlist**: Drag an entire category onto the PlaylistEditor to add all its files at once (sequential or random mode, configurable).
- [ ] **Category Filter**: Sidebar filter by category in Media Library and Playlist Editor media panel.
- [ ] **i18n**: Full translation of category UI in EN, PT, ES, FR.

---

### Phase 33: Live Source Switching & NDI — v2.8.x

_Focus: Real-time source switching and professional broadcast networking via NDI_

- [ ] **NDI Input/Output**: FFmpeg integration with NDI SDK for ultra-low-latency professional network sources.
- [ ] **Live Switcher UI**: A/B preview component to switch between sources (file, RTMP pull, NDI, SRT listener) in real-time with crossfade transitions.
- [ ] **Multi-Source PIP**: Picture-in-Picture overlay for sign language, inserts, and breaking news banners.

---

### Phase 34: Audio Compliance & Multi-Track — v2.9.x

_Focus: Broadcast-grade audio normalisation and independent audio tracks_

- [ ] **EBU R128 Loudness Normalisation**: FFmpeg `loudnorm` filter integrated per-channel in the playout pipeline, compliant with satellite/cable broadcast rules.
- [ ] **Multi-Audio Track**: Independent audio tracks (Original + Audio Description + Multilingual) with runtime switching.
- [ ] **Audio Metering UI**: Real-time VU Meters and LUFS display on the Dashboard via WebSocket telemetry.

---

### Phase 35: Automated QC & Ingest Validation — v3.0.x

_Focus: Automatic quality control on media import to prevent on-air failures_

- [ ] **Native Quality Control**: Automatic media validation (black frames, freeze frames, silent audio, incompatible codec) with rejection or alert workflows.
- [ ] **Smart Thumbnails**: Intelligent extraction of representative frames (not first frame) for better library browsing.
- [ ] **Auto Proxy Generation**: Automatic creation of lightweight proxy files for instant preview in the Media Library.

---

### Phase 36: FAST Channels & Monetisation — v3.1.x

_Focus: Free Ad-supported Streaming Television delivery and dynamic advertising_

- [ ] **FAST Channel Delivery**: Content packaging for Pluto TV, Samsung TV Plus, and similar FAST platforms.
- [ ] **Dynamic Ad Insertion (DAI)**: Expansion of SCTE-35 markers for server-side dynamic ad insertion into LL-HLS streams.
- [ ] **Viewer Analytics**: Per-channel audience estimation, engagement metrics, and geographic distribution dashboards.

---

### Phase 37: Enterprise Hardening — v3.2.x

_Focus: High availability, compliance integration, and granular access control_

- [ ] **Active-Active Redundancy**: Heartbeat between playout instances with automatic failover on primary node failure.
- [ ] **BXF/Traffic Integration**: Import/export of playlists and schedules in Broadcast eXchange Format for traffic system compatibility.
- [ ] **Granular RBAC**: Role-based access control with per-channel and per-feature permissions.
- [ ] **Remote Monitoring Dashboard**: Read-only web interface for remote monitoring of all channels from any location.

---

### Phase 38: Total UI/UX Redesign — v3.3.x

_Focus: Professional Broadcast Interface with Antigravity + Stitch synergy_

- [ ] **Deep Night Theme Engine**: Advanced dark mode with high-contrast UI tokens and néon highlights.
- [ ] **Master Control Layout**: Redesigned MCR Dashboard with integrated VU meters, system clock, and real-time waveforms.
- [ ] **Sidebar Intelligence**: Dynamic sidebar with Ingest Bay, QC Station, and Live Switcher menus.
- [ ] **Micro-animations & Feedback**: Smooth transitions and industrial-grade visual feedback for on-air states.

---

### Phase 39: Extreme Performance Hardening — v3.4.x

_Focus: Maximum efficiency for low-resource environments (4GB RAM VMs)_

- [ ] **Memory Management**: Integration of `mimalloc` allocator in Rust and fine-tuned database connection pooling.
- [ ] **FFmpeg Resource Capping**: Intelligent thread management to protect live playout continuity.
- [ ] **PWA & Edge Caching**: Geração de Service Workers para carregamento instantâneo da UI via Vite.
- [ ] **Kernel-Level Tuning**: Automated OS adjustments (swappiness, I/O schedulers) via container startup scripts.

---

## Version History Summary

| Version | Phase | Date | Focus |
|---------|-------|------|-------|
| v1.0 – v1.8.0-PRO | 1–18 | 2024–2025 | Core System & Beta |
| v1.9.3-PRO | 19–21 | 2025 | UI Refinement & Security |
| v1.9.5-PRO | 22 | 2025 | SRT v2 + Auth |
| v2.0.0-PRO | 23 | 2025 | EPG Generator |
| v2.2.0-ALPHA.1–38-PRO | 24 | 2025–2026 | Alpha Advanced Features |
| v2.3.0-ALPHA.39-PRO | 25 | 2026-03-10 | Enterprise Foundation (DB + Redis + WebSocket) |
| v2.3.0-ALPHA.40-PRO | 26 | 2026-03-10 | Frontend Transformation (Theme + Analytics + DnD Editor) |
| v2.3.0-ALPHA.41-PRO | 26.1 | 2026-03-10 | UI Consolidation (Merged Health+Analytics, Graphics+Templates) |
| v2.4.0-ALPHA.42-PRO | 27 | — | Microservices (Analytics, Graphics, AI Worker) |
| v2.4.0-ALPHA.43-PRO | 28 | — | SCTE-35 + LL-HLS |
| v2.5.0-ALPHA.44-PRO | 29 | — | Kubernetes + MinIO + CI/CD |
| v2.5.x | 30 | — | Live Inputs + Social Streaming |
| v2.6.x | 31 | — | AI Intelligence + HA Redundancy |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Roadmap and ALPHA Documentation Update;In this session, we synchronized the ALPHA documentation and interface with the new strategic roadmap:;1. **Roadmap Phases 38 and 39**: Added to the Help and About sections of the system.;2. **Internationalization**: Full translation synchronization (PT, EN, ES, FR) for the product roadmap and release history.;3. **Version Consistency**: Global version bump across the stack and database to v2.6.0-ALPHA.56-PRO.; |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Goal;Resolve two critical blocking errors (ReferenceErrors) captured after the extreme refactoring of the system for limited hardware and memory. The first being a global boot impedance, and the second associated with interface failure in settings by the ErrorBoundary Catch.;### Actions Executed (Analysis and Planning);- **Diagnosis Error 1 (ReferenceError: Va)**:;  - Identification of `Temporal Dead Zone` (TDZ) caused by React hoisting where components with complex virtual rendering functions (`react-window`) were allocated before handlers like `handleOptimize`, causing crashes in the browser's V8 JS Engine.;  - **Planned:** Change the internal architecture of the Virtualization DOM logic to the base of the function tree in `MediaLibrary.jsx`.;- **Diagnosis Error 2 (ReferenceError: userRoles / userProfiles is not defined)**:;  - Context verified that when extracting the users component from within `Settings.jsx` to the encapsulated import by lazy in `UsersTab`, legacy properties `userRoles` and `userProfiles` remained in the main parent JSX tree of injects referenced improperly although they were purged from the system.;  - **Planned:** Elimination of these "ghost" rendering and invocation properties, saving render tree cycles and preventing the triggering of ErrorBoundary failures.;- **Diagnosis Error 3 (ReferenceError: handleEditUser is not defined)**:;  - Confirmation of severe desynchronization in the React interface between `Settings.jsx` (Parent) and `UsersTab.jsx` (Child). Property variables were passed (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) that **no longer existed** locally in the Parent, and were also **not expected or used** by the Child.;  - Additionally, vital dependencies were left out (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessary to manage the modest internal state logic of the Users tab.;  - **Planned:** Full remapping of all attributes in the `<UsersTab />` segment in the `Settings.jsx` file.;### Next Steps;1. Obtain approval of the plan for clean and safe modification in these components.;2. Inspect results by restarting UI frames.;---; |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-28 | ### Goal;Convert the entire GitHub repository presence to English, including technical documentation, user manuals, and automation scripts (`release.sh` and `update.sh`). The goal is to professionalize the repository and ensure that automatic updates inject English content.;### Actions Executed (Planning);- **Scope Analysis:** Identified all Markdown files in the `docs/` folder, `README.md`, and scripts in `scripts/`.;- **Strategy Definition:**;  - Exclusion of Frontend translation keys (focusing only on Repository/GitHub).;  - Full translation of `release.sh` and `update.sh` (comments, logs, and prompts).;  - Adjustment of regex logic in `release.sh` to support new English headers.;  - Translation of the entire history in `resumes.md` to support English highlights extraction.;- **Plan Creation:** Documented in the internal implementation artifact.;### Completed Actions;- **Script Translation:** Successfully translated `scripts/update.sh` and `scripts/release.sh` to English.;- **Regex Update:** Modified `release.sh` to target English headers in `README.md` and `docs/ROADMAP.md`.;- **Documentation:** Translated all Markdown files (README, ROADMAP, INSTALL, FAQ, DEVELOPMENT, USER_MANUAL, RELEASE_NOTES).;- **History Update:** Fully translated `docs/resumes.md` to English and added this completion summary.;- **Verification:** Bash syntax checked for all modified scripts.;### Next Steps;1. Final review by the user of all English documentation.;2. Maintain English as the standard for all future GitHub repository documentation.;3. Clean up the `/backups/translation-to-english-20260328/` directory once stability is confirmed.;---; |
| v2.6.0-ALPHA.57-PRO | - | 2026-03-28 | ### Goal;Audit the workspace to remove legacy scripts and obsolete tests, reorganize essential build tools, and perform a deep clean of the GitHub repository by pruning old releases and tags. Update the system's version history in the UI.;### Actions Executed;- **Workspace Reorganization**:;  - Moved essential Docker and build scripts (`clean_rebuild.sh`, `rebuild_alpha_docker.sh`, etc.) from root to the `scripts/` directory for better organization.;  - Deleted over 15 obsolete SRT test scripts, old diagnostics, and temporary frontend backup files (`.bak`, `.tmp2`).;- **GitHub Repository Audit**:;  - Identified and deleted all GitHub Releases prior to `v2.6.0-ALPHA.50-PRO`.;  - Permanently removed associated remote tags from origin and local tags from the development environment.;- **UI & Version History**:;  - Updated `translation.json` across all 4 languages (PT, EN, ES, FR) to reflect the new maintenance version `v2.6.0-ALPHA.57-PRO`.;  - Documented the cleanup, audit, and optimization milestones in the "Version Notes" (Modal) and "About System" (Timeline) sections.;- **Maintenance**:;  - Created preventive backups of the workspace before major deletions.;  - Synchronized the local and cloud repositories through a clean-up commit.;### Next Steps;1. Verify workspace stability after script relocation.;2. Monitor GitHub release consistency during future automated deploys.;---; |
