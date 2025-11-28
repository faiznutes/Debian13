#!/bin/bash

# Script untuk fix nginx healthcheck issue
# Usage: bash fix-nginx-healthcheck.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fix Nginx Healthcheck${NC}"
echo ""

# Check nginx logs
echo -e "${YELLOW}📋 Checking nginx logs...${NC}"
docker compose logs --tail=50 nginx

echo ""
echo -e "${YELLOW}🔍 Testing nginx from inside container...${NC}"

# Test nginx
if docker compose exec nginx wget -q -O- http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx responding from inside container${NC}"
else
    echo -e "${RED}❌ Nginx not responding from inside container${NC}"
    echo -e "${YELLOW}Checking nginx configuration...${NC}"
    docker compose exec nginx nginx -t
fi

echo ""
echo -e "${YELLOW}🔍 Testing nginx from host...${NC}"
if curl -s http://localhost:80 > /dev/null; then
    echo -e "${GREEN}✅ Nginx responding from host${NC}"
else
    echo -e "${RED}❌ Nginx not responding from host${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Nginx container status:${NC}"
docker compose ps nginx

echo ""
echo -e "${YELLOW}💡 Solutions:${NC}"
echo "1. Restart nginx: docker compose restart nginx"
echo "2. Check nginx config: docker compose exec nginx nginx -t"
echo "3. View full logs: docker compose logs nginx"
echo "4. Rebuild nginx: docker compose up -d --force-recreate nginx"
echo ""

