#!/bin/bash

# Script untuk build Docker dengan retry logic untuk mengatasi network timeout
# Usage: bash build-docker-retry.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

MAX_RETRIES=3
RETRY_DELAY=30

echo -e "${BLUE}🐳 Build Docker dengan Retry Logic${NC}"
echo ""

# Function to build with retry
build_with_retry() {
    local service=$1
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo -e "${YELLOW}🔨 Building $service (Attempt $attempt/$MAX_RETRIES)...${NC}"
        
        if docker compose build --no-cache $service 2>&1 | tee /tmp/docker-build.log; then
            echo -e "${GREEN}✅ $service built successfully${NC}"
            return 0
        else
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}⚠️  Build failed, waiting ${RETRY_DELAY}s before retry...${NC}"
                sleep $RETRY_DELAY
                
                # Clean up failed build
                echo -e "${YELLOW}🧹 Cleaning up...${NC}"
                docker system prune -f > /dev/null 2>&1 || true
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Failed to build $service after $MAX_RETRIES attempts${NC}"
    return 1
}

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker tidak terinstall!${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose tidak terinstall!${NC}"
    exit 1
fi

# Use docker compose or docker-compose
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✅ Docker terdeteksi${NC}"
echo ""

# Build services with retry
echo -e "${YELLOW}📦 Building services...${NC}"
echo ""

# Build backend
if ! build_with_retry "backend"; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Build frontend
if ! build_with_retry "frontend"; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All services built successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  docker compose up -d"
echo ""

