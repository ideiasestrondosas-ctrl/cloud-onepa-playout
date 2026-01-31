# Cloud Onepa Playout - Manual de Testes

## 📋 Visão Geral

Este documento descreve os procedimentos de teste para o Cloud Onepa Playout, incluindo testes manuais, automatizados e validação de fluxos completos.

---

## 🧪 Testes Manuais

### 1. Autenticação

#### Login

- [ ] Aceder a `/login`
- [ ] Inserir credenciais inválidas → Deve mostrar erro
- [ ] Inserir credenciais válidas (`admin` / `admin`)
- [ ] Verificar redirecionamento para `/` (Dashboard)
- [ ] Verificar que token JWT foi salvo no localStorage
- [ ] Verificar que menu de navegação está visível

#### Logout

- [ ] Clicar em "Logout" no menu lateral
- [ ] Verificar redirecionamento para `/login`
- [ ] Verificar que token foi removido do localStorage
- [ ] Tentar aceder a `/` → Deve redirecionar para `/login`

#### Proteção de Rotas

- [ ] Sem login, tentar aceder a `/media` → Redireciona para `/login`
- [ ] Sem login, tentar aceder a `/playlists` → Redireciona para `/login`
- [ ] Após login, todas as rotas devem estar acessíveis

---

### 2. Media Library

#### Upload de Ficheiros

- [ ] Arrastar ficheiro de vídeo (MP4) para área de upload
- [ ] Verificar que progress bar aparece
- [ ] Aguardar conclusão do upload
- [ ] Verificar que ficheiro aparece no grid
- [ ] Verificar que thumbnail foi gerado
- [ ] Verificar metadata (duração, resolução, codec)

#### Filtros e Pesquisa

- [ ] Filtrar por tipo "video" → Apenas vídeos devem aparecer
- [ ] Filtrar por tipo "audio" → Apenas áudios devem aparecer
- [ ] Pesquisar por nome de ficheiro → Resultados filtrados
- [ ] Limpar filtros → Todos os ficheiros voltam a aparecer

#### Paginação

- [ ] Upload de 25+ ficheiros
- [ ] Verificar que paginação aparece
- [ ] Clicar em "Próxima" → Página 2
- [ ] Clicar em "Anterior" → Página 1
- [ ] Verificar indicador "Página X de Y"

#### Preview

- [ ] Clicar em ícone de play num vídeo
- [ ] Verificar que dialog abre
- [ ] Verificar que vídeo reproduz
- [ ] Verificar metadata no dialog
- [ ] Fechar dialog

#### Delete

- [ ] Clicar em ícone de delete
- [ ] Verificar confirmação
- [ ] Confirmar → Ficheiro removido do grid
- [ ] Verificar que ficheiro físico foi removido

---

### 3. Playlist Editor

#### Criar Nova Playlist

- [ ] Clicar em "Nova Playlist"
- [ ] Inserir nome da playlist
- [ ] Selecionar data
- [ ] Clicar em "Adicionar Clip"
- [ ] Selecionar vídeo da lista
- [ ] Verificar que clip aparece na lista
- [ ] Verificar duração total atualizada

#### Drag & Drop

- [ ] Adicionar 3+ clips
- [ ] Arrastar clip para nova posição
- [ ] Verificar que ordem mudou
- [ ] Verificar que duração total permanece correta

#### Validação de Duração

- [ ] Adicionar clips com duração total < 24h
- [ ] Verificar alert amarelo "Faltam Xh Ym Zs"
- [ ] Adicionar mais clips até ~24h
- [ ] Verificar alert verde "Válido"
- [ ] Adicionar clips excedendo 24h
- [ ] Verificar alert amarelo "Excede em Xh Ym Zs"

#### Salvar Playlist

- [ ] Clicar em "Salvar"
- [ ] Verificar que playlist aparece na lista lateral
- [ ] Recarregar página
- [ ] Verificar que playlist persiste

#### Carregar Playlist

- [ ] Clicar numa playlist salva
- [ ] Verificar que nome e data são carregados
- [ ] Verificar que clips são carregados na ordem correta
- [ ] Verificar duração total

---

### 4. Calendário

#### Visualização

