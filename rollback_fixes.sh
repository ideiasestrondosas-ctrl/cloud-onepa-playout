#!/bin/bash
# ONEPA Rollback Script - Revert UDP/Logging changes

echo ">>> Starting rollback of recent UDP and Logging changes..."

# 1. Restore files modified by the agent
git restore backend/src/services/ffmpeg.rs
git restore backend/src/services/engine.rs
git restore docker-compose.yml

echo "✅ Files restored to original git state."

# 2. Rebuild backend to apply rollback
echo ">>> Rebuilding backend..."
docker compose build backend

# 3. Restart containers
echo ">>> Restarting environment..."
docker compose up -d

echo "================================================"
echo "ROLLBACK COMPLETE"
echo "The system has been reverted to its previous state."
echo "================================================"
