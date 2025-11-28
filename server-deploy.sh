#!/bin/bash
# Script untuk dijalankan di server
cd /home/warungin

# Clone atau update
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

# Deploy Docker
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

