#!/bin/bash
# heal_system.sh - Ensures all default values and paths are correct for the App to run perfectly.

# Get Version
VERSION=$(grep -m1 "^version =" "$(dirname "$0")/../backend/Cargo.toml" | cut -d'"' -f2 2>/dev/null || echo "Unknown")

echo "🚀 Starting System Healer (Version: $VERSION)..."

# 1. Correct Logo and Asset Paths in Database
echo "📁 Fixing asset paths in database..."
docker compose exec postgres psql -U onepa -d onepa_playout -c "
UPDATE settings SET 
    logo_path = '/var/lib/onepa-playout/assets/protected/logo_default.png',
    media_path = '/var/lib/onepa-playout/media',
    thumbnails_path = '/var/lib/onepa-playout/thumbnails',
    playlists_path = '/var/lib/onepa-playout/playlists',
    fillers_path = '/var/lib/onepa-playout/fillers',
    app_logo_path = '/var/lib/onepa-playout/assets/protected/logo_default.png',
    default_video_path = '/var/lib/onepa-playout/assets/protected/default_video.mp4'
WHERE id = TRUE;"

# 2. Ensure Directories Exist
echo "🛠️ Ensuring container directories exist..."
docker compose exec backend mkdir -p /var/lib/onepa-playout/hls /var/lib/onepa-playout/thumbnails /var/lib/onepa-playout/playlists /var/lib/onepa-playout/media

# 3. Synchronize Media (Add default movie if missing from DB but exists in folder)
echo "🎬 Synchronizing default media..."
docker compose exec postgres psql -U onepa -d onepa_playout -c "
INSERT INTO media (id, filename, path, media_type, is_filler)
SELECT gen_random_uuid(), 'big_buck_bunny_1080p_h264.mov', '/var/lib/onepa-playout/media/big_buck_bunny_1080p_h264.mov', 'video', false
WHERE NOT EXISTS (SELECT 1 FROM media WHERE filename = 'big_buck_bunny_1080p_h264.mov');"

# 4. SRT Diagnostics (Check if port is blocked)
echo "📡 Checking SRT connectivity to Host..."
SRT_STATUS=$(docker compose exec backend nc -zvu host.docker.internal 9900 2>&1)
if [[ $SRT_STATUS == *"succeeded"* ]]; then
    echo "✅ SRT Port 9900 on Host is REACHABLE."
else
    echo "⚠️ SRT Port 9900 on Host is NOT reachable. Troubleshooting:"
    echo "   - Is VLC running in Listener mode? (srt://@:9900?mode=listener)"
    echo "   - Is macOS Firewall blocking UDP 9900?"
fi

# 5. Restart Backend to apply all logic
echo "🔄 Restarting Backend..."
docker compose restart backend

echo "✨ System is HEALED and ready for Playout!"
