#!/bin/bash

# Script untuk update Docker dari GitHub ke VPS Warungin
# Usage: bash update-docker.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# SSH Configuration
SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
SSH_PORT="22"
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo -e "${BLUE}🔄 Update Docker dari GitHub ke VPS Warungin${NC}"
echo ""
echo -e "${YELLOW}Server: $SSH_USER@$SSH_HOST${NC}"
echo -e "${YELLOW}Directory: $REMOTE_DIR${NC}"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak terinstall${NC}"
    echo -e "${YELLOW}Install dengan:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  Mac: brew install sshpass"
    echo "  Windows (Git Bash): Download dari https://github.com/keimpx/sshpass-windows"
    echo ""
    read -p "Lanjutkan tanpa sshpass? (akan minta password manual) (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    USE_SSHPASS=false
else
    USE_SSHPASS=true
fi

# Function to run SSH command
ssh_cmd() {
    local SSH_OPTS="-o StrictHostKeyChecking=no -p $SSH_PORT"
    
    if [ "$USE_SSHPASS" = true ]; then
        sshpass -p "$SSH_PASSWORD" ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "$@"
    else
        ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ssh_cmd "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed!${NC}"
    exit 1
fi

# Update repository dari GitHub
echo ""
echo -e "${YELLOW}📥 Pulling latest code dari GitHub...${NC}"
if ssh_cmd "[ -d '$REMOTE_DIR' ]"; then
    echo -e "${YELLOW}Repository ditemukan, updating...${NC}"
    ssh_cmd "cd $REMOTE_DIR && git fetch origin && git pull origin main || git pull origin master" || {
        echo -e "${YELLOW}⚠️  Git pull failed, trying reset...${NC}"
        ssh_cmd "cd $REMOTE_DIR && git fetch origin && git reset --hard origin/main || git reset --hard origin/master"
    }
    echo -e "${GREEN}✅ Code updated dari GitHub${NC}"
else
    echo -e "${YELLOW}Repository tidak ditemukan, cloning...${NC}"
    ssh_cmd "cd /home/warungin && git clone $GITHUB_REPO Warungin" || {
        echo -e "${RED}❌ Git clone failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi

# Update Docker containers
echo ""
echo -e "${YELLOW}🐳 Updating Docker containers...${NC}"

# Stop existing containers
echo -e "${YELLOW}  🛑 Stopping containers...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true

# Pull latest base images (optional, untuk mempercepat build)
echo -e "${YELLOW}  📥 Pulling base images...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose pull postgres redis nginx" 2>/dev/null || true

# Rebuild and start containers with retry logic
echo -e "${YELLOW}  🔨 Rebuilding dan starting containers...${NC}"
echo -e "${YELLOW}  (Menggunakan retry logic untuk mengatasi network timeout)${NC}"
ssh_cmd "cd $REMOTE_DIR && \
  docker compose build --progress=plain backend || \
  (sleep 30 && docker compose build --progress=plain backend) || \
  (sleep 60 && docker compose build --progress=plain backend)" || {
    echo -e "${YELLOW}⚠️  Backend build dengan retry gagal, mencoba build normal...${NC}"
    ssh_cmd "cd $REMOTE_DIR && docker compose build backend"
}

ssh_cmd "cd $REMOTE_DIR && \
  docker compose build --progress=plain frontend || \
  (sleep 30 && docker compose build --progress=plain frontend) || \
  (sleep 60 && docker compose build --progress=plain frontend)" || {
    echo -e "${YELLOW}⚠️  Frontend build dengan retry gagal, mencoba build normal...${NC}"
    ssh_cmd "cd $REMOTE_DIR && docker compose build frontend"
}

# Start containers
ssh_cmd "cd $REMOTE_DIR && docker compose up -d"

# Wait for services to start
echo ""
echo -e "${YELLOW}⏳ Menunggu services siap...${NC}"
sleep 15

# Check service status
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"

# Check health
echo ""
echo -e "${YELLOW}🏥 Checking health...${NC}"
sleep 5

# Check backend health
BACKEND_HEALTH=$(ssh_cmd "curl -s http://localhost:3000/health 2>/dev/null || curl -s http://localhost/api/health 2>/dev/null || echo 'not ready'")
if [[ "$BACKEND_HEALTH" != "not ready" ]] && [[ "$BACKEND_HEALTH" != "" ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (might still be starting)${NC}"
fi

# Check frontend
FRONTEND_CHECK=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null || echo '000'")
if [[ "$FRONTEND_CHECK" == "200" ]]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (might still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Update Docker selesai!${NC}"
echo ""
echo -e "${BLUE}📋 Informasi:${NC}"
echo -e "  Server: $SSH_USER@$SSH_HOST"
echo -e "  Frontend: http://$SSH_HOST"
echo -e "  Backend API: http://$SSH_HOST/api"
echo ""
echo -e "${YELLOW}📝 Perintah berguna:${NC}"
echo "  # View logs"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""
echo "  # View logs service tertentu"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f backend'"
echo ""
echo "  # Restart services"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose restart'"
echo ""
echo "  # Stop services"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose down'"
echo ""

