# Cloud Onepa Playout

**Sistema de Automação de Playout 24/7 para Streaming de Vídeo**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Version](https://img.shields.io/badge/Version-2.6.0-ALPHA.56-PRO-blue.svg)](https://github.com/onepa/cloud-onepa-playout)
[![Status](https://img.shields.io/badge/Status-Stable-green.svg)](https://github.com/onepa/cloud-onepa-playout)

## 📖 Sobre

Cloud Onepa Playout é uma versão simplificada e modernizada do [ffplayout](https://github.com/ffplayout/ffplayout), focada em facilidade de uso para utilizadores finais, mantendo as funcionalidades essenciais de broadcasting 24/7.

### ✨ Principais Características

- 🎬 **Broadcasting 24/7** com FFmpeg 7.2+
- 🖱️ **Interface Visual Moderna** com React + Material-UI
- 📅 **Calendário de Agendamento** visual e intuitivo
- 🎨 **Drag & Drop** para criação de playlists
- 👁️ **Preview em Tempo Real** do conteúdo
- 🧙 **Setup Wizard Avançado**: Configuração passo-a-passo do canal, incluindo importação de mídia da biblioteca ou streams externos.
- **Identidade do Canal**: Personalização do Nome do Canal e Logótipo da Aplicação (separado da marca d'água).
- **Dashboard Pro**: Monitorização em tempo real com pré-visualização ao vivo, suporte a HLS/RTMP e diagnóstico integrado.
- **Overlay Dinâmico**: Gestão de marca d'água com posicionamento e ativação condicional.
- 🚫 **Protected Assets** - diretório protegido para ficheiros originais
- 🐳 **Docker** para deployment fácil
- 🔒 **Autenticação JWT** segura
- 🎯 **Zero-Cache** - atualizações sempre visíveis no browser

## 🚀 Quick Start

### Pré-requisitos

- Docker & Docker Compose
- FFmpeg 7.2+ (incluído no container)
- 4GB RAM mínimo
- 4 CPU cores recomendado

### Instalação com Docker

```bash
# Clone o repositório
git clone https://github.com/onepa/cloud-onepa-playout.git
cd cloud-onepa-playout

# Inicie os serviços
docker-compose up -d --build

# Aceda à interface web
open http://localhost:3010

# Verifique o backend
curl http://localhost:8182/api/health
```

### Portas Padrão (Ambiente ALPHA)

- **Frontend**: 3010 (Local) / 3011 (Docker)
- **Backend API**: 8181 (Local) / 8182 (Docker)
- **Database**: 5534 (Docker Host)
- **MediaMTX RTMP**: 2035 (Local) / 2036 (Docker)

### Instalação Manual

Ver [docs/INSTALL.md](docs/INSTALL.md) para instruções detalhadas.

## 📚 Documentação

- [Guia de Instalação](docs/INSTALL.md)
- [Manual do Utilizador (Tutorial)](docs/USER_MANUAL.md)
- [Guia de Desenvolvimento (API)](docs/DEVELOPMENT.md)
- [FAQ](docs/FAQ.md)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - Dashboard                            │
│  - Media Library                        │
│  - Playlist Editor                      │
│  - Calendar                             │
└─────────────┬───────────────────────────┘
              │ REST API + WebSocket
┌─────────────▼───────────────────────────┐
│         Backend (Rust)                  │
│  - API Server                           │
│  - FFmpeg Service                       │
│  - Playlist Manager                     │
│  - Scheduler                            │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       PostgreSQL Database               │
└─────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

- **Backend**: Rust (Actix-web)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL
- **Streaming**: FFmpeg 7.2+
- **Container**: Docker + Docker Compose
- **Auth**: JWT

## 📊 Estatísticas de Desenvolvimento (v2.6.0-ALPHA.56-PRO)

Este projeto representa um esforço significativo de engenharia para criar uma solução de playout robusta e moderna.

| Métrica          | Detalhe                    | Valor                                         |
| ---------------- | -------------------------- | --------------------------------------------- |
| **Código Fonte** | Frontend (React/JSX)       | ~16000+ linhas                                |
|                  | Backend (Rust)             | ~11000+ linhas                                |
|                  | Microservices (Node/Python)| ~1500+ linhas                                 |
|                  | Total                      | **~28500+ linhas**                            |
| **Arquitetura**  | Módulos Backend (Rust)     | 38                                            |
|                  | Componentes Visuais        | 30+                                           |
|                  | Migrações de Base de Dados | 78                                            |
| **Complexidade** | Linguagens Principais      | Rust, JavaScript, Python, SQL, YAML           |
|                  | Tecnologias Core           | Tokio (Async), FFmpeg 7.2+, React 18, Whisper |
|                  | Containers                 | 9 (Backend, Frontend, Postgres, Redis, MediaMTX, Analytics, Graphics, AI, MinIO) |

## 🧪 Ambiente de Testes e Desenvolvimento

Este sistema foi desenvolvido e validado em ambientes de alta performance e virtualização profissional.

- **Desenvolvimento e Testes Locais**:
  - **Hardware**: MacBook Pro 2024 (Apple M4)
  - **Especificações**: 16GB RAM, 512GB SSD
  - **OS**: macOS tahoe (Native ARM)

- **ALPHA/Staging Testing**:
  - **Plataforma**: Virtualização Proxmox VE
  - **Hardware**: Servidor Intel Xeon (Dedicated 4 Cores)
  - **Especificações**: 4GB RAM, 80GB SSD
  - **OS**: Ubuntu 24.04 64bit (Linux 6.8.0-100-generic)

> _Dados aproximados baseados na- **Version:** v2.6.0-ALPHA.56-PRO
- **Last Update:** 2026-03-27

## 🎯 Roadmap & Future

> Ver [`docs/ROADMAP.md`](docs/ROADMAP.md) para o roadmap técnico completo com todos os detalhes.

### ✅ Fases Concluídas (Phases 25–32)

| Fase | Versão | Funcionalidade |
|------|--------|---------------|
| Phase 25 | v2.3.0-ALPHA.39 | Enterprise Foundation (Multi-Canal, Redis, WebSocket, Audit Logs) |
| Phase 26 | v2.3.0-ALPHA.40/41 | Frontend Transformation (Temas, Mobile, Analytics, Drag-and-Drop) |
| Phase 27 | v2.4.0-ALPHA.42 | Microservices (Analytics, Graphics, AI Workers) |
| Phase 28 | v2.4.0-ALPHA.43 | SCTE-35 Ad Insertion + Low-Latency HLS |
| Phase 29 | v2.5.0-ALPHA.44 | Kubernetes + MinIO S3 + CI/CD |
| Phase 30 | v2.6.0-ALPHA.45 | Live Inputs & Multi-Channel UI |
| Phase 32 | v2.6.0-ALPHA.47 | Multi-Channel Control & Scale |

### 🔜 Próximas Fases

- [ ] **Phase 32: Category Folders & Batch Playlist** _(v2.7.x)_ — Organização de media por categorias (Rock, Salsa, Merengue, Jazz, etc.) com arrastar-e-soltar de pastas inteiras para playlists + categorias personalizáveis
- [ ] **Phase 33: Live Source Switching & NDI** _(v2.8.x)_ — Comutação entre fontes ao vivo com NDI, Picture-in-Picture e switching A/B em tempo real
- [ ] **Phase 34: Audio Compliance & Multi-Track** _(v2.9.x)_ — Normalização EBU R128, faixas de áudio independentes (Original + Audiodescrição + Multilíngue), VU Meters em tempo real
- [ ] **Phase 35: Automated QC & Ingest** _(v3.0.x)_ — Controlo de qualidade automático no ingest (black frames, freeze, silêncio), thumbnails inteligentes, proxy auto-generation
- [ ] **Phase 36: FAST Channels & Monetisation** _(v3.1.x)_ — Delivery para Pluto TV / Samsung TV Plus, inserção dinâmica de publicidade (DAI), analytics de audiência
- [ ] **Phase 37: Enterprise Hardening** _(v3.2.x)_ — Redundância active-active, integração BXF/Traffic, RBAC granular, dashboard remoto read-only
- [ ] **Phase 38: Total UI/UX Redesign** _(v3.3.x)_ — Redesign total profissional com Antigravity + Stitch, MCR Dashboard 2.0 e nova arquitetura de menus
- [ ] **Phase 39: Extreme Performance Hardening** _(v3.4.x)_ — Otimização extrema para VMs de 4GB (Mimalloc, Tuning FFmpeg, PWA Caching e Kernel tuning)

### Versão Atual: v2.6.0-ALPHA.56-PRO (2026-03-27)

Ver `RELEASE_NOTES.md` e `docs/RELEASE_NOTES.md` para o detalhe de novidades e correções.

## 📄 Licença

GPL v3 - Ver [LICENSE](LICENSE) para detalhes.

## 🙏 Acknowledgments 💖

We would like to express our sincere gratitude to the following for their inspiration, tools, and platforms that made this project possible:

- **ffplayout:** For the initial inspiration and concepts in playout automation.
- **Big Buck Bunny:** (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org, for the use of Big Buck Bunny.
- **Claude Code & Anthropic:** For the advanced AI assistant capabilities.
- **Gemini & Google DeepMind:** For the powerful language models and reasoning.
- **ChatGPT & OpenAI:** For the pioneering work in AI assistance.
- **Google Antigravity:** For the cutting-edge agentic workflow environment.
- **MacOS & MacBook Pro:** For providing the robust development ecosystem and hardware excellence.

## 📧 Suporte

Para questões e suporte, abra uma [issue](https://github.com/onepa/cloud-onepa-playout/issues).

---

**Desenvolvido com ❤️ para a comunidade de broadcasting**
