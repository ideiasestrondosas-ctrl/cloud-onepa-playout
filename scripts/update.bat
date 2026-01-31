@echo off
REM ONEPA Playout PRO - Update & Reset Script for Windows
REM Use: scripts\update.bat [--reset]

set RESET_MODE=false
if "%1"=="--reset" set RESET_MODE=true

if "%RESET_MODE%"=="true" (
    echo ⚠️ AVISO: MODO RESET ATIVADO!
    echo Isto ira apagar todos os dados, playlists e configuracoes.
    set /p confirm=Tem certeza? (s/N): 
    if /i not "%confirm%"=="s" (
        echo Cancelado.
        pause
        exit /b 0
    )
)

echo 🔄 Iniciando atualizacao...

if "%RESET_MODE%"=="true" (
    echo 🧹 Parando servicos e limpando dados...
    docker compose down -v
    if exist data rmdir /s /q data
) else (
    echo 🛑 Parando servicos...
    docker compose stop
)

echo 🏗️ Reconstruindo containers...
docker compose build

echo ⚡ Iniciando servicos...
docker compose up -d

echo.
echo ✨ Sistema atualizado com sucesso!
if "%RESET_MODE%"=="true" (
    echo ♻️ O sistema foi resetado para as configuracoes padrao.
)
echo 🌐 Acesso: http://localhost:3000
pause
