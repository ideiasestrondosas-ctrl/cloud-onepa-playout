@echo off
setlocal
REM ONEPA Playout PRO - Enhanced Windows Installer (Total Automation)

echo --------------------------------------------------
echo 🚀 ONEPA Playout PRO - Windows Setup
echo --------------------------------------------------

REM 1. Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao encontrado.
    echo Por favor, instale o Docker Desktop: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)
echo ✅ Docker detetado.

REM 2. Environment Setup (Auto-Generate .env via PowerShell)
if not exist .env (
    echo ⚙️  Gerando arquivo .env seguro...
    powershell -Command "$hex = -join ((1..32) | ForEach-Object { '%02x' -f (Get-Random -Minimum 0 -Maximum 255) }); $content = 'POSTGRES_USER=onepa' + [Environment]::NewLine + 'POSTGRES_PASSWORD=' + $hex + [Environment]::NewLine + 'POSTGRES_DB=onepa_playout' + [Environment]::NewLine + 'JWT_SECRET=' + $hex + [Environment]::NewLine + 'MEDIA_PATH=/var/lib/onepa-playout/media' + [Environment]::NewLine + 'THUMBNAILS_PATH=/var/lib/onepa-playout/thumbnails'; Set-Content .env $content"
    echo ✅ Arquivo .env criado.
) else (
    echo ✅ Arquivo .env ja existe.
)

REM 3. Directory Setup
echo 📁 Verificando diretorios...
if not exist data\postgres mkdir data\postgres
if not exist data\media mkdir data\media
if not exist data\thumbnails mkdir data\thumbnails
if not exist data\playlists mkdir data\playlists
if not exist data\assets\protected mkdir data\assets\protected

REM 4. Launch
echo 🏗️  Construindo e iniciando... (Isso pode demorar)
docker compose down --remove-orphans >nul 2>&1
docker compose build --pull
docker compose up -d

echo.
echo ✅ Instalacao Concluida!
echo --------------------------------------------------
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8081
echo 📡 Stream:   http://localhost:3000/hls/stream.m3u8
echo --------------------------------------------------
echo 🔑 Login padrao: admin / admin
echo.
pause
