#!/bin/bash

# Script untuk push perbaikan network timeout ke GitHub
# Usage: bash push-fix-network-timeout.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Push Perbaikan Network Timeout ke GitHub${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git tidak terinstall!${NC}"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Bukan git repository!${NC}"
    exit 1
fi

# Check remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}❌ Remote belum di-setup!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Remote: $REMOTE_URL${NC}"

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

if [ -z "$BRANCH" ]; then
    BRANCH="main"
fi

echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo ""

# Add files yang diubah
echo -e "${YELLOW}📝 Adding files...${NC}"
git add Dockerfile.backend
git add client/Dockerfile
git add update-docker.sh
git add build-docker-retry.sh
git add DOCKER_NETWORK_TIMEOUT_FIX.md
git add UPDATE_DOCKER.md

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ Semua file sudah up-to-date${NC}"
    exit 0
fi

# Show what will be committed
echo -e "${YELLOW}📋 Files to be committed:${NC}"
git status --short
echo ""

# Commit
echo -e "${YELLOW}💾 Creating commit...${NC}"
COMMIT_MSG="Fix: Docker network timeout issue - Add npm retry logic and timeout configuration

- Add npm config for longer timeout (5 minutes) and retry mechanism
- Add retry logic for npm install and npx prisma generate
- Update Dockerfile.backend and client/Dockerfile with network handling
- Add build-docker-retry.sh script for build with retry
- Add update-docker.sh with retry logic for VPS deployment
- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md"

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
    echo -e "${YELLOW}Solusi:${NC}"
    echo "  1. Setup Personal Access Token di GitHub"
    echo "  2. Atau setup SSH key"
    echo ""
    exit 1
}

echo ""
echo -e "${GREEN}✅ Push berhasil!${NC}"
echo ""
echo -e "${BLUE}🎉 Perbaikan network timeout sudah di-push ke GitHub!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Pull di VPS: ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && git pull origin main'"
echo "  2. Update Docker: bash update-docker.sh"
echo ""

