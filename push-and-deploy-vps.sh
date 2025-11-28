#!/bin/bash

# Script untuk push ke GitHub dan deploy ke VPS Warungin
# Usage: bash push-and-deploy-vps.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_HOST="warungin@192.168.0.102"
SSH_PASSWORD="123"
PROJECT_DIR="/home/warungin/Warungin"

echo -e "${BLUE}=========================================="
echo -e "🚀 Push ke GitHub & Deploy ke VPS"
echo -e "==========================================${NC}"
echo ""

# ============================================
# STEP 1: Push ke GitHub
# ============================================
echo -e "${YELLOW}📦 STEP 1: Push ke GitHub${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git tidak terinstall!${NC}"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing Git repository...${NC}"
    git init
    
    # Ask for remote URL
    echo -e "${YELLOW}Masukkan URL GitHub repository:${NC}"
    echo "Contoh: https://github.com/username/Warungin.git"
    read -p "URL: " GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        echo -e "${RED}❌ URL tidak boleh kosong!${NC}"
        exit 1
    fi
    
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
fi

# Check remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo -e "${YELLOW}Remote belum di-setup${NC}"
    echo -e "${YELLOW}Masukkan URL GitHub repository:${NC}"
    read -p "URL: " GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        echo -e "${RED}❌ URL tidak boleh kosong!${NC}"
        exit 1
    fi
    
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Remote added${NC}"
else
    echo -e "${GREEN}✅ Remote: $REMOTE_URL${NC}"
fi

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -z "$BRANCH" ]; then
    # Try to checkout main or master
    if git show-ref --verify --quiet refs/heads/main; then
        git checkout main
        BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        git checkout master
        BRANCH="master"
    else
        git checkout -b main
        BRANCH="main"
    fi
fi

echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo ""

# Add only essential files: frontend, backend, database, and cloudflare config
echo -e "${YELLOW}📝 Adding essential files (frontend, backend, database, cloudflare)...${NC}"

# Frontend
if [ -d "client" ]; then
    git add client/
    echo "  ✅ Frontend (client/)"
fi

# Backend
if [ -d "src" ]; then
    git add src/
    echo "  ✅ Backend (src/)"
fi

# Package files
[ -f "package.json" ] && git add package.json && echo "  ✅ package.json"
[ -f "package-lock.json" ] && git add package-lock.json && echo "  ✅ package-lock.json"
[ -f "tsconfig.json" ] && git add tsconfig.json && echo "  ✅ tsconfig.json"

# Database
if [ -d "prisma" ]; then
    git add prisma/
    echo "  ✅ Database (prisma/)"
fi

# Docker configuration
[ -f "docker-compose.yml" ] && git add docker-compose.yml && echo "  ✅ docker-compose.yml"
[ -f "Dockerfile.backend" ] && git add Dockerfile.backend && echo "  ✅ Dockerfile.backend"
[ -f ".dockerignore" ] && git add .dockerignore && echo "  ✅ .dockerignore"

# Nginx configuration
if [ -d "nginx" ]; then
    git add nginx/
    echo "  ✅ Nginx config (nginx/)"
fi

# Cloudflare tunnel configuration (env.example contains CLOUDFLARE_TUNNEL_TOKEN)
[ -f "env.example" ] && git add env.example && echo "  ✅ env.example (Cloudflare config)"

# Scripts needed for deployment
[ -f "scripts/docker-startup.sh" ] && git add scripts/docker-startup.sh && echo "  ✅ docker-startup.sh"
[ -f "scripts/create-super-admin-docker.js" ] && git add scripts/create-super-admin-docker.js && echo "  ✅ create-super-admin-docker.js"

# Deployment script itself
git add push-and-deploy-vps.sh && echo "  ✅ push-and-deploy-vps.sh"

echo ""

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Tidak ada perubahan untuk di-commit${NC}"
    echo -e "${YELLOW}Melanjutkan ke deployment...${NC}"
else
    # Show what will be committed
    echo -e "${YELLOW}📋 Files to be committed:${NC}"
    git status --short
    
    echo ""
    read -p "Commit dan push sekarang? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Commit
        echo -e "${YELLOW}💾 Creating commit...${NC}"
        git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')" || {
            echo -e "${RED}❌ Commit failed!${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ Commit created${NC}"
        
        # Push
        echo ""
        echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
        git push -u origin "$BRANCH" || {
            echo ""
            echo -e "${RED}❌ Push gagal!${NC}"
            echo ""
            echo -e "${YELLOW}Kemungkinan penyebab:${NC}"
            echo "  1. Authentication belum di-setup"
            echo "  2. Network/connection issue"
            echo ""
            exit 1
        }
        
        echo -e "${GREEN}✅ Push berhasil!${NC}"
    else
        echo -e "${YELLOW}Dibatalkan. Melanjutkan ke deployment...${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ STEP 1 selesai${NC}"
echo ""

# ============================================
# STEP 2: Deploy ke VPS
# ============================================
echo -e "${YELLOW}🚀 STEP 2: Deploy ke VPS${NC}"
echo ""

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak ditemukan. Install dengan:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo ""
    echo -e "${YELLOW}Menggunakan SSH interaktif...${NC}"
    SSH_CMD="ssh"
    SSH_OPTS="-o StrictHostKeyChecking=no"
else
    SSH_CMD="sshpass"
    SSH_OPTS="-p \"$SSH_PASSWORD\" ssh -o StrictHostKeyChecking=no"
fi

# Test connection
echo -e "${YELLOW}🔌 Testing SSH connection...${NC}"
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$SSH_HOST" "echo 'Connection OK'" 2>/dev/null || {
        echo -e "${RED}❌ Tidak bisa connect ke VPS!${NC}"
        echo -e "${YELLOW}Pastikan:${NC}"
        echo "  1. VPS sudah menyala"
        echo "  2. IP address benar: 192.168.0.102"
        echo "  3. SSH service berjalan di VPS"
        echo "  4. Network terhubung"
        exit 1
    }
