#!/bin/bash
# Script untuk dijalankan LANGSUNG di server (setelah connect via SSH)
# Copy paste command ini setelah connect: ssh warungin@192.168.0.101

set -e

echo "=========================================="
echo "🚀 Deploy Warungin ke Docker"
echo "=========================================="

# Fix DNS
echo "🔧 Fixing DNS configuration..."
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF' 2>/dev/null && echo "✅ DNS updated" || echo "⚠️  DNS update failed (may need sudo password)"

# Test DNS
echo "Testing DNS..."
if nslookup registry-1.docker.io > /dev/null 2>&1 || host registry-1.docker.io > /dev/null 2>&1; then
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
    git clone https://github.com/faiznutes/Warungin.git
    cd Warungin
    echo "✅ Repository cloned"
fi

# Deploy Docker
echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true

# Pull images with retry
echo "Pulling Docker images..."
for i in {1..3}; do
    echo "Attempt $i/3..."
    if docker compose pull 2>&1 | tee /tmp/docker-pull.log; then
        if grep -q "ERROR\|failed\|server misbehaving" /tmp/docker-pull.log 2>/dev/null; then
            if [ $i -lt 3 ]; then
                echo "⚠️  Pull had errors, retrying in 5 seconds..."
                sleep 5
            else
                echo "⚠️  Pull had errors, continuing with build..."
            fi
        else
            echo "✅ Images pulled successfully"
            break
        fi
    else
        if [ $i -lt 3 ]; then
            echo "⚠️  Pull failed, retrying in 5 seconds..."
            sleep 5
        else
            echo "⚠️  Pull failed, continuing with build..."
        fi
    fi
done
rm -f /tmp/docker-pull.log 2>/dev/null || true

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

