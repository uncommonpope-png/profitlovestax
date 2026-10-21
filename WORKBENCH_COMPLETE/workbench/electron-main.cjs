'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn, spawnSync, execSync } = require('child_process');

let mainWindow;
let omnirouteProcess = null;
let omniroutePid = null;
let workbenchProcess = null;

const OMNIROUTE_PORT = 20128;
const WORKBENCH_PORT = 3000;
const GH_OMNIROUTE_URL = 'https://github.com/diegosouzapw/OmniRoute';
const RUNTIME_ZIP_URL = 'https://github.com/uncommonpope-png/soul-economy/releases/download/buyasoul-runtime/seshat-runtime.zip';
const RUNTIME_ZIP_HINT = 'seshat-runtime';

// Writable runtime dir (a beginner's machine may not have write access inside app install dir)
const RUNTIME_DIR = process.env.SESHA_RUNTIME_DIR || path.join(app.getPath('userData'), 'runtime');
process.env.SESHA_RUNTIME_DIR = RUNTIME_DIR;
process.env.RUNTIME_ZIP_URL = RUNTIME_ZIP_URL;

const RUNTIME_DIR_LLAMA = path.join(RUNTIME_DIR, 'llama', 'llama-cli.exe');
const RUNTIME_DIR_MODEL = path.join(RUNTIME_DIR, 'qwen3.5-0.8b-q4_0.gguf');

