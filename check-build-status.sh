#!/bin/bash
# Script untuk check status build yang sedang berjalan
# Usage: bash check-build-status.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
REMOTE_DIR="/home/warungin/Warungin"

echo "🔍 Checking build status..."
echo ""

# Function untuk SSH command
ssh_cmd() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Check running containers
echo "📊 Running containers:"
ssh_cmd "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

# Check Docker images
echo "🖼️  Docker images:"
ssh_cmd "docker images | grep warungin || echo 'No warungin images found'"
echo ""

# Check build process
echo "🔨 Checking build process..."
ssh_cmd "ps aux | grep -E 'docker.*build|npm.*install' | grep -v grep || echo 'No build process running'"
echo ""

# Check disk space
echo "💾 Disk space:"
ssh_cmd "df -h /"
echo ""

# Check Docker system
echo "🐳 Docker system info:"
ssh_cmd "docker system df"
echo ""

# Check recent logs
echo "📋 Recent backend logs (last 20 lines):"
ssh_cmd "cd $REMOTE_DIR && docker compose logs --tail=20 backend 2>/dev/null || echo 'No logs available'"
echo ""

echo "✅ Status check completed"
echo ""
echo "💡 Tips:"
echo "  - Jika build stuck, coba: ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose build --no-cache'"
echo "  - Untuk kill stuck process: ssh $SSH_USER@$SSH_HOST 'pkill -f docker.*build'"
echo "  - Untuk clean dan rebuild: ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker system prune -f && docker compose build'"
echo ""

