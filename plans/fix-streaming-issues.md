# Plano de Correção: Problemas de Streaming na Media Library

## Contexto
- **Aplicação:** Cloud Onepa Playout - ALPHA
- **Ambiente:** VM Linux Ubuntu (8GB RAM, 4 cores, 70GB disco)
- **Menu Afetado:** Media Library → Otimizar Stream / Preview de Vídeo

---

## Problemas Identificados

### Problema 1: Erro "Unauthorized path" na Otimização
**Localização:** `backend/src/api/media.rs:1066`

**Causa Raiz:**
O endpoint de otimização verifica se o caminho do ficheiro começa com `MEDIA_PATH`, mas:
1. O `MEDIA_PATH` no container é `/var/lib/onepa-playout/media`
2. Os caminhos na base de dados podem ter formatos diferentes:
   - Caminhos absolutos do host: `/Users/Shared/antigravity/...`
   - Caminhos do container: `/var/lib/onepa-playout/media/...`
   - Caminhos relativos

**Código Problemático:**
```rust
let media_dir = std::env::var("MEDIA_PATH")
    .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());

if !path.starts_with(&media_dir) {
    return HttpResponse::Forbidden()
        .json(serde_json::json!({"error": "Unauthorized path"}));
}
```

### Problema 2: Demora no Carregamento do Vídeo
**Causas Múltiplas:**

1. **Moov Atom no Final:** Vídeos não otimizados têm metadados no final
2. **Sem Pré-buffering:** O player espera descarregar dados suficientes
3. **I/O Virtualizado:** Overhead de disco na VM
4. **Possível Problema de Rede:** Latência entre containers Docker

### Problema 3: Warning de Compilação
**Localização:** `backend/src/services/ffmpeg.rs:170`

```rust
warning: method `is_faststart_optimized` is never used
```

---

## Arquitetura do Problema

```mermaid
flowchart TD
    A[Utilizador clica Otimizar] --> B[Endpoint /media/id/optimize]
    B --> C{Verifica MEDIA_PATH}
    C -->|Caminho não corresponde| D[Erro: Unauthorized path]
    C -->|Caminho correto| E[Otimiza com FFmpeg]
    
    F[Utilizador abre Preview] --> G[Player HTML5]
    G --> H[GET /media/id/stream]
    H --> I{Moov atom position?]
    I -->|No final| J[Download completo antes de reproduzir]
    I -->|No início| K[Reprodução imediata]
```

---

## Plano de Correção

### Fase 1: Corrigir Erro "Unauthorized path"

#### Tarefa 1.1: Melhorar Verificação de Caminho
**Ficheiro:** `backend/src/api/media.rs`

**Solução:** Verificar múltiplos caminhos possíveis:
```rust
let media_dir = std::env::var("MEDIA_PATH")
    .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
let assets_dir = std::env::var("ASSETS_PATH")
    .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

// Verificar se o caminho é válido em qualquer diretório permitido
let is_valid = path.starts_with(&media_dir) 
    || path.starts_with(&assets_dir)
    || path.exists(); // Se existe, provavelmente é válido
```

#### Tarefa 1.2: Adicionar Logging para Debug
Adicionar logs para identificar o caminho real vs esperado.

### Fase 2: Otimizar Carregamento de Vídeo

#### Tarefa 2.1: Implementar Streaming Progressivo
**Ficheiro:** `backend/src/api/media.rs`

Melhorar o endpoint de streaming para:
1. Detectar se o vídeo tem faststart
2. Se não tiver, servir com prioridade para o moov atom
3. Adicionar headers de caching otimizados

#### Tarefa 2.2: Otimizar Player Frontend
**Ficheiro:** `frontend/src/pages/MediaLibrary.jsx`

1. Aumentar buffer inicial
2. Mostrar progresso de carregamento
3. Implementar retry automático

### Fase 3: Limpeza de Código

#### Tarefa 3.1: Remover Código Não Utilizado
**Ficheiro:** `backend/src/services/ffmpeg.rs`

Remover ou utilizar o método `is_faststart_optimized`.

---

## Detalhes de Implementação

### Correção 1: Endpoint de Otimização

```rust
// ANTES
if !path.starts_with(&media_dir) {
    return HttpResponse::Forbidden()
        .json(serde_json::json!({"error": "Unauthorized path"}));
}

// DEPOIS
let media_dir = std::env::var("MEDIA_PATH")
    .unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
let assets_dir = std::env::var("ASSETS_PATH")
    .unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

log::debug!("Optimize request - Path: {:?}, MEDIA_PATH: {}, ASSETS_PATH: {}", 
    path, media_dir, assets_dir);

let is_authorized = path.starts_with(&media_dir) 
    || path.starts_with(&assets_dir);

if !is_authorized {
    log::warn!("Unauthorized path access attempt: {:?} (expected prefix: {} or {})", 
        path, media_dir, assets_dir);
    return HttpResponse::Forbidden()
        .json(serde_json::json!({"error": "Unauthorized path"}));
}
```

### Correção 2: Melhorar Streaming

```rust
// Adicionar headers para streaming otimizado
response.headers_mut().insert(
    HeaderName::from_static("x-content-type-options"),
    HeaderValue::from_static("nosniff"),
);
response.headers_mut().insert(
    HeaderName::from_static("cache-control"),
    HeaderValue::from_static("public, max-age=3600"),
);
```

### Correção 3: Remover Warning

```rust
// Opção A: Remover método não utilizado
// Opção B: Adicionar #[allow(dead_code)]
#[allow(dead_code)]
pub fn is_faststart_optimized(&self, file_path: &str) -> bool {
    // ...
}
```

---

## Ordem de Execução

1. **Prioridade Alta:** Corrigir erro "Unauthorized path" (bloqueia funcionalidade)
2. **Prioridade Média:** Melhorar streaming de vídeo
3. **Prioridade Baixa:** Limpar warning de compilação

---

## Testes a Realizar

1. Testar otimização com diferentes tipos de caminhos na BD
2. Verificar tempo de carregamento antes/depois da otimização
3. Confirmar que o warning desaparece

---

## Questões para Aprovação

1. Devo implementar todas as correções ou apenas a do erro "Unauthorized path"?
2. Deseja que adicione logs adicionais para debug em produção?
3. Devo manter o método `is_faststart_optimized` ou removê-lo?

---

## Checklist de Execução

- [ ] Corrigir verificação de caminho no endpoint de otimização
- [ ] Adicionar logging para debug
- [ ] Melhorar headers de streaming
- [ ] Remover warning de compilação
- [ ] Testar na VM Linux
- [ ] Validar funcionamento completo
