# Plano Faseado: Implementação de Graphics Layers no Backend

## Objetivo
Implementar as graphics layers (clock, lowerthird, marquee) no fluxo de vídeo do FFmpeg de forma faseada, sem comprometer o funcionamento atual.

---

## Fase 1: Implementação Simples de Texto (Logo/Overlay)
**Objetivo**: Apenas adicionar texto simples usando drawtext, sem complexidade de posicionamentodinâmico.

### Tasks
- [ ] 1.1 Criar função básica `build_simple_text_filter()` em ffmpeg.rs
- [ ] 1.2 Testar com um texto estático simples
- [ ] 1.3 Verificar se o FFmpeg aceita o filtro sem erros

### Critério de Sucesso
Texto simples aparece no vídeo sem erros deFFmpeg.

---

## Fase 2: Clock (Relógio)
**Objetivo**: Adicionar filtro de relógio com formatação de tempo.

### Tasks
- [ ] 2.1 Implementar filtro drawtext com `%{localtime}` para clock
- [ ] 2.2 Suportar diferentes formatos (HH:mm:ss, HH:mm, etc.)
- [ ] 2.3 Adicionar configuração de posição básica
- [ ] 2.4 Testar com um layer clock

### Critério de Sucesso
Relógio aparece no vídeo e atualiza em tempo real.

---

## Fase 3: LowerThird
**Objetivo**: Adicionar lower third com texto estático.

### Tasks
- [ ] 3.1 Implementar filtro drawtext para texto primário
- [ ] 3.2 Adicionar suporte para cor de fundo (box)
- [ ] 3.3 Configurar posição (top, bottom)
- [ ] 3.4 Testar com um layer lowerthird

### Critério de Sucesso
Lower third aparece no vídeo com texto configurado.

---

## Fase 4: Marquee (Texto Animado)
**Objetivo**: Adicionar texto em scrolling.

### Tasks
- [ ] 4.1 Investigar como fazer scrolling com FFmpeg drawtext
- [ ] 4.2 Implementar filtro com animação simples
- [ ] 4.3 Testar com um layer marquee

### Critério de Sucesso
Texto scrolling aparece no vídeo.

---

## Fase 5: Posicionamento Avançado
**Objetivo**: Suportar todos os tipos de posicionamento (top-left, top-right, bottom-left, bottom-right, center).

### Tasks
- [ ] 5.1 Calcular coordenadas baseadas no anchor
- [ ] 5.2 Suportar diferentes resoluções
- [ ] 5.3 Testar posicionamento em diferentes posições

### Critério de Sucesso
Camadas aparecem na posição correta independente da resolução.

---

## Fase 6: Integração Completa com BD
**Objetivo**: Buscar layers da BD e aplicar automaticamente.

### Tasks
- [ ] 6.1 Reativar lógica de busca na BD em engine.rs
- [ ] 6.2 Aplicar filtros para todas as layers habilitadas
- [ ] 6.3 Suportar ordenação por z_index
- [ ] 6.4 Testar com múltiplas camadas

### Critério de Sucesso
Todas as layers configuradas aparecem automaticamente no vídeo.

---

## Ficheiros a Modificar
1. `backend/src/services/ffmpeg.rs` - Funções de build de filtros
2. `backend/src/services/engine.rs` - Integração com BD (Fase 6)

## Notas
- Cada fase deve ser testada独立mente antes de avançar
- Se uma fase falhar, podemos revertê-la sem afectar as anteriores
- A implementação actual dos filtros drawtext está incompleta e precisa de ajustes nos parâmetros
