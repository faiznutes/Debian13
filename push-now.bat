@echo off
REM Batch script untuk push ke GitHub (Windows)
echo 🚀 Push Perbaikan Network Timeout ke GitHub
echo.

REM Add files
echo 📝 Adding files...
git add Dockerfile.backend
git add client/Dockerfile
git add update-docker.sh
git add build-docker-retry.sh
git add DOCKER_NETWORK_TIMEOUT_FIX.md
git add UPDATE_DOCKER.md
git add push-fix-network-timeout.sh
git add PUSH_NOW.md

REM Commit
echo.
echo 💾 Creating commit...
git commit -m "Fix: Docker network timeout issue - Add npm retry logic and timeout configuration" -m "- Add npm config for longer timeout (5 minutes) and retry mechanism" -m "- Add retry logic for npm install and npx prisma generate" -m "- Update Dockerfile.backend and client/Dockerfile with network handling" -m "- Add build-docker-retry.sh script for build with retry" -m "- Add update-docker.sh with retry logic for VPS deployment" -m "- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md"

if %errorlevel% neq 0 (
    echo ❌ Commit failed!
    pause
    exit /b 1
)

REM Push
echo.
echo 🚀 Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ❌ Push gagal!
    echo.
    echo Kemungkinan penyebab:
    echo   1. Authentication belum di-setup
    echo   2. Network/connection issue
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Push berhasil!
echo.
echo 🎉 Perbaikan network timeout sudah di-push ke GitHub!
echo.
pause

