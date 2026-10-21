<#
BUYaSOUL ONE SYSTEM - Health Check Script for Windows
Run: .\health-check.ps1
#>

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BUYaSOUL ONE SYSTEM — Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

function Check-Service {
    param($Name, $Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name: $Url" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Name: $Url (HTTP $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Name: $Url (unreachable)" -ForegroundColor Red
        return $false
    }
}

function Check-Json {
    param($Name, $Url, $Filter)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
        $json = $response.Content | ConvertFrom-Json
        if ($json.$Filter) {
            Write-Host "✅ $Name: $Url" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $Name: $Url (filter '$Filter' failed)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $Name: $Url (unreachable or invalid JSON)" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "🔍 Checking core services..." -ForegroundColor Cyan
Write-Host ""

# System status
Check-Json "System Status" "http://localhost:3001/api/system/status" "success"

# Individual services
Check-Json "OmniRoute Models" "http://localhost:20128/v1/models" "data"
Check-Json "GSK MCP Health" "http://localhost:3001/mcp/health" "status"
Check-Json "CPL Health" "http://localhost:3457/health" "ok"
Check-Json "CPL MCP Health" "http://localhost:3457/mcp/health" "status"

# Workbench API
Check-Json "Workbench API" "http://localhost:3001/api/gsk/status" "success"
Check-Json "Soul Economy" "http://localhost:3001/api/soul-economy/catalog" "success"

# Vite dev server
Check-Service "Workbench UI (Vite)" "http://localhost:3000"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Health check complete" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan