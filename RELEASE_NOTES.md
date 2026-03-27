# Release Notes - Cloud Onepa Playout

## v2.6.0-ALPHA.56-PRO (2026-03-27)

### 🚀 Release Highlights
### Objetivo
Resolver dois erros impeditivos (ReferenceErrors) capturados após o refactoring extremo do sistema para hardware e memória limitados. O primeiro sendo um impedimento global no boot, e o segundo associado a falha de interface nas definições pelo Catch de ErrorBoundary. 
### Ações Executadas (Análise e Planeamento)
- **Diagnóstico Erro 1 (ReferenceError: Va)**:
  - Identificação de `Temporal Dead Zone` (TDZ) originada pelo hoisting do React onde componentes com funções complexas de renderização virtual (`react-window`) estavam alocados antes dos handlers como `handleOptimize`, propiciando crashes no V8 JS Engine do browser.
  - **Planeada:** Mudança da arquitetura interna da lógica DOM de Virtualização para a base do function tree no `MediaLibrary.jsx`.
- **Diagnóstico Erro 2 (ReferenceError: userRoles / userProfiles is not defined)**:
  - Verificado que ao extrair o componente de utilizadores de dentro de `Settings.jsx` para a importação encapsulada por lazy em `UsersTab`, propriedades legadas `userRoles` e `userProfiles` continuavam na árvore JSX principal de parent de injects referenciadas indevidamente embora tenham sido expurgadas do sistema.
  - **Planeada:** Eliminação destas propriedades de renderização e invocação "fantasmas", poupando ciclos de render tree e prevenindo acionamento das falhas do ErrorBoundary.
