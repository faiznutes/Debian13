#!/bin/bash

# Script untuk setup SSH key untuk passwordless login
# Usage: bash setup-ssh-key.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_USER="warungin"
SSH_HOST="192.168.0.101"
SSH_PASSWORD="123"
SSH_PORT="22"

echo -e "${BLUE}🔑 Setup SSH Key untuk Passwordless Login${NC}"
echo ""

# Check if ssh-keygen exists
if ! command -v ssh-keygen &> /dev/null; then
    echo -e "${RED}❌ ssh-keygen tidak terinstall!${NC}"
    exit 1
fi

# Check if key already exists
KEY_FILE="$HOME/.ssh/id_rsa_warungin"
if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  SSH key sudah ada: $KEY_FILE${NC}"
    read -p "Gunakan key yang ada? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$KEY_FILE" "$KEY_FILE.pub"
    fi
fi

# Generate SSH key if doesn't exist
if [ ! -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}🔑 Generating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f "$KEY_FILE" -N "" -C "warungin-deploy"
    echo -e "${GREEN}✅ SSH key generated${NC}"
fi

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak terinstall${NC}"
    echo -e "${YELLOW}Install dengan: sudo apt-get install sshpass (Linux) atau brew install sshpass (Mac)${NC}"
    echo ""
    echo -e "${YELLOW}Atau copy public key manual:${NC}"
    echo "  cat $KEY_FILE.pub"
    echo "  Lalu paste ke server: ~/.ssh/authorized_keys"
    exit 0
fi

# Copy public key to server
echo -e "${YELLOW}📤 Copying public key to server...${NC}"
PUBLIC_KEY=$(cat "$KEY_FILE.pub")

# Try to add to authorized_keys
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" || {
    echo -e "${RED}❌ Gagal copy key ke server${NC}"
    echo -e "${YELLOW}Copy manual dengan:${NC}"
    echo "  cat $KEY_FILE.pub | ssh $SSH_USER@$SSH_HOST 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"
    exit 1
}

echo -e "${GREEN}✅ Public key copied to server${NC}"

# Test connection
echo ""
echo -e "${YELLOW}🔍 Testing passwordless connection...${NC}"
if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo 'Passwordless login successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ Passwordless login berhasil!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Untuk menggunakan key ini, update deploy-ssh.sh:${NC}"
    echo "  SSH_KEY=\"$KEY_FILE\""
    echo ""
else
    echo -e "${YELLOW}⚠️  Passwordless login belum berhasil, masih perlu password${NC}"
    echo -e "${YELLOW}Pastikan:${NC}"
    echo "  1. Public key sudah di-copy ke server"
    echo "  2. Permissions ~/.ssh/authorized_keys adalah 600"
    echo "  3. Server mengizinkan key-based authentication"
fi

echo ""

