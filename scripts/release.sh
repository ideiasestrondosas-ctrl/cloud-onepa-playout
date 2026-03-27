#!/bin/bash
# Cloud Onepa Playout - Master Release Automation (Enhanced UX)
# Author: Antigravity Agent
# Version: 2.1.1 (Fixed redundant suffix logic)

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
    echo "5. Manual Fix: You can manually run the failing step and then restart this script, also exclude hls directory"
    exit 1
}

trap error_handler ERR

# --- Configuration ---
PROJECT_NAME="onepa-playout"
GITHUB_REPO="ideiasestrondosas-ctrl/cloud-onepa-playout"
EXCLUDE_FILE="big_buck_bunny_1080p_h264.mov"

# Get Version
VERSION=$(grep -m1 "^version =" "$(dirname "$0")/../backend/Cargo.toml" | cut -d'"' -f2 2>/dev/null || echo "Unknown")
RELEASE_DATE=$(date +"%Y-%m-%d")

echo -e "${GREEN}"
echo "==================================================="
echo "🚀 CLOUD ONEPA PLAYOUT - MASTER RELEASE (v$VERSION)"
echo "📅 DATE: $RELEASE_DATE"
echo "==================================================="
echo -e "${NC}"

# 1. Versioning
log_step "Initializing Version Management"
CURRENT_VERSION=$(grep '"version":' frontend/package.json | awk -F '"' '{print $4}')
echo -e "Current detected version: ${YELLOW}$CURRENT_VERSION${NC}"

