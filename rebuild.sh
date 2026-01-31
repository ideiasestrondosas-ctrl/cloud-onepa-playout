#!/bin/bash

echo "🔄 Parando containers..."
docker-compose down

echo "🏗️  Reconstruindo e iniciando containers..."
docker-compose up --build -d

echo "⏳ Aguardando containers ficarem prontos..."
sleep 5

echo "✅ Pronto! Aplicação disponível em http://localhost:3000"
echo ""
echo "💡 Dica: Se ainda vir versão antiga no browser:"
echo "   - Chrome: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)"
echo "   - Firefox: Ctrl+F5 (ou Cmd+Shift+R no Mac)"
echo "   - Safari: Cmd+Option+R"
