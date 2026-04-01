# Cloud Onepa Playout - Roadmap

_Status updated on 2026-04-01 (v2.6.0-ALPHA.57-PRO)_

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

### Phase 40: CG & Logo Engine — Broadcast-Grade Character Generator — v3.5.x

_Focus: Complete redesign of the CG (Character Generator) system and creation of a dedicated Logo Engine microservice, replacing the current monolithic overlay with fully isolated, GPU-first, production-ready components_

#### Architecture Principles (INVIOLABLE)

- [ ] **Total Isolation**: CG or Logo crash ≠ playout crash. **NEVER.**
- [ ] **Static = Static**: Logo is a static GPU texture. Load once, composite N frames.
- [ ] **Zero Runtime Scaling**: All assets pre-processed to target resolution before use.
- [ ] **GPU-First**: Composition always on GPU. CPU only as fallback.
- [ ] **Frame Budget**: CG + Logo ≤ 2ms per frame (at 50fps = 20ms total budget).
- [ ] **Watchdog**: Each microservice has a health check. Auto-restart in < 500ms.
- [ ] **Graceful Degradation**: If CG fails → stream continues without graphics.

#### Component 1 — Logo Engine (Microservice, P0 — CRITICAL)

- [ ] **C++ core** with Python bindings for control (OpenGL/Vulkan + libpng + stb_image).
- [ ] **Startup**: Load pre-processed PNG logo → GPU texture → register in compositor via shared memory → idle (zero CPU when stable).
- [ ] **Runtime commands**: `SET`, `HIDE`, `FADE`, `REPOSITION` — no per-frame reprocessing.
- [ ] **Logo spec**: PNG 32-bit RGBA, pre-multiplied alpha, stripped metadata (zero EXIF/ICC), maximum compression (zopflipng). Heights: 80–120px (1080p), 120–180px (4K). Halo/blur/blur: PROHIBITED.
- [ ] **Performance**: ≤ 10MB VRAM, < 0.5% CPU idle, < 2% CPU during fade transitions.

#### Component 2 — Asset Ingestion Pipeline (Microservice, P0 — CRITICAL)

- [ ] **Phase 1 — Upload**: Accept PNG, SVG, TIFF, PSD, AI. Max 20MB. Validate extension + magic bytes.
- [ ] **Phase 2 — Deep Validation**: Verify real format, alpha channel, resolution (min 200px – max 8000px), aspect ratio (reject > 5:1), alpha quality (detect halos and dirty edges).
- [ ] **Phase 3 — Normalisation**: Convert any input → PNG RGBA 32-bit. SVG → rasterise with librsvg at 300 DPI. Remove ALL metadata (exiftool -all=). Colour space: sRGB.
- [ ] **Phase 4 — Optimisation**: Resize to targets (1080p + 4K). `pngquant --quality=85-100 --speed=1` + `oxipng -o max --strip all`. Convert alpha to pre-multiplied. Remove halos algorithmically.
- [ ] **Phase 5 — Safe Padding**: Add 8px transparent padding on all sides.
- [ ] **Phase 6 — Metadata & Manifest**: Generate versioned JSON manifest with `logo_id` (UUID v4), SHA-256, `display` config (position, margin, opacity, fade timings).
- [ ] **Phase 7 — Cache & Deploy**: Copy to versioned production directory. Invalidate Logo Engine cache via IPC. Keep last 5 versions (rollback). Optional CDN push.
- [ ] **Stack**: Python 3.11+ · Pillow · pyvips · cairosvg · python-magic · Redis Queue or Celery.

#### Component 3 — CG Engine (Microservice, P1 — HIGH)

- [ ] **Base**: Chromium Embedded Framework (CEF) or Electron headless. Lightweight alternative: Node.js + node-canvas + WebGL.
- [ ] **Template system**: HTML5 + CSS3 + JSON data binding. Rules: max 50 DOM elements, no JS frameworks in templates, transform-only animations (no reflow), `will-change` on animated elements, inline base64 fonts, fixed dimensions.
- [ ] **Layer system**: Layer 0 reserved for Logo Engine. Layers 1–4 for CG (lower thirds, tickers, scoreboards, alerts). Maximum 2 layers visible simultaneously.
- [ ] **Output**: RGBA framebuffer via shared memory at playout FPS (25/30/50/60).
- [ ] **Templates**: `lower-third-basic`, `ticker-horizontal` (minimum base set).

