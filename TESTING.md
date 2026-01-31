# Cloud Onepa Playout - Guia de Testes Funcionais

Este guia detalha os passos para validar todas as funcionalidades do sistema Cloud Onepa Playout.

## 1. Autenticação e Segurança

- [ ] **Login**: Aceder a `/login`. Validar credenciais (admin/admin).
- [ ] **Proteção de Rotas**: Tentar aceder a `/dashboard` sem login. Deve redirecionar para `/login`.
- [ ] **Logout**: Clicar no botão de sair e verificar redirecionamento.

## 2. Media Library

- [ ] **Upload**: Carregar um arquivo MP4. Verificar miniatura e progresso.
- [ ] **Preview**: Clicar num vídeo. Deve abrir modal com som e imagem.
- [ ] **Fillers**: Marcar um vídeo como "Filler" (estrela). Filtrar por Fillers.

## 3. Playlists e Agendamento

- [ ] **Criação**: Criar nova playlist. Adicionar 3 vídeos.
- [ ] **Validação 24h**: Verificar se o indicador de tempo mostra "Restam" ou "Excede".
- [ ] **Auto-fill**: Usar o botão "Preencher com Fillers" para completar tempo restante.
- [ ] **Calendário**: Arrastar playlist para o calendário. Verificar ícones de editar/apagar.

## 4. Playout & Dashboard

- [ ] **Playout Engine**: Verificar se o relógio no Dashboard está a correr.
- [ ] **Start/Stop**: Iniciar playout. Verificar status "ON AIR".
- [ ] **Real-time Preview**: Validar se o vídeo do ar aparece no Dashboard.
- [ ] **Skip**: Saltar para o próximo clip e validar mudança no ar.

## 5. Configurações & Branding

- [ ] **Logo**: Verificar se o logótipo aparece no Header e na página de Login.
- [ ] **Persistence**: Alterar resolução nas definições. Reiniciar backend. Verificar se a definição persiste.
- [ ] **Logo Upload**: Carregar novo logo e verificar atualização na UI.

---

_Data: Janeiro 2024_
