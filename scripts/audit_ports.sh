#!/bin/bash
# scripts/audit_ports.sh
# Comprehensive Port & Protocol Audit for Cloud Onepa Playout ALPHA

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
        if [ "$container" == "alpha-mediamtx" ] && [ "$internal_port" == "9997" ]; then
             echo -e "${CYAN}● INTERNAL ONLY${NC} (API Access)"
        else
             echo -e "${YELLOW}⚠️  NO EXTERNAL MAPPING${NC}"
        fi
    else
        # Test reachability based on protocol
        if [ "$protocol" == "tcp" ]; then
            if nc -z 127.0.0.1 "$host_port" > /dev/null 2>&1; then
                 echo -e "${GREEN}✅ OPEN${NC} (Host: $host_port)"
            else
                 echo -e "${RED}❌ UNREACHABLE${NC} (Host: $host_port)"
            fi
        else
            # UDP check: MediaMTX is minimal, so we assume mapping = bound if container is Up
            echo -e "${GREEN}✅ MAPPED${NC} (Host: $host_port/udp)"
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

# MediaMTX API Health Check (Version-agnostic header check)
echo -n "Testing MediaMTX API... "
API_CHECK=$(docker exec alpha-backend curl -s -I http://mediamtx:9997/ 2>/dev/null | grep -i "Server: mediamtx" || echo "")
if [ -n "$API_CHECK" ]; then
    echo -e "${GREEN}✅ ALIVE${NC}"
else
    # Fallback to port check if headers are stripped
    if docker exec alpha-backend nc -z mediamtx 9997 2>/dev/null; then
        echo -e "${GREEN}✅ ALIVE${NC} (Port only)"
    else
        echo -e "${RED}❌ UNREACHABLE${NC}"
    fi
fi

# HLS Path via MediaMTX Internal
echo -n "Checking HLS Service Path... "
if docker exec alpha-frontend curl -s -o /dev/null -w "%{http_code}" http://mediamtx:8888/live_stream/index.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ READY${NC}"
else
    echo -e "${NC}○ STANDBY${NC} (No active stream)"
fi

# HLS via Nginx Proxy
echo -n "Checking Nginx HLS Proxy... "
if docker exec alpha-frontend curl -s -k -o /dev/null -w "%{http_code}" http://localhost/hls/stream.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ READY${NC}"
else
    echo -e "${NC}○ STANDBY${NC} (Cache pending)"
fi

echo "----------------------------------------------------"
echo -e "${BLUE}Infrastructure Audit Complete.${NC}"
