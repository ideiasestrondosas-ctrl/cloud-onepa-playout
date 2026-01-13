#!/bin/bash
echo "🧹 Pruning Docker system..."
docker system prune -f
docker builder prune -f

echo "🛑 Stopping containers..."
docker-compose down --remove-orphans

echo "🏗️ Rebuilding with no cache..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Clean rebuild complete!"
