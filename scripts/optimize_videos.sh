#!/bin/bash

# Script to optimize all existing MP4 videos for web streaming
# This moves the moov atom to the beginning of the file for fast start playback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MEDIA_PATH="${MEDIA_PATH:-./data/media}"
BACKUP_SUFFIX=".pre-optimized"
LOG_FILE="./optimization_log.txt"

echo -e "${GREEN}=== MP4 Streaming Optimization Script ===${NC}"
echo "Media path: $MEDIA_PATH"
echo "Log file: $LOG_FILE"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    exit 1
fi

# Count total MP4 files
TOTAL_FILES=$(find "$MEDIA_PATH" -name "*.mp4" -type f 2>/dev/null | wc -l | tr -d ' ')
echo -e "Found ${YELLOW}$TOTAL_FILES${NC} MP4 files to process"
echo ""

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No MP4 files found in $MEDIA_PATH"
    exit 0
fi

# Initialize log
echo "Optimization started at $(date)" > "$LOG_FILE"
echo "Total files: $TOTAL_FILES" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Counter
PROCESSED=0
SKIPPED=0
FAILED=0

# Process each MP4 file
find "$MEDIA_PATH" -name "*.mp4" -type f | while read -r file; do
    PROCESSED=$((PROCESSED + 1))
    FILENAME=$(basename "$file")
    
    echo -e "[$PROCESSED/$TOTAL_FILES] Processing: ${YELLOW}$FILENAME${NC}"
    
    # Check if file is already optimized (has faststart)
    # We check by looking for the 'moov' atom early in the file
    if hexdump -C "$file" 2>/dev/null | head -100 | grep -q "moov"; then
        # Check if moov appears in first 10KB
        FIRST_10KB=$(head -c 10240 "$file" 2>/dev/null | strings | grep -c "moov" || true)
        if [ "$FIRST_10KB" -gt 0 ]; then
            echo -e "  ${GREEN}✓ Already optimized (moov at beginning)${NC}"
            echo "[SKIPPED] $FILENAME - already optimized" >> "$LOG_FILE"
            SKIPPED=$((SKIPPED + 1))
            continue
        fi
    fi
    
    # Create backup
    BACKUP_FILE="${file}${BACKUP_SUFFIX}"
    TEMP_FILE="${file}.temp.mp4"
    
    echo "  Creating backup: ${BACKUP_FILE##*/}"
    cp "$file" "$BACKUP_FILE"
    
    # Optimize with ffmpeg
    echo "  Optimizing for streaming..."
    if ffmpeg -i "$file" -c copy -movflags +faststart -y "$TEMP_FILE" 2>/dev/null; then
        # Replace original with optimized
        mv "$TEMP_FILE" "$file"
        echo -e "  ${GREEN}✓ Successfully optimized${NC}"
        echo "[SUCCESS] $FILENAME" >> "$LOG_FILE"
    else
        # Restore backup on failure
        mv "$BACKUP_FILE" "$file"
        rm -f "$TEMP_FILE"
        echo -e "  ${RED}✗ Failed to optimize (restored backup)${NC}"
        echo "[FAILED] $FILENAME" >> "$LOG_FILE"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # Remove backup after successful optimization
    rm -f "$BACKUP_FILE"
    echo ""
done

echo "" >> "$LOG_FILE"
echo "Optimization completed at $(date)" >> "$LOG_FILE"
echo "Summary: Processed=$PROCESSED, Skipped=$SKIPPED, Failed=$FAILED" >> "$LOG_FILE"

echo ""
echo -e "${GREEN}=== Optimization Complete ===${NC}"
echo "Processed: $PROCESSED files"
echo "Skipped: $SKIPPED files (already optimized)"
echo "Failed: $FAILED files"
echo ""
echo "See $LOG_FILE for details"
