#!/bin/bash
# Cloud Onepa Playout - Master Release Automation (Enhanced UX)
# Author: Antigravity Agent
# Version: 2.1.0

# Set up error handling
set -e

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log_step() {
    echo -e "\n${BLUE}STEP: $1${NC}"
    echo "---------------------------------------------------"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Trap errors to provide hints
error_handler() {
    echo -e "\n${RED}🛑 CRITICAL FAILURE DETECTED!${NC}"
    echo "The last command failed with exit code $?. "
    echo -e "\n${YELLOW}💡 Troubleshooting & Resolution Tips:${NC}"
    echo "1. Permissions: Run 'chmod +x scripts/release.sh' if you haven't."
    echo "2. Git: Ensure you are on the 'master' branch and have no unmerged conflicts."
    echo "3. GitHub CLI: Verify 'gh auth status' to ensure you are logged in."
    echo "4. Disk Space: Ensure you have enough space for the 700MB+ zip file."
    echo "5. Manual Fix: You can manually run the failing step and then restart this script."
    exit 1
}

trap error_handler ERR

# --- Configuration ---
PROJECT_NAME="onepa-playout"
GITHUB_REPO="ideiasestrondosas-ctrl/cloud-onepa-playout"
EXCLUDE_FILE="big_buck_bunny_1080p_h264.mov"

echo -e "${GREEN}"
echo "==================================================="
echo "🚀 CLOUD ONEPA PLAYOUT - MASTER RELEASE AUTOMATION"
echo "==================================================="
echo -e "${NC}"

# 1. Versioning
log_step "Initializing Version Management"
CURRENT_VERSION=$(grep '"version":' frontend/package.json | awk -F '"' '{print $4}')
echo -e "Current detected version: ${YELLOW}$CURRENT_VERSION${NC}"

# Auto-increment logic
if [[ "$CURRENT_VERSION" =~ (.*[^0-9])([0-9]+)$ ]]; then
    prefix="${BASH_REMATCH[1]}"
    last_num="${BASH_REMATCH[2]}"
    next_num=$((last_num + 1))
    SUGGESTED_VERSION="${prefix}${next_num}"
elif [[ "$CURRENT_VERSION" =~ (.*)-ALPHA$ ]]; then
    SUGGESTED_VERSION="${CURRENT_VERSION}.1"
else
    # Fallback for semantic versioning X.Y.Z
    IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
    SUGGESTED_VERSION="$major.$minor.$((patch + 1))"
fi

read -p "Enter new version (Press ENTER for $SUGGESTED_VERSION): " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$SUGGESTED_VERSION}

# Branch Selection
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "Current active branch: ${YELLOW}$CURRENT_BRANCH${NC}"
read -p "Target branch for update (alpha, beta, final, stable) [ENTER for $CURRENT_BRANCH]: " TARGET_BRANCH
TARGET_BRANCH=${TARGET_BRANCH:-$CURRENT_BRANCH}

RELEASE_NAME="v${NEW_VERSION}-PRO"
ZIP_NAME="${PROJECT_NAME}-${RELEASE_NAME}.zip"
echo -e "Release Target: ${YELLOW}$RELEASE_NAME${NC} on branch ${YELLOW}$TARGET_BRANCH${NC}"

# 2. Cleanup
log_step "Project Workspace Sanitization"
echo "Removing old zip files, build caches, and logs..."
rm *.zip 2>/dev/null || true
rm -rf frontend/node_modules backend/target frontend/dist 2>/dev/null || true
rm *.log backend.log data/logs/* 2>/dev/null || true
log_success "Workspace is clean and ready for release."

# 3. Version Update
log_step "Updating Configuration Files"
echo "Patching package.json and Cargo.toml..."
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
sed -i '' "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" backend/Cargo.toml
log_success "Versions updated to $NEW_VERSION in all core files."

# 4. Statistics
log_step "Calculating Development Statistics"
echo "Scanning source code for metrics..."
FE_LINES=$(find frontend/src -name "*.jsx" -o -name "*.js" | xargs wc -l | tail -n 1 | awk '{print $1}')
BE_LINES=$(find backend/src -name "*.rs" | xargs wc -l | tail -n 1 | awk '{print $1}')
TOTAL_LINES=$((FE_LINES + BE_LINES))

echo -e "   Frontend Code: ${GREEN}$FE_LINES lines${NC}"
echo -e "   Backend Code:  ${GREEN}$BE_LINES lines${NC}"
echo -e "   Combined Core: ${GREEN}$TOTAL_LINES lines${NC}"
log_success "Statistics calculated successfully."

# 5. Documentation Update
log_step "Updating Public Documentation"
echo "Injecting new version and stats into README.md..."
sed -i '' "s/Version-[^)]*-blue/Version-$NEW_VERSION--PRO-blue/" README.md
sed -i '' "s/Frontend (React\/JSX)       | ~[0-9,]* linhas/Frontend (React\/JSX)       | ~$FE_LINES linhas/" README.md
sed -i '' "s/Backend (Rust)             | ~[0-9,]* linhas/Backend (Rust)             | ~$BE_LINES linhas/" README.md
sed -i '' "s/Total                      | \*\*~[0-9,]*+ linhas\*\*/Total                      | \*\*~$TOTAL_LINES+ linhas\*\*/" README.md
log_success "README.md is now up to date."

# 6. Git Synchronization
log_step "Synchronizing with GitHub Cloud"
echo "Staging changes and committing..."
git add .
git commit -m "chore(release): bump version to $NEW_VERSION and update stats" || echo "No changes to commit"
echo "Pushing current HEAD to remote '$TARGET_BRANCH' branch..."
git push origin HEAD:"$TARGET_BRANCH"
log_success "GitHub $TARGET_BRANCH branch is synchronized."

# 7. Professional Archiving
log_step "Generating Release Archive"
echo "Compressing project files (excluding large assets and BBB)..."
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
    -x "*.log" \
    -x "**/$EXCLUDE_FILE" \
    -x "backend/assets/protected/$EXCLUDE_FILE"

if [ -f "$ZIP_NAME" ]; then
    log_success "Archive $ZIP_NAME created successfully (${YELLOW}$(du -h "$ZIP_NAME" | cut -f1)${NC})."
else
    log_error "Zip file creation failed!"
    exit 1
fi

# 8. Formal Release
log_step "Publishing Official GitHub Release"
if command -v gh &> /dev/null; then
    echo "Creating formal release and attaching $ZIP_NAME..."
    gh release create "$RELEASE_NAME" "$ZIP_NAME" \
        --repo "$GITHUB_REPO" \
        --title "Cloud Onepa Playout $RELEASE_NAME" \
        --notes-file RELEASE_NOTES.md
    log_success "Release $RELEASE_NAME is now live on GitHub!"
else
    log_error "GitHub CLI (gh) not found."
    echo -e "${YELLOW}Please upload $ZIP_NAME manually to the GitHub portal.${NC}"
fi

echo -e "\n${GREEN}==================================================="
echo "🎉 MASTER RELEASE $NEW_VERSION COMPLETED SUCCESSFULLY"
echo -e "===================================================${NC}\n"
