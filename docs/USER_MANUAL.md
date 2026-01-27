# ONEPA Playout PRO - User Manual

**Version:** 2.1.1-PRO  
**Release Date:** January 2026  
**Document Version:** 1.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Dashboard](#1-dashboard)
3. [Media Library](#2-media-library)
4. [Playlist Editor](#3-playlist-editor)
5. [Calendar & Scheduling](#4-calendar--scheduling)
6. [EPG (Electronic Program Guide)](#5-epg-electronic-program-guide)
7. [Graphics Editor](#6-graphics-editor)
8. [Templates](#7-templates)
9. [Settings](#8-settings)
10. [Additional Features](#9-additional-features)

---

## Introduction

ONEPA Playout PRO is a professional broadcast automation system designed for 24/7 television and streaming operations. This manual provides comprehensive guidance on using all features of the application.

### Key Features

- **24/7 Automated Playout** - Continuous broadcast automation
- **Multi-Protocol Streaming** - RTMP, SRT, HLS, UDP, and more
- **Advanced Scheduling** - Calendar-based program scheduling
- **EPG Generation** - Automatic electronic program guide creation
- **Graphics Overlay** - WYSIWYG logo and branding editor
- **Metadata Management** - Automatic metadata enrichment via TMDB/OMDB
- **Template System** - Reusable playlist templates

---

## 1. Dashboard

The Dashboard is your central command center, providing real-time monitoring of playout status, upcoming content, and system health.

### Main Interface

![Dashboard - Top Section](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/dashboard_main-1.png)

**Key Elements:**

1. **Playout Controls** (Top Right)
   - **INICIAR EMISSÃO** - Start broadcast playout
   - **PARAR EMISSÃO** - Stop broadcast playout
   - Status indicator shows current state (Playing/Stopped)

2. **Current Clip Section** (Clip Atual)
   - Displays currently playing content
   - Shows title, duration, and progress
   - Real-time playback indicator

![Dashboard - Middle Section](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/dashboard_main-2.png)

3. **Upcoming Clips Timeline** (Próximos Clips)
   - Visual timeline of scheduled content
   - Shows next 5-10 upcoming clips
   - Time-based horizontal layout
   - Color-coded by content type

4. **Protocol Status Cards**
   - **RTMP** - Real-Time Messaging Protocol status
   - **SRT** - Secure Reliable Transport status
   - **UDP** - User Datagram Protocol status
   - **HLS** - HTTP Live Streaming status
   - Each card shows:
     - Active/Inactive state
     - Connection URL
     - Copy button for quick access

![Dashboard - Bottom Section](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/dashboard_main-3.png)

5. **System Monitoring**
   - **CPU Usage** - Real-time processor utilization
   - **Memory Usage** - RAM consumption
   - **GPU Temperature** - Graphics card thermal status
   - **LUFS Meter** - Audio loudness monitoring

### Quick Actions

- Click **INICIAR EMISSÃO** to begin automated playout
- Monitor protocol status cards for streaming health
- Check upcoming timeline to verify schedule
- Use LUFS meter to ensure audio compliance

---

## 2. Media Library

The Media Library is your central repository for all broadcast content including videos, audio files, and images.

### Main Interface

![Media Library - Grid View](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/media_library_main.png)

**Key Features:**

1. **Folder Navigation** (Left Sidebar)
   - Hierarchical folder structure
   - Create custom folders for organization
   - Quick access to media categories

2. **Media Grid**
   - Thumbnail previews for all media
   - File information overlay
   - Duration and format indicators
   - Quick action buttons (Edit, Delete)

3. **Toolbar Actions**
   - **Upload** - Add new media files
   - **Create Folder** - Organize content
   - **Search** - Find media by name or metadata
   - **Filter** - By type (Video/Audio/Image)

### Metadata Management

#### EPG Metadata Editor

![Metadata Editor - Part 1](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/media_library_edit_metadados_EPG-1.png)

The metadata editor allows you to enrich your content with detailed information for EPG generation:

**Basic Information:**

- **Title** - Content title for EPG display
- **Description** - Detailed synopsis
- **Genre** - Content category (Movie, Series, Documentary, etc.)
- **Year** - Production year
- **Rating** - Content rating (G, PG, PG-13, R, etc.)

![Metadata Editor - Part 2](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/media_library_edit_metadados_EPG-2.png)

**Extended Metadata:**

- **Director** - Director name(s)
- **Cast** - Main actors/performers
- **Duration** - Runtime
- **Language** - Audio language
- **Subtitles** - Available subtitle tracks

#### Automatic Metadata Enrichment

![Auto Metadata Review - Part 1](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/media_library_edit_revisar_metadados_automatico-1.png)

ONEPA Playout PRO can automatically fetch metadata from online databases (TMDB, OMDB):

1. Click **"Revisar Metadados Automático"** button
2. System searches for matching content
3. Review suggested metadata

![Auto Metadata Review - Part 2](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/media_library_edit_revisar_metadados_automatico-2.png)

4. **Accept** or **Reject** suggested data
5. Manual override available for all fields
6. Bulk metadata import for series/collections

### Best Practices

- Organize media into logical folders (Movies, Series, Commercials, etc.)
- Always add metadata for EPG-enabled content
- Use consistent naming conventions
- Verify metadata accuracy before scheduling

---

## 3. Playlist Editor

The Playlist Editor is where you create and manage 24-hour broadcast schedules.

### Main Interface

![Playlist Editor](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/playlists_editor_main.png)

**Layout Components:**

1. **Playlist Library** (Left Sidebar)
   - List of saved playlists
   - Quick load/switch between playlists
   - Create new playlist button
   - Delete playlist option

2. **Playlist Details** (Top Section)
   - **Playlist Name** - Editable title
   - **Broadcast Date** - Target air date
   - **Duration Progress** - Visual 24-hour completion bar
   - **Total Duration** - Current playlist length

3. **Clip Sequence Grid** (Main Area)
   - Drag-and-drop clip ordering
   - Individual clip cards showing:
     - Filename
     - Start time
     - End time
     - Duration
     - Filler flag (if applicable)
   - Multi-select for bulk operations
   - Remove clip button

4. **Action Toolbar**
   - **ADICIONAR CLIP** - Add media to playlist
   - **AUTOMAÇÃO** - Auto-fill 24 hours
   - **NOVA PLAYLIST** - Create new playlist
   - **SALVAR** - Save changes

### Creating a Playlist

1. Click **"NOVA PLAYLIST"** button
2. Enter playlist name and date
3. Click **"ADICIONAR CLIP"** to add media
4. Drag clips to reorder sequence
5. Monitor 24-hour progress bar
6. Click **"SALVAR"** when complete

### Automation Features

The **AUTOMAÇÃO** button provides intelligent playlist filling:

- **Random Mode** - Randomly select media to fill time
- **Sequential Mode** - Add media in order
- **Loop Mode** - Repeat existing clips
- **Folder Selection** - Choose specific media folder
- **Filler-Only** - Use only filler content

### Validation

- **Green Progress Bar** - 24 hours complete ✅
- **Yellow Warning** - Incomplete playlist ⚠️
- **Clip Timing** - Automatic start/end time calculation
- **Duration Display** - Real-time total duration

---

## 4. Calendar & Scheduling

The Calendar module enables advanced scheduling of playlists across days, weeks, and months.

### Month View

![Calendar - Month View](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/calendar_month_view.png)

**Features:**

1. **Calendar Grid**
   - Monthly overview of scheduled content
   - Color-coded event blocks
   - Multi-day event support
   - Repeat event indicators ("R" marker)

2. **Event Cards**
   - Each scheduled playlist appears as a card
   - Shows playlist name and time
   - Click to view/edit details
   - Drag to reschedule (if enabled)

3. **Navigation**
   - **Previous/Next Month** arrows
   - **Today** button for quick return
   - **Month/Week/Day** view toggle

### Scheduling Events

1. Click on any date in the calendar
2. Select playlist from dropdown
3. Set start time
4. Configure repeat options:
   - **None** - Single occurrence
   - **Daily** - Every day
   - **Weekly** - Same day each week
   - **Monthly** - Same date each month
5. Click **"Agendar"** to confirm

### Repeat Events

Events marked with **"R"** indicator are recurring:

- Automatically create future instances
- Edit single occurrence or all occurrences
- Delete single or series

---

## 5. EPG (Electronic Program Guide)

The EPG module provides a visual timeline of scheduled programming, similar to traditional TV guides.

### Timeline View

![EPG Timeline](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/epg_timeline_main.png)

**Interface Elements:**

1. **Date Selector** (Top)
   - Choose specific date to view
   - Navigate between days
   - Today quick-jump button

2. **Timeline Ruler**
   - 24-hour horizontal timeline (00:00 - 24:00)
   - Hour markers every 1-2 hours
   - Current time indicator (red line)

3. **Program Blocks**
   - Each scheduled item appears as a block
   - Block width = duration
   - Shows title and time
   - Color-coded by content type

### Program Information

#### Clip Information Dialog

![EPG Clip Information](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/epg_timeline_information_clip.png)

Click any program block to view basic information:

- **Title** - Content name
- **Start Time** - Scheduled start
- **End Time** - Scheduled end
- **Duration** - Total runtime
- **Media Type** - Video/Audio/Image

#### Detailed Schedule Information

![EPG Detailed Information](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/epg_timeline_information_detail_of_schedule_and_clip.png)

Extended details include:

- **Full Metadata** - Description, genre, year, rating
- **Cast & Crew** - Director, actors
- **Technical Info** - Resolution, codec, bitrate
- **Playlist Source** - Which playlist scheduled this item
- **Repeat Information** - If part of recurring schedule

### EPG Export

- Generate XML EPG for external systems
- Compatible with XMLTV format
- Configurable time range (1-30 days)
- Automatic metadata inclusion

---

## 6. Graphics Editor

The Graphics Editor is a WYSIWYG (What You See Is What You Get) tool for positioning channel logos and overlays.

### Main Interface

![Graphics Editor](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/graphics_editor_main.png)

**Key Components:**

1. **16:9 Preview Window** (Center)
   - Real-time preview of logo placement
   - Simulated TV screen
   - Drag-and-drop logo positioning
   - Visual feedback during adjustments

2. **Anchor Point Selection** (Top Right)
   - **Top-Left** - Logo anchors to top-left corner
   - **Top-Right** - Logo anchors to top-right corner
   - **Bottom-Left** - Logo anchors to bottom-left corner
   - **Bottom-Right** - Logo anchors to bottom-right corner
   - Ensures consistent placement across resolutions

3. **Position Controls**
   - **X Offset** - Horizontal fine-tuning (0-100)
   - **Y Offset** - Vertical fine-tuning (0-100)
   - Pixel-perfect positioning

4. **Appearance Controls**
   - **Scale** - Logo size (0-300%)
   - **Opacity** - Transparency (0-100%)
   - Real-time preview updates

### Using the Graphics Editor

1. **Select Anchor Point** - Choose corner for logo placement
2. **Drag Logo** - Click and drag logo in preview window
3. **Fine-Tune Position** - Use X/Y sliders for precision
4. **Adjust Size** - Use Scale slider (100% = original size)
5. **Set Transparency** - Use Opacity slider (100% = fully opaque)
6. **Save Settings** - Click **"SALVAR CONFIGURAÇÕES"**

### Best Practices

- Use **Top-Right** or **Bottom-Right** for traditional logo placement
- Keep opacity at 80-100% for visibility
- Scale between 15-25% for most logos
- Test on actual broadcast output before finalizing

---

## 7. Templates

The Templates module allows you to create reusable playlist configurations for common broadcast scenarios.

### Main Interface

![Templates Grid](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/templates_main.png)

**Features:**

1. **Template Cards**
   - Visual preview of template structure
   - Template name and description
   - Quick action buttons:
     - **Edit** - Modify template
     - **Delete** - Remove template
     - **Use** - Apply to new playlist

2. **Preset Templates**
   - **24h Filmes** - 24-hour movie marathon
   - **Programação Mista** - Mixed programming
   - **Séries Contínuas** - Continuous series playback
   - **Comercial Heavy** - Ad-heavy schedule

3. **Create New Template**
   - Click **"+ NOVO TEMPLATE"** button
   - Define template structure
   - Save for reuse

### Using Templates

1. Select a template from the grid
2. Click **"Usar Template"** button
3. System creates new playlist based on template
4. Customize as needed
5. Save as new playlist

### Template Benefits

- **Consistency** - Maintain broadcast standards
- **Efficiency** - Quick playlist creation
- **Reusability** - Apply proven structures
- **Flexibility** - Customize after application

---

## 8. Settings

The Settings module provides comprehensive configuration for all aspects of ONEPA Playout PRO.

### Tab 1: EMISSÃO & SAÍDA (Output Settings)

![Settings - Output Tab Part 1](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab1_output-1.png)

**Output Configuration:**

1. **Output Type Selection**
   - RTMP - For streaming servers (YouTube, Facebook, etc.)
   - HLS - For HTTP Live Streaming
   - SRT - For secure, low-latency streaming
   - UDP - For IPTV and multicast
   - Desktop - For local preview

2. **Resolution Presets**
   - **720p** - 1280x720, 2500k bitrate
   - **1080p** - 1920x1080, 5000k bitrate
   - **4K** - 3840x2160, 15000k bitrate
   - **Custom** - Manual configuration

![Settings - Output Tab Part 2](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab1_output-2.png)

3. **Video Settings**
   - **Codec** - H.264, H.265, VP9, Copy
   - **Bitrate** - Video quality (kbps)
   - **FPS** - Frame rate (23.976, 25, 29.97, 30, 50, 60)

4. **Audio Settings**
   - **Codec** - AAC, MP3, AC3, Copy
   - **Bitrate** - Audio quality (128k, 192k, 256k, 320k)

5. **Display URLs**
   - Copyable URLs for each protocol
   - Automatically updated based on settings
   - Click copy icon for quick access

### Tab 2: CAMINHOS & MEDIA (Paths & Media)

![Settings - Paths Tab Part 1](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab2_paths-1.png)

**Directory Configuration:**

1. **Media Paths**
   - **Media Library** - Main content storage
   - **Thumbnails** - Generated preview images
   - **Playlists** - Saved playlist files
   - **Fillers** - Filler content directory

2. **Channel Branding**
   - **Logo Upload** - Channel logo file
   - **Logo Position** - Placement on screen
   - **Channel Name** - Displayed in EPG

![Settings - Paths Tab Part 2](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab2_paths-2.png)

3. **Default Media**
   - **Default Image** - Shown when no video available
   - **Default Video** - Filler content
   - **Protected Assets** - System-level media

4. **Protected Folder**
   - System logos and assets
   - Read-only content
   - Backup important files here

### Tab 3: PLAYOUT & PRESETS (Playout Settings)

![Settings - Playout Tab](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab3_playout.png)

**Playout Configuration:**

1. **Broadcast Day**
   - **Day Start Time** - When broadcast day begins (e.g., 06:00)
   - Affects playlist scheduling and EPG generation

2. **Overlay Settings**
   - **Enable Overlay** - Toggle logo display
   - **Opacity** - Logo transparency (0-100%)
   - **Scale** - Logo size (0-300%)

3. **Protocol Management**
   - **RTMP** - Enable/Disable + URL
   - **SRT** - Enable/Disable + URL + Mode (Caller/Listener)
   - **UDP** - Enable/Disable + URL + Mode (Multicast/Unicast)
   - **HLS** - Enable/Disable
   - **DASH, MSS, RIST, RTSP, WebRTC, LL-HLS** - Advanced protocols

4. **Auto-Start**
   - **Auto-Start Protocols** - Start streaming on playout start
   - Checkbox to enable/disable

### Tab 4: UTILIZADORES (Users)

![Settings - Users Tab](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab4_users.png)

**User Management:**

1. **User List**
   - All system users displayed
   - Username and role shown
   - Edit/Delete actions

2. **Add New User**
   - Click **"+ ADICIONAR UTILIZADOR"**
   - Enter username
   - Set password
   - Assign role (Admin/Operator/Viewer)

3. **User Roles**
   - **Admin** - Full system access
   - **Operator** - Playout and scheduling
   - **Viewer** - Read-only access

4. **Change Password**
   - Click user's edit button
   - Enter new password
   - Confirm password
   - Save changes

### Tab 5: SOBRE O SISTEMA (About System)

![Settings - System Tab](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_tab5_version_system.png)

**System Information:**

1. **Version Details**
   - **System Version** - Current software version
   - **Release Date** - Build date
   - **License** - License type

2. **API Keys**
   - **TMDB API Key** - The Movie Database integration
   - **OMDB API Key** - Open Movie Database integration
   - **TVMaze API Key** - TV show metadata
   - Required for automatic metadata enrichment

3. **EPG Configuration**
   - **EPG Days** - Number of days to generate (1-30)
   - More days = larger EPG file

4. **Documentation**
   - Links to user manual
   - API documentation
   - Support resources

---

## 9. Additional Features

### Release Notes

![Release Notes](file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/screenshots/settings_notas_de_lancamento.png)

Access release notes from the Settings page to view:

- New features in current version
- Bug fixes and improvements
- Known issues
- Upgrade instructions

### Keyboard Shortcuts

| Shortcut | Action                |
| -------- | --------------------- |
| `Space`  | Play/Pause playout    |
| `Ctrl+S` | Save current playlist |
| `Ctrl+N` | New playlist          |
| `Ctrl+O` | Open playlist         |
| `Delete` | Remove selected clip  |
| `Ctrl+Z` | Undo                  |
| `Ctrl+Y` | Redo                  |

### System Requirements

**Minimum:**

- CPU: Intel i5 or AMD Ryzen 5
- RAM: 8 GB
- GPU: Integrated graphics
- Storage: 100 GB SSD
- Network: 100 Mbps

**Recommended:**

- CPU: Intel i7 or AMD Ryzen 7
- RAM: 16 GB
- GPU: Dedicated GPU (NVIDIA/AMD)
- Storage: 500 GB NVMe SSD
- Network: 1 Gbps

---

## Support & Resources

### Getting Help

- **Documentation**: `/docs` folder in installation directory
- **Community Forum**: [Link to forum]
- **Email Support**: support@onepa.tv
- **Emergency Hotline**: [Phone number]

### Troubleshooting

**Playout won't start:**

1. Check media paths in Settings
2. Verify playlist has content
3. Check protocol URLs are correct
4. Review system logs

**Black screen in UI:**

1. Force refresh browser (Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Restart frontend container

**Streaming issues:**

1. Verify protocol is enabled in Settings
2. Check output URL is correct
3. Test network connectivity
4. Review FFmpeg logs

### Best Practices

1. **Regular Backups** - Backup playlists and settings weekly
2. **Metadata Maintenance** - Keep metadata up-to-date
3. **Monitor Resources** - Watch CPU/RAM usage
4. **Test Before Live** - Always test new configurations
5. **Update Regularly** - Install updates during off-hours

---

## Appendix

### Glossary

- **EPG** - Electronic Program Guide
- **RTMP** - Real-Time Messaging Protocol
- **SRT** - Secure Reliable Transport
- **HLS** - HTTP Live Streaming
- **UDP** - User Datagram Protocol
- **LUFS** - Loudness Units relative to Full Scale
- **Filler** - Content used to fill gaps in schedule
- **Template** - Reusable playlist configuration

### File Formats Supported

**Video:**

- MP4 (H.264, H.265)
- MKV
- AVI
- MOV
- WebM

**Audio:**

- MP3
- AAC
- WAV
- FLAC
- OGG

**Images:**

- PNG
- JPEG
- GIF
- BMP
- WebP

---

**Document End**

_For technical support, please contact: support@onepa.tv_  
_© 2026 ONEPA Playout PRO. All rights reserved._
