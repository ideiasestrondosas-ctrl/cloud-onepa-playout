#!/bin/bash

# Configuration
PROJECT_NAME="cloud-onepa-playout"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d)
VERSION=$(grep '"version":' frontend/package.json | awk -F '"' '{print $4}')
ZIP_NAME="${PROJECT_NAME}-v${VERSION}-PRO.zip"

# Create backups directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Creating backup for version $VERSION..."
echo "📂 Destination: $BACKUP_DIR/$ZIP_NAME"

# Create Zip
# Exclude: node_modules, target (Rust build), git history, large media assets, and existing backups
zip -r "$BACKUP_DIR/$ZIP_NAME" . \
    -x "frontend/node_modules/*" \
    -x "backend/target/*" \
    -x ".git/*" \
    -x "backend/assets/media/*" \
    -x "backend/assets/thumbnails/*" \
    -x "backups/*" \
    -x "tmp/*"

cp "$BACKUP_DIR/$ZIP_NAME" .

echo "✅ Backup created successfully!"
echo "💾 Size: $(du -h "$BACKUP_DIR/$ZIP_NAME" | cut -f1)"

# Optional: Git Commit & Push
# echo "🔄 Committing to Git..."
# git add .
# git commit -m "Auto-backup v$VERSION"
# git push origin main

echo "🚀 Process complete."
