@echo off
REM ONEPA Playout PRO - Windows Installer
REM This script installs the application using Docker and Docker Compose.

echo 🚀 Iniciando instalacao do ONEPA Playout PRO...

REM 1. Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao encontrado. Por favor, instale o Docker Desktop: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)

REM 2. Create necessary directories
echo 📁 Criando diretorios de armazenamento...
if not exist data\postgres mkdir data\postgres
if not exist data\media mkdir data\media
if not exist data\thumbnails mkdir data\thumbnails
if not exist data\playlists mkdir data\playlists
if not exist data\assets\protected mkdir data\assets\protected

REM 3. Build and Start
echo 🏗️ Construindo containers... (Isto pode demorar uns minutos)
docker compose build --pull

echo ⚡ Iniciando servicos...
docker compose up -d

echo.
echo ✅ Instalacao concluida com sucesso!
echo --------------------------------------------------
echo 🌐 Acesso ao Painel: http://localhost:3000
echo 🔑 Login padrao: admin / admin
echo 📡 Link HLS (VLC): http://localhost:3000/hls/stream.m3u8
echo --------------------------------------------------
echo.
echo Dica: Use o Docker Desktop para gerenciar os containers.
pause
