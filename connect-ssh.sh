#!/bin/bash
# Script untuk connect ke server Warungin dengan password
# Usage: bash connect-ssh.sh

HOST="warungin@192.168.0.104"
PASSWORD="123"

echo "=========================================="
echo "Connecting to Warungin Server"
echo "Host: $HOST"
echo "=========================================="
echo ""

# Check if sshpass is available for non-interactive password
if command -v sshpass &> /dev/null; then
    echo "Using sshpass for automatic password authentication..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$HOST"
else
    echo "sshpass not found. Using interactive SSH connection..."
    echo "Password: $PASSWORD"
    echo ""
    ssh -o StrictHostKeyChecking=no "$HOST"
fi

