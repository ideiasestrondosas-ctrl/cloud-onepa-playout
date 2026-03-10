# Cloud Onepa Playout - Roadmap

_Status atualizado em 2026-03-10 (v2.2.0-ALPHA.38-PRO)_

## 🏁 Completed Milestones

- [x] **Phase 1-18**: Core System & Beta Release (v1.0 - v1.8.0-PRO)
  - Full Playout Engine setup
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

  - [x] **EPG Intelligence 2.0**: Enhanced tooltips with Director, Rating, and Genre; real-time metadata hydration from Media Library; XMLTV export with rich descriptions and categories.
  - [x] **Metadata Transparency**: Persistent source links (TMDB/OMDb/TVMaze) in library; instant sync between library metadata and visual EPG guides.
  - [x] **Reality Sync Engine**: Robust file detection across Media, Assets, Fillers, and Protected paths.
  - [x] **Storage Transparency**: Real-time MB/GB diagnostics in Settings.
  - [x] **Performance Streaming**: Native Range Request support and network optimisation for instant loading.
  - [x] **Media Library**: Automatic data hygiene — removes system asset residues; duplicated clip support with correct metadata hydration.
  - [x] **UI Density Overhaul (Surgical Compact)**: Massively refined paddings/margins across all main views; EPG & Calendar optimised for more visible events without scrolling; Dashboard Protocol Focus with real-time telemetry priority.
  - [x] **High-Density Help System**: Redesigned `?` menu for maximum readability and space efficiency.
  - [x] **Multi-Layer Graphics Engine**: Added initial placeholder/Coming Soon for multi-layer graphics overlay.
  - [x] **Protocol Stability**: Fixed RTMP failure when output URL is empty (intelligent fallback); resolved FFmpeg flickering in UDP multicast streams.
  - [x] **UDP Stability & Process Guard**: Corrected Unicast PUSH mode to eliminate "Address already in use" errors; internal protection against port collisions between master and relay processes.
  - [x] **Audit Ports 3.0**: New diagnostic engine with intelligent receiver detection (VLC) and refined socket filtering.
  - [x] **Log Management**: Log rotation (10 MB / 3 files) and enhanced container persistence to prevent disk space issues.
  - [x] **Backend Recovery**: Resolved `VersionMismatch` conflict and stabilised container startup.
  - [x] **Script Versioning**: Standardised application version output across all `.sh` and `.bat` scripts.
  - [x] **i18n & Translations**: Full internationalisation of version history, system health dashboard, branding assets, and program template labels across EN / FR / ES.
  - [x] **Program Templates API**: Updated integrations for Morning Program, 24H Playlist, and Loop Content templates.
  - [x] **Transcription Engine**: Optimised accuracy settings for improved speech recognition.
  - [x] **Logo Branding Alignment**: Synchronised graphics assignment with system logo across all views.

---

### 🧪 Phase 25: Live Inputs & Advanced Protocol (Next)

_Focus: Expanding beyond file playback_

- [ ] **Live Inputs Support**: Integration of WebRTC, NDI, and SDI inputs for live switching.
  Status: WebRTC output already exists; live input switching (WebRTC/NDI/SDI) is not implemented.
- [ ] **Social Streaming**: Native API integration for YouTube Live & Facebook Live.
  Status: RTMP output to social platforms exists; native API integration is not implemented.
- [ ] **Advanced SRT**: Multi-caller support and bonding.

### 🎨 Phase 26: Graphics & Visual Experience

_Focus: Advanced on-air branding_

- [ ] **Drag-and-Drop Editor**: Web-based WYSIWYG editor for active templates.
  Status: Graphics Editor (WYSIWYG + drag-and-drop for layers) exists; template editor still pending.
- [ ] **HTML5 Graphics Engine**: Dynamic overlays using standard web technologies.
  Status: HTML preview/editor exists; on-air HTML5 render pipeline not implemented.
- [ ] **Mobile Responsive Layout**: Full mobile support for the dashboard.
- [ ] **Theme Customization**: Advanced user theming engine.

### 🏢 Phase 27: Enterprise & Compliance

_Focus: Scalability and professional requirements_

- [x] **Multi-User System**: Role-based access control (RBAC) and collaboration.
- [ ] **Audit Logs**: Comprehensive tracking of all user actions.
- [ ] **As-Run Logs**: Industry-standard logging for proof-of-play (compliance).
- [ ] **SCTE-35 Support**: Ad-insertion triggers for cable/IPTV distribution.
- [ ] **Analytics Dashboard**: Viewer stats and system health metrics.
  Status: System health view exists; viewer analytics dashboard is not implemented.

### 🚀 Phase 28: Future Technologies & Scalability

_Focus: Innovation and High Availability_

- [ ] **AI Integration**: Auto-tagging content and smart playlist generation.
- [ ] **Multi-Channel Core**: Single instance managing multiple independent playout channels.
- [ ] **High Availability**: Redundancy and failover architecture.
