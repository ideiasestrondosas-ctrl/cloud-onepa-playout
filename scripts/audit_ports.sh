#!/bin/bash
# scripts/audit_ports.sh
# Comprehensive Port & Protocol Audit for Cloud Onepa Playout ALPHA

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Auditing Cloud Onepa Playout Infrastructure...${NC}"
echo "----------------------------------------------------"

# Helper to check if a container is running
is_container_running() {
    docker ps --format '{{.Names}}' | grep -q "^$1$"
}

# Helper to check port mapping and reachability
audit_service() {
    local container=$1
    local internal_port=$2
    local protocol=$3
    local label=$4

    echo -n "Checking $label ($container $internal_port/$protocol)... "

    if ! is_container_running "$container"; then
        echo -e "${RED}❌ CONTAINER STOPPED${NC}"
        return
    fi

    # Get the host port mapping using docker inspect for reliability
    local host_port=$(docker inspect --format='{{(index (index .NetworkSettings.Ports "'$internal_port/$protocol'") 0).HostPort}}' "$container" 2>/dev/null || echo "")

    if [ -z "$host_port" ]; then
        echo -e "${YELLOW}⚠️  NO EXTERNAL MAPPING${NC}"
    else
        # Test reachability based on protocol
        if [ "$protocol" == "tcp" ]; then
            if nc -z 127.0.0.1 "$host_port" > /dev/null 2>&1; then
                 echo -e "${GREEN}✅ OPEN${NC} (Host: $host_port)"
            else
                 echo -e "${RED}❌ UNREACHABLE${NC} (Host: $host_port)"
            fi
        else
            # UDP is hard to check from outside without a specific tool.
            # We verify the socket exists inside the container.
            if docker exec "$container" sh -c "netstat -uln | grep :$internal_port" > /dev/null 2>&1 || \
               docker exec "$container" sh -c "ss -uln | grep :$internal_port" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ LISTENING${NC} (Mapped to $host_port/udp)"
            else
                echo -e "${RED}❌ NOT LISTENING${NC} (Internal)"
            fi
        fi
    fi
}

echo -e "${BLUE}--- Service Ports Audit ---${NC}"
audit_service alpha-frontend 80 tcp "Frontend Web"
audit_service alpha-backend 8181 tcp "Backend API"
audit_service alpha-mediamtx 1935 tcp "RTMP Server"
audit_service alpha-mediamtx 8888 tcp "HLS Server"
audit_service alpha-mediamtx 8890 udp "SRT Server"
audit_service alpha-mediamtx 9997 tcp "MediaMTX API"
audit_service alpha-postgres 5432 tcp "PostgreSQL"

echo ""
echo -e "${BLUE}--- Protocol & Data Flow Verification ---${NC}"

# 1. HLS via MediaMTX Internal
echo -n "Testing MediaMTX HLS Path... "
if docker exec alpha-frontend curl -s -o /dev/null -w "%{http_code}" http://mediamtx:8888/live/stream/index.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC} (Path live/stream not ready)"
fi

# 2. HLS via Nginx Proxy
echo -n "Testing Nginx HLS Proxy... "
if docker exec alpha-frontend curl -s -k -o /dev/null -w "%{http_code}" http://localhost/hls/stream.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  PENDING${NC} (Nginx proxy not serving cache yet)"
fi

# 3. MediaMTX API Health
echo -n "Testing MediaMTX API... "
if docker exec alpha-backend curl -s http://mediamtx:9997/v3/config/get | grep -q "paths"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# 4. SRT Publish ID Check
echo -n "Checking SRT Mount Point... "
if docker exec alpha-backend curl -s http://mediamtx:9997/v3/paths/list | grep -q "live/stream_srt"; then
    echo -e "${GREEN}✅ ACTIVE${NC}"
else
    echo -e "${NC}○ IDLE${NC}"
fi

echo "----------------------------------------------------"
echo -e "${BLUE}Audit Complete.${NC}"
