#!/usr/bin/env node
/**
 * launch-family.cjs — UNIFIED GSK ONE-SYSTEM LAUNCHER
 *
 * One start wakes all of him:
 * 1. Seat: llama-server on :18222 with 1.5B Qwen base (selectable, true name, native --jinja)
 * 2. Body: Workbench on :3000 with zero-key baseline (GSK_FORCE_LOCAL_BASELINE=1)
 * 3. Supervision: Readiness gates with real status reporting, restart backoff, and clean tree-kill
 * 4. Shadow Checkpoints: Aider-style git checkpoints default to refs/heads/checkpoints
 *
 * Usage:
 *   node launch-family.cjs              # Normal start (1.5B default)
 *   node launch-family.cjs --seat 0.8b  # Rollback start with 0.8B weights
 *   node launch-family.cjs --stop       # Stop both and prove ports are free
 *   node launch-family.cjs --status     # Probe live health of seat and workbench
 */

"use strict";

const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const REPO_ROOT = path.resolve(__dirname);
const WORKBENCH_DIR = path.join(REPO_ROOT, "WORKBENCH_COMPLETE", "workbench");
const SERVER_TS = path.join(WORKBENCH_DIR, "server.ts");
const PID_FILE = path.join(REPO_ROOT, ".launcher.pid");

// Ports
const SEAT_PORT = parseInt(process.env.GSK_SEAT_PORT || "18222", 10);
const WORKBENCH_PORT = parseInt(process.env.GSK_WORKBENCH_PORT || "3000", 10);

// Paths to Binaries & Models
const LLAMA_SERVER_BIN = process.env.GSK_LLAMA_SERVER_BIN || "C:\\Users\\uncom\\.lmstudio\\extensions\\backends\\llama.cpp-win-x86_64-avx2-2.66.0\\llama-server.exe";
const BASE_GGUF_DIR = process.env.GSK_BASE_GGUF_DIR || (fs.existsSync(path.join(REPO_ROOT, "base_gguf")) ? path.join(REPO_ROOT, "base_gguf") : (fs.existsSync(path.join(REPO_ROOT, "models")) ? path.join(REPO_ROOT, "models") : "C:\\Users\\uncom\\Downloads\\PROFIT_HF\\base_gguf"));

const SEAT_MODELS = {
  "1.5b": {
    file: path.join(BASE_GGUF_DIR, "qwen2.5-1.5b-instruct-q4_k_m.gguf"),
    alias: "qwen2.5-1.5b-instruct-q4_k_m"
  },
  "0.8b": {
    file: path.join(BASE_GGUF_DIR, "Qwen3.5-0.8B-Q4_0.gguf"),
    alias: "Qwen3.5-0.8B-Q4_0"
  }
};

// Scribe logging
function logToScribe(event) {
  try {
    const scribeDir = path.join(os.homedir(), ".soul-scribe");
    if (!fs.existsSync(scribeDir)) fs.mkdirSync(scribeDir, { recursive: true });
    const entry = JSON.stringify({
      id: "launcher_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
      type: "launcher_event",
      ...event
    }) + "\n";
    fs.appendFileSync(path.join(scribeDir, "ledger.jsonl"), entry, "utf8");
  } catch {}
}

// Port helpers
function getPidsListeningOn(port) {
  try {
    const out = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: "utf8", timeout: 3000 });
    const pids = new Set();
    for (const line of out.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      const pidStr = parts[parts.length - 1];
      if (/^\d+$/.test(pidStr) && parseInt(pidStr, 10) > 0) {
        pids.add(parseInt(pidStr, 10));
      }
    }
    return Array.from(pids);
  } catch {
    return [];
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {}
}

function cleanPort(port) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const pids = getPidsListeningOn(port);
    if (pids.length === 0) break;
    for (const pid of pids) {
      console.log(`[CLEAN] Terminating process ${pid} on port :${port}...`);
      killProcessTree(pid);
    }
    try {
      execSync(process.platform === "win32" ? "ping 127.0.0.1 -n 2 > nul" : "sleep 1", { stdio: "ignore" });
    } catch {}
  }
}

