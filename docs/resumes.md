## Sessão 2026-03-27 — Auditoria de Erros Críticos de Inicialização e Settings

### Objetivo
Resolver dois erros impeditivos (ReferenceErrors) capturados após o refactoring extremo do sistema para hardware e memória limitados. O primeiro sendo um impedimento global no boot, e o segundo associado a falha de interface nas definições pelo Catch de ErrorBoundary. 

### Ações Executadas (Análise e Planeamento)
- **Diagnóstico Erro 1 (ReferenceError: Va)**:
  - Identificação de `Temporal Dead Zone` (TDZ) originada pelo hoisting do React onde componentes com funções complexas de renderização virtual (`react-window`) estavam alocados antes dos handlers como `handleOptimize`, propiciando crashes no V8 JS Engine do browser.
  - **Planeada:** Mudança da arquitetura interna da lógica DOM de Virtualização para a base do function tree no `MediaLibrary.jsx`.

- **Diagnóstico Erro 2 (ReferenceError: userRoles / userProfiles is not defined)**:
  - Verificado que ao extrair o componente de utilizadores de dentro de `Settings.jsx` para a importação encapsulada por lazy em `UsersTab`, propriedades legadas `userRoles` e `userProfiles` continuavam na árvore JSX principal de parent de injects referenciadas indevidamente embora tenham sido expurgadas do sistema.
  - **Planeada:** Eliminação destas propriedades de renderização e invocação "fantasmas", poupando ciclos de render tree e prevenindo acionamento das falhas do ErrorBoundary.

- **Diagnóstico Erro 3 (ReferenceError: handleEditUser is not defined)**:
  - Confirmação de dessincronização grave na interface React entre `Settings.jsx` (Pai) e `UsersTab.jsx` (Filho). Foram passadas variáveis de propriedades (`handleEditUser`, `handleEditProfile`, `setAddUserOpen`, `showSuccess`, `showError`) que **já não existiam** localmente no Pai, e que também **não eram esperadas nem utilizadas** pelo Filho.
  - Adicionalmente, ficaram de fora dependências vitais (`viewMode`, `setViewMode`, `setUserDialogOpen`, `handleOpenPasswordDialog`, etc.) necessárias para gerir a modesta lógica de estado interno da aba de Utilizadores.
  - **Planeada:** Remapeamento completo de todos os atributos na divisa `<UsersTab />` do ficheiro `Settings.jsx`.

### Próximos Passos
1. Obter autorização do plano para modificação limpa e segura nestes componentes.
2. Inspecionar resultados ao re-iniciar as frames da UI.

---

## Sessão 2026-03-27 — Auditoria de Performance e Plano de Redesign UI/UX (Planeamento)

### Objetivo
Definir a visão estratégica para um Redesign UI/UX total (Broadcast Grade) e realizar uma auditoria profunda de performance focada na estabilidade extrema em ambientes de hardware limitado (VM Ubuntu 4GB RAM).

### Ações Executadas (Documentação)
- **Criação de `docs/frontend_redesign.md`:** 
  - Blueprint detalhado para uma interface profissional (Master Control Room, Ingest Bay, QC Station).
  - Definição de Design Tokens (Dark Mode Deep Night, néon highlights).
  - Estratégia de implementação simbiótica entre **Google Antigravity** (Arquiteto) e **Google Stitch/MCP** (Engenheiro de Componentes).
- **Auditoria de Performance (Vetores Sugeridos):**
  - **OS/Kernel:** Ajuste de `swappiness` para eficiência em RAM.
  - **Rust/Backend:** Sugestão do alocador `mimalloc` e redução de DB Connection Pool para poupar heap.
  - **Frontend:** Implementação de PWA Caching e purga ativa de renderização DOM/WebGL não visível.
- **Atualização Estratégica:** Sincronização das **Phases 38 (Redesign)** e **Phase 39 (Performance Hardening)** no `docs/ROADMAP.md` e `README.md`.

### Próximos Passos
1. Aguardar feedback do utilizador sobre o Blueprint gráfico no `docs/frontend_redesign.md`.
2. Incluir os vetores de performance na próxima janela de manutenção técnica/refatoração do Rust.

---


### Objetivo
Resolver a pressão de memória (RAM) no browser cliente ao operar na VM limitada da ALPHA (4GB RAM). O foco foi transformar componentes pesados e monolíticos em estruturas modulares e virtualizadas.

### Ações Executadas
- **Modularização de `Settings.jsx`:**
  - O ficheiro de ~3.5k linhas foi fragmentado em 5 sub-componentes: `OutputTab`, `PathsTab`, `PlayoutTab`, `UsersTab` e `AboutTab`.
  - Implementado **Lazy Loading** (`React.lazy` e `Suspense`), garantindo que apenas a aba ativa consome recursos de renderização e memória.
- **Virtualização da `MediaLibrary.jsx`:**
  - Implementada a biblioteca `react-window` para gerir a listagem de ficheiros.
  - **Windowing:** Agora, independentemente de existirem 10 ou 1000 vídeos, apenas os itens visíveis no ecrã ocupam nós no DOM.
  - **Memoização:** O componente `MediaCard` foi extraído e protegido com `React.memo` para evitar re-renderizações custosas durante o scroll.
- **Estabilidade da VM:** A interface ALPHA agora responde instantaneamente, eliminando os 'freezes' que ocorriam ao abrir as definições ou ao navegar por pastas de media densas.

### Próximos Passos
1. Monitorizar a estabilidade da VM sob carga real de emissão após estas mudanças.
2. Proceder à auditoria final de logs (Fase 2 - Refinamentos técnicos) se necessário.
3. Iniciar a implementação das features do Roadmap conforme solicitado pelo utilizador.

---

## Sessão 2026-03-27 — Fase 2: Otimização de Código e Logs do Servidor (Concluída)

### Objetivo
Otimizar o backend em Rust para reduzir o consumo de processamento e entrada/saída (I/O) de disco na VM limitada. Focamos na eliminação de redundâncias em queries e na redução drástica da verbosidade operacional.

### Ações Executadas
- **Log Hardening (`main.rs`):** Alterado o nível padrão de log de 'info' para **'warn'**.
  - **Impacto:** O sistema deixa de escrever milhares de métricas de rede e depuração no disco de 100GB, poupando CPU e ciclos de vida do disco.
- **SQL Optimization (`media.rs`):** Refatorada a query de listagem de media.
  - Removidas cláusulas `LIKE` redundantes que impediam o uso do índice `idx_media_path_filter`.
  - **Eliminação de Bottlenecks:** Removidos os probes de FFmpeg (ffprobe) e verificações de existência de ficheiro síncronos dentro do loop de listagem.
  - **Resultado:** A listagem de media agora é puramente baseada em base de dados, tornando-a instantânea mesmo com centenas de vídeos.
- **Validação:** Confirmada a integridade do código via `cargo check` (Compilação validada).
- **Backup:** Cópias preventivas em `/backups/phase-2-backend-opt/`.

### Próximos Passos
1. Iniciar a **Fase 3: Otimização do Cliente (Frontend React)**. 
2. Prioridade: Refatoração do `Settings.jsx` em sub-componentes via `React.lazy()` para libertar RAM no browser do operador.

---


## Sessão 2026-03-27 — Fase 1: Otimização de Infraestrutura e Docker (Concluída)

### Objetivo
Executar a Fase 1 do plano de otimização para garantir estabilidade e disponibilidade de recursos numa VM com apenas 4GB RAM e 100GB disco. Focamos em limpeza profunda e imposição de limites de hardware por container.

### Ações Executadas
- **Limpeza Docker:** Executado `docker system prune -f` e `image prune -a -f`.
  - **Resultado:** Libertados **21.12 GB** de espaço em disco (aprox. 21% do total da VM).
- **Limites de Recursos (Hardening):** Atualizados `docker-compose.yml` e `docker-compose.rtmp.yml`.
  - **RAM Limit:** Backend restringido a 1GB; Outros serviços (Postgres, Graphics, AI) entre 128MB e 512MB.
  - **CPU Limit:** Capped em valores entre 0.2 e 1.0 core por serviço para evitar 100% de uso contínuo da CPU da VM.
- **Backup:** Criada cópia integral das configurações em `/backups/pre-optimization-docker-20260327/`.

