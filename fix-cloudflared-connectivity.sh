#!/bin/bash

# Script untuk fix cloudflared connectivity ke nginx
# Usage: bash fix-cloudflared-connectivity.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fix Cloudflared Connectivity to Nginx${NC}"
echo ""

# Check networks
echo -e "${YELLOW}🔍 Checking Docker networks...${NC}"
echo ""

# Get network names
NGINX_NETWORKS=$(docker inspect warungin-nginx --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null)
CLOUDFLARED_NETWORKS=$(docker inspect warungin-cloudflared --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null)

echo "Nginx networks: $NGINX_NETWORKS"
echo "Cloudflared networks: $CLOUDFLARED_NETWORKS"
echo ""

# Check if both in warungin-network
if echo "$NGINX_NETWORKS" | grep -q "warungin-network" && echo "$CLOUDFLARED_NETWORKS" | grep -q "warungin-network"; then
    echo -e "${GREEN}✅ Both containers in warungin-network${NC}"
else
    echo -e "${RED}❌ Containers NOT in same network!${NC}"
    echo -e "${YELLOW}Fixing network...${NC}"
    
    # Recreate cloudflared
    docker compose --profile cloudflare down cloudflared
    docker compose --profile cloudflare up -d cloudflared
    sleep 5
fi

# Test DNS resolution
echo ""
echo -e "${YELLOW}🔍 Testing DNS resolution...${NC}"
if docker compose exec cloudflared nslookup nginx > /dev/null 2>&1 || docker compose exec cloudflared getent hosts nginx > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolution works (nginx can be resolved)${NC}"
else
    echo -e "${YELLOW}⚠️  DNS resolution test failed (might be normal)${NC}"
fi

# Test with different methods
echo ""
echo -e "${YELLOW}🔍 Testing connectivity with different methods...${NC}"

# Method 1: wget
echo -n "  Testing with wget... "
if docker compose exec cloudflared wget -q -O- --timeout=5 http://nginx:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Success${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Method 2: curl (if available)
echo -n "  Testing with curl... "
if docker compose exec cloudflared curl -s --max-time 5 http://nginx:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Success${NC}"
    EXIT_CODE=0
else
    echo -e "${YELLOW}⚠️  Failed or curl not available${NC}"
fi

# Method 3: ping
echo -n "  Testing ping to nginx... "
if docker compose exec cloudflared ping -c 1 nginx > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Success${NC}"
else
    echo -e "${YELLOW}⚠️  Failed or ping not available${NC}"
fi

# Check nginx IP from cloudflared perspective
echo ""
echo -e "${YELLOW}🔍 Nginx IP from cloudflared:${NC}"
docker compose exec cloudflared getent hosts nginx 2>/dev/null || docker compose exec cloudflared nslookup nginx 2>/dev/null || echo "Cannot resolve nginx"

# Check if nginx is listening
echo ""
echo -e "${YELLOW}🔍 Checking if nginx is listening on port 80...${NC}"
if docker compose exec nginx netstat -tlnp 2>/dev/null | grep -q ":80" || docker compose exec nginx ss -tlnp 2>/dev/null | grep -q ":80"; then
    echo -e "${GREEN}✅ Nginx is listening on port 80${NC}"
else
    echo -e "${RED}❌ Nginx NOT listening on port 80${NC}"
fi

# Solutions
echo ""
echo -e "${YELLOW}💡 Solutions:${NC}"
echo ""
echo "1. If connectivity failed, try recreating both containers:"
echo "   docker compose restart nginx cloudflared"
echo ""
echo "2. Check if both in same network:"
echo "   docker network inspect warungin_warungin-network"
echo ""
echo "3. Test from cloudflared manually:"
echo "   docker compose exec cloudflared sh"
echo "   wget -O- http://nginx:80"
echo ""
echo "4. If still failing, use localhost instead in Cloudflare Dashboard:"
echo "   Service URL: http://localhost:80"
echo "   (Then cloudflared will connect via host network)"
echo ""

