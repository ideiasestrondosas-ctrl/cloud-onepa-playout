# Plano para Corrigir Problemas dos Graphics Layers

## Problemas Identificados

### 1. Layer não atualiza automaticamente
**Causa**: O sistema detecta a mudança via `graphics_updated_at` mas o restart pode não estar a funcionar corretamente ou o filtro tem erros de sintaxe.

### 2. Protocols constant restart (com layer ativo)
**Causa**: O filtro drawtext tem erros de sintaxe:
- Para **clock**: `text='%H:%M:%S'` mostra texto literal, não hora
- O filtro chain pode estar malformado
- FFmpeg pode estar a crashar

### 3. Preview não atualiza após Stop/Start
**Causa**: Problema no frontend - o elemento video não é resetado corretamente

---

## Plano de Correção

### FASE 1: Corrigir sintaxe do filtro drawtext (CRÍTICO)

1.1 - Corrigir filtro de clock para usar expressão de tempo:
```rust
// Em vez de: text='%H:%M:%S'
// Usar: text='%{localtime\:\%H\:\%M\:\%S}'
// Ou: text='%{pts\:hms}'
```

1.2 - Verificar e corrigir a cadeia de filtros:
- Quando há logo + graphics: `[v_with_logo]drawtext[v_out]`
- Quando só graphics: `[v_to_logo]drawtext[v_out]`
- Sem filtros: `[v_to_logo]copy[v_out]`

### FASE 2: Adicionar logging para debug

2.1 - Adicionar log detalhado do filtro gerado:
```rust
log::info!("[Graphics-F1] Final filter_complex: {}", filter_complex);
```

2.2 - Adicionar tratamento de erros mais robusto

### FASE 3: Corrigir preview do frontend

3.1 - No componente de preview, garantir que:
- O elemento video é recriado ou resetado após Stop/Start
- O source é limpo antes de novo play

---

## Alterações Necessárias

### `backend/src/services/ffmpeg.rs`
- Corrigir `build_graphics_filters()` - sintaxe correta para clock
- Adicionar mais logging
- Verificar cadeia de filtros

### `frontend/src/components/` (a identificar)
- Corrigir reset do video element no preview

---

**Nota**: O problema principal é a sintaxe do filtro clock que não mostra hora real.