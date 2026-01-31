#!/bin/bash

# Cloud Onepa Playout - Clean Rebuild Script
# This script performs a complete clean rebuild of the entire application

set -e

echo "🧹 Starting Clean Rebuild Process..."
echo "=================================="

# Stop all running containers
echo "📦 Stopping Docker containers..."
docker-compose down -v 2>/dev/null || true

# Remove Docker containers and images
echo "🗑️  Removing Docker containers and images..."
docker rm -f onepa-backend onepa-frontend onepa-postgres onepa-mediamtx 2>/dev/null || true
docker rmi cloudonepaplayout-backend cloudonepaplayout-frontend 2>/dev/null || true

# Clean backend
echo "🦀 Cleaning Rust backend..."
cd backend
rm -rf target/
cd ..

# Clean frontend
echo "⚛️  Cleaning React frontend..."
cd frontend
rm -rf node_modules/
rm -rf dist/
rm -rf build/
rm -f package-lock.json
cd ..

# Clean Docker build cache
echo "🐳 Pruning Docker build cache..."
docker builder prune -af

echo ""
echo "✅ Clean complete!"
echo ""
echo "To rebuild and start the application, run:"
echo "  docker-compose up --build -d"
echo ""
