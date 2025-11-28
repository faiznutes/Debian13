#!/bin/bash
# Script untuk connect dengan auto-detect port dan metode
HOST="192.168.0.101"
USER="warungin"
PASSWORD="123"

echo "=========================================="
echo "Auto-Connect to Warungin Server"
echo "Host: $USER@$HOST"
echo "=========================================="
echo ""

# Test connectivity
echo "Testing connectivity..."
if ping -c 1 -W 2 $HOST > /dev/null 2>&1; then
    echo "✅ Server is reachable"
else
    echo "❌ Server is not reachable"
    exit 1
fi

# Try different SSH ports
PORTS=(22 2222 2200 22022)
SSH_PORT=22

for port in "${PORTS[@]}"; do
    echo "Testing port $port..."
    if timeout 2 bash -c "echo > /dev/tcp/$HOST/$port" 2>/dev/null; then
        echo "✅ Port $port is open!"
        SSH_PORT=$port
        break
    fi
done

echo ""
echo "Attempting SSH connection to port $SSH_PORT..."

# Try with sshpass if available
if command -v sshpass &> /dev/null; then
    echo "Using sshpass..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p $SSH_PORT "$USER@$HOST" "echo '✅ Connected successfully!' && hostname && whoami && pwd"
else
    echo "sshpass not available. Trying interactive connection..."
    echo "Password: $PASSWORD"
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p $SSH_PORT "$USER@$HOST"
fi

