$taskName = "BuyaSOUL_WB_Test"
$tr = "'C:\Program Files\nodejs\node.exe' "C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js" tsx server.ts"

# Create one-time scheduled task
schtasks /Create /TN $taskName /TR $tr /SC ONCE /ST 23:59 /RU System /F 2>$null

# Run it immediately
schtasks /Run /TN $taskName 2>$null
Write-Host "Task launched, waiting..."

# Wait and check
Start-Sleep -Seconds 10

# Check ports
netstat -ano | findstr LISTENING | findstr ":3000"
netstat -ano | findstr LISTENING | findstr ":20128"

# Clean up
schtasks /Delete /TN $taskName /F 2>$null
Write-Host "Task cleaned up"

