#!/bin/bash
# Quick check VPS connectivity
# Usage: bash check-vps-connectivity.sh

SSH_HOST="192.168.0.101"

echo "🔍 Checking VPS Connectivity..."
echo "Target: $SSH_HOST"
echo ""

# Ping test
echo "1️⃣  Ping test..."
if ping -c 3 -W 2 $SSH_HOST > /dev/null 2>&1; then
    echo "   ✅ Host is reachable"
    PING_OK=true
else
    echo "   ❌ Host is NOT reachable"
    PING_OK=false
fi
echo ""

# Port test
echo "2️⃣  Port 22 test..."
if timeout 3 bash -c "echo > /dev/tcp/$SSH_HOST/22" 2>/dev/null; then
    echo "   ✅ Port 22 is open"
    PORT_OK=true
else
    echo "   ❌ Port 22 is NOT accessible"
    PORT_OK=false
fi
echo ""

# Traceroute
echo "3️⃣  Traceroute..."
if command -v traceroute &> /dev/null; then
    echo "   Running traceroute (first 5 hops)..."
    traceroute -m 5 $SSH_HOST 2>/dev/null | head -6 || echo "   ⚠️  Traceroute failed"
elif command -v tracepath &> /dev/null; then
    echo "   Running tracepath..."
    tracepath $SSH_HOST 2>/dev/null | head -10 || echo "   ⚠️  Tracepath failed"
else
    echo "   ⚠️  traceroute/tracepath not available"
fi
echo ""

# Network interface check
echo "4️⃣  Local network interface..."
if command -v ip &> /dev/null; then
    echo "   Your IP addresses:"
    ip addr show | grep "inet " | awk '{print "   - " $2}' | head -3
elif command -v ifconfig &> /dev/null; then
    echo "   Your IP addresses:"
    ifconfig | grep "inet " | awk '{print "   - " $2}' | head -3
fi
echo ""

# Summary
echo "════════════════════════════════════════"
echo "📊 Summary:"
echo "════════════════════════════════════════"
if [ "$PING_OK" = true ] && [ "$PORT_OK" = true ]; then
    echo "✅ VPS is reachable and SSH port is open"
    echo ""
    echo "Try connecting:"
    echo "  ssh warungin@$SSH_HOST"
elif [ "$PING_OK" = true ] && [ "$PORT_OK" = false ]; then
    echo "⚠️  VPS is reachable but SSH port is closed"
    echo ""
    echo "Possible causes:"
    echo "  - SSH service not running on VPS"
    echo "  - Firewall blocking port 22"
    echo "  - SSH listening on different port"
elif [ "$PING_OK" = false ]; then
    echo "❌ VPS is NOT reachable"
    echo ""
    echo "Possible causes:"
    echo "  - VPS is down or not running"
    echo "  - Wrong IP address"
    echo "  - Network routing issue"
    echo "  - VPS in different network"
    echo ""
    echo "Solutions:"
    echo "  1. Check VPS status in hosting provider"
    echo "  2. Verify IP address"
    echo "  3. Check network connection"
    echo "  4. Try from Windows (not WSL)"
fi
echo ""

