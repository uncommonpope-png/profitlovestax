// ZERO-KEY BASELINE CONTRACT TEST — 2026-10-27 (Craig's locked spec).
//
// Boots the canonical runtime (server.ts, this dir) with provider env
// STRIPPED and GSK_FORCE_LOCAL_BASELINE=1, on a scratch port so the live
// :3000 workbench is never touched. Sends ONE prompt answerable from
// Seshat's local memory + static skills, then asserts:
//   1. the turn succeeds from the local-memory-only path (baseline,
//      provider "none", no provider credential present),
//   2. the answer is non-empty AND backed by real local recall,
//   3. SCRIBE logged the turn (response flag + marker in ledger.jsonl),
//   4. the server log shows the baseline gate and NO direct-provider
//      answer line (no rented seat code path ran for this turn),
//   5. the process is still alive afterward (pid + HTTP 200).
// FAILS on silent death, on any seat request, or on a missing SCRIBE log.
//
// Run from this dir:  ./node_modules/.bin/tsx tests/zero-key-baseline.contract.test.ts
// Standalone (no test framework): exit 0 = all PASS, exit 1 = any FAIL.
// Kills ONLY the child it spawned (by pid), never any other process.

import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const WORKBENCH_DIR = path.join(__dirname, "..");
// NOTE 2026-10-27: the RUNNING Scribe (supervisor-started) keeps its
// ledger at ~/.soul-scribe/ledger.jsonl (ScribeSoul's dataDir default),
// NOT at WORKBENCH_COMPLETE/scribe/data/ledger.jsonl — that tree ledger
// belongs to a different writer. The marker check must read the live
// Scribe's ledger or it false-fails.
const LEDGER_PATH = path.join(os.homedir(), ".soul-scribe", "ledger.jsonl");
const PORT = "13131";
const BASE = `http://127.0.0.1:${PORT}`;
const PROMPT = "What is the Soul Economy?";
const READY_TIMEOUT_MS = 300000;
const TURN_TIMEOUT_MS = 300000;

const PROVIDER_VARS = [
  "OPENAI_API_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY_2", "GROQ_API_KEY",
  "NVIDIA_API_KEY", "ANTHROPIC_API_KEY", "POOLSIDE_API_KEY", "COHERE_API_KEY",
  "MCP_API_KEY", "NINE_ROUTER_API_KEY", "TAVILY_API_KEY", "MINIMAX_API_KEY",
  "CLOUDFLARE_API_KEY", "GONKA_API_KEY", "VAULT_PASSPHRASE",
];

const results: Array<{ name: string; pass: boolean; detail: string }> = [];
function check(name: string, pass: boolean, detail: string): void {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForReady(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) return false;
    try {
      const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await sleep(2000);
  }
  return false;
}