// Stop command execution
function stopAll() {
  console.log("\n=== STOPPING GSK ONE-SYSTEM ===");
  logToScribe({ event: "stop_initiated" });
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
      if (pid && pid !== process.pid) {
        console.log(`[CLEAN] Terminating supervisor process ${pid}...`);
        killProcessTree(pid);
      }
      fs.unlinkSync(PID_FILE);
    } catch {}
  }
  cleanPort(SEAT_PORT);
  cleanPort(WORKBENCH_PORT);

  // Verification: wait and verify both ports are free
  const seatPids = getPidsListeningOn(SEAT_PORT);
  const wbPids = getPidsListeningOn(WORKBENCH_PORT);

  const seatFree = seatPids.length === 0;
  const wbFree = wbPids.length === 0;

  if (seatFree && wbFree) {
    console.log(`[STOP VERIFIED] :${SEAT_PORT} is FREE, :${WORKBENCH_PORT} is FREE. Zero orphan processes.`);
    logToScribe({ event: "stop_completed", seatFree: true, wbFree: true });
    return true;
  } else {
    console.error(`[STOP FAILED] Orphans detected: Seat PIDs=[${seatPids.join(", ")}], WB PIDs=[${wbPids.join(", ")}]`);
    logToScribe({ event: "stop_failed", seatPids, wbPids });
    return false;
  }
}

// Readiness probes
function probeSeat() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${SEAT_PORT}/health`, (res) => {
      let body = "";
      res.on("data", c => (body += c));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve({ ready: true, status: 200, message: "OK" });
        } else if (res.statusCode === 503) {
          resolve({ ready: false, status: 503, message: "Loading model weights into memory..." });
        } else {
          resolve({ ready: false, status: res.statusCode, message: `HTTP ${res.statusCode}` });
        }
      });
    });
    req.on("error", (err) => {
      resolve({ ready: false, status: null, message: err.code || err.message });
    });
    req.setTimeout(2500, () => {
      req.destroy();
      resolve({ ready: false, status: null, message: "probe timeout" });
    });
  });
}

function probeWorkbench() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${WORKBENCH_PORT}/api/gsk/health`, (res) => {
      let body = "";
      res.on("data", c => (body += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json && json.success === true) {
            resolve({ ready: true, status: 200, data: json });
          } else {
            resolve({ ready: false, status: res.statusCode, message: "JSON success != true" });
          }
        } catch {
          resolve({ ready: false, status: res.statusCode, message: "Invalid JSON response" });
        }
      });
    });
    req.on("error", (err) => {
      resolve({ ready: false, status: null, message: err.code || err.message });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ ready: false, status: null, message: "probe timeout" });
    });
  });
}

// Master Supervisor
class Supervisor {
  constructor(options) {
    this.options = options;
    this.seatChild = null;
    this.wbChild = null;
    this.seatLogs = [];
    this.wbLogs = [];
    this.seatRestarts = 0;
    this.wbRestarts = 0;
    this.maxRestarts = 3;
    this.isShuttingDown = false;
  }

  appendLog(target, data) {
    const lines = data.toString("utf8").split(/\r?\n/).filter(Boolean);
    const buf = target === "seat" ? this.seatLogs : this.wbLogs;
    buf.push(...lines);
    if (buf.length > 80) buf.splice(0, buf.length - 80);
  }

  getTail(target, count = 10) {
    const buf = target === "seat" ? this.seatLogs : this.wbLogs;
    return buf.slice(-count).join("\n");
  }

