@echo off
setlocal
REM ONEPA Playout PRO - Windows Auto-Update Script
REM Usage: Add to Task Scheduler for nightly updates

REM --- Get Version ---
FOR /F "tokens=2 delims==" %%I IN ('findstr /C:"version =" backend\Cargo.toml') DO SET VERSION=%%I
SET VERSION=%VERSION:"=%
SET VERSION=%VERSION: =%

echo [ %date% %time% ] 🔄 ONEPA Auto-Update (v%VERSION%) — Checking for updates...

cd /d "%~dp0.."

REM 1. Update Code
git fetch origin main
if %errorlevel% neq 0 (
    echo [ %date% %time% ] ❌ Git fetch failed. Verify GH CLI auth.
    exit /b 1
)

REM Check if update needed
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f "tokens=*" %%i in ('git rev-parse origin/main') do set REMOTE=%%i

if "%LOCAL%" NEQ "%REMOTE%" (
    echo [ %date% %time% ] 📥 Updates found! Pulling...
    git pull origin main
    
    echo [ %date% %time% ] 🏗️  Rebuilding containers...
    docker compose up -d --build --remove-orphans
    
    echo [ %date% %time% ] 🧹 Cleaning up old images...
    docker image prune -f
    
    echo [ %date% %time% ] ✅ System updated successfully.
) else (
    echo [ %date% %time% ] ✅ System is already up to date.
)
