# Cloud Onepa Playout - User Manual

**Versão 1.9.2-PRO**  
**Data:** 2026-01-13

---

## 📖 Índice

1. [Introdução](#introdução)
2. [Primeiros Passos](#primeiros-passos)
3. [Media Library](#media-library)
4. [Playlist Editor](#playlist-editor)
5. [Calendário](#calendário)
6. [Dashboard](#dashboard)
7. [Configurações](#configurações)
8. [Templates](#templates)
9. [Resolução de Problemas](#resolução-de-problemas)

---

## 1. Introdução

### O que é o Cloud Onepa Playout?

O Cloud Onepa Playout é um sistema de automação de playout 24/7 simplificado e moderno, ideal para streaming contínuo de vídeo. Permite gerir media, criar playlists, agendar programação e controlar a reprodução de forma intuitiva.

### Funcionalidades Principais

- ✅ **Upload de Media** - Suporte para vídeo, áudio e imagens
- ✅ **Gestão de Playlists** - Editor visual com drag-and-drop
- ✅ **Agendamento** - Calendário com repetições (daily/weekly/monthly)
- ✅ **Validação 24h** - Garante playlists completas
- ✅ **Controlo de Playout** - Start/Stop/Skip em tempo real
- ✅ **Templates** - Presets para criação rápida de playlists
- ✅ **Multi-formato** - RTMP, HLS, SRT, UDP

---

## 2. Primeiros Passos

### Login

1. Aceda a `http://localhost:3000` (ou URL do servidor)
2. Insira as credenciais:
   - **Username:** `admin`
   - **Password:** `admin`
3. Clique em **Login**

> ⚠️ **Importante:** Altere a password padrão após o primeiro login em **Configurações → Utilizadores**

### Interface Principal

Após login, verá o **Dashboard** com:

- **Menu Lateral** - Navegação entre páginas
- **Status do Playout** - Estado atual (ON AIR/STOPPED)
- **Cards Informativos** - Uptime, clips reproduzidos, etc.

### Navegação

Use o menu lateral para aceder:

- 📊 **Dashboard** - Visão geral e controlos
- 📁 **Media Library** - Gestão de ficheiros
- 📝 **Playlists** - Editor de playlists
- 📅 **Calendário** - Agendamento
- 📋 **Templates** - Presets de playlists
- ⚙️ **Configurações** - Sistema e utilizadores

---

## 3. Media Library

### Upload de Ficheiros

**Método 1: Drag & Drop**

1. Aceda a **Media Library**
2. Arraste ficheiros para a área de upload
3. Aguarde conclusão (progress bar)
4. Ficheiros aparecem no grid com thumbnails

**Método 2: Click**

1. Clique na área de upload
2. Selecione ficheiros no explorador
3. Confirme upload

**Formatos Suportados:**

- **Vídeo:** MP4, MKV, AVI, MOV, WebM
- **Áudio:** MP3, WAV, AAC, FLAC
- **Imagem:** JPG, PNG, GIF, WebP

### Filtros e Pesquisa

**Filtrar por Tipo:**

1. Use o dropdown "Tipo"
2. Selecione: Todos, Vídeo, Áudio ou Imagem
3. Grid atualiza automaticamente

**Pesquisar:**

1. Digite nome do ficheiro na caixa de pesquisa
2. Resultados filtram em tempo real

### Preview de Media

1. Clique no ícone ▶️ (play) no card
2. Dialog abre com player
3. Para vídeos/áudios: reproduz automaticamente
4. Veja metadata: duração, resolução, codec

### Deletar Ficheiros

1. Clique no ícone 🗑️ (delete)
2. Confirme a ação
3. Ficheiro é removido (físico + database)

> ⚠️ **Atenção:** Deletar é permanente!

---

## 4. Playlist Editor

### Criar Nova Playlist

1. Aceda a **Playlists**
2. Clique em **Nova Playlist**
3. Insira:
   - **Nome:** Ex: "Playlist 09/01/2026"
   - **Data:** Selecione data (opcional)
4. Clique em **Adicionar Clip**
5. Selecione vídeos/áudios da lista
6. Clips aparecem na lista

### Reordenar Clips (Drag & Drop)

1. Clique e segure no ícone ⋮⋮ (drag handle)
2. Arraste clip para nova posição
3. Solte para confirmar
4. Ordem atualiza automaticamente

### Validação de Duração

O sistema valida se a playlist completa **24 horas**:

**Alert Verde (✓):**

- Playlist válida (~24h ±5%)
- Pronta para agendar

**Alert Amarelo (⚠):**

- **"Faltam Xh Ym Zs"** - Adicione mais clips
- **"Excede em Xh Ym Zs"** - Remova clips

**Dica:** Use fillers para completar tempo restante

### Salvar Playlist

1. Verifique que validação está verde
2. Clique em **Salvar**
3. Playlist aparece na lista lateral
4. Pode editar posteriormente

### Carregar Playlist Existente

1. Clique numa playlist na lista lateral
2. Nome, data e clips carregam automaticamente
3. Edite conforme necessário
4. Salve novamente

---

## 5. Calendário

### Visualização

O calendário mostra agendamentos por mês:

- 🔴 **Vermelho** - Agendamento único
- 🔵 **Azul** - Repetição (daily/weekly/monthly)

### Criar Agendamento

1. Aceda a **Calendário**
2. Clique numa **data futura**
3. No dialog:
   - **Playlist:** Selecione da lista
   - **Horário:** Ex: 06:00
   - **Repetição:** Escolha tipo
4. Clique em **Agendar**
5. Evento aparece no calendário

### Tipos de Repetição

**Sem repetição:**

- Executa apenas na data selecionada

**Diária:**

- Repete todos os dias a partir da data

**Semanal:**

- Repete no mesmo dia da semana

**Mensal:**

- Repete no mesmo dia do mês

### Deletar Agendamento

1. Clique no **evento** no calendário
2. Confirme delete
3. Evento desaparece

---

## 6. Dashboard

### Status do Playout

**STOPPED (Vermelho):**

- Playout não está ativo
- Botão **Start** disponível

**ON AIR (Verde):**

- Playout em execução
- Botões **Stop** e **Skip** disponíveis

### Controlos

**Start:**

1. Clique em **Start**
2. Status muda para "ON AIR"
3. Clip atual começa a reproduzir

**Stop:**

1. Clique em **Stop**
2. Playout para imediatamente
3. Status volta para "STOPPED"

**Skip:**

1. Durante reprodução, clique em **Skip**
2. Avança para próximo clip
3. Útil para pular conteúdo

### Cards Informativos

**Uptime:**

- Tempo desde último start
- Formato: Xh Ym

**Clips Reproduzidos Hoje:**

- Contador de clips
- Reset à meia-noite

**Clip Atual:**

- Nome do ficheiro
- Duração total

**Próximos Clips:**

- Lista dos próximos 5 clips
- Ordem de reprodução

### Monitor de Saída

281:
282: O **Monitor de Saída** oferece ferramentas profissionais para verificar a qualidade do broadcast:
283:
284: **Live Preview:**
285:
286: - Player HLS de baixa latência
287: - Mostra exatamente o que está a ser transmitido
288: - Controlo de volume independente (local)
289:
290: **LUFS Meter (Áudio):**
291:
292: - Barra vertical à direita do vídeo
293: - **Verde:** Níveis seguros (-23 LUFS)
294: - **Amarelo:** Atenção, níveis elevados
295: - **Vermelho:** Clipping/Distorção
296: - _Nota: Requer que o volume local esteja ativo (unmuted)_
297:
298: **Ações de Diagnóstico:**
299:
300: - **Open VLC:** Abre o stream diretamente no VLC Media Player (nativo)
301: - **Copy Link:** Copia o link HLS para a área de transferência
302: - **Diagnosticar:** Abre janela com logs técnicos do FFmpeg e sistema
303:
304: ---

## 7. Configurações

### Tab: Output

**Tipo de Output:**

- **RTMP** - Para YouTube, Twitch, etc.
- **HLS** - Para streaming HTTP
- **SRT** - Para transmissão segura
- **UDP** - Para broadcast local
- **Desktop** - Preview local

**URL de Output:**

- Ex RTMP: `rtmp://a.rtmp.youtube.com/live2/STREAM_KEY`
- Ex HLS: `http://localhost:8080/hls/stream.m3u8`

**Qualidade:**

- **Resolução:** 720p, 1080p, 4K
- **FPS:** 24, 25, 30, 60
- **Bitrate Vídeo:** Ex: 5000k
- **Bitrate Áudio:** Ex: 192k

### Tab: Caminhos

Configure diretórios de armazenamento:

- **Media:** Vídeos/áudios uploaded
- **Thumbnails:** Imagens geradas
- **Playlists:** Ficheiros JSON
- **Fillers:** Vídeos para preencher tempo

> 💡 **Dica:** Use caminhos absolutos

### Tab: Playout

**Início do Dia:**

- Horário de início da programação
- Ex: 06:00 (6h da manhã)

**Logo Overlay:**

- **Path:** Caminho para imagem PNG
- **Posição:** Superior/Inferior, Esquerdo/Direito

### Tab: Utilizadores

**Adicionar Utilizador:**

1. Clique em **Adicionar Utilizador**
2. Insira username e password
3. Selecione role:
   - **Admin** - Acesso total
   - **Operator** - Sem acesso a settings
4. Clique em **Adicionar**

**Deletar:**

- Clique no ícone 🗑️
- Utilizador "admin" não pode ser deletado

### Tab: Presets

Clique num preset para aplicar configurações:

- **720p Streaming** - Básico (2500k)
- **1080p HD** - Profissional (5000k)
- **4K Ultra HD** - Máxima qualidade (15000k)

**Guardar:**

- Clique em **Guardar Configurações** no bottom

---

## 8. Templates

### Usar Template

1. Aceda a **Templates**
2. Veja templates disponíveis:
   - **Morning Show** - 6 horas
   - **Full Day 24h** - 24 horas
   - **Loop Content** - Loop com comerciais
3. Clique em **Usar Template**
4. Insira nome e data da playlist
5. Clique em **Criar Playlist**
6. Playlist criada (edite em Playlists)

### Estrutura de Templates

Cada template define:

- **Duração total**
- **Estrutura:** Sequência de tipos (intro, content, commercial, outro, filler)
- **Duração por tipo**

---

## 9. Resolução de Problemas

### Login não funciona

**Problema:** "Invalid credentials"

**Solução:**

1. Verifique username: `admin`
2. Verifique password: `admin`
3. Se alterou password, use a nova
4. Limpe cache do browser (Ctrl+Shift+Del)

### Upload falha

**Problema:** Ficheiro não faz upload

**Soluções:**

1. Verifique formato suportado
2. Verifique tamanho (<2GB recomendado)
3. Verifique conexão à internet
4. Tente ficheiro menor primeiro

### Playlist não valida

**Problema:** Alert amarelo "Faltam Xh"

**Solução:**

1. Adicione mais clips
2. Use fillers para completar
3. Verifique duração de cada clip
4. Objetivo: ~24h (86400 segundos)

### Playout não inicia

**Problema:** Botão Start não funciona

**Soluções:**

1. Verifique se há playlist agendada para hoje
2. Verifique configurações de output
3. Verifique logs do backend
4. Reinicie o serviço

### Sem thumbnail

**Problema:** Vídeo sem imagem preview

**Soluções:**

1. Aguarde processamento (pode demorar)
2. Verifique se FFmpeg está instalado
3. Verifique permissões do diretório thumbnails
4. Re-upload do ficheiro

---

## 📞 Suporte

**Documentação:**

- [README.md](../README.md) - Overview
- [INSTALL.md](INSTALL.md) - Instalação
- [FAQ.md](FAQ.md) - Perguntas frequentes
- [TESTING.md](TESTING.md) - Testes
- [DEPLOY.md](DEPLOY.md) - Deploy

**Comunidade:**

- GitHub Issues: Reportar bugs
- Discussions: Perguntas e sugestões

---

**Última atualização:** 2026-01-11  
**Versão:** 1.8.2-EXP
