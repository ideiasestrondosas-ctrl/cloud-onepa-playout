# Overlay Converter Pro

Conversor profissional de imagens para overlays otimizados em sistemas de playout (Antigravity, vMix, OBS, CasparCG, etc).

## 🎯 Características

- **Conversão Automática**: Converte qualquer formato de imagem para PNG-32 otimizado
- **Transparência Alpha**: Suporte completo para canal alpha (24-bit RGB + 8-bit alpha)
- **Auto-Trim**: Remove automaticamente áreas transparentes desnecessárias
- **Presets**: Dimensões pré-configuradas para casos comuns
- **Preview em Tempo Real**: Visualização imediata do resultado
- **Compressão Máxima**: PNG com compressão nível 9
- **100% Browser**: Sem necessidade de servidor ou instalação

## 📋 Formatos Suportados

**Input:** JPG, PNG, BMP, WEBP, GIF  
**Output:** PNG-32 (otimizado para playout)

## 🚀 Como Usar

### Opção 1: Abrir Diretamente
1. Abra o ficheiro `index.html` em qualquer browser moderno
2. Arraste uma imagem ou clique para selecionar
3. Configure as dimensões desejadas
4. Clique em "Converter & Otimizar"
5. Faça download do ficheiro otimizado

### Opção 2: Com Live Server (VS Code)
1. Instale a extensão "Live Server" no VS Code
2. Abra a pasta do projeto no VS Code
3. Clique com botão direito em `index.html` → "Open with Live Server"
4. O browser abrirá automaticamente

### Opção 3: Servidor Local
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Depois aceda: http://localhost:8000
```

## 🎨 Presets Disponíveis

| Preset | Dimensões | Uso Comum |
|--------|-----------|-----------|
| Lower Third | 400×200px | Legendas e informação |
| Banner | 600×150px | Headers e banners |
| Logo Quadrado | 300×300px | Logos e ícones |
| Full HD | 1920×1080px | Overlays full screen |
| 4K UHD | 3840×2160px | Overlays 4K |
| Custom | Personalizado | Qualquer dimensão |

## ⚙️ Especificações Técnicas

### Output
- **Formato**: PNG
- **Profundidade**: 32-bit (24-bit RGB + 8-bit Alpha)
- **Compressão**: Nível 9 (máxima)
- **Metadados**: Removidos automaticamente
- **Qualidade**: Sem perda (lossless)

### Otimizações Aplicadas
- Conversão para espaço de cor RGB
- Canal alpha preservado
- Redimensionamento com algoritmo high-quality
- Remoção de espaço transparente desnecessário
- Compressão PNG otimizada

## 📁 Estrutura do Projeto

```
overlay-converter-pro/
├── index.html          # Aplicação principal
├── README.md          # Documentação
├── LICENSE            # Licença MIT
└── assets/
    └── screenshot.png # Screenshot (opcional)
```

## 🔧 Tecnologias Utilizadas

- **HTML5 Canvas**: Processamento de imagem
- **JavaScript Vanilla**: Sem dependências
- **CSS3**: Interface moderna e responsiva
- **Google Fonts**: Orbitron + IBM Plex Mono

## 💡 Dicas de Uso

### Para Melhor Performance
1. **Dimensões Exatas**: Use apenas o tamanho necessário do overlay
2. **Auto-Trim Ativo**: Mantém a opção ativada para remover transparência
3. **Formatos Simples**: Evite imagens com gradientes muito complexos
4. **Teste Local**: Sempre teste o overlay no seu sistema de playout antes da produção

### Casos de Uso Comuns

**Lower Thirds**
- Dimensões: 400×200px ou 600×150px
- Posição: Canto inferior esquerdo/direito

**Logos**
- Dimensões: 200×200px a 400×400px
- Mantém proporções: ✓
- Auto-trim: ✓

**Bugs/Watermarks**
- Dimensões: 150×150px a 300×300px
- Posição: Cantos do ecrã

**Full Screen Overlays**
- Dimensões: 1920×1080px (HD) ou 3840×2160px (4K)
- Para transições e grafismos completos

## 🎬 Compatibilidade com Sistemas de Playout

Testado e otimizado para:
- ✅ Antigravity
- ✅ vMix
- ✅ OBS Studio
- ✅ CasparCG
- ✅ Wirecast
- ✅ XSplit
- ✅ Resolume

## 🐛 Resolução de Problemas

**Imagem aparece cortada**
- Desative "Auto-Trim" se quiser manter toda a área transparente

**Ficheiro muito grande**
- Reduza as dimensões para o mínimo necessário
- Use auto-trim para remover áreas desnecessárias

**Qualidade inferior**
- Certifique-se de que a imagem original tem boa resolução
- Evite aumentar muito as dimensões (upscaling)

**Transparência não funciona**
- Verifique se a imagem original tem canal alpha
- Alguns formatos JPG não suportam transparência

## 📝 Limitações

- Tamanho máximo de ficheiro: 25MB
- Processamento no browser (requer JavaScript ativado)
- Formatos de video não suportados
- Animações não suportadas (apenas imagens estáticas)

## 🔐 Privacidade

- Todo o processamento é feito localmente no browser
- Nenhuma imagem é enviada para servidores externos
- Nenhum dado é armazenado ou transmitido

## 📄 Licença

MIT License - Livre para uso pessoal e comercial

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

## 📧 Suporte

Para questões ou problemas, crie um issue no repositório do projeto.

---

**Desenvolvido para profissionais de broadcast e produção de vídeo** 🎥✨
