#!/bin/bash

# Script untuk deploy langsung ke VPS Warungin
# Usage: bash deploy-vps-now.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_HOST="warungin@192.168.0.102"
SSH_PASSWORD="123"
PROJECT_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"
BRANCH="main"

echo -e "${BLUE}=========================================="
echo -e "🚀 Deploy Warungin ke VPS"
echo -e "==========================================${NC}"
echo ""

# ============================================
# STEP 1: Test SSH Connection
# ============================================
echo -e "${YELLOW}🔌 STEP 1: Testing SSH connection...${NC}"

if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak ditemukan. Install dengan:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo ""
    echo -e "${YELLOW}Menggunakan SSH interaktif...${NC}"
    USE_SSHPASS=false
else
    USE_SSHPASS=true
fi

# Test connection
if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" "echo 'Connection OK'" 2>&1 || {
        echo -e "${RED}❌ Tidak bisa connect ke VPS!${NC}"
        echo -e "${YELLOW}Pastikan:${NC}"
        echo "  1. VPS sudah menyala"
        echo "  2. IP address benar: 192.168.0.102"
        echo "  3. SSH service berjalan di VPS"
        echo "  4. Network terhubung"
        exit 1
    }
else
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" "echo 'Connection OK'" 2>&1 || {
        echo -e "${RED}❌ Tidak bisa connect ke VPS!${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✅ SSH connection OK${NC}"
echo ""

# ============================================
# STEP 2: Setup atau Update Code di VPS
# ============================================
echo -e "${YELLOW}📥 STEP 2: Setting up/updating code di VPS...${NC}"

if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        PROJECT_DIR="/home/warungin/Warungin"
        GITHUB_REPO="https://github.com/faiznutes/Warungin.git"
        BRANCH="main"
        
        # Create directory if not exists
        mkdir -p "$PROJECT_DIR"
        cd "$PROJECT_DIR" || exit 1
        
        # Check if git repo exists
        if [ ! -d ".git" ]; then
            echo "📦 Cloning repository..."
            git clone "$GITHUB_REPO" . || {
                echo "❌ Clone gagal!"
                exit 1
            }
            git checkout "$BRANCH" 2>/dev/null || true
            echo "✅ Repository cloned"
        else
            echo "📥 Pulling latest changes..."
            git fetch origin 2>&1 || echo "⚠️  Fetch warning (mungkin sudah up-to-date)"
            git pull origin "$BRANCH" 2>&1 || {
                echo "⚠️  Pull gagal, mencoba reset..."
                git reset --hard origin/"$BRANCH" 2>&1 || echo "⚠️  Reset warning"
            }
            echo "✅ Code updated"
        fi
        
        # Show current commit
        echo ""
        echo "📋 Current commit:"
        git log --oneline -1 || echo "No commits yet"
ENDSSH
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        PROJECT_DIR="/home/warungin/Warungin"
        GITHUB_REPO="https://github.com/faiznutes/Warungin.git"
        BRANCH="main"
        
        # Create directory if not exists
        mkdir -p "$PROJECT_DIR"
        cd "$PROJECT_DIR" || exit 1
        
        # Check if git repo exists
        if [ ! -d ".git" ]; then
            echo "📦 Cloning repository..."
            git clone "$GITHUB_REPO" . || {
                echo "❌ Clone gagal!"
                exit 1
            }
            git checkout "$BRANCH" 2>/dev/null || true
            echo "✅ Repository cloned"
        else
            echo "📥 Pulling latest changes..."
            git fetch origin 2>&1 || echo "⚠️  Fetch warning (mungkin sudah up-to-date)"
            git pull origin "$BRANCH" 2>&1 || {
                echo "⚠️  Pull gagal, mencoba reset..."
                git reset --hard origin/"$BRANCH" 2>&1 || echo "⚠️  Reset warning"
            }
            echo "✅ Code updated"
        fi
        
        # Show current commit
        echo ""
        echo "📋 Current commit:"
        git log --oneline -1 || echo "No commits yet"
