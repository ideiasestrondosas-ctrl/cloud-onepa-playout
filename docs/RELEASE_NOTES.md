# Release Notes - Cloud Onepa Playout

## v2.2.0-ALPHA.38-PRO (2026-03-10)

### 🚀 Release Highlights
- **Automated Release**: Version bump to ALPHA.38-PRO.
- **Documentation**: Synced README.md, RELEASE_NOTES.md and frontend constants.
- **Improved Transcription**: Optimized engine settings for better accuracy.

## v2.2.0-ALPHA.35-PRO (2026-03-08)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.
- **i18n Health**: Added system health dashboard translations.

## v2.2.0-ALPHA.34-PRO (2026-03-05)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.32-PRO (2026-03-03)

### 🚀 Release Highlights
- **UDP Stability**: Corrected Unicast PUSH mode to resolve "Address already in use" errors on Host, allowing VLC to act as the sole listener.
- **Audit Ports 3.0**: New diagnostic engine with intelligent receiver detection (VLC) and refined socket filtering.
- **Log Management**: Implemented log rotation (10MB/3-files) and enhanced container persistence to prevent disk space issues.
- **Script Versioning**: Standardized application version output across all operational scripts (.sh and .bat) for cross-platform transparency.
- **Process Guard**: Internal protection against port collisions between master and relay processes in the Playout Engine.
- **System Sync**: Full synchronization of version v2.2.0-ALPHA.32-PRO across Database, Backend, and Frontend.

## v2.2.0-ALPHA.31-PRO (2026-03-01)

### 🚀 Release Highlights
- **Dynamic EPG Hydration**: Resolved major issue where TV Guide metadata became stale. Metadata is now fetched in real-time from the Media Library.
- **Improved Duplication Support**: Clips duplicated in playlists (with ID suffixes) are now correctly hydrated with their latest metadata.
- **EPG XML Enhancements**: Exported XML now includes rich descriptions and categories for better IPTV compatibility.
- **Automation**: Synchronized application versioning across Frontend, Backend, and Database.

## v2.2.0-ALPHA.30-PRO (2026-02-28)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.29-PRO (2026-02-27)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.28-PRO (2026-02-24)

### 🚀 Release Highlights
- **High-Density Help System**: Redesign massivo do menu ? para maxima ocupacao e legibilidade eficiente.
- **Protocol Stability**: Correcao de falha RTMP quando o output url esta vazio (fallback inteligente).
- **Backend Recovery**: Resolucao do conflito `VersionMismatch` e estabilizacao de arranque do container.
- **Automation Integrity**: Correcao da logica de sufixos de versao nos scripts de build e release.

## v2.2.0-ALPHA.27-PRO (2026-02-23)

### 🚀 Release Highlights
- **Surgical Compact Redesign**: Aperfeicoamento massivo de paddings (3->1.5) e margens (4->2) em todas as vistas principais para maxima densidade de informacao.
- **EPG & Calendar Optimization**: Reducao de alturas de linha e compactacao de barras laterais, permitindo visualizar mais eventos sem scroll.
- **Dashboard Protocol Focus**: Barra de protocolos e live monitor ajustados para priorizar telemetria e logs em tempo real.
- **Bug Fix (Stability)**: Resolvido o erro `ReferenceError: EditIcon is not defined` que causava crash na gestao de perfis de utilizadores.

## v2.2.0-ALPHA.26-PRO (2026-02-23)

### 🚀 Release Highlights
- **Automated Release**: Version bump and statistics update.
- **Documentation**: Synced README.md and version history.

## v2.2.0-ALPHA.25-PRO (2026-02-22)

### 🚀 Release Highlights
- **Consolidacao ALPHA.25**: Sincronizacao total da versao v2.2.0-ALPHA.25-PRO em todo o ecossistema (DB, Backend, Frontend).
- **Reality Sync Engine**: Motor robusto com suporte global a caminhos (Media, Assets, Fillers, Protected) para deteccao de ficheiros fisicos.
- **Transparencia de Armazenamento**: Diagnostico de MB/GB recuperado nas Definicoes com visualizacao em tempo real.
- **Filtro Profissional**: Assets de sistema protegidos (Logos/Vortex) ocultos da Media Library, mantendo apenas o video padrao.
- **Performance de Streaming**: Suporte nativo a Range Requests e optimizacao de rede para carregamento instantaneo.
- **Limpeza de Dados**: Higienizacao automatica da base de dados para remover residuos de assets de sistema.

## v2.2.0-ALPHA.24-PRO (2026-02-20)

### 🚀 Release Highlights
- **Detalhes pendentes**: Esta versao precisa de consolidacao de notas de release.
