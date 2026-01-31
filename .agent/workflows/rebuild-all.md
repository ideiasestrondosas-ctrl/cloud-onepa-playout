---
description: Rebuild both local dev and Docker environments simultaneously
---

# Rebuild All Environments

This workflow rebuilds and starts both the local development environment (port 3010) and Docker environment (port 3011) simultaneously, allowing you to test both in parallel.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- Rust toolchain installed
- Alpha Postgres database running on port 5534

## Steps

### 1. Full Rebuild (Both Environments)

```bash
./rebuild_all.sh
```

This will:

- Clean up existing processes
- Build Rust backend
- Build frontend for Docker
- Start local dev environment (ports 3010, 8181)
- Rebuild and start Docker containers (ports 3011, 8182)
- Run health checks

### 2. Rebuild Only Local Dev

```bash
./rebuild_all.sh --dev-only
```

Use this when you only want to test local development changes.

### 3. Rebuild Only Docker

```bash
./rebuild_all.sh --docker-only
```

Use this when you only want to rebuild the Docker containers.

### 4. Force Docker Rebuild (No Cache)

```bash
./rebuild_all.sh --no-cache
```

Use this when you need to rebuild Docker images from scratch.

## Testing Both Environments

After running the script, you can test both environments:

- **Local Dev**: http://localhost:3010
- **Docker**: http://localhost:3011

## Viewing Logs

**Local Dev:**

```bash
tail -f backend.log frontend-dev.log
```

**Docker:**

```bash
docker-compose logs -f
```

## Stopping Environments

**Stop Local Dev:**

```bash
kill $(cat .backend.pid .frontend.pid)
```

**Stop Docker:**

```bash
docker-compose down
```

## Troubleshooting

### Port Already in Use

If you get port conflicts, manually kill processes:

```bash
lsof -ti:3010 | xargs kill -9
lsof -ti:8181 | xargs kill -9
```

### Docker Build Fails

Try rebuilding without cache:

```bash
./rebuild_all.sh --no-cache
```

### Frontend Not Loading

Wait a few seconds for Vite dev server to start, then refresh the browser.
