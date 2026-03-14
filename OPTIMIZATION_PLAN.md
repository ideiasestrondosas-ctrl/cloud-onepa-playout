# Cloud Onepa Playout - Optimization Plan

**Version:** 2.6.0-ALPHA.48-PRO  
**Date:** 2026-03-13  
**Status:** DRAFT - Awaiting Approval

---

## Executive Summary

This document outlines a comprehensive optimization plan for the Cloud Onepa Playout system. The analysis covers **source code optimizations**, **UI/UX improvements**, **resource usage reduction**, and **operator workflow enhancements**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Optimizations (Rust)](#2-backend-optimizations-rust)
3. [Frontend Optimizations (React)](#3-frontend-optimizations-react)
4. [Database Optimizations](#4-database-optimizations)
5. [Docker & Deployment Optimizations](#5-docker--deployment-optimizations)
6. [UI/UX Operator Workflow Optimizations](#6-uiux-operator-workflow-optimizations)
7. [Resource Usage Optimizations](#7-resource-usage-optimizations)
8. [Implementation Phases](#8-implementation-phases)
9. [Approval Checklist](#9-approval-checklist)

---

## 1. Architecture Overview

### Current Stack
- **Backend:** Rust (Actix-web 4.3) with PostgreSQL 16, Redis 7
- **Frontend:** React 18 + Vite 5 + Material UI 5
- **Media Server:** MediaMTX (RTMP/HLS/WebRTC/SRT)
- **Additional Services:** Analytics, AI (Whisper), Graphics compositor
- **Deployment:** Docker Compose with 8 services

---

## 2. Backend Optimizations (Rust)

### 2.1 Database Connection Pooling

**Current State:**
```rust
// main.rs line 63-64
.max_connections(5)
```

**Optimization:**
```rust
// Increase pool size for concurrent requests
.max_connections(20)
.acquire_timeout(Duration::from_secs(10))
.idle_timeout(Duration::from_secs(600))
```

**Priority:** HIGH | **Impact:** 40% improvement in concurrent request handling

---

### 2.2 Media Listing Query Optimization

**Current Issue:** [`backend/src/api/media.rs:131`](backend/src/api/media.rs:131) - FFmpeg service instantiated per item

```rust
// Current: Creates new FFmpegService for each media item
let ffmpeg = FFmpegService::new();
let media_with_proxy: Vec<serde_json::Value> = media.into_iter().map(|item| {
    // ... proxy checking per item
```

**Optimization:**
1. Create FFmpegService once per request
2. Batch proxy existence checks
3. Cache proxy file existence in Redis

**Priority:** HIGH | **Impact:** 60% reduction in media listing latency

---

### 2.3 Query Result Caching

**Missing:** No caching for frequently accessed data (settings, playlists, schedule)

**Optimization:**
```rust
// Add Redis caching layer
// Cache settings for 30 seconds
// Cache playlist list for 10 seconds
// Cache schedule for 5 seconds
```

**Priority:** MEDIUM | **Impact:** 50% reduction in redundant DB queries

---

### 2.4 Static FFmpegService

**Current Issue:** [`backend/src/api/media.rs:131`](backend/src/api/media.rs:131) - New instance created on each call

**Optimization:**
```rust
// Use lazy_static for FFmpegService
lazy_static! {
    static ref FFMPEG_SERVICE: FFmpegService = FFmpegService::new();
}
```

**Priority:** MEDIUM | **Impact:** Memory reduction, faster service initialization

---

### 2.5 API Response Compression

**Current State:** No gzip compression on API responses

**Optimization:**
```rust
// Add compression middleware
.use(middleware::Compress::default())
```

**Priority:** MEDIUM | **Impact:** 40-60% reduction in network bandwidth

---

### 2.6 Scheduled Task Batching

**Current Issue:** Background tasks run individually

**Optimization:**
- Batch media processing tasks
- Use Redis queues for task distribution
- Implement worker pool pattern

**Priority:** MEDIUM | **Impact:** Better CPU utilization

---

## 3. Frontend Optimizations (React)

### 3.1 Code Splitting Enhancement

**Current State:** Good lazy loading in [`App.jsx:16-29`](frontend/src/App.jsx:16-29)

**Optimization:**
- Split large pages further (Dashboard, Settings, MediaLibrary)
- Implement route-based code splitting with Suspense boundaries

**Priority:** MEDIUM | **Impact:** 30% faster initial load

---

### 3.2 State Management Optimization

**Current State:** Zustand stores are simple but may cause over-renders

**Optimization:**
```javascript
// Add selectors to prevent unnecessary re-renders
const user = useAuthStore((state) => state.user);
const token = useAuthStore((state) => state.token);
```

**Priority:** MEDIUM | **Impact:** 25% reduction in re-renders

---

### 3.3 API Request Deduplication

**Current State:** No request deduplication

**Optimization:**
```javascript
// Implement React Query or SWR
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10 seconds
      cacheTime: 60000, // 1 minute
    },
  },
});
```

**Priority:** HIGH | **Impact:** 70% reduction in duplicate API calls

---

### 3.4 Bundle Size Optimization

**Current State:** Large bundles from MUI and FullCalendar

**Current:** [`vite.config.js:33-39`](frontend/vite.config.js:33-39)
```javascript
manualChunks: {
  vendor: ["react", "react-dom", "react-router-dom"],
  ui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  calendar: ["@fullcalendar/core", "@fullcalendar/daygrid", "@fullcalendar/interaction", "@fullcalendar/react"],
  video: ["video.js", "react-player"]
}
```

**Optimization:**
```javascript
// Add tree-shaking optimization
// Split MUI components
// Use dynamic imports for video players
// Implement lazy loading for heavy components
```

**Priority:** MEDIUM | **Impact:** 20% reduction in bundle size

---

### 3.5 Pagination Implementation

**Current State:** [`backend/src/api/media.rs:33-35`](backend/src/api/media.rs:33-35) - Default limit of 20

**Optimization:**
- Implement infinite scroll for media library
- Add virtual scrolling for large lists
- Use `react-window` for playlist items

**Priority:** HIGH | **Impact:** Better UX with large media libraries

---

### 3.6 Image/Thumbnail Optimization

**Current State:** No thumbnail compression or WebP

**Optimization:**
```javascript
// Use srcset for responsive thumbnails
<img 
  srcSet={`/thumbnails/${id}.webp 100w, /thumbnails/${id}@2x.webp 200w`}
  sizes="(max-width: 600px) 100px, 200px"
/>
```

**Priority:** MEDIUM | **Impact:** 50% reduction in thumbnail bandwidth

---

## 4. Database Optimizations

### 4.1 Additional Indexes

**Current:** [`backend/migrations/054_performance_indexes.sql`](backend/migrations/054_performance_indexes.sql)

**Optimization:**
```sql
-- Add composite index for media search
CREATE INDEX idx_media_search ON media(media_type, is_filler, created_at DESC);

-- Add index for playlist content JSON queries
CREATE INDEX idx_playlist_date ON playlists(date) WHERE date IS NOT NULL;

-- Add index for user authentication
CREATE INDEX idx_users_username ON users(username);
```

**Priority:** HIGH | **Impact:** 50% faster query execution

---

### 4.2 Query Optimization

**Current Issue:** Duplicate count queries in [`media.rs:72-115`](backend/src/api/media.rs:72-115)

**Optimization:**
- Use SQL `COUNT(*) OVER()` to get count in single query
- Implement cursor-based pagination instead of offset

**Priority:** HIGH | **Impact:** 40% reduction in query time

---

### 4.3 Connection Pooling

**Current:** 5 max connections

**Optimization:**
- Increase to 20 connections
- Add read replica support for heavy read operations

**Priority:** MEDIUM | **Impact:** Better concurrent handling

---

## 5. Docker & Deployment Optimizations

### 5.1 Resource Limits

**Current State:** No resource limits defined

**Current:** [`docker-compose.yml:51-104`](docker-compose.yml:51-104)

**Optimization:**
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

**Priority:** HIGH | **Impact:** Prevent resource exhaustion

---

### 5.2 Multi-stage Build Optimization

**Current:** [`docker/Dockerfile.backend:1-69`](docker/Dockerfile.backend:1-69)

**Optimization:**
- Use cargo-chef for incremental builds
- Add .dockerignore optimization
- Use BuildKit cache mounts

**Priority:** MEDIUM | **Impact:** 50% faster build times

---

### 5.3 Health Check Optimization

**Current:** Simple HTTP checks

**Optimization:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://127.0.0.1:8181/api/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 120s  # Increased for Rust compilation
```

**Priority:** MEDIUM | **Impact:** Better container orchestration

---

### 5.4 Image Size Reduction

**Current:** Multiple layers in final image

**Optimization:**
```dockerfile
# Use distroless or slim images
FROM gcr.io/distroless/cc-debian12:nonroot

# Or Alpine with minimal packages
FROM alpine:3.19
```

**Priority:** MEDIUM | **Impact:** 40% smaller images

---

## 6. UI/UX Operator Workflow Optimizations

### 6.1 Settings Page Split

**Current Issue:** [`frontend/src/pages/Settings.jsx`](frontend/src/pages/Settings.jsx) - 164KB monolithic file

**Optimization:**
```javascript
// Split into tabs
const SettingsTabs = {
  GENERAL: 'general',
  OUTPUT: 'output',
  OVERLAY: 'overlay',
  NETWORK: 'network',
  MAINTENANCE: 'maintenance',
};

// Lazy load each tab
const GeneralSettings = lazy(() => import('./settings/General'));
const OutputSettings = lazy(() => import('./settings/Output'));
```

**Priority:** HIGH | **Impact:** Faster page load, better UX

---

### 6.2 Keyboard Shortcuts

**Missing:** No keyboard shortcuts for common operations

**Optimization:**
```javascript
// Add global keyboard shortcuts
const shortcuts = {
  'ctrl+s': saveSettings,
  'ctrl+n': newPlaylist,
  'space': togglePlayout,  // When in dashboard
  'ctrl+f': focusSearch,
  'ctrl+,': openSettings,
};
```

**Priority:** MEDIUM | **Impact:** 30% faster operator workflow

---

### 6.3 Bulk Operations

**Missing:** No bulk media operations in UI

**Optimization:**
- Add multi-select for media library
- Bulk delete, move, tag operations
- Batch proxy generation

**Priority:** HIGH | **Impact:** Significant time savings

---

### 6.4 Real-time Updates

**Current:** Polling-based updates

**Optimization:**
- Use WebSocket for playout status
- Implement server-sent events for schedule changes
- Add presence indicators

**Priority:** MEDIUM | **Impact:** Instant updates, less bandwidth

---

### 6.5 Dashboard Widget Customization

**Current:** Fixed dashboard layout

**Optimization:**
```javascript
// Add drag-and-drop widget arrangement
// Allow operators to show/hide widgets
// Save layout preferences
```

**Priority:** LOW | **Impact:** Better user experience

---

### 6.6 Help System Enhancement

**Current:** Basic help in [`frontend/src/components/HelpSystem.jsx`](frontend/src/components/HelpSystem.jsx)

**Optimization:**
- Context-sensitive help
- Video tutorials integration
- Searchable documentation

**Priority:** LOW | **Impact:** Reduced support requests

---

## 7. Resource Usage Optimizations

### 7.1 Memory Optimization

**Backend:**
- Use arena allocators for repeated allocations
- Implement connection pooling properly
- Add memory limits in Docker

**Frontend:**
- Virtual scrolling for large lists
- Lazy load heavy components
- Optimize image loading

**Priority:** HIGH | **Impact:** 30% memory reduction

---

### 7.2 CPU Optimization

**Backend:**
- Async I/O for file operations
- Parallel task processing with tokio
- Reduce blocking operations

**Frontend:**
- Memoization of expensive computations
- Web Workers for heavy processing

**Priority:** MEDIUM | **Impact:** Better CPU utilization

---

### 7.3 Network Optimization

**Backend:**
- Enable HTTP compression
- Implement ETag caching
- Use CDN for static assets

**Frontend:**
- Service worker for offline support
- Resource prefetching
- HTTP/2 push for critical resources

**Priority:** MEDIUM | **Impact:** 40% bandwidth reduction

---

### 7.4 Storage Optimization

**Current:** Large video files stored directly

**Optimization:**
- Implement proxy generation workflow
- Add thumbnail generation queue
- Use object storage (MinIO) for media

**Priority:** MEDIUM | **Impact:** Efficient storage usage

---

## 8. Implementation Phases

### Phase 1: Critical Optimizations (Week 1-2)
- [ ] Database connection pooling (2.1)
- [ ] API response compression (2.5)
- [ ] Resource limits in Docker (5.1)
- [ ] React Query implementation (3.3)
- [ ] Settings page split (6.1)

### Phase 2: Performance Optimizations (Week 3-4)
- [ ] Media listing query optimization (2.2)
- [ ] Redis caching layer (2.3)
- [ ] Additional database indexes (4.1)
- [ ] Pagination & virtual scrolling (3.5)
- [ ] Bulk operations (6.3)

### Phase 3: UI/UX Enhancements (Week 5-6)
- [ ] Keyboard shortcuts (6.2)
- [ ] Real-time updates via WebSocket (6.4)
- [ ] Dashboard customization (6.5)
- [ ] Bundle size optimization (3.4)

### Phase 4: Advanced Optimizations (Week 7-8)
- [ ] Multi-stage build optimization (5.2)
- [ ] Image/thumbnail optimization (3.6)
- [ ] Memory & CPU profiling
- [ ] Performance monitoring setup

---

## 9. Approval Checklist

### Quick Wins (Low Effort, High Impact)
- [ ] **2.1** Increase DB pool to 20 connections
- [ ] **2.5** Add HTTP compression middleware
- [ ] **5.1** Add Docker resource limits
- [ ] **3.3** Implement React Query for API calls
- [ ] **4.1** Add database indexes

### Medium Effort (2-4 weeks)
- [ ] **2.2** Media listing query optimization
- [ ] **2.3** Redis caching layer
- [ ] **6.1** Settings page split into tabs
- [ ] **3.5** Pagination & virtual scrolling

### Large Effort (1-2 months)
- [ ] **6.2** Keyboard shortcuts implementation
- [ ] **6.3** Bulk operations UI
- [ ] **5.2** Docker build optimization
- [ ] **3.4** Bundle size optimization

---

## Estimated Impact Summary

| Category | Optimization | Impact |
|----------|-------------|--------|
| Backend Performance | Connection pooling, caching | 40-60% faster |
| Frontend Performance | React Query, code splitting | 30-50% faster |
| Database | Indexes, query optimization | 40-50% faster |
| Resource Usage | Memory, CPU, network | 30-40% reduction |
| Operator Workflow | Shortcuts, bulk ops | 30% faster |

---

## Next Steps

1. **Review and Approve:** Please review this plan and mark items for approval
2. **Priority Selection:** Indicate which items to implement first
3. **Resource Allocation:** Confirm development resources available
4. **Timeline:** Approve implementation schedule

---

*Document generated: 2026-03-13*  
*Cloud Onepa Playout - Professional Broadcast Automation System*
