#!/bin/bash

# Script untuk check dan fix cloudflared issues
# Usage: bash check-cloudflared.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking Cloudflared Status${NC}"
echo ""

# Check logs
echo -e "${YELLOW}📋 Cloudflared logs (last 50 lines):${NC}"
docker compose logs --tail=50 cloudflared

echo ""
echo -e "${YELLOW}🔍 Checking environment...${NC}"

# Check if token is set
if [ -f .env ]; then
    if grep -q "CLOUDFLARE_TUNNEL_TOKEN" .env; then
        TOKEN=$(grep "CLOUDFLARE_TUNNEL_TOKEN" .env | cut -d '=' -f2)
        if [ -z "$TOKEN" ] || [ "$TOKEN" = "" ]; then
            echo -e "${RED}❌ CLOUDFLARE_TUNNEL_TOKEN is empty in .env${NC}"
        else
            echo -e "${GREEN}✅ CLOUDFLARE_TUNNEL_TOKEN is set${NC}"
            echo -e "${YELLOW}   Token preview: ${TOKEN:0:20}...${NC}"
        fi
    else
        echo -e "${RED}❌ CLOUDFLARE_TUNNEL_TOKEN not found in .env${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Common Issues:${NC}"
echo "1. Missing or invalid tunnel token"
echo "2. Tunnel token expired"
echo "3. Network connectivity issues"
echo "4. Cloudflare service issues"
echo ""
echo -e "${YELLOW}🔧 Solutions:${NC}"
echo "1. Check token: grep CLOUDFLARE_TUNNEL_TOKEN .env"
echo "2. Regenerate token in Cloudflare Dashboard"
echo "3. Update .env with new token"
echo "4. Restart: docker compose restart cloudflared"
echo ""