- [ ] Aceder a `/calendar`
- [ ] Verificar que calendário mensal aparece
- [ ] Verificar legenda de cores
- [ ] Navegar entre meses (prev/next)

#### Criar Agendamento

- [ ] Clicar numa data futura
- [ ] Verificar que dialog abre
- [ ] Selecionar playlist
- [ ] Definir horário de início (ex: 06:00)
- [ ] Selecionar repetição "Sem repetição"
- [ ] Clicar em "Agendar"
- [ ] Verificar que evento aparece no calendário (vermelho)

#### Repetições

- [ ] Criar agendamento com repetição "Diária"
- [ ] Verificar que evento aparece (azul)
- [ ] Criar agendamento com repetição "Semanal"
- [ ] Verificar que evento aparece (azul)

#### Deletar Agendamento

- [ ] Clicar num evento no calendário
- [ ] Confirmar delete
- [ ] Verificar que evento desaparece

---

### 5. Dashboard

#### Status de Playout

- [ ] Verificar card "Status do Playout"
- [ ] Status inicial deve ser "STOPPED" (vermelho)
- [ ] Clicar em "Start"
- [ ] Verificar que status muda para "ON AIR" (verde)
- [ ] Verificar que botões mudam para "Stop" e "Skip"

#### Controlos

- [ ] Com playout running, clicar em "Skip"
- [ ] Verificar que clip atual muda
- [ ] Clicar em "Stop"
- [ ] Verificar que status volta para "STOPPED"

#### Cards Informativos

- [ ] Verificar card "Uptime" (formato Xh Ym)
- [ ] Verificar card "Clips Reproduzidos Hoje"
- [ ] Verificar card "Clip Atual" (quando playing)
- [ ] Verificar card "Próximos Clips"

---

### 6. Settings

#### Tab Output

- [ ] Selecionar tipo de output (RTMP)
- [ ] Inserir URL válida
- [ ] Selecionar resolução (1080p)
- [ ] Selecionar FPS (25)
- [ ] Inserir bitrates
- [ ] Clicar em "Guardar Configurações"
- [ ] Verificar mensagem de sucesso

#### Tab Paths

- [ ] Verificar paths padrão
- [ ] Modificar um path
- [ ] Guardar
- [ ] Recarregar página → Path deve persistir

#### Tab Utilizadores

- [ ] Clicar em "Adicionar Utilizador"
- [ ] Inserir username e password
- [ ] Selecionar role (operator)
- [ ] Adicionar
- [ ] Verificar que utilizador aparece na lista
- [ ] Tentar deletar utilizador "admin" → Não deve permitir
- [ ] Deletar utilizador criado → Deve permitir

#### Tab Presets

- [ ] Clicar em preset "720p Streaming"
- [ ] Verificar que configurações são aplicadas (TODO)
- [ ] Clicar em preset "1080p HD"
- [ ] Clicar em preset "4K Ultra HD"

---

### 7. Templates

#### Visualização

- [ ] Aceder a `/templates`
- [ ] Verificar 3 templates padrão
- [ ] Verificar estrutura de cada template

#### Usar Template

- [ ] Clicar em "Usar Template" (Morning Show)
- [ ] Verificar que dialog abre
- [ ] Inserir nome da playlist
- [ ] Selecionar data
- [ ] Clicar em "Criar Playlist"
- [ ] Verificar mensagem de sucesso (TODO: verificar em /playlists)

---

## 🔄 Fluxos Completos

### Fluxo 1: Upload → Playlist → Agendamento

1. **Upload de Media**

   - [ ] Fazer upload de 5 vídeos
   - [ ] Verificar que todos têm thumbnails
   - [ ] Verificar metadata de todos

2. **Criar Playlist**

   - [ ] Ir para Playlist Editor
   - [ ] Criar nova playlist "Teste 24h"
   - [ ] Adicionar os 5 vídeos
   - [ ] Ajustar até ~24h com fillers
   - [ ] Salvar playlist

3. **Agendar Playlist**

   - [ ] Ir para Calendar
   - [ ] Selecionar data futura
   - [ ] Agendar playlist "Teste 24h"
   - [ ] Verificar evento no calendário

