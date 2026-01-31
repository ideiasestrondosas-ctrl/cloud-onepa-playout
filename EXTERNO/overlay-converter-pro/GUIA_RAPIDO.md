# 🚀 Guia Rápido - Overlay Converter Pro

## Instalação (3 minutos)

### 1. Extrair Ficheiros
- Descompacta o ZIP para uma pasta no teu computador
- Exemplo: `C:\overlay-converter-pro\` ou `~/overlay-converter-pro/`

### 2. Abrir no VS Code
```bash
# Opção A: Linha de comandos
cd caminho/para/overlay-converter-pro
code .

# Opção B: Interface
VS Code → File → Open Folder → Seleciona a pasta
```

### 3. Instalar Extensão (Recomendado)
- O VS Code vai sugerir instalar "Live Server"
- Clica em "Install" ou instala manualmente:
  - Extensions (Ctrl+Shift+X)
  - Procura "Live Server"
  - Install

## Uso Rápido

### Método 1: Live Server (Recomendado)
1. Abre `index.html` no VS Code
2. Clica com botão direito → "Open with Live Server"
3. Browser abre automaticamente
4. **PRONTO!** 🎉

### Método 2: Duplo Clique
1. Vai à pasta do projeto
2. Duplo clique em `index.html`
3. Abre no browser padrão
4. **PRONTO!** 🎉

## Como Converter uma Imagem

### Passo a Passo
1. **Upload**: Arrasta imagem ou clica "selecionar"
2. **Configura**: Escolhe dimensões ou usa preset
3. **Converte**: Clica "Converter & Otimizar"
4. **Download**: Clica "Download PNG"

### Configurações Principais

#### 📏 Dimensões
- **Lower Third**: 400×200px (legendas)
- **Banner**: 600×150px (headers)
- **Logo**: 300×300px (cantos)
- **Full HD**: 1920×1080px (completo)
- **Custom**: Define manualmente

#### ⚙️ Opções
- ✅ **Manter Proporções**: Evita distorção
- ✅ **Auto-Trim**: Remove transparência extra (recomendado)

## Exemplos Práticos

### Exemplo 1: Logo no Canto
```
Ficheiro: logo.jpg (qualquer tamanho)
Preset: Logo Quadrado (300×300)
Manter Proporções: ✓
Auto-Trim: ✓
Resultado: logo_optimized.png (pronto para playout)
```

### Exemplo 2: Lower Third
```
Ficheiro: lower-third.png (grande)
Preset: Lower Third (400×200)
Manter Proporções: ✗ (usa dimensões exatas)
Auto-Trim: ✓
Resultado: Overlay pronto para texto sobreposto
```

### Exemplo 3: Bug/Watermark
```
Ficheiro: watermark.png
Dimensões Custom: 200×100
Manter Proporções: ✓
Auto-Trim: ✓
Resultado: Marca d'água leve e otimizada
```

## Dicas Pro 💡

### Performance
- Usa dimensões exatas necessárias (não maiores)
- Mantém Auto-Trim ativado
- Imagem original com boa qualidade

### Qualidade
- Input PNG > JPG (para transparência)
- Evita aumentar muito o tamanho (upscaling)
- Testa sempre no teu sistema de playout

### Workflow
1. Cria template base no Photoshop/GIMP
2. Exporta PNG com transparência
3. Converte nesta ferramenta
4. Importa no Antigravity/vMix/OBS
5. Ajusta posição conforme necessário

## Teclas de Atalho

Dentro da aplicação:
- **Clica Upload Zone**: Seleciona ficheiro
- **Arrasta Imagem**: Upload rápido
- **Enter no Input**: Atualiza preview
- **Esc**: Limpa tudo (usa botão Limpar)

## Resolução Rápida de Problemas

### ❌ Imagem não aparece
- Verifica se é formato suportado (JPG, PNG, BMP, WEBP, GIF)
- Confirma tamanho < 25MB

### ❌ Transparência não funciona
- Ficheiro original deve ter canal alpha
- JPG não suporta transparência (usa PNG)

### ❌ Ficheiro muito grande
- Reduz dimensões
- Ativa Auto-Trim
- Usa dimensões mínimas necessárias

### ❌ Live Server não funciona
- Instala extensão Live Server
- Reinicia VS Code
- Ou usa duplo clique em index.html

## Próximos Passos

1. ✅ Converte teu primeiro overlay
2. 📝 Guarda presets úteis (anota dimensões)
3. 🎬 Testa no teu sistema de playout
4. 🔄 Cria workflow de produção
5. 🚀 Produz conteúdo profissional!

## Suporte

- 📖 Lê o README.md completo
- 🐛 Problemas? Verifica CHANGELOG.md
- 💬 Dúvidas? Cria issue no repositório

---

**Boa produção! 🎥✨**