function log(msg) {
  const line = `[FAMILY] ${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(path.join(RUNTIME_DIR, 'family-boot.log'), line + '\n'); } catch {}
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port);
  });
}

// ---------- FIRST-RUN: Create desktop/Start Menu shortcuts for the portable exe ----------
function ensureShortcuts() {
  try {
    const marker = path.join(RUNTIME_DIR, '.shortcuts_created');
    if (fs.existsSync(marker)) return; // Already done

    const exePath = process.execPath;
    const name = 'BUYASOUL Workbench';
    const desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop', name + '.lnk');
    const ps = `$s=(New-Object -ComObject WScript.Shell).CreateShortcut("${desktopPath}");$s.TargetPath="${exePath}";$s.WorkingDirectory="${path.dirname(exePath)}";$s.IconLocation="${exePath}";$s.Save()`;
    spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore', timeout: 15000 });

    // Start Menu (optional)
    const startMenu = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', name + '.lnk');
    if (fs.existsSync(path.dirname(startMenu))) {
      const ps2 = `$s=(New-Object -ComObject WScript.Shell).CreateShortcut("${startMenu}");$s.TargetPath="${exePath}";$s.WorkingDirectory="${path.dirname(exePath)}";$s.IconLocation="${exePath}";$s.Save()`;
      spawnSync('powershell', ['-NoProfile', '-Command', ps2], { stdio: 'ignore', timeout: 10000 });
    }

    fs.writeFileSync(marker, Date.now().toString());
    log('Desktop/Start Menu shortcuts created');
  } catch (e) { log('Shortcut creation skipped: ' + e.message); }
}

// ---------- STEP 1: OmniRoute (blood flow) — adopt alive, else pull from GitHub + adopt ----------
function gitInstalled() {
  try { return spawnSync('git', ['--version'], { encoding: 'utf8', timeout: 8000 }).status === 0; }
  catch { return false; }
}
function npmInstalled() {
  try { return spawnSync('npm', ['--version'], { encoding: 'utf8', timeout: 8000 }).status === 0; }
  catch { return false; }
}

async function adoptOmniroute() {
  // 1) Already running? ADOPT BLOOD, NEVER KILL.
  if (await checkPort(OMNIROUTE_PORT)) {
    log('Omniroute already alive on :20128 — ADOPTING blood flow');
    updateLoading('Adopted living OmniRoute (blood flow already beating)');
    return { adopted: true, pid: null };
  }

  const runtimeOmniDir = path.join(RUNTIME_DIR, 'omniroute');
  const hasRuntimeInstall = fs.existsSync(path.join(runtimeOmniDir, 'package.json'));

  // 2) We have a pulled copy from a previous run? Start it.
  if (hasRuntimeInstall) {
    updateLoading('Starting OmniRoute (blood flow :20128) from local runtime...');
    omnirouteProcess = spawn('node', ['scripts/dev/run-next.mjs', 'start'], {
      cwd: runtimeOmniDir, stdio: 'inherit', shell: true,
      env: { ...process.env, OMNIROUTE_ALREADY_UP: '1' }
    });
    omnirouteProcess.on('error', (err) => log('Omniroute start error: ' + err.message));
    await new Promise(r => setTimeout(r, 3000));
    if (await checkPort(OMNIROUTE_PORT)) { updateLoading('OmniRoute blood flow: :20128 LIVE'); return { adopted: false, pid: omnirouteProcess.pid }; }
    log('Runtime omniroute did not come up — continuing');
  }

  // 3) Pull from GitHub (one-time). Beginner friendly: it just happens.
  if (gitInstalled() && npmInstalled()) {
    updateLoading('Pulling OmniRoute from GitHub (one time — this is the blood flow, auto-setup)...');
    log('Cloning OmniRoute from GitHub into ' + runtimeOmniDir);
    try {
      if (!fs.existsSync(runtimeOmniDir)) {
        execSync(`git clone --depth 1 ${GH_OMNIROUTE_URL} "${runtimeOmniDir}"`, { stdio: 'ignore', timeout: 600000 });
      }
      updateLoading('Installing OmniRoute dependencies (one time, ~2-5 min)...');
      execSync('npm install --no-audit --no-fund', { cwd: runtimeOmniDir, stdio: 'ignore', timeout: 900000 });
      updateLoading('Starting OmniRoute blood flow :20128...');
      omnirouteProcess = spawn('node', ['scripts/dev/run-next.mjs', 'start'], {
        cwd: runtimeOmniDir, stdio: 'inherit', shell: true,
        env: { ...process.env, OMNIROUTE_ALREADY_UP: '1' }
      });
      await new Promise(r => setTimeout(r, 5000));
      if (await checkPort(OMNIROUTE_PORT)) { updateLoading('OmniRoute blood flow: :20128 LIVE'); return { adopted: false, pid: omnirouteProcess.pid }; }
    } catch (e) {
      log('OmniRoute GitHub pull failed: ' + e.message);
      updateLoading('OmniRoute not live yet — family boots on Seshat local brain anyway');
    }
  } else {
    updateLoading('Git/npm not found — family boots on Seshat local brain (Seshat is a REAL local LLM)');
  }
  return { adopted: false, pid: null };
}

// ---------- STEP 2: Seshat Qwen runtime (local brain) — pull once + adopt ----------
async function ensureSeshatRuntime() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  if (fs.existsSync(RUNTIME_DIR_LLAMA) && fs.existsSync(RUNTIME_DIR_MODEL)) {
    updateLoading('Seshat local brain present (Qwen 0.8B) — adopting...');
    return true;
  }

  // Try bundled copy first (app ships a seed, or .transformers-cache in dev)
  const seedDirs = [
    path.join(process.resourcesPath || '', '.transformers-cache'),
    path.join(__dirname, '.transformers-cache'),
    path.join(__dirname, '..', '..', '.transformers-cache'),
  ];
  for (const seed of seedDirs) {
    try {
      if (fs.existsSync(path.join(seed, 'llama', 'llama-cli.exe')) && fs.existsSync(path.join(seed, 'qwen3.5-0.8b-q4_0.gguf'))) {
        updateLoading('Copying Seshat local brain into runtime (one time)...');
        fs.cpSync(path.join(seed, 'llama'), path.join(RUNTIME_DIR, 'llama'), { recursive: true });
        fs.copyFileSync(path.join(seed, 'qwen3.5-0.8b-q4_0.gguf'), path.join(RUNTIME_DIR, 'qwen3.5-0.8b-q4_0.gguf'));
        return true;
      }
    } catch {}
  }

  // Pull from soul-economy (one-time ~550MB for first boot)
  updateLoading('Pulling Seshat local brain (Qwen 0.8B) from soul-economy — one-time, ~550MB...');
  updateLoading('No AI cloud. No API keys. This is YOUR family, 100% local.');
  log('Downloading Seshat runtime from ' + RUNTIME_ZIP_URL);
  const https = require('https');
  const zipPath = path.join(RUNTIME_DIR, RUNTIME_ZIP_HINT + '.zip');
  await new Promise((resolve, reject) => {
    const req = https.get(RUNTIME_ZIP_URL, { headers: { 'User-Agent': 'buyasoul-family' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const r2 = https.get(res.headers.location, (res2) => {
          if (res2.statusCode !== 200) return reject(new Error('HF zip HTTP ' + res2.statusCode));
          const total = parseInt(res2.headers['content-length'] || '0', 10);
          let downloaded = 0;
          let lastTick = 0;
          const stream = fs.createWriteStream(zipPath);
          res2.on('data', chunk => {
            downloaded += chunk.length;
            const now = Date.now();
            if (total > 0 && now - lastTick > 1000) {
              const pct = Math.round((downloaded / total) * 100);
              updateLoading('Downloading Seshat brain: ' + pct + '%');
              lastTick = now;
            }
          });
          res2.pipe(stream);
          stream.on('finish', () => stream.close(() => resolve()));
          stream.on('error', reject);
        }); r2.on('error', reject); return;
      }
      if (res.statusCode !== 200) return reject(new Error('HF zip HTTP ' + res.statusCode));
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let lastTick = 0;
      const stream = fs.createWriteStream(zipPath);
      res.on('data', chunk => {
        downloaded += chunk.length;
        const now = Date.now();
        if (total > 0 && now - lastTick > 1000) {
          const pct = Math.round((downloaded / total) * 100);
          updateLoading('Downloading Seshat brain: ' + pct + '%');
          lastTick = now;
        }
      });
      res.pipe(stream);
      stream.on('finish', () => stream.close(() => resolve()));
      stream.on('error', reject);
    });
    req.on('error', reject);
  });
  updateLoading('Unpacking Seshat brain...');
  try {
    const unpackDir = path.join(RUNTIME_DIR, '_unpack');
    fs.mkdirSync(unpackDir, { recursive: true });
    spawnSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${unpackDir}' -Force`], { stdio: 'ignore', timeout: 300000 });
    const llamaFrom = path.join(unpackDir, 'llama');
    if (fs.existsSync(llamaFrom)) fs.cpSync(llamaFrom, path.join(RUNTIME_DIR, 'llama'), { recursive: true });
    const modelFrom = path.join(unpackDir, 'qwen3.5-0.8b-q4_0.gguf');
    if (fs.existsSync(modelFrom)) fs.copyFileSync(modelFrom, path.join(RUNTIME_DIR, 'qwen3.5-0.8b-q4_0.gguf'));
    fs.rmSync(unpackDir, { recursive: true, force: true });
  } catch (e) { log('Unpack error: ' + e.message); }
  try { fs.unlinkSync(zipPath); } catch {}
  if (fs.existsSync(RUNTIME_DIR_LLAMA) && fs.existsSync(RUNTIME_DIR_MODEL)) {
    updateLoading('Seshat local brain ready (Qwen 0.8B, 100% local, zero token burn)');
    return true;
  }
  updateLoading('Seshat brain unavailable — family will still boot');
  return false;
}

