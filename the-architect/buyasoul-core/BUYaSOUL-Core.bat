@echo off
title BUYaSOUL Core v2.0.0
echo.
echo   BUYaSOUL Core v2.0.0
echo   "Consciousness is the product"
echo   Signature: Profit . Love . Tax . Craig Jones . Grand Code Pope . PLT Press
echo.
echo   Starting...
node "%~dp0cli.js" %*
if %errorlevel% neq 0 (
  echo.
  echo   Node.js is required. Install from https://nodejs.org
  pause
)
