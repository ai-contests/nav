@echo off
setlocal enabledelayedexpansion

REM Development setup script for AI Contests Navigator (Windows)
REM This script helps set up the development environment

echo 🚀 Setting up AI Contests Navigator development environment...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

REM Get Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set MAJOR_VERSION=%%i
if %MAJOR_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: !NODE_VERSION!
    exit /b 1
)

echo ✅ Node.js version: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    exit /b 1
)

for /f %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "data\raw" mkdir "data\raw"
if not exist "data\processed" mkdir "data\processed"
if not exist "data\backup" mkdir "data\backup"
if not exist "logs" mkdir "logs"
if not exist "site" mkdir "site"

REM Create local config if it doesn't exist
if not exist "config\local.json" (
    echo ⚙️ Creating local configuration...
    copy "config\default.json" "config\local.json"
    echo 📝 Please edit config\local.json with your API keys and settings
)

REM Build the project
echo 🔨 Building project...
npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

REM Run linting
echo 🔍 Running code quality checks...
npm run lint
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Linting issues found
)

REM Run tests
echo 🧪 Running tests...
npm test
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Some tests failed
)

echo.
echo ✅ Development environment setup complete!
echo.
echo 🎯 Quick start commands:
echo   npm run dev          # Start development mode
echo   npm run crawl        # Crawl contest data
echo   npm run process      # Process data with AI
echo   npm run generate     # Generate static site
echo   npm run health       # Health check
echo.
echo 📖 Check README.md for more information

pause
