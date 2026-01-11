# Release Notes

## [v1.8.1-EXP] - 2026-01-11 - Experimental Phase

> ⚠️ **EXPERIMENTAL:** Esta versão introduz mudanças significativas na engine de playout e UI. Recomendada para testes.

### 🧪 Experimental Features

- **Dual-Output Streaming**: Implementação de `tee muxer` no FFmpeg para gerar RTMP e HLS simultaneamente, resolvendo o problema de preview.
- **Protected Assets Metadata**: Visualização rica de assets protegidos com metadados (resolução, codec, tamanho) e caminho do diretório.
- **Original Filename Recovery**: O engine agora consulta a base de dados para exibir o nome original do ficheiro em vez do UUID interno.

### 🚀 Melhorias

- **UI Branding**:
  - Logo aumentado para 64px e centralizado na sidebar.
  - Versão do sistema alinhada e centralizada.
  - Título da aplicação atualizado para "Cloud Onepa Playout".
- **Dashboard**:
  - Adicionado label "Uptime" para clareza.
  - Melhoria na exibição de metadados no player.
- **Infraestrutura**:
  - População automática do diretório de assets protegidos no container.
- Cloud Onepa Playout

## v1.8.0-PRO (2026-01-10)

### 🎉 New Features & Major Improvements

#### Advanced Setup Wizard Upgrade

- **Hybrid Media Selection**: Support for both internal Media Library files and External Streams (RTMP/HLS).
- **Auto-Playlist Generation**: Automatically creates a "Setup Playlist" from selected items.
- **Workflow Optimization**: Smoother transition from configuration to broadcasting.

#### Professional Branding & Identity

- **Channel Identity**: Dedicated "Channel Name" configuration displayed on Dashboard.
- **Application Branding**: Separate upload for sidebar/UI logo, independent of the channel overlay.
- **Visual Separation**: Clear distinction between broadcaster brand (Overlay) and system branding (UI).

#### Playout Engine Stability

- **Enhanced Logging**: Detailed real-time reporting of schedule detection and playlist loading.
- **State Propagation**: Improved synchronization between the backend engine and dashboard status.
- **Idle State Management**: Better handling of transitions between programs.

### 🐛 Bug Fixes

- **Dashboard Recovery**: Fixed critical "White Screen" errors caused by missing Material UI imports and duplicate code blocks.
- **API Correctness**: Resolved settings fetching issues and standardized API calls.
- **UI Consistency**: Fixed version display across all application layers.

---

## v1.7.0-PRO (2026-01-10)

### 🎉 New Features

#### Setup Wizard

- **Guided Configuration**: Multi-step wizard for initial channel setup
- **5 Steps**: Welcome → Identity → Media → Streaming → Finish
- **User-Friendly**: Simplifies first-time configuration
- **Accessible**: Button in Settings → Playout tab

#### Enhanced Settings Page

- **Release Notes Tab**: View version history and system information
- **Public Links**: Direct access to HLS stream and logo URLs
- **System Info**: Display OS, version, and release date
- **Improved UX**: Better organization and navigation

#### Improved Diagnostics

- **Actionable Buttons**: "Agendar", "Criar", "Ativar" buttons in diagnostic report
- **Deep-linking**: "Ativar" button navigates directly to Overlay settings with highlighting
- **Better Feedback**: Clear guidance on what needs configuration

#### Protected Assets

- **Read-Only Directory**: `backend/assets/protected` for original branding files
- **API Protection**: Files cannot be accidentally deleted
- **Documentation**: README included in protected directory

#### Browser Cache Solution

- **Zero-Cache Policy**: Aggressive anti-cache headers in nginx
- **Meta Tags**: HTML meta tags prevent browser caching
- **Always Fresh**: Users always see the latest version
- **Quick Rebuild**: `rebuild.sh` script for fast recompilation

### 🐛 Bug Fixes

- **Templates Persistence**: Fixed 404 error when saving templates (route standardization)
- **Media Thumbnails**: Corrected thumbnail endpoint to `/api/media/{id}/thumbnail`
- **Calendar Delete**: Verified and confirmed working correctly
- **Help System**: Improved visibility with dark background and scrollbars

### 🔧 Improvements

- **Backend Routes**: Standardized all API routes to prevent double-scoping issues
- **Version Display**: App version (v1.7.0-PRO) shown in sidebar and settings
- **Branding**: Consistent "Cloud Onepa" branding throughout the app
- **UX Polish**: Better button placement, clearer labels, improved workflows

### 📚 Documentation

- Updated README.md with new features
- Created Phase 12 summary document
- Improved inline code documentation

---

## v1.0.0 (2025-12-31)

### Initial Release

- Complete playout system with 24/7 broadcasting
- Media library management
- Playlist editor with drag & drop
- Calendar-based scheduling
- Dashboard with statistics
- Settings management
- User authentication (JWT)
- Docker deployment
- HLS and RTMP output support

---

## Roadmap

### Completed ✅

- Phase 1-11: Core functionality and UI
- Phase 12: Assets, versions, and UX fixes

### In Progress 🚧

- Schedule detection debugging (timezone handling)

### Planned 📋

- Advanced scheduling (repeat patterns)
- Multi-channel support
- Cloud storage integration
- Enhanced analytics
- Mobile app

---

**For detailed technical changes, see the git commit history.**