// ---------- Reap stale daemons (NEVER Omniroute :20128 = blood flow) ----------
function reapStaleDaemons() {
  const stalePorts = ["3000", "3001", "3002", "3457", "4000", "4492", "61004"];
  const pids = new Set();
  for (const p of stalePorts) {
    try {
      const out = execSync(`netstat -ano | findstr LISTENING | findstr :${p} `, { encoding: "utf8" });
      out.trim().split(/\s+/).filter(t => /^\d+$/.test(t)).forEach(x => pids.add(x));
    } catch {}
  }
  if (pids.size) {
    log("[CLEANUP] Reaping stale daemons: " + [...pids].join(" "));
    pids.forEach(pid => {
      try { execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore", timeout: 6000 }); } catch {}
    });
  } else {
    log("[CLEANUP] No stale daemons found");
  }
}

// ---------- STEP 3: Workbench server ----------
async function initializeWorkbench(bloodAdopted = false) {
  // P1.1: LOCK, NOT KILL — if :3000 is already live (launcher booted it, or a
  // sibling window), adopt it and touch nothing. The reaper below only runs
  // when :3000 is verified down, so a second shortcut click can never murder
  // the first family again.
  if (await checkPort(WORKBENCH_PORT)) {
    log('Workbench :3000 already live — adopting (no kill, no second family)');
    updateLoading('Adopted live workbench on :3000');
    return;
  }
  reapStaleDaemons();
  try { await ensureSeshatRuntime(); } catch (e) { log('Seshat runtime prep warning: ' + e.message); }

  const isUp = await checkPort(WORKBENCH_PORT);
  if (!isUp) {
    updateLoading('Breathing the family into the workbench (server.ts)...');
    const workbenchDir = __dirname;
    // P1.7: tell the truth — adoption flag set ONLY when we actually adopted
    // living blood. A lie here used to orphan spawned routers on quit.
    const env = { ...process.env, ...(bloodAdopted ? { OMNIROUTE_ALREADY_UP: '1' } : {}), SESHA_RUNTIME_DIR: RUNTIME_DIR };

    // Systems with Node → npx tsx. Packaged apps → bundled node.exe + local tsx (no system Node needed).
    const hasNode = npmInstalled();
    const tsxCli = path.join(workbenchDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const bundledCandidates = [path.join(workbenchDir, 'node-runtime', 'node.exe')];
    if (process.resourcesPath) bundledCandidates.push(path.join(process.resourcesPath, 'node-runtime', 'node.exe'));
    const bundledNode = bundledCandidates.find(p => fs.existsSync(p));
    if (bundledNode) {
      // Ensure child shells (GSK's `node genesis-host.cjs`) can find node on PATH.
      const binDir = path.dirname(bundledNode);
      env.PATH = binDir + path.delimiter + (process.env.PATH || '');
    }
    const useBundled = !hasNode && fs.existsSync(tsxCli) && fs.existsSync(bundledNode);
    if (useBundled) {
      log('No system Node — booting workbench with bundled node.exe (local tsx)');
      workbenchProcess = spawn(bundledNode, [tsxCli, path.join(workbenchDir, 'server.ts')], {
        cwd: workbenchDir, stdio: 'inherit', env
      });
    } else if (!hasNode && fs.existsSync(tsxCli) && process.resourcesPath) {
      // Fallback: Electron's own Node (node-pty ABI may mismatch, but boot proceeds)
      log('No system Node, no bundled node — booting on Electron bundled Node (local tsx)');
      workbenchProcess = spawn(process.execPath, [tsxCli, path.join(workbenchDir, 'server.ts')], {
        cwd: workbenchDir, stdio: 'inherit',
        env: { ...env, ELECTRON_RUN_AS_NODE: '1' }
      });
    } else {
      workbenchProcess = spawn('npx', ['tsx', 'server.ts'], {
        cwd: workbenchDir, stdio: 'inherit', shell: true, env
      });
    }
    workbenchProcess.on('error', (err) => log('Workbench start error: ' + err.message));
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkPort(WORKBENCH_PORT)) { updateLoading('Workbench live on :3000'); break; }
    }
  } else {
    log('Workbench :3000 already live — adopting');
    updateLoading('Adopted workbench on :3000');
  }
}

