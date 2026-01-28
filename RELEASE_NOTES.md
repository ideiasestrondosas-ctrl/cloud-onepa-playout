# Release Notes - Cloud Onepa Playout

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
