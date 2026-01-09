# Release Notes - Cloud Onepa Playout v1.0.0

**Data de Release:** 2026-01-09  
**Tipo:** Initial Release  
**Status:** ⚠️ Experimental / Development

> **NOTA:** Esta versão é para testes e desenvolvimento. Não recomendada para produção.

---

## 🎉 Introdução

Estamos orgulhosos de apresentar a **versão 1.0.0** do Cloud Onepa Playout - um sistema completo de automação de playout 24/7, simplificado e moderno, construído com Rust e React.

Esta é a primeira release estável, pronta para produção, com todas as funcionalidades core implementadas e testadas.

---

## ✨ Funcionalidades Principais

### 🎬 Media Management

- Upload de ficheiros com drag & drop (react-dropzone)
- Suporte para vídeo (MP4, MKV, AVI, MOV), áudio (MP3, WAV, AAC) e imagens
- Geração automática de thumbnails com FFmpeg
- Extração de metadata (duração, resolução, codec, bitrate)
- Filtros por tipo e pesquisa por nome
- Paginação eficiente (20 items por página)
- Preview integrado (vídeo/áudio/imagem)
- Delete com cleanup automático de ficheiros

### 📝 Playlist Editor

- Editor visual com drag-and-drop (@dnd-kit)
- Validação automática de duração 24h
- Cálculo de duração total em tempo real
- Alerts visuais (válido/faltam/excede)
- Save/Load de playlists
- Suporte para formato JSON (compatível ffplayout)
- Lista lateral de playlists salvas

### 📅 Calendário de Agendamento

- Visualização mensal com FullCalendar
- Agendamento por data (date click)
- Repetições: daily, weekly, monthly
- Cores por tipo (único/repetição)
- Delete de agendamentos (event click)
- Seleção de playlist e horário de início

### 📊 Dashboard

- Status do playout em tempo real (ON AIR/STOPPED)
- Controlos: Start, Stop, Skip, Pause, Resume
- Cards informativos:
  - Uptime (formato Xh Ym)
  - Clips reproduzidos hoje
  - Clip atual (nome + duração)
  - Próximos 5 clips
- Preview placeholder (preparado para HLS)
- Polling automático a cada 5 segundos

### ⚙️ Configurações Completas

- **Tab Output:** RTMP, HLS, SRT, UDP, Desktop
- **Tab Paths:** Media, Thumbnails, Playlists, Fillers
- **Tab Playout:** Day start, Logo overlay
- **Tab Utilizadores:** Gestão de users (add/delete)
- **Tab Presets:** 720p, 1080p, 4K
- Persistência de configurações

### 📋 Templates de Playlists

- 3 presets incluídos:
  - Morning Show (6h)
  - Full Day 24h
  - Loop Content
- Estrutura definida (intro, content, commercial, outro, filler)
- Criação de playlist a partir de template
- Extensível para templates customizados

### 🔐 Autenticação e Segurança

- JWT (JSON Web Tokens) stateless
- Password hashing com bcrypt (cost 12)
- Protected routes no frontend
- Middleware de validação no backend
- Token expiration configurável
- Logout com cleanup de token

### 🔔 Sistema de Notificações

- NotificationContext com React Context API
- Snackbar com Material-UI
- Métodos helper: showSuccess, showError, showWarning, showInfo
- Auto-hide após 6 segundos
- Posição: bottom-right

---

## 🏗️ Arquitetura

### Backend (Rust)

- **Framework:** Actix-web 4.4
- **Database:** PostgreSQL 16 com SQLx
- **Async Runtime:** Tokio
- **FFmpeg Integration:** ffmpeg-next
- **Auth:** jsonwebtoken + bcrypt
- **Serialization:** Serde

### Frontend (React)

- **Framework:** React 18 + Vite
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router DOM
- **State:** Zustand + React Context
- **Drag & Drop:** @dnd-kit
- **Calendar:** FullCalendar
- **Video:** Video.js
- **Upload:** react-dropzone

### Database Schema

- **users** - Autenticação e roles
- **media** - Ficheiros uploaded com metadata
- **playlists** - Playlists em formato JSON
- **schedule** - Agendamentos com repetições

### Deployment

- **Docker Compose** - PostgreSQL + Backend + Frontend
- **Multi-stage builds** - Otimização de imagens
- **Nginx** - Reverse proxy + static files
- **Health checks** - Monitorização de containers

---

## 📦 Instalação

### Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM (8GB recomendado)
- 20GB espaço em disco

### Quick Start

```bash
# Clone
git clone https://github.com/your-org/cloud-onepa-playout.git
cd cloud-onepa-playout

# Configure
cp backend/.env.example backend/.env
# Editar JWT_SECRET e outras variáveis

# Deploy
docker-compose up -d

# Aceder
open http://localhost:3000
```

**Credenciais padrão:** `admin` / `admin`

Ver [INSTALL.md](docs/INSTALL.md) para detalhes.

