#!/bin/bash

# Cloud Onepa Playout - Installer for Ubuntu/Debian

set -e

echo ">>> Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

echo ">>> Installing dependencies (ffmpeg, build-essential, libssl-dev, curl)..."
sudo apt-get install -y ffmpeg build-essential libssl-dev curl pkg-config

echo ">>> Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo ">>> Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    echo ">>> Rust already installed."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo ">>> Installing Node.js (LTS)..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo ">>> Node.js already installed."
fi

echo ">>> Setting up Database..."
sudo -u postgres psql -c "CREATE USER onepa WITH PASSWORD 'onepa';" || true
sudo -u postgres psql -c "CREATE DATABASE onepa_playout OWNER onepa;" || true

echo ">>> Installation complete!"
echo "Next steps:"
echo "1. Configure backend/.env"
echo "2. Run 'make install' or 'cargo run --release'"