async function main(): Promise<number> {
  const homeScratch = "/tmp/zero-key-baseline-home";
  fs.mkdirSync(homeScratch, { recursive: true });

  // Strip every provider credential from the child's env (names only,
  // values never printed) and force baseline mode. HOME is deliberately
  // NOT overridden: scribeKey() resolves ScribeSoul's auth file via
  // os.homedir(), and redirecting HOME would break the SCRIBE witness
  // (proven in run 2). Only the heartbeat file is redirected, via
  // GSK_HEARTBEAT_PATH, so the child's heartbeat lines never land in
  // the live supervisor log.
  const env: Record<string, string | undefined> = { ...process.env };
  for (const v of PROVIDER_VARS) delete env[v];
  env.GSK_FORCE_LOCAL_BASELINE = "1";
  env.PORT = PORT;
  env.SESHAT_LOCAL_MODEL = "qwen2.5-1.5b-instruct-q4_k_m";
  env.SESHAT_LOCAL_ENDPOINT = "http://127.0.0.1:18222/v1/chat/completions";
  env.GSK_HEARTBEAT_PATH = path.join(homeScratch, "workbench-heartbeat.log");

  const logPath = "/tmp/zero-key-baseline-test-server.log";
  const logStream = fs.createWriteStream(logPath);
  let logTail = "";
  const child: ChildProcess = spawn("./node_modules/.bin/tsx", ["server.ts"], {
    cwd: WORKBENCH_DIR,
    env: env as NodeJS.ProcessEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d: Buffer) => {
    logStream.write(d);
    logTail = (logTail + d.toString()).slice(-200000);
  });
  child.stderr?.on("data", (d: Buffer) => {
    logStream.write(d);
    logTail = (logTail + d.toString()).slice(-200000);
  });
  console.log(`[contract-test] spawned baseline server pid=${child.pid} port=${PORT} log=${logPath}`);

  const cleanup = async (): Promise<void> => {
    if (child.exitCode === null) {
      try { child.kill("SIGTERM"); } catch { /* already gone */ }
      for (let i = 0; i < 10 && child.exitCode === null; i++) await sleep(1000);
      if (child.exitCode === null) {
        try { child.kill("SIGKILL"); } catch { /* already gone */ }
      }
    }
    await sleep(500);
    try { logStream.end(); } catch { /* ignore */ }
  };

  try {
    const ready = await waitForReady(child, READY_TIMEOUT_MS);
    check("boot-with-zero-key", ready, ready
      ? `server answered GET / on port ${PORT} (live :3000 untouched)`
      : child.exitCode !== null
        ? `CHILD DIED DURING BOOT exit=${child.exitCode} (silent death)`
        : `no HTTP 200 within ${READY_TIMEOUT_MS}ms`);
    if (!ready) {
      console.log("--- server log tail (last 3000 chars) ---");
      console.log(logTail.slice(-3000));
      await cleanup();
      return 1;
    }

    // The contract turn: one prompt answerable from local memory.
    let turn: any = null;
    let turnHttp = 0;
    try {
      const r = await fetch(`${BASE}/api/gsk/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: PROMPT }),
        signal: AbortSignal.timeout(TURN_TIMEOUT_MS),
      });
      turnHttp = r.status;
      turn = await r.json().catch(() => null);
    } catch (e: any) {
      check("baseline-turn", false, `chat POST failed: ${e.message}`);
    }

    check("baseline-turn", turnHttp === 200 && turn && turn.success === true,
      turn ? `HTTP ${turnHttp} success=${turn.success} baseline=${turn.baseline} provider=${turn.provider}` : `HTTP ${turnHttp}, no JSON body`);
    check("no-provider-credential", !!turn && turn.provider === "none" && turn.providerCredsPresent === false,
      turn ? `provider=${turn.provider} providerCredsPresent=${turn.providerCredsPresent}` : "no turn body");
    check("local-memory-answer", !!turn && typeof turn.response === "string" && turn.response.trim().length > 0
      && typeof turn.recallChars === "number" && turn.recallChars > 0
      && typeof turn.recallHits === "number" && turn.recallHits > 0,
      turn ? `response ${String(turn.response || "").length} chars, recall ${turn.recallChars} chars / ${turn.recallHits} hits` : "no turn body");
    check("no-provider-code-path", !logTail.includes("Direct provider path answered"),
      logTail.includes("Direct provider path answered") ? "provider path answered a turn (SEAT USED)" : "no direct-provider answer line in server log");
    check("baseline-gate-logged", logTail.includes("[ZERO-KEY-BASELINE] forced"),
      logTail.includes("[ZERO-KEY-BASELINE] forced") ? "forced-baseline gate line present" : "forced-baseline gate line MISSING");

    // SCRIBE: response flag + marker in the ledger file.
    let ledgerHasMarker = false;
    if (turn && turn.marker) {
      try {
        const ledger = fs.readFileSync(LEDGER_PATH, "utf8");
        ledgerHasMarker = ledger.includes(String(turn.marker));
      } catch { ledgerHasMarker = false; }
    }
    check("scribe-logged", !!turn && turn.scribeLogged === true && ledgerHasMarker,
      turn ? `scribeLogged=${turn.scribeLogged} ledgerHasMarker=${ledgerHasMarker} marker=${turn.marker}` : "no turn body");

    // Still alive afterward: same pid + HTTP 200.
    let stillUp = false;
    try {
      const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(5000) });
      stillUp = child.exitCode === null && r.ok;
    } catch { stillUp = false; }
    check("process-still-alive", stillUp,
      stillUp ? `pid=${child.pid} still running, GET / 200` : `exitCode=${child.exitCode} (DIED)`);

    if (turn && typeof turn.response === "string" && turn.response.trim()) {
      console.log("--- baseline answer (first 600 chars) ---");
      console.log(turn.response.slice(0, 600));
    }
  } finally {
    await cleanup();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n[contract-test] ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log(`[contract-test] FAILED: ${failed.map((f) => f.name).join(", ")}`);
    return 1;
  }
  console.log("[contract-test] ZERO-KEY BASELINE CONTRACT: PASS");
  return 0;
}

main().then((code) => { process.exit(code); }).catch((e) => {
  console.error("[contract-test] harness error:", e?.message || e);
  process.exit(1);
});
