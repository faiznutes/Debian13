#!/bin/bash

# Script untuk push ke GitHub saja (tanpa deploy ke VPS)
# Usage: bash push-to-github-only.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo -e "📦 Push ke GitHub (Frontend, Backend, Database)"
echo -e "==========================================${NC}"
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

echo ""

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Tidak ada perubahan untuk di-commit${NC}"
    echo -e "${YELLOW}Semua file sudah up-to-date${NC}"
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
        COMMIT_MSG="Update: Frontend, Backend, Database, Cloudflare config - $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$COMMIT_MSG" || {
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
        echo ""
        echo -e "${BLUE}🎉 Semua file sudah di-push ke GitHub!${NC}"
        echo ""
        echo -e "${YELLOW}Repository: $REMOTE_URL${NC}"
        echo -e "${YELLOW}Branch: $BRANCH${NC}"
    else
        echo -e "${YELLOW}Dibatalkan. File sudah di-add, commit manual dengan:${NC}"
        echo "  git commit -m 'Your commit message'"
        echo "  git push -u origin $BRANCH"
    fi
fi

echo ""

