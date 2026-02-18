# Release Notes - Cloud Onepa Playout

## v2.2.0-ALPHA.22-PRO-PRO (2026-02-18)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.22-PRO-PRO (2026-02-18)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.22-PRO-PRO (2026-02-18)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.19-PRO (2026-02-18)

### � Correcções Críticas
- **Ecrã Preto**: GlobalErrorBoundary global em `main.jsx` — erros JS agora mostram mensagem em vez de ecrã vazio
- **HelpSystem**: Corrigida referência `toggleHelpMode` não declarada que causava crash silencioso
- **Login**: Substituída imagem de fundo Unsplash (dependência externa) por gradiente CSS local — funciona 100% offline

### ✨ Melhorias
- **Versioning**: Todos os fallbacks hardcoded actualizados para ALPHA.19-PRO
- **Settings — Sobre o Sistema**: Painel de histórico de versões com scroll e dados curados reais
- **Docs**: Corrigidos typos `-PRO-PRO` → `-PRO` e versão errada `v2.3.0` → `v2.2.0`

---

## v2.2.0-ALPHA.18-PRO (2026-02-12)

### ✨ Novas Funcionalidades
- **Sistema de Logs**: Rotação automática de logs (50MB / 5 ficheiros), log path configurável em Settings
- **Log Viewer**: Visualizador de logs em tempo real com refresh automático (2s) no painel de Definições

---

## v2.2.0-ALPHA.17-PRO (2026-02-12)

### � Motor de Playout
- **Relay Cooldown**: Aumentado de 5s → 15s para evitar flapping durante transições de clips
- **Threshold Inativo**: Master-feed inactive threshold aumentado 10 → 20 ticks

---

## v2.2.0-ALPHA.16-PRO (2026-02-12)

### ✨ Novas Funcionalidades
- **HLS Duplo**: Output simultâneo `stream.m3u8` (full-res broadcast) + `stream_low.m3u8` (640×360 para monitor do dashboard)
- **Player Retry**: Loop de retry do player HLS — 6 tentativas × 8s = 48s máximo antes de desistir

---

## v2.2.0-ALPHA.15-PRO (2026-02-12)

### ✨ Novas Funcionalidades
- **Dashboard Live Monitor**: Indicador de estado — laranja enquanto aguarda HLS, verde quando stream está pronto (`onReady`)
- **GraphicsEditor**: Preview do logo actualiza imediatamente após guardar (cache-bust com timestamp)

---

## v2.2.0-ALPHA.14-PRO (2026-02-12)

### � Settings — Presets de Qualidade
- **Confirmação de Preset**: Diálogo de confirmação ao aplicar preset de qualidade (avisa que é necessário reiniciar o motor)
- **Limites de Bitrate**: Bitrate não pode exceder o máximo definido para a resolução seleccionada

---

## v2.2.0-ALPHA.13-PRO (2026-02-12)

### ✨ Graphics Engine
- **Layer Manager**: Painel de gestão de camadas gráficas com reordenação
- **Tipos de Layers**: Marquee (ticker), Lower Third (rodapé), Clock (relógio) — configuráveis individualmente
- **API de Gráficos**: Endpoints REST para CRUD de graphics layers

---

## v2.2.0-ALPHA.12-PRO (2026-02-12)

### ✨ Segurança & Utilizadores
- **RBAC Granular**: Perfis de acesso com permissões individuais (READ, WRITE, DELETE, EXECUTE)
- **Gestão de Perfis**: Interface para criar, editar e apagar perfis de acesso
- **Password Reset**: Administradores podem repor password de qualquer utilizador

---

## v2.2.0-ALPHA.11-PRO (2026-02-12)

### ✨ Metadados Automáticos
- **Metadata Fetcher**: Integração TMDB, OMDB e TVMaze para enriquecimento automático de metadados
- **Revisão de Metadados**: Interface para rever e aprovar sugestões automáticas na Media Library
- **EPG Enrichment**: Dados de programação enriquecidos com sinopses e imagens

---

## v2.2.0-ALPHA.10-PRO (2026-02-05)

### � Estabilidade
- **Gapless Playback**: Melhorado mecanismo de transição entre clips sem interrupção visível
- **Engine Watchdog**: Reinício automático do motor em caso de falha detectada

---

## v2.2.0-ALPHA.9-PRO (2026-02-05)

### � Protocolo SRT
- **SRT Listener/Caller**: Suporte a ambos os modos (caller e listener) configuráveis em Settings
- **Diagnóstico SRT**: Scripts de diagnóstico e correcção de URL SRT incluídos

---

## v2.2.0-ALPHA.8-PRO (2026-02-05)

### ✨ Protocolo UDP
- **UDP Multicast/Unicast**: Dois modos de transmissão UDP configuráveis
- **Verificação de Rede**: Diálogo de configuração UDP com instruções de rede e acesso externo

---

## v2.2.0-ALPHA.7-PRO (2026-02-05)

### ✨ Multi-Streaming
- **HLS Distribution**: Servidor HLS integrado via MediaMTX
- **Multi-Protocol**: Activação simultânea de RTMP, SRT, UDP e HLS
- **Presets de Codec**: Selecção de codec de vídeo/áudio em Settings

---

## v2.2.0-ALPHA.6-PRO (2026-02-05)

### � Overlay
- **Coordenadas de Overlay**: Posição X/Y do logo configurável em Settings
- **Opacidade e Escala**: Sliders em tempo real para opacidade (0-100%) e escala (0.1x-2.0x)

---

## v2.2.0-ALPHA.5-PRO (2026-02-04)

### ✨ Programação & EPG
- **Schedule Exceptions**: Excepções de agendamento (feriados, eventos especiais)
- **EPG XMLTV Export**: Exportação do guia de programação em formato XMLTV standard
- **Dias de EPG**: Número de dias de antecedência configurável (1-30 dias)

---

## v2.2.0-ALPHA.4-PRO (2026-02-03)

### ✨ Graphics Editor (Base)
- **Editor de Gráficos**: Interface base do editor de camadas gráficas
- **Templates**: Sistema de templates reutilizáveis para gráficos

---

## v2.2.0-ALPHA.3-PRO (2026-01-31)

### ✨ Branding
- **Branding Type**: Selecção entre logo estático (PNG) e animado (MP4) para sidebar e overlay
- **Logo Assignment**: Sincronização de logo entre sidebar da app e overlay de stream

---

## v2.2.0-ALPHA.2-PRO (2026-01-30)

### ✨ Caminhos de Armazenamento
- **Storage Paths**: Configuração de caminhos para media, thumbnails, playlists e fillers
- **Path Validation**: Validação de caminhos antes de guardar

---

## v2.2.0-ALPHA.1 (2026-01-28)

### 🚀 Migração para Ambiente Alpha
- **Portas dedicadas**: Frontend 3011, Backend 8181/8182, Postgres 5534, MediaMTX RTMP 2036 / HLS 8991
- **Docker-Only**: Workflow exclusivo em Docker para consistência entre ambientes
- **Login**: Corrigidos erros silenciosos 401, mensagens de erro melhoradas
- **Documentação**: `ALPHA_GUIDE.md` com mapeamento de portas e guia de arranque
