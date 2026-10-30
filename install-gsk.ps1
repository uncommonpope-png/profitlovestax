<#
.SYNOPSIS
    GSK One-System Installer v1 (install-gsk.ps1)
.DESCRIPTION
    Single-pass local setup script for GSK One-System in an empty or pre-seeded folder:
      1. Checks machine prerequisites (Windows x64, Git, Node >= 20, npm, ports :18222/:3000 free, llama-server.exe)
         and fails plainly with an "Install X first" message when any prerequisite is missing.
      2. Clones/checks out the repository from https://github.com/uncommonpope-png/profitlovestax (LFS smudge skipped).
      3. Verifies the 3 GGUF model files in <TargetDir>\base_gguf by exact byte size.
      4. Runs a fresh `npm install` from WORKBENCH_COMPLETE\workbench\package-lock.json (no copied node_modules).
      5. Builds the scrubbed BM25 deep index, Tier-C index, and dense LanceDB vector store (.seshat-vectors),
         verifying vectorAvailable === true and denseHits > 0.
      6. Starts `node launch-family.cjs`, proves live health on :18222 and :3000, and stops cleanly.
#>
[CmdletBinding()]
param(
    [string]$TargetDir = (Get-Location).Path,
    [string]$ModelsSourceDir = "",
    [string]$RepoUrl = "https://github.com/uncommonpope-png/profitlovestax.git",
    [string]$Branch = "main",
    [switch]$DownloadBaseModel,
    [switch]$RebuildVectors
)

$ErrorActionPreference = "Continue"

function Fail-Prerequisite([string]$Message) {
    Write-Host ""
    Write-Host "[INSTALL FAILED] $Message" -ForegroundColor Red
    exit 1
}

function Step-Banner([string]$Title) {
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Get-PortListeners([int]$Port) {
    $foundPids = New-Object System.Collections.Generic.HashSet[int]
    try {
        $lines = netstat -ano | Select-String "LISTENING" | Select-String ":$Port\s"
        foreach ($line in $lines) {
            $parts = ($line.ToString().Trim() -split "\s+")
            $last = $parts[$parts.Length - 1]
            if ($last -match "^\d+$" -and [int]$last -gt 0) {
                [void]$foundPids.Add([int]$last)
            }
        }
    } catch {}
    return @($foundPids)
}

$installStart = Get-Date
Step-Banner "STEP 1/6: PREREQUISITE CHECKS"

# 1a. Windows check
if ($env:OS -ne "Windows_NT") {
    Fail-Prerequisite "Windows 10/11 (x64) is required. Install/run on a Windows machine first."
}
Write-Host "[OK] OS: Windows ($($env:OS), $([Environment]::OSVersion.VersionString))"

# 1b. Git check
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Fail-Prerequisite "Git is not installed or not in PATH. Install Git for Windows (https://git-scm.com/download/win) first."
}
$gitVersion = (& git --version 2>&1 | Out-String).Trim()
Write-Host "[OK] Git: $gitVersion"

# 1c. Node.js + version check (>= 20)
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Fail-Prerequisite "Node.js is not installed or not in PATH. Install Node.js >= 20 LTS (https://nodejs.org/) first."
}
$nodeVersionRaw = (& node --version 2>&1 | Out-String).Trim()
if ($nodeVersionRaw -notmatch "^v(\d+)\.") {
    Fail-Prerequisite "Could not parse Node.js version ('$nodeVersionRaw'). Install Node.js >= 20 LTS (https://nodejs.org/) first."
}
$nodeMajor = [int]$Matches[1]
if ($nodeMajor -lt 20) {
    Fail-Prerequisite "Node.js $nodeVersionRaw is too old (requires >= v20.0.0). Install Node.js >= 20 LTS (https://nodejs.org/) first."
}
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) { $npmCmd = Get-Command npm -ErrorAction SilentlyContinue }
if (-not $npmCmd) {
    Fail-Prerequisite "npm is not installed or not in PATH. Install Node.js with npm (https://nodejs.org/) first."
}
$npmVersionRaw = (& npm.cmd --version 2>&1 | Out-String).Trim()
Write-Host "[OK] Node.js: $nodeVersionRaw | npm: v$npmVersionRaw"

