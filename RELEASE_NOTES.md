# Release Notes v2.0.1-DEBUG (2026-01-24)

## 📡 Output Standardization & Reliability

- **Unified Output Source of Truth**: Centralized all transmission URL logic (RTMP, SRT, UDP, HLS) in the backend.
- **View Synchronization**: Dashboard and Settings views now share the exact same standardized URLs.
- **Improved Persistence**: Protocol enablement flags (RTMP/SRT/UDP) now persist correctly across engine restarts and page refreshes.
- **Dynamic Guidance**: All help text and VLC copy-buttons now use live server-derived URLs.

## 🛠️ Infrastructure & Build

- **Dependency Pinning**: Updated Docker build process to copy `Cargo.lock`, preventing build failures from upstream dependency breaking changes.
- **Version Tracking**: Synchronized system version tracking across Database, Backend, and Frontend.

## 📅 EPG Intelligence & Timeline (v2.0.0, 2026-01-23)

- **Automated EPG Generation**: Native support for generating XMLTV guides based on the master schedule and recurring calendar events.
- **Graphic Timeline View**: Implemented a professional EPG timeline component for visual program navigation.
- **Recurring Logic**: Full support for "daily" and "weekly" repetitions with automatic clip timing expansion in the guide.
- **EPG Metadata Expansion**: Content now includes Genre, Rating, and detailed descriptions for a premium receiver experience.

## 📉 Distribution & Session Accuracy

- **Granular Session Counting**: Differentiated counting for HLS readers vs RTMP/UDP active sessions, providing 100% accurate viewer statistics.
- **Broadcasting Status**: HLS status now accurately reflects the engine state even when MediaMTX doesn't report active sessions for static segments.
- **Protocol Stability**: Optimized FFmpeg relay management to eliminate flickering and ensure permanent connection for UDP pushed streams.

## 🛠️ Performance & Reliability

- **Auto-Recovery**: Improved process monitor to detect and restart stalled relays automatically.
- **Clean Rebuild Suite**: Standardized cleanup and repair scripts for rapid environment recovery.

## 📜 Credits & Copyright

- **Big Buck Bunny**: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org, for the use of Big Buck Bunny.
- **Project Baseline**: Cloud Onepa Playout is a professional evolution of the ffplayout concept.

---

# Release Notes v2.0.0-PRO (2026-01-23)

## 📅 EPG Intelligence & Timeline

- **Automated EPG Generation**: Native support for generating XMLTV guides based on the master schedule and recurring calendar events.
- **Graphic Timeline View**: Implemented a professional EPG timeline component for visual program navigation.
- **Recurring Logic**: Full support for "daily" and "weekly" repetitions with automatic clip timing expansion in the guide.
- **EPG Metadata Expansion**: Content now includes Genre, Rating, and detailed descriptions for a premium receiver experience.

## 📉 Distribution & Session Accuracy

- **Granular Session Counting**: Differentiated counting for HLS readers vs RTMP/UDP active sessions, providing 100% accurate viewer statistics.
- **Broadcasting Status**: HLS status now accurately reflects the engine state even when MediaMTX doesn't report active sessions for static segments.
- **Protocol Stability**: Optimized FFmpeg relay management to eliminate flickering and ensure permanent connection for UDP pushed streams.

## 🛠️ Performance & Reliability

- **Auto-Recovery**: Improved process monitor to detect and restart stalled relays automatically.
- **Clean Rebuild Suite**: Standardized cleanup and repair scripts for rapid environment recovery.

## 📜 Credits & Copyright

- **Big Buck Bunny**: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org, for the use of Big Buck Bunny.
- **Project Baseline**: Cloud Onepa Playout is a professional evolution of the ffplayout concept.

---

# Release Notes v1.9.4-PRO (2026-01-17)

## 🎨 UI/UX Enhancements

- **Setup Wizard**: Multi-select support and metadata editing capabilities
- **Playlist Editor**: Unique clip validation and bulk add functionality
- **Dashboard**: New pulsating ON AIR indicator for live status

## 📡 Protocol & Diagnostics