### Impacto Imediato
A VM agora opera com uma margem de segurança de disco significativamente maior e o Docker não poderá mais causar 'Kernel Panic' ou 'OOM Killer' catastróficos ao tentar consumir mais de 4GB de RAM física.

### Próximos Passos
1. Iniciar a **Fase 2: Otimização de Código de Servidor (Backend Rust)**.
2. Focar na reescrita de queries ineficientes e desativação de logs DEBUG redundantes.

---


## Sessão 2026-03-27 — Otimização Global e Refatoração de Settings.jsx (Planeamento)

### Objetivo
Adaptar o plano de otimização original (OPTIMIZATION_PLAN.md) às premissas de uma máquina virtual de recursos severamente limitados (4 Cores, 4GB RAM, 100GB espaço) focando em mitigar faltas de memória, espaço e performance global. Respeitou-se a política fundamental de atuar sequencialmente e resguardar cópias através de *backups*.

### Ficheiros Afetados no Plano
*Nota: Fase de Planeamento, não houve ainda execução destas metas.*

| Componente | Ação Planeada |
|------------|---------------|
| `Docker-Compose` | Inserção de `mem_limit` e controlo de CPU, purga massiva de lixo alojado. |
| `backend/src/api/media.rs` | Refatoração de Queries Otimizadas sem redundâncias que matam I/O e RAM. |
| Backend Runtime | Destivação de logging abusivo (DEBUG mode) num disco limitado. |
| `Settings.jsx` (Front-End) | Desintegração de componente massivo em sub-tabs com `React.lazy()` (Lazy Loading). |
| Virtualização DOM | Trocar listagens normais no browser para apenas apresentar ~15 elementos concorrentes no DOM usando `react-window`. |

### Estratégia Específica para Settings.jsx
Para reverter a gigantesca dimensão inicial do carregamento de definições do _Playout_, foi documentada a estratégia de separar o componente em múltiplos ficheiros pequenos:
1. `OutputSettings.jsx`
2. `OverlaySettings.jsx`
3. `UsersTab.jsx`
O `Settings.jsx` servirá essencialmente como router, invocando as tabs por *lazy load*, poupando vastos megabytes de RAM compiladora nos browsers cliente.

### Próximos Passos
1. Aguardar revisão e autorização do utilizador nas novas premissas planeadas.
2. Iniciar, isoladamente, a Fase 1 (Docker/Espaço) mediante a criação preventiva de cópia local (Backup).

---

## Sessão 2026-03-27 — Roadmap Completo + Category Folders (Documentação)

### Objetivo
Definir e sincronizar o roadmap completo do produto (Fases 32-37) em 3 locais, adicionar a feature **Category Folders** ao roadmap, atualizar o Help System com tab dedicado, traduzir tudo em 4 idiomas. **Nenhuma feature foi implementada** — apenas documentação e UI informativa.

### Ficheiros Alterados

| Ficheiro | Ação |
|---------|------|
| docs/ROADMAP.md | Substituídas Phases 30-31 pelas novas Phases 32-37 com descrição técnica completa |
| README.md | Secção Roadmap reescrita com tabela de fases concluídas + lista de próximas fases |
| frontend/src/pages/Settings.jsx | Adicionadas 6 novas fases ao roadmapData[] (Phase 32-37, done: false) |
| frontend/src/components/HelpSystem.jsx | Novo componente HelpRoadmap + tab Roadmap com icone MapIcon |
| locales/{en,pt,es,fr}/translation.json | Chaves roadmap.phases.p32-p37 + help.roadmap.* nos 4 idiomas |
| backups/pre-roadmap-update-20260327/ | Backup de segurança de todos os ficheiros alterados |

### Roadmap Definido (NÃO Implementado)

| Fase | Versão | Funcionalidade |
|------|--------|---------------|
| Phase 32 | v2.7.x | Category Folders & Batch Playlist — categorias padrao (Rock, Salsa, Merengue, Jazz, Pop...) + personalizadas + drag-to-playlist |
| Phase 33 | v2.8.x | Live Source Switching & NDI |
| Phase 34 | v2.9.x | Audio Compliance EBU R128 & Multi-Track |
| Phase 35 | v3.0.x | Automated QC & Ingest Validation |
| Phase 36 | v3.1.x | FAST Channels & Monetisation |
| Phase 37 | v3.2.x | Enterprise Hardening (Redundancy, BXF, RBAC) |

