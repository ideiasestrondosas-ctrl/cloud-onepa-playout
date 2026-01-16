#!/bin/sh
# Diagnostic script for SRT and Tee muxer (v3)

echo "Testing SRT Listener syntax (Simplified Quoting)..."

# Create a dummy video file if it doesn't exist
if [ ! -f /tmp/test.mp4 ]; then
  ffmpeg -f lavfi -i testsrc=duration=10:size=640x360:rate=30 -f lavfi -i sine=duration=10:frequency=440 -c:v libx264 -c:a aac -t 5 /tmp/test.mp4 -y
fi

# Test 1: Tee + FIFO (Single quotes, NO escaping)
echo "\nTest 1: Tee + FIFO (Single quotes, NO escaping)"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"[f=fifo:fifo_format=mpegts:onfail=ignore]'srt://0.0.0.0:9901?mode=listener&listen=1'|[f=hls]/tmp/test1.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt" | head -n 10

# Test 2: Tee + FIFO (Single quotes + escaped quotes in URL if any)
echo "\nTest 2: Tee + FIFO (Escaped colons + single quotes)"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"[f=fifo:fifo_format=mpegts:onfail=ignore]'srt\\://0.0.0.0\\:9902?mode=listener&listen=1'|[f=hls]/tmp/test2.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt" | head -n 10

# Test 3: Standard tee (No FIFO, No quoting)
echo "\nTest 3: Standard tee (No FIFO, No quoting, NO escaping)"
ffmpeg -re -i /tmp/test.mp4 -c copy -f tee \
"[f=mpegts]srt://0.0.0.0:9903?mode=listener&listen=1|[f=hls]/tmp/test3.m3u8" \
-t 2 2>&1 | grep -iE "listening|srt" | head -n 10
