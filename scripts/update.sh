#!/bin/bash

# ONEPA Playout PRO - Update Script
# Version: 2.2.0-ALPHA.5-PRO

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parameters
FULL_RESET=false
if [[ "$1" == "--full-reset" ]]; then
    FULL_RESET=true
fi

echo -e "${GREEN}🔄 Iniciando Atualização do Sistema...${NC}"

# --- 0. Full Reset Logic ---
if [ "$FULL_RESET" = true ]; then
    echo -e "${RED}⚠️ MODO FULL RESET ATIVADO!${NC}"
    echo "Isso irá apagar TODOS os dados e volumes persistentes."
    read -p "Tem certeza? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        echo -e "${YELLOW}🧹 Limpando volumes e containers...${NC}"
        DOCKER_CMD="docker compose"
        if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi
        $DOCKER_CMD down -v --remove-orphans 2>/dev/null || true
        rm -rf data .env 2>/dev/null || true
    else
        echo "Reset cancelado."
        exit 0
    fi
fi

# Check for Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não encontrado. Instale o Git para continuar a atualização.${NC}"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Verifique se o Docker Desktop está rodando.${NC}"
    exit 1
fi

# Check for .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado. Execute o install.sh primeiro.${NC}"
    exit 1
fi

# Load variables
source .env
BRANCH=${DEPLOY_BRANCH:-"alpha"}
REPO=${DEPLOY_REPO:-"ideiasestrondosas-ctrl/cloud-onepa-playout"}

echo -e "Configuração: Branch ${YELLOW}$BRANCH${NC} do repositório ${YELLOW}$REPO${NC}"

# 1. Cleanup old source if exists
TEMP_DIR="onepa_update_$(date +%s)"
mkdir -p "$TEMP_DIR"

# 2. Get latest code
echo -e "\n${YELLOW}⬇️ Buscando atualizações...${NC}"
# Note: This assumes the user has set up SSH or a credential helper for Git
git clone -b "$BRANCH" "https://github.com/$REPO.git" "$TEMP_DIR"

# 3. Apply Updates
echo -e "\n${YELLOW}🏗️ Reconstruindo Contentores...${NC}"
# Copy new docker-compose and scripts to root
cp "$TEMP_DIR/docker-compose.yml" ./
cp -r "$TEMP_DIR/scripts" ./

DOCKER_CMD="docker compose"
# Permission Check (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! docker ps &> /dev/null; then
        echo -e "${YELLOW}[WARN] Permissão negada ao socket do Docker. Usando 'sudo'...${NC}"
        DOCKER_CMD="sudo $DOCKER_CMD"
    fi
fi

$DOCKER_CMD build --pull
$DOCKER_CMD up -d

# 4. Cleanup
echo -e "\n${YELLOW}🧹 Finalizando limpeza...${NC}"
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}✨ Sistema atualizado com sucesso!${NC}"
echo "🌐 Acesso: http://localhost:3011"
echo ""
