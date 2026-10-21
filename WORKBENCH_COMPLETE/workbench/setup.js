'use strict';

/**
 * Workbench postinstall setup.
 *
 * Field-test fix F1 (Oct 2026): this script used to die off Windows —
 * setupLlama() downloaded a Windows llama.cpp zip and extracted it via
 * PowerShell (`spawn powershell ENOENT` -> process.exit(1)), so
 * `npm install` failed on Linux/macOS and setupVectors() never ran.
 * The downloaded zip was also never validated (a 9-byte stub passed
 * silently on Windows too).
 *
 * Contract now: every step is individually non-fatal. The postinstall
 * exits 0 and logs honestly what was done, what was skipped, and why.
 * The body boots and chats without the local GGUF and without the
 * Windows llama binaries (both serve only the optional local-reflex
 * path); provider seats come from the vault, not from this script.
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn, spawnSync } = require('child_process');

const WORKBENCH_DIR = __dirname;
const CACHE_DIR = path.join(WORKBENCH_DIR, '.transformers-cache');
const VECTOR_DIR = path.join(WORKBENCH_DIR, '.seshat-vectors');

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_FILE = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const LLAMA_URL = 'https://github.com/ggerganov/llama.cpp/releases/download/b3952/llama-b3952-bin-win-x64.zip';
// A real llama.cpp release zip is tens of MB. Anything under 1 MB is a
// stub/error page, not an archive — never let it pass as a download.
const LLAMA_ZIP_MIN_BYTES = 1024 * 1024;

function log(msg) { console.log(`[setup] ${msg}`); }

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function downloadFile(url, dest, onProgress, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (response) => {
            const status = response.statusCode || 0;
            if ([301, 302, 303, 307, 308].includes(status)) {
                response.resume();
                if (redirectsLeft <= 0 || !response.headers.location) {
                    return reject(new Error(`download redirect failed (HTTP ${status}) for ${url}`));
                }
                return downloadFile(response.headers.location, dest, onProgress, redirectsLeft - 1)
                    .then(resolve).catch(reject);
            }
            if (status !== 200) {
                response.resume();
                return reject(new Error(`download failed (HTTP ${status}) for ${url}`));
            }

            const file = fs.createWriteStream(dest);
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;

            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (onProgress && totalSize) {
                    const progress = Math.round((downloaded / totalSize) * 100);
                    onProgress(progress);
                }
            });
            response.on('error', (err) => {
                file.destroy();
                fs.unlink(dest, () => {});
                reject(err);
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close(() => resolve(dest));
            });
            file.on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        });
        req.on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function setupModel() {
    ensureDir(CACHE_DIR);
    const modelPath = path.join(CACHE_DIR, MODEL_FILE);

    if (fs.existsSync(modelPath)) {
        log('Local GGUF model already present — skipping download.');
        return;
    }

    await downloadFile(MODEL_URL, modelPath);
    log(`Downloaded local model: ${MODEL_FILE}`);
}

async function setupLlama() {
    // The shipped llama.cpp binaries are a WINDOWS build (win-x64.zip).
    // On any other platform the binary could never run — skip the whole
    // step honestly instead of dying on a missing PowerShell.
    if (process.platform !== 'win32') {
        log(`Skipping llama.cpp binaries: the packaged build is Windows-only ` +
            `(win-x64) and this platform is ${process.platform}. The local ` +
            `llama runtime is optional — the body boots, remembers, and ` +
            `chats through your vault provider keys without it.`);
        return;
    }

    ensureDir(CACHE_DIR);
    const llamaDir = path.join(CACHE_DIR, 'llama');
    const llamaExe = path.join(llamaDir, 'llama-cli.exe');

    if (fs.existsSync(llamaExe)) {
        log('llama.cpp binaries already present — skipping download.');
        return;
    }

    ensureDir(llamaDir);

    const zipPath = path.join(CACHE_DIR, 'llama.zip');
    await downloadFile(LLAMA_URL, zipPath);

    // Validate BEFORE trusting the archive: a redirect stub or error
    // page must fail loudly here, not silently "succeed".
    const zipSize = fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0;
    if (zipSize < LLAMA_ZIP_MIN_BYTES) {
        fs.unlink(zipPath, () => {});
        throw new Error(`llama.cpp download was only ${zipSize} bytes — not a real archive; local llama runtime not installed (non-fatal).`);
    }

    await new Promise((resolve, reject) => {
        const extract = spawn('powershell', [
            '-Command',
            `Expand-Archive -Path "${zipPath}" -DestinationPath "${llamaDir}" -Force`
        ], { stdio: 'inherit' });
        extract.on('error', (err) => reject(new Error(`PowerShell extraction failed to start: ${err.message}`)));
        extract.on('close', (code) => {
            fs.unlink(zipPath, () => {});
            if (code !== 0) return reject(new Error(`PowerShell Expand-Archive exited with code ${code}`));
            resolve();
        });
    });

    if (!fs.existsSync(llamaExe)) {
        throw new Error('llama.cpp extraction finished but llama-cli.exe is not present — local llama runtime not installed (non-fatal).');
    }
    log('llama.cpp binaries installed.');
}

async function setupVectors() {
    ensureDir(VECTOR_DIR);
    const lancePath = path.join(VECTOR_DIR, 'seshat_memory.lance');

    if (fs.existsSync(lancePath)) {
        log('Vector store already initialized — skipping.');
        return;
    }

    fs.mkdirSync(lancePath, { recursive: true });
    fs.writeFileSync(path.join(lancePath, '.initialized'), '');
    log('Vector store initialized.');
}

/**
 * F2 (field test): the CPL world server (WORKBENCH_COMPLETE/cpl/world)
 * declares its own dependency closure (ws, three, @babylonjs/core) but
 * the documented install only installs the workbench tree — so on a
 * fresh clone the spatial bridge on :3458 died with "Cannot find
 * module 'ws'". Install that closure here, as part of the documented
 * install path. A failure is logged loudly but stays non-fatal: the
 * genesis host (:3457, buildings/world state) does not depend on it,
 * and the fusion boot banner now reports the spatial state truthfully.
 */
