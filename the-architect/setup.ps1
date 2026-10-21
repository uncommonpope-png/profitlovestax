# ARCHITECT Auto-Setup Script
# Run: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  The ARCHITECT v1.0.0 Setup" -ForegroundColor Cyan
Write-Host "  Master of System Design" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host " Node.js not found. Please install Node.js 14+" -ForegroundColor Red
    exit 1
}
Write-Host " Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version 2>$null
Write-Host " npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Create .architect-memory.json if not exists
$memoryFile = ".architect-memory.json"
if (-not (Test-Path $memoryFile)) {
    Write-Host " Creating default memory file..." -ForegroundColor Yellow
    @{
        userPreferences = @{
            favoritePatterns = @{}
            preferredLanguage = "typescript"
            preferredStyle = "modular"
            preferredDatabase = "postgresql"
            preferredTesting = "jest"
            preferredDocs = "swagger"
            complexityTolerance = "high"
        }
        pastDesigns = @()
        agentInteractions = @()
        designStats = @{
            totalDesigned = 0
            totalSystems = 0
            successRate = 1.0
            averageDesignTime = 0
            lastDesigned = $null
            frequentlyDesigned = @()
        }
        patternAffinity = @{
            "hexagonal+ddd" = 0.5
            "nestjs+typeorm" = 0.5
            "xstate+react" = 0.5
            "cqrs+event-sourcing" = 0.5
            "inversify+hexagonal" = 0.5
            "modular-monolith+ddd" = 0.5
        }
        evolutionScore = 0
    } | ConvertTo-Json -Depth 10 | Set-Content $memoryFile
    Write-Host " Memory file created: $memoryFile" -ForegroundColor Green
} else {
    Write-Host " Memory file exists: $memoryFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Quick Start:" -ForegroundColor Yellow
Write-Host "   architect design my-system" -ForegroundColor White
Write-Host "   architect generate hexagonal my-service" -ForegroundColor White
Write-Host "   architect recommend 'scalable API'" -ForegroundColor White
Write-Host "   architect decompose 'e-commerce platform'" -ForegroundColor White
Write-Host "   architect swarm init" -ForegroundColor White
Write-Host ""
Write-Host " Documentation:" -ForegroundColor Yellow
Write-Host "   docs/architecture-guide.md" -ForegroundColor White
Write-Host "   docs/patterns-reference.md" -ForegroundColor White
Write-Host "   examples/hexagonal-example.js" -ForegroundColor White
Write-Host "   examples/nestjs-example.js" -ForegroundColor White
Write-Host "   examples/xstate-example.js" -ForegroundColor White
Write-Host "   examples/inversify-example.js" -ForegroundColor White
Write-Host ""
Write-Host " The ARCHITECT says:" -ForegroundColor Magenta
Write-Host '   "Design for change. Build for the future."' -ForegroundColor Magenta
Write-Host ""
