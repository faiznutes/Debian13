#!/bin/bash
# Script deploy dengan timeout dan progress monitoring
# Usage: bash deploy-vps-with-timeout.sh

set -e

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"

echo "🚀 Deploy ke VPS Warungin (dengan timeout monitoring)..."
echo ""

# Function untuk SSH command dengan timeout
ssh_cmd() {
    local timeout=${2:-300}  # Default 5 menit
    if command -v sshpass &> /dev/null; then
        timeout $timeout sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_USER@$SSH_HOST" "$1"
    else
        timeout $timeout ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_USER@$SSH_HOST" "$1"
    fi
}

# Step 1: Pull dari GitHub
echo "📥 Step 1: Pull dari GitHub..."
ssh_cmd "cd $REMOTE_DIR && git fetch origin && git pull origin main" 60
echo "✅ Code updated"
echo ""

# Step 2: Stop containers
echo "🛑 Step 2: Stop containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose down" 60 2>/dev/null || true
echo "✅ Containers stopped"
echo ""

# Step 3: Build dengan timeout dan progress
echo "🔨 Step 3: Build containers..."
echo "  Building backend (timeout: 30 menit)..."
echo "  (Ini mungkin memakan waktu lama, harap tunggu...)"
echo ""

# Build backend dengan timeout 30 menit dan output real-time
ssh_cmd "cd $REMOTE_DIR && timeout 1800 docker compose build --progress=plain backend 2>&1 | tee /tmp/backend-build.log || (echo 'Build timeout atau gagal, check logs...' && cat /tmp/backend-build.log | tail -50)" 1900

# Check if build succeeded
if ssh_cmd "cd $REMOTE_DIR && docker images | grep -q warungin.*backend" 10; then
    echo "✅ Backend build completed"
else
    echo "⚠️  Backend build mungkin gagal, mencoba build ulang dengan no-cache..."
    ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache --progress=plain backend 2>&1 | tail -100" 1900 || {
        echo "❌ Backend build failed!"
        echo "Check logs dengan: ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs backend'"
        exit 1
    }
fi

echo ""
echo "  Building frontend (timeout: 20 menit)..."
ssh_cmd "cd $REMOTE_DIR && timeout 1200 docker compose build --progress=plain frontend 2>&1 | tee /tmp/frontend-build.log || (echo 'Build timeout atau gagal' && cat /tmp/frontend-build.log | tail -50)" 1300

if ssh_cmd "cd $REMOTE_DIR && docker images | grep -q warungin.*frontend" 10; then
    echo "✅ Frontend build completed"
else
    echo "⚠️  Frontend build mungkin gagal, mencoba build ulang..."
    ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache --progress=plain frontend 2>&1 | tail -100" 1300 || {
        echo "❌ Frontend build failed!"
        exit 1
    }
fi

echo ""
echo "✅ Build completed"
echo ""

# Step 4: Start containers
echo "🚀 Step 4: Start containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose up -d" 120
echo "✅ Containers started"
echo ""

# Step 5: Wait and check
echo "⏳ Step 5: Waiting for services (30 seconds)..."
sleep 30

echo "📊 Step 6: Check status..."
ssh_cmd "cd $REMOTE_DIR && docker compose ps" 30
echo ""

# Health check
echo "🏥 Step 7: Health check..."
sleep 10

BACKEND_HEALTH=$(ssh_cmd "curl -s --max-time 5 http://localhost:3000/health 2>/dev/null || curl -s --max-time 5 http://localhost/api/health 2>/dev/null || echo 'not ready'" 10)
if [[ "$BACKEND_HEALTH" != "not ready" ]] && [[ "$BACKEND_HEALTH" != "" ]]; then
    echo "✅ Backend is healthy: $BACKEND_HEALTH"
else
    echo "⚠️  Backend might still be starting"
    echo "   Check logs: ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs --tail=50 backend'"
fi

FRONTEND_CHECK=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost 2>/dev/null || echo '000'" 10)
if [[ "$FRONTEND_CHECK" == "200" ]]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_CHECK)"
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

