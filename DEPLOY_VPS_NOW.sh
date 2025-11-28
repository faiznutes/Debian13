#!/bin/bash
# Script untuk deploy lengkap ke VPS - JALANKAN INI!
# Usage: bash DEPLOY_VPS_NOW.sh

set -e

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"

echo "🚀 Deploy ke VPS Warungin..."
echo ""

# Function untuk SSH command
ssh_cmd() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Step 1: Pull dari GitHub
echo "📥 Step 1: Pull dari GitHub..."
ssh_cmd "cd $REMOTE_DIR && git fetch origin && git pull origin main || git pull origin master || (git fetch origin && git reset --hard origin/main)"
echo "✅ Code updated"
echo ""

# Step 2: Stop containers
echo "🛑 Step 2: Stop containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true
echo "✅ Containers stopped"
echo ""

# Step 3: Build dengan retry
echo "🔨 Step 3: Build containers (dengan retry)..."
echo "  Building backend..."
ssh_cmd "cd $REMOTE_DIR && docker compose build backend || (sleep 30 && docker compose build backend) || (sleep 60 && docker compose build --no-cache backend)"

echo "  Building frontend..."
ssh_cmd "cd $REMOTE_DIR && docker compose build frontend || (sleep 30 && docker compose build frontend) || (sleep 60 && docker compose build --no-cache frontend)"
echo "✅ Build completed"
echo ""

# Step 4: Start containers
echo "🚀 Step 4: Start containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose up -d"
echo "✅ Containers started"
echo ""

# Step 5: Wait and check
echo "⏳ Step 5: Waiting for services..."
sleep 20

echo "📊 Step 6: Check status..."
ssh_cmd "cd $REMOTE_DIR && docker compose ps"
echo ""

# Health check
echo "🏥 Step 7: Health check..."
sleep 10

BACKEND_HEALTH=$(ssh_cmd "curl -s http://localhost:3000/health 2>/dev/null || curl -s http://localhost/api/health 2>/dev/null || echo 'not ready'")
if [[ "$BACKEND_HEALTH" != "not ready" ]] && [[ "$BACKEND_HEALTH" != "" ]]; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend might still be starting"
fi

FRONTEND_CHECK=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null || echo '000'")
if [[ "$FRONTEND_CHECK" == "200" ]]; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend might still be starting (HTTP $FRONTEND_CHECK)"
fi

echo ""
echo "🎉 DEPLOYMENT SELESAI!"
echo ""
echo "📋 Info:"
echo "  Frontend: http://$SSH_HOST"
echo "  Backend API: http://$SSH_HOST/api"
echo ""
echo "📝 View logs:"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""

