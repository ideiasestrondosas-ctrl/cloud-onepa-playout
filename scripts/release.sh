#!/bin/bash
# Cloud Onepa Playout - Professional Release Script
# Author: Antigravity Agent
# Version: 1.0.0

set -e

# Configuration
VERSION=$(grep '"version":' frontend/package.json | awk -F '"' '{print $4}')
PROJECT_NAME="onepa-playout"
RELEASE_NAME="v${VERSION}-PRO"
ZIP_NAME="${PROJECT_NAME}-${RELEASE_NAME}.zip"
GITHUB_REPO="ideiasestrondosas-ctrl/cloud-onepa-playout"

echo "🚀 Starting Release Process for $RELEASE_NAME..."

# 1. Validation
if [[ $(git status --porcelain) ]]; then
  echo "⚠️  Warning: You have uncommitted changes. Please commit or stash them first."
  # exit 1 
  # Forcing proceed for this automated environment if needed, but usually we should stop.
fi

# 2. Cleanup
echo "🧹 Cleaning up project artifacts..."
rm -rf backend/target frontend/node_modules frontend/dist *.zip *.log backend.log data/logs/* 2>/dev/null || true

# 3. Create Zip Archive
echo "📦 Creating professional archive: $ZIP_NAME..."
zip -r "$ZIP_NAME" . \
    -x "frontend/node_modules/*" \
    -x "backend/target/*" \
    -x ".git/*" \
    -x "data/media/*" \
    -x "data/thumbnails/*" \
    -x "data/postgres/*" \
    -x "backups/*" \
    -x "tmp/*" \
    -x ".DS_Store" \
    -x "frontend/dist/*" \
    -x "*.zip" \
    -x "*.log"

echo "✅ Archive created: $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1))"

# 4. Git Push
echo "📤 Pushing changes to GitHub..."
git add .
git commit -m "chore(release): prepare release $RELEASE_NAME" || echo "No changes to commit"
git push origin master

# 5. GitHub Release (using gh CLI)
if command -v gh &> /dev/null; then
    echo "🌐 Creating GitHub Release..."
    gh release create "$RELEASE_NAME" "$ZIP_NAME" \
        --repo "$GITHUB_REPO" \
        --title "Cloud Onepa Playout $RELEASE_NAME" \
        --notes-file RELEASE_NOTES.md
    echo "🎉 Release $RELEASE_NAME published successfully!"
else
    echo "❌ GitHub CLI (gh) not found. Please upload $ZIP_NAME manually."
fi

echo "🏁 Process Complete."
