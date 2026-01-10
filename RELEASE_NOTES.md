# Release Notes - Cloud Onepa Playout

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
