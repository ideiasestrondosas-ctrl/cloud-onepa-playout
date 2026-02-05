#!/bin/bash

# ==============================================================================
# ONEPA PLAYOUT PRO - NUCLEAR UNINSTALLER (Unix)
# WARNING: THIS WILL DELETE ALL DATA, CONTAINERS AND SOURCE CODE!
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}====================================================${NC}"
echo -e "${RED}       AVISO DE REMOÇÃO TOTAL (NUCLEAR WIPE)        ${NC}"
echo -e "${RED}====================================================${NC}"
echo -e "${YELLOW}Isso irá apagar permanentemente:${NC}"
echo -e "1. Todos os containers Docker (Backend, Frontend, DB, MediaMTX)"
echo -e "2. Todos os volumes e redes Docker"
echo -e "3. Todas as imagens Docker baixadas/construídas"
echo -e "4. Todo o banco de dados e arquivos de mídia"
echo -e "5. A PRÓPRIA pasta do projeto e este script"
echo ""
read -p "Você tem CERTEZA absoluta? (s/N): " confirm

if [[ $confirm != "s" && $confirm != "S" ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo -e "\n${GREEN}[1/5] Parando e removendo containers...${NC}"
# Use recursive discovery to find all alpha/onepa containers
DOCKER_IDS=$(docker ps -aq --filter "name=alpha" --filter "name=onepa")
if [ -n "$DOCKER_IDS" ]; then
    docker rm -f $DOCKER_IDS
fi

echo -e "${GREEN}[2/5] Removendo imagens do projeto...${NC}"
DOCKER_IMAGES=$(docker images -q "*alpha*" && docker images -q "*onepa*")
if [ -n "$DOCKER_IMAGES" ]; then
    docker rmi -f $DOCKER_IMAGES 2>/dev/null || true
fi

echo -e "${GREEN}[3/5] Removendo redes e volumes...${NC}"
docker network rm alpha-network 2>/dev/null || true
docker volume prune -f --filter "label=com.docker.compose.project=onepa-playout" 2>/dev/null || true

echo -e "${GREEN}[4/5] Limpando arquivos do sistema...${NC}"
# Attempt sudo for the data folder if it exists
if [ -d "data" ]; then
    sudo rm -rf data 2>/dev/null || rm -rf data
fi

# Clear .env and other configs
rm -f .env .env.docker

echo -e "${GREEN}[5/5] AUTO-DESTRUIÇÃO...${NC}"
echo -e "${YELLOW}Removendo pasta do projeto e encerrando.${NC}"

# Navigate up to delete the folder we are in
# We use a trap or a subshell to ensure the script can delete its parent
PARENT_DIR=$(pwd)
cd ..
sudo rm -rf "$PARENT_DIR" 2>/dev/null || rm -rf "$PARENT_DIR"

echo -e "${GREEN}SISTEMA LIMPO. ATÉ LOGO!${NC}"
