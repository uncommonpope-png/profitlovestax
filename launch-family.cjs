#!/usr/bin/env node
/**
 * launch-family.cjs — THE FAMILY LAUNCHER (single safe entry point)
 *
 * Blood-Flow Protocol Rules:
 * 1. Omniroute (:20128) is the blood flow. NEVER kill. NEVER duplicate. Scan first.
 * 2. If Omniroute is alive → adopt (set OMNIROUTE_ALREADY_UP=1).
 * 3. Scan :3000. If taken → exit (no duplicate family).
 * 4. Launch server.ts via npm run dev.
 *
 * Profit = own agent (from:"profit"). Awakened by blueprint, not this launcher.
 *
 * Usage: node launch-family.cjs
 */

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = 3000;
const OMNIROUTE_PORT = 20128;
const OMNIROUTE_SCRIPT = path.join(
  path.dirname(__filename),
  "WORKBENCH_COMPLETE",
  "workbench",
  "server.ts"
);

function isListening(port) {
  try {
    const { execSync } = require("child_process");
    const out = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: "utf8", timeout: 4000 });
    return out.trim().length > 0;
  } catch { return false; }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/system/status`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(true));
    });
    req.on("error", () => {
      // Hung but LISTENING = still BUSY (zombie) — don't spawn duplicate
      resolve(isListening(port));
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(isListening(port));
    });
  });
}

function checkOmniroute() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${OMNIROUTE_PORT}/v1/models`, (res) => {
      resolve(true);
    });
    req.on("error", () => resolve(isListening(OMNIROUTE_PORT)));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(isListening(OMNIROUTE_PORT));
    });
  });
}

async function main() {
  console.log("\n=== FAMILY LAUNCHER ===\n");

  // 1. Scan :20128 (Omniroute blood flow)
  const omniUp = await checkOmniroute();
  if (omniUp) {
    console.log("[BLOOD] Omniroute :20128 ALIVE — adopting (never killing)");
    process.env.OMNIROUTE_ALREADY_UP = "1";
  } else {
    console.log("[BLOOD] Omniroute :20128 DOWN — server.ts will start it");
  }

  // 2. Scan :3000 (workbench)
  const workbenchUp = await checkPort(PORT);
  if (workbenchUp) {
    console.error("[BLOCKED] Workbench :3000 already taken. Exit — no duplicate family.");
    process.exit(1);
  }

  // 3. Launch server.ts
  // NOTE: the conductor pidfile (data/.conductor.pid) belongs to server.ts alone.
  // If the launcher claims it first, the workbench sees ITS OWN boot as a
  // "live duplicate" and refuses to start. Single-instance is enforced there.
  console.log("[LAUNCH] Starting TRUE family workbench (server.ts)...");
  const isWin = process.platform === "win32";
  // Resolve npx relative to THIS Node binary — works regardless of PATH or install dir
  const nodeBin = process.execPath; // e.g. C:\Program Files\nodejs\node.exe
  const nodeDir = path.dirname(nodeBin);
  const npxPath = path.join(nodeDir, isWin ? "npx.cmd" : "npx");
  console.log(`[LAUNCH] Using npx at: ${npxPath}`);
  const child = spawn(`"${npxPath}"`, ["tsx", "server.ts"], {
    cwd: path.dirname(OMNIROUTE_SCRIPT),
    stdio: "inherit",
    shell: true, // shell:true required for quoted paths on Windows
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    console.log(`[EXIT] Workbench stopped (code ${code})`);
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
