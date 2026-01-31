#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ONEPA PLAYOUT - ALPHA DOCKER REBUILD SCRIPT             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Rebuild Backend
echo -e "${BLUE}>>> Compiling Rust Backend (Release)...${NC}"
cd backend
# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found. Please install Rust.${NC}"
    exit 1
fi
cargo build --release
cd ..
echo -e "${GREEN}✓ Backend compilation complete${NC}"

# 2. Build Frontend
echo -e "${BLUE}>>> Building React Frontend...${NC}"
cd frontend
# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not found. Please install Node.js.${NC}"
    exit 1
fi
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend build complete${NC}"

# 3. Docker Rebuild & Restart
echo -e "${BLUE}>>> Rebuilding Docker Containers...${NC}"
# Use --no-cache to ensure we pick up the new binaries we just built
docker-compose build --no-cache

echo -e "${CYAN}  → Starting all containers...${NC}"
docker-compose up -d

# 4. Health Check
echo -e "${CYAN}  → Waiting for backend to become healthy...${NC}"
echo -e "${YELLOW}    (This may take up to 3 minutes for initial asset downloads)${NC}"

# Wait for backend health with timeout
TIMEOUT=200
ELAPSED=0
BACKEND_HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
  HEALTH=$(docker inspect alpha-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  if [ "$HEALTH" = "healthy" ]; then
    echo -e "\n${GREEN}  ✓ Backend is healthy after ${ELAPSED}s!${NC}"
    BACKEND_HEALTHY=true
    break
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
  echo -ne "${YELLOW}    Waiting... ${ELAPSED}s / ${TIMEOUT}s (Status: $HEALTH)  \r${NC}"
done

echo "" # New line after progress

if [ "$BACKEND_HEALTHY" = false ]; then
  echo -e "${RED}  ✗ Backend healthcheck timeout after ${TIMEOUT}s${NC}"
  echo -e "${YELLOW}  Checking logs...${NC}"
  docker logs alpha-backend --tail 30
  echo -e "${YELLOW}  Note: Backend may still be downloading assets. Check 'docker logs alpha-backend -f'${NC}"
fi

# 5. Frontend Connectivity Check
if [ "$BACKEND_HEALTHY" = true ]; then
  echo -e "${CYAN}  → Verifying Frontend Connection...${NC}"
  # Restart frontend just in case it started before backend was ready (though code handles this now)
  docker-compose restart frontend
  sleep 5 
  
  if curl -s http://localhost:3011/api/health > /dev/null 2>&1; then
      echo -e "${GREEN}  ✓ Frontend (3011): Connected to Backend${NC}"
  else
      echo -e "${RED}  ✗ Frontend (3011): Could not connect to backend${NC}"
  fi
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    REBUILD COMPLETE                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Access Docker Environment:${NC}"
echo -e "  → URL:      ${BLUE}http://localhost:3011${NC}"
echo -e "  → Backend:  ${BLUE}http://localhost:3011/api/health${NC}"
echo -e "  → Logs:     ${YELLOW}docker-compose logs -f${NC}"
echo ""
