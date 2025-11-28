#!/bin/bash
# Script untuk clone terbaru dan deploy ke Docker
# Jalankan di Git Bash: bash clone-and-deploy.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Clone & Deploy Warungin ke Server"
echo "=========================================="
echo "Server: $SSH_USER@$SSH_HOST"
echo "Repository: $GITHUB_REPO"
echo ""
echo "Password: 123"
echo ""

# Upload script ke server dan jalankan
echo "📤 Uploading deployment script..."
scp -o StrictHostKeyChecking=no remote-deploy-now.sh "$SSH_USER@$SSH_HOST:/tmp/remote-deploy-now.sh"

echo ""
echo "🚀 Running deployment on server..."
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "bash /tmp/remote-deploy-now.sh"

echo ""
echo "✅ Selesai!"
echo ""
echo "Frontend: http://$SSH_HOST"
echo "Backend API: http://$SSH_HOST/api"

