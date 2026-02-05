@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: ONEPA Playout PRO - Total Automation Installer (Windows)
:: Version: 2.3.0-ALPHA.8-PRO
:: Features: Ghost Cleanup, Oroboros Migration, Asset Auto-Download, Local Mode
:: ==============================================================================

echo --------------------------------------------------
echo 🚀 ONEPA Playout PRO - Windows Setup
echo --------------------------------------------------

:: --- 0. Parameters ---
set FULL_RESET=false
set LOCAL_MODE=false
for %%a in (%*) do (
    if "%%a"=="--full-reset" set FULL_RESET=true
    if "%%a"=="--local" set LOCAL_MODE=true
)

:: --- 0.1 Check for Project Root ---
if exist frontend if exist backend if exist docker-compose.yml (
    echo [INFO] Raiz do projeto detectada. Ativando Modo Local.
    set LOCAL_MODE=true
)

:: --- 0.2 Nuclear Ghost Cleanup ---
:cleanup
echo [WARN] Verificando conflitos de containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=alpha" --filter "name=onepa"') do (
    echo [INFO] Removendo container: %%i
    docker rm -f %%i >nul 2>&1
)
docker network rm alpha-network >nul 2>&1

if "%FULL_RESET%"=="true" (
    echo [WARN] 💣 MODALIDADE NUCLEAR ATIVADA!
    set /p confirm="Deseja apagar TODOS os dados e volumes? (s/N): "
    if /i "!confirm!"=="s" (
        echo [INFO] Limpando volumes e cache...
        docker system prune -af --volumes >nul 2>&1
        if exist data rd /s /q data
        if exist .env del .env
    )
)

:: --- 1. Dependencies (winget) ---
echo.
echo 🔍 Verificando Dependencias...

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando Git...
    winget install --id Git.Git -e --source winget || (echo [ERROR] Falha ao instalar Git. & pause & exit /b 1)
)

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando Docker Desktop...
    winget install --id Docker.DockerDesktop -e --source winget
    echo [WARN] REINICIE o computador e abra o Docker antes de continuar.
    pause & exit /b 0
)

:: --- 2. GitHub & Clone (Oroboros Fix) ---
if "%LOCAL_MODE%"=="false" (
    echo.
    echo 🔑 Configuracao do GitHub Cloud
    set /p GH_PAT="GitHub Private Access Token (PAT): "
    if "!GH_PAT!"=="" (echo [ERROR] Token obrigatorio. & pause & exit /b 1)

    set GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-alpha
    set GH_BRANCH=alpha

    echo [INFO] Clonando !GH_REPO! (!GH_BRANCH!)...
    set TEMP_DIR=onepa_repo_tmp
    if exist !TEMP_DIR! rd /s /q !TEMP_DIR!
    
    git clone -b !GH_BRANCH! https://!GH_PAT!@github.com/!GH_REPO!.git !TEMP_DIR!
    if !errorlevel! neq 0 (echo [ERROR] Falha no clone. & pause & exit /b 1)

    echo [INFO] Migrando arquivos para pasta permanente...
    xcopy /E /I /Y "!TEMP_DIR!\*" . >nul
    rd /s /q !TEMP_DIR!
)

:: --- 3. Asset Verification ---
echo [INFO] Verificando assets protegidos...
set ASSET_DIR=backend\assets\protected
if not exist !ASSET_DIR! mkdir !ASSET_DIR!

set LOGO_FILE=!ASSET_DIR!\Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4
set LOGO_URL=https://github.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/raw/alpha/backend/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4

if not exist "!LOGO_FILE!" (
    echo [INFO] Baixando Logo Video da Login Page...
    powershell -Command "Invoke-WebRequest -Uri '!LOGO_URL!' -OutFile '!LOGO_FILE!'"
)

:: --- 4. Environment (.env) ---
if not exist .env (
    echo [INFO] Configurando ambiente...
    (
    echo POSTGRES_USER=onepa
    echo POSTGRES_PASSWORD=admin
    echo POSTGRES_DB=onepa_playout
    echo JWT_SECRET=win_!random!!random!
    echo MEDIA_PATH=/var/lib/onepa-playout/media
    echo THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails
    echo DEPLOY_BRANCH=alpha
    echo DEPLOY_REPO=cloud-onepa-alpha
    ) > .env
)

:: --- 5. Launch Docker ---
echo [INFO] Iniciando Docker Compose...
docker compose build --pull
if %errorlevel% neq 0 (echo [ERROR] Falha no build. & pause & exit /b 1)

docker compose up -d
if %errorlevel% neq 0 (echo [ERROR] Falha ao subir containers. & pause & exit /b 1)

echo.
echo ✅ Instalacao Concluida com Sucesso!
echo --------------------------------------------------
echo 🌐 URL:       http://localhost:3011
echo 🔑 Login:      admin / admin
echo --------------------------------------------------
pause
