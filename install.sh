#!/bin/bash

# ONEPA Playout PRO - Total Automation Installer (macOS/Linux)
# Version: 2.3.0-ALPHA.6-PRO
# Features: OS-specific Auto-installation, GitHub Cloud Sync, Nuclear Ghost Cleanup

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
if [[ "$*" == *"--full-reset"* ]]; then
    FULL_RESET=true
fi

OS_TYPE="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
fi

# --- 0.1 Nuclear Ghost Cleanup ---
nuclear_cleanup() {
    log_warn "🧪 Iniciando Limpeza Nuclear de 'fantasmas'..."
    
    # 1. Identify all containers related to alpha or onepa
    GHOSTS=$(docker ps -aq --filter name=alpha --filter name=onepa)
    if [ -n "$GHOSTS" ]; then
        log_info "Removendo containers encontrados: $GHOSTS"
        docker rm -f $GHOSTS 2>/dev/null || sudo docker rm -f $GHOSTS 2>/dev/null || true
    fi

    # 2. Force remove the network to clear IP locks
    log_info "Resetando rede virtual..."
    docker network rm alpha-network 2>/dev/null || sudo docker network rm alpha-network 2>/dev/null || true

    # 3. If full reset, prune EVERYTHING
    if [ "$FULL_RESET" = true ]; then
        log_warn "💣 Deep Prune: Limpando cache e volumes globais..."
        docker system prune -af --volumes 2>/dev/null || sudo docker system prune -af --volumes 2>/dev/null || true
        
        # Ensure we use sudo to remove data folder if on Linux
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo rm -rf data .env install.log 2>/dev/null || true
        else
            rm -rf data .env install.log 2>/dev/null || true
        fi
    fi
}

if [ "$FULL_RESET" = true ]; then
    log_warn "⚠️ MODO FULL RESET ATIVADO!"
    echo "Isso irá apagar TODOS os dados, containers, volumes e imagens órfãs."
    read -p "Tem certeza que deseja continuar? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        nuclear_cleanup
        log_info "Sistema limpo. Iniciando do zero..."
    else
        log_info "Reset cancelado."
        exit 0
    fi
else
    # Always do a light cleanup to prevent name conflicts
    log_info "Verificando conflitos de containers..."
    nuclear_cleanup
fi

# --- 0.2 Hardware Verification ---
echo -e "\n${YELLOW}📊 Verificando Recursos do Sistema...${NC}"

check_disk_health() {
    FREE_SPACE=$(df -k / | tail -1 | awk '{print $4}')
    
    if [ "$FREE_SPACE" -lt 1048576 ]; then
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
    elif [ "$FREE_SPACE" -lt 5242880 ]; then
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
        sudo usermod -aG docker $USER || true
        log_warn "O Docker foi instalado. Você pode precisar reiniciar a sessão para permissões de grupo."
    fi
}

if [ "$OS_TYPE" == "macos" ]; then
    install_macos_deps
elif [ "$OS_TYPE" == "linux" ]; then
    install_linux_deps
else
    log_warn "Sistema Operacional não suportado automaticamente. Verifique se Docker e Git estão instalados."
fi

# --- 2. Context Detection & GitHub Credentials ---
LOCAL_MODE=false
if [[ "$*" == *"--local"* ]]; then
    LOCAL_MODE=true
fi

# Auto-detect if we are already inside the project directory
if [ -d "frontend" ] && [ -d "backend" ] && [ -f "docker-compose.yml" ]; then
    log_info "Raiz do projeto detectada. Ativando Modo Local automaticamente."
    LOCAL_MODE=true
fi

if [ "$LOCAL_MODE" = false ]; then
    echo -e "\n${YELLOW}🔑 Configuração do GitHub Cloud${NC}"
    read -p "GitHub Private Access Token (PAT): " GH_PAT
    read -p "Repositório (ex: user/repo) [ENTER p/ padrão]: " GH_REPO
    GH_REPO=${GH_REPO:-"ideiasestrondosas-ctrl/cloud-onepa-alpha"}
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
    TEMP_DIR="."
    log_info "Usando arquivos locais."
fi

# --- 4. Asset Verification & Download ---
log_info "Verificando assets protegidos..."
ASSET_DIR="backend/assets/protected"
BBB_FILE="$ASSET_DIR/big_buck_bunny_1080p_h264.mov"
BBB_URL="https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_1080p_h264.mov"

mkdir -p "$ASSET_DIR"

if [ ! -f "$BBB_FILE" ]; then
    log_warn "Asset 'Big Buck Bunny' não encontrado. Baixando..."
    if ! curl -L "$BBB_URL" -o "$BBB_FILE"; then
        log_err "Falha ao baixar assets. O sistema continuará, mas alguns vídeos podem falhar."
    fi
fi

# --- 5. Environment (.env) ---
log_info "Configurando ambiente..."
if [ ! -f .env ]; then
    # Use 'admin' as default password for easier first access as requested
    cat <<EOF > .env
POSTGRES_USER=onepa
POSTGRES_PASSWORD=admin
POSTGRES_DB=onepa_playout
JWT_SECRET=$(openssl rand -hex 16)
MEDIA_PATH=/var/lib/onepa-playout/media
THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails
DEPLOY_BRANCH=${GH_BRANCH:-"local"}
DEPLOY_REPO=${GH_REPO:-"local"}
EOF
fi

# --- 6. Launch Docker ---
log_info "Iniciando Docker Compose..."

DOCKER_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_CMD="docker-compose"
fi

# Permission Check (Linux)
if [ "$OS_TYPE" == "linux" ]; then
    if ! docker ps &> /dev/null; then
        DOCKER_CMD="sudo $DOCKER_CMD"
    fi
fi

$DOCKER_CMD build --pull
$DOCKER_CMD up -d

# --- 7. Cleanup ---
if [ "$LOCAL_MODE" = false ] && [ "$TEMP_DIR" != "." ]; then
    log_info "Limpando arquivos temporários..."
    cp docker-compose.yml ../ 2>/dev/null || true
    cp .env ../ 2>/dev/null || true
    cp -r scripts ../ 2>/dev/null || true
    cp install.sh ../ 2>/dev/null || true
    cd ..
    rm -rf "$TEMP_DIR" 2>/dev/null || sudo rm -rf "$TEMP_DIR" 2>/dev/null || true
fi

echo -e "\n${GREEN}✅ Instalação Concluída com Sucesso!${NC}"
echo "--------------------------------------------------"
echo -e "🌐 URL:       ${GREEN}http://localhost:3011${NC}"
echo -e "🔧 Backend:    http://localhost:8182"
echo -e "🔑 Login:      admin / admin"
echo "--------------------------------------------------"
