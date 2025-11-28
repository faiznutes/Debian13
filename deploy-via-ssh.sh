#!/bin/bash
# Deploy script dengan multiple methods
# Usage: bash deploy-via-ssh.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Deploy Warungin ke Docker via SSH"
echo "=========================================="
echo ""

# Deploy command
DEPLOY_SCRIPT='#!/bin/bash
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "📦 Updating repository..."
if [ -d "$REMOTE_DIR" ]; then
    cd "$REMOTE_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    git clone "$GITHUB_REPO" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
    echo "✅ Repository cloned"
fi

echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build

echo ""
echo "⏳ Waiting 10 seconds..."
sleep 10

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Deployment selesai!"
echo "Frontend: http://192.168.0.101"
echo "Backend: http://192.168.0.101/api"
'

# Try method 1: Direct SSH with command
echo "Method 1: Direct SSH command..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_USER@$SSH_HOST" "bash -s" << 'DEPLOY_EOF'
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "📦 Updating repository..."
if [ -d "$REMOTE_DIR" ]; then
    cd "$REMOTE_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    git clone "$GITHUB_REPO" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
    echo "✅ Repository cloned"
fi

echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build

echo ""
echo "⏳ Waiting 10 seconds..."
sleep 10

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Deployment selesai!"
DEPLOY_EOF

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    exit 0
fi

echo ""
echo "⚠️  Direct SSH failed. Please run manually:"
echo ""
echo "1. Connect to server:"
echo "   ssh $SSH_USER@$SSH_HOST"
echo "   Password: 123"
echo ""
echo "2. Run this command:"
echo "   cd /home/warungin && if [ -d Warungin ]; then cd Warungin && git fetch origin && git reset --hard origin/main; else git clone $GITHUB_REPO && cd Warungin; fi && docker compose down 2>/dev/null; docker compose pull 2>/dev/null; docker compose up -d --build; docker compose ps"

