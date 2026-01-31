# Cloud Onepa Playout - Guia de Deploy

## 📦 Pré-requisitos

### Sistema

- Docker 20.10+
- Docker Compose 2.0+

### Hardware Mínimo (720p/1080p Básico)

- **CPU**: 4 Cores (Intel i5 6th Gen ou equivalente)
- **RAM**: 8GB DDR4
- **Storage**: SSD 20GB+ (Sistema), HDD para Media
- **GPU**: Opcional (Software Encoding)

### Hardware Recomendado (1080p High Bitrate / 4K)

- **CPU**: 8 Cores (Intel i7 10th Gen / Ryzen 7 3000+)
- **RAM**: 16GB DDR4
- **Storage**: NVMe 100GB+ (Sistema/Cache), HDD/NAS para Media
- **GPU**: NVIDIA GTX 1660 / RTX Series (Necessário para NVENC HW Accel)

### Opcional (Deploy Manual)

- Rust 1.75+
- Node.js 18+
- PostgreSQL 16+
- FFmpeg 7.2+

---

## 🚀 Deploy com Docker (Recomendado)

### 1. Preparação

```bash
# Clone o repositório
git clone https://github.com/your-org/cloud-onepa-playout.git
cd cloud-onepa-playout

# Copiar ficheiro de ambiente
cp backend/.env.example backend/.env
```

### 2. Configurar Variáveis de Ambiente

Editar `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://onepa:onepa@db:5432/onepa_playout

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=86400

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Storage
MEDIA_PATH=/var/lib/onepa-playout/media
THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails
PLAYLISTS_PATH=/var/lib/onepa-playout/playlists
FILLERS_PATH=/var/lib/onepa-playout/fillers
```

### 3. Build e Start

```bash
# Build das imagens
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 4. Verificar Deploy

```bash
# Verificar containers
docker-compose ps

# Deve mostrar:
# - db (PostgreSQL) - healthy
# - backend (Rust API) - healthy
# - frontend (Nginx) - running

# Testar API
curl http://localhost:8080/api/health

# Aceder frontend
open http://localhost:3000
```

### 5. Credenciais Padrão

```
Username: admin
Password: admin
```

**⚠️ IMPORTANTE:** Alterar password após primeiro login!

---

## 🔧 Deploy Manual

### Backend (Rust)

```bash
cd backend

# Instalar dependências
cargo build --release

# Executar migrations
sqlx migrate run

# Iniciar servidor
./target/release/onepa-playout
```

### Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Build para produção
npm run build

# Servir com Nginx ou outro servidor
# Os ficheiros estão em: dist/
```

### PostgreSQL

```bash
# Criar database
createdb onepa_playout

# Executar migrations
psql onepa_playout < backend/migrations/001_create_users.sql
psql onepa_playout < backend/migrations/002_create_media.sql
psql onepa_playout < backend/migrations/003_create_playlists.sql
psql onepa_playout < backend/migrations/004_create_schedule.sql
```

---

## 🌐 Deploy em Produção

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name playout.example.com;

    # Frontend
    location / {
        root /var/www/onepa-playout;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL com Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d playout.example.com

# Renovação automática
sudo certbot renew --dry-run
```

---

## 📊 Monitorização

### Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Logs do sistema (manual deploy)
tail -f /var/log/onepa-playout/backend.log
```

### Health Checks

```bash
# API Health
curl http://localhost:8080/api/health

# Database
docker-compose exec db pg_isready

# Disk Space
df -h /var/lib/onepa-playout
```

---

## 🔄 Backup e Restore

### Backup Database

```bash
# Docker
docker-compose exec db pg_dump -U onepa onepa_playout > backup.sql

# Manual
pg_dump onepa_playout > backup.sql
```

### Backup Media

```bash
# Backup de media files
tar -czf media-backup.tar.gz /var/lib/onepa-playout/media
```

### Restore

---

## 💻 Instalação em Diferentes Sistemas

### Linux (Ubuntu/Debian) - Automatizado

Use o script fornecido na pasta `scripts/`:

```bash
cd scripts
chmod +x install_linux.sh
./install_linux.sh
```

### Docker (Todas as Plataformas)

A forma mais segura e isolada:

```bash
# Windows (WSL2), Mac ou Linux
cd scripts
chmod +x setup_docker.sh
./setup_docker.sh
```

### Windows Nativo (Sem Docker)

1. Instalar [Rust](https://rustup.rs/)
2. Instalar [Node.js](https://nodejs.org/)
3. Instalar [PostgreSQL](https://www.postgresql.org/download/windows/)
4. Instalar [FFmpeg](https://ffmpeg.org/download.html) (Adicionar ao PATH)
5. Seguir os passos de "Deploy Manual" acima, usando PowerShell.

### macOS

1. `brew install rust node postgresql ffmpeg`
2. Iniciar serviço Postgres: `brew services start postgresql`
3. Seguir "Deploy Manual".

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose logs backend

# Verificar portas
netstat -tulpn | grep 8080

# Reiniciar serviços
docker-compose restart
```

### Database connection error

```bash
# Verificar se PostgreSQL está running
docker-compose ps db

# Testar conexão
docker-compose exec backend psql $DATABASE_URL

# Verificar migrations
docker-compose exec backend sqlx migrate info
```

### Upload de ficheiros falha

```bash
# Verificar permissões
ls -la /var/lib/onepa-playout/media

# Criar diretórios se necessário
mkdir -p /var/lib/onepa-playout/{media,thumbnails,playlists,fillers}
chmod 755 /var/lib/onepa-playout/*
```

---

## 📈 Performance Tuning

### PostgreSQL

```sql
-- Aumentar connections
ALTER SYSTEM SET max_connections = 200;

-- Aumentar shared buffers
ALTER SYSTEM SET shared_buffers = '256MB';

-- Reload config
SELECT pg_reload_conf();
```

### Nginx

```nginx
# Aumentar client_max_body_size para uploads grandes
client_max_body_size 2G;

# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## 🔐 Segurança

### Firewall

```bash
# Permitir apenas portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### Alterar Credenciais Padrão

```sql
-- Alterar password do admin
UPDATE users
SET password_hash = '$2b$12$NEW_HASH_HERE'
WHERE username = 'admin';
```

---

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET alterado
- [ ] Database criada e migrations executadas
- [ ] Diretórios de storage criados
- [ ] Permissões de ficheiros corretas
- [ ] Nginx configurado
- [ ] SSL configurado (produção)
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitorização configurada
- [ ] Password admin alterada
- [ ] Testes de smoke realizados

---

**Última atualização:** 2026-01-09
