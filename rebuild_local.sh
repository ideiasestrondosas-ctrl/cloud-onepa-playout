#!/bin/bash

echo ">>> 🛑 Stopping services..."
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo ">>> 🦀 Compiling Backend..."
cd backend
cargo build --release
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

echo ">>> ⚛️  Building Frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ">>> ✅ Build Complete!"
echo "Starting services..."

# Start Backend in background
cd backend
./target/release/cloud-onepa-playout > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run preview -- --port 3000 --host
