#!/bin/bash
# Quick deploy script - Copy paste ini setelah connect ke server via SSH
# Usage: Setelah connect ke server, copy paste isi script ini

REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Quick Deploy Warungin"
echo "=========================================="

# Clone atau update
if [ -d "$REMOTE_DIR" ]; then
    echo "📦 Updating repository..."
    cd "$REMOTE_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
else
    echo "📦 Cloning repository..."
    git clone "$GITHUB_REPO" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
fi

# Deploy
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build

echo "⏳ Waiting..."
sleep 10

echo "📊 Status:"
docker compose ps

echo "✅ Done! Access: http://192.168.0.101"