else
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$SSH_HOST" "echo 'Connection OK'" 2>/dev/null || {
        echo -e "${RED}❌ Tidak bisa connect ke VPS!${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✅ SSH connection OK${NC}"
echo ""

# Deploy commands
echo -e "${YELLOW}📥 Pulling latest code dari GitHub...${NC}"
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR || {
            echo "❌ Directory tidak ditemukan: $PROJECT_DIR"
            echo "Membuat directory..."
            mkdir -p $PROJECT_DIR
            cd $PROJECT_DIR
            git clone $REMOTE_URL . || {
                echo "❌ Clone gagal!"
                exit 1
            }
        }
        
        echo "📥 Pulling latest changes..."
        git pull origin $BRANCH || {
            echo "⚠️  Pull gagal, mungkin sudah up-to-date"
        }
        
        echo "✅ Code updated"
EOF
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR || {
            echo "❌ Directory tidak ditemukan: $PROJECT_DIR"
            echo "Membuat directory..."
            mkdir -p $PROJECT_DIR
            cd $PROJECT_DIR
            git clone $REMOTE_URL . || {
                echo "❌ Clone gagal!"
                exit 1
            }
        }
        
        echo "📥 Pulling latest changes..."
        git pull origin $BRANCH || {
            echo "⚠️  Pull gagal, mungkin sudah up-to-date"
        }
        
        echo "✅ Code updated"
EOF
fi

echo ""
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR
        
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
        \$DOCKER_COMPOSE down 2>/dev/null || true
        
        echo "🔨 Building and starting services..."
        \$DOCKER_COMPOSE up -d --build
        
        echo "⏳ Waiting for services to start..."
        sleep 15
        
        echo "📊 Service status:"
        \$DOCKER_COMPOSE ps
        
        echo ""
        echo "✅ Docker services started"
EOF
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR
        
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
        \$DOCKER_COMPOSE down 2>/dev/null || true
        
        echo "🔨 Building and starting services..."
        \$DOCKER_COMPOSE up -d --build
        
        echo "⏳ Waiting for services to start..."
        sleep 15
        
        echo "📊 Service status:"
        \$DOCKER_COMPOSE ps
        
        echo ""
        echo "✅ Docker services started"
EOF
fi

echo ""
echo -e "${YELLOW}🌐 Setting up public access...${NC}"
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR
        
        # Check firewall status
        echo "🔥 Checking firewall..."
        if command -v ufw &> /dev/null; then
            echo "Opening ports 80 and 443..."
            sudo ufw allow 80/tcp 2>/dev/null || true
            sudo ufw allow 443/tcp 2>/dev/null || true
            sudo ufw allow 22/tcp 2>/dev/null || true
            echo "✅ Firewall configured"
        elif command -v firewall-cmd &> /dev/null; then
            echo "Opening ports 80 and 443..."
            sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
            sudo firewall-cmd --reload 2>/dev/null || true
            echo "✅ Firewall configured"
        else
            echo "⚠️  Firewall tool tidak ditemukan, pastikan port 80 dan 443 terbuka"
        fi
        
        # Start Cloudflare tunnel if configured
        if [ -f .env ] && grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env 2>/dev/null; then
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
        IP_ADDRESS=\$(hostname -I | awk '{print \$1}' || echo "192.168.0.102")
        echo ""
        echo "📋 Access Information:"
        echo "  - Local IP: \$IP_ADDRESS"
        echo "  - Frontend: http://\$IP_ADDRESS"
        echo "  - Backend API: http://\$IP_ADDRESS/api"
        echo "  - Health Check: http://\$IP_ADDRESS/api/health"
EOF
else
    ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
        cd $PROJECT_DIR
        
        # Check firewall status
        echo "🔥 Checking firewall..."
        if command -v ufw &> /dev/null; then
            echo "Opening ports 80 and 443..."
            sudo ufw allow 80/tcp 2>/dev/null || true
            sudo ufw allow 443/tcp 2>/dev/null || true
            sudo ufw allow 22/tcp 2>/dev/null || true
            echo "✅ Firewall configured"
        elif command -v firewall-cmd &> /dev/null; then
            echo "Opening ports 80 and 443..."
            sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
            sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
            sudo firewall-cmd --reload 2>/dev/null || true
            echo "✅ Firewall configured"
        else
            echo "⚠️  Firewall tool tidak ditemukan, pastikan port 80 dan 443 terbuka"
        fi
        
        # Start Cloudflare tunnel if configured
        if [ -f .env ] && grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env 2>/dev/null; then
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
        IP_ADDRESS=\$(hostname -I | awk '{print \$1}' || echo "192.168.0.102")
        echo ""
        echo "📋 Access Information:"
        echo "  - Local IP: \$IP_ADDRESS"
        echo "  - Frontend: http://\$IP_ADDRESS"
        echo "  - Backend API: http://\$IP_ADDRESS/api"
        echo "  - Health Check: http://\$IP_ADDRESS/api/health"
EOF
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
echo "  1. Untuk akses dari luar jaringan lokal, pastikan:"
echo "     - Port forwarding di router (80, 443) ke 192.168.0.102"
echo "     - Atau gunakan Cloudflare Tunnel (jika dikonfigurasi)"
echo "  2. Untuk melihat logs:"
echo "     ssh $SSH_HOST 'cd $PROJECT_DIR && docker compose logs -f'"
echo "  3. Untuk restart services:"
echo "     ssh $SSH_HOST 'cd $PROJECT_DIR && docker compose restart'"
echo ""