async function setupCplWorld() {
    const worldDir = path.join(WORKBENCH_DIR, '..', 'cpl', 'world');
    if (!fs.existsSync(path.join(worldDir, 'package.json'))) {
        log('CPL world package not found beside the workbench — skipping its dependency install.');
        return;
    }
    if (fs.existsSync(path.join(worldDir, 'node_modules', 'ws'))) {
        log('CPL world dependencies already installed — skipping.');
        return;
    }
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    log('Installing CPL world dependencies (ws/three/@babylonjs) so the :3458 spatial bridge can start...');
    const res = spawnSync(npmCmd, ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
        cwd: worldDir,
        stdio: 'inherit',
        timeout: 600000,
    });
    if (res.error) throw new Error(`CPL world dependency install failed to start: ${res.error.message}`);
    if (res.status !== 0) throw new Error(`CPL world dependency install exited with code ${res.status} — the :3458 spatial bridge will not start until cpl/world dependencies are installed.`);
    log('CPL world dependencies installed.');
}

/**
 * F12 (demo production, Oct 2026): the GSK daemon's own dependency
 * closure (WORKBENCH_COMPLETE/gsk/package.json) was never installed by
 * the documented path either — its ThoughtStream (ws://:3002, the
 * Soulfeild client's thought feed) requires `ws`, which was
 * unreachable from the daemon's tree in a fresh clone, so :3002 never
 * listened. Install that closure here too. Non-fatal on failure, like
 * every other step; the fusion boot log shows the ThoughtStream's own
 * listen line when it truly starts.
 */
async function setupGskDeps() {
    const gskDir = path.join(WORKBENCH_DIR, '..', 'gsk');
    if (!fs.existsSync(path.join(gskDir, 'package.json'))) {
        log('GSK package not found beside the workbench — skipping its dependency install.');
        return;
    }
    if (fs.existsSync(path.join(gskDir, 'node_modules', 'ws'))) {
        log('GSK daemon dependencies already installed — skipping.');
        return;
    }
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    log('Installing GSK daemon dependencies (ws for the :3002 thought stream)...');
    const res = spawnSync(npmCmd, ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
        cwd: gskDir,
        stdio: 'inherit',
        timeout: 600000,
    });
    if (res.error) throw new Error(`GSK daemon dependency install failed to start: ${res.error.message}`);
    if (res.status !== 0) throw new Error(`GSK daemon dependency install exited with code ${res.status} — the :3002 thought stream will not start until gsk dependencies are installed.`);
    log('GSK daemon dependencies installed.');
}

async function runSetup() {
    // Each step is isolated: one step's failure is logged, never fatal,
    // and never blocks the steps after it (setupVectors used to be
    // collateral damage of the llama crash).
    const steps = [
        ['local model download', setupModel],
        ['llama.cpp binaries', setupLlama],
        ['vector store init', setupVectors],
        ['CPL world dependencies', setupCplWorld],
        ['GSK daemon dependencies', setupGskDeps],
    ];
    for (const [name, fn] of steps) {
        try {
            await fn();
        } catch (error) {
            log(`Step "${name}" did not complete: ${error.message} — continuing; this is non-fatal.`);
        }
    }
    log('Setup finished (any skipped steps are logged above, with reasons).');
}

if (require.main === module) {
    // The postinstall must never fail the install: exit 0 always, with
    // honest logs. (Direct `node setup.js` runs follow the same rule.)
    runSetup()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('[setup] Unexpected setup error (non-fatal):', error && error.message);
            process.exit(0);
        });
}

module.exports = { runSetup };