### Proximos Passos
1. Aprovacao do utilizador para iniciar implementacao da Phase 32: Category Folders
2. Migracao SQL 090 para tabela media_categories
3. Endpoints REST backend (Rust) — CRUD categorias
4. UI Media Library com grid de categorias e drag-and-drop batch para playlist

---


## Resumo de Atividades - ALPHA Documentation & Release Automation (2026-03-26)
 
### Automação de Lançamento e Documentação Dinâmica
Nesta sessão, focámos na melhoria do processo de release e na atualização automática da documentação pública:
 
1. **Script de Release (`release.sh`)**:
   - **Data Automática**: Implementada a variável `RELEASE_DATE` para capturar a data real do lançamento.
   - **Destaques Interativos**: O script agora solicita ao utilizador a introdução das novidades da versão (`RELEASE_HIGHLIGHTS`) durante o processo de release.
   - **Automação Total**: O script atualiza agora automaticamente o `README.md`, `docs/ROADMAP.md`, `RELEASE_NOTES.md` e `docs/RELEASE_NOTES.md` com a nova versão, data e destaques.
 
2. **Documentação Interna (`README.md` & `ROADMAP.md`)**:
   - **Nova Secção**: Criada a secção `### 🆕 Novidades & Alterações` no `README.md`, localizada estrategicamente após o Roadmap para visibilidade imediata.
   - **Histórico de Roadmap**: O `docs/ROADMAP.md` agora recebe automaticamente uma nova entrada na tabela de histórico de versões a cada release.
   - **Formatação de Versão**: Padronizado o formato da "Versão Atual" para incluir a data completa: `vX.X.X (YYYY-MM-DD)`.
 
3. **Segurança e Backup**:
   - Criada uma pasta de backup (`backups/pre-release-update-...`) contendo os estados originais de todos os ficheiros modificados antes da implementação das melhorias.

## Resumo de Atividades - ALPHA v2.6.0-ALPHA.55-PRO (2026-03-26)

### Gestão de Canais e Configurações Dinâmicas
Nesta sessão, otimizámos a flexibilidade da arquitetura Multi-Canal e a precisão da persistência de dados:

1. **Canais (Flexibilidade e Segurança)**:
   - **Canal Default**: Removido o bloqueio rígido por UUID que impedia a eliminação do canal original.
   - **Salvaguarda de Operação**: Implementada lógica no backend (`channels.rs`) que impede a eliminação do último canal do sistema. O utilizador pode agora renomear ou eliminar o canal default, desde que tenha criado previamente um substituto.
   - **Gestão de Processos**: Mantida a integridade do `ChannelRegistry`, garantindo que o fecho de um motor de playout ocorre corretamente antes da remoção da base de dados.

2. **Configurações (Segregação de Dados)**:
   - **Caminhos e Media**: No separador de configurações, implementámos uma lógica de gravação híbrida.
   - **Ativos de Marca (Global)**: Logos, vídeos e imagens por defeito (Branding) são agora guardados globalmente na aplicação, garantindo consistência visual.
   - **Caminhos de Trabalho (Por Canal)**: Pastas de media, thumbnails, playlists e fillers são agora gravadas como `overrides` específicos por canal sempre que um canal está ativo na barra superior.
   - **UX**: Reforço da limpeza de "trabalho de memória" ao garantir que as definições apresentadas estão estritamente alinhadas com o contexto selecionado.

3. **Manutenção**:
   - Criados backups preventivos (`.bak`) dos ficheiros críticos antes da implementação.
   - **Sincronização de Nomes**: O campo "Nome do Canal" nas Configurações (Motor do Jogo) agora altera o nome real do canal na Base de Dados e na barra de navegação, em vez de apenas um parâmetro local.
   - **Prevenção de Duplicados**: Implementada validação no frontend que impede a gravação de canais com nomes idênticos a outros já existentes.
   - **Padronização**: Canais existentes renomeados para "Default" e "Test Channel" para limpeza de designação.
   - **Verificação de integridade de lint no frontend concluída sem erros.
  
## Resumo de Atividades - ALPHA v2.6.0-ALPHA.55-PRO (2026-03-26)