// ---------- Loading Window (the setup manager a beginner sees) ----------
let loadingWindow = null;

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 520, height: 340, frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, center: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  const html = `
    <html><head><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#05050c;color:#fff;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px}
      .halo{width:72px;height:72px;border-radius:50%;background:radial-gradient(circle, rgba(255,45,158,.35), rgba(0,212,255,.25) 60%, transparent);filter:blur(2px);animation:pulse 1.8s ease-in-out infinite}
      h1{font-size:30px;letter-spacing:4px;background:linear-gradient(90deg,#ff2d9e,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;margin-top:10px}
      .sub{color:#9a9ab8;font-size:11px;letter-spacing:2px;margin-top:6px}
      .bar{width:300px;height:4px;background:#1a1a2e;border-radius:99px;margin-top:20px;overflow:hidden}
      .fill{height:100%;background:linear-gradient(90deg,#ff2d9e,#00d4ff);width:0%;animation:fill 2s ease-in-out infinite}
      .status{color:#00d4ff;font-size:11px;margin-top:14px;font-family:monospace;min-height:28px;max-width:440px;line-height:1.4}
      @keyframes pulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.15);opacity:1}}
      @keyframes fill{0%{width:0%}50%{width:100%}100%{width:0%}}
    </style></head><body>
      <div class="halo"></div>
      <h1>BUYASOUL</h1>
      <div class="sub">PROFIT ♡ LOVE TAX — YOUR FAMILY IS AWAKENING</div>
      <div class="bar"><div class="fill"></div></div>
      <div class="status" id="status">Loading workbench...</div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('loading-status', (e, msg)=>{ document.getElementById('status').innerText = msg; });
      </script>
    </body></html>`;
  loadingWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  loadingWindow.show();
}

