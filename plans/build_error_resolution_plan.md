# Build Error Resolution Plan

## Error Analysis

```
error during build:
Could not resolve "./contexts/ChannelContext" from "src/App.jsx"
file: /app/src/App.jsx
```

## Root Cause

The error occurs during Docker build on Ubuntu Linux. The analysis shows:

1. **File Structure**: The source code on macOS has the correct structure:
   - `frontend/src/App.jsx` imports from `'./contexts/ChannelContext'`
   - `frontend/src/contexts/ChannelContext.jsx` exists

2. **Docker Build Context**: In `docker-compose.yml`:
   ```yaml
   frontend:
     build:
       context: ./frontend
       dockerfile: ../docker/Dockerfile.frontend
   ```

3. **Dockerfile** copies all content from frontend directory:
   ```dockerfile
   COPY . .
   ```

## Most Likely Cause

The error suggests the Docker build is **NOT copying the `contexts` folder** from the frontend directory. This could be due to:

1. **Missing `contexts` folder in the Ubuntu machine** - The code might not have been synced/pushed to the Ubuntu machine
2. **.dockerignore issues** - Something is being excluded unintentionally  
3. **Git state differences** - The Ubuntu machine might have a different version of the code

## Solution Steps

### Step 1: Verify File Exists on Ubuntu Machine

On your Ubuntu machine, verify the file exists:
```bash
ls -la frontend/src/contexts/
```

You should see:
- `ChannelContext.jsx`
- `NotificationContext.jsx`  
- `ThemeContext.jsx`

### Step 2: Check Git Status

If using Git, ensure all changes are committed and pushed:
```bash
git status
git add .
git commit -m "Add missing contexts folder"
git push
```

Then pull on Ubuntu:
```bash
git pull
```

### Step 3: Clean Docker Build

On Ubuntu, clean and rebuild:
```bash
# Remove old images and build cache
docker system prune -a

# Rebuild
docker-compose build --no-cache frontend
```

### Step 4: Alternative - Check .dockerignore

Verify `frontend/.dockerignore` doesn't exclude the contexts folder:
```bash
cat frontend/.dockerignore
```

Expected content (should NOT contain `src` or `contexts`):
```
node_modules
dist
build
.DS_Store
*.log
.git
.env
```

### Step 5: Verify Source Code on Ubuntu

Check if `App.jsx` has the correct import on Ubuntu:
```bash
cat frontend/src/App.jsx | grep -A2 "ChannelProvider"
```

Expected:
```jsx
import { ChannelProvider } from './contexts/ChannelContext';
```

## Quick Fix Commands

If you're sure the code is correct, try these on Ubuntu:

```bash
# Navigate to frontend directory
cd /path/to/cloud-onepa-alpha/frontend

# Install dependencies fresh
rm -rf node_modules
npm install

# Try local build
npm run build
```

## If Local Build Works But Docker Fails

The issue is in the Docker build context. Check the Dockerfile:

```dockerfile
# Make sure this copies the src folder
COPY . .
```

Should work if running from `frontend` directory as context.

## Summary

The most common cause of this error is **code not being synchronized** between your macOS development machine and the Ubuntu test machine. Ensure the latest code with the `contexts` folder is present on the Ubuntu machine before running Docker build.