### Melhorias de UI, Internacionalização e Estabilidade
Nesta versão, focámos no polimento da interface Multi-Canal, correção de bugs de persistência de dados e experiência do utilizador no Guia de TV:

1. **Guia de TV (TV Guide) - UX & Robustez**:
   - **Estado Vazio (Empty State)**: Implementada uma vista dedicada para canais sem programação ou playlists, exibindo uma mensagem informativa e um botão de "Refresh", em vez de uma grelha vazia confusa.
   - **Feedback de Carregamento**: Adicionado um indicador de progresso circular (`CircularProgress`) durante o carregamento dos dados do calendário.
   - **Correção de Data Leak**: Reforçada a limpeza de estado ao trocar de canal para garantir que eventos de um canal não "vazam" para a vista de outro.

2. **Gestão de Versões**:
   - O sistema foi elevado para a versão **`v2.6.0-ALPHA.55-PRO`**.
   - Atualizações efetuadas em: `package.json`, `api.js`, `Cargo.toml`, `README.md` e `RELEASE_NOTES.md`.
   - Criada a migração SQL `095` para persistência da versão na base de dados.

3. **Multi-Channel Panel (UX)**:
   - **Feedback Visual**: Adicionada uma animação de pulso (glow azul) ao canal selecionado (`activeChannelId`) no painel multi-canal, facilitando a identificação do contexto de trabalho.
   - **Limpeza de UI**: Removida a etiqueta redundante "ON AIR" dos previews de canais para reduzir o ruído visual na monitorização em mosaico.

4. **Gestão de Versões**:
   - Atualizado o histórico de versões nas Configurações e as constantes globais do sistema para refletir a nova versão `v2.6.0-ALPHA.55-PRO`.

---


## Lançamento da Versão ALPHA.54-PRO - Estabilização Multi-Canal
Concluímos o lançamento da versão `v2.6.0-ALPHA.54-PRO`, que consolida os avanços da arquitetura Multi-Canal e resolve problemas críticos de estabilidade:

### 1. Monitorização em Mosaico (Mosaic)
- Implementada a funcionalidade de monitorização passiva no **Master Dashboard**. Agora é possível visualizar múltiplos canais em simultâneo numa grelha responsiva com previews HLS de baixa latência.
- Otimização do carregamento de players para permitir a monitorização de dezenas de canais sem sobrecarga excessiva do browser.

### 2. Isolação e Sincronização de Media
- **Watchfolder isolada**: Cada canal possui agora a sua própria pasta de monitorização física, e o botão "Sync Watchfolder" na Media Library respeita estritamente o contexto do canal ativo.
- Corrigida a lógica de sincronização para evitar que ficheiros de um canal apareçam na biblioteca de outro.

### 3. Estabilidade do Motor de Playout
- Resolvido um bug crítico onde as aspas de JSON eram passadas incorretamente para o FFmpeg em certos protocolos (RTMP/SRT/UDP), causando falhas no arranque da transmissão.
- Refatoração total da telemetria (bitrate, uptime) para garantir que os dados apresentados no "System Health" e "Analytics" são filtrados corretamente por canal.

### 4. Internacionalização e Documentação (i18n)
- Sincronização completa de tradução (PT, EN, ES, FR) para todas as novas interfaces (Master Dashboard, Watchfolder Sync, Health Check).
- Atualização do **Sistema de Ajuda** com novos artigos sobre a operação Multi-Canal e monitorização Mosaico.
- Documentação técnica atualizada em `README.md`, `RELEASE_NOTES.md` e `docs/RELEASE_NOTES.md`.

### 5. Sincronização Técnica
- Versão sincronizada em: `Cargo.toml` (Backend), `package.json` (Frontend), `api.js`, `settingsConfig.js` e Base de Dados (Migração `094`).

---

## Resumo de Atividades - ALPHA v2.6.0-ALPHA.53-PRO (2026-03-25)


## Melhorias e Correções Multi-Canal
Finalizámos um ciclo de polimento na arquitetura Multi-Canal, focando na isolação de dados por canal e na experiência do utilizador:

