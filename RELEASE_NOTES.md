# Release Notes - Cloud Onepa Playout

## v2.2.0-ALPHA.5-PRO-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.5-PRO-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.5-PRO-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.5-PRO-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.5-PRO-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.5-PRO (2026-02-04)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.4-PRO (2026-02-03)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.
- **Graphics Engine**: Added "Coming Soon" placeholder for Multi-Layer Graphics (Clocks, Lower Thirds, Marquees).



## v2.2.0-ALPHA.3-PRO (2026-01-31)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.
- **Logo Alignment**: Synchronized graphics assignment with system logo.
- **Version Sync**: Updated system information with GitHub Cloud history.

## v2.2.0-ALPHA.3-PRO (2026-01-31)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.3-PRO (2026-01-31)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.3-PRO (2026-01-31)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.2-PRO (2026-01-30)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.2-PRO (2026-01-30)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.1 (2026-01-28)

### 🚀 Alpha Environment Migration

- **Port Migration**: All service ports have been shifted to prevent conflicts with Master.
  - Frontend: 3011
  - Backend API: 8181 (Internal) / 8182 (External)
  - Postgres: 5534
  - MediaMTX: 2036 (RTMP), 8991 (HLS), 8992 (WebRTC)
- **Docker-Only Workflow**: Consolidated development workflow to use Docker containers exclusively for consistency.

### 🐛 Bug Fixes & Improvements

- **Login System**:
  - Fixed silent 401 failures during login.
  - Enhanced error messages (Red alert with Status Code).
  - Removed "Alpha Intelligence System" subtitle for cleaner UI.
- **Backend Stability**:
  - Fixed database migration checksum mismatch for admin password.
  - Fixed HLS directory permission issues in development.
- **Documentation**:
  - Added `ALPHA_GUIDE.md` for specific environment details.
  - Updated `README.md` with Alpha port mappings.

### 📦 Infrastructure

- **Unified Rebuild Script**: Added `rebuild_alpha_docker.sh` for one-click environment updates.
- **Release Automation**: Fixed large file handling in release scripts.
