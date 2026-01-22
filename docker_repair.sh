#!/bin/bash

# ONEPA Playout PRO - Docker Repair Script (macOS)
# This script helps fix "ECONNREFUSED /backend.sock" and other Docker Desktop hangs.

echo "🛑 Stopping all Docker-related processes..."

# 1. Kill Docker Desktop and its components aggressively
echo "🔪 Force-killing all Docker processes..."
pkill -9 -f "Docker Desktop" 2>/dev/null
pkill -9 -f "com.docker" 2>/dev/null
pkill -9 -f "vpnkit" 2>/dev/null
pkill -9 -f "hyperkit" 2>/dev/null
pkill -9 -f "qemu" 2>/dev/null

echo "🧹 Cleaning up stale sockets and lock files..."
# 2. Remove problematic socket and lock files
rm -f ~/Library/Containers/com.docker.docker/Data/backend.sock
rm -f ~/.docker/run/docker.sock
rm -f ~/Library/Containers/com.docker.docker/Data/gui.lock

echo "🚀 Restarting Docker Desktop (this may take a minute)..."
# 3. Re-open Docker Desktop
open -a "Docker"

echo "⏳ Waiting for Docker to be ready..."
# 4. Wait for docker command to be responsive
until docker info >/dev/null 2>&1; do
  echo -n "."
  sleep 2
done

echo ""
echo "✅ Docker is back online!"

echo "🧹 Final cleanup of stopped containers/networks..."
docker system prune -f --volumes

echo "🏁 Done! You can now try running 'docker-compose up' again."
