@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM ONEPA Playout PRO - Windows Setup (v2.3.2-FINAL)
REM ==============================================================================

REM --- Get Version ---
FOR /F "tokens=2 delims==" %%I IN ('findstr /C:"version =" backend\Cargo.toml') DO SET VERSION=%%I
SET VERSION=%VERSION:"=%
SET VERSION=%VERSION: =%

echo [INFO] ##################################################
echo [INFO] #   ONEPA Playout PRO - Windows Setup v%VERSION%    #
echo [INFO] ##################################################

REM --- 0. Parameters ---
set "FULL_RESET=false"
set "LOCAL_MODE=false"

:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--full-reset" set "FULL_RESET=true"
if "%~1"=="--local" set "LOCAL_MODE=true"
shift
goto parse_args
:end_parse

REM --- 1. Path Synchronization (Force Add common locations) ---
echo [INFO] Syncing environment paths...

REM Add Git and Docker to PATH if they exist but are not in the current session
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Program Files (x86)\Git\cmd;C:\Program Files (x86)\Git\bin;C:\Program Files\Docker\Docker\resources\bin;%ProgramFiles%\Docker\Docker\resources\bin"

REM --- 2. Dependency Check ---

REM Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git not found. Attempting install...
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    
    REM We ignore the winget exit code because it often returns non-zero for 'already installed'
    REM Instead, we re-check if the git command now works
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
    echo [INFO] Docker not found. Checking paths...
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
        echo [OK] Docker found in C:\Program Files.
    ) else (
        echo [INFO] Installing Docker Desktop...
        winget install --id Docker.DockerDesktop -e --source winget --accept-package-agreements --accept-source-agreements
        echo [WARN] If Docker was just installed, you MUST restart your PC.
        echo [WARN] If already installed, ensure Docker Desktop is RUNNING.
        pause
    )
    
    docker --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Docker still not found. Please ensure Docker Desktop is running and try again.
        pause & exit /b 1
    )
) else (
    echo [OK] Docker is ready.
)

REM --- 3. Context Detection ---
if exist frontend if exist backend if exist docker-compose.yml (
    set "LOCAL_MODE=true"
    echo [INFO] Local source detected. Using local files.
)

REM --- 4. Cleanup ---
echo [INFO] Checking for container conflicts...
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
    echo [WARN] NUCLEAR RESET ENABLED!
    set /p "confirm=Delete ALL data and volumes? (s/N): "
    if /i "!confirm!"=="s" (
        echo [INFO] Cleaning volumes and cache...
        docker system prune -af --volumes >nul 2>&1
        if exist data rd /s /q data
        if exist .env del .env
    )
)

REM --- 5. GitHub & Clone ---
if "%LOCAL_MODE%"=="false" (
    echo.
    echo [INFO] GitHub Configuration
    set /p "GH_PAT=Enter GitHub Token (PAT): "
    if "!GH_PAT!"=="" (echo [ERROR] Token required. & pause & exit /b 1)
    
    set "GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-alpha"
    set "GH_BRANCH=alpha"
    
    if exist onepa_tmp rd /s /q onepa_tmp
    git clone -b !GH_BRANCH! https://!GH_PAT!@github.com/!GH_REPO!.git onepa_tmp
    if !errorlevel! neq 0 (echo [ERROR] Clone failed. Verify Token and Branch. & pause & exit /b 1)
    
    echo [INFO] Moving files to current directory...
    xcopy /E /I /Y "onepa_tmp\*" . >nul
    rd /s /q onepa_tmp
)

REM --- 6. Assets ---
echo [INFO] Verifying assets...
if not exist backend\assets\protected mkdir backend\assets\protected
set "LOGO_FILE=backend\assets\protected\Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"
set "LOGO_URL=https://github.com/ideiasestrondosas-ctrl/cloud-onepa-alpha/raw/alpha/backend/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"

if not exist "!LOGO_FILE!" (
    echo [INFO] Downloading Login Logo...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!LOGO_URL!' -OutFile '!LOGO_FILE!'"
)

REM --- 7. Environment ---
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

echo --------------------------------------------------
echo [OK] SETUP COMPLETED SUCCESSFULLY!
echo URL: http://localhost:3011
echo Login: admin / admin
echo --------------------------------------------------
pause
