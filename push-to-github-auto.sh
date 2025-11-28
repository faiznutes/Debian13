#!/bin/bash

# Script untuk push semua file ke GitHub (Auto, tanpa konfirmasi)
# Usage: bash push-to-github-auto.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Push Warungin ke GitHub (Auto)${NC}"
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
    echo -e "${RED}❌ Remote belum di-setup!${NC}"
    echo -e "${YELLOW}Jalankan: git remote add origin <URL_GITHUB_REPO>${NC}"
    exit 1
fi

# Check remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}❌ Remote belum di-setup!${NC}"
    echo -e "${YELLOW}Jalankan: git remote add origin <URL_GITHUB_REPO>${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Remote: $REMOTE_URL${NC}"

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -z "$BRANCH" ]; then
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

# Add all files
echo -e "${YELLOW}📝 Adding files...${NC}"
git add .

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ Semua file sudah up-to-date, tidak ada perubahan${NC}"
    echo ""
    
    # Check if already pushed
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    
    if [ -z "$REMOTE" ]; then
        echo -e "${YELLOW}⚠️  Belum ada remote tracking branch${NC}"
        echo -e "${YELLOW}Mencoba push...${NC}"
        git push -u origin "$BRANCH" || {
            echo -e "${RED}❌ Push gagal!${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ Push berhasil!${NC}"
    elif [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✅ Semua sudah ter-push ke GitHub!${NC}"
    else
        echo -e "${YELLOW}⚠️  Ada perubahan di remote, pull dulu?${NC}"
    fi
else
    # Show what will be committed
    echo -e "${YELLOW}📋 Files to be committed:${NC}"
    git status --short
    echo ""
    
    # Commit
    echo -e "${YELLOW}💾 Creating commit...${NC}"
    
    # Check if this is initial commit
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        COMMIT_MSG="Initial commit: Warungin POS System with Docker deployment"
    else
        # Check if this is network timeout fix
        if git diff --cached --name-only | grep -q "Dockerfile\|update-docker\|build-docker-retry\|DOCKER_NETWORK_TIMEOUT"; then
            COMMIT_MSG="Fix: Docker network timeout issue - Add npm retry logic and timeout configuration

- Add npm config for longer timeout (5 minutes) and retry mechanism
- Add retry logic for npm install and npx prisma generate
- Update Dockerfile.backend and client/Dockerfile with network handling
- Add build-docker-retry.sh script for build with retry
- Add update-docker.sh with retry logic for VPS deployment
- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md"
        else
            COMMIT_MSG="Update: Clean repository structure for Docker deployment"
        fi
    fi
    
    git commit -m "$COMMIT_MSG" || {
        echo -e "${RED}❌ Commit failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Commit created: $COMMIT_MSG${NC}"
    
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
        echo -e "${YELLOW}Solusi:${NC}"
        echo "  1. Setup Personal Access Token di GitHub"
        echo "  2. Atau setup SSH key"
        echo ""
        echo -e "${YELLOW}Personal Access Token:${NC}"
        echo "  https://github.com/settings/tokens"
        echo ""
        exit 1
    }
    
    echo -e "${GREEN}✅ Push berhasil!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Semua file sudah di-push ke GitHub!${NC}"
fi

echo ""
echo -e "${BLUE}📊 Repository Info:${NC}"
echo -e "  Remote: $REMOTE_URL"
echo -e "  Branch: $BRANCH"
echo ""

