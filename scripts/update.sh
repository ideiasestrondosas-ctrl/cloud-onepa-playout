#!/bin/bash

# ============================================================================
# ONEPA Playout PRO - Update Script (Existing VM)
# Version: v2.2.0-ALPHA.23-PRO (2026-02-19)
#
# Usage:
#   bash update.sh              # Standard update (preserves data)
#   bash update.sh --clean      # Clean software update (purges code, preserves data)
#   bash update.sh --full-reset # Full reset (DELETES ALL DATA)
#
# This script updates the application on an existing running VM.
# It preserves all media, database, thumbnails, and playlists (unless --full-reset).
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Determin OS and SUDO
OS_TYPE="unknown"
SUDO=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    if [ "$EUID" -ne 0 ]; then SUDO="sudo"; fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
fi

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_err() { echo -e "${RED}[ERROR] $1${NC}"; }

# Parameters
FULL_RESET=false
CLEAN_UPDATE=false
for arg in "$@"; do
    if [[ "$arg" == "--full-reset" ]]; then FULL_RESET=true; fi
    if [[ "$arg" == "--clean" ]]; then CLEAN_UPDATE=true; fi
done

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ONEPA Playout PRO — Update System       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# --- 0. Full Reset Logic ---
if [ "$FULL_RESET" = true ]; then
    echo -e "${RED}⚠️  MODO FULL RESET ATIVADO!${NC}"
    echo -e "${RED}Isto irá APAGAR TODOS os dados: media, base de dados, thumbnails.${NC}"
    read -p "Tem certeza? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        echo -e "${YELLOW}🧹 Parando e removendo containers e volumes...${NC}"
        DOCKER_CMD="docker compose"
        if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi
        if ! docker ps &> /dev/null 2>&1; then DOCKER_CMD="sudo $DOCKER_CMD"; fi
        $DOCKER_CMD down -v --remove-orphans 2>/dev/null || true
        rm -rf data 2>/dev/null || true
        echo -e "${GREEN}Reset completo. A continuar com instalação limpa...${NC}"
    else
        echo "Reset cancelado."
        exit 0
    fi
fi

# --- 1. Pre-flight checks ---
echo -e "${YELLOW}[1/7] Verificações de pré-voo...${NC}"

# Check disk space
FREE_SPACE_KB=$(df -k / | tail -1 | awk '{print $4}' 2>/dev/null || echo "10000000")
FREE_SPACE_MB=$((FREE_SPACE_KB / 1024))
if [ "$FREE_SPACE_MB" -lt 1024 ]; then
    log_err "CRÍTICO: Espaço insuficiente em disco (${FREE_SPACE_MB}MB)."
    log_warn "O build do Docker IRÁ falhar nesta condição."
    exit 1
elif [ "$FREE_SPACE_MB" -lt 5120 ]; then
    log_warn "Aviso: Espaço limitado (${FREE_SPACE_MB}MB). Recomendado: 5GB+"
fi

# Hardware check (CPU/RAM)
CPU_CORES=$(grep -c ^processor /proc/cpuinfo 2>/dev/null || echo "1")
TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}' 2>/dev/null || echo "1000000")
TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024))

log_info "Recursos: ${CPU_CORES} Cores | ${TOTAL_MEM_GB}GB RAM | ${FREE_SPACE_MB}MB Disco livre"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não encontrado. Instale: sudo apt install git${NC}"
    exit 1
fi
echo -e "  Git: ${GREEN}✓${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Execute deploy_new_vm.sh primeiro.${NC}"
    exit 1
fi
echo -e "  Docker: ${GREEN}✓${NC}"

# Determine docker compose command
DOCKER_CMD="docker compose"
if ! $DOCKER_CMD version &> /dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
fi
if ! docker ps &> /dev/null 2>&1; then
    DOCKER_CMD="sudo $DOCKER_CMD"
fi

# --- 2. Check .env ---
echo -e "\n${YELLOW}[2/7] Verificando configuração...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}  .env não encontrado. Criando com valores padrão...${NC}"
    cat > .env << 'ENV'
POSTGRES_DB=onepa_playout
POSTGRES_USER=onepa
POSTGRES_PASSWORD=onepa
JWT_SECRET=onepa-production-secret-change-me
DEPLOY_REPO=ideiasestrondosas-ctrl/cloud-onepa-playout
DEPLOY_BRANCH=alpha
ENV
fi
source .env
BRANCH=${DEPLOY_BRANCH:-"alpha"}
REPO=${DEPLOY_REPO:-"ideiasestrondosas-ctrl/cloud-onepa-playout"}

