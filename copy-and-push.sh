#!/bin/bash

# Script untuk copy file dari project asli dan push ke GitHub
# Usage: bash copy-and-push.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Copy Files dari Project Asli dan Push ke GitHub${NC}"
echo ""

# Auto-detect source directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
DEST_DIR="."

# Try to find Warungin directory (sibling of Github folder)
SOURCE_DIR=""
POSSIBLE_PATHS=(
    "$PARENT_DIR/Warungin"
    "/mnt/f/Backup W11/Warungin"
    "/f/Backup W11/Warungin"
    "F:/Backup W11/Warungin"
    "F:\\Backup W11\\Warungin"
    "/c/Users/$(whoami)/Backup W11/Warungin"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    normalized_path=$(echo "$path" | sed 's|\\|/|g')
    if [ -d "$normalized_path" ] && [ -d "$normalized_path/src" ] && [ -d "$normalized_path/client" ]; then
        SOURCE_DIR="$normalized_path"
        break
    fi
done

# If still not found, try to find in common locations
if [ -z "$SOURCE_DIR" ] || [ ! -d "$SOURCE_DIR" ]; then
    # Try Windows path format
    if [ -d "/mnt/f/Backup W11/Warungin" ]; then
        SOURCE_DIR="/mnt/f/Backup W11/Warungin"
    elif [ -d "/f/Backup W11/Warungin" ]; then
        SOURCE_DIR="/f/Backup W11/Warungin"
    fi
fi

# Final check - ask user if still not found
if [ -z "$SOURCE_DIR" ] || [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Source directory tidak ditemukan secara otomatis${NC}"
    echo -e "${YELLOW}Current directory: $SCRIPT_DIR${NC}"
    echo -e "${YELLOW}Parent directory: $PARENT_DIR${NC}"
    echo ""
    echo -e "${YELLOW}Masukkan path lengkap ke folder Warungin:${NC}"
    echo "Contoh: F:/Backup W11/Warungin atau /mnt/f/Backup W11/Warungin"
    read -p "Path: " USER_PATH
    
    if [ -z "$USER_PATH" ]; then
        echo -e "${RED}❌ Path tidak boleh kosong!${NC}"
        exit 1
    fi
    
    SOURCE_DIR=$(echo "$USER_PATH" | sed 's|\\|/|g')
    
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}❌ Source directory tidak ditemukan: $SOURCE_DIR${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Source: $SOURCE_DIR${NC}"
echo -e "${GREEN}✅ Destination: $DEST_DIR${NC}"
echo ""

# Auto-confirm if source is valid
if [ ! -d "$SOURCE_DIR/src" ] || [ ! -d "$SOURCE_DIR/client" ]; then
    echo -e "${RED}❌ Source directory tidak valid (tidak ada src/ atau client/)${NC}"
    exit 1
fi

echo -e "${YELLOW}Lanjutkan copy file...${NC}"

# Copy backend files
echo -e "${YELLOW}📁 Copying backend files...${NC}"
if [ -d "$SOURCE_DIR/src" ]; then
    cp -r "$SOURCE_DIR/src" "$DEST_DIR/" 2>/dev/null || {
        echo -e "${RED}❌ Gagal copy src${NC}"
    }
    echo -e "${GREEN}✅ Backend source copied${NC}"
else
    echo -e "${RED}❌ src/ tidak ditemukan di source${NC}"
fi

if [ -f "$SOURCE_DIR/package.json" ]; then
    cp "$SOURCE_DIR/package.json" "$DEST_DIR/" 2>/dev/null || true
    echo -e "${GREEN}✅ package.json copied${NC}"
fi

if [ -f "$SOURCE_DIR/tsconfig.json" ]; then
    cp "$SOURCE_DIR/tsconfig.json" "$DEST_DIR/" 2>/dev/null || true
    echo -e "${GREEN}✅ tsconfig.json copied${NC}"
fi

# Copy frontend (client)
echo -e "${YELLOW}📁 Copying frontend files...${NC}"
if [ -d "$SOURCE_DIR/client" ]; then
    # Create client directory
    mkdir -p "$DEST_DIR/client"
    
    # Copy with exclude node_modules and dist
    if command -v rsync &> /dev/null; then
        rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '.vite' \
            "$SOURCE_DIR/client/" "$DEST_DIR/client/" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  rsync failed, trying cp...${NC}"
            # Fallback: copy everything then remove excluded
            cp -r "$SOURCE_DIR/client"/* "$DEST_DIR/client/" 2>/dev/null || true
            rm -rf "$DEST_DIR/client/node_modules" "$DEST_DIR/client/dist" "$DEST_DIR/client/.vite" 2>/dev/null || true
        }
    else
        # Manual copy excluding node_modules and dist
        for item in "$SOURCE_DIR/client"/*; do
            if [ -e "$item" ]; then
                item_name=$(basename "$item")
                if [ "$item_name" != "node_modules" ] && [ "$item_name" != "dist" ] && [ "$item_name" != ".vite" ]; then
                    cp -r "$item" "$DEST_DIR/client/" 2>/dev/null || true
                fi
            fi
        done
    fi
    echo -e "${GREEN}✅ Frontend source copied${NC}"
else
    echo -e "${RED}❌ client/ tidak ditemukan di source${NC}"
fi

# Copy database files
echo -e "${YELLOW}📁 Copying database files...${NC}"
if [ -d "$SOURCE_DIR/prisma" ]; then
    cp -r "$SOURCE_DIR/prisma" "$DEST_DIR/" 2>/dev/null || {
        echo -e "${RED}❌ Gagal copy prisma${NC}"
    }
    echo -e "${GREEN}✅ Prisma schema & migrations copied${NC}"
else
    echo -e "${RED}❌ prisma/ tidak ditemukan di source${NC}"
fi

# Copy scripts
echo -e "${YELLOW}📁 Copying essential scripts...${NC}"
if [ -d "$SOURCE_DIR/scripts" ]; then
    mkdir -p "$DEST_DIR/scripts"
    
    # Copy essential scripts
    for script in docker-startup.sh create-super-admin-docker.js; do
        if [ -f "$SOURCE_DIR/scripts/$script" ]; then
            cp "$SOURCE_DIR/scripts/$script" "$DEST_DIR/scripts/" 2>/dev/null || true
            echo -e "${GREEN}  ✅ $script copied${NC}"
        fi
    done
fi

# Copy nginx config
echo -e "${YELLOW}📁 Copying nginx configuration...${NC}"
if [ -d "$SOURCE_DIR/nginx" ]; then
    mkdir -p "$DEST_DIR/nginx/conf.d"
    
    if [ -f "$SOURCE_DIR/nginx/conf.d/default.conf" ]; then
        cp "$SOURCE_DIR/nginx/conf.d/default.conf" "$DEST_DIR/nginx/conf.d/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ nginx/conf.d/default.conf copied${NC}"
    fi
    
    if [ -f "$SOURCE_DIR/nginx/nginx.conf" ]; then
        cp "$SOURCE_DIR/nginx/nginx.conf" "$DEST_DIR/nginx/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ nginx/nginx.conf copied${NC}"
    fi
    
    # Create directories
    mkdir -p "$DEST_DIR/nginx/ssl" "$DEST_DIR/nginx/logs"
fi

# Copy client Dockerfile and nginx.conf
if [ -f "$SOURCE_DIR/client/Dockerfile" ]; then
    cp "$SOURCE_DIR/client/Dockerfile" "$DEST_DIR/client/" 2>/dev/null || true
    echo -e "${GREEN}  ✅ client/Dockerfile copied${NC}"
fi

if [ -f "$SOURCE_DIR/client/nginx.conf" ]; then
    cp "$SOURCE_DIR/client/nginx.conf" "$DEST_DIR/client/" 2>/dev/null || true
    echo -e "${GREEN}  ✅ client/nginx.conf copied${NC}"
fi

# Create logs directory
mkdir -p "$DEST_DIR/logs"

echo ""
echo -e "${GREEN}✅ Copy selesai!${NC}"
echo ""

# Now push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
echo ""

# Check git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Git repository belum di-initialize!${NC}"
    exit 1
fi

# Add all files
git add .

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Tidak ada perubahan untuk di-commit${NC}"
else
    # Show what will be committed
    echo -e "${YELLOW}📋 Files to be committed:${NC}"
    git status --short
    echo ""
    
    # Commit
    echo -e "${YELLOW}💾 Creating commit...${NC}"
    git commit -m "Add: Frontend, Backend, and Database source files" || {
        echo -e "${RED}❌ Commit failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Commit created${NC}"
    
    # Push
    echo ""
    echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
    git push origin main || {
        echo ""
        echo -e "${RED}❌ Push gagal!${NC}"
        echo ""
        echo -e "${YELLOW}Jika push dengan SSH gagal, gunakan HTTPS dengan Personal Access Token:${NC}"
        echo ""
        echo "1. Buat Personal Access Token di: https://github.com/settings/tokens"
        echo "2. Update remote URL:"
        echo "   git remote set-url origin https://YOUR_TOKEN@github.com/faiznutes/Warungin.git"
        echo "3. Atau gunakan username:"
        echo "   git remote set-url origin https://faiznutes@github.com/faiznutes/Warungin.git"
        echo ""
        exit 1
    }
    
    echo -e "${GREEN}✅ Push berhasil!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Semua file sudah di-copy dan di-push ke GitHub!${NC}"
fi

echo ""