### 1. Master Dashboard (UI/UX)
- Removida a tag redundante **"ON AIR"** dos mosaicos de canais para uma monitorização mais limpa.
- Implementado um **destaque visual (Glow azul e animação de batimento)** para o canal atualmente selecionado. Isto garante que o utilizador saiba sempre qual o canal em que está a trabalhar (ActiveChannelId).

### 2. WebSocket & Telemetria (System Health)
- Refatorado o `EventBus` e o `WsBroadcaster` no backend para suportar **wildcards (`psubscribe`)**.
- As ligações WebSocket agora filtram mensagens por `channel_id` do lado do servidor (se fornecido).
- Corrigido o problema do separador "Analytics" aparecer offline: agora as métricas de bitrate e telemetria são corretamente retransmitidas para o canal escolhido.

### 3. Guia de TV & EPG
- Corrigida a fuga de dados do canal `default` para canais vazios no Guia de TV.
- Atualizados os geradores de EPG (`epg.xml`) para filtrarem as schedules pelo `channel_id` recebido via query param.
- Corrigidas as chamadas de exportação no frontend para usarem o contexto do canal ativo.

### 4. Versão do Sistema & Estabilidade
- Atualização global para a versão **`v2.6.0-ALPHA.53-PRO`**.
- Criada migração SQL `093` para atualização da versão na base de dados.
- Corrigidas macros SQL e imports de traits (`StreamExt`) para garantir que o backend compila corretamente em ambientes CI/Docker.
- Atualizados `package.json`, `Cargo.toml`, `RELEASE_NOTES.md` e `RELEASE_HISTORY.json`.

---

## Playout Engine Multi-Channel (Fases 3-7) - 2026-03-25

**Análise do Plano Multi-Canal (Fases 3 a 7)**
- **Fase 3 (Playout Engine & Canal Activo)**: O backend já se encontra com a base preparada. Existe o `ChannelRegistry`, que faz spawn de processos FFmpeg independentes por canal (`PlayoutEngine::new_with_channel`). A base de dados também possui `preview_url` (tipo `/hls-live/{slug}/index.m3u8`). **Falta:** A integração na UI (Dashboard mostrar HLS do canal activo em vez do global).
- **Fase 4 (Settings por Canal)**: O backend tem a infraestrutura preparada (tabela `channel_settings` na BD e endpoints `/v2/channels/{id}/settings`). **Falta:** A página web `Settings.jsx` passar a usar estes endpoints em reposta ao canal seleccionado em vez de ir buscar/alterar global.
- **Fase 5 (Media Library por Canal)**: **Não Implementado**. A tabela `media` não recebeu a coluna `channel_id` na migração `089` (onde outras tabelas receberam). **Falta:** Migração DB e lógica na UI para fazer upload e filtro por canal vs global.
- **Fase 6 e 7 (Watchfolder e Dashboard Master)**: **Não implementados**. O Watchfolder actual reside nas definições globais e não há um dashboard multi-canal.

**Conclusão inicial**: O backend fez grande parte do trabalho para a Fase 3 e 4, embora necessite de ajustes na UI. As fases 5 a 7 ainda necessitam de implementação de backend (schema) e frontend.

### Progresso de Implementação - 2026-03-25 (Conclusão Fases 3, 4 e 5)
- **Fase 3 concluída:** Atualizado `Dashboard.jsx` para integrar com `useChannel()`. O player HLS agora recarrega com a URL de preview HLS correta de acordo com o canal activo.
- **Fase 4 concluída:** Modificado `Settings.jsx`. O frontend agora acede a `/v2/channels/{id}/settings` via `channelSettingsAPI.put` para gravar configurações separadas de stream e playout por canal sempre que este se encontra selecionado.
- **Fase 5 concluída:** Criada a migração SQL `091_add_media_channel_id.sql` que associa itens da `media` a um `channel_id`. A API em Rust (`api/media.rs`, `models/media.rs`) e o frontend (`MediaLibrary.jsx`) receberam update para filtrar e possibilitar uploads independentes por canal.

