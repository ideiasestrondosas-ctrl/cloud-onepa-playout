#!/bin/bash

# ONEPA Playout PRO - Universal Installer (Linux/macOS)
# This script installs the application using Docker and Docker Compose.

set -e

echo "🚀 Iniciando instalação do ONEPA Playout PRO..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

# 2. Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose (V2) não encontrado. Por favor, instale-o."
    exit 1
fi

# 3. Create necessary directories
echo "📁 Criando diretórios de armazenamento..."
mkdir -p data/postgres data/media data/thumbnails data/playlists data/assets/protected

# 4. Build and Start
echo "🏗️ Construindo containers... (Isto pode demorar uns minutos)"
docker compose build --pull

echo "⚡ Iniciando serviços..."
docker compose up -d

echo ""
echo "✅ Instalação concluída com sucesso!"
echo "--------------------------------------------------"
echo "🌐 Acesso ao Painel: http://localhost:3000"
echo "🔑 Login padrão: admin / admin"
echo "📡 Link HLS (VLC): http://localhost:3000/hls/stream.m3u8"
echo "--------------------------------------------------"
echo ""
echo "Dica: Use './scripts/update.sh' para atualizar ou resetar o sistema."