ENDSSH
fi

echo ""
echo -e "${GREEN}✅ STEP 2 selesai${NC}"
echo ""

# ============================================
# STEP 3: Start Docker Services
# ============================================
echo -e "${YELLOW}🐳 STEP 3: Starting Docker services...${NC}"

if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        cd /home/warungin/Warungin
        
        # Check if docker compose is available
        if command -v docker compose &> /dev/null; then
            DOCKER_COMPOSE="docker compose"
        elif command -v docker-compose &> /dev/null; then
            DOCKER_COMPOSE="docker-compose"
        else
            echo "❌ Docker Compose tidak ditemukan!"
            echo "Install dengan: sudo apt-get install docker-compose-plugin"
            exit 1
        fi
        
        echo "🛑 Stopping existing containers..."
        $DOCKER_COMPOSE down 2>/dev/null || true
        
        echo "🔨 Building and starting services..."
        $DOCKER_COMPOSE up -d --build 2>&1 || {
            echo "❌ Docker compose up failed!"
            echo "Checking logs..."
            $DOCKER_COMPOSE logs --tail=50
            exit 1
        }
        
        echo "⏳ Waiting for services to start..."
        sleep 20
        
        echo ""
        echo "📊 Service status:"
        $DOCKER_COMPOSE ps
        
        echo ""
        echo "✅ Docker services started"
ENDSSH
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        cd /home/warungin/Warungin
        
        # Check if docker compose is available
        if command -v docker compose &> /dev/null; then
            DOCKER_COMPOSE="docker compose"
        elif command -v docker-compose &> /dev/null; then
            DOCKER_COMPOSE="docker-compose"
        else
            echo "❌ Docker Compose tidak ditemukan!"
            exit 1
        fi
        
        echo "🛑 Stopping existing containers..."
        $DOCKER_COMPOSE down 2>/dev/null || true
        
        echo "🔨 Building and starting services..."
        $DOCKER_COMPOSE up -d --build 2>&1 || {
            echo "❌ Docker compose up failed!"
            exit 1
        }
        
        echo "⏳ Waiting for services to start..."
        sleep 20
        
        echo ""
        echo "📊 Service status:"
        $DOCKER_COMPOSE ps
        
        echo ""
        echo "✅ Docker services started"
ENDSSH
fi

echo ""
echo -e "${GREEN}✅ STEP 3 selesai${NC}"
echo ""

# ============================================
# STEP 4: Setup Public Access
# ============================================
echo -e "${YELLOW}🌐 STEP 4: Setting up public access...${NC}"

if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        cd /home/warungin/Warungin
        
        # Check firewall status
        echo "🔥 Configuring firewall..."
        if command -v ufw &> /dev/null; then
            echo "Opening ports 80, 443, and 22..."
            sudo ufw allow 80/tcp 2>/dev/null || true
            sudo ufw allow 443/tcp 2>/dev/null || true
            sudo ufw allow 22/tcp 2>/dev/null || true
            echo "✅ Firewall configured (ufw)"
        elif command -v firewall-cmd &> /dev/null; then
            echo "Opening ports 80, 443, and 22..."
            sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=22/tcp 2>/dev/null || true
            sudo firewall-cmd --reload 2>/dev/null || true
            echo "✅ Firewall configured (firewalld)"
        else
            echo "⚠️  Firewall tool tidak ditemukan, pastikan port 80 dan 443 terbuka"
        fi
        
        # Start Cloudflare tunnel if configured
        if [ -f .env ] && grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env 2>/dev/null; then
            echo ""
            echo "☁️  Starting Cloudflare tunnel..."
            if command -v docker compose &> /dev/null; then
                docker compose --profile cloudflare up -d cloudflared 2>/dev/null || true
            elif command -v docker-compose &> /dev/null; then
                docker-compose --profile cloudflare up -d cloudflared 2>/dev/null || true
            fi
            echo "✅ Cloudflare tunnel started"
        else
            echo "ℹ️  Cloudflare tunnel tidak dikonfigurasi (opsional)"
            echo "   Untuk setup, tambahkan CLOUDFLARE_TUNNEL_TOKEN di .env"
        fi
        
        # Get IP address
        IP_ADDRESS=$(hostname -I | awk '{print $1}' || echo "192.168.0.102")
        echo ""
        echo "📋 Access Information:"
        echo "  - Local IP: $IP_ADDRESS"
        echo "  - Frontend: http://$IP_ADDRESS"
        echo "  - Backend API: http://$IP_ADDRESS/api"
        echo "  - Health Check: http://$IP_ADDRESS/api/health"
