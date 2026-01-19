# Cloud Onepa Playout

**Sistema de Automação de Playout 24/7 para Streaming de Vídeo**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Version](https://img.shields.io/badge/Version-1.9.5--PRO-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Stable-green.svg)]()

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
open http://localhost:3000

# Verifique o backend
curl http://localhost:8081/api/health
```

### Portas Padrão

- **Frontend**: 3000
- **Backend API**: 8081 (ajustado para evitar conflitos com Restreamer)
- **Database**: 5432

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

## 📊 Estatísticas de Desenvolvimento (v1.9.4-PRO)

Este projeto representa um esforço significativo de engenharia para criar uma solução de playout robusta e moderna.

| Métrica          | Detalhe                    | Valor                                |
| ---------------- | -------------------------- | ------------------------------------ |
| **Código Fonte** | Frontend (React/JSX)       | ~6,200 linhas                        |
|                  | Backend (Rust)             | ~4,600 linhas                        |
|                  | Total                      | **~10,800+ linhas**                  |
| **Arquitetura**  | Módulos Backend (Rust)     | 29                                   |
|                  | Componentes Visuais        | 18+                                  |
|                  | Migrações de Base de Dados | 15                                   |
| **Complexidade** | Linguagens Principais      | Rust, JavaScript, SQL                |
|                  | Tecnologias Core           | Tokio (Async), FFmpeg 7.2+, React 18 |
|                  | Containers                 | 3 (Backend, Frontend, Postgres)      |

> _Dados aproximados baseados na versão v1.9.4-PRO_

## 🎯 Roadmap & Future

### 📡 Phase 22: Connectivity & Live Inputs

_Focus: Expanding beyond file playback_

- [x] **SRT Support**: Implementation of SRT (Secure Reliable Transport) for low-latency, reliable remote contribution. (Refining Caller Mode & Listener Support)
- [ ] **Live Inputs Support**: Integration of WebRTC, NDI, and SDI inputs for live switching.

### 📅 Phase 23: EPG & Metadata Engine

_Focus: Professional program guide and discoverability_

- [ ] **EPG Generator**: Internal creation of Electronic Program Guides.
- [ ] **Web EPG Export**: Public JSON/XML API for external entities.
- [ ] **Standard Compliance**: XMLTV and DVB-EIT format support.
- [ ] **External Sync**: Link EPG with international databases (TMDB/TVDB) and internal databases.

### 🎨 Phase 24: Graphics & Visual Experience

_Focus: Advanced on-air branding_

- [ ] **Drag-and-Drop Editor**: Web-based WYSIWYG editor for active templates.
- [ ] **HTML5 Graphics Engine**: Dynamic overlays using standard web technologies.
- [ ] **Mobile Responsive Layout**: Full mobile support for the dashboard.
- [ ] **Theme Customization**: Advanced user theming engine.

### 🏢 Phase 25: Enterprise & Compliance

_Focus: Scalability and professional requirements_

- [ ] **Multi-User System**: Role-based access control (RBAC) and collaboration.
- [ ] **Audit Logs**: Comprehensive tracking of all user actions.
- [ ] **As-Run Logs**: Industry-standard logging for proof-of-play (compliance).
- [ ] **SCTE-35 Support**: Ad-insertion triggers for cable/IPTV distribution.
- [ ] **Analytics Dashboard**: Viewer stats and system health metrics.

### 🚀 Phase 26: Future Technologies & Scalability

_Focus: Innovation and High Availability_

- [ ] **AI Integration**: Auto-tagging content and smart playlist generation.
- [ ] **Multi-Channel Core**: Single instance managing multiple independent playout channels.
- [ ] **High Availability**: Redundancy and failover architecture.

Ver [RELEASE_NOTES.md](RELEASE_NOTES.md) para detalhes completos.

### Versão Atual: 1.9.5-PRO (2026-01-19)

**Principais Novidades:**

- 📡 **Segurança Protocolar**: Autenticar relays RTMP/SRT com MediaMTX via query parameters.
- 🔓 **Acesso Simplificado**: Permissão de leitura anónima para visualização direta em VLC/Players.
- 🟡 **Indicadores Visuais**: Novo badge "REPETIÇÃO" no Dashboard e marcador "(R)" no Calendário para agendamentos recorrentes.
- 🚀 **Build Otimizado**: Limpeza de processos de build pendentes e refresh completo do frontend.

### Versão Anterior: 1.9.4-PRO (2026-01-18)

- 📡 **Distribuição Multi-Protocolo**: Suporte para DASH, MSS, RIST, RTSP e WebRTC (WHIP/WHEP).
- 🧠 **Transcoding Inteligente**: Deteção automática de filtros para garantir estabilidade do stream em modo "Copy".
- 🛡️ **Estabilidade Corrigida**: Resolução de falhas no Master Feed e erros de UI no painel de Definições.
- 📊 **Monitorização Expandida**: Novo painel de controlo de protocolos avançados no Dashboard.

- 🛡️ **Segurança Avançada**: Proteção contra SQL Injection em toda a API, parametrização de queries e sanitização de nomes de ficheiros para evitar path traversal.
- ⚡ **Performance Otimizada**: Remoção de "healing" logic pesado na listagem de media, adição de índices de base de dados para agendamento e pesquisa.
- 📡 **SRT Caller v2**: Refinamento do mapeamento de hostname e sugestões inteligentes de URL para modo Listener.
- 📊 **Logs Integrados**: Nova janela de logs do backend diretamente na UI para diagnóstico rápido.
- 🔄 **Retry Button**: Sistema de reatentativa inteligente para o playout.
- 🔍 **Search Debounce**: Pesquisa na biblioteca de media otimizada com debouncing (500ms).
- 🕒 **Header Clock**: Relógio e data em tempo real na barra superior.
- 🧪 **LUFS Meter v2**: Análise de áudio melhorada.

**Correções:**

- ✅ Resolução de crash "White Screen" por falta de imports no painel de configurações.
- ✅ Melhoria na persistência de definições de SRT e mapeamento Docker.
- ✅ Otimização do arranque de serviços e sincronização com base de dados.

## 📄 Licença

GPL v3 - Ver [LICENSE](LICENSE) para detalhes.

## 🙏 Acknowledgments 💖

We would like to express our sincere gratitude to the following for their inspiration, tools, and platforms that made this project possible:

- **ffplayout:** For the initial inspiration and concepts in playout automation.
- **Claude Code & Anthropic:** For the advanced AI assistant capabilities.
- **Gemini & Google DeepMind:** For the powerful language models and reasoning.
- **ChatGPT & OpenAI:** For the pioneering work in AI assistance.
- **Google Antigravity:** For the cutting-edge agentic workflow environment.
- **MacOS & MacBook Pro:** For providing the robust development ecosystem and hardware excellence.

## 📧 Suporte

Para questões e suporte, abra uma [issue](https://github.com/onepa/cloud-onepa-playout/issues).

---

**Desenvolvido com ❤️ para a comunidade de broadcasting**
