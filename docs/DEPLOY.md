# Cloud Onepa Playout - Guia de Deploy Rápido

Este guia descreve como instalar e atualizar o sistema **ONEPA Playout PRO** automaticamente via GitHub Cloud e Docker.

---

## 🚀 Instalação Rápida (One-Liner)

Selecione o comando abaixo conforme o seu sistema operacional para baixar o instalador e iniciar o processo.

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

## 🛠️ O que os scripts fazem automaticamente:

1. **Auto-Dependências**: Detecta e instala **Docker** e **Git** automaticamente se estiverem faltando (via Homebrew no Mac, apt no Linux e winget no Windows).
2. **GitHub Auth**: Solicita seu Token (PAT) e Branch.
2. **Clonagem**: Baixa a versão exata que você escolheu.
3. **Docker Build**: Constrói as imagens otimizadas para o seu hardware.
4. **Cleanup**: Remove o código-fonte (`src`) após a construção para manter o servidor leve e seguro.
5. **Logs**: Gera um arquivo `install.log` com todos os detalhes.

---

## 🔄 Como Atualizar

Após a instalação, você terá uma pasta `scripts/` no seu diretório raiz. Para buscar a versão mais recente da sua branch:

**Unix (Linux/macOS):**
```bash
./scripts/update.sh
```

**Windows:**
```batch
scripts\update.bat
```

---

## 🌐 Informações de Acesso

Ao finalizar, o sistema estará disponível em:

- **Frontend**: [http://localhost:3011](http://localhost:3011)
- **API (Externa)**: [http://localhost:8181](http://localhost:8181)
- **Credenciais Padrão**: `admin` / `admin`

---

## 📦 Requisitos Mínimos

- **Docker Desktop** (Mac/Windows) ou **Docker Engine** (Linux) instalado.
- **Git** instalado.
- **GitHub PAT** (Personal Access Token) com permissões de leitura ao repositório.

---

**Última atualização:** 2026-02-04 (v2.2.0-ALPHA.5-PRO)
