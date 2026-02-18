---
description: Rebuild the Docker environment using the Alpha rebuild script
---

# Rebuild Docker Environment

This workflow rebuilds and starts the Docker environment for Cloud Onepa Playout Alpha. 
It uses the optimized `./rebuild_alpha_docker.sh` script which handles dependency caching, 
database readiness, and health checks.

## Prerequisites

- Docker and Docker Compose installed
- Internet connection (for initial asset/image downloads)

## Steps

### 1. Execute Rebuild Script

```bash
./rebuild_alpha_docker.sh
```

// turbo
3. Alternatively, you can run:
```bash
docker-compose down && docker-compose up -d --build
```

### What this script does:
1. **Build context preparation**: Prepares necessary files for Docker.
2. **Container Rebuild**: Rebuilds backend and frontend using Docker's build cache.
3. **Service Initialization**: Starts Postgres, MediaMTX, Backend, and Frontend.
4. **Health Check**: Waits for the backend to be fully initialized and healthy.
5. **Frontend Sync**: Restarts the frontend after the backend is ready to ensure zero-delay connectivity.

## Verification

After the script completes, you can verify the status:

- **Frontend URL**: [http://localhost:3011](http://localhost:3011)
- **Health Endpoint**: [http://localhost:3011/api/health](http://localhost:3011/api/health)
- **Status Audit**: `./scripts/audit_ports.sh`

## Troubleshooting

### Persistence Issues
If you need to clear the database and media data, run:
```bash
docker-compose down -v
```
*Note: This will delete all uploaded media and playlist data.*

### Viewing Logs
To monitor the initialization process in detail:
```bash
docker-compose logs -f backend
```

### Port Conflicts
If port 3011 or 8182 is already in use:
```bash
lsof -ti:3011,8182 | xargs kill -9
```
