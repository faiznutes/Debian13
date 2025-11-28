#!/bin/bash
# Quick push script - jalankan ini untuk push ke GitHub

git add Dockerfile.backend client/Dockerfile update-docker.sh build-docker-retry.sh DOCKER_NETWORK_TIMEOUT_FIX.md UPDATE_DOCKER.md push-fix-network-timeout.sh PUSH_NOW.md push-to-github.ps1 push-now.bat QUICK_PUSH.sh

git commit -m "Fix: Docker network timeout issue - Add npm retry logic and timeout configuration

- Add npm config for longer timeout (5 minutes) and retry mechanism
- Add retry logic for npm install and npx prisma generate  
- Update Dockerfile.backend and client/Dockerfile with network handling
- Add build-docker-retry.sh script for build with retry
- Add update-docker.sh with retry logic for VPS deployment
- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md"

git push origin main

echo ""
echo "✅ Push selesai! Sekarang pull di VPS dengan:"
echo "   ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && git pull origin main'"
echo ""

