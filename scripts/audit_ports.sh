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

# Helper to check if there are active connections (traffic)
check_traffic() {
    local port=$1
    local protocol=$2
    local label=$3
    
    if [ -z "$port" ]; then
        echo -n ""
        return
    fi
    
    # 1. MediaMTX specific traffic check (via Internal API through Backend Container)
    if [[ "$label" == *"RTMP"* || "$label" == *"SRT"* || "$label" == *"HLS"* ]]; then
        # Identify Backend IP to filter internal relays
        local backend_ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' alpha-backend 2>/dev/null || echo "172.18.0.3")

        # Total connections from MediaMTX API
        local endpoint=""
        if [[ "$label" == *"RTMP"* ]]; then endpoint="rtmpconns"; elif [[ "$label" == *"SRT"* ]]; then endpoint="srtconns"; fi
        
        if [ -n "$endpoint" ]; then
             local all_conns=$(docker exec alpha-backend curl -s http://mediamtx:9997/v3/$endpoint/list 2>/dev/null || echo "{\"items\":[]}")
             # Count connections NOT matching the backend IP
             local ext_conns=$(echo "$all_conns" | grep -o '"remoteAddr":"[^"]*"' | grep -v "$backend_ip" | wc -l || echo "0")
             # Count connections matches the backend IP (System Relays)
             local sys_conns=$(echo "$all_conns" | grep -o '"remoteAddr":"[^"]*"' | grep "$backend_ip" | wc -l || echo "0")
             
             if [[ "$ext_conns" -gt 0 || "$sys_conns" -gt 0 ]]; then
                 local info=""
                 if [[ "$ext_conns" -gt 0 ]]; then info="${GREEN}${ext_conns} EXTERNAL${NC}"; fi
                 if [[ "$sys_conns" -gt 0 ]]; then 
                     if [[ -n "$info" ]]; then info="${info} + "; fi
                     info="${info}${CYAN}${sys_conns} SYSTEM RELAY(S)${NC}"
                 fi
                 echo -e " | 🌊 TRAFFIC: $info"
                 return
             fi
        fi

        # Fallback to path readers (HLS/WebRTC etc)
        local paths_json=$(docker exec alpha-backend curl -s http://mediamtx:9997/v3/paths/list 2>/dev/null || echo "{\"items\":[]}")
        # HLS in newer MediaMTX (v1.0+) tracks readers as sessions or through internal muxers
        # We count any reader that isn't the internal hlsMuxer
        local total_readers=$(echo "$paths_json" | grep -o '{"type":"[^"]*"' | grep -v "hlsMuxer" | wc -l || echo "0")
        
        if [[ "$total_readers" -gt 0 ]]; then
            echo -e " | ${GREEN}🌊 TRAFFIC: ${total_readers} active web reader(s) detected via API${NC}"
            return
        fi
    fi

    # 2. UDP specific flow check for Backend (raw UDP output)
    if [[ "$label" == *"UDP"* && "$container" == "alpha-backend" ]]; then
        local udp_conns=$(docker exec alpha-backend ss -un "( sport = :$port )" 2>/dev/null | grep -v "State" | wc -l || echo "0")
        if [ "$udp_conns" -gt 0 ]; then
             echo -e " | ${GREEN}🌊 TRAFFIC: ${udp_conns} active UDP flow(s)${NC}"
             return
        fi
    fi

    # 2. General TCP/UDP connection tracking (ss)
    if [ "$protocol" == "tcp" ]; then
        # Include transitions like TIME-WAIT/CLOSE-WAIT to catch bursty HTTP traffic
        local conns=$(ss -tn state established state fin-wait-1 state fin-wait-2 state time-wait state close-wait "( sport = :$port or dport = :$port )" 2>/dev/null | wc -l)
        if [ "$conns" -gt 1 ]; then
            echo -e " | ${GREEN}🌊 TRAFFIC: Active Web Context ($(($conns - 1)) items)${NC}"
        else
            echo -e " | ${GREEN}🟢 LISTENING (Idle)${NC}"
        fi
    else
        local conns=$(ss -un "( sport = :$port or dport = :$port )" 2>/dev/null | grep -v "State" | wc -l)
        if [ "$conns" -gt 0 ]; then
             echo -e " | ${GREEN}🌊 TRAFFIC: Active UDP flow${NC}"
        else
             echo -e " | ${GREEN}🟢 LISTENING (Idle)${NC}"
        fi
    fi
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
                 echo -n -e "${GREEN}✅ OPEN${NC} (Host: $host_port)"
                 check_traffic "$host_port" "tcp" "$label"
            else
                 echo -e "${RED}❌ UNREACHABLE${NC} (Host: $host_port)"
            fi
        else
            # UDP check
            echo -n -e "${GREEN}✅ MAPPED${NC} (Host: $host_port/udp)"
            check_traffic "$host_port" "udp" "$label"
        fi
    fi
}

echo -e "${BLUE}--- Service Ports Audit ---${NC}"
audit_service alpha-frontend 80 tcp "Frontend Web"
audit_service alpha-backend 8181 tcp "Backend API"
audit_service alpha-mediamtx 1935 tcp "RTMP Server"
audit_service alpha-mediamtx 8888 tcp "HLS Server"
audit_service alpha-mediamtx 8890 udp "SRT Server"
audit_service alpha-backend 1234 udp "UDP Playout"
audit_service alpha-mediamtx 9997 tcp "MediaMTX API"
audit_service alpha-postgres 5432 tcp "PostgreSQL"

echo ""
echo -e "${BLUE}--- Protocol & Data Flow Verification ---${NC}"

# MediaMTX API Health Check
echo -n "Testing MediaMTX API... "
API_CHECK=$(docker exec alpha-backend curl -s -I http://mediamtx:9997/ 2>/dev/null | grep -i "Server: mediamtx" || echo "")
if [ -n "$API_CHECK" ]; then
    echo -e "${GREEN}✅ ALIVE${NC}"
else
    if docker exec alpha-backend nc -z mediamtx 9997 2>/dev/null; then
        echo -e "${GREEN}✅ ALIVE${NC} (Port only)"
    else
        echo -e "${RED}❌ UNREACHABLE${NC}"
    fi
fi

# HLS Path via MediaMTX Internal
echo -n "Checking HLS Service Path... "
if docker exec alpha-frontend curl -s -o /dev/null -w "%{http_code}" http_proxy= http://mediamtx:8888/master/index.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ READY${NC}"
else
    echo -e "${NC}○ STANDBY${NC} (Stream not yet published to MediaMTX)"
fi

# HLS via Nginx Proxy
echo -n "Checking Nginx HLS Proxy... "
if docker exec alpha-frontend curl -s -k -o /dev/null -w "%{http_code}" http://localhost/hls-live/master/index.m3u8 | grep -q "200"; then
    echo -e "${GREEN}✅ READY${NC}"
else
    echo -e "${NC}○ STANDBY${NC} (Waiting for segments/Nginx cache)"
fi

echo "----------------------------------------------------"
echo -e "${BLUE}Infrastructure Audit Complete.${NC}"
