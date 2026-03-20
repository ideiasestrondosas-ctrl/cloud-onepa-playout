# Plano de Correção: Ícones de Protocolos de Transmissão "Iniciando"

## Problema Reportado
Os ícones de protocolos de transmissão (RTMP, SRT) no dashboard master mostram o estado "iniciando" e não atualizam para "ativo", mesmo quando a transmissão está a funcionar corretamente (verificado via VLC).

## Análise Técnica

### Causa Raiz Identificada
O problema está na lógica de verificação de status em [`backend/src/services/engine.rs`](backend/src/services/engine.rs:1203):

```rust
// RTMP Status - linhas 1203-1220
let rtmp_status = if rtmp_active && master_ready {
    let relay_alive = procs.get_mut("rtmp")
        .map(|child| matches!(child.try_wait(), Ok(None)))
        .unwrap_or(false);
    let path_ready = rtmp_path_info.map(|i| i.ready).unwrap_or(false);
    if relay_alive && path_ready {
        "active".to_string()
    } else if relay_alive {
        "starting".to_string()  // <- PROBLEMA AQUI
    } else {
        "idle".to_string()
    }
}
```

**O problema**: O código verifica o campo `ready` do MediaMTX API para determinar se o stream está ativo. O campo `ready` no MediaMTX indica se há **leitores/consumidores** ativos no caminho, não se há **publicadores** ativos.

Quando o FFmpeg (relay) está a enviar stream para o MediaMTX mas não há leitores (VLC pode não estar connectedo no momento da verificação), o MediaMTX retorna `ready: false`, fazendo o código mostrar "starting".

### Fluxo Atual
```
1. Relay (FFmpeg) envia stream → OK
2. MediaMTX recebe stream → OK
3. VLC consome stream → OK (funciona!)
4. Mas... MediaMTX ready=false (sem leitores ativos no momento)
5. Código mostra "starting" ← BUG
```

## Solução Proposta

### Opção A: Verificar sessões/leitores (Recomendada)
Alterar a lógica para verificar o número de sessões em vez de depender apenas do `ready`:

```rust
// Novo lógica: considerar ativo se há leitores OU se o path está ready
let has_readers = rtmp_path_info.map(|i| i.rtmp > 0 || i.srt > 0 || i.hls > 0).unwrap_or(false);
if relay_alive && (path_ready || has_readers) {
    "active".to_string()
}
```

### Opção B: Verificar "sourceReady" como alternativa
O MediaMTX pode ter um campo `sourceReady` para indicar que a fonte está pronta:

```rust
let source_ready = rtmp_path_info
    .and_then(|i| i.sourceReady)
    .unwrap_or(i.ready);
```

## Plano de Execução

### Passo 1: Modificar [`backend/src/services/engine.rs`](backend/src/services/engine.rs)
- Localizar a função que determina o status RTMP (linhas ~1203-1220)
- Modificar a lógica para verificar sessões/leitores além do `ready`
- Aplicar a mesma lógica para SRT (linhas ~1264-1281)

### Passo 2: Verificar alterações no MediaMTX (se necessário)
- Se a Opção A não resolver, pode ser necessário adicionar caminhos `stream_srt` ao [`docker/mediamtx.yml`](docker/mediamtx.yml)

### Passo 3: Testar
- Reiniciar o serviço backend
- Verificar se os ícones mostram "ativo" quando o stream está a funcionar
- Verificar se mudam para "offline" quando o stream para

## Ficheiros a Modificar
1. `backend/src/services/engine.rs` - Lógica de verificação de status

## Tempo Estimado
- Modificação do código: 15-30 minutos
- Teste: 10 minutos
