$proc = Start-Process -WorkingDirectory "WORKBENCH_COMPLETE\workbench" -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList `"C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js`","tsx","server.ts" -PassThru -RedirectStandardOutput "WORKBENCH_COMPLETE\workbench\server-out.log" -RedirectStandardError "WORKBENCH_COMPLETE\workbench\server-err.log"
Write-Host "Server PID: $($proc.Id)"
Start-Sleep -Seconds 5
Write-Host "Checking ports..."
netstat -ano | findstr "LISTENING" | findstr -E ":(20128|3000|3001|3457|4000)"

