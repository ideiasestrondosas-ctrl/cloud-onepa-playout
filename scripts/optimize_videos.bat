@echo off
REM Script to optimize all existing MP4 videos for web streaming
REM This moves the moov atom to the beginning of the file for fast start playback

setlocal enabledelayedexpansion

echo === MP4 Streaming Optimization Script ===
echo.

REM Configuration
if "%MEDIA_PATH%"=="" set "MEDIA_PATH=.\data\media"
set "BACKUP_SUFFIX=.pre-optimized"
set "LOG_FILE=.\optimization_log.txt"

echo Media path: %MEDIA_PATH%
echo Log file: %LOG_FILE%
echo.

REM Check if ffmpeg is installed
where ffmpeg >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: ffmpeg is not installed or not in PATH
    exit /b 1
)

REM Count total MP4 files
set TOTAL_FILES=0
for /r "%MEDIA_PATH%" %%f in (*.mp4) do set /a TOTAL_FILES+=1

echo Found %TOTAL_FILES% MP4 files to process
echo.

if %TOTAL_FILES% equ 0 (
    echo No MP4 files found in %MEDIA_PATH%
    exit /b 0
)

REM Initialize log
echo Optimization started at %date% %time% > "%LOG_FILE%"
echo Total files: %TOTAL_FILES% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Counter
set PROCESSED=0
set SKIPPED=0
set FAILED=0

REM Process each MP4 file
for /r "%MEDIA_PATH%" %%f in (*.mp4) do (
    set /a PROCESSED+=1
    set "FILE=%%f"
    set "FILENAME=%%~nxf"
    
    echo [!PROCESSED!/%TOTAL_FILES%] Processing: !FILENAME!
    
    REM Create backup
    set "BACKUP_FILE=%%f%BACKUP_SUFFIX%"
    set "TEMP_FILE=%%f.temp.mp4"
    
    echo   Creating backup...
    copy "%%f" "!BACKUP_FILE!" >nul 2>&1
    
    REM Optimize with ffmpeg
    echo   Optimizing for streaming...
    ffmpeg -i "%%f" -c copy -movflags +faststart -y "!TEMP_FILE!" >nul 2>&1
    
    if !ERRORLEVEL! equ 0 (
        REM Replace original with optimized
        move /y "!TEMP_FILE!" "%%f" >nul 2>&1
        del "!BACKUP_FILE!" >nul 2>&1
        echo   Successfully optimized
        echo [SUCCESS] !FILENAME! >> "%LOG_FILE%"
    ) else (
        REM Restore backup on failure
        move /y "!BACKUP_FILE!" "%%f" >nul 2>&1
        del "!TEMP_FILE!" >nul 2>&1
        echo   Failed to optimize ^(restored backup^)
        echo [FAILED] !FILENAME! >> "%LOG_FILE%"
        set /a FAILED+=1
    )
    echo.
)

echo. >> "%LOG_FILE%"
echo Optimization completed at %date% %time% >> "%LOG_FILE%"
echo Summary: Processed=%PROCESSED%, Failed=%FAILED% >> "%LOG_FILE%"

echo.
echo === Optimization Complete ===
echo Processed: %PROCESSED% files
echo Failed: %FAILED% files
echo.
echo See %LOG_FILE% for details

endlocal
