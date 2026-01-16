#!/bin/bash

# ONEPA Playout PRO - Update & Reset Script
# Use: ./scripts/update.sh [--reset]

set -e

RESET_MODE=false
if [[ "$1" == "--reset" ]]; then
    RESET_MODE=true
fi

if [ "$RESET_MODE" = true ]; then
    echo "⚠️ AVISO: MODO RESET ATIVADO!"
    echo "Isto irá apagar todos os dados, playlists e configurações."
    read -p "Tem certeza? (s/N): " confirm
    if [[ $confirm != [sS] ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

echo "🔄 Iniciando atualização..."

if [ "$RESET_MODE" = true ]; then
    echo "🧹 Parando serviços e limpando dados..."
    docker compose down -v
    sudo rm -rf ./data
else
    echo "🛑 Parando serviços..."
    docker compose stop
fi

# Pull latest code (if in git)
if [ -d .git ]; then
    echo "⬇️ Baixando as últimas alterações..."
    git pull
fi

echo "🏗️ Reconstruindo containers..."
docker compose build

echo "⚡ Iniciando serviços..."
docker compose up -d

echo ""
echo "✨ Sistema atualizado com sucesso!"
if [ "$RESET_MODE" = true ]; then
    echo "♻️ O sistema foi resetado para as configurações padrão."
fi
echo "🌐 Acesso: http://localhost:3000"