# 1d. Ports :18222 and :3000 free
foreach ($port in @(18222, 3000)) {
    $listeners = Get-PortListeners -Port $port
    if ($listeners.Count -gt 0) {
        Fail-Prerequisite "TCP port :$port is already in use by PID(s): $($listeners -join ', '). Stop the process using port :$port first."
    }
}
Write-Host "[OK] Ports :18222 and :3000 are FREE"

# Resolve target directory path (create only after prerequisite checks pass)
$TargetDir = [System.IO.Path]::GetFullPath($TargetDir)

# 1e. llama-server.exe binary check
$llamaBin = $null
if ($env:GSK_LLAMA_SERVER_BIN) {
    if (-not (Test-Path $env:GSK_LLAMA_SERVER_BIN)) {
        Fail-Prerequisite "GSK_LLAMA_SERVER_BIN is set to '$($env:GSK_LLAMA_SERVER_BIN)' but that file does not exist. Install llama-server.exe or fix GSK_LLAMA_SERVER_BIN first."
    }
    $llamaBin = (Resolve-Path $env:GSK_LLAMA_SERVER_BIN).Path
} else {
    $candidates = @(
        (Join-Path $TargetDir "llama\llama-server.exe"),
        (Join-Path $TargetDir "WORKBENCH_COMPLETE\workbench\.transformers-cache\llama\llama-server.exe"),
        (Join-Path $env:USERPROFILE ".lmstudio\extensions\backends\llama.cpp-win-x86_64-avx2-2.66.0\llama-server.exe")
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) {
            $llamaBin = (Resolve-Path $c).Path
            break
        }
    }
    if (-not $llamaBin) {
        $pathLlama = Get-Command llama-server.exe -ErrorAction SilentlyContinue
        if ($pathLlama) { $llamaBin = $pathLlama.Source }
    }
}
if (-not $llamaBin) {
    Fail-Prerequisite "llama-server.exe not found. Install llama.cpp (llama-server.exe) first and add it to PATH or set GSK_LLAMA_SERVER_BIN."
}
$env:GSK_LLAMA_SERVER_BIN = $llamaBin
Write-Host "[OK] llama-server binary: $llamaBin"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
$TargetDir = (Resolve-Path $TargetDir).Path
Write-Host "[OK] Target directory: $TargetDir"