# Fallback for "local" misconfiguration (applies to both pull and clean clone)
if [ "$BRANCH" == "local" ] || [ -z "$BRANCH" ]; then
    if [ -d ".git" ]; then
        DETECTED_BRANCH=$(git branch --show-current 2>/dev/null)
        BRANCH=${DETECTED_BRANCH:-"alpha"}
    else
        BRANCH="alpha"
    fi
fi
if [ "$REPO" == "local" ] || [ -z "$REPO" ]; then
    REPO="ideiasestrondosas-ctrl/cloud-onepa-playout"
fi

echo -e "  Branch: ${CYAN}$BRANCH${NC} | Repo: ${CYAN}$REPO${NC}"

# --- 3. Backup info ---
echo -e "\n${YELLOW}[3/7] Dados preservados (NÃO serão apagados):${NC}"
if [ -d "data/media" ]; then
    MEDIA_COUNT=$(find data/media -type f 2>/dev/null | wc -l)
    echo -e "  📁 Media: ${GREEN}${MEDIA_COUNT} ficheiros${NC}"
fi
if [ -d "data/postgres" ]; then
    PG_SIZE=$(du -sh data/postgres 2>/dev/null | cut -f1)
    echo -e "  🗄️ Database: ${GREEN}${PG_SIZE}${NC}"
fi
if [ -d "data/thumbnails" ]; then
    THUMB_COUNT=$(find data/thumbnails -type f 2>/dev/null | wc -l)
    echo -e "  🖼️ Thumbnails: ${GREEN}${THUMB_COUNT} ficheiros${NC}"
fi

# --- 4. Stop and remove services to prevent name conflicts ---
echo -e "\n${YELLOW}[4/7] Parando serviços em execução...${NC}"

# Function to remove all onepa/alpha containers and reset network
nuclear_ghost_cleanup() {
    log_warn "🧪 Realizando limpeza de containers antigos e rede..."
    GHOSTS=$(docker ps -aq --filter name=alpha --filter name=onepa)
    if [ -n "$GHOSTS" ]; then
        echo -e "  Removendo containers encontrados: $GHOSTS"
        docker rm -f $GHOSTS 2>/dev/null || sudo docker rm -f $GHOSTS 2>/dev/null || true
    fi
    
    # Force remove network to clear IP locks (Sync with install.sh)
    echo -e "  Resetando rede virtual..."
    docker network rm alpha-network 2>/dev/null || sudo docker network rm alpha-network 2>/dev/null || true
}

# Use down instead of stop to properly remove containers (preserving volumes)
$DOCKER_CMD down 2>/dev/null || true
nuclear_ghost_cleanup

echo -e "  ${GREEN}Serviços removidos ✓${NC}"

# --- 5. Pull or Re-clone latest code ---
echo -e "\n${YELLOW}[5/7] Atualizando código...${NC}"

# Add safe directory fix for Linux VMs
if command -v git &>/dev/null; then
    git config --global --add safe.directory "$(pwd)" 2>/dev/null || true
fi

if [ "$CLEAN_UPDATE" = true ]; then
    echo -e "${RED}⚠️  MODO CLEAN UPDATE: Purgando ficheiros da aplicação (preservando dados)...${NC}"
    # Backup .env safely
    if [ -f .env ]; then cp .env .env.bak; fi
    
    # Remove everything except data/, .env.bak and update.sh
    # We use a safer approach: remove specific known directories
    $SUDO rm -rf backend frontend docker migrations scripts systemd 2>/dev/null || true
    $SUDO rm -f install.sh uninstall.sh README.md docker-compose.yml 2>/dev/null || true
    $SUDO rm -rf .git 2>/dev/null || true

    echo -e "  Purgado concluído. A clonar repositório... ✓"
    TEMP_DIR="onepa_clean_$(date +%s)"
    git clone -b "$BRANCH" "https://github.com/$REPO.git" "$TEMP_DIR"
    
    echo "Restaurando ficheiros da nova versão..."
    $SUDO cp -r "$TEMP_DIR/." .
    $SUDO rm -rf "$TEMP_DIR"
    
    # Restore .env
    if [ -f .env.bak ]; then $SUDO mv .env.bak .env; fi
    echo -e "  ${GREEN}Código re-clonado com sucesso ✓${NC}"

