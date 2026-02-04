#!/bin/bash

# ONEPA Playout PRO - Total Automation Installer (macOS/Linux)
# Version: 2.2.0-ALPHA.5-PRO
# Features: OS-specific Auto-installation, GitHub Cloud Sync, Source Cleanup

set -e

# --- Configuration & Logging ---
LOG_FILE="install.log"
exec > >(tee -a "$LOG_FILE") 2>&1

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_err() { echo -e "${RED}[ERROR] $1${NC}"; }

echo -e "${GREEN}🚀 ONEPA Playout PRO - Universal Installer${NC}"
echo "--------------------------------------------------"
echo "Log: $LOG_FILE | Date: $(date)"

# --- 0. OS Detection & Parameters ---
FULL_RESET=false
if [[ "$1" == "--full-reset" ]]; then
    FULL_RESET=true
fi

OS_TYPE="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
fi

# --- 0.1 Full Reset Logic ---
if [ "$FULL_RESET" = true ]; then
    log_warn "⚠️ MODO FULL RESET ATIVADO!"
    echo "Isso irá apagar TODOS os dados, containers, volumes e configurações."
    read -p "Tem certeza que deseja continuar? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        log_info "Limpando sistema existente..."
        DOCKER_CMD="docker compose"
        if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi
        
        $DOCKER_CMD down -v --remove-orphans 2>/dev/null || true
        rm -rf data .env install.log 2>/dev/null || true
        log_info "Sistema limpo. Iniciando do zero..."
    else
        log_info "Reset cancelado."
        exit 0
    fi
fi

# --- 0.2 Hardware Verification ---
echo -e "\n${YELLOW}📊 Verificando Recursos do Sistema...${NC}"
FREE_SPACE=$(df -k / | tail -1 | awk '{print $4}')
if [ "$FREE_SPACE" -lt 5242880 ]; then # < 5GB
    log_warn "Pouco espaço em disco detectado ($((FREE_SPACE/1024))MB). O build pode falhar."
fi

# --- 1. Dependency Auto-Installation ---
echo -e "\n${YELLOW}🔍 Verificando Dependências...${NC}"

install_macos_deps() {
    if ! command -v brew &> /dev/null; then
        log_info "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    if ! command -v git &> /dev/null; then
        log_info "Instalando Git..."
        brew install git
    fi
    if ! command -v docker &> /dev/null; then
        log_info "Instalando Docker Desktop..."
        brew install --cask docker
        log_warn "Por favor, abra o Docker Desktop manualmente e finalize a configuração antes de continuar."
        read -p "Pressione [ENTER] quando o Docker estiver pronto..."
    fi
}

install_linux_deps() {
    sudo apt-get update || true
    if ! command -v git &> /dev/null; then
        log_info "Instalando Git..."
        sudo apt-get install -y git
    fi
    if ! command -v docker &> /dev/null; then
        log_info "Instalando Docker..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
        log_warn "O Docker foi instalado. Você pode precisar reiniciar a sessão para permissões de grupo."
    fi
}

if [ "$OS_TYPE" == "macos" ]; then
    install_macos_deps
elif [ "$OS_TYPE" == "linux" ]; then
    install_linux_deps
else
    log_err "Sistema Operacional não suportado automaticamente. Instale Docker e Git manualmente."
fi

# --- 2. GitHub Credentials & Guided PAT ---
echo -e "\n${YELLOW}🔑 Configuração do GitHub Cloud${NC}"
echo "--------------------------------------------------"
echo "DICA: Você precisa de um 'Personal Access Token' (PAT) com permissão 'repo'."
echo "Crie um em: https://github.com/settings/tokens"
echo "--------------------------------------------------"

read -p "GitHub Private Access Token (PAT): " GH_PAT
if [ -z "$GH_PAT" ]; then
    log_err "O Token é obrigatório para deploy via nuvem."
    exit 1
fi

read -p "Repositório (ex: user/repo) [ENTER p/ padrão]: " GH_REPO
GH_REPO=${GH_REPO:-"ideiasestrondosas-ctrl/cloud-onepa-playout"}
read -p "Branch para Deploy (main, alpha, stable) [ENTER p/ alpha]: " GH_BRANCH
GH_BRANCH=${GH_BRANCH:-"alpha"}

# --- 3. Clone Repository ---
TEMP_DIR="onepa_install_$(date +%s)"
log_info "Clonando $GH_REPO ($GH_BRANCH)..."

if ! git clone -b "$GH_BRANCH" "https://$GH_PAT@github.com/$GH_REPO.git" "$TEMP_DIR"; then
    log_err "Falha na clonagem. Verifique Token/Branch."
    exit 1
fi

cd "$TEMP_DIR"

# --- 4. Environment (.env) ---
log_info "Configurando ambiente..."
if [ ! -f .env ]; then
    cat <<EOF > .env
POSTGRES_USER=onepa
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=onepa_playout
JWT_SECRET=$(openssl rand -hex 16)
MEDIA_PATH=/var/lib/onepa-playout/media
THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails
DEPLOY_BRANCH=$GH_BRANCH
DEPLOY_REPO=$GH_REPO
EOF
fi

# --- 5. Launch Docker ---
log_info "Iniciando Docker Compose (Build)..."
DOCKER_CMD="docker compose"
if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi

# Permission Check (Linux)
if [ "$OS_TYPE" == "linux" ]; then
    if ! docker ps &> /dev/null; then
        log_warn "Permissão negada ao socket do Docker. Usando 'sudo'..."
        DOCKER_CMD="sudo $DOCKER_CMD"
    fi
fi

# --- 5. Launch Docker ---
log_info "Iniciando Docker Compose (Build)..."
DOCKER_CMD="docker compose"
if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi

# Permission Check (Linux)
if [ "$OS_TYPE" == "linux" ]; then
    if ! docker ps &> /dev/null; then
        log_warn "Permissão negada ao socket do Docker. Usando 'sudo'..."
        DOCKER_CMD="sudo $DOCKER_CMD"
    fi
fi

# Build Args
BUILD_OPTS=""
if [ "$FULL_RESET" = true ]; then
    BUILD_OPTS="--no-cache"
    export CACHE_BUST=$(date +%s)
fi

$DOCKER_CMD down --remove-orphans 2>/dev/null || true
$DOCKER_CMD build $BUILD_OPTS --pull
$DOCKER_CMD up -d

# --- 6. Cleanup ---
log_info "Limpando arquivos temporários..."
mv docker-compose.yml ../
mv .env ../
mv scripts ../ 2>/dev/null || true
cd ..
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}✅ Instalação Concluída com Sucesso!${NC}"
echo "--------------------------------------------------"
echo -e "🌐 URL:       ${GREEN}http://localhost:3011${NC}"
echo -e "🔧 Backend:    http://localhost:8182"
echo -e "🔑 Login:      admin / admin"
echo "--------------------------------------------------"
echo "Comandos úteis:"
echo "  Atualizar:  ./scripts/update.sh"
echo "  Logs:       docker compose logs -f"
echo ""
