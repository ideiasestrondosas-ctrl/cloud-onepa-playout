@echo off
setlocal

:: ==============================================================================
:: ONEPA PLAYOUT PRO - NUCLEAR UNINSTALLER (Windows)
:: WARNING: THIS WILL DELETE ALL DATA, CONTAINERS AND SOURCE CODE!
:: ==============================================================================

REM --- Get Version ---
FOR /F "tokens=2 delims==" %%I IN ('findstr /C:"version =" backend\Cargo.toml') DO SET VERSION=%%I
SET VERSION=%VERSION:"=%
SET VERSION=%VERSION: =%

cls
echo ====================================================
echo       AVISO DE REMOCAO TOTAL (NUCLEAR WIPE)        
echo       Versao do Sistema: %VERSION%
echo ====================================================
echo Isso ira apagar permanentemente:
echo 1. Todos os containers Docker (Backend, Frontend, DB, MediaMTX)
echo 2. Todos os volumes e redes Docker
echo 3. Todas as imagens Docker baixadas/construidas
echo 4. Todo o banco de dados e arquivos de midia
echo 5. A PROPRIA pasta do projeto e este script
echo.

set /p confirm="Voce tem CERTEZA absoluta? (s/N): "
if /i "%confirm%" neq "s" (
    echo Operacao cancelada.
    pause
    exit /b
)

echo.
echo [1/5] Parando e removendo containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=alpha" --filter "name=onepa"') do (
    docker rm -f %%i
)

echo [2/5] Removendo imagens do projeto...
for /f "tokens=*" %%i in ('docker images -q "*alpha*"') do (
    docker rmi -f %%i
)
for /f "tokens=*" %%i in ('docker images -q "*onepa*"') do (
    docker rmi -f %%i
)

echo [3/5] Removendo redes e volumes...
docker network rm alpha-network 2>nul
docker volume prune -f

echo [4/5] Limpando arquivos do sistema...
if exist data rd /s /q data
if exist .env del /f /q .env
if exist .env.docker del /f /q .env.docker

echo [5/5] AUTO-DESTRUICAO...
echo Removendo pasta do projeto e encerrando.

:: Capture the current directory
set "PROJECT_DIR=%CD%"

:: Navigate out to allow folder deletion
cd ..

:: Self-delete logic for Batch: delete current file and the project folder
start /b "" cmd /c "timeout /t 2 >nul & rd /s /q "%PROJECT_DIR%" & echo SISTEMA LIMPO!"
exit /b
