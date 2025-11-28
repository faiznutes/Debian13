#!/bin/bash

# Script untuk fix cloudflared network connectivity issue
# Usage: bash fix-cloudflared-network.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fix Cloudflared Network Connectivity${NC}"
echo ""

# Check if cloudflared is restarting
echo -e "${YELLOW}📋 Checking cloudflared status...${NC}"
CLOUDFLARED_STATUS=$(docker compose ps cloudflared --format json 2>/dev/null | grep -o '"Status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if echo "$CLOUDFLARED_STATUS" | grep -q "Restarting"; then
    echo -e "${RED}❌ Cloudflared is restarting${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker compose logs --tail=20 cloudflared
    echo ""
    echo -e "${YELLOW}Stopping cloudflared...${NC}"
    docker compose stop cloudflared
    sleep 2
fi

# Check networks
echo -e "${YELLOW}🔍 Checking Docker networks...${NC}"
echo ""
echo "Nginx network:"
docker inspect warungin-nginx --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null || echo "Cannot inspect nginx"

echo ""
echo "Cloudflared network (if running):"
docker inspect warungin-cloudflared --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null || echo "Cloudflared not running"

# Check if both in same network
NGINX_NET=$(docker inspect warungin-nginx --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | head -1)
CLOUDFLARED_NET=$(docker inspect warungin-cloudflared --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | head -1)

echo ""
if [ "$NGINX_NET" = "$CLOUDFLARED_NET" ] && [ -n "$NGINX_NET" ]; then
    echo -e "${GREEN}✅ Both containers in same network: $NGINX_NET${NC}"
else
    echo -e "${RED}❌ Containers NOT in same network!${NC}"
    echo -e "${YELLOW}Nginx: $NGINX_NET${NC}"
    echo -e "${YELLOW}Cloudflared: $CLOUDFLARED_NET${NC}"
fi

# Test nginx from host
echo ""
echo -e "${YELLOW}🔍 Testing nginx from host...${NC}"
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx accessible from host${NC}"
else
    echo -e "${RED}❌ Nginx NOT accessible from host${NC}"
fi

# Solutions
echo ""
echo -e "${YELLOW}💡 Solutions:${NC}"
echo ""
echo "1. Recreate cloudflared with correct network:"
echo "   docker compose --profile cloudflare down cloudflared"
echo "   docker compose --profile cloudflare up -d cloudflared"
echo ""
echo "2. Check Cloudflare Dashboard Public Hostname:"
echo "   - Service URL: http://nginx:80 (jika di Docker)"
echo "   - Atau: http://localhost:80 (jika di host)"
echo ""
echo "3. If cloudflared keeps restarting, check token:"
echo "   grep CLOUDFLARE_TUNNEL_TOKEN .env"
echo "   docker compose logs cloudflared"
echo ""

