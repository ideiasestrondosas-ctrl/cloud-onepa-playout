# Plano: Corrigir Graphics Layers - Aplicar no Backend/FFmpeg

## Problema Reportado
As graphics layers aparecem no preview do GraphicsEditor, mas não aparecem no Dashboard, Multi-canal, nem nos protocolos de saída.

## Análise Técnica

### Causa Raiz Identificada
O sistema de graphics layers tem duas partes:

1. **Frontend (LayerPreview.jsx)**: Renderiza as camadas como **overlays HTML/CSS** sobre o vídeo - funciona apenas no editor de graphics
2. **Backend/Engine**: **NÃO tem implementação** para aplicar as camadas ao fluxo FFmpeg

O código atual:
- Armazena as camadas na base de dados (`graphics_layers`)
- O frontend mostra preview como sobreposição HTML
- **Mas o FFmpeg nunca recebe instruções para renderizar as camadas**

### Como o Preview Funciona
O [`LayerPreview.jsx`](frontend/src/components/GraphicsLayers/LayerPreview.jsx) renderiza camadas como:
- Clock: elemento `<Box>` com hora atual
- LowerThird: elemento `<Box>` com texto
- Marquee: elemento `<Box>` com animação CSS

### O que Falta no Backend
O [`backend/src/services/ffmpeg.rs`](backend/src/services/ffmpeg.rs) não tem código para:
1. Buscar as graphics layers da base de dados
2. Aplicar filtros FFmpeg (`drawtext`, etc.) para renderizar as camadas no fluxo de vídeo

## Solução Proposta

### Implementação Necessária

1. **No engine.rs**:
   - Buscar graphics layers ativas da base de dados
   - Passar as camadas para o serviço FFmpeg

2. **No ffmpeg.rs**:
   - Construir filtros FFmpeg (`filter_complex`) para cada tipo de camada:
     - **Clock**: usar `drawtext` com variável de tempo
     - **LowerThird**: usar `drawtext` para texto estático
     - **Marquee**: usar `drawtext` com animação ou múltiplas instâncias

3. **Configuração**:
   - Posição (x, y, anchor)
   - Opacidade
   - Tamanho
   - Cor/fonte

## Complexidade
**ALTA** - Esta funcionalidade requer implementação significativa no backend. Não é uma correção simples.

## Alternativa Rápida (Se Available)
Verificar se já existe algum mecanismo de overlay que pode ser usado em vez de implementar do zero.

## Recomendação
Esta funcionalidade precisa ser implementada completamente. O trabalho envolve:
1. Buscar layers da BD
2. Converter configuração de cada layer em filtros FFmpeg
3. Aplicar filtros ao fluxo de vídeo
4. Testar em todos os protocolos (Dashboard, Multi-canal, RTMP, SRT)
