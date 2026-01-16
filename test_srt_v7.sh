#!/bin/sh
# Diagnostic script for SRT (Double Output) (v7)

echo "Testing SRT with Double Output Mapping (No Tee)..."

# Create a dummy video file if it doesn't exist
if [ ! -f /tmp/test.mp4 ]; then
  ffmpeg -f lavfi -i testsrc=duration=5:size=640x360:rate=30 -f lavfi -i sine=duration=5:frequency=440 -c:v libx264 -c:a aac -t 5 /tmp/test.mp4 -y
fi

# Test 1: Double Output
echo "\nTest 1: Double Output (SRT + HLS)"
ffmpeg -re -i /tmp/test.mp4 -c copy \
-map 0:v -map 0:a -f mpegts "srt://0.0.0.0:9901?mode=listener&listen=1" \
-map 0:v -map 0:a -f hls /tmp/test_double.m3u8 \
-t 2 2>&1 | grep -iE "listening|srt|error|failed" | head -n 10
