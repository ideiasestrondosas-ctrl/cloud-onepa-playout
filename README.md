# Cloud Onepa Playout

**Sistema de Automação de Playout 24/7 para Streaming de Vídeo**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Version](https://img.shields.io/badge/Version-2.2.0-ALPHA.34-PRO-blue.svg)](https://github.com/onepa/cloud-onepa-playout)
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

## 📊 Estatísticas de Desenvolvimento (v2.2.0-ALPHA.34-PRO)

Este projeto representa um esforço significativo de engenharia para criar uma solução de playout robusta e moderna.

| Métrica          | Detalhe                    | Valor                                     |
| ---------------- | -------------------------- | ----------------------------------------- |
| **Código Fonte** | Frontend (React/JSX)       | ~14083 linhas                              |
|                  | Backend (Rust)             | ~9351 linhas                              |
|                  | Total                      | **~23434+ linhas**                        |
| **Arquitetura**  | Módulos Backend (Rust)     | 32                                        |
|                  | Componentes Visuais        | 25+                                       |
|                  | Migrações de Base de Dados | 26                                        |
| **Complexidade** | Linguagens Principais      | Rust, JavaScript, SQL                     |
|                  | Tecnologias Core           | Tokio (Async), FFmpeg 7.2+, React 18      |
|                  | Containers                 | 4 (Backend, Frontend, Postgres, MediaMTX) |

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

> _Dados aproximados baseados na versão v2.2.0-ALPHA.34-PRO

## 🎯 Roadmap & Future (v2.2.0-ALPHA.32-PRO — 2026-03-03)

### 📡 Phase 22: Connectivity & Live Inputs

_Focus: Expanding beyond file playback_

- [x] **SRT Support**: Implementation of SRT (Secure Reliable Transport) for low-latency, reliable remote contribution. (Refining Caller Mode & Listener Support)
- [ ] **Live Inputs Support**: Integration of WebRTC, NDI, and SDI inputs for live switching.

### 📅 Phase 23: EPG & Metadata Engine

_Focus: Professional program guide and discoverability_

- [x] **EPG Generator**: Internal creation of Electronic Program Guides.
- [x] **Web EPG Export**: Public JSON/XML API for external entities.
- [x] **Standard Compliance**: XMLTV and DVB-EIT format support.
- [x] **External Sync**: Link EPG with internal schedules and recurring events.

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

### Versão Atual: v2.2.0-ALPHA.34-PRO ()

**Principais Novidades (UDP Static & Script Transparency):**
- 📡 **Estabilidade UDP PUSH**: Melhoria no motor FFmpeg para Unicast PUSH, resolvendo o erro de "Address already in use" na rede do Host e garantindo recepção directa no VLC.
- 📊 **Audit Ports 3.0 (Final)**: Motor de diagnóstico robusto com detecção de receptores e verificação de conectividade Host-to-Container em tempo real.
- 🛡️ **Log Rotation & Persistence**: Implementação de política de rotação de logs (10MB/3-files) em todos os serviços Docker para máxima segurança de disco.
- 📜 **Transparência de Scripts**: Padronização do output de versão em todos os scripts de instalação e manutenção (.sh e .bat).
- ⚙️ **Process Guard**: Sistema de proteção contra colisões de portas internas no Playout Engine.

### Versão Anterior: v2.2.0-ALPHA.31-PRO (2026-03-01)

**Principais Novidades (VLC Push + Audit Visibility Fixes):**
- 📡 **UDP Push Stability**: O stream UDP interno migrou para um modelo de "Push-to-Localhost" (`udp://@:1234`), erradicando os falsos-positivos "cannot peek" inerentes a conexões VLC baseadas em listeners.
- 📊 **Precisão do Dashboard de Auditoria (`audit_ports.sh`)**: Integradas consultas reais na API Master do MediaMTX, resolvendo o bug visual de contabilizar a zero leitores `HLS`.
- 🐛 **UI Bugfixes de Links de Conexão**: Limpeza drástica em lógicas client-side dos placeholders de SRT e UDP.

**Principais Novidades (Gold Standard V2 & Protocol Stability):**
- 📡 **"Gold Standard V2" Multiplexer**: Implementação definitiva do algoritmo perfeito para muxing via FFmpeg.
- 🕒 **Extrema Presição em SRT/UDP**: Adição forçada da meta-regra `Annex B` para H264 e reinjeção massiva de PID tables com flags `+latm` corrigindo buffers no VLC.
- 🎯 **Novo Tracker HLS**: Motor de auditoria atualizado para registar verdadeiras sessões proxy com Nginx.

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
