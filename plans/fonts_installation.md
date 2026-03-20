# Plano: Instalação de Fontes para Graphics Layers

## Problema
O container Docker não tem fontes instaladas, o que impede o filtro `drawtext` do FFmpeg de funcionar.

## Solução

### 1. Reverter a Desativação Temporária
- Reverter as alterações em `backend/src/services/engine.rs` que desativaram os graphics layers

### 2. Adicionar Fontes ao Docker
Adicionar instalação de fontes ao Dockerfile do backend:
```dockerfile
RUN apt-get update && apt-get install -y \
    fonts-freefont-ttf \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Atualizar Scripts de Instalação/Update
Adicionar instalação de fontes aos scripts:
- `scripts/install.sh` - para instalações frescas
- `scripts/update.sh` - para atualizações

### 4. Adicionar ao Dockerfile
- `docker/Dockerfile` ou `docker/Dockerfile.backend`

## Ordem de Execução
1. Reverter código em engine.rs
2. Adicionar fontes ao Dockerfile
3. Testar rebuild
4. Verificar se graphics funcionam
