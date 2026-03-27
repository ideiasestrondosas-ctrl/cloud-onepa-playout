# Cloud Onepa Playout - Roadmap

_Status atualizado em 2026-03-27 (v2.6.0-ALPHA.56-PRO)_

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
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Atualização do Roadmap e Documentação Alpha;Nesta sessão, sincronizámos a documentação e a interface do ALPHA com o novo roteiro estratégico:;1. **Roadmap Fases 38 e 39**: Adicionadas às abas de Ajuda e Sobre o Sistema as novas fases de Redesign UI/UX e Performance Hardening.;2. **Internacionalização**: Sincronização completa de tradução (PT, EN, ES, FR) para o roteiro do produto e histórico de lançamentos.;3. **Consistência de Versão**: Bump global de versão em toda a stack e base de dados para v2.6.0-ALPHA.56-PRO.; |
| v2.6.0-ALPHA.56-PRO | - | 2026-03-27 | ### Objetivo;Resolver dois erros impeditivos (ReferenceErrors) capturados após o refactoring extremo do sistema para hardware e memória limitados. O primeiro sendo um impedimento global no boot, e o segundo associado a falha de interface nas definições pelo Catch de ErrorBoundary. ;### Ações Executadas (Análise e Planeamento);- **Diagnóstico Erro 1 (ReferenceError: Va)**:;  - Identificação de `Temporal Dead Zone` (TDZ) originada pelo hoisting do React onde componentes com funções complexas de renderização virtual (`react-window`) estavam alocados antes dos handlers como `handleOptimize`, propiciando crashes no V8 JS Engine do browser.;  - **Planeada:** Mudança da arquitetura interna da lógica DOM de Virtualização para a base do function tree no `MediaLibrary.jsx`.;- **Diagnóstico Erro 2 (ReferenceError: userRoles / userProfiles is not defined)**:;  - Verificado que ao extrair o componente de utilizadores de dentro de `Settings.jsx` para a importação encapsulada por lazy em `UsersTab`, propriedades legadas `userRoles` e `userProfiles` continuavam na árvore JSX principal de parent de injects referenciadas indevidamente embora tenham sido expurgadas do sistema.;  - **Planeada:** Eliminação destas propriedades de renderização e invocação "fantasmas", poupando ciclos de render tree e prevenindo acionamento das falhas do ErrorBoundary.;- **Diagnóstico Erro 3 (ReferenceError: handleEditUser is not defined)**:;  - Confirmação de dessincronização grave na interface React entre `Settings.jsx` (Pai) e `UsersTab.jsx` (Filho). Foram passadas variáveis de propriedades (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) que **já não existiam** localmente no Pai, e que também **não eram esperadas nem utilizadas** pelo Filho.;  - Adicionalmente, ficaram de fora dependências vitais (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessárias para gerir a modesta lógica de estado interno da aba de Utilizadores.;  - **Planeada:** Remapeamento completo de todos os atributos na divisa `<UsersTab />` do ficheiro `Settings.jsx`.;### Próximos Passos;1. Obter autorização do plano para modificação limpa e segura nestes componentes.;2. Inspecionar resultados ao re-iniciar as frames da UI.;---; |