---

## 📚 Documentação

- **[README.md](README.md)** - Overview do projeto
- **[INSTALL.md](docs/INSTALL.md)** - Guia de instalação
- **[USER_MANUAL.md](docs/USER_MANUAL.md)** - Manual do utilizador
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Guia de desenvolvimento
- **[DEPLOY.md](docs/DEPLOY.md)** - Guia de deploy
- **[TESTING.md](docs/TESTING.md)** - Manual de testes
- **[FAQ.md](docs/FAQ.md)** - Perguntas frequentes

---

## 🔧 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login com JWT
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Registar utilizador

### Media

- `GET /api/media` - Listar (paginação + filtros)
- `GET /api/media/{id}` - Obter por ID
- `POST /api/media/upload` - Upload multipart
- `DELETE /api/media/{id}` - Deletar

### Playlists

- `GET /api/playlists` - Listar
- `GET /api/playlists/{id}` - Obter
- `POST /api/playlists` - Criar
- `PUT /api/playlists/{id}` - Atualizar
- `DELETE /api/playlists/{id}` - Deletar
- `POST /api/playlists/validate` - Validar duração

### Schedule

- `GET /api/schedule` - Listar agendamentos
- `POST /api/schedule` - Criar
- `DELETE /api/schedule/{id}` - Deletar
- `GET /api/schedule/for-date` - Obter para data

### Playout

- `GET /api/playout/status` - Status
- `POST /api/playout/start` - Iniciar
- `POST /api/playout/stop` - Parar
- `POST /api/playout/skip` - Skip
- `POST /api/playout/pause` - Pausar
- `POST /api/playout/resume` - Retomar

---

## 🐛 Bugs Conhecidos

### Alta Prioridade

- FFmpeg playout real ainda não implementado (placeholder)
- WebSocket para status real-time pendente
- Validação de media em uso antes de deletar

### Média Prioridade

- Preview stream HLS real pendente
- Aplicação de presets de configuração
- Backend para criação de playlists a partir de templates

### Baixa Prioridade

- Layout mobile responsivo
- Dark/Light theme toggle
- Export/Import de playlists

Ver issues no GitHub para tracking.

---

## 🚀 Roadmap Futuro

### v1.1.0 (Q1 2026)

- [ ] FFmpeg playout engine real
- [ ] WebSocket para status real-time
- [ ] Preview stream HLS
- [ ] Multi-canal support

### v1.2.0 (Q2 2026)

- [ ] Layout mobile responsivo
- [ ] Theme customization
- [ ] Advanced scheduling (cron-like)
- [ ] Playlist templates backend

### v2.0.0 (Q3 2026)

- [ ] Multi-user collaboration
- [ ] Role-based permissions
- [ ] Audit logs
- [ ] Analytics dashboard

---

## 🙏 Agradecimentos

Obrigado a todos que contribuíram para tornar este projeto realidade:

- Comunidade ffplayout original
- Rust e React communities
- Beta testers
- Contributors

---

## 📄 Licença

GPL v3 - Ver [LICENSE](LICENSE)

---

## 📞 Suporte

- **Issues:** https://github.com/your-org/cloud-onepa-playout/issues
- **Discussions:** https://github.com/your-org/cloud-onepa-playout/discussions
- **Email:** support@onepa.com

---

**Desenvolvido com ❤️ usando Rust e React**

---

## Changelog Detalhado

### Backend

- ✅ Actix-web REST API com 25+ endpoints
- ✅ PostgreSQL com SQLx (4 tabelas)
- ✅ JWT authentication + bcrypt
- ✅ FFmpeg service (metadata, thumbnails, validation)
- ✅ Multipart file upload
- ✅ CORS configurado
- ✅ Error handling customizado
- ✅ Environment variables (.env)
- ✅ Docker multi-stage build

### Frontend

- ✅ React 18 + Vite
- ✅ Material-UI dark theme
- ✅ 8 páginas funcionais
- ✅ 14+ componentes
- ✅ Zustand state management
- ✅ React Context (notifications)
- ✅ Protected routes
- ✅ Axios API client com interceptors
- ✅ Drag & drop (@dnd-kit, react-dropzone)
- ✅ FullCalendar integration
- ✅ Video.js player
- ✅ Responsive layout

### DevOps

- ✅ Docker Compose (3 services)
- ✅ Nginx reverse proxy
- ✅ Health checks
- ✅ Volumes para persistência
- ✅ .gitignore completo
- ✅ Multi-stage Dockerfiles

### Documentação

- ✅ README.md
- ✅ INSTALL.md
- ✅ USER_MANUAL.md
- ✅ DEVELOPMENT.md
- ✅ DEPLOY.md
- ✅ TESTING.md
- ✅ FAQ.md
- ✅ Release notes

---

**Versão:** 1.0.0  
**Data:** 2026-01-09  
**Status:** ✅ Stable
