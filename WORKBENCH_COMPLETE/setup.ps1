<# 
BUYaSOUL ONE SYSTEM - Automated Setup Script for Windows
Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser; .\setup.ps1
#>

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BUYaSOUL ONE SYSTEM — Automated Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

# Check Node.js version
try {
    $nodeVersion = (node --version).TrimStart('v')
    $majorVersion = [int]$nodeVersion.Split('.')[0]
    if ($majorVersion -lt 20) {
        Write-Host "❌ Node.js 20+ required. Current: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Create .env from template if not exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  IMPORTANT: Edit .env and add your NINE_ROUTER_API_KEY from OmniRoute dashboard" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

# Install all dependencies
Write-Host ""
Write-Host "📦 Installing dependencies for all services..." -ForegroundColor Cyan
Write-Host "   This may take 2-5 minutes..." -ForegroundColor Gray

npm run install:all

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit .env and add your NINE_ROUTER_API_KEY" -ForegroundColor Yellow
Write-Host "   (Get it from http://localhost:20128 after first OmniRoute start)"
Write-Host ""
Write-Host "2. Start the system:" -ForegroundColor Cyan
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. Open http://localhost:3000"
Write-Host ""
Write-Host "Services will run on:"
Write-Host "  • Workbench UI:     http://localhost:3000"
Write-Host "  • Workbench API:    http://localhost:3001"
Write-Host "  • GSK MCP:          http://localhost:3001/mcp"
Write-Host "  • OmniRoute:        http://localhost:20128"
Write-Host "  • CPL:              http://localhost:3457"
Write-Host ""
Write-Host "Health checks:"
Write-Host "  • curl http://localhost:3001/api/system/status"
Write-Host "  • curl http://localhost:20128/v1/models"
Write-Host "  • curl http://localhost:3457/health"
Write-Host "  • curl http://localhost:3001/mcp/health"