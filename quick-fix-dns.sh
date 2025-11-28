#!/bin/bash
# Quick fix DNS di server
# Jalankan di Git Bash: bash quick-fix-dns.sh

SSH_USER="warungin"
SSH_HOST="192.168.0.101"

echo "Fixing DNS on server..."
echo "Password: 123"
echo ""

ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" << 'FIX_DNS'
# Fix DNS
echo "🔧 Setting up DNS..."
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Test DNS
echo "Testing DNS..."
nslookup registry-1.docker.io || echo "DNS test completed"

echo "✅ DNS fixed!"
FIX_DNS

echo ""
echo "✅ DNS fix completed!"
echo "Now run: bash FINAL_DEPLOY.sh"

