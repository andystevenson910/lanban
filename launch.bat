@echo off
REM Launcher for Windows.
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo Error: npm not found. Install Node.js from https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies ^(first run^)...
    call npm install
    if errorlevel 1 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

echo Starting Kanban... (Ctrl+C to stop)
call npm run dev
pause
