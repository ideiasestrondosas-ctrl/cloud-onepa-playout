#!/bin/bash
echo "🔥 AGGRESSIVE CLEAN REBUILD 🔥"
echo "🛑 Stopping all containers and clearing volumes..."
docker-compose down -v --remove-orphans

echo "🧹 Pruning Docker system, volumes, and images..."
docker system prune -a --volumes -f

echo "🏗️ Rebuilding with no cache..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for DB to be ready..."
sleep 15

echo "✅ Clean rebuild complete!"