#### Component 4 — Control API (P1 — HIGH)

- [ ] **FastAPI (Python)** or **Express (Node)** — `base_url: /api/v1`.
- [ ] **Logo endpoints**: `POST /logo/set`, `POST /logo/hide`, `POST /logo/update-position`, `GET /logo/current`.
- [ ] **CG endpoints**: `POST /cg/show`, `POST /cg/hide`, `POST /cg/update`, `GET /cg/templates`.
- [ ] **Asset endpoints**: `POST /assets/upload`, `GET /assets/{id}/status`.
- [ ] **System endpoints**: `GET /health` (structured per component), `GET /metrics` (Prometheus format).
- [ ] **WebSocket**: `WS /ws/control` for real-time events (cg.shown, cg.hidden, logo.changed, health.alert).
- [ ] **Latency targets**: Logo commands ≤ 100ms, CG first frame ≤ 200ms.

#### Component 5 — Management UI (P2 — MEDIUM)

- [ ] **Framework**: React 18+ or Vue 3+.
- [ ] **Logo management**: Drag & drop upload, real-time preview over video mock, drag-to-position, EBU R95 safe area guides, opacity slider, apply-to-channel confirmation, version history (last 10), 1-click rollback.
- [ ] **CG management**: Template list with preview, JSON-schema-generated form, preview over video mock, Show/Hide/Update buttons.
- [ ] **Monitoring dashboard**: Real-time CPU/GPU sparklines, frame drop counter, per-component status (traffic light), event log (last 100 actions).

#### Component 6 — GPU Compositor

- [ ] **C++**: GPU composition loop with shared memory input and output bridge to encoder.
- [ ] **GLSL shaders**: `blend.frag` (alpha blending), `fade.frag` (fade transition).
- [ ] **IPC**: POSIX shared memory or CUDA shared surfaces. Fallback: Unix Domain Socket with zero-copy. Sync via POSIX semaphore or GPU fence.

#### Test Suite (P2 — MEDIUM)

- [ ] **Unit**: Logo pipeline validation (reject opaque PNG, reject > 20MB, correct SVG conversion, ≥ 30% compression, exact 8px padding, zero metadata).
- [ ] **Integration**: Upload → processing → logo visible on output (< 5s). CG show → visible (< 300ms). CG hide → removed (< 200ms). Logo change with smooth fade.
- [ ] **Performance benchmarks**: Composition ≤ 2ms (avg of 10,000 frames), Logo load ≤ 50ms, CG first frame ≤ 200ms, CPU overhead ≤ 3% (logo) / ≤ 8% (CG 1 layer), GPU memory ≤ 50MB combined.
- [ ] **Stress tests**: Show/hide CG 1000x in 60s (zero crashes), logo swap 100x in 30s (zero frame drops), 3 simultaneous CG layers for 1h (stable CPU), CG crash → playout continues, CG recovers in < 2s.

#### Implementation Phases (12 weeks)

| Week | Focus |
|------|-------|
| 1–2 | Architecture doc, CI/CD setup, basic GPU compositor, Logo Engine v1 |
| 3–4 | Asset Processor (all 7 phases), Logo Control API, end-to-end upload test |
| 5–7 | CG Engine (CEF), template system (3 base templates), layer management, CG API |
| 8–9 | Management UI (logo + CG + dashboard), full integration |
| 10–11 | Stress tests, watchdog & auto-recovery, performance tuning, final docs |
| 12 | Staging deploy, 48h continuous test, Go/No-Go review, production deploy |

#### Hard Performance Limits

```
Composition budget:  ≤ 2ms / frame
Logo Engine idle:    < 0.5% CPU
CG Engine (1 layer): < 8% CPU
VRAM (logo):         ≤ 10MB
VRAM (CG):           ≤ 40MB
API logo latency:    ≤ 100ms
Frame drops (24h):   ZERO tolerance
Watchdog restart:    < 500ms
Uptime target:       99.99% per component
```