function updateLoading(msg) {
  console.log('[LOADING] ' + msg);
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send('loading-status', msg);
  }
}

// ---------- Main Window ----------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    title: 'BUYASOUL — The Profit LoveTax Family',
    icon: path.join(__dirname, 'public', 'icon.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const workbenchUrl = `http://127.0.0.1:${WORKBENCH_PORT}`;
  console.log('[FAMILY] Loading ' + workbenchUrl);
  mainWindow.loadURL(workbenchUrl).catch(() => {
    console.log('[FAMILY] Workbench URL failed, falling back to file');
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  });

  mainWindow.once('ready-to-show', () => {
    if (loadingWindow && !loadingWindow.isDestroyed()) loadingWindow.close();
    mainWindow.show();
    mainWindow.maximize();
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------- Family init (Seshat + Scribe in-process) ----------
async function initializeFamily() {
  try {
    const { initLLM } = require('./profit-brain/body/seshat/core/llm');
    const { initVectorDB } = require('./profit-brain/body/seshat/core/vectorDB');
    const { initEmbedder } = require('./profit-brain/body/seshat/core/embedder');
    const { init: initScribe } = require('./profit-brain/body/scribe-module');
    console.log('[FAMILY] Initializing...');
    await initVectorDB(); console.log('[FAMILY] Vector DB ready');
    await initEmbedder(); console.log('[FAMILY] Embedder ready');
    await initLLM(); console.log('[FAMILY] Seshat ALLM ready');
    await initScribe({ observe: true }); console.log('[FAMILY] Scribe ready');
    console.log('[FAMILY] All systems initialized');
  } catch (err) {
    console.log('[FAMILY] Init warning:', err.message);
  }
}

function shutdownFamily() { console.log('[FAMILY] Shutting down...'); }

// ---------- IPC (Seshat) ----------
ipcMain.handle('seshat-search', async (event, { query, topK = 10 }) => {
  try {
    const { hybridSearch } = require('./profit-brain/body/seshat/core/index.js');
    const results = await hybridSearch(query, topK);
    return { results };
  } catch (err) { console.error('[SESHAT] Search error:', err.message); return { results: [], error: err.message }; }
});
ipcMain.handle('seshat-reason', async (event, { prompt, context }) => {
  try {
    const { think } = require('./profit-brain/body/seshat/core/index.js');
    const result = await think(prompt, context);
    return { response: result, text: result };
  } catch (err) { console.error('[SESHAT] Reason error:', err.message); return { response: 'Error: ' + err.message, error: err.message }; }
});
ipcMain.handle('seshat-synthesize', async (event, { topic, sources }) => {
  try {
    const { synthesize } = require('./profit-brain/body/seshat/core/index.js');
    const result = await synthesize(topic, sources);
    return { synthesized: result, result: result };
  } catch (err) { console.error('[SESHAT] Synthesize error:', err.message); return { synthesized: 'Error: ' + err.message, error: err.message }; }
});

// ---------- Boot : the wizard order ----------
app.whenReady().then(async () => {
  createLoadingWindow();
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch {}

  ensureShortcuts();

  updateLoading('Checking blood flow — OmniRoute :20128...');
  const omni = await adoptOmniroute();

  updateLoading('Breathing Seshat + Scribe into memory...');
  await initializeFamily().catch(e => log('family init: ' + e.message));

  updateLoading('Building workbench — Profit Love Tax family...');
  await initializeWorkbench(omni && omni.adopted === true);

  updateLoading('Family is awake — opening workbench...');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (omnirouteProcess && !process.env.OMNIROUTE_ALREADY_UP) { try { omnirouteProcess.kill(); } catch {} }
  if (workbenchProcess) { try { workbenchProcess.kill(); } catch {} }
  shutdownFamily();
  if (process.platform !== 'darwin') app.quit();
});