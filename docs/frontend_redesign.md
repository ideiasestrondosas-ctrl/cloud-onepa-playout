# Plano de Redesign UI/UX - Cloud Onepa Playout (ALPHA)

Este documento detalha a visão estratégica para a transformação visual e funcional da plataforma, focando-se numa experiência de utilizador (UX) de nível **Broadcaster Profissional**, otimizada e direta.

---

## 🎨 1. Estética e Design System (Design Tokens)

Para garantir um visual "Premium" e "State of the Art", abandonamos os estilos genéricos.

- **Tema Principal:** Dark Mode Industrial (Deep Night).
- **Cores:**
  - `Background`: `#0A0B0E` (Preto profundo com subtom azulado).
  - `Surface`: `#14161C` (Cartões e elevações).
  - `Primary`: `#00E5FF` (Ciano Néon para ações principais e feedback ativo).
  - `Secondary`: `#9C27B0` (Roxo para elementos de sistema).
  - `Success/On-Air`: `#00C853` (Verde Vibrante).
  - `Danger/Conflict`: `#FF1744` (Vermelho Crítico).
- **Tipografia:** `Inter` ou `Outfit` para legibilidade máxima em dados técnicos.
- **Efeitos:** Glassmorphism subtil em menus flutuantes e micro-animações de pulso em estados "LIVE".

---

## 🗺️ 2. Arquitetura de Informação e Menus

A navegação será reestruturada para refletir o fluxo de trabalho de um canal de televisão real.

### 🔳 Barra Lateral (Sidebar) - Menus Principais
1. **Master Control (Dashboard):** Visão geral do canal ativo, player de monitorização e estado do sistema.
2. **Master Dashboard (Mosaic):** Monitorização de múltiplos canais em estilo "Mural de Vídeo".
3. **Media Engine (Library):** Gestão de ativos, pastas inteligentes e categorias.
4. **Programmer (Timeline):** Editor de playlists e agendamento (EPG).
5. **Creative Hub (Graphics):** Editor de CG (Caracteres) e templates HTML5.
6. **Infrastructure (Settings):** Configurações do motor, backups e utilizadores.
7. **System Health:** Diagnósticos profundos e analítica.

### 📂 Sub-menus e Zonas de Especialidade
- **Ingest Bay (Dentro da Library):** Área dedicada a novos uploads com validação automática.
- **QC Station:** Zona de inspeção de clips antes de serem aprovados para a Playback.
- **Live Switching:** Controlos de troca de fontes em tempo real (NDI/SRT/Files).

---

## 🛠️ 3. Integração de IA: Antigravity + Stitch (MCP)

O redesign será executado através de uma simbiose técnica:

### Google Antigravity (O Arquiteto)
- **Função:** Orquestrar a consistência global. A Antigravity garante que a transição entre a "Library" e a "Playlist" é fluida e segue a lógica de "Drag & Drop" broadcast.
- **Validação:** Audita cada nova *view* contra os princípios de Design System definidos neste documento.

### Google Stitch / MCP (O Engenheiro de Componentes)
- **Função:** Fornecer e ligar as bibliotecas visuais específicas (ex: React Aria para acessibilidade, Framer Motion para animações fluidas).
- **Execução:** O Stitch injetará o código CSS-in-JS ou Tailwind otimizado para cada componente atómico (botões, sliders, v-meters).

---

## 🏗️ 4. Zonas de Interface (Zonagem)

- **Header Dinâmico:** Apresenta o `Active Channel`, `System Clock (UTC/Local)`, e `On-Air Status` com contador de tempo (`UPTIME`).
- **Workspace Central:** Área de trabalho principal, usando 100% da largura disponível para maximizar a visibilidade da Timeline ou Media Grid.
- **Action Bar (Rodapé ou Flutuante):** Botões de ação contextual (Save, Sync, Play, Stop) sempre ao alcance, mas sem obstruir a visão.

---

## 📈 5. Roadmap de Implementação Técnica
1. **Sprint 1:** Implementação do novo Theme Engine (CSS Variables atualizadas).
2. **Sprint 2:** Refatoração da Sidebar e Layout Master.
3. **Sprint 3:** Reestilização da Media Library com o novo Grid Virtualizado.
4. **Sprint 4:** Dashboard 2.0 (MCR) com integração de V-Meters e Waveforms.

> [!TIP]
> O foco deste redesign é a **Velocidade de Operação**. Um operador deve conseguir agendar um clip com o mínimo de cliques possível, mantendo a estabilidade de 24/7.
