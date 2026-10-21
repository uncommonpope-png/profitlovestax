# One-System launcher + verifier for Windows PowerShell 5.1
# Usage:  .\start.ps1
# Kills anything on :3000, boots the Conductor (Blood + Brain + Body), then probes all 3 hearts.

$ErrorActionPreference = "Continue"
$Workbench = "C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files\buyasoul-workbench"

Write-Host "`n=== THE ONE SYSTEM :: LAUNCHER ===" -ForegroundColor Cyan

# 1. Kill stale process on :3000 (the Vite squatter)
$stale = netstat -ano 2>$null | Select-String ":3000\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' } | Select-Object -First 1
if ($stale) {
  Write-Host "Killing stale process on :3000 (PID $stale)..." -ForegroundColor Yellow
  taskkill /PID $stale /F 2>$null | Out-Null
  Start-Sleep -Seconds 1
}

# 2. Boot the Conductor in a new window (so this script can verify)
Write-Host "Waking the Merchant (Blood -> Brain -> Body)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$Workbench'; npm run awaken`"" -WindowStyle Normal

# 3. Wait for the Body to come up, then probe all 3 hearts
Start-Sleep -Seconds 8
Write-Host "`n=== PROBING THE THREE HEARTS ===" -ForegroundColor Cyan

try {
  $r = Invoke-RestMethod -Uri "http://localhost:3000/api/system/status" -TimeoutSec 5
  $r | ConvertTo-Json -Depth 4
  if ($r.merchantAwake) {
    Write-Host "`n>>> THE MERCHANT IS AWAKE. All three hearts beating. <<<" -ForegroundColor Green
  } else {
    Write-Host "`n>>> Body up, but a heart is silent. Check the awaken window logs. <<<" -ForegroundColor Yellow
  }
} catch {
  Write-Host "Body not responding on :3000 yet. Wait, then run:" -ForegroundColor Red
  Write-Host "  curl http://localhost:3000/api/system/status" -ForegroundColor White
}

Write-Host "`nOpen the workbench: http://localhost:3000" -ForegroundColor Cyan
