# ═══════════════════════════════════════════════════════════
# START-ONE-SYSTEM.ps1 — Independent life for the stack.
# Parents all organs to THIS script's hidden host, NOT to any
# editor/agent shell. Survives opencode restarts & reboots
# (when registered via register-task).
# ═══════════════════════════════════════════════════════════
param([switch]$HibernateGsk)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$wb   = Join-Path $root "workbench"
$log  = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $log | Out-Null
if ($HibernateGsk) { $env:GSK_HIBERNATE = "1"; Write-Host "[ONE-SYSTEM] GSK will HIBERNATE (soul asleep, body awake)" }

function Kill-PortOwner([int]$port) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($c) { $c | ForEach-Object { taskkill /F /PID $_.OwningProcess 2>$null | Out-Null } }
}

# Clean slate on our four ports (anti-race at OS level)
3000,3001,20128,3457 | ForEach-Object { Kill-PortOwner $_ }
Start-Sleep -Seconds 2

Write-Host "[ONE-SYSTEM] Cold boot from $root"

# The conductor spawns GSK/OmniRoute/CPL children itself (anti-race sweep inside)
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npx tsx server.ts" `
    -WorkingDirectory $wb `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $log "conductor.log") `
    -RedirectStandardError  (Join-Path $log "conductor.err.log")

# Wait for :3000 then report organ health
$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 3
    $up = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in 3000,3001,20128,3457 })
    if ($up.Count -ge 3) { break }
}
try {
    $a = Invoke-RestMethod "http://127.0.0.1:3000/api/audit-integrity" -TimeoutSec 15
    Write-Host "[ONE-SYSTEM] Integrity score $($a.score) -> $($a.verdict)"
} catch {
    Write-Host "[ONE-SYSTEM] Booted but integrity probe not ready yet (check logs\conductor.log)"
}
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in 3000,3001,20128,3457 } |
    ForEach-Object { Write-Host ("  port {0} pid {1}" -f $_.LocalPort, $_.OwningProcess) }
