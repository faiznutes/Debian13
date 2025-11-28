#!/bin/bash
# Script cepat untuk clone dan deploy ke Docker
# Usage: bash deploy-now.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Deploy Warungin ke Server"
echo "=========================================="
echo "Server: $SSH_USER@$SSH_HOST"
echo "Repository: $GITHUB_REPO"
echo ""

# Function untuk menjalankan command via SSH dengan password
ssh_cmd() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    else
        echo "⚠️  sshpass tidak ditemukan. Install dengan:"
        echo "   WSL: sudo apt-get install sshpass"
        echo "   Atau jalankan command manual di server"
        exit 1
    fi
}

# Test connection
echo "🔍 Testing connection..."
if ssh_cmd "echo 'Connected'" > /dev/null 2>&1; then
    echo "✅ Connection successful"
else
    echo "❌ Connection failed!"
    exit 1
fi

# Clone atau update repository
echo ""
echo "📦 Updating repository..."
if ssh_cmd "[ -d '$REMOTE_DIR' ]"; then
    echo "Repository exists, pulling latest changes..."
    ssh_cmd "cd $REMOTE_DIR && git fetch origin && git reset --hard origin/main || git reset --hard origin/master"
else
    echo "Cloning repository..."
    ssh_cmd "git clone $GITHUB_REPO $REMOTE_DIR"
fi
echo "✅ Repository updated"

# Deploy dengan Docker
echo ""
echo "🐳 Deploying with Docker..."
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true
ssh_cmd "cd $REMOTE_DIR && docker compose pull" 2>/dev/null || true
ssh_cmd "cd $REMOTE_DIR && docker compose up -d --build"

# Wait a bit
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"

echo ""
echo "🎉 Deployment selesai!"
echo ""
echo "Frontend: http://$SSH_HOST"
echo "Backend API: http://$SSH_HOST/api"

