#!/bin/bash

# Cloud Onepa Playout - Filler Downloader
# Downloads open-license (Creative Commons) videos to use as fillers

# Define the target directory (modify if needed)
TARGET_DIR="./media"
mkdir -p "$TARGET_DIR"

echo "Downloading filler videos to $TARGET_DIR..."

# 1 Minute Filler (Sample)
echo "Downloading 1m filler..."
curl -L -o "$TARGET_DIR/filler_1m.mp4" "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"

# 5 Minute Filler
echo "Downloading 5m filler..."
curl -L -o "$TARGET_DIR/filler_5m.mp4" "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4"

# For 30m/1h fillers, we recommend using longer local files or creating a loop video with FFmpeg.
# To create a 30m filler from a 1m clip:
# ffmpeg -stream_loop 30 -i "$TARGET_DIR/filler_1m.mp4" -c copy "$TARGET_DIR/filler_30m.mp4"

echo "Download complete! Remember to import these files into the Media Library."
