#!/usr/bin/env bash
set -e

echo "Building frontend..."
cd frontend || { echo "Frontend directory not found"; exit 1; }
npm install
npm run build
cd ..

echo "Copying frontend build to backend static directory..."
mkdir -p backend/static
# Clean up existing static files before copying new ones to avoid stale files
rm -rf backend/static/*
cp -r frontend/dist/* backend/static/

echo "Building backend..."
cd backend || { echo "Backend directory not found"; exit 1; }
cargo build --release
cd ..

echo "Build complete! The unified binary is located at backend/target/release/onepa-playout"
