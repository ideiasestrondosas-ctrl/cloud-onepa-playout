@echo off
setlocal enabledelayedexpansion
REM ONEPA Playout PRO - Update Script for Windows
REM Version: 2.2.0-ALPHA.5-PRO

echo --------------------------------------------------
echo 🔄 Iniciando Atualizacao do Sistema...
echo --------------------------------------------------

REM 1. Load .env variables
if not exist .env (
    echo ❌ Arquivo .env nao encontrado. Execute o install.bat primeiro.
    pause
    exit /b 1
)

for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DEPLOY_BRANCH" set BRANCH=%%b
    if "%%a"=="DEPLOY_REPO" set REPO=%%b
)

if "%BRANCH%"=="" set BRANCH=alpha
if "%REPO%"=="" set REPO=ideiasestrondosas-ctrl/cloud-onepa-playout

echo Configuracao: Branch %BRANCH% do repositorio %REPO%

REM 2. Get latest code
set TEMP_DIR=onepa_update_%random%
echo.
echo ⬇️ Buscando atualizacoes...

git clone -b %BRANCH% https://github.com/%REPO%.git %TEMP_DIR%
if %errorlevel% neq 0 (
    echo ❌ Falha ao buscar atualizacoes.
    pause
    exit /b 1
)

REM 3. Apply Updates
echo.
echo 🏗️ Reconstruindo Contentores...
copy /Y %TEMP_DIR%\docker-compose.yml .\ >nul
xcopy /E /I /Y %TEMP_DIR%\scripts .\scripts >nul

docker compose build --pull
docker compose up -d

REM 4. Cleanup
echo.
echo 🧹 Finalizando limpeza...
rmdir /s /q %TEMP_DIR%

echo.
echo ✨ Sistema atualizado com sucesso!
echo 🌐 Acesso: http://localhost:3011
echo.
pause
