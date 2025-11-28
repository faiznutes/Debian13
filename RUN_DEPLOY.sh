#!/bin/bash
# Script untuk clone terbaru dan deploy ke Docker
# JALANKAN DI GIT BASH: bash RUN_DEPLOY.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Clone Terbaru & Deploy ke Docker"
echo "=========================================="
echo ""

# Command untuk dijalankan di server
DEPLOY_CMD="cd /home/warungin && \
if [ -d Warungin ]; then \
  echo '📦 Updating repository...' && \
  cd Warungin && \
  git fetch origin && \
  git reset --hard origin/main || git reset --hard origin/master && \
  echo '✅ Repository updated'; \
else \
  echo '📦 Cloning repository...' && \
  git clone $GITHUB_REPO && \
  cd Warungin && \
  echo '✅ Repository cloned'; \
fi && \
echo '' && \
echo '🐳 Deploying with Docker...' && \
docker compose down 2>/dev/null || true && \
docker compose pull 2>/dev/null || true && \
docker compose up -d --build && \
echo '' && \
echo '⏳ Waiting 10 seconds...' && \
sleep 10 && \
echo '' && \
echo '📊 Service Status:' && \
docker compose ps && \
echo '' && \
echo '🎉 Deployment selesai!' && \
echo 'Frontend: http://192.168.0.101' && \
echo 'Backend: http://192.168.0.101/api'"

echo "Connecting to server..."
echo "Password: 123"
echo ""

# Jalankan command via SSH
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$DEPLOY_CMD"

echo ""
echo "✅ Selesai!"

