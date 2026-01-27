#!/bin/bash

# ONEPA Playout PRO - Linux Setup Wrapper
# This script installs Docker and Git if missing, then launches the installer.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐧 ONEPA Playout PRO - Linux Total Automation Setup${NC}"

# 1. Dependency Check
check_and_install() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${YELLOW}⚠️  $1 não encontrado. Instalando...${NC}"
        sudo apt-get update && sudo apt-get install -y "$1" || {
            echo -e "${RED}❌ Falha ao instalar $1 automaticamente. Por favor, instale manualmente.${NC}"
            exit 1
        }
    fi
    echo -e "✅ $1: OK"
}

# Only for Debian/Ubuntu based systems for now
if command -v apt-get &> /dev/null; then
    check_and_install "git"
    check_and_install "curl"
    
    if ! command -v "docker" &> /dev/null; then
        echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker instalado. Pode ser necessário reiniciar a sessão para permissões.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Sistema não baseado em Debian/Ubuntu detetado. Verifique o Docker/Git manualmente.${NC}"
fi

# 2. Run Main Installer
echo -e "\n${GREEN}🚀 Iniciando instalador principal...${NC}"
chmod +x scripts/install.sh
./scripts/install.sh