# Auto-increment logic
# Enhanced Auto-increment logic (Handles ALPHA, PRO, and complex suffixes)
if [[ "$CURRENT_VERSION" =~ (.*[^0-9])([0-9]+)([^0-9]*)$ ]]; then
    prefix="${BASH_REMATCH[1]}"
    last_num="${BASH_REMATCH[2]}"
    suffix="${BASH_REMATCH[3]}"
    # Force base 10 to prevent octal interpretation of 08, 09
    next_num=$((10#$last_num + 1)) 
    SUGGESTED_VERSION="${prefix}${next_num}${suffix}"
else
    # Minimal fallback
    SUGGESTED_VERSION="${CURRENT_VERSION}.1"
fi

read -p "Enter new version (Press ENTER for $SUGGESTED_VERSION): " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$SUGGESTED_VERSION}

# Extract Highlights from resumes.md (Latest activity block)
echo -e "Extracting release highlights from ${BLUE}docs/resumes.md${NC}..."
# This awk command gets the first block of text under the first H2 header
# We exclude the header line and empty lines
RELEASE_HIGHLIGHTS=$(awk '/^## / {if (count == 1) exit; count++; next} count == 1 {print}' "$(dirname "$0")/../docs/resumes.md" | sed '/^[[:space:]]*$/d')

if [ -z "$RELEASE_HIGHLIGHTS" ]; then
    echo -e "${YELLOW}⚠️  Warning: No highlights found in docs/resumes.md. Using default.${NC}"
    RELEASE_HIGHLIGHTS="- Automated Release: Version bump and documentation sync."
fi

# Branch Selection
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "Current active branch: ${YELLOW}$CURRENT_BRANCH${NC}"
read -p "Target branch for update (alpha, beta, final, stable) [ENTER for $CURRENT_BRANCH]: " TARGET_BRANCH
TARGET_BRANCH=${TARGET_BRANCH:-$CURRENT_BRANCH}

# Build RELEASE_NAME — avoid double -PRO if version already ends with -PRO
if [[ "$NEW_VERSION" == *"-PRO" ]]; then
    RELEASE_NAME="v${NEW_VERSION}"
else
    RELEASE_NAME="v${NEW_VERSION}-PRO"
fi
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
echo "Injecting new version ($RELEASE_NAME), date ($RELEASE_DATE), and highlights into README.md..."

# 1. Update Development Statistics Header
sed -i '' "s/Development Statistics (v.*)/Development Statistics ($RELEASE_NAME)/" README.md

# 2. Update Footer Note
sed -i '' "s/Approximate data based on version v.*/Approximate data based on version $RELEASE_NAME/" README.md

# 3. Update Current Version Section in README (with full date)
sed -i '' "s/### Current Version: .*/### Current Version: $RELEASE_NAME ($RELEASE_DATE)/" README.md

# 4. Update Release Highlights in README
# Note: we use a temporary file to handle multi-line highlights
# Using printf -- to avoid illegal option error if highlights start with -
printf "%s\n" "$RELEASE_HIGHLIGHTS" > highlights.tmp
# We replace the markers: <!-- RELEASE_HIGHLIGHTS_START --> ... <!-- RELEASE_HIGHLIGHTS_END -->
sed -i '' '/<!-- RELEASE_HIGHLIGHTS_START -->/,/<!-- RELEASE_HIGHLIGHTS_END -->/{ /<!-- RELEASE_HIGHLIGHTS_START -->/!{ /<!-- RELEASE_HIGHLIGHTS_END -->/!d; }; }' README.md
sed -i '' '/<!-- RELEASE_HIGHLIGHTS_START -->/r highlights.tmp' README.md
rm highlights.tmp

# 5. Update Badge
sed -i '' "s/Version-[^)]*-blue/Version-$NEW_VERSION-blue/" README.md

# 6. Update ROADMAP.md
echo "Updating docs/ROADMAP.md status and history..."
sed -i '' "s/_Status updated on .* (v.*)/_Status updated on $RELEASE_DATE ($RELEASE_NAME)/" docs/ROADMAP.md
# Append to version history table (assuming it starts with | Version |)
# Clean newline characters for table Row
CLEAN_HIGHLIGHTS=$(echo "$RELEASE_HIGHLIGHTS" | tr '\n' '; ' | sed 's/; ; /; /g')
echo "| $RELEASE_NAME | - | $RELEASE_DATE | $CLEAN_HIGHLIGHTS |" >> docs/ROADMAP.md

# 7. Prepend New Version to RELEASE_NOTES.md (root and docs)
for notes_file in "RELEASE_NOTES.md" "docs/RELEASE_NOTES.md"; do
    if [ -f "$notes_file" ]; then
        echo "Updating $notes_file..."
        cat <<EOF > notes.tmp.md
# Release Notes - Cloud Onepa Playout

## $RELEASE_NAME ($RELEASE_DATE)

### 🚀 Release Highlights
$RELEASE_HIGHLIGHTS

$(tail -n +3 "$notes_file")
EOF
        mv notes.tmp.md "$notes_file"
    fi
done

log_success "All documentation files updated with version $RELEASE_NAME."

# 6. Git Synchronization
log_step "Synchronizing with GitHub Cloud"
echo "Staging changes and committing..."
git add .
git commit -m "chore(release): bump version to $NEW_VERSION and update stats" || echo "No changes to commit"

# Detect correct remote for $GITHUB_REPO (e.g. cloud-alpha vs origin)
REMOTE=$(git remote -v | grep "$GITHUB_REPO" | head -n 1 | awk '{print $1}')
REMOTE=${REMOTE:-"origin"}

echo "Pushing current HEAD to remote '$REMOTE' on branch '$TARGET_BRANCH'..."
git push "$REMOTE" HEAD:"$TARGET_BRANCH"
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
    -x "data/hls/*" \
    -x "data/logs/*" \
    -x "data/playlists/*.m3u8" \
    -x "backups/*" \
    -x "tmp/*" \
    -x ".DS_Store" \
    -x "frontend/dist/*" \
    -x "frontend/build/*" \
    -x "node_modules/*" \
    -x "*.zip" \
    -x "*.log" \
    -x "*.proxy.mp4" \
    -x "*.optimized.mp4" \
    -x "*$EXCLUDE_FILE" \
    -x "*/$EXCLUDE_FILE" || {
    ZIP_EXIT=$?
    # Exit code 18 = not all files were readable (warnings only) — archive is still valid
    if [ $ZIP_EXIT -ne 18 ]; then
        echo "zip failed with exit code $ZIP_EXIT"
        exit $ZIP_EXIT
    fi
    echo -e "${YELLOW}⚠️  zip: some files were not readable (e.g. HLS sockets) — archive created successfully.${NC}"
}

if [ -f "$ZIP_NAME" ]; then
    log_success "Archive $ZIP_NAME created successfully (${YELLOW}$(du -h "$ZIP_NAME" | cut -f1)${NC})."
else
    log_error "Zip file creation failed!"
    exit 1
fi

# 8. Formal Release
log_step "Publishing Official GitHub Release"
if command -v gh &> /dev/null; then
    # Check if release exists
    if gh release view "$RELEASE_NAME" --repo "$GITHUB_REPO" &> /dev/null; then
        echo -e "${YELLOW}⚠️  Release $RELEASE_NAME already exists!${NC}"
        read -p "Overwrite (delete and re-create)? (y/N): " allow_overwrite
        if [[ "$allow_overwrite" =~ ^[Yy]$ ]]; then
            echo "Deleting existing release and tag..."
            gh release delete "$RELEASE_NAME" --repo "$GITHUB_REPO" --cleanup-tag --yes
            log_success "Existing release deleted."
        else
            log_error "Release creation canceled by user."
            exit 1
        fi
    fi

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
