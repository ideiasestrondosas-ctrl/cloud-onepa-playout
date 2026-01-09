# Cloud Onepa Playout - Instalação

## Pré-requisitos

### Opção 1: Docker (Recomendado)

- Docker 24.0+
- Docker Compose 2.0+
- 4GB RAM disponível
- 10GB espaço em disco

### Opção 2: Instalação Manual

- Rust 1.75+
- Node.js 20+
- PostgreSQL 16+
- FFmpeg 7.2+
- 4GB RAM
- 4 CPU cores

---

## Instalação com Docker

### 1. Clone o Repositório

```bash
git clone https://github.com/onepa/cloud-onepa-playout.git
cd cloud-onepa-playout
```

### 2. Configure Variáveis de Ambiente

```bash
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações
```

### 3. Inicie os Serviços

```bash
docker-compose up -d
```

### 4. Verifique os Logs

```bash
docker-compose logs -f
```

### 5. Aceda à Interface

Abra o navegador em: `http://localhost:3000`

**Credenciais padrão:**

- Username: `admin`
- Password: `admin` (altere após primeiro login!)

---

## Instalação Manual

### 1. Backend (Rust)

#### Instale Dependências

```bash
# macOS
brew install postgresql ffmpeg

# Ubuntu/Debian
sudo apt-get install postgresql ffmpeg libpq-dev pkg-config libssl-dev
```

#### Configure PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE onepa_playout;
CREATE USER onepa WITH PASSWORD 'onepa_password';
GRANT ALL PRIVILEGES ON DATABASE onepa_playout TO onepa;
\q
```

#### Compile e Execute Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações
cargo build --release
cargo run --release
```

Backend estará em: `http://localhost:8080`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend estará em: `http://localhost:5173`

---

## Verificação da Instalação

### Health Check

```bash
curl http://localhost:8080/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": "connected"
}
```

---

## Troubleshooting

### Erro: "Database connection failed"

- Verifique se PostgreSQL está a correr
- Confirme credenciais em `.env`
- Teste conexão: `psql -U onepa -d onepa_playout`

### Erro: "FFmpeg not found"

- Instale FFmpeg: `brew install ffmpeg` (macOS) ou `apt-get install ffmpeg` (Linux)
- Verifique: `ffmpeg -version`

### Porta já em uso

```bash
# Altere portas em docker-compose.yml ou .env
# Backend: SERVER_PORT=8081
# Frontend: vite.config.js -> server.port: 5174
```

---

## Próximos Passos

Após instalação bem-sucedida:

1. Leia o [Tutorial de Uso](TUTORIAL.md)
2. Configure output streams
3. Faça upload de media
4. Crie sua primeira playlist

---

## Desinstalação

### Docker

```bash
docker-compose down -v
```

### Manual

```bash
# Pare serviços
# Remova database
sudo -u postgres psql -c "DROP DATABASE onepa_playout;"
```