- **VLC Smart Launcher**: Integrated logs in real-time for troubleshooting
- **SRT Configuration**: Dynamic Caller/Listener mode switching
- **Safari Compatibility**: Fixed Audio Context and LUFS Meter issues

## 🛡️ Critical Stability Fixes

- **Upload Sequencing**: Resolved white screen crashes during sequential uploads
- **Delete Confirmation**: Fixed dialog issues in Chrome browser
- **Version Sync**: Unified version display across all components

## 🔧 Performance Optimizations

- **Docker Cache**: Clean build system with cache reset capabilities
- **List Rendering**: Optimized rendering for large media libraries
- **Path Validation**: Robust file path validation and sanitization

---

# Release Notes v1.9.5-PRO (2026-01-19)

## 📡 Protocol Security & Visuals (v1.9.5)

- **MediaMTX Security integration**: RTMP/SRT relays now support query-string authentication.
- **Recurring Markers**: Added visual markers "(R)" and "REPETIÇÃO" across the dashboard and calendar.
- **HLS URL Standardization**: Optimized HLS playback paths for broader player compatibility.

---

# Release Notes v1.9.3-PRO (2026-01-16)

## 🛡️ Security & Performance (v1.9.3)

- **SQL Injection Prevention**: Full refactor of Media, Schedule, and Playlist APIs to use parameterized queries (`QueryBuilder`).
- **Path Traversal Protection**: Implemented strict filename sanitization and boundary checks for all file-serving endpoints.
- **Search Optimization**: Added 500ms debouncing to the Media Library search to reduce server load.
- **Database Performance**: Added targeted indexes for scheduling and media lookups.
- **Backend Healing**: Removed inefficient per-request metadata checks in favor of stable database state.

## 📡 SRT & Connectivity

- **SRT Caller Mode v2**: Refined hostname mapping logic to better support Docker environments.
- **Smart Listener Suggestions**: The UI now suggests the correct listener URL (`srt://@:9900?mode=listener`) when in Caller mode.
- **Diagnostics Window**: Integrated backend log viewing directly into the SRT configuration panel for real-time troubleshooting.

## 🔄 Playout & UX

- **Playout Retry**: Added a dedicated "Retry" button to quickly restart the playout engine without manual command resets.
- **Interactive Logs**: Guidance on error resolution is now provided alongside logs (e.g., VLC connection steps).

## 🛠️ Internal Tools

- **SRT Diagnostics Suite**: Added several scripts (`diagnose_srt.sh`, `test_srt_v*.sh`) for deep analysis of network and SRT packets.
- **Automation Scripts**: New `install.sh` and `update.sh` scripts for simplified environment setup.

---

## 🕒 Top Bar & Header

- **Real-time Clock & Date**: Integrated a professional real-time clock and date into the Top Bar using a premium monospace font.
- **Dashboard Refinement**: Cleaned up the Dashboard header by removing redundant titles and clocks, creating a more professional and focused monitor view.

## 📊 Audio & Monitoring

- **LUFS Meter v2**: Fixed `AudioContext` suspension issues in Chrome and Safari. The meter now automatically resumes synchronization when the user starts playback.
- **Enhanced Diagnostics**: Improved RTMP/HLS diagnostics for easier troubleshooting of stream failures.

## 📂 Media Library & Assets

- **Subfolder Support**: Full support for navigating and managing media within hierarchical folders.
- **Recursive Deletion**: Deleting a folder now correctly and recursively removes all files within it from both the database and disk.
- **Thumbnail Healing**: Implemented automatic logic to serve video thumbnails via a stable proxy and regenerate missing ones on the fly.

## 🔗 UX & Connectivity

- **Smart Copy Icons**: Added fast-copy icons to all output URLs (RTMP, HLS, SRT, UDP) for easy distribution to VLC or OBS.
- **HLS Protocol Optimization**: Configured low-latency HLS links for smoother real-time preview in browsers.

## 🐳 Infrastructure & Reliability

- **Docker Orchestration**: Added healthchecks to the PostgreSQL container and precise startup orders to ensure the backend always waits for the database.
- **Stability Fixes**: Resolved "White Screen" crashes in the Settings panel and improved general system uptime tracking.

---

_Generated by Antigravity_
