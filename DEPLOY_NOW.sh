#!/bin/bash
# 🚀 DEPLOY SCRIPT - Clone Terbaru & Push ke Docker
# Jalankan di Git Bash: bash DEPLOY_NOW.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Deploy Warungin ke Docker"
echo "=========================================="
echo "Server: $SSH_USER@$SSH_HOST"
echo "Repository: $GITHUB_REPO"
echo ""
echo "Password: 123"
echo ""

# Deploy command menggunakan heredoc
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" << 'ENDSSH'
cd /home/warungin

# Clone atau update repository
if [ -d Warungin ]; then
    echo "📦 Updating repository..."
    cd Warungin
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    echo "📦 Cloning repository..."
    git clone https://github.com/faiznutes/Warungin.git
    cd Warungin
    echo "✅ Repository cloned"
fi

# Deploy dengan Docker
echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build

# Wait
echo ""
echo "⏳ Waiting 10 seconds for services to start..."
sleep 10

# Status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Deployment selesai!"
echo "Frontend: http://192.168.0.101"
echo "Backend API: http://192.168.0.101/api"
ENDSSH

echo ""
echo "✅ Deploy script completed!"

