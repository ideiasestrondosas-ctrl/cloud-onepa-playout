#!/bin/bash
echo "Verifying Gapless Playout..."
# 1. Check if backend container is running
if [ "$(docker ps -q -f name=onepa-backend)" ]; then
    echo "Backend is running."
else
    echo "Backend is NOT running."
    exit 1
fi

# 2. Check logs for "concat" usage
echo "Checking backend logs for concat usage..."
docker logs onepa-backend 2>&1 | grep "concat" | tail -n 5

# 3. Check if playlist.txt exists inside container
echo "Checking for temporary playlist files..."
docker exec onepa-backend ls -la /tmp/ | grep "playlist_"

echo "Verification complete. Manually check stream for smoothness."
