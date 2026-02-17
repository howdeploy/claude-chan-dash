#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== claude-chan-dash installer ==="
echo "Project: $PROJECT_DIR"

# Install dependencies
cd "$PROJECT_DIR"
npm install --production=false
npm run build

# PM2 setup
if command -v pm2 &> /dev/null; then
    pm2 start "$SCRIPT_DIR/ecosystem.config.js"
    pm2 save
    echo "Started with PM2: claude-chan-dash"
else
    echo "PM2 not found. Install with: npm i -g pm2"
    echo "Or run manually: npm start"
fi

echo ""
echo "Dashboard: http://localhost:3000 (via SSH tunnel)"
echo "  ssh -L 3000:localhost:3000 user@server"
