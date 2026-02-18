#!/bin/bash
echo "🔥 AGGRESSIVE CLEAN REBUILD 🔥"
echo "🛑 Stopping all containers and clearing volumes..."
docker-compose down -v --remove-orphans

echo "🧹 Pruning Docker system, volumes, and images..."
docker system prune -a --volumes -f

echo "🗑️  Deleting local persistence directories (Bind Mounts)..."
# Using sudo because postgres writes as root/system user often
if [ -d "./data" ]; then
    echo "   Removing ./data..."
    sudo rm -rf ./data
    # Re-create empty structure so permissions can be set if needed (though docker usually handles create)
    mkdir -p data/postgres data/media data/logs data/hls data/playlists data/thumbnails
fi

echo "🏗️ Rebuilding with no cache..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for DB to be ready..."
sleep 15

echo "✅ Clean rebuild complete!"
