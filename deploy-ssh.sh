#!/bin/bash

# Script untuk deploy Warungin ke server via SSH
# Usage: bash deploy-ssh.sh

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
SSH_KEY=""  # Path to SSH key (optional, for passwordless login)
REMOTE_DIR="/home/warungin/Warungin"
GITHUB_REPO="https://github.com/faiznutes/Warungin.git"

echo -e "${BLUE}🚀 Deploy Warungin ke Server via SSH${NC}"
echo ""
echo -e "${YELLOW}Server: $SSH_USER@$SSH_HOST${NC}"
echo -e "${YELLOW}Remote Directory: $REMOTE_DIR${NC}"
echo ""

# Check if sshpass is installed (for password authentication)
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak terinstall${NC}"
    echo -e "${YELLOW}Install dengan:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  Mac: brew install sshpass"
    echo ""
    echo -e "${YELLOW}Atau setup SSH key untuk passwordless login${NC}"
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
    
    if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
        # Use SSH key
        ssh -i "$SSH_KEY" $SSH_OPTS "$SSH_USER@$SSH_HOST" "$@"
    elif [ "$USE_SSHPASS" = true ]; then
        # Use password with sshpass
        sshpass -p "$SSH_PASSWORD" ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "$@"
    else
        # Manual password entry
        ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "$@"
    fi
}

# Function to run SCP command
scp_cmd() {
    local SCP_OPTS="-o StrictHostKeyChecking=no -P $SSH_PORT"
    
    if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
        # Use SSH key
        scp -i "$SSH_KEY" $SCP_OPTS "$@"
    elif [ "$USE_SSHPASS" = true ]; then
        # Use password with sshpass
        sshpass -p "$SSH_PASSWORD" scp $SCP_OPTS "$@"
    else
        # Manual password entry
        scp $SCP_OPTS "$@"
    fi
}

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ssh_cmd "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed!${NC}"
    echo -e "${YELLOW}Pastikan:${NC}"
    echo "  1. Server $SSH_HOST dapat diakses"
    echo "  2. User $SSH_USER ada di server"
    echo "  3. Password benar"
    echo "  4. SSH service running di server"
    exit 1
fi

# Check if Docker is installed on server
echo -e "${YELLOW}🔍 Checking Docker on server...${NC}"
if ssh_cmd "command -v docker &> /dev/null"; then
    echo -e "${GREEN}✅ Docker installed${NC}"
    DOCKER_VERSION=$(ssh_cmd "docker --version")
    echo -e "${YELLOW}  $DOCKER_VERSION${NC}"
else
    echo -e "${RED}❌ Docker tidak terinstall di server!${NC}"
    echo -e "${YELLOW}Install Docker dengan:${NC}"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ssh_cmd "command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null"; then
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose tidak terinstall${NC}"
    echo -e "${YELLOW}Install dengan: sudo apt-get install docker-compose-plugin${NC}"
fi

# Clone or update repository
echo ""
echo -e "${YELLOW}📦 Setting up repository on server...${NC}"
if ssh_cmd "[ -d '$REMOTE_DIR' ]"; then
    echo -e "${YELLOW}Repository sudah ada, updating...${NC}"
    ssh_cmd "cd $REMOTE_DIR && git pull origin main || git pull origin master" || {
        echo -e "${YELLOW}⚠️  Git pull failed, trying fresh clone...${NC}"
        ssh_cmd "rm -rf $REMOTE_DIR"
        ssh_cmd "git clone $GITHUB_REPO $REMOTE_DIR"
    }
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    ssh_cmd "git clone $GITHUB_REPO $REMOTE_DIR" || {
        echo -e "${RED}❌ Git clone failed!${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✅ Repository ready${NC}"

# Copy .env file if it doesn't exist
echo ""
echo -e "${YELLOW}📝 Setting up environment...${NC}"
if ssh_cmd "[ ! -f '$REMOTE_DIR/.env' ]"; then
    echo -e "${YELLOW}Creating .env from env.example...${NC}"
    ssh_cmd "cd $REMOTE_DIR && cp env.example .env"
    echo -e "${YELLOW}⚠️  PENTING: Edit .env file di server dengan konfigurasi yang benar!${NC}"
    echo -e "${YELLOW}Jalankan: ssh $SSH_USER@$SSH_HOST 'nano $REMOTE_DIR/.env'${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Deploy with Docker
echo ""
echo -e "${YELLOW}🐳 Deploying with Docker...${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose down" 2>/dev/null || true
ssh_cmd "cd $REMOTE_DIR && docker compose pull" 2>/dev/null || true
ssh_cmd "cd $REMOTE_DIR && docker compose up -d --build"

# Wait for services to start
echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
ssh_cmd "cd $REMOTE_DIR && docker compose ps"

# Check health
echo ""
echo -e "${YELLOW}🏥 Checking health...${NC}"
sleep 5

# Check backend health
BACKEND_HEALTH=$(ssh_cmd "curl -s http://localhost:3000/health || curl -s http://localhost/api/health || echo 'not ready'")
if [[ "$BACKEND_HEALTH" != "not ready" ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (might still be starting)${NC}"
fi

# Check frontend
FRONTEND_CHECK=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost || echo '000'")
if [[ "$FRONTEND_CHECK" == "200" ]]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (might still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment selesai!${NC}"
echo ""
echo -e "${BLUE}📋 Informasi:${NC}"
echo -e "  Server: $SSH_USER@$SSH_HOST"
echo -e "  Directory: $REMOTE_DIR"
echo -e "  Frontend: http://$SSH_HOST"
echo -e "  Backend API: http://$SSH_HOST/api"
echo ""
echo -e "${YELLOW}📝 Perintah berguna:${NC}"
echo "  # View logs"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""
echo "  # Restart services"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose restart'"
echo ""
echo "  # Stop services"
echo "  ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose down'"
echo ""
echo "  # Edit .env"
echo "  ssh $SSH_USER@$SSH_HOST 'nano $REMOTE_DIR/.env'"
echo ""

