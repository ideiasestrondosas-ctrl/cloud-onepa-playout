#!/bin/bash
echo "🔧 SRT LISTENER - FORCE FIX"
echo "=============================="
echo ""

echo "Step 1: Update database to correct SRT URL..."
docker compose exec postgres psql -U onepa -d onepa_playout << 'EOF'
UPDATE settings 
SET output_url = 'srt://0.0.0.0:9900?mode=listener',
    srt_mode = 'listener'
WHERE id = true;

SELECT 'Database updated. New URL:', output_url FROM settings;
EOF

echo ""
echo "Step 2: Kill all FFmpeg processes..."
docker compose exec backend sh -c "pkill -9 ffmpeg 2>/dev/null || true"
sleep 2
echo "✅ Old processes killed"

echo ""
echo "Step 3: Rebuild backend..."
docker compose build backend

echo ""
echo "Step 4: Restart backend..."
docker compose up -d backend
sleep 5

echo ""
echo "=============================="
echo "✅ FIX COMPLETE"
echo "=============================="
echo ""
echo "NOW DO THIS:"
echo "1. Go to Dashboard"
echo "2. Click START to begin playout"
echo "3. Wait 5 seconds"
echo "4. Run this command to verify:"
echo ""
echo "   docker compose exec backend sh -c \"ps aux | grep '[f]fmpeg.*srt'\""
echo ""
echo "You should see: srt://0.0.0.0:9900?mode=listener"
echo ""
echo "5. Test with VLC: srt://localhost:9900?mode=caller"
echo ""
