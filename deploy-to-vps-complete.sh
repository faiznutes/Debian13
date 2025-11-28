#!/bin/bash

# Script lengkap untuk deploy ke VPS: Pull dari GitHub, Build, dan Deploy Docker
# Usage: bash deploy-to-vps-complete.sh

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

echo -e "${BLUE}🚀 Deploy Lengkap ke VPS Warungin${NC}"
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
    local SSH_OPTS="-o StrictHostKeyChecking=no -p $SSH_PORT -o ConnectTimeout=10"
    
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
    echo -e "${YELLOW}Pastikan server dapat diakses dan kredensial benar${NC}"
    exit 1
fi

# Check Docker on server
echo -e "${YELLOW}🔍 Checking Docker on server...${NC}"
if ssh_cmd "command -v docker &> /dev/null"; then
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${RED}❌ Docker tidak terinstall di server!${NC}"
    exit 1
fi

# Check Docker Compose
if ssh_cmd "command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null"; then
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose tidak terinstall${NC}"
fi

# Step 1: Update repository dari GitHub
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Pull Latest Code dari GitHub${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if ssh_cmd "[ -d '$REMOTE_DIR' ]"; then
    echo -e "${YELLOW}📥 Pulling latest code dari GitHub...${NC}"
    ssh_cmd "cd $REMOTE_DIR && git fetch origin" || true
    ssh_cmd "cd $REMOTE_DIR && git pull origin main || git pull origin master" || {
        echo -e "${YELLOW}⚠️  Git pull failed, trying reset...${NC}"
        ssh_cmd "cd $REMOTE_DIR && git fetch origin && git reset --hard origin/main || git reset --hard origin/master"
    }
    echo -e "${GREEN}✅ Code updated dari GitHub${NC}"
else
    echo -e "${YELLOW}📦 Repository tidak ditemukan, cloning...${NC}"
    ssh_cmd "cd /home/warungin && git clone $GITHUB_REPO Warungin" || {
        echo -e "${RED}❌ Git clone failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi

# Check .env file
echo ""
echo -e "${YELLOW}🔍 Checking .env file...${NC}"
if ssh_cmd "[ ! -f '$REMOTE_DIR/.env' ]"; then
    echo -e "${YELLOW}⚠️  .env file tidak ditemukan!${NC}"
    if ssh_cmd "[ -f '$REMOTE_DIR/env.example' ]"; then
        echo -e "${YELLOW}Creating .env from env.example...${NC}"
        ssh_cmd "cd $REMOTE_DIR && cp env.example .env"
        echo -e "${RED}⚠️  PENTING: Edit .env file di server dengan konfigurasi yang benar!${NC}"
        echo -e "${YELLOW}Jalankan: ssh $SSH_USER@$SSH_HOST 'nano $REMOTE_DIR/.env'${NC}"
        read -p "Lanjutkan deploy? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    else
        echo -e "${RED}❌ env.example tidak ditemukan!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Step 2: Stop existing containers
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Stop Existing Containers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🛑 Stopping containers...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"

# Step 3: Pull base images
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Pull Base Images${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📥 Pulling base images...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose pull postgres redis nginx" 2>/dev/null || true
echo -e "${GREEN}✅ Base images pulled${NC}"

# Step 4: Build containers with retry
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Build Docker Containers (dengan Retry)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Build backend with retry
echo -e "${YELLOW}🔨 Building backend...${NC}"
BUILD_SUCCESS=false
for attempt in 1 2 3; do
    echo -e "${YELLOW}  Attempt $attempt/3...${NC}"
    if ssh_cmd "cd $REMOTE_DIR && docker compose build --progress=plain backend 2>&1 | tail -20"; then
        if ssh_cmd "cd $REMOTE_DIR && docker compose build backend > /dev/null 2>&1"; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ Backend built successfully${NC}"
            break
        fi
    fi
    if [ $attempt -lt 3 ]; then
        echo -e "${YELLOW}  ⚠️  Build failed, waiting 30s before retry...${NC}"
        sleep 30
        ssh_cmd "docker system prune -f > /dev/null 2>&1" || true
    fi
done

if [ "$BUILD_SUCCESS" = false ]; then
    echo -e "${RED}❌ Backend build failed after 3 attempts${NC}"
    echo -e "${YELLOW}Trying one more time with no-cache...${NC}"
    ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache backend" || {
        echo -e "${RED}❌ Backend build failed!${NC}"
        exit 1
    }
fi

# Build frontend with retry
echo ""
echo -e "${YELLOW}🔨 Building frontend...${NC}"
BUILD_SUCCESS=false
for attempt in 1 2 3; do
    echo -e "${YELLOW}  Attempt $attempt/3...${NC}"
    if ssh_cmd "cd $REMOTE_DIR && docker compose build --progress=plain frontend 2>&1 | tail -20"; then
        if ssh_cmd "cd $REMOTE_DIR && docker compose build frontend > /dev/null 2>&1"; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ Frontend built successfully${NC}"
            break
        fi
    fi
    if [ $attempt -lt 3 ]; then
        echo -e "${YELLOW}  ⚠️  Build failed, waiting 30s before retry...${NC}"
        sleep 30
        ssh_cmd "docker system prune -f > /dev/null 2>&1" || true
    fi
done

if [ "$BUILD_SUCCESS" = false ]; then
    echo -e "${RED}❌ Frontend build failed after 3 attempts${NC}"
    echo -e "${YELLOW}Trying one more time with no-cache...${NC}"
    ssh_cmd "cd $REMOTE_DIR && docker compose build --no-cache frontend" || {
        echo -e "${RED}❌ Frontend build failed!${NC}"
        exit 1
    }
fi

# Step 5: Start containers
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: Start Docker Containers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 Starting containers...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose up -d"
echo -e "${GREEN}✅ Containers started${NC}"

# Step 6: Wait for services
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 6: Waiting for Services to Start${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⏳ Waiting 20 seconds for services to start...${NC}"
sleep 20

# Step 7: Check status
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 7: Check Service Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📊 Container Status:${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"

# Step 8: Health checks
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 8: Health Checks${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

sleep 10

# Check backend health
echo -e "${YELLOW}🏥 Checking backend health...${NC}"
BACKEND_HEALTH=$(ssh_cmd "curl -s http://localhost:3000/health 2>/dev/null || curl -s http://localhost/api/health 2>/dev/null || echo 'not ready'")
if [[ "$BACKEND_HEALTH" != "not ready" ]] && [[ "$BACKEND_HEALTH" != "" ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo -e "${GREEN}   Response: $BACKEND_HEALTH${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (might still be starting)${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    ssh_cmd "cd $REMOTE_DIR && docker compose logs --tail=20 backend" || true
fi

# Check frontend
echo ""
echo -e "${YELLOW}🌐 Checking frontend...${NC}"
FRONTEND_CHECK=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null || echo '000'")
if [[ "$FRONTEND_CHECK" == "200" ]]; then
    echo -e "${GREEN}✅ Frontend is accessible (HTTP $FRONTEND_CHECK)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (HTTP $FRONTEND_CHECK, might still be starting)${NC}"
fi

# Check nginx
echo ""
echo -e "${YELLOW}🔍 Checking nginx...${NC}"
NGINX_STATUS=$(ssh_cmd "docker ps --filter 'name=warungin-nginx' --format '{{.Status}}' 2>/dev/null || echo 'not running'")
if [[ "$NGINX_STATUS" != "not running" ]] && [[ "$NGINX_STATUS" != "" ]]; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
    echo -e "${GREEN}   Status: $NGINX_STATUS${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx check failed${NC}"
fi

# Final summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SELESAI!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Informasi:${NC}"
echo -e "  Server: $SSH_USER@$SSH_HOST"
echo -e "  Directory: $REMOTE_DIR"
echo -e "  Frontend: http://$SSH_HOST"
echo -e "  Backend API: http://$SSH_HOST/api"
echo -e "  Health Check: http://$SSH_HOST/api/health"
echo ""
echo -e "${YELLOW}📝 Perintah Berguna:${NC}"
echo "  # View logs"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""
echo "  # View logs service tertentu"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f backend'"
echo ""
echo "  # Restart services"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose restart'"
echo ""
echo "  # Check status"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose ps'"
echo ""
echo -e "${GREEN}✅ Deployment berhasil!${NC}"
echo ""

