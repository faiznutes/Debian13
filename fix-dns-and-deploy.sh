#!/bin/bash
# 🚀 Fix DNS Issue dan Deploy
# Script untuk fix DNS dan deploy ke Docker

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🔧 Fix DNS & Deploy Warungin ke Docker"
echo "=========================================="
echo "Server: $SSH_USER@$SSH_HOST"
echo ""

# Fix DNS dan Deploy
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" bash << 'DEPLOY_SCRIPT'
set -e

echo "🔧 Fixing DNS configuration..."

# Backup resolv.conf
sudo cp /etc/resolv.conf /etc/resolv.conf.backup 2>/dev/null || true

# Fix DNS - gunakan Google DNS atau Cloudflare DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf > /dev/null
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf > /dev/null

# Test DNS
echo "Testing DNS..."
if nslookup registry-1.docker.io > /dev/null 2>&1; then
    echo "✅ DNS working"
else
    echo "⚠️  DNS test failed, but continuing..."
fi

# Update repository
cd /home/warungin

echo ""
echo "📦 Checking repository..."
if [ -d Warungin ]; then
    echo "Repository exists, updating..."
    cd Warungin
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    echo "Cloning repository..."
    git clone "$GITHUB_REPO"
    cd Warungin
    echo "✅ Repository cloned"
fi

# Deploy dengan Docker - dengan retry
echo ""
echo "🐳 Deploying with Docker..."

# Stop existing containers
docker compose down 2>/dev/null || true

# Try to pull images with retry
echo "Pulling Docker images (with retry)..."
for i in {1..3}; do
    echo "Attempt $i/3..."
    if docker compose pull 2>&1; then
        echo "✅ Images pulled successfully"
        break
    else
        if [ $i -lt 3 ]; then
            echo "⚠️  Pull failed, retrying in 5 seconds..."
            sleep 5
        else
            echo "⚠️  Pull failed after 3 attempts, continuing with build..."
        fi
    fi
done

# Build and start
echo ""
echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "📊 Docker Compose Status:"
docker compose ps

echo ""
echo "🎉 Deployment completed!"
echo "Frontend: http://192.168.0.101"
echo "Backend API: http://192.168.0.101/api"
DEPLOY_SCRIPT

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
else
    echo ""
    echo "❌ Deployment failed with exit code: $EXIT_CODE"
fi

