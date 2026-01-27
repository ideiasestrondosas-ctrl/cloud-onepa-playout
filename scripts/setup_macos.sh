#!/bin/bash

# ONEPA Playout PRO - macOS Setup Wrapper
# This script checks for Docker Desktop and Homebrew, then launches the installer.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🍎 ONEPA Playout PRO - macOS Total Automation Setup${NC}"

# 1. Dependency Check
if ! command -v "docker" &> /dev/null; then
    echo -e "${YELLOW}🐳 Docker não encontrado. Verificando se o Docker Desktop está instalado...${NC}"
    if [ -d "/Applications/Docker.app" ]; then
        echo -e "${GREEN}✅ Docker Desktop encontrado. Por favor, certifique-se que está a correr.${NC}"
    else
        echo -e "${RED}❌ Docker Desktop não encontrado.${NC}"
        echo "➡️  Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
fi

if ! command -v "git" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git não encontrado. Tentando instalar via ferramentas da Apple...${NC}"
    xcode-select --install || echo "Siga as instruções no ecrã para instalar as Developer Tools."
fi

# 2. Run Main Installer
echo -e "\n${GREEN}🚀 Iniciando instalador principal...${NC}"
chmod +x scripts/install.sh
./scripts/install.sh