ENDSSH
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << 'ENDSSH'
        cd /home/warungin/Warungin
        
        # Check firewall status
        echo "🔥 Configuring firewall..."
        if command -v ufw &> /dev/null; then
            echo "Opening ports 80, 443, and 22..."
            sudo ufw allow 80/tcp 2>/dev/null || true
            sudo ufw allow 443/tcp 2>/dev/null || true
            sudo ufw allow 22/tcp 2>/dev/null || true
            echo "✅ Firewall configured (ufw)"
        elif command -v firewall-cmd &> /dev/null; then
            echo "Opening ports 80, 443, and 22..."
            sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=22/tcp 2>/dev/null || true
            sudo firewall-cmd --reload 2>/dev/null || true
            echo "✅ Firewall configured (firewalld)"
        else
            echo "⚠️  Firewall tool tidak ditemukan, pastikan port 80 dan 443 terbuka"
        fi
        
        # Start Cloudflare tunnel if configured
        if [ -f .env ] && grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env 2>/dev/null; then
            echo ""
            echo "☁️  Starting Cloudflare tunnel..."
            if command -v docker compose &> /dev/null; then
                docker compose --profile cloudflare up -d cloudflared 2>/dev/null || true
            elif command -v docker-compose &> /dev/null; then
                docker-compose --profile cloudflare up -d cloudflared 2>/dev/null || true
            fi
            echo "✅ Cloudflare tunnel started"
        else
            echo "ℹ️  Cloudflare tunnel tidak dikonfigurasi (opsional)"
        fi
        
        # Get IP address
        IP_ADDRESS=$(hostname -I | awk '{print $1}' || echo "192.168.0.102")
        echo ""
        echo "📋 Access Information:"
        echo "  - Local IP: $IP_ADDRESS"
        echo "  - Frontend: http://$IP_ADDRESS"
        echo "  - Backend API: http://$IP_ADDRESS/api"
        echo "  - Health Check: http://$IP_ADDRESS/api/health"
ENDSSH
fi

echo ""
echo -e "${GREEN}=========================================="
echo -e "🎉 Deployment selesai!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}📋 Informasi Akses:${NC}"
echo -e "  - VPS IP: ${YELLOW}192.168.0.102${NC}"
echo -e "  - Frontend: ${YELLOW}http://192.168.0.102${NC}"
echo -e "  - Backend API: ${YELLOW}http://192.168.0.102/api${NC}"
echo -e "  - Health Check: ${YELLOW}http://192.168.0.102/api/health${NC}"
echo ""
echo -e "${YELLOW}📝 Catatan:${NC}"
echo "  1. Untuk akses dari luar jaringan lokal:"
echo "     - Setup port forwarding di router (80, 443) ke 192.168.0.102"
echo "     - Atau gunakan Cloudflare Tunnel (jika dikonfigurasi)"
echo "  2. Untuk melihat logs:"
echo "     ssh $SSH_HOST 'cd $PROJECT_DIR && docker compose logs -f'"
echo "  3. Untuk restart services:"
echo "     ssh $SSH_HOST 'cd $PROJECT_DIR && docker compose restart'"
echo ""

