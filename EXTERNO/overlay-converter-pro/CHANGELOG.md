# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste ficheiro.

## [1.0.0] - 2026-01-14

### Adicionado
- Interface web completa para conversão de overlays
- Suporte para múltiplos formatos de input (JPG, PNG, BMP, WEBP, GIF)
- Conversão automática para PNG-32 otimizado
- Preview em tempo real da imagem
- Sistema de drag & drop para upload
- Presets de dimensões comuns (Lower Third, Banner, Logo, Full HD, 4K)
- Opção de manter proporções automaticamente
- Feature de auto-trim para remover transparência desnecessária
- Estimativa de tamanho do ficheiro final
- Barra de progresso durante conversão
- Mensagens de status e feedback visual
- Download direto do ficheiro convertido
- Design responsivo para desktop e mobile
- Estética industrial/técnica profissional
- Documentação completa em README.md

### Especificações Técnicas
- Processamento 100% no browser (sem servidor necessário)
- Canvas HTML5 para manipulação de imagem
- Compressão PNG nível máximo
- Profundidade de cor: 32-bit (24-bit RGB + 8-bit alpha)
- Algoritmo de redimensionamento high-quality
- Remoção automática de metadados

### Compatibilidade
- Testado em Chrome, Firefox, Safari, Edge
- Otimizado para sistemas de playout: Antigravity, vMix, OBS, CasparCG
- Suporte completo para transparência alpha channel
