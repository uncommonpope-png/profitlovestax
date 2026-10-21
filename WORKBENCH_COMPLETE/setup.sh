#!/usr/bin/env bash
# BUYaSOUL ONE SYSTEM - Automated Setup Script
# Run: chmod +x setup.sh && ./setup.sh

set -e

echo "═══════════════════════════════════════════"
echo "  BUYaSOUL ONE SYSTEM — Automated Setup"
echo "═══════════════════════════════════════════"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Current: $(node --version)"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
echo "✅ npm $(npm --version)"

# Create .env from template if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env.example .env
  echo "⚠️  IMPORTANT: Edit .env and add your NINE_ROUTER_API_KEY from OmniRoute dashboard"
else
  echo "✅ .env already exists"
fi

# Install all dependencies
echo ""
echo "📦 Installing dependencies for all services..."
echo "   This may take 2-5 minutes..."

npm run install:all

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your NINE_ROUTER_API_KEY"
echo "   (Get it from http://localhost:20128 after first OmniRoute start)"
echo ""
echo "2. Start the system:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000"
echo ""
echo "Services will run on:"
echo "  • Workbench UI:     http://localhost:3000"
echo "  • Workbench API:    http://localhost:3001"
echo "  • GSK MCP:          http://localhost:3001/mcp"
echo "  • OmniRoute:        http://localhost:20128"
echo "  • CPL:              http://localhost:3457"
echo ""
echo "Health checks:"
echo "  • curl http://localhost:3001/api/system/status"
echo "  • curl http://localhost:20128/v1/models"
echo "  • curl http://localhost:3457/health"
echo "  • curl http://localhost:3001/mcp/health"