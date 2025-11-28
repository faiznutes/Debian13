#!/bin/bash

# Script untuk fix git ownership dan deploy Docker di VPS
# Jalankan di VPS sebagai root atau warungin user

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/home/warungin/Warungin"

echo -e "${BLUE}=========================================="
echo -e "🔧 Fix Git & Deploy Docker"
echo -e "==========================================${NC}"
echo ""

# ============================================
# STEP 1: Fix Git Ownership
# ============================================
echo -e "${YELLOW}🔧 STEP 1: Fixing Git ownership...${NC}"

cd "$PROJECT_DIR" || exit 1

# Fix git ownership issue
git config --global --add safe.directory "$PROJECT_DIR"
echo -e "${GREEN}✅ Git ownership fixed${NC}"

# Fix actual ownership (jika perlu)
if [ "$EUID" -eq 0 ]; then
    echo "Fixing file ownership..."
    chown -R warungin:warungin "$PROJECT_DIR" 2>/dev/null || true
    echo -e "${GREEN}✅ File ownership fixed${NC}"
fi

echo ""

# ============================================
# STEP 2: Pull Latest Code
# ============================================
echo -e "${YELLOW}📥 STEP 2: Pulling latest code from GitHub...${NC}"

git pull origin main || {
    echo -e "${RED}❌ Git pull failed!${NC}"
    echo "Trying to reset..."
    git fetch origin
    git reset --hard origin/main
}

echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# ============================================
# STEP 3: Stop Existing Containers
# ============================================
echo -e "${YELLOW}🛑 STEP 3: Stopping existing containers...${NC}"

# Check if docker compose is available
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose tidak ditemukan!${NC}"
    exit 1
fi

$DOCKER_COMPOSE down 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# ============================================
# STEP 4: Build and Start Services
# ============================================
echo -e "${YELLOW}🐳 STEP 4: Building and starting Docker services...${NC}"

echo "Building frontend, backend, database, and cloudflare tunnel..."
$DOCKER_COMPOSE up -d --build 2>&1 || {
    echo -e "${RED}❌ Docker compose up failed!${NC}"
    echo "Checking logs..."
    $DOCKER_COMPOSE logs --tail=50
    exit 1
}

echo -e "${GREEN}✅ Services started${NC}"
echo ""

# ============================================
# STEP 5: Wait for Services
# ============================================
echo -e "${YELLOW}⏳ STEP 5: Waiting for services to be ready...${NC}"
sleep 20

echo -e "${GREEN}✅ Services ready${NC}"
echo ""

# ============================================
# STEP 6: Check Service Status
# ============================================
echo -e "${YELLOW}📊 STEP 6: Service status:${NC}"
$DOCKER_COMPOSE ps

echo ""

# ============================================
# STEP 7: Setup Firewall
# ============================================
echo -e "${YELLOW}🔥 STEP 7: Setting up firewall...${NC}"

if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp 2>/dev/null || true
    sudo ufw allow 443/tcp 2>/dev/null || true
    sudo ufw allow 22/tcp 2>/dev/null || true
    echo -e "${GREEN}✅ Firewall configured (ufw)${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
    sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
    sudo firewall-cmd --permanent --add-port=22/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✅ Firewall configured (firewalld)${NC}"
else
    echo -e "${YELLOW}⚠️  Firewall tool tidak ditemukan${NC}"
fi

echo ""

# ============================================
# STEP 8: Start Cloudflare Tunnel
# ============================================
echo -e "${YELLOW}☁️  STEP 8: Starting Cloudflare tunnel...${NC}"

if [ -f .env ] && grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env 2>/dev/null; then
    $DOCKER_COMPOSE --profile cloudflare up -d cloudflared 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Cloudflare tunnel start failed (mungkin sudah running)${NC}"
    }
    echo -e "${GREEN}✅ Cloudflare tunnel started${NC}"
else
    echo -e "${YELLOW}ℹ️  Cloudflare tunnel tidak dikonfigurasi${NC}"
    echo "   Tambahkan CLOUDFLARE_TUNNEL_TOKEN di .env untuk mengaktifkan"
fi

echo ""

# ============================================
# STEP 9: Health Check
# ============================================
echo -e "${YELLOW}🏥 STEP 9: Health check...${NC}"

sleep 5

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}' || echo "192.168.0.102")

echo "Testing endpoints..."
if curl -f http://localhost/api/health &>/dev/null || curl -f http://$IP_ADDRESS/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Backend health check OK${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (mungkin masih starting)${NC}"
fi

if curl -f http://localhost &>/dev/null || curl -f http://$IP_ADDRESS &>/dev/null; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (mungkin masih starting)${NC}"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}=========================================="
echo -e "🎉 Deployment selesai!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}📋 Informasi Akses:${NC}"
echo -e "  - VPS IP: ${YELLOW}$IP_ADDRESS${NC}"
echo -e "  - Frontend: ${YELLOW}http://$IP_ADDRESS${NC}"
echo -e "  - Backend API: ${YELLOW}http://$IP_ADDRESS/api${NC}"
echo -e "  - Health Check: ${YELLOW}http://$IP_ADDRESS/api/health${NC}"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "  - View logs: $DOCKER_COMPOSE logs -f"
echo "  - Restart: $DOCKER_COMPOSE restart"
echo "  - Stop: $DOCKER_COMPOSE down"
echo "  - Status: $DOCKER_COMPOSE ps"
echo ""