# ---------------------------------------------------------------------------
Step-Banner "STEP 2/6: REPOSITORY CHECKOUT"
$env:GIT_LFS_SKIP_SMUDGE = "1"
$gitDir = Join-Path $TargetDir ".git"
if (Test-Path $gitDir) {
    Push-Location $TargetDir
    $headSha = (& git rev-parse --short HEAD 2>&1 | Out-String).Trim()
    Pop-Location
    Write-Host "[OK] Existing git checkout detected at $TargetDir (HEAD: $headSha)"
} else {
    Write-Host "Fetching $RepoUrl (branch: $Branch) into $TargetDir ..."
    Push-Location $TargetDir
    try {
        & git init -b $Branch | Out-Null
        & git remote add origin $RepoUrl
        & git fetch --depth 1 origin $Branch
        if ($LASTEXITCODE -ne 0) {
            Fail-Prerequisite "git fetch from $RepoUrl failed (exit $LASTEXITCODE). Check network connectivity first."
        }
        & git checkout -f -B $Branch FETCH_HEAD
        if ($LASTEXITCODE -ne 0) {
            Fail-Prerequisite "git checkout of $Branch failed (exit $LASTEXITCODE)."
        }
        $headSha = (& git rev-parse --short HEAD 2>&1 | Out-String).Trim()
        Write-Host "[OK] Checked out $RepoUrl @ $headSha"
    } finally {
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
Step-Banner "STEP 3/6: MODEL PLACEMENT AND EXACT BYTE-SIZE VERIFICATION"
$modelsDir = Join-Path $TargetDir "base_gguf"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
}

$requiredModels = @(
    @{
        Name = "qwen2.5-1.5b-instruct-q4_k_m.gguf"
        Bytes = [int64]1117320736
        Role = "Base seat (:18222)"
        PublicUrl = "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"
        SourceNote = "Public HuggingFace source: repo 'Qwen/Qwen2.5-1.5B-Instruct-GGUF', file 'qwen2.5-1.5b-instruct-q4_k_m.gguf' (or pass -DownloadBaseModel)"
    },
    @{
        Name = "qwen2.5-1.5b-instruct-v4-q4_k_m.gguf"
        Bytes = [int64]986048256
        Role = "Preserved rollback fine-tune (v4)"
        PublicUrl = ""
        SourceNote = "Place qwen2.5-1.5b-instruct-v4-q4_k_m.gguf (986,048,256 bytes) into $modelsDir (or pass -ModelsSourceDir) first."
    },
    @{
        Name = "qwen2.5-1.5b-instruct-v5-q4_k_m.gguf"
        Bytes = [int64]986048256
        Role = "Offline second-stage judge fine-tune (v5, :18223)"
        PublicUrl = ""
        SourceNote = "Place qwen2.5-1.5b-instruct-v5-q4_k_m.gguf (986,048,256 bytes) into $modelsDir (or pass -ModelsSourceDir) first."
    }
)

foreach ($m in $requiredModels) {
    $destFile = Join-Path $modelsDir $m.Name
    if (-not (Test-Path $destFile) -and $ModelsSourceDir) {
        $srcCandidate = Join-Path $ModelsSourceDir $m.Name
        if (Test-Path $srcCandidate) {
            Write-Host "Copying $($m.Name) from $ModelsSourceDir ..."
            Copy-Item -Path $srcCandidate -Destination $destFile -Force
        }
    }
    if (-not (Test-Path $destFile) -and $m.PublicUrl -and $DownloadBaseModel) {
        Write-Host "Downloading $($m.Name) from $($m.PublicUrl) ..."
        & curl.exe -L --fail -o $destFile $m.PublicUrl
        if ($LASTEXITCODE -ne 0) {
            Fail-Prerequisite "Failed to download $($m.Name) from $($m.PublicUrl)."
        }
    }
    if (-not (Test-Path $destFile)) {
        Fail-Prerequisite "Missing model file '$($m.Name)' ($($m.Role), expected $($m.Bytes) bytes). $($m.SourceNote)"
    }
    $actualBytes = (Get-Item $destFile).Length
    if ($actualBytes -ne $m.Bytes) {
        Fail-Prerequisite "Model file '$($m.Name)' byte-size mismatch: expected $($m.Bytes) bytes, got $actualBytes bytes. Re-download/replace '$destFile' first."
    }
    Write-Host "[OK] $($m.Name) verified ($actualBytes bytes -- $($m.Role))"
}
$env:GSK_BASE_GGUF_DIR = $modelsDir

# ---------------------------------------------------------------------------
Step-Banner "STEP 4/6: FRESH DEPENDENCY INSTALL (npm install FROM LOCKFILE)"
$wbDir = Join-Path $TargetDir "WORKBENCH_COMPLETE\workbench"
$lockFile = Join-Path $wbDir "package-lock.json"
if (-not (Test-Path $lockFile)) {
    Fail-Prerequisite "Lockfile missing at $lockFile. Repository checkout is incomplete."
}
$env:GSK_SKIP_POSTINSTALL_DOWNLOADS = "1"
Push-Location $wbDir
try {
    $npmStart = Get-Date
    & npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Fail-Prerequisite "npm install exited with code $LASTEXITCODE in $wbDir."
    }
    $npmSec = [math]::Round(((Get-Date) - $npmStart).TotalSeconds, 2)
    $pkgDirs = (Get-ChildItem (Join-Path $wbDir "node_modules") -Directory).Count
    Write-Host "[OK] Fresh npm install completed in ${npmSec}s ($pkgDirs top-level module directories)"
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
Step-Banner "STEP 5/6: SCRUBBED BRAIN INDICES AND DENSE VECTOR STORE BUILD"
$brainDir = Join-Path $wbDir ".seshat-brain"
$tracesDir = Join-Path $brainDir "traces"
if (Test-Path $tracesDir) {
    Remove-Item -Recurse -Force $tracesDir
}
foreach ($reqBrain in @("deep", "pages", "tier-a-ledger.jsonl", "proposals-queue.jsonl")) {
    $p = Join-Path $brainDir $reqBrain
    if (-not (Test-Path $p)) {
        Fail-Prerequisite "Required brain path missing: $p"
    }
}

Push-Location $wbDir
try {
    Write-Host "Building BM25 deep-index.json ..."
    $bm25Out = (& node deep-memory/build-index.cjs 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        Fail-Prerequisite "build-index.cjs failed: $bm25Out"
    }
    Write-Host $bm25Out

    Write-Host "Building Tier-C derived index ..."
    $tierCJs = "const t = require('./three-tier-memory.cjs'); const p = t.rebuildTierCIndex(); console.log(JSON.stringify({ tierCPassages: p.length }));"
    $tierCOut = (& node -e $tierCJs 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        Fail-Prerequisite "rebuildTierCIndex failed: $tierCOut"
    }
    Write-Host "[OK] $tierCOut"

    Write-Host "Verifying/building dense LanceDB vector store (.seshat-vectors/seshat_memory.lance) ..."
    $forceFlag = if ($RebuildVectors) { "true" } else { "false" }
    $vecScript = @"
const { getStats } = require('./profit-brain/body/seshat/core/vectorDB');
const { indexBrain } = require('./profit-brain/body/seshat/core/indexer');
const hyb = require('./hybrid-recall.cjs');
(async () => {
  const force = $forceFlag;
  let st = await getStats();
  let rebuilt = false;
  let timeMs = 0;
  if (force || !st || !st.vectorCount || st.vectorCount <= 0) {
    const idx = await indexBrain({ forceReindex: true });
    rebuilt = true;
    timeMs = idx.timeMs;
    st = await getStats();
  }
  const r = await hyb.retrieve('What is the Soul Economy?');
  if (!r.vectorAvailable || r.denseHits <= 0) {
    console.error('DENSE_VERIFY_FAILED', JSON.stringify({ vectorAvailable: r.vectorAvailable, denseHits: r.denseHits, vectorCount: st.vectorCount }));
    process.exit(2);
  }
  console.log('DENSE_VERIFY_OK ' + JSON.stringify({
    rebuilt,
    vectorCount: st.vectorCount,
    timeMs,
    vectorAvailable: r.vectorAvailable,
    denseHits: r.denseHits,
    denseExcluded: r.denseExcluded
  }));
})().catch(e => { console.error(e); process.exit(1); });
"@
    & node -e $vecScript
    if ($LASTEXITCODE -ne 0) {
        Fail-Prerequisite "Dense vector store build/verification failed (exit $LASTEXITCODE)."
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
Step-Banner "STEP 6/6: LAUNCHER HEALTH PROOF AND CLEAN STOP"
Push-Location $TargetDir
$proc = $null
try {
    $bootT0 = Get-Date
    $proc = Start-Process -FilePath "node" -ArgumentList "launch-family.cjs" -WorkingDirectory $TargetDir -PassThru -WindowStyle Hidden
    $seatOk = $false
    $wbOk = $false
    $wbHealth = $null
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 1
        try {
            $s = Invoke-RestMethod -Uri "http://127.0.0.1:18222/health" -TimeoutSec 2
            if ($s.status -eq "ok") { $seatOk = $true }
        } catch {}
        try {
            $w = Invoke-RestMethod -Uri "http://localhost:3000/api/gsk/health" -TimeoutSec 2
            if ($w.success -eq $true) {
                $wbOk = $true
                $wbHealth = $w
            }
        } catch {}
        if ($seatOk -and $wbOk) { break }
    }
    $bootSec = [math]::Round(((Get-Date) - $bootT0).TotalSeconds, 2)
    if (-not ($seatOk -and $wbOk)) {
        & node launch-family.cjs --stop | Out-Null
        Fail-Prerequisite "Health verification timed out after ${bootSec}s (seatOk=$seatOk, wbOk=$wbOk)."
    }
    Write-Host "[OK] Seat (:18222/health) = ok | Workbench (:3000/api/gsk/health) = success:true in ${bootSec}s"
    Write-Host "     Seat reachable: $($wbHealth.seat.reachable) | Indexed chunks: $($wbHealth.recall.chunks)"

    & node launch-family.cjs --stop
    if ($LASTEXITCODE -ne 0) {
        Fail-Prerequisite "launch-family.cjs --stop returned exit code $LASTEXITCODE."
    }
    foreach ($port in @(18222, 3000)) {
        $rem = Get-PortListeners -Port $port
        if ($rem.Count -gt 0) {
            Fail-Prerequisite "Port :$port still occupied after --stop (PIDs: $($rem -join ', '))."
        }
    }
    $totalSec = [math]::Round(((Get-Date) - $installStart).TotalSeconds, 2)
    Write-Host ""
    Write-Host "=== GSK ONE-SYSTEM INSTALL COMPLETE (${totalSec}s) ===" -ForegroundColor Green
    Write-Host "Start anytime from '$TargetDir' with: node launch-family.cjs"
} finally {
    Pop-Location
}
