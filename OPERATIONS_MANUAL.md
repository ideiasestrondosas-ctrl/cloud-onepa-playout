# Cloud Onepa Playout PRO - Manual de Operações 24/7

Bem-vindo ao sistema profissional de playout Cloud Onepa. Este sistema foi desenhado para garantir emissões resilientes e de alta qualidade.

## 📦 Identidade e Branding

Gestão profissional da imagem do canal e da aplicação.

### 1. Branding da Aplicação (UI)

Personalize o visual do painel de administração (Sidebar e Login).

- Vá a **Definições > Playout**.
- Em "Branding da Aplicação", carregue o seu logotipo (PNG/JPG).
- Este logo é visível apenas para os operadores do sistema.

### 2. Identidade do Canal (Público)

Defina como o canal é identificado nos relatórios e metadados.

- Vá a **Definições > Playout > Identidade do Canal**.
- Insira o "Nome do Canal" (ex: "Meu Canal TV").
- Este nome aparecerá no topo do Dashboard.

### 3. Overlay (Marca D'água)

A marca que aparece sobre o vídeo transmitido.

- Vá a **Definições > Playout > Overlay**.
- Carregue um ficheiro PNG com transparência.
- Use o interruptor "Ativar Overlay" para ligar/desligar instantaneamente no stream.

---

## 🧙 Setup Wizard (Assistente de Configuração)

Para iniciar rapidamente um novo canal:

1. Clique em "Setup Wizard" nas Definições.
2. Siga os passos: Identidade -> Conteúdo -> Transmissão.
3. No passo **Conteúdo**, pode agora:
   - **Adicionar da Biblioteca**: Escolher ficheiros já carregados.
   - **Adicionar Stream/URL**: Inserir links RTMP ou HLS externos para retransmissão.
4. Ao finalizar, uma Playlist "Setup Playlist" será criada e pronta a usar.

---

## 📊 Dashboard e Diagnóstico

O centro de controlo de operações.

- **Preview em Tempo Real**: Visualize o que está a sair para o ar. Se estiver offline, verá um padrão de teste.
- **Diagnóstico (Botão "Diagnose")**:
  - Verifica integridade da Base de Dados.
  - Valida o Motor de Playout.
  - Testa conetividade com Media.
  - Se encontrar erros, sugere ações corretivas (ex: "Reiniciar Engine").

---

## 🛠️ Procedimentos de Manutenção e Backup

### Atualizações Automáticas (Novo)

O sistema inclui scripts para backup e release:

- Execute `./scripts/auto_release.sh` para criar um ZIP completo do projeto (excluindo ficheiros temporários e media pesada).
- Os backups são guardados na pasta `backups/`.

### Fluxo de Trabalho Diário Recomendado

1. **Ingestão**: Carregar conteúdos na Media Library.
2. **Setup**: Usar o Wizard para canais rápidos ou criar Playlists manuais.
3. **Monitorização**: Verificar o Dashboard. Se o Preview estiver preto mas "NO AR", verifique os logs de diagnóstico.

### Resolução de Problemas

- **Playout parado mas Uptime conta**: Significa que o motor está ativo mas não encontra conteúdo válido. Verifique se a Playlist agendada tem clips válidos e sem "gaps".
- **Erro de Base de Dados**: Use o botão "Diagnose" para verificar a conexão.

---

_Cloud Onepa Playout PRO v1.8.0 (2026)_
