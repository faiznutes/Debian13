#!/bin/bash
# 🚀 FINAL DEPLOY SCRIPT
# Clone terbaru dari GitHub dan Deploy ke Docker via SSH
# JALANKAN DI GIT BASH: bash FINAL_DEPLOY.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo "=========================================="
echo "🚀 Deploy Warungin ke Docker"
echo "=========================================="
echo "Server: $SSH_USER@$SSH_HOST"
echo "Repository: $GITHUB_REPO"
echo ""

# Test connection first
echo "🔍 Testing connection to server..."
if ping -c 1 -W 2 "$SSH_HOST" > /dev/null 2>&1; then
    echo "✅ Server is reachable"
else
    echo "⚠️  Server ping failed, but continuing..."
fi

echo ""
echo "⚠️  Password: 123 (masukkan saat diminta)"
echo ""

# Deploy command with longer timeout
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 -o ServerAliveInterval=30 "$SSH_USER@$SSH_HOST" bash << 'DEPLOY_SCRIPT'
set -e

# Fix DNS issue (try without sudo first, then with sudo)
echo "🔧 Fixing DNS configuration..."
if sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF' 2>/dev/null; then
    echo "✅ DNS configuration updated"
else
    echo "⚠️  Could not update DNS (trying alternative method)..."
    # Try alternative: use systemd-resolved or modify network config
    sudo systemctl restart systemd-resolved 2>/dev/null || true
fi

# Test DNS
echo "Testing DNS..."
if nslookup registry-1.docker.io > /dev/null 2>&1 || host registry-1.docker.io > /dev/null 2>&1; then
    echo "✅ DNS working"
else
    echo "⚠️  DNS test failed, but continuing with build..."
    echo "   (Docker will try to pull images anyway)"
fi

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
    git clone https://github.com/faiznutes/Warungin.git
    cd Warungin
    echo "✅ Repository cloned"
fi

echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true

# Pull images with retry
echo "Pulling Docker images..."
PULL_SUCCESS=false
for i in {1..3}; do
    echo "Attempt $i/3..."
    if docker compose pull 2>&1 | tee /tmp/docker-pull.log; then
        # Check if there were errors in the output
        if grep -q "ERROR\|failed\|server misbehaving" /tmp/docker-pull.log 2>/dev/null; then
            if [ $i -lt 3 ]; then
                echo "⚠️  Pull had errors, retrying in 5 seconds..."
                sleep 5
            else
                echo "⚠️  Pull had errors after 3 attempts, continuing with build..."
                echo "   (Docker will try to pull during build)"
            fi
        else
            echo "✅ Images pulled successfully"
            PULL_SUCCESS=true
            break
        fi
    else
        if [ $i -lt 3 ]; then
            echo "⚠️  Pull failed, retrying in 5 seconds..."
            sleep 5
        else
            echo "⚠️  Pull failed after 3 attempts, continuing with build..."
            echo "   (Docker will try to pull during build)"
        fi
    fi
done
rm -f /tmp/docker-pull.log 2>/dev/null || true

docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

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
    echo ""
    echo "Troubleshooting:"
    echo "1. Pastikan server dapat dijangkau: ping 192.168.0.101"
    echo "2. Pastikan SSH service berjalan di server"
    echo "3. Coba connect manual: ssh warungin@192.168.0.101"
fi

