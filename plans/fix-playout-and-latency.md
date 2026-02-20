# Plano de Resolução: Playout & Latência de Vídeo

## Contexto
- **Aplicação:** Cloud Onepa Playout - ALPHA
- **Problema 1:** Falha em todos os protocolos de playout (RTMP, SRT, UDP).
- **Problema 2:** Latência persistente no preview de vídeo na Media Library.
- **Ambiente:** VM Linux Ubuntu (Docker).

---

## 1. Diagnóstico e Resolução do Playout (Protocolos Falhado)

### Análise Preliminar
O backend tenta comunicar com o container `mediamtx` ou com o host via `host.docker.internal`. Se nenhum protocolo funciona, suspeitamos de:
1.  **Falha no Processo FFmpeg**: O comando falha logo ao arrancar (erro de sintaxe ou codec).
2.  **Falha de Rede Docker**: O backend não consegue resolver `mediamtx` ou aceder às portas.
3.  **Permissões de Escrita**: O FFmpeg não consegue escrever os ficheiros temporários ou de log.

### Plano de Ação

#### Fase 1.1: Validação de Conectividade e Serviços
1.  **Verificar Logs do MediaMTX**: Confirmar se o serviço de streaming está ativo e a aceitar conexões.
    *   *Comando*: `docker logs alpha-mediamtx`
2.  **Testar Resolução de Nome**: Verificar se o backend vê o `mediamtx`.
    *   *Ação*: Executar `ping mediamtx` dentro do container `alpha-backend`.
3.  **Logs detalhados do FFmpeg**:
    *   *Ação*: O código já faz log do comando. Vamos pedir para inspecionar o log exato (`docker logs alpha-backend | grep "FFmpeg command"`).

#### Fase 1.2: Correção de Argumentos do FFmpeg (`engine.rs` & `ffmpeg.rs`)
1.  **RTMP**: Validar se o URL está a ser construído corretamente (`rtmp://mediamtx:1935/publisher/stream`).
2.  **SRT/UDP**:
    *   Verificar se `pkt_size=1316` está a ser aplicado (crucial para evitar fragmentação que bloqueia o stream).
    *   Confirmar mapeamento de `localhost` -> `host.docker.internal`.

#### Fase 1.3: Fix de Mapeamento de Portas
*   *Ação*: Garantir que o `docker-compose.yml` expõe as portas UDP necessárias para o host receber o stream se o destino for "localhost".

---

## 2. Resolução Definitiva da Latência de Vídeo (Web Proxy)

### Análise
Apesar das otimizações de "First-Chunk" e Nginx, vídeos com **bitrate alto (50Mbps+)** ou **resolução 4K** continuarão a ser lentos num browser, pois o descodificador do browser (CPU/GPU) e a rede têm de lidar com o stream pesado. A solução profissional é criar um **Proxy de Web**.

### Plano de Ação

#### Fase 2.1: Criar Mecanismo de "Web Proxy"
Implementar uma funcionalidade que gera automaticamente uma cópia leve do vídeo para visualização no browser.

*   **Endpoint Backend**: `POST /api/media/{id}/proxy`
*   **Lógica**: FFmpeg transcodifica para `MP4 (H.264/AAC)`, `720p`, `CRF 23` (qualidade visual boa, tamanho reduzido), com `faststart`.
*   **Armazenamento**: Salvar como `filename.proxy.mp4` ao lado do original.

#### Fase 2.2: Atualizar Frontend (Media Library)
*   **Lógica de Seleção**: Ao clicar em "Preview":
    1.  Verificar se existe `proxy`.
    2.  Se existir, reproduzir o proxy (instantâneo).
    3.  Se não, reproduzir o original (com aviso "Loading High-Res...").
    4.  Adicionar botão "Gerar Proxy" na UI se não existir.

---

## 3. Cronograma de Execução

1.  **Imediato (Debug Playout)**:
    *   Ler logs do container para identificar o erro exato do FFmpeg.
    *   Validar conectividade `backend` -> `mediamtx`.
2.  **Correção Playout**: Ajustar argumentos no `ffmpeg.rs` conforme o erro encontrado.
3.  **Implementação Web Proxy**:
    *   Adicionar função `generate_proxy` no `ffmpeg.rs`.
    *   Criar endpoint no `media.rs`.
    *   Atualizar UI no `MediaLibrary.jsx`.

---

## Aprovação Necessária
Por favor, aprove este plano para iniciarmos a execução:
1.  Focar primeiro no **Playout** (funcionalidade crítica)?
2.  Aprovar a criação de ficheiros **Proxy** (ocupa disco extra, mas resolve latência)?
