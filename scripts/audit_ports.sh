#!/bin/bash
# scripts/audit_ports.sh

echo "🔍 Auditing Cloud Onepa Playout Ports..."

# Internal check via netstat (if available) or /proc/net
check_container_port() {
    local container=$1
    local port=$2
    local protocol=$3
    echo -n "Checking $container ($port/$protocol)... "
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        echo "❌ STOPPED (Container not running)"
        return
    fi

    # Host-side check using netcat (nc) to the mapped port
    # We need to find the mapped port on host
    local host_port=$(docker port $container $port/$protocol 2>/dev/null | head -n 1 | cut -d ':' -f 2)
    
    if [ -z "$host_port" ]; then
        echo "⚠️  NO MAPPING (Internal only)"
        # Try internal check if sh exists
        if docker exec $container sh -c "exit 0" 2>/dev/null; then
             if docker exec $container sh -c "netstat -tuln 2>/dev/null | grep :$port" > /dev/null 2>&1; then
                echo "✅ OPEN (Internal Shell)"
             else
                echo "❌ CLOSED (Internal Shell)"
             fi
        else
             echo "⚠️  CANNOT CHECK (No Shell)"
        fi
        return
    fi

    # Test connectivity to host port
    if nc -z 127.0.0.1 $host_port > /dev/null 2>&1; then
        echo "✅ OPEN (Host: $host_port)"
    else
        echo "❌ UNREACHABLE (Host: $host_port)"
    fi
}

echo "--- Internal Container Ports ---"
check_container_port alpha-mediamtx 1935 tcp
check_container_port alpha-mediamtx 8888 tcp
check_container_port alpha-mediamtx 8890 udp
check_container_port alpha-backend 8181 tcp
check_container_port alpha-frontend 80 tcp

echo ""
echo "--- External Host Mappings (Docker) ---"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep alpha-

echo ""
echo "--- Protocol Verification ---"
# Check if MediaMTX is serving HLS at the expected path
echo "Testing HLS via Proxy (Frontend -> MediaMTX)..."
if docker exec alpha-frontend curl -s -I http://mediamtx:8888/hls/ 2>/dev/null | grep -q "200 OK"; then
    echo "✅ Nginx -> MediaMTX HLS Connectivity OK"
else
    # Try alternate path if configured differently in mediamtx.yml
    echo "⚠️ MediaMTX root HLS index not found, checking specific stream..."
    if docker exec alpha-frontend curl -s -I http://mediamtx:8888/live/stream/index.m3u8 2>/dev/null | grep -q "200 OK"; then
        echo "✅ Stream path OK"
    else
         echo "❌ HLS connectivity check failed"
    fi
fi
