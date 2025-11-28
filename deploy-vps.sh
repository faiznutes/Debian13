#!/bin/bash

# Script untuk deploy Warungin ke VPS
# Usage: bash deploy-vps.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Warungin VPS Deployment Script${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  File .env tidak ditemukan!${NC}"
    echo -e "${YELLOW}Membuat .env dari env.example...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ File .env dibuat${NC}"
        echo -e "${RED}⚠️  PENTING: Edit file .env dan konfigurasi sebelum melanjutkan!${NC}"
        echo ""
        read -p "Sudah mengedit .env? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Silakan edit .env terlebih dahulu, lalu jalankan script ini lagi${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ File env.example tidak ditemukan!${NC}"
        exit 1
    fi
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker tidak terinstall!${NC}"
    echo -e "${YELLOW}Install Docker dengan:${NC}"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose tidak terinstall!${NC}"
    exit 1
fi

# Use docker compose or docker-compose
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✅ Docker terdeteksi${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}🛑 Menghentikan container yang berjalan...${NC}"
$DOCKER_COMPOSE down 2>/dev/null || true

# Pull latest images (if needed)
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
$DOCKER_COMPOSE pull postgres redis nginx 2>/dev/null || true

# Build and start services
echo -e "${YELLOW}🔨 Building dan starting services...${NC}"
$DOCKER_COMPOSE up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Menunggu services siap...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${YELLOW}📊 Status Services:${NC}"
$DOCKER_COMPOSE ps

# Check health
echo ""
echo -e "${YELLOW}🏥 Checking health...${NC}"
sleep 5

# Check backend health
if curl -f http://localhost:3000/health &>/dev/null || curl -f http://localhost/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (might still be starting)${NC}"
fi

# Check frontend
if curl -f http://localhost &>/dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (might still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment selesai!${NC}"
echo ""
echo -e "${BLUE}📋 Informasi:${NC}"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  - Backend API: http://$(hostname -I | awk '{print $1}')/api"
echo "  - Health Check: http://$(hostname -I | awk '{print $1}')/api/health"
echo ""
echo -e "${YELLOW}📝 Perintah berguna:${NC}"
echo "  - View logs: $DOCKER_COMPOSE logs -f"
echo "  - Stop: $DOCKER_COMPOSE down"
echo "  - Restart: $DOCKER_COMPOSE restart"
echo "  - Status: $DOCKER_COMPOSE ps"
echo ""
echo -e "${RED}⚠️  PENTING:${NC}"
echo "  1. Pastikan firewall sudah dikonfigurasi (buka port 80, 443)"
echo "  2. Setup SSL certificate untuk HTTPS"
echo "  3. Ganti password default super admin setelah login pertama"
echo "  4. Setup automatic backup untuk database"
echo ""

