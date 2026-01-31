#!/bin/bash

# Cloud Onepa Playout - Docker Setup Helper

echo ">>> Checking Docker environment..."

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found. Please install Docker Desktop first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Warning: docker-compose command not found. Trying 'docker compose'..."
fi

echo ">>> Setting up environment variables..."
if [ ! -f ../backend/.env ]; then
    cp ../backend/.env.example ../backend/.env
    echo "Created backend/.env from example."
else
    echo "backend/.env already exists."
fi

echo ">>> Building and Starting Services..."
docker-compose down
docker-compose build
docker-compose up -d

echo ">>> Services Started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"
echo "RTMP: rtmp://localhost:1935/live"
