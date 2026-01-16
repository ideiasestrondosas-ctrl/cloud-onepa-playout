#!/bin/sh
# Diagnostic script for SRT and Tee muxer (v4)

echo "Testing SRT Listener syntax (Minimalist)..."

# Create a dummy video file if it doesn't exist
if [ ! -f /tmp/test.mp4 ]; then
  ffmpeg -f lavfi -i testsrc=duration=5:size=640x360:rate=30 -f lavfi -i sine=duration=5:frequency=440 -c:v libx264 -c:a aac -t 5 /tmp/test.mp4 -y
fi

# Test 1: Absolute minimum (No FIFO, No onfail, No quoting)
echo "\nTest 1: Absolute minimum (No FIFO, No onfail, No quoting)"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"srt://0.0.0.0:9901?mode=listener&listen=1|[f=hls]/tmp/test1.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt|error|failed" | head -n 10

# Test 2: Only [f=mpegts] for SRT
echo "\nTest 2: Only [f=mpegts] for SRT"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"[f=mpegts]srt://0.0.0.0:9902?mode=listener&listen=1|[f=hls]/tmp/test2.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt|error|failed" | head -n 10

# Test 3: Quoted URL (Standard FFmpeg way)
echo "\nTest 3: Quoted URL (Standard FFmpeg way)"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"[f=mpegts]'srt://0.0.0.0:9903?mode=listener&listen=1'|[f=hls]/tmp/test3.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt|error|failed" | head -n 10
