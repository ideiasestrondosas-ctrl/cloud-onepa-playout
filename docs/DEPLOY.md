# Cloud Onepa Playout - Guia de Deploy Profissional

Este guia descreve como instalar, atualizar e recuperar o sistema **ONEPA Playout PRO** automaticamente via GitHub Cloud e Docker.

---

## 🚀 Instalação Rápida (One-Liner)

Selecione o comando abaixo conforme o seu sistema operacional para iniciar o processo "Zero-Touch".

### 🍎 macOS
```bash
curl -O https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/alpha/install.sh && chmod +x install.sh && ./install.sh
```

### 🐧 Linux (Ubuntu/Debian/CentOS)
```bash
wget https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/alpha/install.sh -O install.sh && chmod +x install.sh && ./install.sh
```

### 🪟 Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-playout/alpha/scripts/install.bat" -OutFile "install.bat"; .\install.bat
```

---

## 🛠️ Automação Inteligente

3. **Nuclear Ghost Cleanup**: Detecta e remove containers "zumbis" ou órfãos de instalações anteriores automaticamente.
4. **Purity Build**: Otimizado para evitar erros de compilação (como "Vite not found") garantindo isolamento total.
5. **Cleanup**: Remove o código-fonte (`src`) após o build para máxima segurança.


---

## 🔄 Como Atualizar

Após a instalação, use a pasta `scripts/` para manter o sistema em dia:

**Unix:** `./scripts/update.sh` | **Windows:** `scripts\update.bat`

---

## ⚠️ Recuperação e Full Reset (Começar do Zero)

Se o sistema apresentar erros persistentes ou se você desejar limpar tudo e começar uma nova instalação (apagando volumes e dados):

**Unix (Linux/macOS):**
```bash
./install.sh --full-reset
# ou para apenas atualizar do zero:
./scripts/update.sh --full-reset
```

**Windows:**
```batch
install.bat --full-reset
# ou
scripts\update.bat --full-reset
```

> [!CAUTION]
> O `--full-reset` apaga **TODOS** os dados, configurações e containers. Use com cuidado!

---

## 🌐 Informações de Acesso

- **URL**: [http://localhost:3011](http://localhost:3011)
- **Painel Backend**: [http://localhost:8182](http://localhost:8182)
- **Credenciais**: `admin` / `admin`

---

## 🔧 Solução de Problemas (Troubleshooting)

### "Vite not found" no build do Frontend
Isto ocorre geralmente por cache corrompido do Docker. Execute `./scripts/update.sh --full-reset` para forçar uma limpeza total e reconstrução pura.

### Erro de Permissão no Docker (Linux)
Nossos scripts agora lidam com isso via `sudo` automático. Se o erro persistir, certifique-se de que o serviço Docker está ativo: `sudo systemctl start docker`.

### Containers Conflitantes ("Ghost Containers")
Se você receber erros de `Conflict. The container name is already in use`, o novo installer (`v2.3.0+`) resolve isso automaticamente via **Nuclear Cleanup**. Basta rodar `./install.sh` novamente.


---

## 🔁 Ciclo de Desenvolvimento e Release (Dev Workflow)

Para garantir que as correções locais cheguem ao servidor Linux de produção, siga este ciclo rigoroso:

1.  **Desenvolvimento (Local)**: Aplique correções e edite arquivos.
    - Teste localmente com: `./scripts/install.sh --local --full-reset`
2.  **Release (Versionamento)**: Commit e Push para o GitHub.
    - Execute: `./scripts/release.sh`
    - Selecione a branch (ex: `alpha`).
3.  **Deploy (Linux Box)**: Baixe e instale a versão atualizada com limpeza total.
    - Comando Único (com --full-reset):
      ```bash
      wget https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/alpha/install.sh -O install.sh && chmod +x install.sh && ./install.sh --full-reset
      ```

> [!IMPORTANT]
> A flag `--full-reset` é CRÍTICA após atualizações profundas para limpar caches antigos do Docker e garantir que todos os arquivos sejam regenerados corretamente.

> [!IMPORTANT]
> **Sync Rule:** Always execute `./scripts/release.sh` (or `git push`) on your Mac before running `install.sh` on Linux. The Linux box pulls from GitHub, not your local machine.

> [!IMPORTANT]
> Sem executar o **Passo 2 (Release)**, o servidor Linux continuará baixando a versão antiga do código, ignorando suas correções locais.

---

**Última atualização:** 2026-02-05 (v2.3.0-ALPHA.6-PRO)
