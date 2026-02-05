@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM ONEPA Playout PRO - Windows Setup (v2.3.1-STABLE)
REM ==============================================================================

echo [INFO] Starting ONEPA Setup v2.3.1...

REM --- 0. Parameters ---
set "FULL_RESET=false"
set "LOCAL_MODE=false"

if "%~1"=="--full-reset" set "FULL_RESET=true"
if "%~1"=="--local" set "LOCAL_MODE=true"
if "%~2"=="--full-reset" set "FULL_RESET=true"
if "%~2"=="--local" set "LOCAL_MODE=true"

REM --- 1. Path Synchronization (Force Add common locations) ---
echo [INFO] Syncing environment paths...

set "SEARCH_PATHS="
set "SEARCH_PATHS=%SEARCH_PATHS%;C:\Program Files\Git\cmd"
set "SEARCH_PATHS=%SEARCH_PATHS%;C:\Program Files\Git\bin"
set "SEARCH_PATHS=%SEARCH_PATHS%;C:\Program Files (x86)\Git\cmd"
set "SEARCH_PATHS=%SEARCH_PATHS%;C:\Program Files (x86)\Git\bin"
set "SEARCH_PATHS=%SEARCH_PATHS%;C:\Program Files\Docker\Docker\resources\bin"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Docker\Docker\resources\bin"

set "PATH=%PATH%%SEARCH_PATHS%"

REM --- 2. Dependency Check ---

REM Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git not found. Attempting install...
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements >nul 2>&1
    
    REM Re-check paths
    git --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Git install failed. Please install manually from: https://git-scm.com/
        pause & exit /b 1
    )
) else (
    echo [OK] Git is ready.
)

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Docker not found. Attempting install...
    winget install --id Docker.DockerDesktop -e --source winget --accept-package-agreements --accept-source-agreements >nul 2>&1
    
    echo [WARN] If Docker was just installed, you MUST restart your PC.
    echo [WARN] If already installed, ensure Docker Desktop is RUNNING.
    pause
    
    docker --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Docker still not found. Please restart your PC and ensure Docker Desktop is running.
        pause & exit /b 1
    )
) else (
    echo [OK] Docker is ready.
)

REM --- 3. Context Detection ---
if exist frontend if exist backend if exist docker-compose.yml (
    set "LOCAL_MODE=true"
    echo [INFO] Local source detected.
)

REM --- 4. Cleanup ---
echo [INFO] Cleaning container conflicts...
docker ps -aq --filter "name=alpha" --filter "name=onepa" > containers.tmp 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in (containers.tmp) do (
        echo [INFO] Removing container: %%i
        docker rm -f %%i >nul 2>&1
    )
)
if exist containers.tmp del containers.tmp
docker network rm alpha-network >nul 2>&1

if "%FULL_RESET%"=="true" (
    echo [WARN] FULL RESET MODE...
    docker system prune -af --volumes >nul 2>&1
    if exist data rd /s /q data
    if exist .env del .env
)

REM --- 5. GitHub & Clone ---
if "%LOCAL_MODE%"=="false" (
    echo [INFO] GitHub Sync...
    set /p "GH_PAT=Enter GitHub Token (PAT): "
    if "!GH_PAT!"=="" (echo [ERROR] Token required. & pause & exit /b 1)
    
    set "GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-alpha"
    set "GH_BRANCH=alpha"
    
    if exist onepa_tmp rd /s /q onepa_tmp
    git clone -b !GH_BRANCH! https://!GH_PAT!@github.com/!GH_REPO!.git onepa_tmp
    if !errorlevel! neq 0 (echo [ERROR] Clone failed. & pause & exit /b 1)
    
    xcopy /E /I /Y "onepa_tmp\*" . >nul
    rd /s /q onepa_tmp
)

REM --- 6. Assets ---
echo [INFO] Checking assets...
if not exist backend\assets\protected mkdir backend\assets\protected
set "LOGO_FILE=backend\assets\protected\Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"
set "LOGO_URL=https://github.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/raw/alpha/backend/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"

if not exist "!LOGO_FILE!" (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!LOGO_URL!' -OutFile '!LOGO_FILE!'"
)

REM --- 7. Env ---
if not exist .env (
    echo [INFO] Creating .env...
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

REM --- 8. Launch ---
echo [INFO] Starting Docker Compose...
docker compose build --pull
if !errorlevel! neq 0 (echo [ERROR] Build failed. & pause & exit /b 1)

docker compose up -d
if !errorlevel! neq 0 (echo [ERROR] Start failed. & pause & exit /b 1)

echo [OK] SETUP COMPLETE.
echo URL: http://localhost:3011
echo Login: admin / admin
pause
