#!/bin/bash

# Script untuk verify cloudflared setup
# Usage: bash verify-cloudflared.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}✅ Verifying Cloudflared Setup${NC}"
echo ""

# Check cloudflared status
echo -e "${YELLOW}📋 Cloudflared Status:${NC}"
docker compose ps cloudflared

echo ""
CLOUDFLARED_STATUS=$(docker compose ps cloudflared --format json 2>/dev/null | grep -o '"Status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if echo "$CLOUDFLARED_STATUS" | grep -q "Up"; then
    echo -e "${GREEN}✅ Cloudflared is running${NC}"
elif echo "$CLOUDFLARED_STATUS" | grep -q "Restarting"; then
    echo -e "${RED}❌ Cloudflared is restarting - check logs!${NC}"
    docker compose logs --tail=20 cloudflared
    exit 1
else
    echo -e "${YELLOW}⚠️  Cloudflared status: $CLOUDFLARED_STATUS${NC}"
fi

# Check nginx status
echo ""
echo -e "${YELLOW}📋 Nginx Status:${NC}"
docker compose ps nginx

# Test connectivity from cloudflared to nginx
echo ""
echo -e "${YELLOW}🔍 Testing connectivity from cloudflared to nginx...${NC}"
if docker compose exec cloudflared wget -q -O- http://nginx:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cloudflared can reach nginx via Docker network${NC}"
    NETWORK_OK=true
else
    echo -e "${RED}❌ Cloudflared CANNOT reach nginx${NC}"
    NETWORK_OK=false
fi

# Test nginx from host
echo ""
echo -e "${YELLOW}🔍 Testing nginx from host...${NC}"
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx responding from host${NC}"
    HOST_OK=true
else
    echo -e "${RED}❌ Nginx NOT responding from host${NC}"
    HOST_OK=false
fi

# Check tunnel info
echo ""
echo -e "${YELLOW}🔍 Checking tunnel info...${NC}"
if docker compose exec cloudflared cloudflared tunnel info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tunnel is connected${NC}"
    docker compose exec cloudflared cloudflared tunnel info 2>/dev/null | head -10 || true
else
    echo -e "${YELLOW}⚠️  Cannot get tunnel info (might still be connecting)${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
if [ "$NETWORK_OK" = true ] && [ "$HOST_OK" = true ] && echo "$CLOUDFLARED_STATUS" | grep -q "Up"; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Final Steps:${NC}"
    echo "1. Verify Cloudflare Dashboard Public Hostname:"
    echo "   - Service URL: http://nginx:80"
    echo "   - Domain: pos.faiznute.site (atau domain Anda)"
    echo ""
    echo "2. Test from browser:"
    echo "   https://pos.faiznute.site"
    echo ""
    echo "3. If still Error 502, wait 1-2 minutes for Cloudflare to update"
    echo ""
else
    echo -e "${YELLOW}⚠️  Some checks failed${NC}"
    if [ "$NETWORK_OK" = false ]; then
        echo -e "${RED}  - Network connectivity issue${NC}"
    fi
    if [ "$HOST_OK" = false ]; then
        echo -e "${RED}  - Nginx not responding${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Run diagnostics:${NC}"
    echo "  bash fix-502-error.sh"
    echo "  bash fix-cloudflared-network.sh"
fi

echo ""

