# Guia de Implantação ("Total Automation") - ONEPA Playout PRO

Este sistema foi atualizado para **Automação Total**. A instalação e manutenção agora são feitas com um único clique ou comando.

## 🚀 Instalação Rápida (Zero-Touch)

Escolha o seu sistema operativo e siga o passo único.

### 🐧 Linux (Ubuntu/Debian/CentOS)

Execute este comando no terminal:

```bash
# 1. Navegue para a pasta
cd cloud-onepa-playout

# 2. Execute o instalador automático
chmod +x scripts/install.sh
./scripts/install.sh
```

**O que ele faz:**

- Verifica se o Docker está instalado (e avisa se não estiver).
- Gera senhas seguras automaticamente (`.env`).
- Verifica conflitos de portas.
- Inicia todo o sistema.

---

### 🍎 macOS (Intel/M1/M2/M3)

1.  Abra o Terminal.
2.  Arraste a pasta `cloud-onepa-playout` para o Terminal ou navegue até ela (`cd ...`).
3.  Execute:
    `bash
    chmod +x scripts/install.sh
    ./scripts/install.sh
    `
    **Notas Mac:**

- Lembre-se de configurar a saída UDP para `host.docker.internal` se monitorizar localmente.

---

### 🪟 Windows 10/11

1.  Certifique-se que o **Docker Desktop** está a correr.
2.  Abra a pasta do projeto no Explorador de Arquivos.
3.  Entre na pasta `scripts`.
4.  Faça duplo clique em `install.bat`.

**O que ele faz:**

- Gera senhas seguras usando PowerShell.
- Cria toda a estrutura de pastas.
- Inicia o sistema automaticamente.

---

## 🔄 Automação de Atualizações (Auto-Update)

O sistema pode atualizar-se sozinho quando houver novas versões no GitHub.

### Configurar Atualização Automática (Linux/macOS)

Adicione uma tarefa no Cron para verificar atualizações todas as noites às 04:00 AM.

1.  Abra o editor cron:
    ```bash
    crontab -e
    ```
2.  Adicione a linha (ajuste o caminho `/caminho/para/`):
    ```bash
    0 4 * * * /caminho/para/cloud-onepa-playout/scripts/auto_update.sh >> /var/log/onepa_update.log 2>&1
    ```

### Atualização Manual (Qualquer SO)

Se preferir atualizar manualmente:

- **Linux/Mac**: `./scripts/auto_update.sh`
- **Windows**: Não tem script auto-update, use `scripts\install.bat` novamente para reconstruir.

---

## 🛠️ Resolução de Problemas Comuns

| Erro                      | Solução Automática                                                                           |
| :------------------------ | :------------------------------------------------------------------------------------------- |
| **Porta em uso**          | O script `install.sh` avisará a amarelo. Pare aplicações que usem portas 3000, 8081 ou 1935. |
| **Permissões (Linux)**    | O script tenta corrigir (`chmod 777`). Se falhar, execute como `sudo`.                       |
| **Docker não encontrado** | O script fornecerá o link direto para download.                                              |

---

## 🌐 Acesso Pós-Instalação

- **Painel**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8081](http://localhost:8081)
- **Stream**: [http://localhost:3000/hls/stream.m3u8](http://localhost:3000/hls/stream.m3u8)
