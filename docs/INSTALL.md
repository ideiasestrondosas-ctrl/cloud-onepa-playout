# Cloud Onepa Playout - Installation

## Prerequisites

### Option 1: Docker (Recommended)

- Docker 24.0+
- Docker Compose 2.0+
- 4GB RAM available
- 10GB disk space

### Option 2: Manual Installation

- Rust 1.75+
- Node.js 20+
- PostgreSQL 16+
- FFmpeg 7.2+
- 4GB RAM
- 4 CPU cores

---

## Installation with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/onepa/cloud-onepa-playout.git
cd cloud-onepa-playout
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 3. Start the Services

```bash
docker-compose up -d
```

### 4. Check Logs

```bash
docker-compose logs -f
```

### 5. Access the Interface

Open your browser at: `http://localhost:3010` (or `http://localhost:3011` depending on environment)

**Default Credentials:**

- Username: `admin`
- Password: `admin` (change after first login!)

---

## Manual Installation

### 1. Backend (Rust)

#### Install Dependencies

```bash
# macOS
brew install postgresql ffmpeg

# Ubuntu/Debian
sudo apt-get install postgresql ffmpeg libpq-dev pkg-config libssl-dev
```

#### Configure PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE onepa_playout;
CREATE USER onepa WITH PASSWORD 'onepa_password';
GRANT ALL PRIVILEGES ON DATABASE onepa_playout TO onepa;
\q
```

#### Compile and Run Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
cargo build --release
cargo run --release
```

Backend will be at: `http://localhost:8080`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be at: `http://localhost:5173`

---

## Installation Verification

### Health Check

```bash
curl http://localhost:8080/api/health
```

Expected Response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": "connected"
}
```

---

## Troubleshooting

### Error: "Database connection failed"

- Check if PostgreSQL is running
- Confirm credentials in `.env`
- Test connection: `psql -U onepa -d onepa_playout`

### Error: "FFmpeg not found"

- Install FFmpeg: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)
- Check: `ffmpeg -version`

### Port already in use

```bash
# Change ports in docker-compose.yml or .env
# Backend: SERVER_PORT=8081
# Frontend: vite.config.js -> server.port: 5174
```

---

## Next Steps

After successful installation:

1. Read the [User Manual](USER_MANUAL.md)
2. Configure output streams
3. Upload media
4. Create your first playlist

---

## Uninstallation

### Docker

```bash
docker-compose down -v
```

### Manual

```bash
# Stop services
# Remove database
sudo -u postgres psql -c "DROP DATABASE onepa_playout;"
```
