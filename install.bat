@echo off
REM Installation script for Obsidian Sync plugin on Windows

setlocal enabledelayedexpansion

echo.
echo 🚀 Obsidian Sync Plugin Installation
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed.
    echo    Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version

REM Check if in correct directory
if not exist manifest.json (
    echo ❌ manifest.json not found. Please run this script from the plugin directory.
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔨 Building plugin...
call npm run build

echo.
echo ✅ Build complete!

REM Get vault path from user
echo.
echo 📁 Plugin Installation
echo --------------------
set /p VAULT_PATH="Enter your Obsidian vault path (e.g., C:\Users\username\Documents\MyVault): "

REM Verify vault path exists
if not exist "!VAULT_PATH!" (
    echo ❌ Vault path does not exist: !VAULT_PATH!
    pause
    exit /b 1
)

set PLUGIN_PATH=!VAULT_PATH!\.obsidian\plugins\obsidian-sync

REM Create plugin directory if it doesn't exist
if not exist "!PLUGIN_PATH!" mkdir "!PLUGIN_PATH!"

REM Copy plugin files
echo.
echo 📋 Copying plugin files...
copy main.js "!PLUGIN_PATH!" >nul
copy manifest.json "!PLUGIN_PATH!" >nul
copy styles.css "!PLUGIN_PATH!" >nul

echo ✅ Plugin files copied to: !PLUGIN_PATH!

echo.
echo 🔐 Google Drive Setup
echo -------------------
echo Next, you need to set up Google Drive API access:
echo.
echo 1. Visit https://console.cloud.google.com
echo 2. Create a new project
echo 3. Enable Google Drive API
echo 4. Create OAuth 2.0 credentials (Desktop application)
echo 5. Download the JSON credentials file
echo.
echo Copy the credentials and create a .env file:
echo   copy .env.example .env
echo   REM Edit .env with your credentials
echo.

set /p SETUP_GOOGLE="Have you set up Google Drive API credentials? (y/n): "
if /i "!SETUP_GOOGLE!"=="y" (
    set /p CLIENT_ID="Enter your GOOGLE_CLIENT_ID: "
    set /p CLIENT_SECRET="Enter your GOOGLE_CLIENT_SECRET: "
    
    (
        echo GOOGLE_CLIENT_ID=!CLIENT_ID!
        echo GOOGLE_CLIENT_SECRET=!CLIENT_SECRET!
        echo GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
    ) > .env
    
    echo ✅ .env file created
)

echo.
echo 🎉 Installation Complete!
echo ==========================
echo.
echo Next steps:
echo 1. Open Obsidian
echo 2. Settings ^> Community Plugins ^> Turn on community plugins
echo 3. Find 'Obsidian Sync' and enable it
echo 4. Click 'Authenticate' in plugin settings
echo 5. Authorize the plugin to access Google Drive
echo 6. Start syncing!
echo.
echo For more help, see README.md and GOOGLE_DRIVE_SETUP.md
echo.
pause
