#!/bin/bash

# ============================================================================
# ONEPA Playout PRO - Fresh VM Deployment Script
# Version: 2.2.0-ALPHA.5-PRO
# 
# Usage: bash deploy_new_vm.sh
# 
# This script installs all prerequisites and deploys the application
# on a fresh Ubuntu VM (tested on 22.04 LTS).
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO=${DEPLOY_REPO:-"ideiasestrondosas-ctrl/cloud-onepa-playout"}
BRANCH=${DEPLOY_BRANCH:-"alpha"}
INSTALL_DIR=${INSTALL_DIR:-"/opt/onepa-playout"}

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ONEPA Playout PRO — Fresh VM Deploy     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# --- 0. Pre-flight checks ---
echo -e "${YELLOW}[1/8] Checking system requirements...${NC}"

# Check disk space (need at least 10GB free)
FREE_SPACE_KB=$(df -k / | tail -1 | awk '{print $4}')
FREE_SPACE_GB=$((FREE_SPACE_KB / 1024 / 1024))
if [ "$FREE_SPACE_GB" -lt 10 ]; then
    echo -e "${RED}❌ Need at least 10GB free disk space. Found: ${FREE_SPACE_GB}GB${NC}"
    exit 1
fi
echo -e "  Disk space: ${GREEN}${FREE_SPACE_GB}GB free ✓${NC}"

# Check RAM
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))
echo -e "  RAM: ${GREEN}${TOTAL_RAM_GB}GB ✓${NC}"

# --- 1. Install Docker ---
echo -e "\n${YELLOW}[2/8] Installing Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "  Docker already installed: ${GREEN}$(docker --version)${NC}"
else
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    echo -e "  ${GREEN}Docker installed ✓${NC}"
fi

# --- 2. Install Docker Compose ---
echo -e "\n${YELLOW}[3/8] Checking Docker Compose...${NC}"
if docker compose version &> /dev/null; then
    echo -e "  ${GREEN}Docker Compose available ✓${NC}"
elif command -v docker-compose &> /dev/null; then
    echo -e "  ${GREEN}docker-compose (v1) available ✓${NC}"
else
    echo -e "  Installing Docker Compose plugin..."
    sudo apt-get update -qq && sudo apt-get install -y -qq docker-compose-plugin
    echo -e "  ${GREEN}Docker Compose installed ✓${NC}"
fi

# --- 3. Install Git ---
echo -e "\n${YELLOW}[4/8] Checking Git...${NC}"
if command -v git &> /dev/null; then
    echo -e "  ${GREEN}Git available ✓${NC}"
else
    sudo apt-get update -qq && sudo apt-get install -y -qq git
    echo -e "  ${GREEN}Git installed ✓${NC}"
fi

# --- 4. Clone repository ---
echo -e "\n${YELLOW}[5/8] Cloning repository...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "  ${YELLOW}Directory $INSTALL_DIR already exists. Pulling latest...${NC}"
    cd "$INSTALL_DIR"
    git pull origin "$BRANCH" || true
else
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown "$USER:$USER" "$INSTALL_DIR"
    git clone -b "$BRANCH" "https://github.com/$REPO.git" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo -e "  ${GREEN}Repository ready ✓${NC}"

# --- 5. Create .env file ---
echo -e "\n${YELLOW}[6/8] Creating environment configuration...${NC}"
if [ ! -f .env ]; then
    cat > .env << 'ENV'
# ONEPA Playout Configuration
POSTGRES_DB=onepa_playout
POSTGRES_USER=onepa
POSTGRES_PASSWORD=onepa
JWT_SECRET=onepa-production-secret-change-me
DEPLOY_REPO=ideiasestrondosas-ctrl/cloud-onepa-playout
DEPLOY_BRANCH=alpha
ENV
    echo -e "  ${GREEN}.env created ✓${NC}"
else
    echo -e "  ${GREEN}.env already exists, keeping ✓${NC}"
fi

# --- 6. Create data directories ---
echo -e "\n${YELLOW}[7/8] Creating data directories...${NC}"
mkdir -p data/postgres data/media data/thumbnails data/playlists data/hls
echo -e "  ${GREEN}Data directories created ✓${NC}"

# --- 7. Build and start ---
echo -e "\n${YELLOW}[8/8] Building and starting services...${NC}"

# Determine docker compose command
DOCKER_CMD="docker compose"
if ! $DOCKER_CMD version &> /dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
fi

# Check if we need sudo for docker
if ! docker ps &> /dev/null 2>&1; then
    echo -e "  ${YELLOW}Using sudo for Docker...${NC}"
    DOCKER_CMD="sudo $DOCKER_CMD"
fi

$DOCKER_CMD build --pull
$DOCKER_CMD up -d

# --- 8. Health check ---
echo -e "\n${YELLOW}Running health checks...${NC}"
sleep 10

echo -n "  PostgreSQL: "
if $DOCKER_CMD exec alpha-postgres pg_isready -U onepa &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (may still be starting)${NC}"
fi

echo -n "  Backend: "
for i in $(seq 1 30); do
    if curl -sf http://localhost:8182/api/health &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⏳ Still starting (check: docker compose logs backend)${NC}"
    fi
    sleep 2
done

echo -n "  Frontend: "
if curl -sf http://localhost:3011 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Still starting${NC}"
fi

echo -n "  MediaMTX (RTMP 1935): "
if timeout 2 bash -c "echo > /dev/tcp/localhost/1935" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Not yet available${NC}"
fi

echo -n "  MediaMTX (HLS 8888): "
if curl -sf http://localhost:8888 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Not yet available${NC}"
fi

# --- Done ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment Complete!                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Application:  ${CYAN}http://$(hostname -I | awk '{print $1}'):3011${NC}"
echo -e "  📡 RTMP:          ${CYAN}rtmp://$(hostname -I | awk '{print $1}'):1935/live/master${NC}"
echo -e "  📺 HLS:           ${CYAN}http://$(hostname -I | awk '{print $1}'):8888/hls/stream.m3u8${NC}"
echo -e "  🔗 SRT:           ${CYAN}srt://$(hostname -I | awk '{print $1}'):8890${NC}"
echo -e "  🔧 Backend API:   ${CYAN}http://$(hostname -I | awk '{print $1}'):8182/api${NC}"
echo ""
echo -e "  Default login: ${YELLOW}admin / admin${NC} (change immediately!)"
echo ""
