@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: ONEPA Playout PRO - Total Automation Installer (Windows)
:: Version: 2.3.0-ALPHA.9.2-PRO
:: Pure ASCII Version for maximum compatibility
:: ==============================================================================

echo --------------------------------------------------
echo [INFO] ONEPA Playout PRO - Windows Setup
echo --------------------------------------------------

:: --- 0. Parameters ---
set "FULL_RESET=false"
set "LOCAL_MODE=false"

:: Parse arguments manually to avoid for-loop issues in some CMD versions
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--full-reset" set "FULL_RESET=true"
if "%~1"=="--local" set "LOCAL_MODE=true"
shift
goto parse_args
:end_parse

:: --- 0.1 Check for Project Root ---
if exist frontend if exist backend if exist docker-compose.yml (
    echo [INFO] Project root detected. Activating Local Mode.
    set "LOCAL_MODE=true"
)

:: --- 0.2 Check Docker (Early check to avoid loop errors) ---
where docker >nul 2>&1
set "DOCKER_FOUND=%errorlevel%"

:: --- 1. Cleanup ---
if %DOCKER_FOUND% equ 0 (
    echo [INFO] Checking for container conflicts...
    for /f "tokens=*" %%i in ('docker ps -aq --filter "name=alpha" --filter "name=onepa"') do (
        echo [INFO] Removing container: %%i
        docker rm -f %%i >nul 2>&1
    )
    docker network rm alpha-network >nul 2>&1
) else (
    echo [WARN] Docker not found in PATH yet. Skipping container cleanup.
)

if "%FULL_RESET%"=="true" (
    echo [WARN] NUCLEAR RESET ENABLED!
    set /p "confirm=Delete ALL data and volumes? (s/N): "
    if /i "!confirm!"=="s" (
        echo [INFO] Cleaning volumes and cache...
        if %DOCKER_FOUND% equ 0 (
            docker system prune -af --volumes >nul 2>&1
        )
        if exist data rd /s /q data
        if exist .env del .env
    )
)

:: --- 2. Dependencies (winget) ---
echo.
echo [INFO] Checking Dependencies...

git --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [INFO] Installing Git via winget...
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    git --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Git installation failed. Please install manually: https://git-scm.com/
        pause & exit /b 1
    )
) else (
    echo [OK] Git found.
)

if %DOCKER_FOUND% neq 0 (
    echo [INFO] Docker not found. Checking C:\Program Files\Docker...
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
        echo [OK] Docker path added to session.
    ) else (
        echo [INFO] Installing Docker Desktop via winget...
        winget install --id Docker.DockerDesktop -e --source winget --accept-package-agreements --accept-source-agreements
        echo [WARN] Docker installed. Please RESTART your PC and open Docker Desktop.
        pause & exit /b 0
    )
) else (
    echo [OK] Docker found.
)

:: --- 3. GitHub & Clone ---
if "%LOCAL_MODE%"=="false" (
    echo.
    echo [INFO] GitHub Configuration
    set /p "GH_PAT=GitHub Private Access Token (PAT): "
    if "!GH_PAT!"=="" (echo [ERROR] Token required. & pause & exit /b 1)

    set "GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-alpha"
    set "GH_BRANCH=alpha"

    echo [INFO] Cloning !GH_REPO! (!GH_BRANCH!)...
    set "TEMP_DIR=onepa_repo_tmp"
    if exist !TEMP_DIR! rd /s /q !TEMP_DIR!
    
    git clone -b !GH_BRANCH! https://!GH_PAT!@github.com/!GH_REPO!.git !TEMP_DIR!
    if !errorlevel! neq 0 (echo [ERROR] Clone failed. & pause & exit /b 1)

    echo [INFO] Moving files to permanent folder...
    xcopy /E /I /Y "!TEMP_DIR!\*" . >nul
    rd /s /q !TEMP_DIR!
)

:: --- 4. Asset Verification ---
echo [INFO] Verifying protected assets...
set "ASSET_DIR=backend\assets\protected"
if not exist "!ASSET_DIR!" mkdir "!ASSET_DIR!"

set "LOGO_FILE=!ASSET_DIR!\Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"
set "LOGO_URL=https://github.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/raw/alpha/backend/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"

if not exist "!LOGO_FILE!" (
    echo [INFO] Downloading Login Page Logo...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!LOGO_URL!' -OutFile '!LOGO_FILE!'"
)

:: --- 5. Environment (.env) ---
if not exist .env (
    echo [INFO] Configuring environment...
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

:: --- 6. Launch Docker ---
echo [INFO] Starting Docker Compose...
docker compose build --pull
if !errorlevel! neq 0 (
    echo [ERROR] Build failed. Please restart your terminal/PC if Docker was just installed.
    pause & exit /b 1
)

docker compose up -d
if !errorlevel! neq 0 (echo [ERROR] Failed to start containers. & pause & exit /b 1)

echo.
echo [OK] Installation Completed Successfully!
echo --------------------------------------------------
echo URL:       http://localhost:3011
echo Login:     admin / admin
echo --------------------------------------------------
pause