- **Diagnóstico Erro 3 (ReferenceError: handleEditUser is not defined)**:
  - Confirmação de dessincronização grave na interface React entre `Settings.jsx` (Pai) e `UsersTab.jsx` (Filho). Foram passadas variáveis de propriedades (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) que **já não existiam** localmente no Pai, e que também **não eram esperadas nem utilizadas** pelo Filho.
  - Adicionalmente, ficaram de fora dependências vitais (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessárias para gerir a modesta lógica de estado interno da aba de Utilizadores.
  - **Planeada:** Remapeamento completo de todos os atributos na divisa `<UsersTab />` do ficheiro `Settings.jsx`.
### Próximos Passos
1. Obter autorização do plano para modificação limpa e segura nestes componentes.
2. Inspecionar resultados ao re-iniciar as frames da UI.
---

## v2.6.0-ALPHA.56-PRO (2026-03-27)

### 🚀 Release Highlights
#### Atualização do Roadmap e Documentação Alpha
Nesta sessão, sincronizámos a documentação e a interface do ALPHA com o novo roteiro estratégico:
1. **Roadmap Fases 38 e 39**: Adicionadas às abas de Ajuda e Sobre o Sistema as novas fases de Redesign UI/UX e Performance Hardening.
2. **Internacionalização**: Sincronização completa de tradução (PT, EN, ES, FR) para o roteiro do produto e histórico de lançamentos.
3. **Consistência de Versão**: Bump global de versão em toda a stack e base de dados para v2.6.0-ALPHA.56-PRO.
4. **Segurança e Backup**: Criada pasta de backup `backups/pre-version-bump-alpha56/` contendo os estados originais antes da transição.

## v2.6.0-ALPHA.55-PRO (2026-03-26)

### 🚀 Release Highlights
### Automação de Lançamento e Documentação Dinâmica
Nesta sessão, focámos na melhoria do processo de release e na atualização automática da documentação pública:
1. **Script de Release (`release.sh`)**:
   - **Data Automática**: Implementada a variável `RELEASE_DATE` para capturar a data real do lançamento.
   - **Destaques Interativos**: O script agora solicita ao utilizador a introdução das novidades da versão (`RELEASE_HIGHLIGHTS`) durante o processo de release.
   - **Automação Total**: O script atualiza agora automaticamente o `README.md`, `docs/ROADMAP.md`, `RELEASE_NOTES.md` e `docs/RELEASE_NOTES.md` com a nova versão, data e destaques.
2. **Documentação Interna (`README.md` & `ROADMAP.md`)**:
   - **Nova Secção**: Criada a secção `### 🆕 Novidades & Alterações` no `README.md`, localizada estrategicamente após o Roadmap para visibilidade imediata.
   - **Histórico de Roadmap**: O `docs/ROADMAP.md` agora recebe automaticamente uma nova entrada na tabela de histórico de versões a cada release.
   - **Formatação de Versão**: Padronizado o formato da "Versão Atual" para incluir a data completa: `vX.X.X (YYYY-MM-DD)`.
3. **Segurança e Backup**:
   - Criada uma pasta de backup (`backups/pre-release-update-...`) contendo os estados originais de todos os ficheiros modificados antes da implementação das melhorias.

## v2.6.0-ALPHA.56-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.56-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.56-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.55-PRO (2026-03-25)

### 🚀 Release Highlights
- **Master Dashboard**: Implemented new Mosaic view for passive monitoring of all channels.
- **Playout Engine**: Fixed critical bug where protocol settings were parsed with JSON quotes, causing FFmpeg crashes.
- **Watchfolder**: Implemented per-channel isolation and dedicated synchronization functionality.
- **System Health**: Refactored diagnostics and telemetry to be fully channel-aware.
- **i18n**: Completed full localization for all Multi-Channel features (EN, PT, ES, FR).
- **Help System**: Comprehensive documentation for the new Multi-Channel architecture.

## v2.6.0-ALPHA.53-PRO (2026-03-25)

### 🚀 Release Highlights
- **Master Dashboard**: Removed redundant 'ON AIR' tag for a cleaner interface.
- **Master Dashboard**: Added blue 'glow' effect and smooth scale animation for selected channel.
- **WebSocket**: Refactored backend EventBus to support wildcard (*) subscriptions.
- **TV Guide**: Fixed EPG data isolation ensuring each channel sees only its own events.
- **System**: Fixed SQL macros in backend to ensure stable build in Docker environments.

## v2.6.0-ALPHA.51-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.51-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.51-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.50-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

### Fixed
- Database version mismatch for system_version.
- Cleaned up duplicated locale stubs in About System.

# Release Notes - Cloud Onepa Playout

## v2.6.0-ALPHA.50-PRO (17/03/2026)

### 🚀 Release Highlights
- **Automated Release**: Version bump and synchronization across documentation and translations.
- **Project Structure**: Updated backend and frontend configurations.

## v2.6.0-ALPHA.49-PRO (17/03/2026)

### 🚀 Release Highlights
- **Automated Release**: Version bump and synchronization.

## v2.6.0-ALPHA.48-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.47-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.46-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.46-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.46-PRO (2026-03-12)

### 🎨 UI Refinements & Navigation (Phase 32)
- **Menu Reorganization**: Sidebar now ordered as Dashboard → Live Input → EPG → Midia → Playlist → MultiChannel → Calendar → Graphics → Templates → Health → Config for a more intuitive workflow.
- **Logoff Button Styling**: Logoff button now permanently uses the red alpha badge color (`#cc0000`) for a consistent, intentional visual identity. Hover brightens to `#ff2222`.
- **Version Bump**: All components in the stack updated to `v2.6.0-ALPHA.46-PRO`.

## v2.6.0-ALPHA.45-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.45-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.6.0-ALPHA.45-PRO (2026-03-10)

### 🎬 Live Inputs & Multi-Channel UI (Phase 30)
- **Live Input Ingestion Service**: New service for registering and monitoring live sources (WebRTC, NDI, SDI, RTMP, SRT). FFmpeg pipelines with GPU acceleration support (NVENC/VAAPI).
- **Live Switching Engine**: Cut and fade transitions between live sources, audio mixing, and graphics overlay integration with the playout pipeline. WebSocket control events.
- **Social Streaming Integration**: Multi-destination streaming to YouTube Live and Facebook Live. Stream key management, automatic reconnection, and health monitoring.
- **Multi Channel Visual UI**: Grid layout dashboard with live preview thumbnails, channel status indicators, quick input routing, and emergency override controls.

### 🤖 AI Automation & High Availability (Phase 31)
- **AI Playlist Generation**: Media content analysis with scene detection, speech-to-text, and metadata enrichment. Playlist suggestions based on content analysis.
- **High Availability Architecture**: Active-active playout nodes, automatic failover, health checks, and shared storage configuration.
- **Edge CDN**: Internal CDN distribution with origin server, edge nodes, cache layer, and load balancer for HLS segment caching.
- **Monitoring & Alerting**: Prometheus metrics integration, Grafana dashboards, and Alertmanager for streaming pipeline and system monitoring.

### 🚀 Release Highlights
- **Automated Release**: Version bump to ALPHA.45-PRO.
- **Documentation**: Synced README.md, RELEASE_NOTES.md and frontend constants.
- **Roadmap Update**: Phase 30 and Phase 31 now marked as implemented.

## v2.5.0-ALPHA.44-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.5.0-ALPHA.44-PRO (2026-03-10)

### ☁️ Kubernetes + MinIO + CI/CD (Phase 5)
- **Helm Charts** (`deployment/helm/`): Complete Kubernetes manifests for all 9 services — backend, frontend, analytics, graphics, AI worker, postgres StatefulSet, redis, minio StatefulSet, mediamtx. Includes `values.yaml` for configurable image tags, replicas, storage sizes, TLS.
- **NGINX Ingress**: `templates/ingress.yaml` — routes `/api`, `/hls`, `/minio-console`, `/` to correct services.
- **HPA**: `templates/hpa.yaml` — HorizontalPodAutoscaler for frontend (2–8 replicas) and backend (1–4 replicas) on CPU utilization.
- **MinIO S3 Storage** (`docker-compose.yml`): `minio/minio:latest` on ports 9000 (S3 API) + 9001 (Web Console). Data volume: `./data/minio`.
- **Storage Service** (`backend/src/services/storage.rs`): Trait-based abstraction — `LocalStorage` (filesystem) and `S3Storage` (object_store crate with MinIO/AWS). Selected via `STORAGE_BACKEND=local|s3` env var.
- **object_store crate**: `object_store = { version = "0.9", features = ["aws"] }` added to `Cargo.toml`.
- **GitHub Actions** (`.github/workflows/ci.yml`): On PR → `cargo fmt`, `cargo clippy`, `cargo test`, `npm lint`, Vite build. On push → Docker matrix build + push to GHCR for all 5 services.
- **Migration 077**: `ALTER TABLE media ADD COLUMN s3_path TEXT` — stores S3 object key for cloud-stored assets.
- **Migration 078**: `system_version` → `v2.5.0-ALPHA.44-PRO`.
- **Version History (About System)**: All 4 i18n locales (EN/PT/ES/FR) updated with ALPHA.44 entry; `APP_VERSION_FALLBACK` and boot log updated.

## v2.4.0-ALPHA.43-PRO (2026-03-10)

### 📡 SCTE-35 Ad Insertion + Low-Latency HLS (Phase 4)
- **SCTE-35 REST API**: `GET/POST/DELETE /api/v2/scte35` — manage `splice_insert` markers per playlist item. Fields: `playlist_item_id`, `playlist_id`, `splice_insert_type`, `pts_offset` (90kHz ticks), `duration_frames`, `auto_return`.
- **FFmpeg SCTE-35 injection**: `FFmpegService::build_scte35_args(markers)` builds `-metadata:s:v:0` args to inject cue events into the MPEG-TS stream pipeline.
- **Playlist Editor — Ad Cue button**: Per-clip `Tv` icon button opens the SCTE-35 dialog. Shows active markers (with delete), and form to add new cue (PTS offset, duration frames, auto-return toggle). Fetches/saves via `/api/v2/scte35`.
- **LL-HLS (Low-Latency HLS)**: `docker/mediamtx.yml` updated — `hlsVariant: lowLatency`, `hlsSegmentDuration: 1s`, `hlsPartDuration: 100ms`. Reduces glass-to-glass latency from ~4s to sub-1s.
- **Version History (About System)**: All 4 i18n locales (EN/PT/ES/FR) updated with complete release history for ALPHA.39–43. `APP_VERSION_FALLBACK` and boot console log updated.
- **Migration 076**: `system_version` → `v2.4.0-ALPHA.43-PRO`.

## v2.4.0-ALPHA.42-PRO (2026-03-10)

### ⚙️ Microservices Architecture (Phase 3)
- **service-analytics** (Node.js): Redis `playout:*` subscriber → writes `as_run_logs` on `clip_start`, finalises on `clip_end`, writes `audit_logs` on `audit` events. REST: `GET /health`, `GET /internal/as-run`, `GET /internal/audit-logs`. Port 4001.
- **service-graphics** (Node.js + Puppeteer): HTML5 Graphics Compositor. `POST /render` → headless Chromium at 1920×1080, transparent PNG for FFmpeg overlay. `POST /preview` → base64 PNG for UI. Port 3002.
- **service-ai** (Python 3.12 + faster-whisper): Polls `media_tasks` for `ai-caption` jobs → Whisper ASR → WebVTT captions → silence detection via ffmpeg → writes to `media.metadata` JSONB → publishes to Redis `analytics:ai`.
- **Docker Compose**: Three new services with `depends_on: [redis, postgres]` and health checks.
- **Dockerfiles**: `Dockerfile.analytics`, `Dockerfile.graphics` (Alpine + system Chromium), `Dockerfile.ai` (python:3.12-slim + ffmpeg).
- **Migration 074**: `media_tasks` job queue table.
- **Migration 075**: `system_version` → `v2.4.0-ALPHA.42-PRO`.

## v2.3.0-ALPHA.41-PRO (2026-03-10)

### 🔀 UI Consolidation & Navigation Refinement (Phase 26.1)
- **Analytics → Health merge**: Playout Health page (`/health`) now has two tabs — **Health** (score gauge, live log console, status cards, KPI strip) and **Analytics** (WebSocket live bitrate chart, clips/day bar chart, 4 KPI cards). Single nav entry, single route, zero duplication.
- **Template Editor → Graphics merge**: Graphics Editor (`/graphics`) now has four header-level tabs: **Position**, **Style**, **Layers**, **Templates**. When Templates tab is active, a full-width `<GraphicsTemplateEditor embedded />` replaces the preview/controls grid; RESET/SAVE buttons are hidden automatically.
- **Sidebar reduced from 11 to 9 entries**: Removed standalone `/analytics` and `/graphics/template-editor` routes and nav items.
- **App.jsx**: Removed lazy imports and routes for the now-embedded `Analytics` and `GraphicsTemplateEditor` pages.
- **Migration 073**: `system_version` → `v2.3.0-ALPHA.41-PRO`.

## v2.3.0-ALPHA.40-PRO (2026-03-10)

### 🎨 Frontend Transformation (Phase 2)
- **Theme Personalization Engine**: Runtime CSS variable switching via `ThemeContext`. Colors loaded from DB and applied at login. MUI `createTheme` rebuilt dynamically with `buildMuiTheme()`.
- **Mobile Responsive Layout**: Navigation drawer closes on route change. Analytics and Template Editor added to sidebar with `AnalyticsIcon` and `TemplateEditorIcon`. All 4 i18n locales updated (EN/PT/ES/FR).
- **Real-Time Analytics Dashboard**: `/analytics` page — Recharts `LineChart` for live stream bitrate via WebSocket, `BarChart` for clips/day from as-run REST API, KPI cards.
- **Drag-and-Drop Graphics Template Editor**: `/graphics/template-editor` — 16:9 canvas with absolute-positioned elements, component palette (Text, Clock, Lower Third, Marquee, Shape, Image), @dnd-kit drag-from-palette, property inspector, JSON save to templates API.
- **Recharts dependency**: Added `recharts@^2.12.0` to frontend dependencies.

## v2.3.0-ALPHA.39-PRO (2026-03-10)

### 🏗️ Enterprise Foundation (Phase 1)
- **Multi-Channel DB**: `channels` table + `channel_id` scoping on all core tables.
- **Redis Event Bus**: Real-time `clip_start` events published via Redis Pub/Sub.
- **As-Run Logs**: `as_run_logs` table for compliance proof-of-play.
- **Audit Trail**: `audit_logs` table for immutable user action history.
- **SCTE-35 Schema**: `scte_35_markers` table for ad-insertion cues.
- **Theme Personalization Schema**: `themes` + `frontend_preferences` tables.
- **WebSocket Endpoint**: `GET /api/v2/events?token=<JWT>` streams live telemetry.
- **v2 API**: `/api/v2/channels`, `/api/v2/analytics/*`, `/api/v2/analytics/preferences/*`.

## v2.2.0-ALPHA.38-PRO ()

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

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
