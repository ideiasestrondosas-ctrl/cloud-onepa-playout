#!/bin/sh
# Diagnostic script for SRT and Tee muxer

echo "Testing SRT Listener syntax inside tee..."

# Create a dummy video file if it doesn't exist
if [ ! -f /tmp/test.mp4 ]; then
  ffmpeg -f lavfi -i testsrc=duration=10:size=640x360:rate=30 -f lavfi -i sine=duration=10:frequency=440 -c:v libx264 -c:a aac -t 5 /tmp/test.mp4 -y
fi

# Test 1: Current syntax (escaped colons + single quotes)
echo "\nTest 1: Escaped colons + Single quotes"
ffmpeg -re -i /tmp/test.mp4 -f tee -map 0:v -map 0:a \
"[f=fifo:onfail=ignore:fifo_format=mpegts:drop_pkts_on_overflow=1:queue_size=120]'srt\\://0.0.0.0\\:9901?mode=listener&listen=1'|[f=hls]/tmp/test1.m3u8" \
-t 2 2>&1 | grep -iE "error|failed|listening" | head -n 10

# Test 2: Escaped colons (No quotes)
echo "\nTest 2: Escaped colons (No quotes)"
ffmpeg -re -i /tmp/test.mp4 -f tee -map 0:v -map 0:a \
"[f=fifo:onfail=ignore:fifo_format=mpegts:drop_pkts_on_overflow=1:queue_size=120]srt\\://0.0.0.0\\:9902?mode=listener&listen=1|[f=hls]/tmp/test2.m3u8" \
-t 2 2>&1 | grep -iE "error|failed|listening" | head -n 10

# Test 3: Double escaped colons + Single quotes
echo "\nTest 3: Double escaped colons + Single quotes"
ffmpeg -re -i /tmp/test.mp4 -f tee -map 0:v -map 0:a \
"[f=fifo:onfail=ignore:fifo_format=mpegts:drop_pkts_on_overflow=1:queue_size=120]'srt\\\\://0.0.0.0\\\\:9903?mode=listener&listen=1'|[f=hls]/tmp/test3.m3u8" \
-t 2 2>&1 | grep -iE "error|failed|listening" | head -n 10

# Test 4: Direct SRT (No tee) - To verify SRT works at all
echo "\nTest 4: Direct SRT (No tee)"
ffmpeg -re -i /tmp/test.mp4 -f mpegts srt://0.0.0.0:9904?mode=listener&listen=1 \
-t 2 2>&1 | grep -iE "error|failed|listening" | head -n 10
