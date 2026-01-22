#!/bin/bash

# ONEPA Playout PRO - Clean Rebuild Script
# This script performs a deep cleanup of all caches and builds to ensure a fresh state.

echo "🚀 Starting Complete System Reset..."

# 1. Stop any running processes
echo "⏹️ Stopping running services..."
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 2. Clean Backend
echo "🧹 Cleaning Backend (Rust)..."
cd backend
cargo clean
cd ..

# 3. Clean Frontend
echo "🧹 Cleaning Frontend (Node/Vite)..."
cd frontend
rm -rf node_modules dist
echo "📦 Re-installing Frontend dependencies..."
npm install
cd ..

# 4. Docker Cleanup (Optional - only if user confirms)
if [[ "$*" == *"--docker"* ]]; then
    echo "🐳 Resetting Docker environment..."
    docker-compose down -v
    docker system prune -f
fi

# 5. Rebuild Everything
echo "🏗️ Rebuilding Backend (Release mode)..."
cd backend
cargo build --release
cd ..

echo "🏗️ Rebuilding Frontend..."
cd frontend
npm run build
cd ..

echo "✅ Rebuild Complete!"
echo "👉 To start the system, run your usual startup script or use docker-compose."
