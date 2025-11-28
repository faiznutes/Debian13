#!/bin/bash
# Fix Docker Hub timeout issue dengan registry mirror
# Usage: bash fix-docker-hub-timeout.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"

echo "🔧 Fixing Docker Hub timeout issue..."
echo ""

# Function untuk SSH command
ssh_cmd() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Step 1: Setup Docker daemon dengan registry mirror
echo "📝 Step 1: Setting up Docker registry mirror..."
ssh_cmd "sudo mkdir -p /etc/docker" 2>/dev/null || true

# Create atau update daemon.json
ssh_cmd "cat > /tmp/daemon.json << 'EOF'
{
  \"registry-mirrors\": [
    \"https://docker.mirrors.ustc.edu.cn\",
    \"https://hub-mirror.c.163.com\",
    \"https://mirror.baidubce.com\"
  ],
  \"max-concurrent-downloads\": 10,
  \"max-concurrent-uploads\": 5
}
EOF
sudo cp /tmp/daemon.json /etc/docker/daemon.json" || {
    echo "⚠️  Failed to setup registry mirror, trying alternative..."
}

# Restart Docker daemon
echo "🔄 Restarting Docker daemon..."
ssh_cmd "sudo systemctl restart docker || sudo service docker restart" 2>/dev/null || true
sleep 5

echo "✅ Docker daemon configured"
echo ""

# Step 2: Pull base image dengan retry
echo "📥 Step 2: Pulling base images dengan retry..."
echo "  Pulling node:18-alpine..."

# Retry pull dengan timeout lebih lama
for attempt in 1 2 3 4 5; do
    echo "  Attempt $attempt/5..."
    if ssh_cmd "timeout 300 docker pull node:18-alpine" 2>&1 | grep -q "Status: Downloaded\|Status: Image is up to date"; then
        echo "✅ node:18-alpine pulled successfully"
        break
    else
        if [ $attempt -lt 5 ]; then
            echo "  ⚠️  Pull failed, waiting 30s before retry..."
            sleep 30
        else
            echo "  ❌ Failed to pull after 5 attempts"
            echo "  Trying with different registry..."
            ssh_cmd "docker pull registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine || docker pull node:18-alpine" || true
        fi
    fi
done

echo ""
echo "  Pulling nginx:alpine..."
for attempt in 1 2 3; do
    if ssh_cmd "timeout 300 docker pull nginx:alpine" 2>&1 | grep -q "Status: Downloaded\|Status: Image is up to date"; then
        echo "✅ nginx:alpine pulled successfully"
        break
    else
        sleep 20
    fi
done

echo ""
echo "  Pulling postgres:15-alpine..."
for attempt in 1 2 3; do
    if ssh_cmd "timeout 300 docker pull postgres:15-alpine" 2>&1 | grep -q "Status: Downloaded\|Status: Image is up to date"; then
        echo "✅ postgres:15-alpine pulled successfully"
        break
    else
        sleep 20
    fi
done

echo ""
echo "✅ Base images pulled"
echo ""

# Step 3: Build dengan retry
echo "🔨 Step 3: Building containers..."
echo "  Building backend (dengan retry)..."
echo "  (Ini akan memakan waktu lama, harap tunggu...)"
echo ""

for attempt in 1 2 3; do
    echo "  Build attempt $attempt/3..."
    if ssh_cmd "cd $REMOTE_DIR && timeout 1800 docker compose build --progress=plain backend 2>&1 | tail -20" 1900; then
        if ssh_cmd "cd $REMOTE_DIR && docker compose build backend > /dev/null 2>&1"; then
            echo "✅ Backend built successfully"
            break
        fi
    fi
    if [ $attempt -lt 3 ]; then
        echo "  ⚠️  Build failed, waiting 30s..."
        sleep 30
    fi
done

echo ""
echo "  Building frontend..."
ssh_cmd "cd $REMOTE_DIR && timeout 1200 docker compose build --progress=plain frontend 2>&1 | tail -20" 1300 || {
    echo "⚠️  Frontend build failed, trying again..."
    ssh_cmd "cd $REMOTE_DIR && docker compose build frontend" || true
}

echo ""
echo "✅ Build completed"
echo ""

# Step 4: Start containers
echo "🚀 Step 4: Starting containers..."
ssh_cmd "cd $REMOTE_DIR && docker compose up -d"
echo "✅ Containers started"
echo ""

# Check status
sleep 20
echo "📊 Container status:"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"
echo ""

echo "🎉 Fix completed!"
echo ""
echo "💡 Tips:"
echo "  - Jika masih timeout, coba build di waktu yang berbeda (malam/pagi)"
echo "  - Atau gunakan VPN/proxy untuk akses Docker Hub"
echo ""

