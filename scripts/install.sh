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
    echo "Isso irá apagar TODOS os dados, containers, volumes e imagens órfãs."
    read -p "Tem certeza que deseja continuar? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        log_info "Limpando sistema existente..."
        DOCKER_CMD="docker compose"
        if ! $DOCKER_CMD version &> /dev/null; then DOCKER_CMD="docker-compose"; fi
        
        $DOCKER_CMD down -v --remove-orphans 2>/dev/null || true
        docker system prune -f 2>/dev/null || true
        docker volume prune -f 2>/dev/null || true
        # Specific image pruning to ensure no corrupt base layers
        docker rmi -f $(docker images -q *frontend*) 2>/dev/null || true
        rm -rf data .env install.log 2>/dev/null || true
        log_info "Sistema limpo. Iniciando do zero..."
    else
        log_info "Reset cancelado."
        exit 0
    fi
fi

# --- 0.2 Hardware Verification ---
echo -e "\n${YELLOW}📊 Verificando Recursos do Sistema...${NC}"

check_disk_health() {
    # Get free space in KB for root
    FREE_SPACE=$(df -k / | tail -1 | awk '{print $4}')
    
    if [ "$FREE_SPACE" -lt 1048576 ]; then # < 1GB is a hard stop
        log_err "CRÍTICO: Espaço insuficiente em disco ($((FREE_SPACE/1024))MB)."
        log_warn "O build do Docker IRÁ falhar nesta condição."
        log_warn "Você PRECISA expandir seu LVM imediatamente:"
        echo "----------------------------------------------------------------"
        echo "COMANDOS DE RECUPERAÇÃO (Copie e cole):"
        echo "1. sudo growpart /dev/sda 3"
        echo "2. sudo pvresize /dev/sda3"
        echo "3. sudo lvextend -l +100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv"
        echo "4. sudo resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv"
        echo "----------------------------------------------------------------"
        exit 1
    elif [ "$FREE_SPACE" -lt 5242880 ]; then # < 5GB is a warning
        log_warn "Aviso: Espaço limitado ($((FREE_SPACE/1024))MB). Recomenda-se expandir o LVM."
    fi
}

check_disk_health

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
LOCAL_MODE=false
if [[ "$@" == *"--local"* ]]; then
    LOCAL_MODE=true
    log_info "⚠️ MODO LOCAL ATIVADO: Usando arquivos locais em vez de clonar do GitHub."
fi

if [ "$LOCAL_MODE" = false ]; then
    echo -e "\n${YELLOW}🔑 Configuração do GitHub Cloud${NC}"
    # ... (Keep existing prompt logic) ...
    read -p "GitHub Private Access Token (PAT): " GH_PAT
    # ...
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
else
    # Local Mode: Use current directory
    TEMP_DIR="."
    # cd "$TEMP_DIR" # Already in root effectively if running from root, but script might be in scripts/
    # We assume script is run as ./install.sh (from scripts sync) or ./scripts/install.sh
    # If run as ./install.sh (from curl), we are in root.
    # If run as ./scripts/install.sh, we are in root. 
    # Let's ensure we are in the project root.
    if [ -d "frontend" ] && [ -d "backend" ]; then
        log_info "Diretório do projeto detectado."
    else
        log_err "Erro: --local deve ser executado na raiz do projeto."
        exit 1
    fi
fi

# --- 4. Environment (.env) ---

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
if [ "$LOCAL_MODE" = false ]; then
    log_info "Limpando arquivos temporários..."
    mv docker-compose.yml ../
    mv .env ../
    mv scripts ../ 2>/dev/null || true
    cd ..
    rm -rf "$TEMP_DIR"
else
    log_info "Modo Local: Mantendo arquivos de origem."
fi

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
