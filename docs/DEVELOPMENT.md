# Cloud Onepa Playout - Development Guide

## 🛠️ Development Environment Setup

### Prerequisites

- **Rust**: 1.75+ (`rustup install stable`)
- **Node.js**: 18+ (`nvm install 18`)
- **PostgreSQL**: 16+ (local or Docker)
- **FFmpeg**: 7.2+ (`brew install ffmpeg` or `apt install ffmpeg`)
- **Git**: For version control

### Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/onepa/cloud-onepa-playout.git
cd cloud-onepa-playout

# Setup backend
cd backend
cp .env.example .env
cargo build

# Setup frontend
cd ../frontend
npm install
```

---

## 🏗️ Project Structure

```
cloud-onepa-playout/
├── backend/                 # Rust API
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── api/            # API endpoints
│   │   │   ├── auth.rs
│   │   │   ├── media.rs
│   │   │   ├── playlists.rs
│   │   │   ├── schedule.rs
│   │   │   └── playout.rs
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   │   └── ffmpeg.rs
│   │   ├── utils/          # Utilities
│   │   │   ├── jwt.rs
│   │   │   ├── errors.rs
│   │   │   └── middleware.rs
│   │   └── config/         # Configuration
│   ├── migrations/         # SQL migrations
│   └── Cargo.toml
│
├── frontend/               # React App
│   ├── src/
│   │   ├── main.jsx       # Entry point
│   │   ├── App.jsx        # Main app
│   │   ├── components/    # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── VideoPreview.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MediaLibrary.jsx
│   │   │   ├── PlaylistEditor.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Templates.jsx
│   │   │   └── Login.jsx
│   │   ├── services/      # API client
│   │   │   └── api.js
│   │   ├── stores/        # State management
│   │   │   └── authStore.js
│   │   └── contexts/      # React contexts
│   │       └── NotificationContext.jsx
│   └── package.json
│
├── docker/                # Docker configs
├── docs/                  # Documentation
└── docker-compose.yml
```

---

## 🔧 Development

### Backend (Rust)

```bash
cd backend

# Development with hot-reload
cargo watch -x run

# Build
cargo build

# Tests
cargo test

# Lint
cargo clippy

# Format
cargo fmt
```

### Frontend (React)

```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview build
npm run preview
```

### Database

```bash
# Run migrations
cd backend
sqlx migrate run

# Create new migration
sqlx migrate add create_new_table

# Revert last migration
sqlx migrate revert
```

---

## 📝 Coding Conventions

### Rust

**Naming:**

- `snake_case` for functions and variables
- `PascalCase` for structs and enums
- `SCREAMING_SNAKE_CASE` for constants

**Example:**

```rust
const MAX_FILE_SIZE: usize = 2_000_000_000;

pub struct MediaInfo {
    pub duration: Option<f64>,
    pub width: Option<i32>,
}

pub async fn get_media_info(file_path: &str) -> Result<MediaInfo, String> {
    // ...
}
```

**Error Handling:**

```rust
// Use Result for recoverable errors
fn process_file(path: &str) -> Result<(), AppError> {
    // ...
}

// Use ? operator
let info = ffmpeg.get_media_info(path)?;
```

### JavaScript/React

**Naming:**

- `camelCase` for variables and functions
- `PascalCase` for components
- `SCREAMING_SNAKE_CASE` for constants

**Example:**

```javascript
const MAX_UPLOAD_SIZE = 2000000000;

function formatDuration(seconds) {
  // ...
}

export default function MediaLibrary() {
  // ...
}
```

**Hooks:**

```javascript
// useState
const [loading, setLoading] = useState(false);

// useEffect
useEffect(() => {
  fetchData();
}, [dependency]);

// Custom hooks
function useNotification() {
  // ...
}
```

---

## 🧪 Testing

### Backend Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffmpeg_service_creation() {
        let service = FFmpegService::new();
        assert!(!service.ffmpeg_path.is_empty());
    }

    #[tokio::test]
    async fn test_get_media_info() {
        let service = FFmpegService::new();
        let result = service.get_media_info("test.mp4").await;
        assert!(result.is_ok());
    }
}
```

### Frontend Tests (TODO)

```javascript
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

test("renders dashboard title", () => {
  render(<Dashboard />);
  const title = screen.getByText(/Dashboard/i);
  expect(title).toBeInTheDocument();
});
```

---

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Register user

### Media

- `GET /api/media` - List media (pagination)
- `GET /api/media/{id}` - Get media by ID
- `POST /api/media/upload` - File upload
- `DELETE /api/media/{id}` - Delete media

### Playlists

- `GET /api/playlists` - List playlists
- `GET /api/playlists/{id}` - Get playlist
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/{id}` - Update playlist
- `DELETE /api/playlists/{id}` - Delete playlist
- `POST /api/playlists/validate` - Validate duration

### Schedule

- `GET /api/schedule` - List schedules
- `GET /api/schedule?light=true` - List schedules (light response, without playlist_content)
- `POST /api/schedule` - Create schedule
- `DELETE /api/schedule/{id}` - Delete schedule
- `GET /api/schedule/for-date` - Get playlist for date

### Playout

- `GET /api/playout/status` - Playout status
- `POST /api/playout/start` - Start playout
- `POST /api/playout/stop` - Stop playout
- `POST /api/playout/skip` - Skip to next clip
- `POST /api/playout/pause` - Pause playout
- `POST /api/playout/resume` - Resume playout

---

## 🐛 Debugging

### Backend

```bash
# Detailed logs
RUST_LOG=debug cargo run

# Backtrace on panics
RUST_BACKTRACE=1 cargo run

# Debug with lldb
rust-lldb target/debug/onepa-playout
```

### Frontend

```javascript
// Console logs
console.log("Data:", data);

// React DevTools
// Install browser extension

// Network tab
// Check requests in DevTools
```

---

## 📦 Main Dependencies

### Backend (Rust)

- `actix-web` - Web framework
- `sqlx` - Database driver (PostgreSQL)
- `tokio` - Async runtime
- `serde` - Serialization
- `jsonwebtoken` - JWT
- `bcrypt` - Password hashing
- `ffmpeg-next` - FFmpeg bindings

### Frontend (React)

- `react` - UI library
- `react-router-dom` - Routing
- `@mui/material` - UI components
- `axios` - HTTP client
- `zustand` - State management
- `@dnd-kit` - Drag and drop
- `@fullcalendar` - Calendar
- `video.js` - Video player
- `react-dropzone` - File upload

---

## 🚀 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/new-feature
```

### 2. Develop

```bash
# Backend
cd backend
cargo watch -x run

# Frontend (new terminal)
cd frontend
npm run dev
```

### 3. Test

```bash
# Backend tests
cargo test

# Frontend (manual testing)
# Access http://localhost:5173
```

### 4. Commit

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and PR

```bash
git push origin feature/new-feature
# Create Pull Request on GitHub
```

---

## 📚 Resources

### Documentation

- [Rust Book](https://doc.rust-lang.org/book/)
- [Actix Web](https://actix.rs/)
- [React Docs](https://react.dev/)
- [Material-UI](https://mui.com/)

### Tools

- [Rust Analyzer](https://rust-analyzer.github.io/) - IDE support
- [Postman](https://www.postman.com/) - API testing
- [TablePlus](https://tableplus.com/) - Database GUI

---

**Last Update:** 2026-03-27
