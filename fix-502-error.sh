#!/bin/bash

# Script untuk fix Error 502 Bad Gateway dari Cloudflare
# Usage: bash fix-502-error.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fix Error 502 Bad Gateway${NC}"
echo ""

# Check nginx status
echo -e "${YELLOW}📋 Checking nginx status...${NC}"
docker compose ps nginx

echo ""
echo -e "${YELLOW}🔍 Testing nginx from cloudflared container...${NC}"

# Test connectivity from cloudflared to nginx
if docker compose exec cloudflared wget -q -O- http://nginx:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cloudflared can reach nginx via Docker network${NC}"
    NETWORK_OK=true
else
    echo -e "${RED}❌ Cloudflared CANNOT reach nginx via Docker network${NC}"
    NETWORK_OK=false
fi

# Test from host
echo ""
echo -e "${YELLOW}🔍 Testing nginx from host...${NC}"
if curl -s http://localhost:80 > /dev/null; then
    echo -e "${GREEN}✅ Nginx responding from host${NC}"
    HOST_OK=true
else
    echo -e "${RED}❌ Nginx NOT responding from host${NC}"
    HOST_OK=false
fi

echo ""
echo -e "${YELLOW}📋 Cloudflare Dashboard Configuration Check:${NC}"
echo ""
echo -e "${YELLOW}⚠️  PENTING: Check Public Hostname di Cloudflare Dashboard${NC}"
echo ""
echo "1. Buka: https://one.dash.cloudflare.com/"
echo "2. Zero Trust > Networks > Tunnels"
echo "3. Pilih tunnel Anda"
echo "4. Klik 'Configure' > 'Public Hostname'"
echo ""
echo -e "${YELLOW}Pastikan Service URL:${NC}"
if [ "$NETWORK_OK" = true ]; then
    echo -e "${GREEN}  ✅ http://nginx:80${NC} (jika tunnel di Docker network)"
else
    echo -e "${YELLOW}  ⚠️  http://localhost:80${NC} (jika tunnel di host)"
fi
echo ""
echo -e "${YELLOW}Jika Service URL salah, update di Cloudflare Dashboard!${NC}"

echo ""
echo -e "${YELLOW}💡 Solutions:${NC}"
echo ""
if [ "$NETWORK_OK" = false ]; then
    echo -e "${RED}1. Network issue detected!${NC}"
    echo "   - Check if cloudflared and nginx in same network"
    echo "   - Restart: docker compose restart cloudflared nginx"
fi

if [ "$HOST_OK" = false ]; then
    echo -e "${RED}2. Nginx not responding!${NC}"
    echo "   - Check nginx logs: docker compose logs nginx"
    echo "   - Restart nginx: docker compose restart nginx"
fi

echo ""
echo "3. Update Cloudflare Dashboard Public Hostname:"
echo "   - Service URL harus: http://nginx:80 (Docker) atau http://localhost:80 (host)"
echo ""
echo "4. Restart cloudflared after fixing:"
echo "   docker compose restart cloudflared"
echo ""

