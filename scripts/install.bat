@echo off
setlocal enabledelayedexpansion
REM ONEPA Playout PRO - Enhanced Windows Installer
REM Version: 2.2.0-ALPHA.5-PRO
REM Features: Dependency Auto-install (winget), GitHub Cloud Sync, Source Cleanup

echo --------------------------------------------------
echo 🚀 ONEPA Playout PRO - Windows Setup
echo --------------------------------------------------

REM --- 1. Dependency Auto-Installation ---
echo 🔍 Verificando Dependencias...

REM Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando Git via winget...
    winget install --id Git.Git -e --source winget
    if %errorlevel% neq 0 (
        echo [ERROR] Falha ao instalar Git. Instale manualmente em https://git-scm.com/
        pause
        exit /b 1
    )
)

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando Docker Desktop via winget...
    winget install --id Docker.DockerDesktop -e --source winget
    if %errorlevel% neq 0 (
        echo [ERROR] Falha ao instalar Docker. Instale manualmente em https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )
    echo [WARN] Por favor, REINICIE o computador e abra o Docker Desktop antes de continuar.
    pause
)

REM --- 2. GitHub Credentials ---
echo.
echo 🔑 Configuracao do GitHub Cloud
echo --------------------------------------------------
echo DICA: Crie um 'Personal Access Token' (PAT) em:
echo https://github.com/settings/tokens
echo --------------------------------------------------
set /p GH_PAT="GitHub Private Access Token (PAT): "
if "%GH_PAT%"=="" (
    echo [ERROR] O Token e obrigatorio.
    pause
    exit /b 1
)

set /p GH_REPO="Repositorio (ex: user/repo) [ENTER p/ padrao]: "
if "%GH_REPO%"=="" set GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-playout
set /p GH_BRANCH="Branch para Deploy (main, alpha, stable) [ENTER p/ alpha]: "
if "%GH_BRANCH%"=="" set GH_BRANCH=alpha

REM --- 3. Clone Repository ---
set TEMP_DIR=onepa_install_%random%
echo.
echo ⬇️ Clonando repositorio (%GH_BRANCH%)...

git clone -b %GH_BRANCH% https://%GH_PAT%@github.com/%GH_REPO%.git %TEMP_DIR%
if %errorlevel% neq 0 (
    echo [ERROR] Falha na clonagem. Verifique Token/Branch.
    pause
    exit /b 1
)

cd %TEMP_DIR%

REM --- 4. Environment Setup ---
if not exist .env (
    echo ⚙️  Gerando arquivo .env...
    powershell -Command "$hex1 = -join ((1..32) | ForEach-Object { '%02x' -f (Get-Random -Minimum 0 -Maximum 255) }); $hex2 = -join ((1..32) | ForEach-Object { '%02x' -f (Get-Random -Minimum 0 -Maximum 255) }); $content = 'POSTGRES_USER=onepa' + [Environment]::NewLine + 'POSTGRES_PASSWORD=' + $hex1 + [Environment]::NewLine + 'POSTGRES_DB=onepa_playout' + [Environment]::NewLine + 'JWT_SECRET=' + $hex2 + [Environment]::NewLine + 'MEDIA_PATH=/var/lib/onepa-playout/media' + [Environment]::NewLine + 'THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails' + [Environment]::NewLine + 'DEPLOY_BRANCH=%GH_BRANCH%' + [Environment]::NewLine + 'DEPLOY_REPO=%GH_REPO%'; Set-Content .env $content"
)

REM --- 5. Launch Docker ---
echo 🏗️  Iniciando Contentores... (Isso pode demorar)
docker compose down --remove-orphans >nul 2>&1
docker compose build --pull
docker compose up -d

REM --- 6. Cleanup ---
echo.
echo 🧹 Limpando codigo-fonte...
move docker-compose.yml ..\ >nul 2>&1
move .env ..\ >nul 2>&1
xcopy /E /I /Y scripts ..\scripts >nul 2>&1
cd ..
rmdir /s /q %TEMP_DIR%

echo.
echo ✅ Instalacao Concluida!
echo --------------------------------------------------
echo 🌐 URL:       http://localhost:3011
echo 🔑 Login:      admin / admin
echo --------------------------------------------------
echo Comandos uteis:
echo   Atualizar:  scripts\update.bat
echo   Logs:       docker compose logs -f
echo.
pause