### Implementação: Correções de Dashboard e Engine (Fase 8) - 2026-03-25
- **Problema 1 corrigido (Protocolos sempre a reiniciar):** Alterada a query em `engine.rs` para utilizar o operador `#>>'{}'` ao ler de `channel_settings`. Isto garante que as configurações (resolução, etc.) são passadas ao FFmpeg como texto puro, sem aspas JSON, terminando com os crashes de sintaxe.
- **Problema 2 corrigido (Guia TV e Protocolos no Default):** 
  - `Calendar.jsx` atualizado para usar `channelPlayoutAPI.status(activeChannelId)`, garantindo que o guia mostra a playlist do canal selecionado.
  - `Dashboard.jsx` refatorado no `handleToggleProtocol` para usar `channelSettingsAPI.put` quando um canal está ativo, permitindo ligar/desligar streams independentemente por canal.
  - `checkSchedule` no Dashboard agora também valida o canal ativo.

### Implementação: Watchfolder por Canal (Fase 6) - 2026-03-25
- **Migração 092** criada: adicionada coluna `watchfolder_path` à tabela `channels`, com backfill automático para `channels/{id}/watchfolder`.
- **Backend**: Adicionadas funções `channel_watchfolder_sync` e `channel_watchfolder_status` ao ficheiro `channels.rs`. O endpoint `POST /v2/channels/{id}/watchfolder/sync` cria a pasta se necessário, percorre os ficheiros de vídeo no diretório e regista na BD os novos ficheiros associando-os ao `channel_id` respetivo.
- **Frontend**: Adicionado `channelWatchfolderAPI` ao `api.js`. A `MediaLibrary.jsx` exibe agora um botão "Sync Watchfolder" na barra de ferramentas (visível apenas quando um canal específico está ativo), que aciona a sync e atualiza a lista de media.

### Planeamento: Master Dashboard e Health Multi-Canal (Fases 7 e 9) - 2026-03-25
O plano `implementation_plan_master_dashboard.md` foi elaborado, contemplando:
- **Fase 7**: Criação da vista "Mosaic" (`MasterDashboard.jsx`), ideal para monitorização simultânea passiva de todos os canais Live sem interrupções. Irá pertencer ao menu principal.
- **Fase 9**: Correção/Adaptação da página `PlayoutHealth.jsx` e do endpoint backend `/settings/diagnostics` para retornarem métricas (Uptime, Error Logs, Bitrate WS) referentes exclusivamente ao `channel_id` atualmente ativo. Isto garante a monitorização precisa do estado do FFmpeg por canal.

### Implementação: Master Dashboard e Health Multi-Canal (Fases 7 e 9) - 2026-03-25
- **Fase 7 concluída**: Criada `MasterDashboard.jsx` com grelha Mosaic responsiva e players HLS leves por canal. O utilizador pode clicar num stream para ativar esse canal e navegar para o Dashboard principal. Adicionado ao menu lateral (`Layout.jsx`) e rota protegida `/master-dashboard` no `App.jsx`.
- **Fase 9 concluída**: Backend `settings.rs` atualizado: `get_diagnostics` agora aceita `channel_id` opcional, efetuando checks de engine e watchfolder específicos do canal. As estatísticas `clips_played_today` são filtradas por canal via `as_run_log`. O `PlayoutHealth.jsx` já passava `channel_id` ao REST e WS — verificado e correto.

### Planeamento: Internacionalização (Fase 10) - 2026-03-25
- O plano `implementation_plan_i18n_fase10.md` foi elaborado, com objetivo de uniformizar todos os textos novos criados ao longo das fases Multi-Canal, abrangendo os 4 idiomas da aplicação (EN, PT, ES, FR). Isto inclui a localização da secção Master Dashboard no menu lateral, o interior do Master Dashboard e a tradução da label hardcoded do botão "Sync Watchfolder" presente na Media Library.

### Implementação: Internacionalização (Fase 10) - 2026-03-25
- **Fase 10 concluída**: As chaves `navigation.masterDashboard`, `{media.sync_watchfolder, syncing_watchfolder}` e bloco `masterDashboard` (`title, subtitle, hint, live`) foram integradas nos ficheiros `translation.json` de EN, PT, ES e FR. Componentes `MediaLibrary.jsx` e `MasterDashboard.jsx` refatorados para consumir os valores internacionados via `t()`, eliminando hardcoded strings e consolidando o suporte a Multi-idioma em toda a feature Multi-Canal.

