@echo off
title MCGA Pro - Desktop Edition
echo ========================================
echo   MCGA Pro - Minecraft AI Mod Generator
echo   Desktop Edition
echo ========================================
echo.

echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo Node.js found:
node -v
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Dependencies ready.
echo.

echo Checking Electron...
if not exist "node_modules\electron" (
    echo [ERROR] Electron is not installed!
    echo Run: npm install
    pause
    exit /b 1
)

echo.
echo Starting MCGA Pro Desktop...
echo ========================================
echo.

npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application failed to start!
    pause
)