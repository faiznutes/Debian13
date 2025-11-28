#!/bin/bash
# Quick fix untuk build yang stuck
# Usage: bash fix-stuck-build-now.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"

echo "🔧 Fixing stuck build..."
echo ""

# Function untuk SSH command
ssh_cmd() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Step 1: Kill stuck processes
echo "🛑 Step 1: Killing stuck build processes..."
ssh_cmd "pkill -f 'docker.*build' || true"
ssh_cmd "pkill -f 'npm.*install' || true"
sleep 2
echo "✅ Processes killed"
echo ""

# Step 2: Clean Docker
echo "🧹 Step 2: Cleaning Docker system..."
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true
ssh_cmd "docker system prune -f" 2>/dev/null || true
echo "✅ Docker cleaned"
echo ""

# Step 3: Rebuild dengan no-cache dan progress
echo "🔨 Step 3: Rebuilding (this may take 20-30 minutes)..."
echo "  Building backend..."
echo "  (Harap tunggu, ini akan memakan waktu lama...)"
echo ""

# Build backend dengan output ke file
ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache --progress=plain backend > /tmp/backend-build.log 2>&1 &" || true

# Monitor progress
echo "  Monitoring build progress..."
for i in {1..60}; do
    sleep 10
    STATUS=$(ssh_cmd "tail -5 /tmp/backend-build.log 2>/dev/null | tail -1" || echo "")
    if [[ "$STATUS" == *"DONE"* ]] || [[ "$STATUS" == *"ERROR"* ]] || [[ "$STATUS" == *"failed"* ]]; then
        echo "  Build status: $STATUS"
        break
    fi
    if [ $((i % 6)) -eq 0 ]; then
        echo "  Still building... ($((i*10)) seconds elapsed)"
        ssh_cmd "tail -3 /tmp/backend-build.log 2>/dev/null | grep -E 'Step|RUN|DONE' | tail -1" || true
    fi
done

# Check if build completed
echo ""
echo "  Checking build result..."
if ssh_cmd "docker images | grep -q warungin.*backend" 2>/dev/null; then
    echo "✅ Backend build completed"
else
    echo "⚠️  Backend build may have failed, check logs:"
    ssh_cmd "tail -50 /tmp/backend-build.log 2>/dev/null" || true
    echo ""
    echo "Trying one more time with shorter timeout..."
    ssh_cmd "cd $REMOTE_DIR && timeout 600 docker compose build --progress=plain backend 2>&1 | tail -100"
fi

echo ""
echo "  Building frontend..."
ssh_cmd "cd $REMOTE_DIR && docker compose build --progress=plain frontend 2>&1 | tail -50" || {
    echo "⚠️  Frontend build failed, trying with no-cache..."
    ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache --progress=plain frontend 2>&1 | tail -50"
}

echo ""
echo "✅ Build completed"
echo ""

# Step 4: Start containers
echo "🚀 Step 4: Starting containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose up -d"
echo "✅ Containers started"
echo ""

# Step 5: Check status
echo "⏳ Waiting 20 seconds..."
sleep 20

echo "📊 Container status:"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"
echo ""

echo "🎉 Fix completed!"
echo ""
echo "📝 To view logs:"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""