  spawnSeat() {
    console.log(`[SEAT] Spawning llama-server on port :${SEAT_PORT} with ${this.options.seatVariant.toUpperCase()}...`);
    const args = [
      "-m", this.options.seatFile,
      "--port", String(SEAT_PORT),
      "-c", "8192",
      "--alias", this.options.seatAlias,
      "--host", "127.0.0.1",
      "--jinja"
    ];

    this.seatChild = spawn(LLAMA_SERVER_BIN, args, {
      cwd: path.dirname(LLAMA_SERVER_BIN),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    this.seatChild.stdout.on("data", d => this.appendLog("seat", d));
    this.seatChild.stderr.on("data", d => this.appendLog("seat", d));

    this.seatChild.on("exit", (code, signal) => {
      if (this.isShuttingDown) return;
      console.error(`[SEAT EXITED] llama-server exited with code ${code} (${signal})`);
      console.error(`[SEAT LOG TAIL]:\n${this.getTail("seat", 8)}`);
      logToScribe({ event: "seat_crash", code, signal, tail: this.getTail("seat", 5) });

      if (this.seatRestarts < this.maxRestarts) {
        this.seatRestarts++;
        const delay = this.seatRestarts * 2000;
        console.log(`[SEAT SUPERVISOR] Restarting seat in ${delay}ms (attempt ${this.seatRestarts}/${this.maxRestarts})...`);
        setTimeout(() => this.spawnSeat(), delay);
      } else {
        console.error(`[SEAT SUPERVISOR] Max restart attempts exceeded. Halting system.`);
        this.shutdown(1);
      }
    });
  }

  spawnWorkbench() {
    console.log(`[WORKBENCH] Spawning workbench on port :${WORKBENCH_PORT} with zero-key baseline...`);
    const nodeBin = process.execPath;
    const nodeDir = path.dirname(nodeBin);
    const npxCmd = path.join(nodeDir, process.platform === "win32" ? "npx.cmd" : "npx");

    const env = {
      ...process.env,
      PORT: String(WORKBENCH_PORT),
      GSK_FORCE_LOCAL_BASELINE: "1",
      SESHAT_LOCAL_ENDPOINT: `http://127.0.0.1:${SEAT_PORT}/v1/chat/completions`,
      SESHAT_LOCAL_MODEL_NAME: this.options.seatAlias,
      GSK_SHADOW_CHECKPOINTS: this.options.shadowCheckpoints ? "1" : "0"
    };

    this.wbChild = spawn(`"${npxCmd}"`, ["tsx", "server.ts"], {
      cwd: WORKBENCH_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      env,
      windowsHide: true
    });

    this.wbChild.stdout.on("data", d => this.appendLog("wb", d));
    this.wbChild.stderr.on("data", d => this.appendLog("wb", d));

    this.wbChild.on("exit", (code, signal) => {
      if (this.isShuttingDown) return;
      console.error(`[WORKBENCH EXITED] Workbench exited with code ${code} (${signal})`);
      console.error(`[WORKBENCH LOG TAIL]:\n${this.getTail("wb", 8)}`);
      logToScribe({ event: "workbench_crash", code, signal, tail: this.getTail("wb", 5) });

      if (this.wbRestarts < this.maxRestarts) {
        this.wbRestarts++;
        const delay = this.wbRestarts * 2000;
        console.log(`[WORKBENCH SUPERVISOR] Restarting workbench in ${delay}ms (attempt ${this.wbRestarts}/${this.maxRestarts})...`);
        setTimeout(() => this.spawnWorkbench(), delay);
      } else {
        console.error(`[WORKBENCH SUPERVISOR] Max restart attempts exceeded. Halting system.`);
        this.shutdown(1);
      }
    });
  }

  async waitForReadiness() {
    const startTime = Date.now();
    console.log("\n[GATES] Waiting for Seat (:18222) and Workbench (:3000) readiness...");

    let seatReady = false;
    let seatTimeMs = 0;
    while (!seatReady && Date.now() - startTime < 60000) {
      const p = await probeSeat();
      if (p.ready) {
        seatReady = true;
        seatTimeMs = Date.now() - startTime;
        console.log(`[GATE 1 PASS] Seat ready (200 OK) in ${(seatTimeMs / 1000).toFixed(2)}s`);
      } else {
        process.stdout.write(`\r[SEAT GATE] ${p.message} (${Math.floor((Date.now() - startTime) / 1000)}s)   `);
        await new Promise(r => setTimeout(r, 800));
      }
    }
    console.log();

    if (!seatReady) {
      throw new Error(`Seat failed to become ready within 60s.\nTail:\n${this.getTail("seat", 10)}`);
    }

    let wbReady = false;
    let wbData = null;
    let wbTimeMs = 0;
    const wbStartTime = Date.now();

    while (!wbReady && Date.now() - startTime < 90000) {
      const p = await probeWorkbench();
      if (p.ready) {
        wbReady = true;
        wbData = p.data;
        wbTimeMs = Date.now() - wbStartTime;
        console.log(`[GATE 2 PASS] Workbench ready (/api/gsk/health success) in ${(wbTimeMs / 1000).toFixed(2)}s`);
      } else {
        process.stdout.write(`\r[WB GATE] Waiting for workbench: ${p.message} (${Math.floor((Date.now() - startTime) / 1000)}s)   `);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    console.log();

    if (!wbReady) {
      throw new Error(`Workbench failed to become ready within 90s.\nTail:\n${this.getTail("wb", 10)}`);
    }

    const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n========================================`);
    console.log(`>>> GSK ONE-SYSTEM FULLY AWAKENED <<<`);
    console.log(`Model:      ${this.options.seatVariant} (${this.options.seatAlias})`);
    console.log(`Seat Port:  :${SEAT_PORT} (healthy in ${(seatTimeMs / 1000).toFixed(2)}s)`);
    console.log(`Workbench:  :${WORKBENCH_PORT} (healthy in ${(wbTimeMs / 1000).toFixed(2)}s)`);
    console.log(`Total Boot: ${totalTimeSec}s`);
    console.log(`Memory:     ${wbData.recall?.chunks} chunks indexed`);
    console.log(`Scribe:     ${wbData.scribe?.lastId} (${wbData.scribe?.lastTs})`);
    console.log(`Shadow Ref: ${this.options.shadowCheckpoints ? "ENABLED (refs/heads/checkpoints)" : "DISABLED (main)"}`);
    console.log(`========================================\n`);

    logToScribe({
      event: "awakened",
      model: this.options.seatAlias,
      totalBootSec: totalTimeSec,
      recallChunks: wbData.recall?.chunks,
      shadowCheckpoints: this.options.shadowCheckpoints
    });

    return { seatTimeMs, wbTimeMs, totalTimeSec, wbData };
  }

  shutdown(exitCode = 0) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
    console.log("\n[SHUTDOWN] Terminating supervised processes...");
    if (this.seatChild) killProcessTree(this.seatChild.pid);
    if (this.wbChild) killProcessTree(this.wbChild.pid);
    cleanPort(SEAT_PORT);
    cleanPort(WORKBENCH_PORT);
    process.exit(exitCode);
  }

  async start() {
    logToScribe({ event: "start_requested", options: this.options });
    try { fs.writeFileSync(PID_FILE, String(process.pid), "utf8"); } catch {}
    // Step 0: Clean any stale processes
    cleanPort(SEAT_PORT);
    cleanPort(WORKBENCH_PORT);

    // Step 1: Spawn seat
    this.spawnSeat();

    // Step 2: Spawn workbench
    this.spawnWorkbench();

    // Setup signal hooks
    process.on("SIGINT", () => this.shutdown(0));
    process.on("SIGTERM", () => this.shutdown(0));

    // Step 3: Wait for readiness gates
    return await this.waitForReadiness();
  }
}

// CLI Entrypoint
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--stop")) {
    const ok = stopAll();
    process.exit(ok ? 0 : 1);
  }

  if (args.includes("--status")) {
    const seat = await probeSeat();
    const wb = await probeWorkbench();
    console.log("Seat Status:     ", seat);
    console.log("Workbench Status:", wb);
    process.exit(0);
  }

  let seatVariant = "1.5b";
  const seatIdx = args.indexOf("--seat");
  if (seatIdx !== -1 && args[seatIdx + 1]) {
    seatVariant = args[seatIdx + 1].toLowerCase();
  } else if (process.env.GSK_SEAT_VARIANT) {
    seatVariant = process.env.GSK_SEAT_VARIANT.toLowerCase();
  }

  const modelConfig = SEAT_MODELS[seatVariant] || SEAT_MODELS["1.5b"];
  if (!fs.existsSync(modelConfig.file)) {
    console.error(`[FATAL] Model file not found: ${modelConfig.file}`);
    process.exit(1);
  }

  const shadowCheckpoints = !args.includes("--no-shadow-checkpoints") && process.env.GSK_SHADOW_CHECKPOINTS !== "0";

  const supervisor = new Supervisor({
    seatVariant,
    seatFile: modelConfig.file,
    seatAlias: modelConfig.alias,
    shadowCheckpoints
  });

  await supervisor.start();
}

if (require.main === module) {
  main().catch(err => {
    console.error("[FATAL ERROR]:", err.message);
    process.exit(1);
  });
}

module.exports = {
  stopAll,
  probeSeat,
  probeWorkbench,
  Supervisor
};