#### Definition of Done

- [ ] Logo overlay works 24/7 without frame drops (tested 48h).
- [ ] CG show/hide responds in < 300ms end-to-end.
- [ ] Total CPU for CG + Logo < 10%.
- [ ] Crash of any component does not affect the playout.
- [ ] Logo pipeline processes upload → on-air in < 10s.
- [ ] UI enables full management without CLI.
- [ ] API documented with OpenAPI 3.0.
- [ ] Tests cover > 80% of code.
- [ ] System deployable with `docker-compose up`.
- [ ] Documentation enables new dev onboarding in < 1 day.

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
| v3.5.x | 40 | — | CG & Logo Engine (Broadcast-Grade Character Generator) |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Roadmap and ALPHA Documentation Update;In this session, we synchronized the ALPHA documentation and interface with the new strategic roadmap:;1. **Roadmap Phases 38 and 39**: Added to the Help and About sections of the system.;2. **Internationalization**: Full translation synchronization (PT, EN, ES, FR) for the product roadmap and release history.;3. **Version Consistency**: Global version bump across the stack and database to v2.6.0-ALPHA.56-PRO.; |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Goal;Resolve two critical blocking errors (ReferenceErrors) captured after the extreme refactoring of the system for limited hardware and memory. The first being a global boot impedance, and the second associated with interface failure in settings by the ErrorBoundary Catch.;### Actions Executed (Analysis and Planning);- **Diagnosis Error 1 (ReferenceError: Va)**:;  - Identification of `Temporal Dead Zone` (TDZ) caused by React hoisting where components with complex virtual rendering functions (`react-window`) were allocated before handlers like `handleOptimize`, causing crashes in the browser's V8 JS Engine.;  - **Planned:** Change the internal architecture of the Virtualization DOM logic to the base of the function tree in `MediaLibrary.jsx`.;- **Diagnosis Error 2 (ReferenceError: userRoles / userProfiles is not defined)**:;  - Context verified that when extracting the users component from within `Settings.jsx` to the encapsulated import by lazy in `UsersTab`, legacy properties `userRoles` and `userProfiles` remained in the main parent JSX tree of injects referenced improperly although they were purged from the system.;  - **Planned:** Elimination of these "ghost" rendering and invocation properties, saving render tree cycles and preventing the triggering of ErrorBoundary failures.;- **Diagnosis Error 3 (ReferenceError: handleEditUser is not defined)**:;  - Confirmation of severe desynchronization in the React interface between `Settings.jsx` (Parent) and `UsersTab.jsx` (Child). Property variables were passed (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) that **no longer existed** locally in the Parent, and were also **not expected or used** by the Child.;  - Additionally, vital dependencies were left out (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessary to manage the modest internal state logic of the Users tab.;  - **Planned:** Full remapping of all attributes in the `<UsersTab />` segment in the `Settings.jsx` file.;### Next Steps;1. Obtain approval of the plan for clean and safe modification in these components.;2. Inspect results by restarting UI frames.;---; |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-28 | ### Goal;Convert the entire GitHub repository presence to English, including technical documentation, user manuals, and automation scripts (`release.sh` and `update.sh`). The goal is to professionalize the repository and ensure that automatic updates inject English content.;### Actions Executed (Planning);- **Scope Analysis:** Identified all Markdown files in the `docs/` folder, `README.md`, and scripts in `scripts/`.;- **Strategy Definition:**;  - Exclusion of Frontend translation keys (focusing only on Repository/GitHub).;  - Full translation of `release.sh` and `update.sh` (comments, logs, and prompts).;  - Adjustment of regex logic in `release.sh` to support new English headers.;  - Translation of the entire history in `resumes.md` to support English highlights extraction.;- **Plan Creation:** Documented in the internal implementation artifact.;### Completed Actions;- **Script Translation:** Successfully translated `scripts/update.sh` and `scripts/release.sh` to English.;- **Regex Update:** Modified `release.sh` to target English headers in `README.md` and `docs/ROADMAP.md`.;- **Documentation:** Translated all Markdown files (README, ROADMAP, INSTALL, FAQ, DEVELOPMENT, USER_MANUAL, RELEASE_NOTES).;- **History Update:** Fully translated `docs/resumes.md` to English and added this completion summary.;- **Verification:** Bash syntax checked for all modified scripts.;### Next Steps;1. Final review by the user of all English documentation.;2. Maintain English as the standard for all future GitHub repository documentation.;3. Clean up the `/backups/translation-to-english-20260328/` directory once stability is confirmed.;---; |
| v2.6.0-ALPHA.57-PRO | - | 2026-03-28 | ### Goal;Audit the workspace to remove legacy scripts and obsolete tests, reorganize essential build tools, and perform a deep clean of the GitHub repository by pruning old releases and tags. Update the system's version history in the UI.;### Actions Executed;- **Workspace Reorganization**:;  - Moved essential Docker and build scripts (`clean_rebuild.sh`, `rebuild_alpha_docker.sh`, etc.) from root to the `scripts/` directory for better organization.;  - Deleted over 15 obsolete SRT test scripts, old diagnostics, and temporary frontend backup files (`.bak`, `.tmp2`).;- **GitHub Repository Audit**:;  - Identified and deleted all GitHub Releases prior to `v2.6.0-ALPHA.50-PRO`.;  - Permanently removed associated remote tags from origin and local tags from the development environment.;- **UI & Version History**:;  - Updated `translation.json` across all 4 languages (PT, EN, ES, FR) to reflect the new maintenance version `v2.6.0-ALPHA.57-PRO`.;  - Documented the cleanup, audit, and optimization milestones in the "Version Notes" (Modal) and "About System" (Timeline) sections.;- **Maintenance**:;  - Created preventive backups of the workspace before major deletions.;  - Synchronized the local and cloud repositories through a clean-up commit.;### Next Steps;1. Verify workspace stability after script relocation.;2. Monitor GitHub release consistency during future automated deploys.;---; |
| v2.6.0-ALPHA.57-PRO | - | 2026-04-01 | ### Goal;Register Phase 40 (CG & Logo Engine) in the frontend UI: Help Center → Product Roadmap tab, and Settings → About System → Product Roadmap section. Full i18n in 4 languages (EN, PT, FR, ES).;### Files Changed;| File | Action |;|------|--------|;| `frontend/src/components/HelpSystem.jsx` | Added Phase 40 object to `roadmapPhases[]` array in `HelpRoadmap` component |;| `frontend/src/pages/Settings.jsx` | Added Phase 40 object to `roadmapData[]` array in the About System tab |;| `frontend/public/locales/en/translation.json` | Added `help.roadmap.p40.*` keys in English |;| `frontend/public/locales/pt/translation.json` | Added `help.roadmap.p40.*` keys in Portuguese |;| `frontend/public/locales/fr/translation.json` | Added `help.roadmap.p40.*` keys in French |;| `frontend/public/locales/es/translation.json` | Added `help.roadmap.p40.*` keys in Spanish |;### Phase 40 UI Data;- **Phase**: Phase 40;- **Version**: v3.5.x;- **Color**: `#ff6f00` (deep amber — distinct from all previous phases);- **Done**: `false` (upcoming);**4 items displayed:**;1. Logo Engine (C++ + GPU): Static VRAM texture, zero idle CPU, SET/HIDE/FADE/REPOSITION via IPC;2. Asset Pipeline (7 phases): Upload → Validation → Normalization → Optimization → Padding → Manifest → Deploy < 10s;3. CG Engine (CEF/headless): HTML5+CSS3+JSON templates, layer system 0–4, max 2 visible layers, ≤2ms/frame;4. Control API + UI: REST + WebSocket + Prometheus, drag & drop management, EBU R95 safe area, 1-click rollback;### Validation;- All 4 JSON translation files validated with `node -e "require(...)"` — **all OK**.;### Next Steps;1. Bump system version to next ALPHA release to publish the Phase 40 roadmap entry.;2. Begin Phase 40 implementation planning (architecture doc + GPU compositor scaffold).;---; |
