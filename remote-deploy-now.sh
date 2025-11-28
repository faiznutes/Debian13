#!/bin/bash
# Script untuk dijalankan di server (via SSH)
# Clone terbaru dari GitHub dan deploy ke Docker

REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Deploy Warungin"
echo "=========================================="
echo ""

# Clone atau update repository
if [ -d "$REMOTE_DIR" ]; then
    echo "📦 Repository exists, pulling latest changes..."
    cd "$REMOTE_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    echo "📦 Cloning repository..."
    git clone "$GITHUB_REPO" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
    echo "✅ Repository cloned"
fi

# Deploy dengan Docker
echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build

# Wait a bit
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Deployment selesai!"

