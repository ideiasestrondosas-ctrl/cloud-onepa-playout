#!/bin/bash

# ONEPA Playout PRO - Auto-Update Script
# Usage: Add to cron for nightly updates -> 0 4 * * * /path/to/auto_update.sh >> /var/log/onepa_update.log 2>&1

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "[$(date)] 🔄 Checking for updates..."

# 1. Update Code
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "[$(date)] 🔄 Checking for updates on branch: $BRANCH..."
git fetch origin "$BRANCH"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/"$BRANCH")

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] 📥 Updates found! Pulling..."
    git pull origin "$BRANCH"
    
    echo "[$(date)] 🏗️  Rebuilding containers..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d --build --remove-orphans
    else
        docker compose up -d --build --remove-orphans
    fi
    
    echo "[$(date)] 🧹 Cleaning up old images..."
    docker image prune -f
    
    echo "[$(date)] ✅ System updated successfully."
else
    echo "[$(date)] ✅ System is already up to date."
fi
