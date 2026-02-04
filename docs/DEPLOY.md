# Cloud Onepa Playout - Guia de Deploy Profissional

Este guia descreve como instalar, atualizar e recuperar o sistema **ONEPA Playout PRO** automaticamente via GitHub Cloud e Docker.

---

## 🚀 Instalação Rápida (One-Liner)

Selecione o comando abaixo conforme o seu sistema operacional para iniciar o processo "Zero-Touch".

### 🍎 macOS
```bash
curl -O https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-playout/alpha/scripts/install.sh && chmod +x install.sh && ./install.sh
```

### 🐧 Linux (Ubuntu/Debian/CentOS)
```bash
wget https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-playout/alpha/scripts/install.sh -O install.sh && chmod +x install.sh && ./install.sh
```

### 🪟 Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/ideiasestrondosas-ctrl/cloud-onepa-playout/alpha/scripts/install.bat" -OutFile "install.bat"; .\install.bat
```

---

## 🛠️ Automação Inteligente

1. **Auto-Dependências**: Detecta e instala **Docker** e **Git** (via Homebrew, apt ou winget).
2. **Permissões Inteligentes**: No Linux, o script detecta se você precisa de `sudo` para o Docker e aplica automaticamente.
3. **Purity Build**: Otimizado para evitar erros de compilação (como "Vite not found") garantindo isolamento total.
4. **Cleanup**: Remove o código-fonte (`src`) após o build para máxima segurança.

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

---

**Última atualização:** 2026-02-04 (v2.2.0-ALPHA.5-PRO)
