$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\Program Files\nodejs\node.exe"
$psi.Arguments = "C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js tsx server.ts"
$psi.WorkingDirectory = "C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files\WORKBENCH_COMPLETE\workbench"
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($psi)
Write-Host "Launched server.ts as detached process"

