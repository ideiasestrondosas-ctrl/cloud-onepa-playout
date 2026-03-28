# Cloud Onepa Playout

**24/7 Playout Automation System for Video Streaming**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Version](https://img.shields.io/badge/Version-2.6.0-ALPHA.56-PRO-blue.svg)](https://github.com/onepa/cloud-onepa-playout)
[![Status](https://img.shields.io/badge/Status-Stable-green.svg)](https://github.com/onepa/cloud-onepa-playout)

## 📖 About

Cloud Onepa Playout is a simplified and modernized version of [ffplayout](https://github.com/ffplayout/ffplayout), focused on ease of use for end-users while maintaining essential 24/7 broadcasting features.

### ✨ Main Features

- 🎬 **24/7 Broadcasting** with FFmpeg 7.2+
- 🖱️ **Modern Visual Interface** with React + Material-UI
- 📅 **Visual Scheduling Calendar** - intuitive and easy to use
- 🎨 **Drag & Drop** for playlist creation
- 👁️ **Real-Time Content Preview**
- 🧙 **Advanced Setup Wizard**: Step-by-step channel configuration, including media import from library or external streams.
- **Channel Identity**: Customizable Channel Name and Application Logo (separate from watermark).
- **Dashboard Pro**: Real-time monitoring with live preview, HLS/RTMP support, and integrated diagnostics.
- **Dynamic Overlay**: Watermark management with positioning and conditional activation.
- 🚫 **Protected Assets** - protected directory for original files
- 🐳 **Docker** for easy deployment
- 🔒 **Secure JWT Authentication**
- 🎯 **Zero-Cache** - updates always visible in the browser

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- FFmpeg 7.2+ (included in the container)
- 4GB RAM minimum
- 4 CPU cores recommended

### Installation with Docker

```bash
# Clone the repository
git clone https://github.com/onepa/cloud-onepa-playout.git
cd cloud-onepa-playout

# Start the services
docker-compose up -d --build

# Access the web interface
open http://localhost:3010

# Check the backend health
curl http://localhost:8182/api/health
```

### Default Ports (ALPHA Environment)

- **Frontend**: 3010 (Local) / 3011 (Docker)
- **Backend API**: 8181 (Local) / 8182 (Docker)
- **Database**: 5534 (Docker Host)
- **MediaMTX RTMP**: 2035 (Local) / 2036 (Docker)

### Manual Installation

See [docs/INSTALL.md](docs/INSTALL.md) for detailed instructions.

## 📚 Documentation

- [Installation Guide](docs/INSTALL.md)
- [User Manual (Tutorial)](docs/USER_MANUAL.md)
- [Development Guide (API)](docs/DEVELOPMENT.md)
- [FAQ](docs/FAQ.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - Dashboard                            │
│  - Media Library                        │
│  - Playlist Editor                      │
│  - Calendar                             │
└─────────────┬───────────────────────────┘
              │ REST API + WebSocket
┌─────────────▼───────────────────────────┐
│         Backend (Rust)                  │
│  - API Server                           │
│  - FFmpeg Service                       │
│  - Playlist Manager                     │
│  - Scheduler                            │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       PostgreSQL Database               │
└─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Rust (Actix-web)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL
- **Streaming**: FFmpeg 7.2+
- **Container**: Docker + Docker Compose
- **Auth**: JWT

## 📊 Development Statistics (v2.6.0-ALPHA.57-PRO)

This project represents a significant engineering effort to create a robust and modern playout solution.

| Metric           | Detail                     | Value                                         |
| ---------------- | -------------------------- | --------------------------------------------- |
| **Source Code**  | Frontend (React/JSX)       | ~16000+ lines                                 |
|                  | Backend (Rust)             | ~11000+ lines                                 |
|                  | Microservices (Node/Python)| ~1500+ lines                                  |
|                  | Total                      | **~28500+ lines**                             |
| **Architecture** | Backend Modules (Rust)     | 38                                            |
|                  | Visual Components          | 30+                                           |
|                  | Database Migrations        | 78                                            |
| **Complexity**   | Main Languages             | Rust, JavaScript, Python, SQL, YAML           |
|                  | Core Technologies          | Tokio (Async), FFmpeg 7.2+, React 18, Whisper |
|                  | Containers                 | 9 (Backend, Frontend, Postgres, Redis, MediaMTX, Analytics, Graphics, AI, MinIO) |

## 🧪 Testing and Development Environment

This system was developed and validated in high-performance and professional virtualization environments.

- **Local Development and Testing**:
  - **Hardware**: MacBook Pro 2024 (Apple M4)
  - **Specs**: 16GB RAM, 512GB SSD
  - **OS**: macOS tahoe (Native ARM)

- **ALPHA/Staging Testing**:
  - **Platform**: Proxmox VE Virtualization
  - **Hardware**: Intel Xeon Server (Dedicated 4 Cores)
  - **Specs**: 4GB RAM, 80GB SSD
  - **OS**: Ubuntu 24.04 64bit (Linux 6.8.0-100-generic)

> _Approximate data based on version- **Version:** v2.6.0-ALPHA.57-PRO
- **Last Update:** 2026-03-27

## 🎯 Roadmap & Future

> See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full technical roadmap with all details.

### ✅ Completed Milestones (Phases 25–32)

| Phase | Version | Functionality |
|------|--------|---------------|
| Phase 25 | v2.3.0-ALPHA.39 | Enterprise Foundation (Multi-Channel, Redis, WebSocket, Audit Logs) |
| Phase 26 | v2.3.0-ALPHA.40/41 | Frontend Transformation (Themes, Mobile, Analytics, Drag-and-Drop) |
| Phase 27 | v2.4.0-ALPHA.42 | Microservices (Analytics, Graphics, AI Workers) |
| Phase 28 | v2.4.0-ALPHA.43 | SCTE-35 Ad Insertion + Low-Latency HLS |
| Phase 29 | v2.5.0-ALPHA.44 | Kubernetes + MinIO S3 + CI/CD |
| Phase 30 | v2.6.0-ALPHA.45 | Live Inputs & Multi-Channel UI |
| Phase 32 | v2.6.0-ALPHA.47 | Multi-Channel Control & Scale |

### 🔜 Upcoming Phases

- [ ] **Phase 32: Category Folders & Batch Playlist** _(v2.7.x)_ — Organize media by categories (Rock, Salsa, Merengue, Jazz, etc.) with drag-and-drop of entire folders to playlists + customizable categories.
- [ ] **Phase 33: Live Source Switching & NDI** _(v2.8.x)_ — Real-time switching between live sources with NDI, Picture-in-Picture, and A/B switching.
- [ ] **Phase 34: Audio Compliance & Multi-Track** _(v2.9.x)_ — EBU R128 normalization, independent audio tracks (Original + Audio Description + Multilingual), real-time VU Meters.
- [ ] **Phase 35: Automated QC & Ingest** _(v3.0.x)_ — Automatic quality control during ingest (black frames, freeze, silence), smart thumbnails, proxy auto-generation.
- [ ] **Phase 36: FAST Channels & Monetisation** _(v3.1.x)_ — Delivery to Pluto TV / Samsung TV Plus, dynamic ad insertion (DAI), audience analytics.
- [ ] **Phase 37: Enterprise Hardening** _(v3.2.x)_ — Active-active redundancy, BXF/Traffic integration, granular RBAC, read-only remote dashboard.
- [ ] **Phase 38: Total UI/UX Redesign** _(v3.3.x)_ — Professional total redesign with Antigravity + Stitch, MCR Dashboard 2.0 and new menu architecture.
- [ ] **Phase 39: Extreme Performance Hardening** _(v3.4.x)_ — Extreme optimization for 4GB VMs (Mimalloc, FFmpeg Tuning, PWA Caching and Kernel tuning).

### Current Version: v2.6.0-ALPHA.57-PRO (2026-03-28)

<!-- RELEASE_HIGHLIGHTS_START -->
### Goal
Convert the entire GitHub repository presence to English, including technical documentation, user manuals, and automation scripts (`release.sh` and `update.sh`). The goal is to professionalize the repository and ensure that automatic updates inject English content.
### Actions Executed (Planning)
- **Scope Analysis:** Identified all Markdown files in the `docs/` folder, `README.md`, and scripts in `scripts/`.
- **Strategy Definition:**
  - Exclusion of Frontend translation keys (focusing only on Repository/GitHub).
  - Full translation of `release.sh` and `update.sh` (comments, logs, and prompts).
  - Adjustment of regex logic in `release.sh` to support new English headers.
  - Translation of the entire history in `resumes.md` to support English highlights extraction.
- **Plan Creation:** Documented in the internal implementation artifact.
### Completed Actions
- **Script Translation:** Successfully translated `scripts/update.sh` and `scripts/release.sh` to English.
- **Regex Update:** Modified `release.sh` to target English headers in `README.md` and `docs/ROADMAP.md`.
- **Documentation:** Translated all Markdown files (README, ROADMAP, INSTALL, FAQ, DEVELOPMENT, USER_MANUAL, RELEASE_NOTES).
- **History Update:** Fully translated `docs/resumes.md` to English and added this completion summary.
- **Verification:** Bash syntax checked for all modified scripts.
### Next Steps
1. Final review by the user of all English documentation.
2. Maintain English as the standard for all future GitHub repository documentation.
3. Clean up the `/backups/translation-to-english-20260328/` directory once stability is confirmed.
---
<!-- RELEASE_HIGHLIGHTS_END -->

See `RELEASE_NOTES.md` and `docs/RELEASE_NOTES.md` for news and bug fixes details.

## 📄 License

GPL v3 - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments 💖

We would like to express our sincere gratitude to the following for their inspiration, tools, and platforms that made this project possible:

- **ffplayout:** For the initial inspiration and concepts in playout automation.
- **Big Buck Bunny:** (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org, for the use of Big Buck Bunny.
- **Claude Code & Anthropic:** For the advanced AI assistant capabilities.
- **Gemini & Google DeepMind:** For the powerful language models and reasoning.
- **ChatGPT & OpenAI:** For the pioneering work in AI assistance.
- **Google Antigravity:** For the cutting-edge agentic workflow environment.
- **MacOS & MacBook Pro:** For providing the robust development ecosystem and hardware excellence.

## 📧 Support

For issues and support, open an [issue](https://github.com/onepa/cloud-onepa-playout/issues).

---

**Developed with ❤️ for the broadcasting community**