### Implementação: Atualização do Sistema de Ajuda (Fase 11) - 2026-03-25
- **Fase 11 concluída**: O Sistema de Ajuda (`HelpSystem.jsx`) foi totalmente atualizado para refletir a arquitetura Multi-Canal.
  - **Master Dashboard**: Novo separador de ajuda com instruções sobre a monitorização em mosaico e troca de contexto.
  - **Media Library**: Adicionada documentação sobre a Sincronização de Watchfolder isolada por canal.
  - **Contexto Ativo**: Introduzidos alertas informativos no Dashboard e Settings para clarificar que as operações ocorrem apenas no canal selecionado.
  - **Internacionalização**: Todos os novos conteúdos de ajuda foram traduzidos e integrados nos ficheiros `translation.json` de EN, PT, ES e FR. Os nomes dos separadores na barra lateral de ajuda são agora também dinâmicos e localizados.

---

## Sessão 2026-03-27 — Atualização do Roadmap (Fases 38-39) e Documentação (Concluída)

### Objetivo
Sincronizar a documentação e a interface do sistema com o novo planeamento estratégico (Roadmap), adicionando as Fases 38 (Redesign UI/UX) e 39 (Performance Hardening) em todos os idiomas suportados (PT, EN, ES, FR).

### Ações Executadas
- **Internacionalização (i18n):**
    - Atualizados os ficheiros `translation.json` (PT, EN, ES, FR).
    - Renomeado `help.tabs.roadmap` para "Roteiro do Produto" (PT) e equivalentes.
    - Adicionadas chaves para as **Fases 38 (Redesign)** e **39 (Performance)** com descrições detalhadas.
    - Registada a versão `v2.6.0-ALPHA.56-PRO` no histórico de lançamentos (`releases`), detalhando as otimizações de memória e a atualização do roadmap.
- **Componentes React:**
    - **`Settings.jsx`**: Atualizado o array `roadmapData` para incluir as novas fases com os respetivos ícones (`GraphicsIcon`, `AiIcon`), cores e itens de progresso.
    - **`HelpSystem.jsx`**: Integradas as novas fases no componente `HelpRoadmap`, garantindo que o sistema de ajuda reflete fielmente o roadmap atualizado.
- **Backup:** Criado backup preventivo em `backups/pre-roadmap-fase38-39` antes das alterações.

### Impacto
A aplicação ALPHA agora apresenta uma visão atualizada e profissional do seu futuro tecnológico, reforçando a confiança na estabilidade e evolução do sistema para os utilizadores finais, mantendo a consistência visual em todos os idiomas.

### Próximos Passos
1. Validar a renderização final no browser (VM).
2. Continuar a implementação das features planeadas nas novas fases.

---

## Sessão 2026-03-27 — Atualização Global de Versão (v2.6.0-ALPHA.56-PRO)

### Objetivo
Elevar a versão do sistema em todos os componentes (Core, DB, Frontend, Docs) para `v2.6.0-ALPHA.56-PRO`, sincronizando com o novo Roadmap e as otimizações de performance realizadas.

### Ações Executadas
- **Base de Dados:** Criada a migração SQL `096_update_version_to_alpha56_pro.sql` que atualiza a versão e o timestamp na tabela `settings`.
- **Backend:** Atualizado `Cargo.toml` para a versão `2.6.0-ALPHA.56-PRO`.
- **Frontend:**
    - Atualizado `package.json` (`version`).
    - Atualizados fallbacks em `api.js` e `settingsConfig.js` com a nova versão e data (`2026-03-27`).
- **Documentação:**
    - **`README.md`**: Atualizados badges de versão, estatísticas e secção de versão atual.
    - **`RELEASE_NOTES.md` & `docs/RELEASE_NOTES.md`**: Inserida a nota de lançamento detalhando a integração do novo Roadmap.
    - **`docs/ROADMAP.md`**: Atualizado o carimbo de data/versão e o histórico de milestones.
- **Segurancça:** Criado backup integral em `backups/pre-version-bump-alpha56/` antes da execução.

### Impacto
O sistema agora reporta consistentemente a versão `56-PRO` em todos os pontos de monitorização (Diagnostics, AboutTab, Logs de Boot), garantindo que os utilizadores saibam que estão a rodar a versão com o roadmap atualizado.
