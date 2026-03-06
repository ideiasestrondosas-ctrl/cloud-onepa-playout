# Cloud Onepa Alpha — Application Feature Documentation

> **Version**: Alpha  
> **Audience**: Developers, operators, and on-boarding team members  
> **Last Updated**: 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Navigation & Layout](#navigation--layout)
4. [Dashboard (Painel)](#1-dashboard-painel)
5. [Media Library (Biblioteca de Mídia)](#2-media-library-biblioteca-de-mídia)
6. [Playlist Editor](#3-playlist-editor)
7. [EPG View (Grade de Programação)](#4-epg-view-grade-de-programação)
8. [Settings (Configurações)](#5-settings-configurações)
9. [Cross-Cutting Features](#cross-cutting-features)

---

## Overview

Cloud Onepa Alpha is a **broadcast playout management system** built as a full-stack web application. It enables operators to:

- Upload and manage a media library (video/audio files)
- Build daily broadcast playlists from those files
- Visualize programming as an interactive EPG (Electronic Program Guide) timeline
- Control and monitor a live FFmpeg-based playout engine
- Configure the system, including output streams, metadata enrichment, and localization

The frontend is a React SPA (Material UI, dark-themed "neon" aesthetic). The backend is a Rust/Axum API server that manages media storage, playlist persistence, and FFmpeg playout.

---

## Architecture Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Material UI, React Router, react-i18next, dnd-kit |
| Backend | Rust (Axum), SQLite (via Diesel/rusqlite) |
| Playout | FFmpeg (spawned as child process by the Rust backend) |
| State Management | React Context (NotificationContext), local component state |
| Internationalization | i18next — supports PT, EN, ES, FR |

---

## Navigation & Layout

The application uses a persistent **sidebar + top header** layout:

- **Sidebar**: Icon-based navigation to each major section. Includes a logo/brand area at the top and a settings shortcut at the bottom.
- **Top Header**: Displays user/system info and global actions.
- **Notification System**: A global snackbar-based notification system (`NotificationContext`) shows success, error, and warning toasts throughout the app.

---

## 1. Dashboard (Painel)

The Dashboard is the **operational home screen** for broadcast operators. It provides a real-time overview of system status and stream health.

### 1.1 System Status Cards

Four quick-stat cards display:

| Card | Description |
|---|---|
| **Uptime** | How long the playout engine has been running |
| **Active Streams** | Number of currently active output streams |
| **Media Files** | Total number of media files in the library |
| **Total Playlists** | Total number of playlists in the database |

### 1.2 Now Playing

Displays the currently playing clip:
- **Clip title** (from metadata or filename)
- **Progress bar** showing elapsed / total time
- **Filler indicator**: a badge to mark if the current item is a filler clip

### 1.3 Stream Health Monitor

Shows the health status of each configured output stream:
- Stream name and format
- **Status chip**: `ONLINE` (green/primary) or `OFFLINE` (red/error)
- Bitrate warning indicators

### 1.4 Playout Controls

Operator controls for the broadcast engine:
- **Start Playout** button
- **Stop Playout** button
- Status feedback via notifications

### 1.5 Upcoming Programming

A preview list of the next clips in the active playlist:
- Filename (or metadata title)
- Scheduled start time
- Duration

### 1.6 Auto-Refresh

The dashboard polls the backend periodically to keep all metrics and now-playing data current without manual page refreshes.

---

## 2. Media Library (Biblioteca de Mídia)

The Media Library is the **asset management hub** for all video and audio content.

### 2.1 Folder System

Media is organized into a two-level folder hierarchy:
- A **root** level (all media)
- User-created **folders** for logical grouping (e.g., by category, show, or date)

**Folder operations:**
- Create a new folder (dialog with name input)
- Delete a folder (with confirmation)
- Navigate into a folder to filter the file list

### 2.2 File Upload

- Drag-and-drop upload zone **or** click-to-browse file picker
- Supports **multiple file upload** in a single operation
- Shows a **real-time progress indicator** per file during upload
- Files are uploaded to the currently active folder
- Accepts video and audio media types

### 2.3 Media Grid

Media files are displayed as a responsive **card grid**:

Each card shows:
- A thumbnail (if available from metadata) or a type icon (video/audio)
- **Filename**
- **Duration** (formatted as `HH:MM:SS`)
- **Filler badge** (if the file is marked as programmatic filler)
- **Metadata enrichment badge** (if the file has enriched metadata)
- Action buttons: Metadata, Edit, Delete

#### Search & Filter
- **Search box**: filters by filename in real-time
- **Filler filter**: toggle to show only filler files or all files
- **Folder filter**: files are pre-filtered by the selected folder in the sidebar

### 2.4 Metadata Enrichment

Each media file can have rich metadata. Triggering **metadata enrichment** (via the metadata button on the card):

1. The backend queries external data sources (TMDB or similar) based on the filename
2. Returned metadata is stored: title, description, director, genre/tags, rating, year, poster URL, source service, source URL
3. The card updates to show the enriched metadata badge

Metadata enrichment can also be triggered in **bulk** for multiple selected files.

### 2.5 Edit Media

A dialog allows editing:
- **Filename** (display name)
- **Is Filler** toggle: marks the file as fill content used by the automation engine
- **Target Folder**: move the file to a different folder

### 2.6 Delete Media

- Single-file delete (with confirmation dialog)
- **Bulk delete**: select multiple cards and delete all at once
- If a file is referenced in an active or saved playlist, a conflict error is shown

### 2.7 Selection & Bulk Actions

- **Checkbox** on each card allows multi-selection
- Counter badge shows how many files are selected
- Bulk actions: delete selected, enrich metadata for selected

---

## 3. Playlist Editor

The Playlist Editor is the **scheduling tool** for building daily broadcast playlists.

### 3.1 Sidebar — Two-Tab Panel

The left panel has two tabs:

#### Media Tab
- Lists all available media files from the library
- **Folder filter** dropdown to show files from a specific folder
- **Filler filter** to include/exclude filler files
- One-click to add a single file to the playlist
- **Add All from Folder** button: adds all files that match the current filter in a single action

#### Playlists Tab
- Lists all saved playlists
- Click a playlist to **load it** into the editor
- **Delete** a playlist (with confirmation; returns a conflict error if the playlist is active in playout)

### 3.2 Playlist Editor Canvas

The central panel displays the current playlist as an ordered list of clips.

Each clip item shows:
- **Drag handle** for reordering
- **Checkbox** for multi-select
- Filename
- `start_time` chip (auto-calculated)
- Duration
- **Filler badge** (if applicable)
- **Remove** button (delete from playlist)

**Clip ordering**: Clips can be reordered via **drag-and-drop** (powered by dnd-kit). Timings (start/end times) are automatically recalculated on every reorder.

### 3.3 Playlist Metadata

At the top of the canvas:
- **Playlist name** text field
- **Date** selector: the broadcast date for this playlist

### 3.4 Undo / Redo History

The editor maintains a **50-step undo/redo history** for all clip operations:
- Keyboard shortcuts: `Ctrl+Z` / `Cmd+Z` (undo), `Ctrl+Shift+Z` / `Ctrl+Y` (redo)

### 3.5 Duration Meter

A **progress bar** displays the current total playlist duration vs. the 24-hour target. Lets operators quickly see how much time is filled.

### 3.6 Validation

The playlist is automatically validated against the backend after every change. Validation checks:
- Missing or invalid source files
- Duration/timing consistency

A validation badge (✓ valid / ⚠ warning) is shown in the header area.

### 3.7 Automation Engine

The **Automation** dialog fills remaining time gaps automatically:

| Mode | Behavior |
|---|---|
| **Random** | Picks files randomly from the selected folder |
| **Sequential** | Picks files in file listing order |
| **Loop** | Repeats the existing clips in the playlist |

Options:
- **Target folder** selection (including root = all files)
- **Use Fillers Only** toggle: restrict the automation pool to filler-tagged files

The engine calculates the current duration gap (target 24h minus current total) and fills it with clips up to the gap, providing a count of added clips.

### 3.8 Save

- **Create**: opens a name dialog, saves the playlist with current clips and date
- **Update**: saves changes back to the existing playlist
- Saving is disabled if the playlist is empty

### 3.9 Bulk Clip Management

- **Select All / Deselect All** checkboxes
- **Delete Selected** button (shown when at least one clip is selected): removes all selected clips with a confirmation prompt

---

## 4. EPG View (Grade de Programação)

The EPG View is a **horizontal timeline visualization** of all playlists for a given day.

### 4.1 Date Navigation

- **Previous / Next** day buttons
- **Today** button to jump to the current date
- Current date shown as a readable chip (e.g., "MONDAY, JULY 7TH")

### 4.2 Timeline Layout

- A **24-hour horizontal timeline** with hour markers (00:00 → 23:00)
- Each saved **playlist appears as a row**, labeled on the sticky left column with:
  - Playlist name
  - Total duration (e.g., `22.4H`)
- Clips within each playlist are rendered as **blocks** on the timeline, positioned and sized proportionally to their duration

### 4.3 Clip Blocks

- Normal (non-filler) clips: cyan/neon gradient block
- Filler clips: subtle low-opacity block
- **Hover**: block scales up slightly and transitions to brighter border
- **Tooltip on hover**: shows clip title, time range, duration, and enriched metadata fields (description, director, genre, rating)

### 4.4 Current Time Indicator

When viewing **today**, a glowing vertical line (primary color) marks the current real-time position, auto-scrolling the timeline to be centered near the current time on load.

### 4.5 Drag-to-Scroll

The timeline is draggable: click and drag horizontally to scroll through the full 24-hour timeline.

### 4.6 Item Detail Dialog

Clicking any clip opens a **detail dialog** showing:
- Poster image (from metadata) or placeholder
- Title, rating chip, media type, year
- Emission time block (start → end time)
- Full description text
- Director, category/genre
- Data source attribution + external source link (if available)

Metadata is fetched live from the backend on dialog open (using the media's database ID).

---

## 5. Settings (Configurações)

The Settings page is organized into **tabs** for different configuration domains.

### 5.1 General Settings

- **Language selector**: switches the UI language between PT, EN, ES, FR (persisted via i18n)
- System-level toggles (e.g., auto-start playout on boot)

### 5.2 Playout Settings

Configuration for the FFmpeg playout engine:
- **Playlist mode**: how playlists are selected/advanced (e.g., daily rotation)
- **Loop/repeat** behavior when a playlist ends
- FFmpeg path override

### 5.3 Stream Configuration

Configure one or more output streams. Per stream:
- **Stream name**
- **Output URL** (RTMP, SRT, or file path)
- **Format / codec** settings
- **Bitrate** target
- Enable/disable toggle

Multiple streams can be configured for simultaneous broadcast to different destinations.

### 5.4 Metadata Enrichment Settings

- **API key** for metadata providers (TMDB or similar)
- **Auto-enrich on upload** toggle: automatically attempt metadata enrichment when new files are uploaded
- Language preference for metadata responses

### 5.5 About

System information panel:
- Application name and version
- Backend version / build info
- **Version history / changelog** entries

---

## Cross-Cutting Features

### Internationalization (i18n)

All user-facing strings are externalized via react-i18next. Supported languages:

| Code | Language |
|---|---|
| `pt` | Portuguese (BR) |
| `en` | English |
| `es` | Spanish |
| `fr` | French |

The date-fns locale is also switched alongside the UI language for correctly formatted dates in the EPG view.

### Notification System

A global `NotificationContext` provides:
- `showSuccess(msg)` — green success toast
- `showError(msg)` — red error toast
- `showWarning(msg)` — orange warning toast

Notifications are transient (auto-dismiss) and stack if multiple are triggered in sequence.

### Theme & Visual Design

- **Dark mode** only; background: near-black (`#0a0b10`)
- **Primary color**: cyan/neon `#00e5ff`
- **Glass panels**: semi-transparent frosted panels (`glass-panel` class)
- **Neon text**: primary color drop-shadow glow on headings (`neon-text` class)
- Micro-animations on cards, buttons (hover glow, scale)

### API Layer

All backend communication goes through a centralized `src/services/api.js` module exposing:

| API Namespace | Operation |
|---|---|
| `mediaAPI` | `list`, `get`, `upload`, `update`, `delete`, `enrich`, `listFolders`, `createFolder`, `deleteFolder` |
| `playlistAPI` | `list`, `create`, `update`, `delete`, `validate` |
| `playoutAPI` | `start`, `stop`, `status` |
| `settingsAPI` | `get`, `update` |

Errors from the API surface as user-visible toasts via the notification system.
