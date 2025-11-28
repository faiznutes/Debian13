#!/bin/bash

# Script untuk verify struktur file yang diperlukan untuk Docker deployment

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying Docker Deployment Structure${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check required files
check_file() {
    if [ -f "$1" ] || [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - MISSING${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_optional() {
    if [ -f "$1" ] || [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${YELLOW}⚠️  $1 - Optional (akan dibuat otomatis)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo -e "${YELLOW}📋 Checking Required Files...${NC}"
echo ""

# Root files
echo "Root Files:"
check_file "docker-compose.yml"
check_file "Dockerfile.backend"
check_file "env.example"
check_file ".gitignore"
check_file ".dockerignore"
check_file "README.md"
check_file "deploy-vps.sh"
echo ""

# Backend
echo "Backend:"
check_file "src"
check_file "package.json"
check_file "tsconfig.json"
check_file "prisma"
check_file "scripts/docker-startup.sh"
check_file "scripts/create-super-admin-docker.js"
echo ""

# Frontend
echo "Frontend:"
check_file "client"
check_file "client/Dockerfile"
check_file "client/package.json"
check_file "client/nginx.conf"
check_file "client/src"
echo ""

# Nginx
echo "Nginx:"
check_file "nginx/conf.d/default.conf"
check_file "nginx/nginx.conf"
check_optional "nginx/ssl"
check_optional "nginx/logs"
echo ""

# Logs
echo "Logs:"
check_optional "logs"
echo ""

# Summary
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Semua file wajib sudah ada!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS file optional belum ada (akan dibuat otomatis)${NC}"
    fi
    echo ""
    echo -e "${GREEN}🎉 Struktur siap untuk Docker deployment!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS file wajib masih missing!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS file optional belum ada${NC}"
    fi
    echo ""
    echo -e "${YELLOW}📝 Langkah selanjutnya:${NC}"
    echo "  1. Copy file dari project asli (F:/Backup W11/Warungin)"
    echo "  2. Pastikan semua file wajib sudah ada"
    echo "  3. Jalankan script ini lagi untuk verify"
    exit 1
fi