4. **Validação**
   - [ ] Verificar que playlist está salva
   - [ ] Verificar que agendamento está ativo
   - [ ] Verificar que pode editar playlist
   - [ ] Verificar que pode deletar agendamento

### Fluxo 2: Template → Customização → Playout

1. **Usar Template**

   - [ ] Ir para Templates
   - [ ] Usar template "Full Day 24h"
   - [ ] Criar playlist a partir do template

2. **Customizar**

   - [ ] Ir para Playlist Editor
   - [ ] Carregar playlist criada
   - [ ] Adicionar clips específicos
   - [ ] Reordenar com drag-and-drop
   - [ ] Validar duração
   - [ ] Salvar

3. **Configurar Output**

   - [ ] Ir para Settings
   - [ ] Configurar RTMP output
   - [ ] Definir resolução 1080p
   - [ ] Guardar configurações

4. **Iniciar Playout**
   - [ ] Ir para Dashboard
   - [ ] Clicar em "Start"
   - [ ] Verificar status "ON AIR"
   - [ ] Verificar clip atual
   - [ ] Verificar próximos clips

---

## ⚠️ Testes de Erro

### Validações de Input

- [ ] Login com campos vazios → Erro
- [ ] Upload de ficheiro inválido (.txt) → Erro
- [ ] Criar playlist sem nome → Erro
- [ ] Salvar playlist vazia → Erro
- [ ] Agendar sem selecionar playlist → Erro
- [ ] Criar utilizador com username vazio → Erro

### Limites

- [ ] Upload de ficheiro muito grande (>2GB) → Deve mostrar progresso
- [ ] Criar playlist com 100+ clips → Deve funcionar
- [ ] Pesquisar com caracteres especiais → Não deve quebrar

### Concorrência

- [ ] Upload de múltiplos ficheiros simultaneamente
- [ ] Editar playlist enquanto outra pessoa edita (TODO: multi-user)
- [ ] Deletar media que está em playlist → Deve avisar (TODO)

---

## 📊 Checklist de Validação Final

### Funcionalidades Core

- [ ] ✅ Autenticação JWT funcional
- [ ] ✅ Upload de media com metadata
- [ ] ✅ Gestão de playlists
- [ ] ✅ Agendamento com calendário
- [ ] ✅ Controlo de playout
- [ ] ✅ Configurações persistentes

### UX/UI

- [ ] ✅ Layout responsivo (desktop)
- [ ] ✅ Navegação intuitiva
- [ ] ✅ Feedback visual (loading, success, error)
- [ ] ✅ Confirmações antes de delete
- [ ] ✅ Validações de formulário

### Performance

- [ ] Upload de 10 ficheiros < 2min
- [ ] Carregamento de página < 2s
- [ ] Drag-and-drop fluido (60fps)
- [ ] Paginação eficiente (1000+ items)

### Segurança

- [ ] Rotas protegidas funcionam
- [ ] Token JWT expira corretamente
- [ ] Passwords são hasheadas
- [ ] SQL injection prevenida (prepared statements)

---

## 🐛 Bugs Conhecidos

### Alta Prioridade

- [ ] TODO: Implementar FFmpeg playout real (atualmente placeholder)
- [ ] TODO: WebSocket para status real-time
- [ ] TODO: Validar se media está em uso antes de deletar

### Média Prioridade

- [ ] TODO: Preview stream HLS real
- [ ] TODO: Aplicar presets de configuração
- [ ] TODO: Criar playlists a partir de templates (backend)

### Baixa Prioridade

- [ ] TODO: Layout mobile responsivo
- [ ] TODO: Dark/Light theme toggle
- [ ] TODO: Export/Import playlists

---

## ✅ Critérios de Aceitação

Para considerar a Fase 6 concluída:

1. **Testes Manuais**

   - [ ] Todos os fluxos principais testados
   - [ ] Todos os componentes validados
   - [ ] Bugs críticos resolvidos

2. **Documentação**

   - [ ] Manual de testes completo
   - [ ] Bugs documentados
   - [ ] Fluxos validados documentados

3. **Qualidade**
   - [ ] Sem erros de console críticos
   - [ ] Performance aceitável
   - [ ] UX consistente

---

**Última atualização:** 2026-01-09
