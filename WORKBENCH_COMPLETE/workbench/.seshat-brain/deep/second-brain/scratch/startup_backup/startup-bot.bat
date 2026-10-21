@echo off
cd /d "C:\Users\uncom\Desktop\soul-bluesky-bot"

REM Start Allie if not running
echo [STARTUP] Checking Allie...
curl -s -f http://127.0.0.1:4430/ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [STARTUP] Starting Allie daemon...
    start "Allie" cmd /c "C:\Users\uncom\Desktop\allie\start-allie.bat"
    timeout /t 8 /nobreak >nul
) else (
    echo [STARTUP] Allie already running
)

REM Start bot daemon
echo [STARTUP] Starting bot daemon...
start "BotDaemon" node daemon.js

echo [STARTUP] Bot daemon launched. PID saved.
