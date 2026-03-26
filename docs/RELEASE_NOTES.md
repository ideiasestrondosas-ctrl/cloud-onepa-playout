# Release Notes - Cloud Onepa Playout

## v2.6.0-ALPHA.54-PRO (2026-03-25)

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
- **High-Density Help System**: Redesign massivo do menu ? para maxima ocupacao e legibilidade eficiente.
- **Protocol Stability**: Correcao de falha RTMP quando o output url esta vazio (fallback inteligente).
- **Backend Recovery**: Resolucao do conflito `VersionMismatch` e estabilizacao de arranque do container.
- **Automation Integrity**: Correcao da logica de sufixos de versao nos scripts de build e release.

## v2.2.0-ALPHA.27-PRO (2026-02-23)

### 🚀 Release Highlights
- **Surgical Compact Redesign**: Aperfeicoamento massivo de paddings (3->1.5) e margens (4->2) em todas as vistas principais para maxima densidade de informacao.
- **EPG & Calendar Optimization**: Reducao de alturas de linha e compactacao de barras laterais, permitindo visualizar mais eventos sem scroll.
- **Dashboard Protocol Focus**: Barra de protocolos e live monitor ajustados para priorizar telemetria e logs em tempo real.
- **Bug Fix (Stability)**: Resolvido o erro `ReferenceError: EditIcon is not defined` que causava crash na gestao de perfis de utilizadores.

## v2.2.0-ALPHA.26-PRO (2026-02-23)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.25-PRO (2026-02-22)

### 🚀 Release Highlights
- **Consolidacao ALPHA.25**: Sincronizacao total da versao v2.2.0-ALPHA.25-PRO em todo o ecossistema (DB, Backend, Frontend).
- **Reality Sync Engine**: Motor robusto com suporte global a caminhos (Media, Assets, Fillers, Protected) para deteccao de ficheiros fisicos.
- **Transparencia de Armazenamento**: Diagnostico de MB/GB recuperado nas Definicoes com visualizacao em tempo real.
- **Filtro Profissional**: Assets de sistema protegidos (Logos/Vortex) ocultos da Media Library, mantendo apenas o video padrao.
- **Performance de Streaming**: Suporte nativo a Range Requests e optimizacao de rede para carregamento instantaneo.
- **Limpeza de Dados**: Higienizacao automatica da base de dados para remover residuos de assets de sistema.

## v2.2.0-ALPHA.24-PRO (2026-02-20)

### 🚀 Release Highlights
- **Detalhes pendentes**: Esta versao precisa de consolidacao de notas de release.
