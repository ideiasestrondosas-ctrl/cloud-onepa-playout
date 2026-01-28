#!/bin/bash

# Rollback script to revert Alpha project ports and configurations to Master project defaults.
# This script targets the files modified during the Alpha port migration.

echo ">>> 🔄 Starting Rollback to Master Configuration..."

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_OPTS=("-i" "")
else
    SED_OPTS=("-i")
fi

# 1. Revert docker-compose.yml
echo "Updating docker-compose.yml..."
sed "${SED_OPTS[@]}" 's/alpha-postgres/onepa-postgres/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/alpha-backend/onepa-backend/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/alpha-mediamtx/onepa-mediamtx/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/alpha-frontend/onepa-frontend/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/5534:5432/5434:5432/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/8182:8181/8082:8081/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/2036:2035/1936:1935/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/8991:8988/8891:8888/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/8992:8989/8892:8889/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/8993:8990/8893:8890/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/3011:80/3001:80/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/10901:10900/9901:9900/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/SERVER_PORT: 8181/SERVER_PORT: 8081/g' docker-compose.yml
sed "${SED_OPTS[@]}" 's/http:\/\/127.0.0.1:8181/http:\/\/127.0.0.1:8081/g' docker-compose.yml

# 2. Revert docker/mediamtx.yml
echo "Updating docker/mediamtx.yml..."
sed "${SED_OPTS[@]}" 's/:2035/:1935/g' docker/mediamtx.yml
sed "${SED_OPTS[@]}" 's/:8988/:8888/g' docker/mediamtx.yml
sed "${SED_OPTS[@]}" 's/:8989/:8889/g' docker/mediamtx.yml
sed "${SED_OPTS[@]}" 's/:8990/:8890/g' docker/mediamtx.yml

# 3. Revert backend/src/main.rs
echo "Updating backend/src/main.rs..."
sed "${SED_OPTS[@]}" 's/8181/8081/g' backend/src/main.rs
sed "${SED_OPTS[@]}" 's/:3010/:3000/g' backend/src/main.rs

# 4. Revert backend/src/api/settings.rs
echo "Updating backend/src/api/settings.rs..."
sed "${SED_OPTS[@]}" 's/:2035/:1935/g' backend/src/api/settings.rs
sed "${SED_OPTS[@]}" 's/:8990/:8890/g' backend/src/api/settings.rs

# 5. Revert frontend/vite.config.js
echo "Updating frontend/vite.config.js..."
sed "${SED_OPTS[@]}" 's/port: 3010/port: 3000/g' frontend/vite.config.js
sed "${SED_OPTS[@]}" 's/:8181/:8081/g' frontend/vite.config.js
sed "${SED_OPTS[@]}" 's/:8988/:8888/g' frontend/vite.config.js

# 6. Revert rebuild_local.sh
echo "Updating rebuild_local.sh..."
sed "${SED_OPTS[@]}" 's/:8181/:8081/g' rebuild_local.sh
sed "${SED_OPTS[@]}" 's/:3010/:3000/g' rebuild_local.sh
sed "${SED_OPTS[@]}" 's/--port 3010/--port 3000/g' rebuild_local.sh
sed "${SED_OPTS[@]}" 's/localhost:5534/localhost:5434/g' rebuild_local.sh
sed "${SED_OPTS[@]}" 's/SERVER_PORT=8181/SERVER_PORT=8081/g' rebuild_local.sh

# 7. Revert docker/Dockerfile.backend
echo "Updating docker/Dockerfile.backend..."
sed "${SED_OPTS[@]}" 's/EXPOSE 8181/EXPOSE 8081/g' docker/Dockerfile.backend

# 8. Revert frontend/nginx.conf
echo "Updating frontend/nginx.conf..."
sed "${SED_OPTS[@]}" 's/:8181/:8081/g' frontend/nginx.conf

echo ">>> ✅ Rollback configuration applied successfully."
echo ">>> 🚀 Please run './rebuild_local.sh' or 'docker-compose up -d --build' to apply changes."
