# Plano de Testes Exaustivos - Cloud Onepa Playout (ALPHA.28-PRO)

Este documento detalha o conjunto de testes funcionais sector a sector para validação total do ecossistema.

## 💻 Ambiente de Execução
- **OS:** Linux Ubuntu (VM)
- **Recursos:** 4 Cores / 8GB RAM / 70GB Disco
- **Arquitectura:** Docker-Compose (4 containers)

---

## 1. Dashboard (Sector de Monitorização)
- **Status de Playout:**
  - [ ] Verificar transição manual `STOPPED` -> `ON AIR`.
  - [ ] Validar botão `Skip` com mudança instantânea de clip no live monitor.
  - [ ] Confirmar paragem imediata no botão `Stop`.
- **Live Monitor & Telemetria:**
  - [ ] Verificar preview HLS em tempo real (Player 1).
  - [ ] Validar barra de Protocolos: Ícones SRT/RTMP/UDP devem reflectir estado real de emissão.
  - [ ] Verificar actualização do contador "Clips Reproduzidos Hoje".
- **Logs em Tempo Real:**
  - [ ] Confirmar fluxo de mensagens do motor Actix-web na janela de logs.

## 2. Media Library (Sector de Assets)
- **Upload & Metadata:**
  - [ ] Upload de 5+ ficheiros simultâneos (Ponto Crítico: I/O de Disco).
  - [ ] Verificar geração de miniaturas (.jpg) no directório `/var/lib/onepa-playout/thumbnails`.
  - [ ] Validar leitura de duração e resolução via FFmpeg.
- **Reality Sync Engine:**
  - [ ] Inserir ficheiro via Terminal em `/data/media` e verificar detecção automática na UI.
  - [ ] Mudar nome de ficheiro no disco e validar actualização na App.
- **Proxies Web:**
  - [ ] Verificar se ficheiros .MOV/.MKV geram proxy .mp4 para visualização no browser.

## 3. EPG (Sector de Programação)
- **Cronologia (Timeline):**
  - [ ] Validar a nova densidade vertical (75px) - Permite ver o dia inteiro com menos scroll?
  - [ ] Verificar alinhamento de blocos de cor com o horário real.
- **Exportação:**
  - [ ] Aceder a `/api/epg/xmltv` e validar estrutura XML.
  - [ ] Verificar se eventos recorrentes (ex: telejornal diário) aparecem no guia.

## 4. Calendário (Sector de Escalonamento)
- **Agendamento PRO:**
  - [ ] Criar agendamento com repetição semanal.
  - [ ] Verificar conflitos: Tentar agendar dois eventos na mesma hora (Deve dar erro ou aviso).
- **Atalhos de Limpeza:**
  - [ ] Testar "LIMPAR HOJE" e verificar se a base de dados remove apenas os eventos do dia actual.
- **Visual:**
  - [ ] Validar legendas e compactação da barra lateral nas vistas de Mês e Semana.

## 5. Editor de Gráficos (Sector Visual)
- **Camadas & Texto:**
  - [ ] Adicionar camada de texto dinâmico.
  - [ ] Alterar posição X/Y e validar preview instantâneo.
- **Overlays:**
  - [ ] Upload de imagem via Overlay Converter Pro e aplicar como marca d'água.
  - [ ] Verificar opacidade e escala em tempo real.

## 6. Configurações (Sector de Sistema)
- **Emission & Output:**
  - [ ] Mudar resolução de 1080p para 720p e verificar se o motor reinicia o stream automaticamente.
  - [ ] Testar credenciais SRT (Modo Caller vs Listener).
- **Gestão de Espaço:**
  - [ ] Verificar se o gráfico de MB/GB reflecte a ocupação real da partição de 70GB.
- **Utilizadores:**
  - [ ] Editar perfil de utilizador (Testar fix da `EditIcon`).

---

## 7. Testes de Resiliência (Stress & Falhas)
- **Corte de Rede:** Simular queda de internet e verificar se o SRT tenta reconectar infinitamente.
- **Disco Cheio:** Inserir 65GB de lixo e validar se a App emite alerta de espaço crítico.
- **Crash de Container:** Matar o container `alpha-backend` e verificar se o `alpha-frontend` mostra página de erro amigável.
- **Ficheiro Corrompido:** Tentar reproduzir vídeo com cabeçalho quebrado e validar se o playout salta (skip) automaticamente sem crashar o motor.
