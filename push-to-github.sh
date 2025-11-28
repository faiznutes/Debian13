#!/bin/bash

# Script untuk push semua file ke GitHub
# Usage: bash push-to-github.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Push Warungin ke GitHub${NC}"
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

# Add all files
echo -e "${YELLOW}📝 Adding files...${NC}"
git add .

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
        git commit -m "Initial commit: Warungin POS System with Docker deployment" || {
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
            echo "  2. Repository belum dibuat di GitHub"
            echo "  3. Network/connection issue"
            echo ""
            echo -e "${YELLOW}Solusi:${NC}"
            echo "  1. Buat repository di GitHub terlebih dahulu"
            echo "  2. Setup authentication dengan Personal Access Token"
            echo "  3. Atau gunakan SSH key"
            echo ""
            echo -e "${YELLOW}Untuk setup authentication, buat Personal Access Token:${NC}"
            echo "  https://github.com/settings/tokens"
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

