#!/bin/bash
# SRT Diagnostic Script

echo "=== SRT DIAGNOSTIC REPORT ==="
echo ""

echo "1. Checking Backend Logs for SRT URL mapping..."
docker compose logs backend 2>&1 | grep -i "srt" | tail -20
echo ""

echo "2. Checking current FFmpeg process..."
docker compose exec backend sh -c "ps aux | grep '[f]fmpeg' | grep -v grep" 2>&1 | head -5
echo ""

echo "3. Checking if SRT port 9900 is mapped in docker-compose..."
grep -A 5 "9900" docker-compose.yml
echo ""

echo "4. Testing SRT URL from inside container..."
docker compose exec backend sh -c "echo 'Test URL: srt://0.0.0.0:9900?mode=listener&listen=1'"
echo ""

echo "5. Checking FFmpeg SRT support..."
docker compose exec backend sh -c "ffmpeg -protocols 2>&1 | grep srt"
echo ""

echo "6. Checking if port 9900 is listening..."
docker compose exec backend sh -c "netstat -tuln 2>/dev/null | grep 9900 || ss -tuln 2>/dev/null | grep 9900 || echo 'netstat/ss not available'"
echo ""

echo "=== END DIAGNOSTIC REPORT ==="
