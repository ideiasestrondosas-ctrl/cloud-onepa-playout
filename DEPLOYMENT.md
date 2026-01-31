# Guia de Implantação e Automação - ONEPA Playout PRO

Este guia detalha como instalar, configurar e manter o sistema **ONEPA Playout PRO** com automação total em Linux, macOS e Windows.

---

## ⚡ Instalação Rápida (Recomendado)

Escolha o seu comando de acordo com o sistema operativo. Estes scripts configuram dependências, geram credenciais seguras e iniciam o sistema.

### 🐧 Linux (Ubuntu/Debian)

```bash
curl -sSL https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-playout/master/scripts/setup_linux.sh | bash
```

_Ou manualmente:_

```bash
chmod +x scripts/setup_linux.sh
./scripts/setup_linux.sh
```

### 🍎 macOS

```bash
chmod +x scripts/setup_macos.sh
./scripts/setup_macos.sh
```

### 🪟 Windows 10/11

1. Certifique-se que o **Docker Desktop** está a correr.
2. Navegue até a pasta `scripts/`.
3. Clique com o botão direito em `install.bat` e escolha **Executar como Administrador**.

---

## 🛠️ Instalação Passo a Passo (Manual)

Se preferir configurar manualmente cada componente:

1.  **Pré-requisitos**:
    - Instale o **Docker** e **Docker Compose**.
    - Instale o **Git**.
2.  **Configuração de Ambiente**:
    - Copie o ficheiro de exemplo (ou crie um novo) `.env`:
      ```bash
      POSTGRES_USER=onepa
      POSTGRES_PASSWORD=uma_senha_forte
      POSTGRES_DB=onepa_playout
      JWT_SECRET=outra_senha_forte
      ```
3.  **Pastas de Dados**:
    - Crie as pastas necessárias: `mkdir -p data/postgres data/media data/thumbnails data/playlists`.
4.  **Iniciar o Sistema**:
    - Execute: `docker compose up -d`.

---

## 🔄 Atualização Automática (GitHub Cloud Sync)

O sistema pode verificar e instalar atualizações automaticamente sincronizando com o GitHub.

### 🐧 Linux / 🍎 macOS (via Cron)

1. Adicione o script ao seu agendador: `crontab -e`.
2. Adicione esta linha para atualizar todos os dias às 04:00 AM:
   ```bash
   0 4 * * * /caminho/para/cloud-onepa-playout/scripts/auto_update.sh >> /var/log/onepa_update.log 2>&1
   ```

### 🪟 Windows (via Task Scheduler)

1. Abra o **Task Scheduler** (Agendador de Tarefas).
2. Crie uma **Tarefa Básica** chamada "ONEPA Auto Update".
3. Gatilho: Diário (ex: 04:00 AM).
4. Ação: Iniciar um Programa.
5. Selecione o ficheiro: `C:\caminho\para\cloud-onepa-playout\scripts\auto_update.bat`.

---

## 🧪 Resolução de Problemas

| Sintoma                   | Causa Provável         | Solução                                                 |
| :------------------------ | :--------------------- | :------------------------------------------------------ |
| **Erro de Porta 3010**    | Outro serviço UI ativo | Pare o serviço ou mude a porta no `docker-compose.yml`. |
| **Transmissão Lenta**     | CPU/GPU insuficiente   | Ajuste os codecs em **Settings -> Playout**.            |
| **Base de Dados Offline** | Permissões de escrita  | Execute `chmod -R 777 data/postgres`.                   |

---

## 🌐 Acesso ao Painel

- **Dashboard Principal**: [http://localhost:3011](http://localhost:3011)
- **Documentação Master**: [http://localhost:3011/docs](http://localhost:3011/docs)
- **Stream HLS**: [http://localhost:3011/hls/stream.m3u8](http://localhost:3011/hls/stream.m3u8)

**Credenciais Padrão:** `admin` / `admin`
