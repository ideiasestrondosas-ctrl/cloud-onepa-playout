@echo off
setlocal enabledelayedexpansion
REM ONEPA Playout PRO - Enhanced Windows Installer
REM Version: 2.2.0-ALPHA.5-PRO

echo --------------------------------------------------
echo 🚀 ONEPA Playout PRO - Windows Total Automation
echo --------------------------------------------------

REM 1. GitHub Credentials
echo.
echo 🔑 Configuracao do GitHub Cloud
set /p GH_PAT="GitHub Private Access Token (PAT): "
set /p GH_REPO="Repositorio (ex: user/repo) [ENTER p/ padrao]: "
if "%GH_REPO%"=="" set GH_REPO=ideiasestrondosas-ctrl/cloud-onepa-playout
set /p GH_BRANCH="Branch para Deploy (main, alpha, stable) [ENTER p/ alpha]: "
if "%GH_BRANCH%"=="" set GH_BRANCH=alpha

REM 2. Clone Repository
set TEMP_DIR=onepa_install_%random%
echo.
echo ⬇️ Clonando repositorio (%GH_BRANCH%)...

git clone -b %GH_BRANCH% https://%GH_PAT%@github.com/%GH_REPO%.git %TEMP_DIR%
if %errorlevel% neq 0 (
    echo ❌ Falha ao clonar o repositorio. Verifique o seu TOKEN e Branch.
    pause
    exit /b 1
)

cd %TEMP_DIR%

REM 3. Pre-flight Checks
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao encontrado.
    pause
    exit /b 1
)

REM 4. Environment Setup
if not exist .env (
    echo ⚙️  Gerando arquivo .env...
    powershell -Command "$hex1 = -join ((1..32) | ForEach-Object { '%02x' -f (Get-Random -Minimum 0 -Maximum 255) }); $hex2 = -join ((1..32) | ForEach-Object { '%02x' -f (Get-Random -Minimum 0 -Maximum 255) }); $content = 'POSTGRES_USER=onepa' + [Environment]::NewLine + 'POSTGRES_PASSWORD=' + $hex1 + [Environment]::NewLine + 'POSTGRES_DB=onepa_playout' + [Environment]::NewLine + 'JWT_SECRET=' + $hex2 + [Environment]::NewLine + 'MEDIA_PATH=/var/lib/onepa-playout/media' + [Environment]::NewLine + 'THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails' + [Environment]::NewLine + 'DEPLOY_BRANCH=%GH_BRANCH%' + [Environment]::NewLine + 'DEPLOY_REPO=%GH_REPO%'; Set-Content .env $content"
)

REM 5. Launch
echo 🏗️  Construindo e iniciando contentores... (Isso pode demorar)
docker compose down --remove-orphans >nul 2>&1
docker compose build --pull
docker compose up -d

REM 6. Cleanup
echo.
echo 🧹 Limpando codigo-fonte...
move docker-compose.yml ..\ >nul 2>&1
move .env ..\ >nul 2>&1
xcopy /E /I scripts ..\scripts >nul 2>&1
cd ..
rmdir /s /q %TEMP_DIR%

echo.
echo ✅ Instalacao Concluida!
echo --------------------------------------------------
echo 🌐 URL:       http://localhost:3011
echo 🔑 Login:      admin / admin
echo --------------------------------------------------
echo Para atualizar futuramente, use: scripts\update.bat
echo.
pause
