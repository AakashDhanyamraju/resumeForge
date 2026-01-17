@echo off
REM Start script for Resume Maker (Windows)

echo 🚀 Starting Resume Maker...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Build and start containers
echo 📦 Building and starting containers...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo ❌ Failed to start services. Check logs with: docker-compose logs
    exit /b 1
) else (
    echo ✅ Resume Maker is running!
    echo.
    echo 🌐 Access the application at: http://localhost
    echo 📊 View logs with: docker-compose logs -f
    echo 🛑 Stop with: docker-compose down
)