elif [ -d ".git" ]; then
    # We're in a git repo, just pull
    echo -e "  Repositório Git detectado. A fazer pull..."
    
    # Ensure remote origin exists
    if ! git remote get-url origin &>/dev/null; then
        echo -e "  ${YELLOW}⚠️  Remote 'origin' não encontrado. Usando primeiro remote disponível...${NC}"
        REMOTE=$(git remote | head -n 1)
        if [ -z "$REMOTE" ]; then
            echo -e "  ${RED}❌ Nenhum remote git encontrado.${NC}"
            exit 1
        fi
    else
        REMOTE="origin"
    fi

    git fetch "$REMOTE" "$BRANCH"
    git reset --hard "$REMOTE/$BRANCH"
    echo -e "  ${GREEN}Código atualizado via git pull ($REMOTE/$BRANCH) ✓${NC}"
else
    # No git repo, clone into temp and copy
    echo -e "  Sem repositório Git. A clonar código atualizado..."
    TEMP_DIR="onepa_update_$(date +%s)"
    git clone -b "$BRANCH" "https://github.com/$REPO.git" "$TEMP_DIR"
    
    # Copy new files (preserve data directories)
    $SUDO cp "$TEMP_DIR/docker-compose.yml" ./
    $SUDO cp -r "$TEMP_DIR/docker" ./
    $SUDO cp -r "$TEMP_DIR/backend" ./
    $SUDO cp -r "$TEMP_DIR/frontend" ./
    $SUDO cp -r "$TEMP_DIR/scripts" ./
    
    $SUDO rm -rf "$TEMP_DIR"
    echo -e "  ${GREEN}Código copiado ✓${NC}"
fi

# --- 6. Rebuild and restart ---
echo -e "\n${YELLOW}[6/7] Reconstruindo containers...${NC}"

BUILD_OPTS="--pull"
if [ "$FULL_RESET" = true ] || [ "$CLEAN_UPDATE" = true ]; then
    echo -e "  ${YELLOW}Usando --no-cache para rebuild limpo...${NC}"
    BUILD_OPTS="--pull --no-cache"
    export CACHE_BUST=$(date +%s)
fi

$DOCKER_CMD build $BUILD_OPTS
echo -e "  ${GREEN}Build concluído ✓${NC}"

echo -e "\n${YELLOW}  Iniciando serviços...${NC}"
$DOCKER_CMD up -d
echo -e "  ${GREEN}Serviços iniciados ✓${NC}"

# --- 7. Health checks ---
echo -e "\n${YELLOW}[7/7] Verificações de saúde...${NC}"
sleep 5

echo -n "  PostgreSQL: "
for i in $(seq 1 15); do
    if $DOCKER_CMD exec alpha-postgres pg_isready -U "${POSTGRES_USER:-onepa}" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 15 ]; then echo -e "${YELLOW}⏳ Ainda a iniciar${NC}"; fi
    sleep 2
done

echo -n "  Backend: "
for i in $(seq 1 45); do
    if curl -sf http://localhost:8182/api/health &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 45 ]; then echo -e "${YELLOW}⏳ Ainda a iniciar (ver: $DOCKER_CMD logs backend)${NC}"; fi
    sleep 2
done

echo -n "  Frontend: "
if curl -sf http://localhost:3011 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Ainda a iniciar${NC}"
fi

echo -n "  RTMP (1935): "
if timeout 2 bash -c "echo > /dev/tcp/localhost/1935" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Ainda não acessível${NC}"
fi

echo -n "  HLS (8888): "
if curl -sf http://localhost:8888 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ Ainda não acessível${NC}"
fi

echo -n "  SRT (8890): "
if timeout 2 bash -c "echo > /dev/udp/localhost/8890" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⏳ UDP — verificação limitada${NC}"
fi

# --- Summary ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Atualização Concluída!                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Aplicação:     ${CYAN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3011${NC}"
echo -e "  📡 RTMP:          ${CYAN}rtmp://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):1935/live/master${NC}"
echo -e "  📺 HLS:           ${CYAN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):8888/hls/stream.m3u8${NC}"
echo -e "  🔗 SRT:           ${CYAN}srt://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):8890${NC}"
echo ""
echo -e "  ${YELLOW}Rollback: git checkout HEAD~1 && $DOCKER_CMD build && $DOCKER_CMD up -d${NC}"
echo ""
