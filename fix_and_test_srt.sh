#!/bin/bash
# Complete SRT Fix and Test Script

set -e

echo "================================================"
echo "SRT LISTENER MODE - COMPLETE FIX & TEST"
echo "================================================"
echo ""

echo "STEP 1: Rebuild Backend with New Logging Code"
echo "---"
docker compose build backend
echo "✅ Backend rebuilt"
echo ""

echo "STEP 2: Restart Backend Service"
echo "---"
docker compose up -d backend
sleep 5
echo "✅ Backend restarted"
echo ""

echo "STEP 3: Verify Database URL"
echo "---"
DB_URL=$(docker compose exec postgres psql -U onepa -d onepa_playout -t -c "SELECT output_url FROM settings LIMIT 1;" 2>/dev/null | tr -d ' \n')
echo "Database URL: $DB_URL"
if [[ "$DB_URL" == *"mode=listener"* ]]; then
    echo "✅ Database URL contains mode=listener"
else
    echo "❌ Database URL missing mode=listener"
    echo "Fixing database..."
    docker compose exec postgres psql -U onepa -d onepa_playout -c "UPDATE settings SET output_url = 'srt://0.0.0.0:9900?mode=listener' WHERE output_url LIKE 'srt://%';" 2>/dev/null
    echo "✅ Database fixed"
fi
echo ""

echo "STEP 4: Kill Old FFmpeg Processes"
echo "---"
docker compose exec backend sh -c "pkill -9 ffmpeg || true"
sleep 2
echo "✅ Old processes killed"
echo ""

echo "STEP 5: Wait for User to Start Playout from UI"
echo "---"
echo "⚠️  ACTION REQUIRED:"
echo "   1. Go to the Dashboard"
echo "   2. Click 'Stop' if playout is running"
echo "   3. Click 'Start' to begin new playout"
echo ""
echo "Press ENTER when playout is started..."
read

echo ""
echo "STEP 6: Check New FFmpeg Command"
echo "---"
sleep 3
FFMPEG_CMD=$(docker compose exec backend sh -c "ps aux | grep '[f]fmpeg.*srt' | head -1" 2>/dev/null)
echo "$FFMPEG_CMD"
echo ""

if [[ "$FFMPEG_CMD" == *"srt://0.0.0.0:9900"* ]]; then
    echo "✅ FFmpeg is using correct URL: srt://0.0.0.0:9900"
elif [[ "$FFMPEG_CMD" == *"srt://"* ]]; then
    echo "❌ FFmpeg is using wrong URL"
    echo "Current URL in command: $(echo "$FFMPEG_CMD" | grep -o 'srt://[^|]*')"
else
    echo "❌ No SRT FFmpeg process found"
fi
echo ""

echo "STEP 7: Check Backend Logs for New Logging"
echo "---"
docker compose logs backend 2>&1 | grep -E "(🔍|🎧|📞|✅|⚠️)" | tail -10
echo ""

echo "STEP 8: Test SRT Connection"
echo "---"
echo "Now test with VLC:"
echo "  1. Open VLC"
echo "  2. Media → Open Network Stream"
echo "  3. Enter: srt://localhost:9900?mode=caller"
echo "  4. Click Play"
echo ""

echo "================================================"
echo "SCRIPT COMPLETE"
echo "================================================"
