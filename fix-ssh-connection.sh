#!/bin/bash
# Fix SSH connection issue - No route to host
# Usage: bash fix-ssh-connection.sh

SSH_HOST="192.168.0.101"
SSH_USER="warungin"

echo "🔍 Troubleshooting SSH Connection..."
echo ""

# Step 1: Ping test
echo "📡 Step 1: Testing connectivity..."
if ping -c 3 -W 2 $SSH_HOST > /dev/null 2>&1; then
    echo "✅ Ping successful - Host is reachable"
else
    echo "❌ Ping failed - Host is not reachable"
    echo ""
    echo "Possible causes:"
    echo "  1. VPS is down or not running"
    echo "  2. Wrong IP address"
    echo "  3. Network routing issue"
    echo "  4. Firewall blocking"
    echo ""
    echo "Troubleshooting steps:"
    echo "  - Check if VPS is running"
    echo "  - Verify IP address: $SSH_HOST"
    echo "  - Check network connection"
    echo "  - Try: ping $SSH_HOST"
    exit 1
fi

# Step 2: Port check
echo ""
echo "🔌 Step 2: Checking SSH port (22)..."
if timeout 5 bash -c "echo > /dev/tcp/$SSH_HOST/22" 2>/dev/null; then
    echo "✅ Port 22 is open"
else
    echo "❌ Port 22 is not accessible"
    echo ""
    echo "Possible causes:"
    echo "  1. SSH service not running on VPS"
    echo "  2. Firewall blocking port 22"
    echo "  3. SSH service listening on different port"
    echo ""
    echo "Try:"
    echo "  - Check SSH service on VPS: sudo systemctl status ssh"
    echo "  - Check firewall: sudo ufw status"
    exit 1
fi

# Step 3: SSH connection test
echo ""
echo "🔐 Step 3: Testing SSH connection..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "echo 'Connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful!"
    echo ""
    echo "You can now connect with:"
    echo "  ssh $SSH_USER@$SSH_HOST"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "Trying with verbose output..."
    ssh -v -o ConnectTimeout=5 $SSH_USER@$SSH_HOST "echo 'test'" 2>&1 | tail -10
    echo ""
    echo "Possible solutions:"
    echo "  1. Check SSH service: sudo systemctl start ssh"
    echo "  2. Check firewall: sudo ufw allow 22/tcp"
    echo "  3. Check SSH config: sudo nano /etc/ssh/sshd_config"
fi

echo ""
echo "✅ Troubleshooting completed"
echo ""

