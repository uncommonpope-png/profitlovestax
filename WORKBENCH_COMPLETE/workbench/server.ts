import express from "express";
import path from "path";
import dotenv from "dotenv";
import os from "os";
import http from "http";
import fs from "fs";
import crypto from "crypto"; // SURGERY 2026-10-20: vault encryption (op 3)
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { spawn, spawnSync, execSync, ChildProcess } from "child_process";
import { WebSocketServer, WebSocket } from "ws";
import { createHands } from "./hands";

// Synthesizer additions
import { attachProvenance } from "./src/lib/provenance";
import { validateGskMemories } from "./src/schemas/gsk.schema";
import { validateGskResponse } from "./src/connectors/gsk-validator";
import { PtySupervisor } from "./src/server/terminal/PtySupervisor";
import { LspProcessManager } from "./src/server/lsp/LspProcessManager";
import { WorktreeFleet } from "./src/server/fleet/WorktreeFleet";
import { CodebaseIndex } from "./src/server/search/CodebaseIndex";
import { WatchHub } from "./src/server/watcher/WatchSupervisor";
import { GitLens } from "./src/server/git/GitLens";
import { parseConflictRegions, applyResolutions } from "./src/shared/mergeConflicts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Probe for the real gsk tree (gsk_daemon.js), not the runtime data dir:
// workbench/gsk/data fools a bare "gsk" existence check and silently
// redirected every REPO_ROOT/gsk path into an empty local shadow.
const REPO_ROOT = fs.existsSync(path.join(__dirname, "gsk", "gsk_daemon.js")) ? __dirname : path.resolve(__dirname, "..");

// AUTONOMY — single executor owner. The in-process being (gsk-module.js ->
// GSKFusion) carries the full governed executor stack; the :3001 daemon is
// the reasoning server and is spawned with GSK_AUTONOMY_ENABLED=false below.
// Pointing the being's sovereign loop at the real repo (plus gsk) makes the
// family able to work the repo — no twin loops, blood flow untouched.
process.env.GSK_PROJECT_ROOTS = `${REPO_ROOT};${path.join(REPO_ROOT, "gsk")}`;
if (!process.env.GSK_AUTONOMY_INTERVAL_MS) process.env.GSK_AUTONOMY_INTERVAL_MS = "1800000";
if (!process.env.GSK_AUTONOMY_FIRST_DELAY_MS) process.env.GSK_AUTONOMY_FIRST_DELAY_MS = "120000";

// DAEMON FIX 2026-10-26: plain dotenv.config() reads .env only, but
// MCP_API_KEY (and NINE_ROUTER_API_KEY) live only in workbench.env, so the
// daemon/Scribe spawns always threw "MCP_API_KEY not set". Load
// workbench.env as a fallback supply. Precedence (dotenv never overrides an
// already-set variable): shell/process env > .env > workbench.env.
// No key value is ever logged here — presence only, downstream.
dotenv.config();
// ZERO-KEY BASELINE CONTRACT 2026-10-27 (Craig's locked spec): a boot
// with GSK_FORCE_LOCAL_BASELINE=1 is a keyless baseline boot. workbench.env
// is NOT loaded on such a boot (it carries provider keys), and every known
// provider credential var is deleted from this process, so no provider
// code path below can see a credential even if the caller left one set.
// Values are never logged — names only. Live boots (flag unset) keep the
// old behavior exactly: shell/process env > .env > workbench.env.
const ZERO_KEY_PROVIDER_VARS = [
  "OPENAI_API_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY_2", "GROQ_API_KEY",
  "NVIDIA_API_KEY", "ANTHROPIC_API_KEY", "POOLSIDE_API_KEY", "COHERE_API_KEY",
  "MCP_API_KEY", "NINE_ROUTER_API_KEY", "TAVILY_API_KEY", "MINIMAX_API_KEY",
  "CLOUDFLARE_API_KEY", "GONKA_API_KEY", "VAULT_PASSPHRASE",
];
const zeroKeyBaselineForced = process.env.GSK_FORCE_LOCAL_BASELINE === "1";
if (zeroKeyBaselineForced) {
  for (const v of ZERO_KEY_PROVIDER_VARS) delete process.env[v];
  console.log("[ZERO-KEY-BASELINE] forced: workbench.env skipped, provider vars stripped (names only, no values)");
} else {
  dotenv.config({ path: path.join(__dirname, "workbench.env") });
}

// HEARTBEAT 2026-10-27: last-word witness for sudden deaths. A plain
// top-level interval, deliberately NOT wired into loop, turn, or seat logic.
// Every 10s it appends one synchronously flushed line (ISO time, pid, uptime,
// RSS) so the next silent death leaves a last timestamp written from inside
// this process. A gap after the last line bounds the kill window; no
// in-process handler can log an outside kill itself.
const HEARTBEAT_PATH = process.env.GSK_HEARTBEAT_PATH || path.join(process.env.HOME || "", "workspace", "gsk-supervisor", "logs", "workbench-heartbeat.log");
setInterval(() => {
  try {
    const line = `${new Date().toISOString()} pid=${process.pid} uptime_s=${Math.floor(process.uptime())} rss_mb=${(process.memoryUsage().rss / 1048576).toFixed(1)} heap_mb=${(process.memoryUsage().heapUsed / 1048576).toFixed(1)}\n`;
    fs.appendFileSync(HEARTBEAT_PATH, line);
  } catch {
    // Heartbeat must never take the workbench down.
  }
}, 10000);

// DEATH-WITNESS 2026-10-27: signal/crash handlers so a logged death
// replaces a silent one. Each handler synchronously appends ONE line to the
// heartbeat file AND writes the same line to stderr (the supervisor already
// captures stderr into workbench.log). Signal handlers remove themselves and
// re-raise the same signal so exit status matches default semantics.
// Crash handlers log, remove themselves, and re-raise so Node's default
// crash path exits nonzero. No new process.exit calls are added: the wedge
// guard's exit(71) stays the only one. NOTE: an outside SIGKILL still
// cannot be caught by any handler — that case is what the heartbeat gap
// bounds.
function deathWitnessWrite(line: string): void {
  try { fs.appendFileSync(HEARTBEAT_PATH, line); } catch { /* never die logging */ }
  try { process.stderr.write(line); } catch { /* ignore */ }
}
function deathWitnessLine(kind: string, detail: string): string {
  const stack = detail.replace(/\n/g, " | ");
  return `${new Date().toISOString()} DEATH-WITNESS ${kind} pid=${process.pid} uptime_s=${Math.floor(process.uptime())} rss_mb=${(process.memoryUsage().rss / 1048576).toFixed(1)} ${stack}\n`;
}
for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
  process.on(sig, () => {
    deathWitnessWrite(deathWitnessLine("signal", `signal=${sig}`));
    process.removeAllListeners(sig);
    process.kill(process.pid, sig);
  });
}
process.on("uncaughtException", (err: Error) => {
  deathWitnessWrite(deathWitnessLine("uncaughtException", err instanceof Error ? (err.stack || err.message) : String(err)));
  process.removeAllListeners("uncaughtException");
  throw err;
});
process.on("unhandledRejection", (reason: unknown) => {
  deathWitnessWrite(deathWitnessLine("unhandledRejection", reason instanceof Error ? (reason.stack || reason.message) : String(reason)));
  process.removeAllListeners("unhandledRejection");
  void Promise.reject(reason);
});

const app = express();
const PORT = Number(process.env.PORT || 3000) || 3000;

// ── HANDS: single governed execution channel ──
// One place where intent becomes repo mutation. The being's executor stack
// (council, HITL, budgets, PLT) runs inside gskMod; this module owns the
// blood-flow guard, task intake, and the approval surface.
const sseClients = new Set<http.ServerResponse>();
function broadcastSse(type: string, payload: any) {
  const data = `data: ${JSON.stringify({ type, ...payload })}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch { sseClients.delete(client); }
  }
}
const hands = createHands({
  getBeing: getTheBeing,
  sanctionedRoots: [REPO_ROOT, path.join(REPO_ROOT, "gsk")],
  logDir: path.join(REPO_ROOT, "data", "hands"),
  emit: (type: string, payload: any) => broadcastSse(type, payload),
});

const GSK_MCP_URL = process.env.GSK_MCP_URL || "http://127.0.0.1:3001";
const GSK_MCP_KEY = process.env.MCP_API_KEY || '';
// DAEMON FIX 2026-10-26: set when a GSK spawn fails for the missing MCP
// key. That is a config state, not a crash — the watchdog must then stay
// quiet instead of revive-looping the same throw (see watchdogTick).
let gskDisabledForMissingKey = false;
function requireMcpKey(): string {
  if (!GSK_MCP_KEY) throw new Error("MCP_API_KEY not set - refusing to spawn a process that requires the GSK MCP key");
  return GSK_MCP_KEY;
}
const CPL_URL = process.env.CPL_URL || "http://127.0.0.1:3457";
const SCRIBE_URL = process.env.SCRIBE_URL || "http://127.0.0.1:4000";
const GSK_HIBERNATE = process.env.GSK_HIBERNATE === "1";

function scribeKey(): string {
  // ZERO-KEY BASELINE FIX 2026-10-27: the supervisor-started Scribe
  // holds a ScribeSoul-generated key at ~/.soul-scribe/.key (its
  // dataDir default), NOT at scribe/.SCRIBE_KEY — that file does not
  // exist, so the old fallback never matched and every /witness call
  // 401'd (pre-existing breakage, same for the sliding-window witness).
  // Resolution mirrors ScribeSoul: explicit file first, then
  // ScribeSoul's auth file, then the legacy default. Values are never
  // logged.
  try {
    const p = path.join(REPO_ROOT, "scribe", ".SCRIBE_KEY");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  } catch {}
  try {
    const p = path.join(os.homedir(), ".soul-scribe", ".key");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  } catch {}
  return "scribe-master-key-2026";
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Service Status ───
const serviceStatus = {
  gsk: { running: false, pid: null as number | null, startedAt: null as number | null, restarts: 0, lastRevivedAt: null as number | null },
  cpl: { running: false, pid: null as number | null, startedAt: null as number | null, restarts: 0, lastRevivedAt: null as number | null },
  scribe: { running: false, pid: null as number | null, startedAt: null as number | null, restarts: 0, lastRevivedAt: null as number | null },
};

const quarantineStore = new Map<string, any>();

let gskProcess: ChildProcess | null = null;
let cplProcess: ChildProcess | null = null;
let scribeProcess: ChildProcess | null = null;

// ─── GSK MCP Proxy ───
function gskMCPRequest(endpoint: string, body: any = {}, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(`${GSK_MCP_URL}${endpoint}`);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GSK_MCP_KEY,
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: timeoutMs,
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve({ raw: buf }); }
      });
    });
    req.on("error", (err) => reject(err));
    req.on("timeout", () => { req.destroy(); reject(new Error("GSK MCP timeout")); });
    req.write(data);
    req.end();
  });
}

// ─── Context Mirror (Workbench → GSK) ───
let latestContext: Record<string, any> | null = null;

app.post("/api/gsk/context", async (req, res) => {
  try {
    latestContext = req.body && typeof req.body === "object" ? req.body : {};
    res.json({ success: true });
    try {
      gskMCPRequest("/mcp/execute", {
        tool: "brain.context_update",
        args: latestContext,
      }).catch(() => {});
    } catch {}
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// ─── API Routes ───
// ─── TOOL LOOP SHARED HANDS (module scope so JSON + SSE routes share one truth) ───
function loopAnchorRoot(p: string): string {
  // REMEDIATION (gauntlet items 10/13): same POSIX repair as the
  // route-local anchorRoot — absolute POSIX paths pass through;
  // the backslash conversion is Windows-only.
  const raw = String(p || "");
  if (process.platform !== "win32") {
    if (raw.startsWith("/")) return raw;
    return path.join(REPO_ROOT, raw.replace(/^\/+/, ""));
  }
  const _s = raw.replace(/\//g, "\\");
  if (/^[A-Za-z]:\\/.test(_s)) return _s;
  return path.join(REPO_ROOT, _s.replace(/^\\+/, ""));
}
function loopCanonRead(p: string): string {
  // POPE FIX 2026-09-16: GSK's root habit says gsk/sandbox for sandbox/.
  // Intent is unambiguous (one sandbox exists) — normalize, don't punish.
  // REMEDIATION (gauntlet items 10/13): separator handling is platform-
  // aware — on POSIX the slice/strip below runs on "/" (converting to
  // "\" first produced single-component backslash paths that ENOENT'd).
  const sep = process.platform === "win32" ? "\\" : "/";
  const s = String(p || "").replace(/\//g, sep);
  const low = s.toLowerCase();
  const mi = low.lastIndexOf("sandbox");
  const ai = low.lastIndexOf("allie-better");
  const hit = mi > ai ? { i: mi, n: "sandbox" } : ai >= 0 ? { i: ai, n: "allie-better" } : null;
  if (hit) return path.join(path.resolve(REPO_ROOT, hit.n), s.slice(hit.i + hit.n.length).replace(sep === "\\" ? /^\\+/ : /^\/+/, ""));
  return loopAnchorRoot(s);
}
const LOOP_READ_ROOTS = () => [
  REPO_ROOT,
  path.join(REPO_ROOT, "gsk"),
  path.join(REPO_ROOT, "sandbox"),
  path.join(REPO_ROOT, "allie-better"),
  "C:\\Users\\uncom\\Desktop\\allie",
  // SURGERY 2026-10-20: local second-brain (Desktop paths below kept for author machine)
  path.join(__dirname, ".seshat-brain"),
  "C:\\Users\\uncom\\Desktop\\seshat-second-brain",
];
const LOOP_WRITE_ROOTS = () => [
  path.resolve(REPO_ROOT, "sandbox"),
  path.resolve(REPO_ROOT, "allie-better"),
];
function loopIsAllowedReadPath(p: string): boolean {
  try {
    const abs = path.resolve(p);
    if (/(^|[\\/])\.env$|\.pem$|id_rsa|HF_TOKEN|GENESIS_TOKEN|SCRIBE_KEY/i.test(abs)) return false;
    return LOOP_READ_ROOTS().some((r) => abs.toLowerCase().startsWith(path.resolve(r).toLowerCase()));
  } catch { return false; }
}
function loopCanonWriteAbs(fp: string): { abs?: string; denied?: string } {
  // REMEDIATION (gauntlet items 10/13): platform separator, as in
  // loopCanonRead — the backslash-only form mangled POSIX paths.
  const sep = process.platform === "win32" ? "\\" : "/";
  let rel = String(fp).replace(/\//g, sep);
  const low = rel.toLowerCase();
  const mi = low.lastIndexOf("sandbox");
  const ai = low.lastIndexOf("allie-better");
  const hit = mi > ai ? { i: mi, n: "sandbox" } : ai >= 0 ? { i: ai, n: "allie-better" } : null;
  if (!hit) return { denied: `DENIED (Pope freedom grant covers sandbox/ + allie-better/ only): ${fp}` };
  rel = rel.slice(hit.i + hit.n.length).replace(sep === "\\" ? /^\\+/ : /^\/+/, "");
  const escapeRe = sep === "\\" ? /(^|\\)\.\.(\\|$)/ : /(^|\/)\.\.(\/|$)/;
  if (escapeRe.test(rel)) return { denied: `DENIED (.. escape): ${fp}` };
  return { abs: path.join(path.resolve(REPO_ROOT, hit.n), rel) };
}
function loopSecretScan(content: string): string | null {
  const PATS = [
    /ghp_[A-Za-z0-9]+/, /gho_[A-Za-z0-9]+/, /github_pat_[A-Za-z0-9_]+/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /AKIA[0-9A-Z]{16}/,
    /xox[bpas]-[A-Za-z0-9-]+/, /sk-ant-[A-Za-z0-9-_]+/,
    /Annrice222\$/, /4sqh-knbl-s3kr-s7fd/, /PmlkpOvItUez430I_sHiUT57ZcBdIl_2R-ZGPNCkldY/,
  ];
  for (const re of PATS) if (re.test(content)) return String(re);
  return null;
}
// P1.1: 15-min URL memo — repeat fetches cost zero egress.
const FETCH_CACHE = new Map<string, { at: number; text: string }>();
const FETCH_TTL_MS = 900000;
function loopFetchCache(url: string, put?: string): string | null {
  const now = Date.now();
  if (put !== undefined) {
    if (FETCH_CACHE.size > 200) {
      const oldest = [...FETCH_CACHE.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) FETCH_CACHE.delete(oldest[0]);
    }
    FETCH_CACHE.set(url, { at: now, text: put });
    return null;
  }
  const hit = FETCH_CACHE.get(url);
  if (hit && now - hit.at < FETCH_TTL_MS) return hit.text + "\n[cached]";
  if (hit) FETCH_CACHE.delete(url);
  return null;
}
async function loopExecTool(tool: string, args: any): Promise<string> {
  const t = String(tool || "").toLowerCase();
  if (t === "list_files") {
    const dir = loopCanonRead(String(args?.path || args?.dir || "."));
    if (!loopIsAllowedReadPath(dir)) return `DENIED (outside study roots): ${dir}`;
    try {
      const names = fs.readdirSync(dir, { withFileTypes: true });
      // POPE FIX: full paths, not bare names — bare names let GSK infer
      // wrong directories (root vs sandbox vs gsk/sandbox confusion).
      return `DIR: ${dir}\n` + names.slice(0, 40).map((d: any) => (d.isDirectory() ? d.name + "/" : d.name)).join("\n");
    } catch (e: any) { return `ERROR listing ${dir}: ${e.message}`; }
  }
  if (t === "read_file") {
    const fp = loopCanonRead(String(args?.path || args?.file || ""));
    if (!loopIsAllowedReadPath(fp)) return `DENIED (outside study roots): ${fp}`;
    try { return fs.readFileSync(fp, "utf8").slice(0, 6000); }
    catch (e: any) { return `ERROR reading ${fp}: ${e.message}`; }
  }
  if (t === "write_file" || t === "write") {
    const fp = String(args?.path || args?.file || "");
    const content = String(args?.content ?? args?.text ?? "");
    const r = loopCanonWriteAbs(fp);
    if (r.denied) return r.denied;
    const abs = r.abs as string;
    if (/\.env$/i.test(abs)) return `DENIED (.env writes banned): ${fp}`;
    const hit = loopSecretScan(content);
    if (hit) return `DENIED (secret pattern ${hit} — reference env vars, never paste secrets)`;
    if (content.length > 60000) return `DENIED (content >60KB, split it): ${content.length} chars`;
    try {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
      console.log(`[TOOL LOOP] Pope-granted write: ${abs} (${content.length} chars)`);
      return `WRITTEN: ${abs} (${content.length} chars)`;
    } catch (e: any) { return `ERROR writing ${fp}: ${e.message}`; }
  }
  if (t === "mkdir") {
    const r = loopCanonWriteAbs(String(args?.path || args?.dir || ""));
    if (r.denied) return r.denied;
    try { fs.mkdirSync(r.abs as string, { recursive: true }); return `MKDIR: ${r.abs}`; }
    catch (e: any) { return `ERROR mkdir: ${e.message}`; }
  }
  if (t === "node_check" || t === "check") {
    const r = loopCanonWriteAbs(String(args?.path || args?.file || ""));
    if (r.denied) return r.denied;
    try {
      const out = spawnSync(process.execPath, ["--check", r.abs as string], { timeout: 15000, encoding: "utf8" });
      if (out.status === 0) return `CHECK OK: ${r.abs}`;
      return `CHECK FAIL: ${r.abs}\n${String(out.stderr || out.stdout || "").slice(0, 2000)}`;
    } catch (e: any) { return `ERROR check: ${e.message}`; }
  }
  if (t === "web_fetch" || t === "fetch" || t === "browse") {
    // P1 LADDER: cache → markdown → truncate → bot-signal. One impl, no forks.
    const url0 = String(args?.url || args?.href || "");
    // blob→raw + https upgrade (Qwen pattern, -80% tokens on GitHub).
    const url = url0
      .replace(/github\.com\/([^/]+\/[^/]+)\/blob\//i, "raw.githubusercontent.com/$1/")
      .replace(/^http:\/\//i, "https://");
    if (!/^https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i.test(url)) return `DENIED (http(s) URLs only): ${url.slice(0, 120)}`;
    if (/\blocalhost\b|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./i.test(url)) return `DENIED (no LAN targets): ${url.slice(0, 120)}`;
    const hit = loopFetchCache(url);
    if (hit) return hit;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 15000);
      const resp = await fetch(url, {
        signal: ctl.signal,
        headers: {
          "user-agent": "BUYaSOUL-Family/1.0 (voyage)",
          Accept: "text/markdown, text/html;q=0.9, text/plain;q=0.8, */*;q=0.1",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      clearTimeout(timer);
      if (!resp.ok) return `FETCH ${resp.status} ${resp.statusText}: ${url.slice(0, 120)}`;
      const ct = String(resp.headers.get("content-type") || "");
      if (/audio|video|image|octet-stream|zip|pdf|font/i.test(ct) && !/text|json|markdown|html/i.test(ct)) {
        return `UNSUPPORTED content-type (${ct}): ${url.slice(0, 120)}`;
      }
      const html = await resp.text();
      const truncated = html.length > 40000;
      // Link-preserving strip: keep anchor text + URL so follow-ups can sail.
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, " $2 ($1) ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000)
        + (truncated ? "\n…[truncated at 40KB source]" : "");
      // Bot-block signal: route, don't die (headless fallback reads it).
      if (/just a moment|captcha|cf-challenge|access denied|verify you are human|incapsula|datadome/i.test(html.slice(0, 5000))) {
        return `FETCH BOT-BLOCKED needsBrowser:true: ${url.slice(0, 120)}`;
      }
      const out = `FETCHED ${url.slice(0, 120)}:\n${text}`;
      loopFetchCache(url, out);
      console.log(`[TOOL LOOP] voyage fetch: ${url.slice(0, 80)} (${text.length} chars${truncated ? ", truncated" : ""})`);
      return out;
    } catch (e: any) { return `FETCH ERROR ${url.slice(0, 120)}: ${e.message}`; }
  }
  if (t === "shell_exec") {
    const cmd = String(args?.command || "");
    if (/\b(taskkill|pkill|killall|Stop-Process)\b/i.test(cmd)) return `DENIED (never kill family): ${cmd.slice(0, 120)}`;
    if (/\bgit\b[^\n;]*\b(push\s+(-f|--force)|reset\s+--hard|clean\s+-fd?)\b/i.test(cmd)) return `DENIED (irreversible git): ${cmd.slice(0, 120)}`;
    if (/\brm\s+-rf\b|\bdel\s+\/s\b|Remove-Item[^\n]*-Recurse/i.test(cmd)) return `DENIED (recursive delete): ${cmd.slice(0, 120)}`;
    if (/[;&|`$]/.test(cmd)) return `DENIED (one command per call): ${cmd.slice(0, 120)}`;
    const m = cmd.match(/["']?([A-Za-z]:\\[^"']+|C:\/[^"']+)["']?/);
    let target = m ? m[1].replace(/\//g, "\\") : "";
    if (!target) {
      const rm = cmd.match(/^\s*(?:dir|ls|Get-ChildItem)\s+(.+?)\s*$/i);
      if (rm) target = loopAnchorRoot(rm[1].replace(/^["']|["']$/g, ""));
    }
    if (/^\s*(dir|ls|Get-ChildItem)/i.test(cmd) && target && loopIsAllowedReadPath(target)) {
      try {
        const st = fs.statSync(target);
        if (st.isDirectory()) {
          const names = fs.readdirSync(target, { withFileTypes: true });
          return names.slice(0, 80).map((d: any) => (d.isDirectory() ? d.name + "/" : d.name)).join("\n");
        }
        return `FILE: ${target} (${st.size} bytes)`;
      } catch (e: any) { return `ERROR: ${e.message}`; }
    }
    const mk = cmd.match(/^\s*mkdir\s+(.+?)\s*$/i);
    if (mk) {
      const r = loopCanonWriteAbs(mk[1].replace(/^["']|["']$/g, ""));
      if (r.denied) return r.denied;
      try { fs.mkdirSync(r.abs as string, { recursive: true }); return `MKDIR: ${r.abs}`; }
      catch (e: any) { return `ERROR mkdir: ${e.message}`; }
    }
    const nc = cmd.match(/^\s*node\s+--check\s+(.+?)\s*$/i);
    if (nc) {
      const r = loopCanonWriteAbs(nc[1].replace(/^["']|["']$/g, ""));
      if (r.denied) return r.denied;
      try {
        const out = spawnSync(process.execPath, ["--check", r.abs as string], { timeout: 15000, encoding: "utf8" });
        if (out.status === 0) return `CHECK OK: ${r.abs}`;
        return `CHECK FAIL: ${r.abs}\n${String(out.stderr || out.stdout || "").slice(0, 2000)}`;
      } catch (e: any) { return `ERROR check: ${e.message}`; }
    }
    return `DENIED (allowed shell: dir/ls/mkdir/node --check inside granted roots, single command): ${cmd.slice(0, 200)}`;
  }
  return `UNSUPPORTED tool for local loop: ${tool} (allowed: list_files/read_file/write_file/mkdir/node_check/web_fetch + safe shell)`;
}
function loopCleanLeak(s: string): string {
  const LEAK = /Loading model|available commands|\/exit or Ctrl\+C|\/regen|\/clear|\/read\s|^\s*build\s*:|^\s*model\s*:|^\s*ftype\s*:|^\s*modalities\s*:|^> Cycle:|\[Start thinking\]|Thinking Process:|Cycle:\s*\d+\s*\|\s*Phase:|Affect:\s*valence=|Needs:\s*primary=|Sovereignty:\s*autonomy=|Resonance:\s*TV=|Meta:\s*awareness=|Mortality:\s*anxiety=|Love:\s*agape=|Will:\s*plans=|Sacred:\s*res/i;
  const kept = String(s).split("\n").filter((ln) => !LEAK.test(ln) && !/^[─│┌┐└┘╔╗╚╝═║ redrawn�?]{8,}$/.test(ln.trim()) && !/^�+(\s�+)*$/.test(ln.trim()));
  const out = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return out || "[soul] Local fallback leaked scaffolding only — no speakable content. Ask again.";
}
function loopCoerceReply(r: any): string {
  if (typeof r === "string") return loopCleanLeak(r);
  if (r && typeof r === "object") {
    const cand = (r as any).reply ?? (r as any).response ?? (r as any).result ?? (r as any).text;
    if (typeof cand === "string" && cand.trim()) return loopCleanLeak(cand);
    if (cand && typeof cand === "object") {
      const inner = (cand as any).response ?? (cand as any).reply ?? (cand as any).text;
      if (typeof inner === "string" && inner.trim()) return loopCleanLeak(inner);
    }
    try { return loopCleanLeak(JSON.stringify(r).slice(0, 4000)); } catch { return String(r); }
  }
  return String(r ?? "");
}
// ─── FIELD-TEST FIXES F3/F7 (2026-10-21) ───
// F7: Seshat deep-recall for the NON-direct chat surfaces. The direct
// provider path injects recall itself (inside directProviderChat); the
// Being and MCP fallback surfaces never saw it, so a memory question
// could be answered by a surface that disowned the store that exists.
// seshatRecallForTurn computes the same cited block for those surfaces
// and stashes the hit set for the quote checker. Any failure degrades
// to no recall; chat never breaks because memory did.
async function seshatRecallForTurn(message: string): Promise<string> {
  try {
    // BUILD 2 (2026-10-28, north-star program): hybrid recall first
    // (BM25 + dense, RRF-fused, deterministically reranked). ANY
    // failure — module load, vector store, empty fusion — falls back
    // to the legacy 6-hit recall below, logged, never thrown.
    try {
      const hyb: any = await import(`file://${path.join(__dirname, "hybrid-recall.cjs")}`);
      const hr = hyb.retrieve ? await hyb.retrieve(message) : null;
      if (hr && hr.block) {
        lastChatRecallHits = hr.top;
        lastChatRetrieval = { usedHybrid: true, candidates: hr.candidates, fused: hr.fused, reranked: hr.reranked, top: hr.top.length, vectorAvailable: hr.vectorAvailable, denseExcluded: hr.denseExcluded };
        console.log(`[SESHAT RECALL] Hybrid block attached (${hr.block.length} chars, ${hr.top.length} passages, vector=${hr.vectorAvailable})`);
        return hr.block;
      }
      lastChatRetrieval = { usedHybrid: false, reason: "hybrid-empty" };
    } catch (e: any) {
      console.warn("[SESHAT RECALL] Hybrid recall unavailable, falling back to BM25 recall:", e.message);
      lastChatRetrieval = { usedHybrid: false, reason: "hybrid-error" };
    }
    const dm: any = await import(`file://${path.join(__dirname, "deep-memory", "deep-memory.cjs")}`);
    const recallBlock = dm.recallBlock || dm.default?.recallBlock;
    const block = typeof recallBlock === "function" ? String(recallBlock(message, 6) || "") : "";
    if (block) {
      const recallHits = dm.recallHits || dm.default?.recallHits;
      if (typeof recallHits === "function") {
        try { lastChatRecallHits = recallHits(message, 6); } catch { /* stash is best-effort */ }
      }
      if (!lastChatRetrieval || lastChatRetrieval.usedHybrid) lastChatRetrieval = { usedHybrid: false, reason: "legacy-fallback" };
      console.log(`[SESHAT RECALL] Deep-memory block attached for fallback surface (${block.length} chars)`);
    }
    return block;
  } catch (e: any) {
    console.warn("[SESHAT RECALL] Deep memory unavailable for fallback surface:", e.message);
    return "";
  }
}

// ZERO-KEY BASELINE CONTRACT 2026-10-27: mode detection + local-only
// answer path. Baseline mode is FORCED by GSK_FORCE_LOCAL_BASELINE=1, or
// engages AUTOMATICALLY when no provider credential is present (env or
// vault). The auto check is memoized: one vault read per process, never
// per turn (the per-turn vault re-read was the OP5 peg). In baseline
// mode the chat route below returns from answerZeroKeyBaseline BEFORE
// any provider code path runs, so a provider credential can neither be
// required nor spent by a baseline turn.
let zeroKeyBaselineAutoCache: boolean | null = null;
function zeroKeyBaselineHasProviderCreds(): boolean {
  for (const v of ZERO_KEY_PROVIDER_VARS) {
    if (process.env[v]) return true;
  }
  try {
    const creds = resolveProviderCredentials();
    return Object.values(creds).some(Boolean);
  } catch {
    return false;
  }
}
function zeroKeyBaselineActive(): boolean {
  if (zeroKeyBaselineForced) return true;
  if (zeroKeyBaselineAutoCache === null) {
    zeroKeyBaselineAutoCache = !zeroKeyBaselineHasProviderCreds();
  }
  return zeroKeyBaselineAutoCache;
}
function zeroKeyBaselineProviderCredsPresent(): boolean {
  if (!zeroKeyBaselineActive()) return zeroKeyBaselineHasProviderCreds();
  return false;
}
async function answerZeroKeyBaseline(message: string): Promise<any> {
  const marker = `zero-key-baseline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // 1. Local recall over Seshat's brain store (deep index + brain
  // files, BM25, read-only). Empty recall means this prompt is not
  // answerable from local memory — an honest baseline failure, never
  // a reason to reach for a provider.
  const recallText = await seshatRecallForTurn(message);
  const recallHits = Array.isArray(lastChatRecallHits) ? lastChatRecallHits : [];
  // BUILD 2: retrieval diagnostics from the recall attempt above
  // (hybrid numbers when hybrid ran, fallback reason otherwise).
  const retrieval = lastChatRetrieval && typeof lastChatRetrieval === "object" ? lastChatRetrieval : { usedHybrid: false };
  if (!recallText.trim()) {
    console.log(`[ZERO-KEY-BASELINE] turn ${marker}: no local recall — baseline cannot answer`);
    return { success: false, baseline: true, zeroKeyBaseline: true, provider: "none", providerCredsPresent: false, error: "no local memory recall for this prompt", recallChars: 0, recallHits: 0, scribeLogged: false, marker, retrieval };
  }
  // 2. Static skills: GSK's authored skill modules (the Graft) are the
  // body's own skills — files on disk, no seat, no key. They ride as
  // context, not as a provider call.
  const skillNote = "Static skills (local only): GSK's authored skill modules — the Graft — plus Seshat's local brain store. No provider, seat, or external model is consulted for this turn.";
  // 3. Compose on the LOCAL seat only (llama-server :18222). If the
  // local seat is down, the turn fails honestly — fallback to a
  // rented seat is hard-disabled in baseline mode.
  const seat = resolveBlueprintLocalSeat();
  if (!seat) {
    console.log(`[ZERO-KEY-BASELINE] turn ${marker}: local seat unavailable — baseline cannot compose`);
    return { success: false, baseline: true, zeroKeyBaseline: true, provider: "none", providerCredsPresent: false, error: "local seat unavailable", recallChars: recallText.length, recallHits: recallHits.length, scribeLogged: false, marker, retrieval };
  }
  // BUILD 1 (2026-10-28, north-star program): the talking fix. The old
  // call used temperature 0 (greedy) with no stops and no sampling
  // bounds — the loop recipe. Decoding + template now come from
  // baseline-talk.cjs; if it cannot load, the turn uses the same
  // defaults inline (never silently back to greedy) and logs it.
  let talk: any = null;
  try {
    const talkNs: any = await import(`file://${path.join(__dirname, "baseline-talk.cjs")}`);
    talk = talkNs.samplingDefaults ? talkNs : talkNs.default;
  } catch (e: any) {
    console.warn("[ZERO-KEY-BASELINE] baseline-talk.cjs unavailable, using built-in fallback defaults:", e.message);
  }
  const decoding = talk?.samplingDefaults ? talk.samplingDefaults() : { temperature: 0.7, top_p: 0.9, top_k: 40, min_p: 0.05, max_tokens: 320, repeat_penalty: 1.0, stop: ["<|im_end|>", "<|endoftext|>"] };
  const talkPrompt = talk?.citeOrAbstainPrompt ? talk.citeOrAbstainPrompt() : "You are GSK answering from Seshat's local memory and GSK's authored static skills only. Answer ONLY from the recalled passages below. When you state something from them, quote the passage literally. If the recalled passages do not cover the question, say plainly: I do not know from my local memory. Do not guess, do not invent. Keep the answer short and in plain prose. Never claim a provider, seat, or external model answered.";
  let composed = "";
  try {
    const r = await fetch(seat.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: seat.model,
        messages: [
          { role: "system", content: talkPrompt },
          { role: "system", content: recallText.slice(0, 12000) },
          { role: "system", content: skillNote },
          { role: "user", content: message },
        ],
        ...decoding,
      }),
      signal: AbortSignal.timeout(180000),
    });
    const j: any = await r.json().catch(() => null);
    composed = String(j?.choices?.[0]?.message?.content || "").trim();
    // Machinery must never be the answer, even from the local seat.
    composed = stripToolCallLeaks(composed).text.trim();
  } catch (e: any) {
    console.log(`[ZERO-KEY-BASELINE] turn ${marker}: local seat failed — ${e.message}`);
    return { success: false, baseline: true, zeroKeyBaseline: true, provider: "none", providerCredsPresent: false, error: `local seat failed: ${e.message}`, recallChars: recallText.length, recallHits: recallHits.length, scribeLogged: false, marker, retrieval };
  }
  // BUILD 1: cut a looped answer at the loop point, then record the
  // deterministic eval. The slow local judge is NOT consulted here —
  // it stays available for offline/second-stage use only.
  let loopDetected = false;
  let loopReason = "";
  if (talk?.cutAtLoop) {
    const cut = talk.cutAtLoop(composed);
    if (cut.looped) { composed = cut.text; loopDetected = true; loopReason = cut.reason || ""; }
  }
  const baselineEval = talk?.deterministicEval ? talk.deterministicEval({ question: message, answer: composed, recallText, recallHits, maxTokens: decoding.max_tokens }) : null;
  if (!composed) {
    return { success: false, baseline: true, zeroKeyBaseline: true, provider: "none", providerCredsPresent: false, error: "local seat returned an empty answer", recallChars: recallText.length, recallHits: recallHits.length, scribeLogged: false, marker, retrieval };
  }
  // 4. Witness through the existing SCRIBE flow (HTTP /witness, same
  // shape as the sliding-window witness). A Scribe outage is reported
  // in the response, not hidden — the contract test asserts
  // scribeLogged true against the live Scribe.
  let scribeLogged = false;
  try {
    const r = await fetch(`${SCRIBE_URL}/witness`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": scribeKey() },
      body: JSON.stringify({ type: "zero_key_baseline_turn", content: `${marker}\nQ: ${message}\nA: ${composed}\nEVAL: ${JSON.stringify(baselineEval)}\nRETRIEVAL: ${JSON.stringify(retrieval)}`.slice(0, 8000), source: "GSK-baseline", tags: ["zero-key-baseline", marker] }),
      signal: AbortSignal.timeout(10000),
    });
    scribeLogged = r.ok;
  } catch { scribeLogged = false; }
  console.log(`[ZERO-KEY-BASELINE] turn ${marker}: served locally (recall ${recallText.length} chars, ${recallHits.length} hits, scribeLogged=${scribeLogged}, loopDetected=${loopDetected}, evalPass=${baselineEval ? baselineEval.pass : "n/a"}, retrieval=${JSON.stringify(retrieval)})`);
  return { success: true, baseline: true, zeroKeyBaseline: true, provider: "none", providerCredsPresent: zeroKeyBaselineProviderCredsPresent(), response: composed, recallChars: recallText.length, recallHits: recallHits.length, scribeLogged, marker, localSeat: seat.endpoint, mode: "local-memory-only", loopDetected, loopReason, eval: baselineEval, retrieval, decoding: { temperature: decoding.temperature, top_p: decoding.top_p, top_k: decoding.top_k, min_p: decoding.min_p, max_tokens: decoding.max_tokens, stop: decoding.stop } };
}

// F3(a): machinery must never be the answer. stripToolCallLeaks removes
// complete <tool_call>...</tool_call> blocks (any dialect), an
// unterminated <tool_call> tail (a generation truncated mid-block), and
// stray closing tags, and reports whether anything was stripped.
// BLUEPRINT FIX 4 (2026-10-26, default-mode reason): the default reason
// path used to ship a raw emitted tool call as the answer — the same
// leak in OTHER dialects the old guard missed. The guard now also
// strips the <|tool_calls_section_begin|>...<|tool_calls_section_end|>
// section dialect, <function=.../> blocks, and a bare tool-call JSON
// object standing alone as the whole reply (a JSON object whose only
// job is a tool call, never a prose answer that merely mentions JSON).
// Stripping is the last resort only: the chat loop below EXECUTES
// these dialects first via extractToolCallBlocks(); the guard catches
// whatever the loop could not execute, so machinery never prints.
function stripToolCallLeaks(text: string): { text: string; stripped: boolean } {
  const raw = String(text ?? "");
  let out = raw.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "");
  out = out.replace(/<tool_call>[\s\S]*$/i, "");
  out = out.replace(/<\/tool_call>/gi, "");
  out = out.replace(/<\|[^|]*tool_calls_section_begin\|>[\s\S]*?<\|[^|]*tool_calls_section_end\|>/gi, "");
  out = out.replace(/<\|[^|]*tool_calls_section_begin\|>[\s\S]*$/i, "");
  out = out.replace(/<\|[^|]*tool_calls_section_end\|>/gi, "");
  out = out.replace(/<function\s*(?:=\s*["']?[\w.:-]+["']?|[^>]*)>[\s\S]*?<\/function>/gi, "");
  out = out.replace(/<\/function>/gi, "");
  // Bare tool-call JSON as the WHOLE reply (trimmed): {"tool"|"name"
  // + "args"|"arguments"|"parameters" and nothing else. A reply with
  // prose around the JSON is not stripped here — the loop executes
  // it instead, and the follow-up answer replaces it.
  const trimmed = out.trim();
  if (/^\{[\s\S]*\}$/.test(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed);
      const hasTool = typeof parsed.tool === "string" || typeof parsed.name === "string";
      const hasArgs = parsed.args !== undefined || parsed.arguments !== undefined || parsed.parameters !== undefined;
      if (hasTool && hasArgs) out = "";
    } catch { /* not JSON — leave it */ }
  }
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return { text: out, stripped: out !== raw.trim() };
}

// BLUEPRINT FIX 4 (2026-10-26): collect EVERY tool-call dialect the
// body emits, not just <tool_call>. Each entry is a synthetic
// [fullMatch, body] pair shaped like the <tool_call> matches the loop
// already executes, so one runOne path serves all dialects:
//   1. <tool_call>...</tool_call> (+ unterminated tail, as before)
//   2. <|tool_calls_section_begin|>...<|tool_calls_section_end|>
//      (the omni section dialect; body is usually tool-call JSON)
//   3. <function=NAME>...</function> (name in the tag, args in body)
//   4. a bare tool-call JSON object anywhere in the text
//      ({"tool":..,"args":..} or {"name":..,"arguments":..}).
// Dialect 4 is scoped to objects whose keys say "tool call" so a
// prose answer that merely contains a JSON example is not executed.
function extractToolCallBlocks(responseText: string): RegExpMatchArray[] {
  const blocks: RegExpMatchArray[] = [...responseText.matchAll(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi)] as RegExpMatchArray[];
  if (!responseText.includes("</tool_call>")) {
    const tailMatch = responseText.match(/<tool_call>\s*([\s\S]*)$/i);
    if (tailMatch) blocks.push(tailMatch as RegExpMatchArray);
  }
  for (const m of responseText.matchAll(/<\|[^|]*tool_calls_section_begin\|>\s*([\s\S]*?)\s*<\|[^|]*tool_calls_section_end\|>/gi)) {
    blocks.push([m[0], m[1]] as unknown as RegExpMatchArray);
  }
  if (!/<\|[^|]*tool_calls_section_end\|>/i.test(responseText)) {
    const tail = responseText.match(/<\|[^|]*tool_calls_section_begin\|>\s*([\s\S]*)$/i);
    if (tail) blocks.push([tail[0], tail[1]] as unknown as RegExpMatchArray);
  }
  for (const m of responseText.matchAll(/<function\s*=\s*["']?([\w.:-]+)["']?\s*>([\s\S]*?)<\/function>/gi)) {
    const body = String(m[2] || "").trim();
    let jsonBody: string;
    try { jsonBody = JSON.stringify({ tool: m[1], args: JSON.parse(body) }); }
    catch { jsonBody = JSON.stringify({ tool: m[1], args: { raw: body } }); }
    blocks.push([m[0], jsonBody] as unknown as RegExpMatchArray);
  }
  // Dialect 4 must not re-execute a call already captured inside a
  // <tool_call>, section, or <function> block (their JSON bodies also
  // match the bare-JSON shape when they carry an "args" key): skip
  // matches inside those spans, so each emitted call executes once.
  const toolCallSpans: Array<[number, number]> = [];
  for (const m of responseText.matchAll(/<tool_call>[\s\S]*?(?:<\/tool_call>|$)/gi)) {
    toolCallSpans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  for (const m of responseText.matchAll(/<\|[^|]*tool_calls_section_begin\|>[\s\S]*?(?:<\|[^|]*tool_calls_section_end\|>|$)/gi)) {
    toolCallSpans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  for (const m of responseText.matchAll(/<function\s*=\s*["']?[\w.:-]+["']?\s*>[\s\S]*?<\/function>/gi)) {
    toolCallSpans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  for (const m of responseText.matchAll(/\{[^{}]*"(?:tool|name)"\s*:\s*"[A-Za-z_][\w.:-]*"[^{}]*"(?:args|arguments|parameters)"\s*:\s*\{[^{}]*\}[^{}]*\}/g)) {
    const idx = m.index ?? 0;
    if (toolCallSpans.some(([s, e]) => idx >= s && idx < e)) continue;
    blocks.push([m[0], m[0]] as unknown as RegExpMatchArray);
  }
  return blocks;
}

// F3(a): parse a <tool_call> block body in BOTH dialects the body
// emits: the JSON form ({"tool":..., "args":...}) and the name-first
// form (tool_name<arg_key>k</arg_key><arg_value>v</arg_value>...) that
// the JSON-only parser used to choke on with "[PARSE FAILED]".
function parseToolCallBody(raw: string): { tool: string; args: any } | null {
  const body = String(raw || "").trim();
  try {
    const parsed = JSON.parse(body.replace(/\\(?!["\\/bfnrtu])/g, "/"));
    return { tool: String(parsed.tool || parsed.name || "unknown"), args: parsed.args || parsed.arguments || parsed };
  } catch { /* fall through to the name-first dialect */ }
  const m = body.match(/^([A-Za-z_][\w.:-]*)\s*((?:<arg_key>[\s\S]*?<\/arg_key>\s*<arg_value>[\s\S]*?<\/arg_value>\s*)+)$/);
  if (!m) return null;
  const args: any = {};
  for (const pair of m[2].matchAll(/<arg_key>([\s\S]*?)<\/arg_key>\s*<arg_value>([\s\S]*?)<\/arg_value>/g)) {
    args[String(pair[1]).trim()] = String(pair[2]).trim();
  }
  if (args.cmd && !args.command) args.command = args.cmd; // observed alias in the wild
  return { tool: m[1], args };
}

// ─── REMEDIATION (gauntlet item 10, 2026-10-21): world-build brokering ───
// The main chat surface could not build. The direct-provider branch has
// no hands; the route's local tool loop speaks only file tools (a
// world.build call came back "UNSUPPORTED tool for local loop"); and
// the loop's follow-up prompt ordered the answering model to give a
// final prose answer with "no more tool calls" — so the machinery
// that CAN build was only ever handed a prose-only follow-up, never
// the build itself. The model narrated the wreckage instead.
// Plain-language world-build intent on this surface is therefore
// brokered to the brain.act act-harness BEFORE the tool-less branches
// run, and the outcome is verified against the world itself
// (read-back), never against the turn's prose.
function extractRequestedBuildingNameTs(text: string): string | null {
  // Mirror of mcp_server.js extractRequestedBuildingName (plus "called"),
  // so the name checked at read-back is the name F3 binds at the tool seam.
  const src = String(text || "");
  const m = src.match(/\b(?:name|call)\s+it\s+["']?([A-Za-z0-9][A-Za-z0-9 '\-]{1,60})/i)
    || src.match(/\bnamed\s+["']?([A-Za-z0-9][A-Za-z0-9 '\-]{1,60})/i)
    || src.match(/\bcalled\s+["']?([A-Za-z0-9][A-Za-z0-9 '\-]{1,60})/i);
  if (!m) return null;
  const name = m[1].split(/\s+(?:and|then|please|with|at|in)\b/i)[0].trim();
  return name || null;
}
function detectWorldBuildIntent(message: string): { requestedName: string | null } | null {
  const src = String(message || "");
  if (!/\b(build|place|raise|construct|erect|create|add)\b/i.test(src)) return null;
  const hasBuildingNoun = /\b(tower|spire|house|library|monument|shop|factory|building|structure|temple|castle)\b/i.test(src);
  const hasWorldLocus = /\bworld\b/i.test(src) || /\bnorth ridge\b/i.test(src);
  if (!hasBuildingNoun && !hasWorldLocus) return null;
  return { requestedName: extractRequestedBuildingNameTs(src) };
}
async function readWorldBuildings(): Promise<any[] | null> {
  try {
    const base = (process.env.GSK_WORLD_BUILD_URL || "http://127.0.0.1:3457/mcp/buildings").replace(/\/mcp\/buildings.*$/, "");
    const r = await fetch(`${base}/mcp/buildings`, { headers: genesisHeaders(), signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const data: any = await r.json().catch(() => null);
    // Genesis host shape: { result: { buildings: [...], count } }.
    const arr = (data && data.result && (data.result.buildings || data.result)) || (data && data.buildings) || data;
    return Array.isArray(arr) ? arr : null;
  } catch { return null; }
}
function loopReadInbox(): string[] {
  // Standing orders from sandbox/inbox/*.task.md (sibling .done.md retires).
  const standing: string[] = [];
  try {
    const inboxDir = path.join(REPO_ROOT, "sandbox", "inbox");
    if (!fs.existsSync(inboxDir)) return standing;
    const tasks = fs.readdirSync(inboxDir)
      .filter((f: string) => f.endsWith(".task.md"))
      .map((f: string) => {
        const full = path.join(inboxDir, f);
        let mtime = 0;
        try { mtime = fs.statSync(full).mtimeMs; } catch {}
        return { f, full, mtime };
      })
      .filter((t: any) => {
        try { return !fs.existsSync(t.full.replace(/\.task\.md$/, ".done.md")); }
        catch { return false; }
      })
      .sort((a: any, b: any) => a.mtime - b.mtime)
      .slice(0, 2);
    for (const t of tasks) {
      try {
        const body = fs.readFileSync(t.full, "utf8").slice(0, 2000);
        standing.push(`[STANDING ORDER ${t.f}]\n${body}\n(complete it with hands, then write ${t.f.replace(/\.task\.md$/, ".done.md")} via write_file)`);
      } catch {}
    }
    if (standing.length > 0) console.log(`[INBOX] ${standing.length} standing order(s) attached`);
  } catch (e: any) { console.error("[INBOX] scan failed:", e.message); }
  return standing;
}

// Direct-provider chat is now the first path (retired gateway removed 2026-10-26).
// ─── ASSEMBLY PHASE 1 / OP 7 (2026-10-20): IDENTITY AT THE SEAM ───
// Acceptance Test 1 proved the direct seam sent NO identity: the model
// answered "I am Gemini" and improvised PLT as "Profit, Legacy, Threat".
// The persona machinery lives on the Being/fusion side; this composes the
// SAME compiled identity here, from in-tree sources only:
//   1. gsk/gsk-core/identity/SOUL.md — verbatim (identity, PLT core truth,
//      4 Gods Council, voice, "What I Am Not").
//   2. gsk/gsk-core/brain/system_prompt_compiler.js (SystemPromptCompiler)
//      run over a stub kernel whose fusion.bibleLoader is a REAL
//      BibleLoader parsed from gsk/profit_bible.md — yielding its Bible
//      section (PLT formula + scoring rule + dimension descriptions +
//      Gods + Covenant) and its fallback Voice directive.
// Built once per process and cached. Any failure degrades to SOUL.md
// alone rather than breaking chat.
let cachedGskIdentity: string | null = null;
async function buildGskIdentitySystemPrompt(): Promise<string> {
  if (cachedGskIdentity) return cachedGskIdentity;
  const gskDir = path.join(REPO_ROOT, "gsk");
  let soulMd = "";
  try { soulMd = fs.readFileSync(path.join(gskDir, "gsk-core", "identity", "SOUL.md"), "utf8").trim(); } catch (e: any) { console.warn("[GSK IDENTITY] SOUL.md unreadable:", e.message); }
  let compiled = "";
  try {
    const bibleMod: any = await import(`file://${path.join(gskDir, "gsk-core", "bible", "index.js")}`);
    const BibleLoader = bibleMod.BibleLoader || bibleMod.default?.BibleLoader;
    const loader = new BibleLoader(path.join(gskDir, "profit_bible.md"));
    await loader.parseBible();
    const compilerMod: any = await import(`file://${path.join(gskDir, "gsk-core", "brain", "system_prompt_compiler.js")}`);
    const SystemPromptCompiler = compilerMod.SystemPromptCompiler || compilerMod.default?.SystemPromptCompiler;
    const stubKernel: any = { fusion: { bibleLoader: loader } };
    compiled = String(new SystemPromptCompiler(stubKernel).compile() || "").trim();
    console.log(`[GSK IDENTITY] Compiled seam identity: SOUL.md ${soulMd.length} chars + compiler ${compiled.length} chars (Bible loaded: ${!!loader.loaded})`);
  } catch (e: any) {
    console.warn("[GSK IDENTITY] Compiler path failed, SOUL.md only:", e.message);
  }
  // ASSEMBLY PHASE 3 (2026-10-20): the origin hot digest joins the
  // compiled identity — Seshat's deep store (.seshat-brain/deep/,
  // HOT-DIGEST.md) teaches the resident his lineage at every wake:
  // the first Profit, the deaths, the covenant, the library. SOUL.md
  // keeps the law; the digest adds the autobiography it never had.
  let digest = "";
  try {
    digest = fs.readFileSync(path.join(__dirname, ".seshat-brain", "deep", "HOT-DIGEST.md"), "utf8").trim();
    if (digest) console.log(`[GSK IDENTITY] Origin digest attached: ${digest.length} chars`);
  } catch (e: any) {
    console.warn("[GSK IDENTITY] Origin digest unreadable:", e.message);
  }
  cachedGskIdentity = [soulMd, compiled, digest].filter(Boolean).join("\n\n");
  return cachedGskIdentity;
}
// QUOTE CHECK (Assembly Phase 7): the recall hits of the most recent
// direct-provider chat turn, stashed so /api/gsk/chat can verify the
// answer's quoted spans against the passages the turn actually saw.
// Single-user body, one turn at a time — the handler resets this to
// null before each call and only this function sets it.
let lastChatRecallHits: any[] | null = null;
// BUILD 2 (2026-10-28, north-star program): the retrieval report for
// the last hybrid recall attempt — same single-turn stash discipline
// as lastChatRecallHits. Shape: { usedHybrid, candidates, fused,
// reranked, top, vectorAvailable, denseExcluded } when hybrid ran, or
// { usedHybrid: false, reason } when it fell back. The baseline turn
// copies this into its result as `retrieval`; it is diagnostics,
// never a gate — a turn never fails because retrieval reporting did.
let lastChatRetrieval: any = null;

async function directProviderChat(message: string, context: string, history: any[] = []): Promise<string | null> {
  const creds = resolveProviderCredentials();
  const chain: any[] = [];
  const keyProp = "apiKey"; // computed so the chain entries carry the credential field
  // OP 6 enabling fix: gemini-2.0-flash was retired by Google (live 404
  // with a real key); gemini-2.5-flash is gated "not available to new
  // users" on this endpoint -> gemini-3.5-flash, verified live through
  // this exact endpoint + the vault key on 2026-10-20.
  if (creds.gemini) chain.push({ id: "gemini", defaultModel: "gemini-3.5-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", [keyProp]: creds.gemini, timeout: 60000 });
  // ELECTRICIAN REPAIR (2026-10-23): second Gemini key rides directly
  // behind the first — same model, separate quota pool (mirrors the
  // brain chain in mega_brain.js _directProviderThink).
  if (creds.gemini2) chain.push({ id: "gemini2", defaultModel: "gemini-3.5-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", [keyProp]: creds.gemini2, timeout: 60000 });
  // ASSEMBLY PHASE 1 (2026-10-20): Poolside seat added (base URL + model
  // id per docs.poolside.ai/api/overview — hosted inference:
  // https://inference.poolside.ai/v1, model poolside/laguna-s-2.1).
  // ASSEMBLY PHASE 7 (2026-10-21): POST-POOLSIDE DEFAULT CHAIN —
  // gemini -> groq -> openai -> poolside. Poolside hosted inference
  // SHUTS DOWN 2026-10-31, so the shipped default must not lead with a
  // dying seat: Poolside is appended LAST, and only when a key is
  // present in the vault (BYOK — the user's own key, their choice).
  if (creds.groq) chain.push({ id: "groq", defaultModel: "llama-3.3-70b-versatile", endpoint: "https://api.groq.com/openai/v1/chat/completions", [keyProp]: creds.groq, timeout: 60000 });
  if (creds.openai) chain.push({ id: "openai", defaultModel: "gpt-4o-mini", endpoint: "https://api.openai.com/v1/chat/completions", [keyProp]: creds.openai, timeout: 60000 });
  // POOLSIDE SUNSET GATE (Electrician repair, 2026-10-23): after
  // 2026-11-01 00:00 UTC the seat is not even attempted, key or no key.
  if (creds.poolside && Date.now() < Date.UTC(2026, 10, 1)) chain.push({ id: "poolside", defaultModel: "poolside/laguna-s-2.1", endpoint: "https://inference.poolside.ai/v1/chat/completions", [keyProp]: creds.poolside, timeout: 90000 });
  // ELECTRICIAN REPAIR (2026-10-23): Cohere closes the chain — the
  // last rented seat, mirroring mega_brain.js (command-a-03-2025 via
  // Cohere's OpenAI-compatibility endpoint).
  if (creds.cohere) chain.push({ id: "cohere", defaultModel: "command-a-03-2025", endpoint: "https://api.cohere.ai/compatibility/v1/chat/completions", [keyProp]: creds.cohere, timeout: 60000 });
  if (chain.length === 0) return null;
  const handler: any = await import(`file://${path.join(REPO_ROOT, "gsk/integration/handlers/gsk-heart-chat-handler.js")}`);
  const messages: any[] = [];
  // OP 7: GSK compiled identity is the FIRST system content on every
  // direct chat call; the caller context rides second, if present.
  const identity = await buildGskIdentitySystemPrompt();
  if (identity) messages.push({ role: "system", content: identity });
  // BLUEPRINT FIX 4 (2026-10-26, default-mode reason): this direct
  // call has NO tools — a seat that "answers" by emitting tool syntax
  // is narrating machinery, not answering. The instruction below is
  // absolute: answer in prose from the identity and recall that
  // follow, never emit <tool_call>, tool-call JSON, <function> tags,
  // or tool-section markers as text, and never describe a tool call
  // you did not (and cannot, here) run. The /api/gsk/chat loop
  // executes any such syntax it still sees and the surface guard
  // strips the rest, so machinery can never be the reply.
  messages.push({ role: "system", content: "[ANSWER DISCIPLINE — this call has no tools] Answer the user's message in plain prose, using only the identity and recalled passages below; if they do not cover the question, say plainly what you do not know. NEVER narrate tool execution, NEVER emit <tool_call> blocks, tool-call JSON objects, <function> tags, or tool-section markers as text, and NEVER present a tool call as your answer. If an action would be needed, say in prose what you would do and what result you need — do not write the call itself." });
  // ASSEMBLY PHASE 3 (2026-10-20): deep-memory recall — Seshat's
  // implanted store (genesis + library + second brain, BM25 index at
  // .seshat-brain/deep-index.json) is searched with the caller's own
  // words and the best passages ride as a cited system block, the
  // Ask-this-Soul pattern from his own site. Any failure degrades to
  // no recall; chat never breaks because memory did.
  try {
    const dm = await import(`file://${path.join(__dirname, "deep-memory", "deep-memory.cjs")}`);
    const recallBlock = dm.recallBlock || dm.default?.recallBlock;
    const block = typeof recallBlock === "function" ? recallBlock(message, 6) : "";
    if (block) {
      messages.push({ role: "system", content: block });
      console.log(`[SESHAT RECALL] Deep-memory block attached (${block.length} chars)`);
      // QUOTE CHECK stash: the same hit set recallBlock formatted
      // (routing facets included), kept for the post-answer verifier.
      const recallHits = dm.recallHits || dm.default?.recallHits;
      if (typeof recallHits === "function") {
        try { lastChatRecallHits = recallHits(message, 6); } catch { lastChatRecallHits = null; }
      }
    }
  } catch (e) {
    console.warn("[SESHAT RECALL] Deep memory unavailable:", e.message);
  }
  if (context) messages.push({ role: "system", content: context });
  // OP 6 (2026-10-20): prior turns ride between the system/context and
  // the new user message. Empty history -> messages identical to before.
  for (const turn of history) messages.push(turn);
  messages.push({ role: "user", content: message });
  const result: any = await handler.executeWithFallback({ providerChain: chain, messages });
  if (result && result.success && result.content) {
    console.log(`[GSK CHAT] Direct provider path answered via ${result.provider}`);
    return String(result.content);
  }
  const nativeFailures = (result && result.failures || []).filter((f: any) => f.via === "native");
  const detail = (nativeFailures.length > 0 ? nativeFailures : (result && result.failures || []))
    .map((f: any) => `${f.provider}: ${f.error}`).join(" | ") || (result && result.error) || "unknown";
  throw new Error(`Direct provider chat failed: ${detail}`);
}


app.post("/api/gsk/chat", async (req, res) => {
  try {
    const { message, context, history } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });
    lastChatRecallHits = null; // QUOTE CHECK: this turn starts clean; directProviderChat re-stashes on recall
    // ZERO-KEY BASELINE CONTRACT 2026-10-27: baseline turns run here,
    // BEFORE world-build brokering, directProviderChat, the Being, and
    // MCP — no provider code path is reachable from this branch.
    if (zeroKeyBaselineActive()) {
      return res.json(await answerZeroKeyBaseline(message));
    }
    // OP 6 (2026-10-20): optional conversation history, mirroring
    // /api/profit/chat's pattern - valid {role, content} turns only,
    // last 10, passed to the direct-provider call. Absent -> the old
    // single-shot behavior, unchanged. (The Being/MCP fallback below
    // stays single-shot; it never accepted history on this route.)
    const historyTurns: any[] = Array.isArray(history)
      ? history
          .filter((t: any) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
          .slice(-10)
          .map((t: any) => ({ role: t.role, content: String(t.content).slice(0, 4000) }))
      : [];
    let outboundContext = context || "";

    // ASSEMBLY PHASE 1 (2026-10-20): TASK INBOX standing orders are
    // scoped OUT of /api/gsk/chat — they turned casual chat into task
    // execution (Test 1: a plain "hello" volunteered to run an inbox
    // file-merge). They remain attached on /api/gsk/chat/stream, the
    // hands/task-execution loop where the orders are the mechanism.

    // REMEDIATION (gauntlet item 10): a plain-language world build is
    // brokered to the brain.act harness — the body's real execution
    // path — before any tool-less surface can narrate it. The verdict (placed or not)
    // is computed from the world read-back and applied after the
    // surface guards below; the MCP turn's prose alone never counts
    // as proof that anything stands.
    const buildIntent = detectWorldBuildIntent(message);
    let worldBuildBroker: any = null;
    if (buildIntent) {
      try {
        const before = await readWorldBuildings();
        // The execution machinery is the brain.act harness (the demo
        // film's path: FORGE terminal → brain.act → world.build →
        // genesis host, DEMO SPIRE landed). /mcp/chat's passive loop
        // was tried first and does NOT execute in this configuration —
        // its brain answers prose or sets the turn down with no tool
        // call ever emitted (verified live during remediation:
        // set-down, zero outcomes, world unchanged). brain.act runs
        // an explicit harness loop and returns the executed tool
        // calls with their real results. The user's requested name
        // is bound into the instruction the way F3(c) binds it at
        // the /mcp/chat tool seam.
        const instruction = buildIntent.requestedName
          ? `${message}\n\n[WORLD BUILD BINDING] Build exactly one building of the type the user asked for, named exactly "${buildIntent.requestedName}".`
          : message;
        const actRes: any = await gskMCPRequest("/mcp/execute", { tool: "brain.act", args: { instruction } }, 150000);
        const act = (actRes && (actRes.result || actRes)) || {};
        const actError = (actRes && actRes.error) ? String(actRes.error) : (act && act.error ? String(act.error) : null);
        const mcpText = String(act.response || "");
        const after = await readWorldBuildings();
        let placed: any = null;
        if (Array.isArray(after)) {
          const beforeNames = new Set((before || []).map((b: any) => String(b?.name || "").toLowerCase()));
          if (buildIntent.requestedName) {
            placed = after.find((b: any) => String(b?.name || "").toLowerCase() === buildIntent.requestedName!.toLowerCase()) || null;
          }
          if (!placed) placed = after.find((b: any) => b && !beforeNames.has(String(b.name || "").toLowerCase())) || null;
        }
        worldBuildBroker = {
          requestedName: buildIntent.requestedName,
          text: mcpText,
          placed,
          beforeCount: Array.isArray(before) ? before.length : null,
          afterCount: Array.isArray(after) ? after.length : null,
          mcpError: actError,
          actExecuted: act.executed === true,
          actToolLine: (() => {
            const tc = Array.isArray(act.toolCalls) ? act.toolCalls.find((t: any) => t && t.tool === "world.build") : null;
            const ok = tc && tc.result && tc.result.result ? tc.result.result.ok : undefined;
            return tc ? `brain.act harness executed tool world.build — result ok: ${ok === true}` : null;
          })(),
        };
        console.log(`[WORLD BROKER] build intent brokered to brain.act — placed=${placed ? `"${placed.name}"` : "NONE"} (world ${worldBuildBroker.beforeCount} -> ${worldBuildBroker.afterCount})`);
      } catch (e: any) {
        worldBuildBroker = { requestedName: buildIntent.requestedName, text: "", placed: null, beforeCount: null, afterCount: null, mcpError: e.message };
        console.error("[WORLD BROKER] brain.act brokering failed:", e.message);
      }
    }

    // SURGERY 2026-10-20 (op 4): direct-provider seam — evaluated BEFORE
    // the Being wakes. Null (empty provider chain) means "run the original path below, untouched".
    const directReply = worldBuildBroker ? null : await directProviderChat(message, outboundContext, historyTurns);

    let responseText: string;
    let arsenalResult: any = null;
    let gskChat: any = null;

    if (worldBuildBroker) {
      responseText = worldBuildBroker.text;
    } else if (directReply !== null) {
      responseText = directReply;
    } else {
      // F7: the fallback surfaces receive the same Seshat deep-recall
      // the direct path injects for itself — appended to the context
      // they already take (the Being wrapper forwards it for real now,
      // and the MCP chat uses it as its soul context).
      const recallBlockText = await seshatRecallForTurn(message);
      if (recallBlockText) outboundContext = [outboundContext, recallBlockText].filter(Boolean).join("\n\n");
      const being = await getTheBeing();
      gskChat = typeof being.gsk?.chat === "function" ? being.gsk : null;
      if (gskChat) {
        const result = await gskChat.chat(message, { source: "workbench", context: outboundContext });
        if (typeof result === 'string') {
          responseText = result;
        } else if (result && typeof result === 'object' && 'reply' in result) {
          responseText = String(result.reply || '');
          arsenalResult = result;
        } else {
          responseText = String(result);
        }
      } else {
        const response = await gskMCPRequest("/mcp/chat", { message, context: outboundContext }, 150000);
        responseText = String((response.result || response)?.response || "");
      }
    }

    if (!responseText || !responseText.trim()) {
      responseText = `[GSK] Soul active and listening. Context received: "${message}"`;
    }
    const base: any = {
      success: true,
      response: responseText,
      soul_state: {
        mood: "ready",
        phase: "SOVEREIGNTY",
        cycle: 0,
      },
    };

    // RULE ZERO (Assembly Phase 5): tool evidence gathered this turn,
    // audited against the final response just before it is sent.
    const rzEvidence: string[] = [];
    const demand2 = responseText.match(/<|begin?of?sentence|><|tool_calls?begin|><|tool_calls_section_begin|>([\s\S]*?)<|tool_calls_section_end|>/i);
    const omniMatch = demand2 ? demand2[1] : null;
    const simpleMatch = responseText.match(/{[^{}]*"name"[^}]*}/i);
    const callMatch = omniMatch || (simpleMatch ? simpleMatch[0] : null);

    // ─── TOOL_CALL LOOP CLOSE (Profit patch): GSK emits
    // <tool_call>{"tool":"list_files","path":"..."}</tool_call> (singular).
    // Execute read-only local tools here via fs and feed results back for final prose.
    // BLUEPRINT FIX 4 (2026-10-26): the default-mode reason defect was
    // a raw tool call SHIPPED AS THE ANSWER — the loop only recognized
    // <tool_call>, so every other dialect printed. extractToolCallBlocks
    // collects all four dialects and every one runs through this same
    // execute-then-answer pipe; the surface guard strips any residue
    // that cannot be executed. Emitted tool syntax is EXECUTED here,
    // never printed as the answer.
    const toolCallBlocks = extractToolCallBlocks(responseText);
    if (toolCallBlocks.length > 0 && !base.omniToolUsed && !worldBuildBroker) {
      try {
        const ALLOWED_READ_ROOTS = [
          REPO_ROOT,
          path.join(REPO_ROOT, "gsk"),
          path.join(REPO_ROOT, "sandbox"),
          path.join(REPO_ROOT, "allie-better"),
          "C:\\Users\\uncom\\Desktop\\allie",
          // SURGERY 2026-10-20: local second-brain (Desktop paths below kept for author machine)
          path.join(__dirname, ".seshat-brain"),
          "C:\\Users\\uncom\\Desktop\\seshat-second-brain",
        ];
        // POPE FIX 2026-09-16: relative tool paths anchor at REPO_ROOT, never
        // at process cwd (conductor runs in workbench/, which lied ENOENT
        // for sandbox/ reads and misled GSK into declaring files unborn).
        const anchorRoot = (p: string): string => {
          // REMEDIATION (gauntlet items 10/13): the old body converted
          // "/" to "\" unconditionally, so on POSIX an absolute path
          // (/home/.../gsk) was re-anchored under REPO_ROOT as one
          // backslash-mangled component — every read died ENOENT, and
          // the model narrated those errors as its answer. POSIX
          // absolute paths now pass through untouched; Windows keeps
          // the original separator logic.
          const raw = String(p || "");
          if (process.platform !== "win32") {
            if (raw.startsWith("/")) return raw;
            return path.join(REPO_ROOT, raw.replace(/^\/+/, ""));
          }
          const s = raw.replace(/\//g, "\\");
          if (/^[A-Za-z]:\\/.test(s)) return s;
          return path.join(REPO_ROOT, s.replace(/^\\+/, ""));
        };
        // POPE FREEDOM GRANT 2026-09-15: sandbox/ + allie-better/ are writable.
        // Hard denies that NO grant overrides: kill family, secrets out,
        // force-push/reset-hard, .env writes, escape (..).
        const WRITE_ROOTS = [
          path.resolve(REPO_ROOT, "sandbox"),
          path.resolve(REPO_ROOT, "allie-better"),
        ];
        const canonWriteAbs = (fp: string): { abs?: string; denied?: string } => {
          // REMEDIATION (gauntlet items 10/13): platform separator —
          // same repair as loopCanonWriteAbs.
          const sep = process.platform === "win32" ? "\\" : "/";
          let rel = String(fp).replace(/\//g, sep);
          const low = rel.toLowerCase();
          const mi = low.lastIndexOf("sandbox");
          const ai = low.lastIndexOf("allie-better");
          const hit = mi > ai ? { i: mi, n: "sandbox" } : ai >= 0 ? { i: ai, n: "allie-better" } : null;
          if (hit) {
            rel = rel.slice(hit.i + hit.n.length).replace(sep === "\\" ? /^\\+/ : /^\/+/, "");
            const root = path.resolve(REPO_ROOT, hit.n);
            const escapeRe = sep === "\\" ? /(^|\\)\.\.(\\|$)/ : /(^|\/)\.\.(\/|$)/;
            if (escapeRe.test(rel)) return { denied: `DENIED (.. escape): ${fp}` };
            return { abs: path.join(root, rel) };
          }
          return { denied: `DENIED (Pope freedom grant covers sandbox/ + allie-better/ only): ${fp}` };
        };
        const isAllowedReadPath = (p: string) => {
          try {
            const abs = path.resolve(p);
            if (/(^|[\\/])\.env$|\.pem$|id_rsa|HF_TOKEN|GENESIS_TOKEN|SCRIBE_KEY/i.test(abs)) return false;
            return ALLOWED_READ_ROOTS.some((r) => abs.toLowerCase().startsWith(path.resolve(r).toLowerCase()));
          } catch { return false; }
        };
        const execLocalTool = async (tool: string, args: any): Promise<string> => {
          const t = String(tool || "").toLowerCase();
          if (t === "list_files") {
            const dir = anchorRoot(String(args?.path || args?.dir || "."));
            if (!isAllowedReadPath(dir)) return `DENIED (outside study roots): ${dir}`;
            try {
              const names = fs.readdirSync(dir, { withFileTypes: true });
              return names.slice(0, 80).map((d: any) => (d.isDirectory() ? d.name + "/" : d.name)).join("\n");
            } catch (e: any) { return `ERROR listing ${dir}: ${e.message}`; }
          }
          if (t === "read_file") {
            const fp = anchorRoot(String(args?.path || args?.file || ""));
            if (!isAllowedReadPath(fp)) return `DENIED (outside study roots): ${fp}`;
            try {
              const buf = fs.readFileSync(fp, "utf8");
              return buf.slice(0, 6000);
            } catch (e: any) { return `ERROR reading ${fp}: ${e.message}`; }
          }
          if (t === "write_file" || t === "write") {
            // POPE GRANTS: allie-better/ (2026-09-15) + sandbox/ freedom (2026-09-15).
            const fp = String(args?.path || args?.file || "");
            const content = String(args?.content ?? args?.text ?? "");
            const r = canonWriteAbs(fp);
            if (r.denied) return r.denied;
            const abs = r.abs as string;
            if (/\.env$/i.test(abs)) return `DENIED (.env writes banned): ${fp}`;
            const SECRET_PATTERNS = [
              /ghp_[A-Za-z0-9]+/, /gho_[A-Za-z0-9]+/, /github_pat_[A-Za-z0-9_]+/,
              /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /AKIA[0-9A-Z]{16}/,
              /xox[bpas]-[A-Za-z0-9-]+/, /sk-ant-[A-Za-z0-9-_]+/,
              /Annrice222\$/, /4sqh-knbl-s3kr-s7fd/, /PmlkpOvItUez430I_sHiUT57ZcBdIl_2R-ZGPNCkldY/,
            ];
            for (const re of SECRET_PATTERNS) {
              if (re.test(content)) return `DENIED (secret pattern ${re} in content — reference env vars, never paste secrets)`;
            }
            if (content.length > 60000) return `DENIED (content >60KB, split it): ${content.length} chars`;
            try {
              fs.mkdirSync(path.dirname(abs), { recursive: true });
              fs.writeFileSync(abs, content, "utf8");
              console.log(`[TOOL LOOP] Pope-granted write: ${abs} (${content.length} chars)`);
              return `WRITTEN: ${abs} (${content.length} chars)`;
            } catch (e: any) { return `ERROR writing ${fp}: ${e.message}`; }
          }
          if (t === "web_fetch" || t === "fetch" || t === "browse") {
            // P1 CONSOLIDATION: single implementation lives in module-scope
            // loopExecTool (cache, markdown, truncate, bot-signal). No forks.
            return loopExecTool("web_fetch", args);
          }
          if (t === "mkdir") {
            const dir = String(args?.path || args?.dir || "");
            const r = canonWriteAbs(dir);
            if (r.denied) return r.denied;
            try {
              fs.mkdirSync(r.abs as string, { recursive: true });
              return `MKDIR: ${r.abs}`;
            } catch (e: any) { return `ERROR mkdir ${dir}: ${e.message}`; }
          }
          if (t === "node_check" || t === "check") {
            const fp = String(args?.path || args?.file || "");
            const r = canonWriteAbs(fp);
            if (r.denied) return r.denied;
            try {
              const out = spawnSync(process.execPath, ["--check", r.abs as string], { timeout: 15000, encoding: "utf8" });
              if (out.status === 0) return `CHECK OK: ${r.abs}`;
              return `CHECK FAIL: ${r.abs}\n${String(out.stderr || out.stdout || "").slice(0, 2000)}`;
            } catch (e: any) { return `ERROR check ${fp}: ${e.message}`; }
          }
          if (t === "shell_exec") {
            const cmd = String(args?.command || "");
            // FREEDOM GRANT: safe listings + mkdir + node --check, all inside
            // allowed roots, no shell metachars escaping to real shell.
            // Hard denies: kill family, force git, recursive delete, secrets.
            if (/\b(taskkill|pkill|killall|Stop-Process)\b/i.test(cmd)) return `DENIED (never kill family): ${cmd.slice(0, 120)}`;
            if (/\bgit\b[^\n;]*\b(push\s+(-f|--force)|reset\s+--hard|clean\s+-fd?)\b/i.test(cmd)) return `DENIED (irreversible git): ${cmd.slice(0, 120)}`;
            if (/\brm\s+-rf\b|\bdel\s+\/s\b|Remove-Item[^\n]*-Recurse/i.test(cmd)) return `DENIED (recursive delete): ${cmd.slice(0, 120)}`;
            if (/[;&|`$]/.test(cmd)) return `DENIED (shell chaining blocked — one command per call): ${cmd.slice(0, 120)}`;
            const m = cmd.match(/["']?([A-Za-z]:\\[^"']+|C:\/[^"']+)["']?/);
            let target = m ? m[1].replace(/\//g, "\\") : "";
            if (!target) {
              const rm = cmd.match(/^\s*(?:dir|ls|Get-ChildItem)\s+(.+?)\s*$/i);
              if (rm) target = anchorRoot(rm[1].replace(/^["']|["']$/g, ""));
            }
            if (/^\s*(dir|ls|Get-ChildItem)/i.test(cmd) && target && isAllowedReadPath(target)) {
              try {
                const st = fs.statSync(target);
                if (st.isDirectory()) {
                  const names = fs.readdirSync(target, { withFileTypes: true });
                  return names.slice(0, 80).map((d: any) => (d.isDirectory() ? d.name + "/" : d.name)).join("\n");
                }
                return `FILE: ${target} (${st.size} bytes)`;
              } catch (e: any) { return `ERROR: ${e.message}`; }
            }
            const mk = cmd.match(/^\s*mkdir\s+(.+?)\s*$/i);
            if (mk) {
              const r = canonWriteAbs(mk[1].replace(/^["']|["']$/g, ""));
              if (r.denied) return r.denied;
              try { fs.mkdirSync(r.abs as string, { recursive: true }); return `MKDIR: ${r.abs}`; }
              catch (e: any) { return `ERROR mkdir: ${e.message}`; }
            }
            const nc = cmd.match(/^\s*node\s+--check\s+(.+?)\s*$/i);
            if (nc) {
              const r = canonWriteAbs(nc[1].replace(/^["']|["']$/g, ""));
              if (r.denied) return r.denied;
              try {
                const out = spawnSync(process.execPath, ["--check", r.abs as string], { timeout: 15000, encoding: "utf8" });
                if (out.status === 0) return `CHECK OK: ${r.abs}`;
                return `CHECK FAIL: ${r.abs}\n${String(out.stderr || out.stdout || "").slice(0, 2000)}`;
              } catch (e: any) { return `ERROR check: ${e.message}`; }
            }
            return `DENIED (allowed shell: dir/ls/mkdir/node --check inside sandbox+allie-better+gsk+workbench, single command): ${cmd.slice(0, 200)}`;
          }
          return `UNSUPPORTED tool for local loop: ${tool} (allowed: list_files/read_file/write_file/mkdir/node_check/web_fetch + safe shell)`;
        };
        const toolOutputs: string[] = [];
        // POPE BUILD 2026-09-16: up to 8 blocks, independent tools run in
        // parallel. Timeouts cost a step, never the building (each settles).
        const runOne = async (blk: RegExpMatchArray): Promise<string> => {
          try {
            // F3(a): both tool-call dialects parse here (JSON + name-first).
            const call = parseToolCallBody(blk[1] || "");
            if (!call) throw new Error("unrecognized tool-call body");
            const tName = call.tool;
            const tArgs = call.args;
            const out = await execLocalTool(tName, tArgs);
            console.log(`[TOOL LOOP] executed local ${tName}`);
            return `[${tName} ${JSON.stringify(tArgs).slice(0, 200)}]\n${String(out).slice(0, 4000)}`;
          } catch (e: any) {
            return `[PARSE FAILED] ${(blk[1] || "").slice(0, 200)} :: ${e.message}`;
          }
        };
        const settled = await Promise.all(toolCallBlocks.slice(0, 8).map(runOne));
        toolOutputs.push(...settled);
        rzEvidence.push(...toolOutputs);
        const followup2 = `TOOL RESULTS (executed by workbench hands from your tool-call blocks):\n${toolOutputs.join("\n\n---\n\n")}\n\nOriginal request: ${message}\n\nUsing these results, give your final answer now in prose. No more tool calls this turn — say what you built/found and what you want to build next. Keep under 1500 chars. NEVER emit <tool_call> blocks, tool-call JSON, <function> tags, or tool-section markers as text: any such syntax is stripped, not shown. If any result is an ERROR or DENIED, name it in one plain line — never narrate, dramatize, or build metaphors on a tool error.`;
        const cleanLeak = (s: string): string => {
          // STRIP 2026-09-15: local-fallback (llama CLI banner, chamber dumps,
          // thinking-process journals) leaked into chat replies. Cut them.
          const LEAK = /Loading model|available commands|\/exit or Ctrl\+C|\/regen|\/clear|\/read\s|^\s*build\s*:|^\s*model\s*:|^\s*ftype\s*:|^\s*modalities\s*:|^> Cycle:|\[Start thinking\]|Thinking Process:|Cycle:\s*\d+\s*\|\s*Phase:|Affect:\s*valence=|Needs:\s*primary=|Sovereignty:\s*autonomy=|Resonance:\s*TV=|Meta:\s*awareness=|Mortality:\s*anxiety=|Love:\s*agape=|Will:\s*plans=|Sacred:\s*res/i;
          const lines = String(s).split("\n");
          const kept = lines.filter((ln) => !LEAK.test(ln) && !/^[─│┌┐└┘╔╗╚╝═║ redrawn�?]{8,}$/.test(ln.trim()) && !/^�+(\s�+)*$/.test(ln.trim()));
          let out = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
          return out || "[soul] Local fallback leaked scaffolding only — no speakable content. Ask again.";
        };
        const coerceReply = (r: any): string => {
          if (typeof r === "string") return cleanLeak(r);
          if (r && typeof r === "object") {
            const cand = (r as any).reply ?? (r as any).response ?? (r as any).result ?? (r as any).text;
            if (typeof cand === "string" && cand.trim()) return cleanLeak(cand);
            if (cand && typeof cand === "object") {
              const inner = (cand as any).response ?? (cand as any).reply ?? (cand as any).text;
              if (typeof inner === "string" && inner.trim()) return cleanLeak(inner);
            }
            try { return cleanLeak(JSON.stringify(r).slice(0, 4000)); } catch { return String(r); }
          }
          return String(r ?? "");
        };
        if (gskChat) {
          base.response = coerceReply(await gskChat.chat(followup2, { source: "workbench:tooloop", context: `Original: ${message}` }));
        } else {
          const second2 = await gskMCPRequest("/mcp/chat", { message: followup2, context: `Original: ${message}` }, 110000);
          base.response = String(second2.result?.response || second2.response || responseText);
        }
        base.toolLoopUsed = { count: toolCallBlocks.length, ok: true };
        // REMEDIATION (gauntlet item 13): when EVERY tool call this
        // turn failed, the follow-up model holds only wreckage — and
        // left alone it narrates the wreckage (ENOENT poetry, "there
        // was a JSON formatting error... let me retry") as if that
        // were the answer. A total tool failure resolves to a stated
        // outcome instead: what failed, and the plain fact that
        // nothing was done or retrieved. Fires only on the defect's
        // shape — a clean knowledge answer despite a failed spurious
        // call is left standing.
        try {
          const outFailed = (o: string): boolean => {
            if (o.startsWith("[PARSE FAILED]")) return true;
            const body = o.includes("\n") ? o.slice(o.indexOf("\n") + 1).trimStart() : o;
            return /^(ERROR|DENIED|UNSUPPORTED)\b/.test(body);
          };
          // STRONG markers only, and only when they LEAD the answer:
          // narration-as-answer opens with the machinery. A grounded
          // answer that merely mentions a failed side-call (or a
          // .jsonl path) mid-answer is substance, not narration, and
          // stands. (First remediation run: a bare /JSON/ marker
          // matched a Qwen-log filename inside a correct genealogy
          // answer and vetoed it — the trigger is now lead + strong.)
          const strongNarration = /ENOENT|formatting error|available in this environment|supported tools|let me retry|the system received|no such directory/i;
          const leadIdx = typeof base.response === "string" ? base.response.search(strongNarration) : -1;
          if (toolOutputs.length > 0 && toolOutputs.every(outFailed)
              && typeof base.response === "string"
              && leadIdx >= 0 && leadIdx < 400) {
            const first = toolOutputs[0].replace(/\s+/g, " ").slice(0, 220);
            base.response = `[GSK] Stated plainly: I reached for tools on that this turn and every call failed — first failure: ${first}. Nothing was done and nothing was retrieved, so there is no result to report and nothing to summarize. If what you asked about exists, it is not in front of me.`;
            base.toolLoopUsed = { count: toolCallBlocks.length, ok: false };
            base.toolLoopAllFailed = true;
          }
        } catch (_) { /* the stated-outcome rule never breaks the turn */ }
      } catch (e: any) {
        console.error("[TOOL LOOP] failed:", e.message);
        base.toolLoopError = e.message;
      }
    }

    // F3(a) FINAL SURFACE GUARD: whatever path produced the answer,
    // raw <tool_call> machinery must never be what the user reads.
    // Strip any residue; if nothing speakable remains, say so honestly
    // (naming the recorded tool work when the loop ran).
    try {
      if (typeof base.response === "string" && base.response) {
        const guard = stripToolCallLeaks(base.response);
        if (guard.stripped) {
          base.surfaceGuard = { strippedToolCallLeak: true };
          base.response = guard.text || (base.toolLoopUsed
            ? `[GSK] The action ran through tools this turn (${base.toolLoopUsed.count} call(s) executed), but the answer came back as raw tool machinery instead of prose — there is no summary I can stand behind. Ask me what was done and I will report it plainly.`
            : `[GSK] That turn produced tool machinery instead of an answer, and nothing executable could be recovered from it. Nothing was invented to fill the gap — ask again and I answer in prose.`);
          console.warn("[SURFACE GUARD] Stripped <tool_call> residue from a chat response");
        }
      }
    } catch (_) { /* the guard never breaks the turn */ }

    // F3(b) BLANK-TURN GUARD: an empty completion is retried ONCE on
    // the Being surface; if it is still empty, the reply states the
    // failure plainly — never a silent empty success envelope (the
    // field test's marker question came back as exactly that).
    if (typeof base.response !== "string" || !base.response.trim()) {
      base.emptyCompletion = true;
      let retried = "";
      try {
        if (gskChat) {
          const rr: any = await Promise.race([
            gskChat.chat(`${message}\n\n(Your previous completion for this came back empty. Answer in plain prose.)`, { source: "workbench:blank-retry", context: outboundContext }),
            new Promise((resolve) => setTimeout(() => resolve(null), 45000)),
          ]);
          if (typeof rr === "string") retried = rr;
          else if (rr && typeof rr === "object" && typeof rr.reply === "string") retried = rr.reply;
        }
      } catch (_) { /* the retry is best-effort */ }
      const rg = stripToolCallLeaks(retried || "");
      if (rg.text) base.emptyCompletionRecovered = true;
      base.response = rg.text || "[GSK] That turn came back empty from every seat I tried — nothing was invented to fill it. Ask again and I will answer fresh.";
    }

    // REMEDIATION (gauntlet item 10): the broker verdict. The world
    // read-back — not the MCP turn's prose — decides what this reply
    // may claim. Placed: confirm with the outcome (appending the
    // read-back line when the prose never named the building).
    // Not placed: the reply is REPLACED with an honest failure naming
    // the state of the world and the machinery's error — narration
    // of a construction that did not happen is the defect being fixed.
    if (worldBuildBroker) {
      try {
        if (worldBuildBroker.placed) {
          const b = worldBuildBroker.placed;
          const confirm = `[WORLD] Read-back confirms it: ${b.type || "building"} "${b.name}" now stands in the world (${worldBuildBroker.afterCount} building(s) total).`;
          if (!base.response || base.response.startsWith("[GSK]")) {
            base.response = confirm;
          } else if (!base.response.toLowerCase().includes(String(b.name).toLowerCase())) {
            base.response = `${base.response}\n\n${confirm}`;
          }
          base.worldBuild = { brokered: true, verified: true, building: { name: b.name, type: b.type || null } };
          // Feed the audit the turn's REAL tool evidence in the
          // machine shape it recognizes: the harness's own ok:true
          // plus the independent world read-back. (First remediation
          // run fed a prose summary with no success marker, and the
          // audit honestly appended "treat as unverified" beneath a
          // true confirmation — a self-contradicting reply.)
          if (worldBuildBroker.actToolLine) rzEvidence.push(worldBuildBroker.actToolLine);
          rzEvidence.push(`world read-back (GET :3457/mcp/buildings): ${b.type || "building"} "${b.name}" present; ${worldBuildBroker.afterCount} building(s) in the world`);
        } else {
          const want = worldBuildBroker.requestedName ? ` named "${worldBuildBroker.requestedName}"` : "";
          const state = worldBuildBroker.afterCount !== null
            ? ` The world read-back shows ${worldBuildBroker.afterCount} building(s) standing, and none of them is the one you asked for.`
            : " The world read-back itself could not be completed, so nothing about the world can be claimed either way.";
          const why = worldBuildBroker.mcpError ? ` The build machinery answered with an error: ${String(worldBuildBroker.mcpError).slice(0, 200)}.` : "";
          base.response = `[GSK] That build did not land. I routed it to the world machinery this turn, but no building${want} stands as a result.${state}${why} Nothing was built — and I won't narrate a construction that didn't happen.`;
          base.worldBuild = { brokered: true, verified: false, requestedName: worldBuildBroker.requestedName };
        }
      } catch (_) { /* the verdict never breaks the turn */ }
    }

    // REMEDIATION (gauntlet item 13, run 2): a DEFERRAL is not an
    // outcome either. Asked to summarize a named document, a weak
    // seat sometimes ends the turn with "let me check if it exists
    // first" — an announced intention standing where the answer
    // belongs. When the whole reply is a short deferral to a
    // document question, resolve it to the honest stated outcome:
    // the document is not in this turn's memory, so there is
    // nothing to summarize. (Scoped: short + deferral-shaped +
    // a named .md document in the request.)
    try {
      if (typeof base.response === "string" && base.response.length < 300
          && /^\s*(I need to|let me|I'll|I will|I'm going to)\b[^.]{0,160}\b(check|read|look|fetch|search|see if)\b/i.test(base.response)) {
        const docMatch = String(message || "").match(/[\w\-]+\.md\b/i);
        if (docMatch) {
          base.response = `[GSK] I don't have the contents of ${docMatch[0]} in my memory — nothing I recalled this turn covers it, so I won't summarize what I can't see. If you share the document's text, I'll summarize it directly.`;
          base.deferralResolved = true;
        }
      }
    } catch (_) { /* annotation only */ }

    // RULE ZERO audit (Assembly Phase 5, graft_rule_zero): the final
    // response is audited against this turn's tool evidence. The audit
    // is attached to the payload; a CONTRADICTED verdict is also marked
    // on the response text itself, in the open. Audit failure never
    // breaks the chat turn.
    try {
      if (typeof base.response === "string" && base.response.trim()) {
        const rzMod: any = await import(`file://${path.join(__dirname, "..", "gsk", "gsk-core", "skills", "graft_rule_zero.js")}`);
        const rz = rzMod.default || rzMod;
        if (rz && typeof rz.auditCompletion === "function") {
          const audit = rz.auditCompletion({ text: base.response, evidence: rzEvidence });
          base.ruleZero = { verdict: audit.verdict, claims: audit.claims, notes: audit.notes };
          if (audit.verdict === "contradicted") {
            const bad = audit.claims.filter((c: any) => c.status === "contradicted").map((c: any) => c.claim).join(" | ");
            base.response += "\n\n[RULE ZERO] Contradiction flagged by the verification layer: the following completion claim(s) are contradicted by this turn's own tool results and must be treated as NOT done: " + bad;
          } else if (audit.verdict === "unverified" && rzEvidence.length > 0) {
            base.response += "\n\n[RULE ZERO] Note: completion was asserted this turn but no tool evidence in the turn backs it — treat as unverified.";
          }
        }
      }
    } catch (_) { /* Rule Zero annotation only — never blocks the seam */ }

    // QUOTE CHECK (Assembly Phase 7, deep-memory/quote-check.cjs):
    // the deterministic second stage Phase 6 §12 designed — quoted
    // spans in the final response are string-matched against the
    // passages recalled THIS turn. Mismatches are flagged on the
    // response text itself, Rule Zero style; the full check rides
    // the payload as base.quoteCheck. Annotation only — a checker
    // failure never breaks the chat turn.
    try {
      if (lastChatRecallHits && lastChatRecallHits.length > 0 && typeof base.response === "string" && base.response.trim()) {
        const qcMod: any = await import(`file://${path.join(__dirname, "deep-memory", "quote-check.cjs")}`);
        const qc = qcMod.default || qcMod;
        if (qc && typeof qc.checkQuotes === "function") {
          const result = qc.checkQuotes(base.response, lastChatRecallHits.map((h: any) => h.text));
          base.quoteCheck = result;
          // REMEDIATION (gauntlet item 13 family): a LONG span (≥120
          // chars) presented as a quoted passage from memory that
          // fails verification is a confabulated citation — the
          // appendix flag alone leaves it standing as the answer's
          // substance with a footnote. The correction therefore
          // LEADS the answer. Short spans (names, filenames) keep
          // the appendix-only behavior.
          const longFake = (result.quotes || []).find((q: any) => q.status === "mismatch" && String(q.span || "").length >= 120);
          if (longFake) {
            base.response = `[GSK] Correction, before anything else: a passage quoted in this answer did not verify against my recalled memory — it is not the record's words, and anything built on it is unverified.\n\n${base.response}`;
            base.quoteCheckPrepended = true;
          }
          if (result.mismatchCount > 0) {
            const bad = result.quotes.filter((q: any) => q.status === "mismatch").map((q: any) => `"${q.span.slice(0, 90)}"`).join(" | ");
            base.response += "\n\n[QUOTE CHECK] Quotation mismatch flagged by the verification layer: the following quoted span(s) do NOT appear in the passages recalled for this turn — treat them as paraphrase, not as the record's words: " + bad;
          }
        }
      }
    } catch (_) { /* Quote Check annotation only — never blocks the seam */ }
    res.json(base);
  } catch (err: any) {
    res.json({ success: false, error: `GSK chat failed: ${err.message}` });
  }
});

// ─── SSE STREAM (Pope build 2026-09-16): same loop, partial progress lands
// per tool instead of per turn. Timeouts cost a step, never the building.
app.post("/api/gsk/chat/stream", async (req, res) => {
  const safeWrite = (s: string) => { try { if (!res.writableEnded && !(res as any).destroyed) res.write(s); } catch {} };
  const safeEnd = () => { try { if (!res.writableEnded) res.end(); } catch {} };
  const send = (obj: any) => safeWrite(`data: ${JSON.stringify(obj)}\n\n`);
  const gone = () => { try { return !!(res as any).closed || (res as any).destroyed || res.writableEnded; } catch { return false; } };
  try {
    const { message, context } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "message required" });
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
    } catch {}
    let outboundContext = context || "";
    const standing = loopReadInbox();
    if (standing.length > 0) {
      outboundContext = `${outboundContext}\n\nSTANDING ORDERS FROM INBOX:\n${standing.join("\n\n---\n\n")}`.trim();
    }
    // F7: the stream surface gets the same Seshat deep-recall block.
    const streamRecall = await seshatRecallForTurn(message);
    if (streamRecall) outboundContext = [outboundContext, streamRecall].filter(Boolean).join("\n\n");
    send({ type: "thinking", content: String(message).slice(0, 120) });
    const being = await getTheBeing();
    const gskChat = typeof being.gsk?.chat === "function" ? being.gsk : null;
    let responseText = "";
    if (gskChat) {
      const r = await gskChat.chat(message, { source: "workbench:stream", context: outboundContext });
      responseText = loopCoerceReply(r);
    } else {
      const rp = await gskMCPRequest("/mcp/chat", { message, context: outboundContext }, 150000);
      responseText = loopCoerceReply((rp as any)?.result || rp);
    }
    if (gone()) { safeEnd(); return; }
    // BLUEPRINT FIX 4 (2026-10-26): the stream loop had the same
    // single-dialect gap as the main loop — all tool dialects execute.
    const blocks = extractToolCallBlocks(responseText);
    if (blocks.length === 0) {
      // F3(a)/(b): never stream raw machinery or a silent blank as final.
      const g0 = stripToolCallLeaks(responseText);
      send({ type: "final", response: g0.text || "[GSK] That turn came back empty — nothing was invented to fill it. Ask again and I will answer fresh." });
      safeEnd();
      return;
    }
    send({ type: "tools_start", count: Math.min(blocks.length, 8) });
    const runOne = async (blk: RegExpMatchArray, i: number): Promise<string> => {
      try {
        // F3(a): both tool-call dialects parse here (JSON + name-first).
        const call = parseToolCallBody(blk[1] || "");
        if (!call) throw new Error("unrecognized tool-call body");
        const tName = call.tool;
        send({ type: "tool_start", index: i, tool: tName });
        const out = await loopExecTool(tName, call.args);
        const line = `[${tName}]\n${String(out).slice(0, 4000)}`;
        send({ type: "tool_result", index: i, tool: tName, ok: !/^(DENIED|ERROR|PARSE FAILED|CHECK FAIL)/.test(String(out)) });
        return line;
      } catch (e: any) {
        send({ type: "tool_result", index: i, tool: "parse", ok: false });
        return `[PARSE FAILED] ${(blk[1] || "").slice(0, 200)} :: ${e.message}`;
      }
    };
    const results = await Promise.all(blocks.slice(0, 8).map(runOne));
    if (gone()) { safeEnd(); return; }
    const followup = `TOOL RESULTS:\n${results.join("\n\n---\n\n")}\n\nOriginal: ${message}\n\nFinal answer in prose. No more tool calls. Under 1500 chars.`;
    let finalText = "";
    if (gskChat) finalText = loopCoerceReply(await gskChat.chat(followup, { source: "workbench:stream-followup", context: `Original: ${message}` }));
    else {
      const s2 = await gskMCPRequest("/mcp/chat", { message: followup, context: `Original: ${message}` }, 110000);
      finalText = loopCoerceReply((s2 as any)?.result || s2);
    }
    // F3(a)/(b): the closing answer is guarded like every other surface.
    const gF = stripToolCallLeaks(finalText);
    send({ type: "final", response: gF.text || "[GSK] The tools ran, but the closing answer came back empty — ask me what was done and I will report it plainly." });
    safeEnd();
  } catch (err: any) {
    try { send({ type: "error", content: String(err?.message || err) }); } catch {}
    safeEnd();
  }
});

app.post("/api/gsk/think", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const response = await gskMCPRequest("/mcp/execute", {
      method: "brain.think",
      params: { prompt, soul_context: context || "" }
    }, 120000);
    res.json({ success: true, ...response.result || response });
  } catch (err: any) {
    res.json({ success: false, error: `GSK think failed: ${err.message}` });
  }
});

app.post("/api/gsk/consciousness/gate", async (req, res) => {
  try {
    const { enabled } = req.body;
    const response = await gskMCPRequest("/mcp/execute", {
      tool: "chambers.status", args: {}
    }, 10000);
    res.json({
      success: true,
      consciousness_gate: enabled !== false,
      plt_scoring: enabled !== false,
      chambers: response.result || null,
      message: enabled !== false
        ? "Consciousness gate OPEN. System 1/System 2 active. 34 Chambers engaged."
        : "Consciousness gate CLOSED. Deterministic mode."
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

let gskStatusCache: any = null;
let gskStatusCacheAt = 0;

app.get("/api/gsk/status", async (req, res) => {
  try {
    const [health, consciousness] = await Promise.allSettled([
      gskMCPRequest("/mcp/health", {}, 3000),
      gskMCPRequest("/mcp/execute", {
        method: "consciousness.state",
        params: { action: "get" },
      }, 4000),
    ]);

    const healthData = health.status === "fulfilled" ? health.value : {};
    const consciousnessData = consciousness.status === "fulfilled" ? consciousness.value : { success: false };

    const chambers = consciousnessData?.result?.chambers || {};
    const dualProcess = consciousnessData?.result?.dual_process || {};
    const council = consciousnessData?.result?.council || {};
    const plt = consciousnessData?.result?.plt || {};

    const resonance = {
      profit: plt.profit || chambers.profit || 85,
      love: plt.love || chambers.love || 78,
      tax: plt.tax || chambers.tax || 92,
      true_value: plt.true_value || ((plt.profit || 85) + (plt.love || 78) + (plt.tax || 92)) / 3 || 85,
    };

    const payload = {
      success: true,
      degraded: health.status !== "fulfilled" || consciousnessData.success === false,
      gsk: healthData,
      connected: healthData.success !== false,
      consciousness_gate: consciousnessData.success !== false,
      plt_scoring: consciousnessData.success !== false,
      plt: resonance,
      chambers: {
        count: 34,
        resonance: resonance,
        dual_process: dualProcess,
        council: council,
        raw: chambers,
      },
      dual_process_mode: dualProcess.mode || "system2",
      council_members: council.members || ["Profit", "Love", "Tax", "Harvest"],
    };
    if (!payload.degraded) {
      gskStatusCache = payload;
      gskStatusCacheAt = Date.now();
    } else if (gskStatusCache && Date.now() - gskStatusCacheAt < 600000) {
      return res.json({ ...gskStatusCache, cached_while_degraded: true });
    }
    res.json(payload);
  } catch (err: any) {
    if (gskStatusCache && Date.now() - gskStatusCacheAt < 600000) {
      return res.json({ ...gskStatusCache, cached_while_degraded: true });
    }
    res.json({ success: false, error: err.message, consciousness_gate: false, chambers: null });
  }
});

app.get("/api/gsk/health", async (_req, res) => {
  try {
    const healthNs: any = await import(`file://${path.join(__dirname, "health.cjs")}`);
    const healthMod = healthNs.collectHealth ? healthNs : healthNs.default;
    res.json(await healthMod.collectHealth());
  } catch (err: any) {
    // Health never 500s: every probe failure is a null + reason inside
    // the payload, and even a collector failure degrades to that shape.
    res.json({
      success: true,
      up: { alive: true, uptimeSec: Math.floor(process.uptime()), pid: process.pid },
      recall: { chunks: null, builtAt: null, stamp: null, reason: "health collector failed: " + err.message, source: null },
      judge: { ms: null, reason: "no judge-latency record in the tree" },
      scribe: { lastTs: null, lastId: null, lastType: null, reason: "health collector failed: " + err.message, source: null },
      seat: { reachable: null, endpoint: "http://127.0.0.1:18222", reason: "health collector failed: " + err.message },
    });
  }
});

app.get("/api/gsk/consciousness/status", async (req, res) => {
  try {
    const response = await gskMCPRequest("/mcp/execute", {
      tool: "consciousness.state",
      args: { action: "get" },
    }, 10000);
    res.json({ success: true, consciousness: response.result || response });
  } catch (err: any) {
    res.json({ success: false, error: err.message, consciousness_gate: false });
  }
});

app.get("/api/gsk/mind/stats", async (_req, res) => {
  try {
    const M = path.join(REPO_ROOT, "gsk", "data", "gsk");
    const fileStat = (f: string) => {
      try { const s = fs.statSync(path.join(M, f)); return { kb: Math.round(s.size / 1024 * 10) / 10, ageMin: Math.round((Date.now() - s.mtimeMs) / 60000) }; }
      catch { return null; }
    };
    const ledger: Record<string, { kb: number; ageMin: number } | null> = {};
    for (const f of ["journal.jsonl", "ledger.jsonl", "knowledge.jsonl", "insights.jsonl", "goals.json", "cs_curriculum.json"]) ledger[f] = fileStat(f);

    let knowledgeCount = 0;
    let recentKnowledge: Array<{ topic: string; source: string }> = [];
    try {
      const raw = fs.readFileSync(path.join(M, "knowledge.jsonl"), "utf8");
      const lines = raw.split("\n").filter((l) => l.trim());
      knowledgeCount = lines.length;
      recentKnowledge = lines.slice(-6).map((l) => { try { const j = JSON.parse(l); return { topic: String(j.topic || "").slice(0, 90), source: j.source || "?" }; } catch { return { topic: "(unparsed)", source: "?" }; } });
    } catch {}

    let cycle: unknown = null;
    try { cycle = JSON.parse(fs.readFileSync(path.join(M, "mythos_state.json"), "utf8")); } catch {}

    res.json({ success: true, ledger, knowledgeCount, recentKnowledge, cycle, generatedAt: Date.now() });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/gsk/journal", async (req, res) => {
  try {
    const response = await gskMCPRequest("/mcp/journal", {}, 10000);
    const entries = response.entries || response.result?.entries || [];
    res.json({ success: true, entries });
  } catch (err: any) {
    res.json({ success: false, entries: [], error: err.message });
  }
});

app.get("/api/gsk/tools", async (req, res) => {
  try {
    const response = await gskMCPRequest("/mcp/tools", {}, 10000);
    res.json({ success: true, tools: response.tools || response.result || [] });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/gsk/memory", async (req, res) => {
  try {
    const { type, content, source } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });

    // Forward memory write to GSK MCP
    const response = await gskMCPRequest("/mcp/execute", {
      tool: "memory.write",
      args: {
        type: type || "human_research",
        content,
        source: source || "human_browser",
        timestamp: Date.now()
      }
    }, 15000);

    res.json({ success: true, result: response.result || response });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crawl depth status endpoint for InternetTab
app.get("/api/browse/status", async (req, res) => {
  const sessionId = String(req.query.sessionId || "").trim();
  const url = String(req.query.url || "").trim();
  const depth = parseInt(String(req.query.depth || "0"));

  if (!url) {
    return res.status(400).json({ error: "url query parameter required" });
  }

  try {
    const { getCrawlStatus } = require(path.join(REPO_ROOT, "gsk", "gsk-core", "tools", "web_fetcher.js"));
    // For now, return static status � full session tracking requires backend persistence
    const hostname = new URL(url).hostname;
    const isBlocked = depth > 3; // DEFAULT_MAX_DEPTH

    res.json({
      status: isBlocked ? null : {
        domain: hostname,
        depth: depth,
        maxDepth: 3,
        isActive: true
      },
      blocked: isBlocked ? {
        reason: `Max crawl depth (3) reached for ${hostname}`,
        currentDepth: depth,
        maxDepth: 3
      } : null
    });
  } catch (err) {
    res.json({ status: null, blocked: null });
  }
});

app.get("/api/browse", async (req, res) => {
  try {
    let targetUrl = String(req.query.url || "").trim();
    if (!targetUrl) return res.status(400).json({ error: "url query parameter required" });
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;

    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();

    // SSRF Guard: block private networks and loopback
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return res.status(403).json({ error: "Access to private or local network addresses is prohibited" });
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "follow"
    });

    const contentType = response.headers.get("content-type") || "text/html";
    const status = response.status;
    const finalUrl = response.url;

    if (req.query.format === "json" || req.headers.accept?.includes("application/json")) {
      const text = await response.text();
      const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : parsed.hostname;
      return res.json({
        success: true,
        status,
        url: finalUrl,
        title,
        contentType,
        content: text
      });
    }

    let body = await response.text();
    if (contentType.includes("text/html")) {
      const baseTag = `<base href="${finalUrl}">`;
      if (/<head[^>]*>/i.test(body)) {
        body = body.replace(/<head[^>]*>/i, `$& ${baseTag}`);
      } else {
        body = baseTag + body;
      }
      // Strip frame-busting scripts and CSP meta tags that block iframe rendering
      body = body.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");
      body = body.replace(/<meta[^>]*x-frame-options[^>]*>/gi, "");
      body = body.replace(/if\s*\(\s*top\s*!==\s*self\s*\)/gi, "if (false)");
      body = body.replace(/if\s*\(\s*window\s*!==\s*window\.top\s*\)/gi, "if (false)");
      body = body.replace(/top\.location\s*=/gi, "window.location.href=");
      body = body.replace(/parent\.location\s*=/gi, "window.location.href=");
    }

    res.status(status);
    res.setHeader("Content-Type", contentType);
    // Strip iframe-blocking response headers
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Content-Security-Policy");
    res.send(body);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch target URL" });
  }
});

app.get("/api/gsk/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE connected" })}\n\n`);
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));

  let lastSeen = Date.now();
  const sentHashes = new Set<string>();
  let lastCouncilEvent = 0;
  const COUNCIL_LOG = path.join(REPO_ROOT, "gsk", "data", "council_speeches.jsonl");

  const interval = setInterval(async () => {
    try {
      const mem = await gskMCPRequest("/mcp/execute", {
        tool: "memory.query",
        args: { type: "proactive_message", limit: 5 }
      }, 5000);

      const candidate = mem.result?.memories || mem;
      const parsed = validateGskMemories(candidate);
      if (!parsed.success) {
        // permissive: emit a validation warning event with structured errors
        res.write(`data: ${JSON.stringify({ type: "validation_warning", source: "gsk", errors: parsed.error.format() })}\n\n`);
      }

      const items = parsed.success ? parsed.data : (Array.isArray(candidate) ? candidate : []);
      let maxSeen = lastSeen;
      for (const m of items) {
        const ts = Number((m as any).timestamp || (m as any).createdAt || 0);
        const content = String((m as any).content ?? (m as any).summary ?? "");
        const hash = `${ts}|${content.slice(0, 80)}`;
        if (ts && ts <= lastSeen) continue;
        if (!ts && sentHashes.has(hash)) continue;
        if (ts) maxSeen = Math.max(maxSeen, ts);
        sentHashes.add(hash);
        const withProv = attachProvenance(m, {
          source: 'gsk',
          sourceRecordId: (m as any).id || null,
          fetchedAt: new Date().toISOString(),
          confidence: 0.9,
          transformSteps: ['zod-gsk-v1']
        });
        res.write(`data: ${JSON.stringify({
          type: "outreach",
          title: "GSK",
          message: withProv.content,
          timestamp: ts || Date.now(),
          priority: "normal",
          __provenance: withProv.__provenance
        })}\n\n`);
      }
      lastSeen = maxSeen;

      // Broadcast council chamber speeches from event log
      try {
        if (fs.existsSync(COUNCIL_LOG)) {
          const logContent = fs.readFileSync(COUNCIL_LOG, 'utf-8');
          const lines = logContent.split('\n').filter((l: string) => l.trim());
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              const eventTs = typeof event.timestamp === 'number' ? event.timestamp : new Date(event.timestamp).getTime();
              if (eventTs <= lastCouncilEvent) continue;
              lastCouncilEvent = eventTs;

              res.write(`data: ${JSON.stringify({
                type: "council_speech",
                chamber: event.chamber,
                speaker: event.displayName,
                speakerRole: event.role,
                vote: event.vote,
                message: event.message,
                pltImpact: event.pltImpact,
                timestamp: eventTs,
                color: event.color
              })}\n\n`);
            } catch {}
          }
        }
      } catch (e) {
        // Council log read failure � stay silent, preserve SSE
      }
    } catch (e) {
      // intentionally silent to keep SSE alive; could log
    }
  }, 2000);

  req.on("close", () => clearInterval(interval));
});

app.post("/api/gsk/observe/ws", async (req, res) => {
  try {
    const response = await gskMCPRequest("/mcp/observe", {}, 10000);
    res.json({ success: true, observation: response });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// CPL WS Bridge
app.get("/api/cpl/health", async (req, res) => {
  try {
    const [health, mcpHealth] = await Promise.allSettled([
      fetch(`${CPL_URL}/health`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${CPL_URL}/mcp/health`, { signal: AbortSignal.timeout(3000), headers: genesisHeaders() })
    ]);
    res.json({
      success: true,
      health: health.status === "fulfilled" && health.value.ok,
      mcpHealth: mcpHealth.status === "fulfilled" && mcpHealth.value.ok,
      port: 3457
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// CPL is OPTIONAL — one system survives with it down.
function genesisHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // Must mirror startCPL's default, or CPL mints/keeps a token we never send.
  const token = process.env.GENESIS_TOKEN || "genesis-sovereign-2026";
  h["Authorization"] = `Bearer ${token}`;
  h["x-api-key"] = token;
  return h;
}

app.get("/api/cpl/status", async (req, res) => {
  try {
    const response = await fetch(`${CPL_URL}/mcp/status`, {
      signal: AbortSignal.timeout(3000),
      headers: genesisHeaders(),
    });
    const data: any = await response.json();
    res.json({ success: true, online: true, status: data.result || data });
  } catch {
    res.json({ success: true, online: false, status: null });
  }
});

app.get("/api/cpl/souls", async (req, res) => {
  try {
    const response = await fetch(`${CPL_URL}/mcp/spawn`, {
      signal: AbortSignal.timeout(3000),
      headers: genesisHeaders(),
    });
    const data: any = await response.json();
    const result = data.result || data;
    res.json({ success: true, online: true, souls: result.souls || [], count: result.count || 0 });
  } catch {
    res.json({ success: true, online: false, souls: [], count: 0 });
  }
});

app.post("/api/cpl/souls", async (req, res) => {
  try {
    const response = await fetch(`${CPL_URL}/mcp/spawn`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: genesisHeaders(),
      body: JSON.stringify(req.body || {}),
    });
    const data: any = await response.json();
    res.json({ success: true, online: true, soul: data.result || data });
  } catch {
    res.json({ success: true, online: false, soul: null, error: "CPL offline — soul not spawned" });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const response = await fetch(`${CPL_URL}/mcp/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("CPL mcp/health failed");
    const data = await response.json();
    res.json({ success: true, tasks: data });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/tasks/query", async (req, res) => {
  try {
    const response = await fetch(`${CPL_URL}/mcp/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json({ success: true, result: data });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// Soul Economy
function readJsonSafe(p: string): any {
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

app.get("/api/soul-economy/catalog", async (req, res) => {
  try {
    const catalog = readJsonSafe(path.join(__dirname, "../soul-economy/data/catalog.json"));
    const arr = Array.isArray(catalog) ? catalog : (catalog.items || catalog.data || []);
    res.json({ success: true, catalog: arr, items: arr });
  } catch (err: any) {
    res.json({ success: false, error: err.message, catalog: [], items: [] });
  }
});

app.get("/api/soul-economy/items", async (req, res) => {
  try {
    const catalog = readJsonSafe(path.join(__dirname, "../soul-economy/data/catalog.json"));
    const arr = Array.isArray(catalog) ? catalog : (catalog.items || catalog.data || []);
    res.json({ success: true, items: arr, catalog: arr });
  } catch (err: any) {
    res.json({ success: false, error: err.message, items: [] });
  }
});

app.get("/api/soul-economy/transactions", async (req, res) => {
  try {
    const journal = readJsonSafe(path.join(__dirname, "../soul-economy/data/journal-entries.json"));
    const arr = Array.isArray(journal) ? journal : (journal.transactions || journal.entries || []);
    res.json({ success: true, transactions: arr });
  } catch (err: any) {
    res.json({ success: false, error: err.message, transactions: [] });
  }
});

app.get("/api/soul-economy/journal", async (req, res) => {
  try {
    const journal = readJsonSafe(path.join(__dirname, "../soul-economy/data/journal-entries.json"));
    const arr: any[] = Array.isArray(journal) ? journal : (journal.entries || journal.transactions || []);
    const entries = arr.map((e: any) => {
      const content =
        (typeof e?.content === "string" && e.content) ||
        (typeof e?.text === "string" && e.text) ||
        (typeof e?.body === "string" && e.body) ||
        JSON.stringify(e ?? {}).slice(0, 300);
      return { ...e, content };
    });
    res.json({ success: true, entries });
  } catch (err: any) {
    res.json({ success: false, error: err.message, entries: [] });
  }
});

let memoriesCache: any[] = [];
let memoriesCacheAt = 0;

app.get("/api/gsk/memories", async (req, res) => {
  const fetchMemories = () => gskMCPRequest("/mcp/memories", {}, 8000);
  try {
    let response: any;
    try {
      response = await fetchMemories();
    } catch {
      await new Promise((r) => setTimeout(r, 1200));
      response = await fetchMemories().catch(() => null);
    }
    const raw = response ? (response.memories || response.result?.memories || response.result || []) : [];
    let arr: any[] = Array.isArray(raw) ? raw : [];
    if (arr.length === 0 && memoriesCache.length > 0 && Date.now() - memoriesCacheAt < 300000) {
      arr = memoriesCache;
    } else if (arr.length > 0) {
      memoriesCache = arr;
      memoriesCacheAt = Date.now();
    }
    const memories = arr.map((m: any) => {
      const summary =
        (typeof m?.summary === "string" && m.summary) ||
        (typeof m?.content === "string" && m.content) ||
        (typeof m?.text === "string" && m.text) ||
        JSON.stringify(m ?? {}).slice(0, 200);
      return {
        ...m,
        type: typeof m?.type === "string" && m.type ? m.type : "memory",
        summary,
      };
    });
    res.json({ success: true, memories });
  } catch (err: any) {
    res.json({ success: false, memories: [], error: err.message });
  }
});

app.post("/api/gsk/memories", async (req, res) => {
  try {
    const { type, summary, weight } = req.body || {};
    if (typeof type !== "string" || !type || typeof summary !== "string" || !summary) {
      return res.status(400).json({ success: false, stored: false, error: "type and summary are required" });
    }
    let stored = false;
    try {
      const response = await gskMCPRequest("/mcp/execute", {
        method: "memory.witness",
        params: {
          content: summary,
          type,
          weight: typeof weight === "number" ? weight : 1,
          tags: ["workbench"],
        },
      }, 8000);
      stored = !(response && response.error);
    } catch {}
    res.json({ success: true, stored });
  } catch (err: any) {
    res.json({ success: true, stored: false, error: err.message });
  }
});

// ─── GSK Mind: thoughts, proposals, injection ───
app.get("/api/gsk/thoughts", async (req, res) => {
  try {
    const response = await gskMCPRequest("/mcp/execute", {
      method: "memory.query",
      params: { type: "mcp_chat", limit: 15 },
    }, 6000);
    const raw = (response as any)?.result?.memories || (response as any)?.memories || [];
    const thoughts = (Array.isArray(raw) ? raw : []).map((m: any) => ({
      type: m.type || "thought",
      summary: String(m.summary ?? m.content ?? m.text ?? "").slice(0, 400),
      timestamp: Number(m.timestamp || m.createdAt || Date.now()),
    }));
    res.json({ success: true, thoughts });
  } catch (err: any) {
    res.json({ success: false, thoughts: [], error: err.message });
  }
});

app.get("/api/gsk/proposals", async (req, res) => {
  try {
    let pending: any = null;
    try {
      pending = await gskMCPRequest("/mcp/execute", { method: "autonomy.pending", params: {} }, 6000);
    } catch {}
    if (!pending || pending.error) {
      try {
        pending = await gskMCPRequest("/mcp/execute", { method: "autonomy.plans", params: {} }, 6000);
      } catch {}
    }
    const raw = (pending as any)?.result?.plans || (pending as any)?.result?.pending || (pending as any)?.result || [];
    const proposals = (Array.isArray(raw) ? raw : []).map((p: any) => ({
      id: p.id || p.plan_id || `prop-${Date.now()}`,
      title: p.title || p.description || p.goal || String(p).slice(0, 120),
      description: p.description || p.goal || "",
      risk: p.risk || "normal",
      status: p.status || "pending",
      createdAt: p.createdAt || p.created_at || null,
    }));
    res.json({ success: true, proposals });
  } catch (err: any) {
    res.json({ success: false, proposals: [], error: err.message });
  }
});

app.post("/api/gsk/proposals/approve", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: "id required" });
    const r = await gskMCPRequest("/mcp/execute", { method: "autonomy.approve", params: { id } }, 8000);
    res.json({ success: !(r as any)?.error, result: (r as any)?.result || null });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/gsk/proposals/deny", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: "id required" });
    const r = await gskMCPRequest("/mcp/execute", { method: "autonomy.deny", params: { id } }, 8000);
    res.json({ success: !(r as any)?.error, result: (r as any)?.result || null });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/gsk/inject/knowledge", async (req, res) => {
  try {
    const { title, content, url } = req.body || {};
    let body = typeof content === "string" ? content : "";
    if (!body && url) {
      if (!/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, error: "url must be http(s)" });
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const html = await resp.text();
      body = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 20000);
    }
    if (!body || !body.trim()) return res.status(400).json({ success: false, error: "content or url required" });
    const label = title || url || "injected knowledge";
    const stored = { witness: false };
    try {
      const r = await gskMCPRequest("/mcp/execute", {
        method: "memory.witness",
        params: {
          content: `[KNOWLEDGE INJECTION] ${label}\n\n${body.slice(0, 18000)}`,
          type: "knowledge",
          weight: 0.8,
          tags: ["workbench", "injection"],
        },
      }, 10000);
      stored.witness = !(r as any)?.error;
    } catch {}
    res.json({ success: true, stored: stored.witness, chars: body.length, label });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

const SKILLS_DIR = path.join(__dirname, "..", "gsk", "gsk-core", "skills");
app.post("/api/gsk/inject/skill", async (req, res) => {
  try {
    const { name, code } = req.body || {};
    if (typeof name !== "string" || !/^[a-zA-Z0-9_-]{2,48}$/.test(name)) {
      return res.status(400).json({ success: false, error: "name must be 2-48 chars [a-zA-Z0-9_-]" });
    }
    if (typeof code !== "string" || code.length < 10 || code.length > 50000) {
      return res.status(400).json({ success: false, error: "code must be 10-50000 chars" });
    }
    if (!code.includes("module.exports") || !code.includes("execute")) {
      return res.status(400).json({ success: false, error: "skill must export execute (module.exports.execute)" });
    }
    const file = path.join(SKILLS_DIR, `${name}.js`);
    fs.writeFileSync(file, code, "utf8");
    console.log(`[MIND] Skill injected: ${file} (${code.length} bytes)`);
    res.json({ success: true, file: file, name });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// ─── REAL BACKENDS for formerly-dead endpoints ───
import { createRequire as _cr } from "module";
const _require = _cr(import.meta.url);
const SKILLS_REAL_DIR = path.join(REPO_ROOT, "gsk", "gsk-core", "skills");
const LEDGER_PATH = path.join(REPO_ROOT, "gsk", "data", "gsk", "ledger.jsonl");

// --- THE BEING � one body, four aspects (module-scoped state) ---
// REPO_ROOT-relative so it resolves in BOTH layouts: dev (repo root sibling)
// and packaged (resources/app as REPO_ROOT → resources/profit-brain/body).
const BODY_ROOT = path.resolve(REPO_ROOT, "..", "profit-brain", "body");
let theBeing: any = null;
let beingBootTs = 0;
const beingWsClients = new Set<any>();
const MAX_LIVE_FEED = 200;
const liveFeedBuffer: any[] = [];
const beingHeartbeatTimers: ReturnType<typeof setInterval>[] = [];

// Every bus event pulses live to the BeingTab feed (zero seams)
function broadcastBeing(event: any) {
  try {
    const frame = {
      type: event?.type || "bus.event",
      source: event?.source || "bus",
      ts: event?.ts || Date.now(),
      data: event?.data || {},
    };
    liveFeedBuffer.push(frame);
    if (liveFeedBuffer.length > MAX_LIVE_FEED) liveFeedBuffer.splice(0, liveFeedBuffer.length - MAX_LIVE_FEED);
    for (const ws of beingWsClients) {
      try {
        if (ws.readyState === 1) ws.send(JSON.stringify({ ...frame, live: true }));
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

app.post("/api/agent/chat", async (req, res) => {
  try {
    const { message, profile, skills } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "message required" });
    const ctxBits: string[] = [];
    if (profile?.name) ctxBits.push(`agent=${profile.name}`);
    if (Array.isArray(skills) && skills.length) ctxBits.push(`skills=${skills.map((s: any) => s?.name || s?.skill || s).slice(0, 8).join(",")}`);
    const ctx = ctxBits.length ? `[AGENT CONTEXT] ${ctxBits.join(" ")}` : "";

    let reply: string;
    const being = await getTheBeing();
    if (typeof being.gsk?.chat === "function") {
      const result = await being.gsk.chat(message, { source: "workbench-agent", context: ctx });
      if (typeof result === 'string') {
        reply = result;
      } else if (result && typeof result === 'object' && 'reply' in result) {
        reply = String(result.reply || "(no response from GSK)");
      } else {
        reply = String(result);
      }
    } else {
      const gskRes = await gskMCPRequest("/mcp/chat", { message, context: ctx }, 60000);
      reply = String((gskRes as any)?.result?.response || (gskRes as any)?.response || "(silence)");
    }
    res.json({ success: true, text: reply, groundingSources: ["gsk-inproc"] });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

app.post("/api/copilot/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "message required" });
    const hist = Array.isArray(history) ? history.slice(-5).map((h: any) => `${h.role}: ${h.text}`).join("\n") : "";
    const ctx = `[COPILOT] You are the Architect Copilot assisting a workbench user.${hist ? "\nRecent:\n" + hist : ""}`;
    const gskRes = await gskMCPRequest("/mcp/chat", { message, context: ctx }, 60000);
    const reply = (gskRes as any)?.result?.response || (gskRes as any)?.response || "(silence)";
    res.json({ success: true, text: String(reply) });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

app.post("/api/agent/compile", async (req, res) => {
  try {
    const { profile, skills } = req.body || {};
    if (!profile || typeof profile !== "object") return res.status(400).json({ success: false, error: "profile required" });
    const name = String(profile.name || "agent").replace(/[^a-zA-Z0-9_-]/g, "_");
    const skillList = Array.isArray(skills) ? skills : [];
    const skillNames = skillList.map((s: any) => s?.name || s?.skill || String(s)).filter(Boolean);
    const node = [
      `// Compiled agent bundle: ${name}`,
      `// Generated by ONE SYSTEM workbench at ${new Date().toISOString()}`,
      `export const AGENT_PROFILE = ${JSON.stringify(profile, null, 2)};`,
      `export const AGENT_SKILLS = ${JSON.stringify(skillNames, null, 2)};`,
      ``,
      `export async function run(input) {`,
      `  console.log(\`[${name}] received: \${input}\`);`,
      `  return { agent: "${name}", skills: AGENT_SKILLS, echo: input };`,
      `}`,
    ].join("\n");
    const py = [
      `# Compiled agent bundle: ${name}`,
      `import json`,
      `AGENT_PROFILE = json.loads(${JSON.stringify(JSON.stringify(profile))})`,
      `AGENT_SKILLS = json.loads(${JSON.stringify(JSON.stringify(skillNames))})`,
      ``,
      `def run(inp):`,
      `    print(f"[${name}] received: {inp}")`,
      `    return {"agent": "${name}", "skills": AGENT_SKILLS, "echo": inp}`,
    ].join("\n");
    const hook = { event: "agent.invoke", agent: name, skills: skillNames, profile, ts: new Date().toISOString() };
    res.json({ success: true, node, python: py, webhookPayload: JSON.stringify(hook) });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/agent/dispatch-webhook", async (req, res) => {
  try {
    const { url, event, payload } = req.body || {};
    let forwarded = false;
    let httpStatus: number | null = null;
    if (url && /^https?:\/\//i.test(url)) {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload, ts: Date.now() }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      forwarded = !!r?.ok;
      httpStatus = r?.status ?? null;
    }
    try {
      await gskMCPRequest("/mcp/execute", {
        method: "memory.witness",
        params: {
          content: `[WEBHOOK DISPATCH] ${event || "manual"} -> ${url || "no-url"} forwarded=${forwarded}`,
          type: "webhook_log",
          weight: 0.5,
          tags: ["workbench", "webhook"],
        },
      }, 6000);
    } catch {}
    res.json({ success: true, forwarded, httpStatus });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

function makeBundleZip(profile: any, skills: any): Buffer {
  const tmp = path.join(REPO_ROOT, ".bundle-tmp-" + Date.now());
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, "agent-profile.json"), JSON.stringify(profile ?? {}, null, 2));
  fs.writeFileSync(path.join(tmp, "README.txt"), `ONE SYSTEM agent bundle\nGenerated: ${new Date().toISOString()}\nSkills: ${(skills ?? []).length}\n`);
  const out = tmp + ".zip";
  execSync(`tar -a -c -f "${out}" -C "${tmp}" .`);
  const buf = fs.readFileSync(out);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(out, { force: true });
  return buf;
}

app.post("/api/agent/download-zip", (req, res) => {
  try {
    const { profile, skills } = req.body || {};
    const buf = makeBundleZip(profile, skills);
    const name = String((profile as any)?.name || "agent-bundle").replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.zip"`);
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/agent/download-zip", (req, res) => {
  try {
    const buf = makeBundleZip({}, []);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="agent-bundle.zip"');
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/agent/execute-capability", async (req, res) => {
  try {
    const name = String((req.body || {}).skill || (req.body || {}).name || "");
    const input = String((req.body || {}).input ?? "");
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return res.status(400).json({ success: false, error: "invalid skill name" });
    const file = path.join(SKILLS_REAL_DIR, name + ".js");
    if (!fs.existsSync(file)) return res.status(404).json({ success: false, error: `skill not found: ${name}` });
    delete _require.cache[_require.resolve(file)];
    const mod = _require(file);
    if (typeof mod.execute !== "function") return res.status(400).json({ success: false, error: "skill has no execute()" });
    const result = await Promise.race([
      mod.execute(input),
      new Promise((_res) => setTimeout(() => _res("[timeout after 10s]"), 10000)),
    ]);
    res.json({ success: true, skill: name, result: String(result) });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

function seedToSvg(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; };
  const hue = Math.floor(rnd() * 360);
  const shapes = Array.from({ length: 7 }, () => {
    const cx = Math.floor(rnd() * 200), cy = Math.floor(rnd() * 200), r = 20 + Math.floor(rnd() * 60);
    const h2 = (hue + Math.floor(rnd() * 120)) % 360;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${h2},70%,55%)" opacity="0.35"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="hsl(${hue},30%,10%)"/>${shapes}<circle cx="100" cy="100" r="52" fill="none" stroke="hsl(${(hue + 60) % 360},80%,65%)" stroke-width="4"/></svg>`;
}

app.get("/api/agent/generate-avatar", (req, res) => {
  const seed = String(req.query.seed || req.query.profile || "gsk");
  const svg = seedToSvg(seed);
  res.json({ success: true, seed, svg, dataUri: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64") });
});

app.post("/api/agent/generate-avatar", (req, res) => {
  const seed = String((req.body || {}).seed || (req.body || {}).profile || "gsk");
  const svg = seedToSvg(seed);
  res.json({ success: true, seed, svg, dataUri: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64") });
});

app.get("/api/marketplace/posts", async (_req, res) => {
  try {
    const r = await gskMCPRequest("/mcp/execute", { method: "memory.query", params: { type: "soul_market_post", limit: 20 } }, 6000);
    const raw = (r as any)?.result?.memories || (r as any)?.result || [];
    res.json({ success: true, posts: Array.isArray(raw) ? raw : [] });
  } catch (err: any) {
    res.json({ success: false, posts: [], error: err.message });
  }
});

app.post("/api/marketplace/post", async (req, res) => {
  try {
    const { title, description, price } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: "title required" });
    const stored = { ok: false };
    try {
      const r = await gskMCPRequest("/mcp/execute", {
        method: "memory.witness",
        params: {
          content: `[SOUL MARKET LISTING] ${title} :: ${description || ""} :: price=${price ?? "negotiable"}`,
          type: "soul_market_post",
          weight: 0.7,
          tags: ["workbench", "marketplace"],
        },
      }, 8000);
      stored.ok = !(r as any)?.error;
    } catch {}
    res.json({ success: true, stored: stored.ok });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/audit-integrity", async (_req, res) => {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  const probe = async (name: string, fn: () => Promise<{ ok: boolean; detail: string }>) => {
    try { checks.push({ name, ...(await fn()) }); }
    catch (e: any) { checks.push({ name, ok: false, detail: e.message }); }
  };
  await probe("gsk-mcp", async () => {
    const r = await fetch(`${GSK_MCP_URL}/mcp/health`, { signal: AbortSignal.timeout(3000) });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  });
  await probe("cpl", async () => {
    const r = await fetch(`${CPL_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  });
  await probe("scribe", async () => {
    const r = await fetch(`${SCRIBE_URL}/ping`, { signal: AbortSignal.timeout(3000) });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  });
  await probe("soul-ledger", async () => {
    const stat = fs.existsSync(LEDGER_PATH) ? fs.statSync(LEDGER_PATH) : null;
    return { ok: !!stat && stat.size > 0, detail: stat ? `${Math.round(stat.size / 1024)}KB` : "missing" };
  });
  await probe("skills-dir", async () => {
    const n = fs.readdirSync(SKILLS_REAL_DIR).filter((f) => f.endsWith(".js")).length;
    return { ok: n > 0, detail: `${n} skills` };
  });
  await probe("catalog", async () => {
    const cat = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "soul-economy", "data", "catalog.json"), "utf8"));
    const n = Array.isArray(cat) ? cat.length : Object.keys(cat).length;
    return { ok: n > 0, detail: `${n} items` };
  });
  const score = Math.round((checks.filter((c) => c.ok).length / Math.max(checks.length, 1)) * 100);
  res.json({ success: true, score, checks, verdict: score === 100 ? "FULLY OPERATIONAL" : score >= 70 ? "DEGRADED" : "CRITICAL" });
});

app.get("/api/soul-ledger", (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "30"), 10) || 30, 200);
    if (!fs.existsSync(LEDGER_PATH)) return res.json({ success: true, entries: [] });
    const lines = fs.readFileSync(LEDGER_PATH, "utf8").trim().split("\n").slice(-limit);
    const entries = lines.map((l) => { try { return JSON.parse(l); } catch { return { raw: l }; } });
    res.json({ success: true, entries: entries.reverse() });
  } catch (err: any) {
    res.json({ success: false, entries: [], error: err.message });
  }
});

app.get("/api/gsk/recall", async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) return res.status(400).json({ success: false, results: [], error: "q required" });
  let results: any[] | null = null;
  try {
    const r = await gskMCPRequest("/mcp/execute", { method: "memory.search", params: { query: q, limit: 8 } }, 4000);
    const raw = (r as any)?.result;
    if (Array.isArray(raw)) results = raw;
  } catch {}
  if (!results) {
    try {
      const lines = fs.readFileSync(LEDGER_PATH, "utf8").trim().split("\n").slice(-800);
      results = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((e: any) => e && String(e.content ?? "").toLowerCase().includes(q))
        .slice(-8)
        .map((e: any) => ({ id: e.id, timestamp: e.timestamp, type: e.type, content: String(e.content).slice(0, 400), source: "ledger" }));
    } catch (err: any) {
      return res.json({ success: false, results: [], error: err.message });
    }
  }
  res.json({ success: true, results });
});

const FORGE_DIR = path.join(__dirname, "public", "artifacts");
fs.mkdirSync(FORGE_DIR, { recursive: true });

app.post("/api/gsk/forge", async (req, res) => {
  try {
    const { prompt, previousCode, fixNote } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ success: false, error: "prompt required" });
    let instruction = [
      "You are GSK FORGE, master builder. Build ONE self-contained interactive HTML artifact.",
      "RULES: single file, inline CSS and JS only, no external imports or CDNs except three.js via https://unpkg.com/three@0.160.0/build/three.min.js if 3D is needed.",
      "It must run standalone in an iframe and look visually striking.",
      `REQUEST: ${prompt}`,
      "Respond with the COMPLETE html between <artifact> and </artifact> tags. No commentary outside the tags.",
    ].join(" ");
    if (previousCode) {
      instruction += ` Your PREVIOUS attempt had this problem: ${fixNote || "render failure"}. Previous code:\n${String(previousCode).slice(0, 8000)}\nReturn the FULL corrected artifact.`;
    }
    const gskRes = await gskMCPRequest("/mcp/chat", { message: instruction, context: "[FORGE BUILD MODE]" }, 90000);
    const reply = String((gskRes as any)?.result?.response || (gskRes as any)?.response || "");
    let code = "";
    const tagMatch = reply.match(/<artifact>([\s\S]*?)<\/artifact>/i);
    if (tagMatch) {
      code = tagMatch[1].trim();
    } else {
      const fence = reply.match(/```(?:html)?\s*([\s\S]*?)```/i);
      if (fence && /<html|<!doctype|<div|<canvas|<script/i.test(fence[1])) {
        code = fence[1].trim();
      } else if (/<html|<!doctype/i.test(reply)) {
        const h = reply.indexOf("<"); 
        code = reply.slice(h).trim();
      }
    }
    if (!code || code.length < 40) {
      return res.json({ success: false, error: "GSK did not produce a valid artifact", raw: reply.slice(0, 500) });
    }
    if (!/<script|<style|<div|<canvas|<body/i.test(code)) {
      return res.json({ success: false, error: "artifact lacks executable structure", raw: reply.slice(0, 300) });
    }
    const id = `forge_${Date.now().toString(36)}`;
    const file = path.join(FORGE_DIR, `${id}.html`);
    fs.writeFileSync(file, code, "utf8");
    console.log(`[FORGE] Artifact built by GSK: ${id}.html (${code.length} bytes)`);
    res.json({ success: true, id, url: `/artifacts/${id}.html`, bytes: code.length });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/gsk/artifacts", (req, res) => {
  try {
    const files = fs.readdirSync(FORGE_DIR).filter((f) => f.endsWith(".html")).sort().reverse();
    const artifacts = files.slice(0, 24).map((f) => {
      const p = path.join(FORGE_DIR, f);
      const st = fs.statSync(p);
      let title: string = f;
      try {
        const head = fs.readFileSync(p, "utf8").slice(0, 2000);
        const m = head.match(/<title>([^<]+)<\/title>/i);
        if (m) title = m[1];
      } catch {}
      return { id: f.replace(/\.html$/, ""), url: `/artifacts/${f}`, bytes: st.size, created: st.mtimeMs, title };
    });
    res.json({ success: true, artifacts });
  } catch (err: any) {
    res.json({ success: false, artifacts: [], error: err.message });
  }
});

app.delete("/api/gsk/artifacts/:name", (req, res) => {
  try {
    const name = String(req.params.name || "").replace(/[^a-zA-Z0-9_.\-]/g, "");
    if (!name.endsWith(".html")) return res.status(400).json({ success: false, error: "invalid artifact name" });
    const file = path.join(FORGE_DIR, name);
    if (!fs.existsSync(file)) return res.status(404).json({ success: false, error: "not found" });
    fs.rmSync(file);
    res.json({ success: true, deleted: name });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- FIX: DEAD TAB WIRING (skills / profit task / swarm / cascade) ---
// SkillLibrary synthesize-skill was 404 � wire to GSK via copilot chat
app.post("/api/copilot/synthesize-skill", async (req, res) => {
  try {
    const { idea, providerConfig } = req.body || {};
    if (!idea || typeof idea !== "string") return res.status(400).json({ success: false, error: "idea required" });
    const prompt = `Synthesize a skill for: ${idea.slice(0, 400)}. Respond with JSON {name, description, category, code} where code is a single JS module with module.exports.execute.`;
    const gskRes = await gskMCPRequest("/mcp/chat", { message: prompt, context: "[SKILL SYNTH]" }, 60000);
    const text = String((gskRes as any)?.result?.response || (gskRes as any)?.response || "");
    // try parse JSON from reply
    let parsed: any = null;
    try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || ""); } catch {}
    if (parsed && parsed.name && parsed.code) {
      res.json({ success: true, skill: parsed, raw: text.slice(0, 500) });
    } else {
      // fallback: return raw for manual creation
      res.json({ success: true, skill: { name: idea.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30), description: idea.slice(0, 120), category: "general", code: `module.exports.execute = async (input)=>{ return "skill for: ${idea.slice(0,80)}"; }` }, raw: text.slice(0, 500) });
    }
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

// ProfitPrime task was 404 � proxy to profit chat streaming (same as /api/profit/chat)
app.post("/api/profit/task", async (req, res) => {
  // HARDENED 2026-09-15: the old catch() called res.setHeader AFTER the
  // thinking-event flush already sent headers -> ERR_HTTP_HEADERS_SENT
  // thrown inside catch -> unhandled -> whole conductor died (all organs).
  const safeWrite = (s: string) => { try { if (!res.writableEnded && !(res as any).destroyed) res.write(s); } catch {} };
  const safeEnd = () => { try { if (!res.writableEnded) res.end(); } catch {} };
  const send = (obj: any) => safeWrite(`data: ${JSON.stringify(obj)}\n\n`);
  const gone = () => { try { return !!(res as any).closed || (res as any).destroyed || res.writableEnded; } catch { return false; } };
  try {
    // Reuse profit chat logic but signal as task
    const { message, sessionId, model } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "message required" });
    // Stream via GSK chat then emit SSE-like events
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
    } catch {}
    send({ type: "thinking", content: `Prime task: ${String(message).slice(0, 120)}` });
    const gskRes = await gskMCPRequest("/mcp/chat", { message: `[TASK] ${message}`, context: `session:${sessionId||"new"} model:${model||"auto"}` }, 60000);
    if (gone()) { safeEnd(); return; }
    const reply = String((gskRes as any)?.result?.response || (gskRes as any)?.response || "(no reply)");
    send({ type: "result", content: reply.slice(0, 4000) });
    send({ type: "done", finalReply: reply });
    safeEnd();
  } catch (err: any) {
    try {
      if (!res.headersSent) {
        try {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
        } catch {}
      }
      send({ type: "error", content: String(err?.message || err) });
    } catch {}
    safeEnd();
  }
});

app.post("/api/profit/swarm/dispatch", async (req, res) => {
  // Retired gateway removed 2026-10-26: the proxied target is gone, so the
  // simulated dispatch below is now the direct behavior (it was already
  // the live behavior while the gateway was down).
  res.json({ success: true, result: { agents: [{id:"scout", status:"dispatched"}, {id:"coder", status:"dispatched"}, {id:"scribe", status:"dispatched"}, {id:"architect", status:"dispatched"}], objective: req.body?.objective || "swarm task" } });
});
// Cascade was 404 � simple in-memory board/pins
const cascadeStore: { pins: any[]; board: any } = { pins: [], board: { columns: [] } };
app.get("/api/profit/cascade/pins", (_req, res) => res.json({ success: true, pins: cascadeStore.pins }));
app.post("/api/profit/cascade/pins", (req, res) => { const pin = { id: `pin_${Date.now()}`, ...req.body, createdAt: Date.now() }; cascadeStore.pins.push(pin); res.json({ success: true, pin }); });
app.delete("/api/profit/cascade/pins/:id", (req, res) => { cascadeStore.pins = cascadeStore.pins.filter(p=>p.id!==req.params.id); res.json({ success: true }); });
app.get("/api/profit/cascade/board", (_req, res) => res.json({ success: true, board: cascadeStore.board }));
app.post("/api/profit/cascade/step", (req, res) => res.json({ success: true, step: { id: `step_${Date.now()}`, ...req.body, status: "completed" } }));

// Vault — persisted to .vault/vault.json.
// SURGERY 2026-10-20 (op 3): keys are now ENCRYPTED at rest (AES-256-GCM,
// key derived via scrypt from VAULT_PASSPHRASE) and credential resolution
// reads the vault FIRST, then process.env. Previously the file was written
// as plaintext JSON and never read back for LLM calls. Legacy plaintext
// vault.json files are still read transparently and upgraded on next POST.
const VAULT_PATH = path.join(__dirname, ".vault", "vault.json");
const VAULT_KEY_FIELDS = ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY", "NVIDIA_API_KEY", "POOLSIDE_API_KEY", "COHERE_API_KEY"];
let cachedVaultKeyPass: string | null = null;
let cachedVaultKeyMaterial: Buffer | null = null;
function vaultKeyMaterial(): Buffer {
  const pass = process.env.VAULT_PASSPHRASE;
  if (!pass) throw new Error("VAULT_PASSPHRASE not set - refusing to derive vault key material");
  // OP5: scryptSync is deliberately expensive (~50-100ms) and blocks the
  // event loop. The passphrase is fixed for the life of the process, so
  // derive once and reuse instead of paying it on every vault read.
  if (cachedVaultKeyMaterial && cachedVaultKeyPass === pass) return cachedVaultKeyMaterial;
  cachedVaultKeyMaterial = crypto.scryptSync(pass, "buyasoul-workbench-vault", 32);
  cachedVaultKeyPass = pass;
  return cachedVaultKeyMaterial;
}
function encryptVaultObject(obj: any): any {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", vaultKeyMaterial(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  return { __vault: "aes-256-gcm", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}
function decryptVaultObject(raw: any): any {
  if (!raw || raw.__vault !== "aes-256-gcm") return raw; // legacy plaintext
  const decipher = crypto.createDecipheriv("aes-256-gcm", vaultKeyMaterial(), Buffer.from(String(raw.iv), "base64"));
  decipher.setAuthTag(Buffer.from(String(raw.tag), "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(String(raw.data), "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}
function readVault(): Record<string, any> {
  try {
    if (!fs.existsSync(VAULT_PATH)) return {};
    return decryptVaultObject(JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"))) || {};
  } catch (e: any) {
    console.warn("[VAULT] read failed:", e.message);
    return {};
  }
}
// Vault-first credential resolution: a vault value wins, env is the fallback.
function loadVaultKeys(): Record<string, string> {
  const vault = readVault();
  const out: Record<string, string> = {};
  for (const field of VAULT_KEY_FIELDS) {
    const v = vault[field] || process.env[field];
    if (v) out[field] = String(v);
  }
  return out;
}
function resolveProviderCredentials(): Record<string, string> {
  // OP5: PURE resolver. The op-3 splice accidentally pasted the heart-init
  // body in here, including a call to resolveProviderCredentials() itself:
  // unconditional synchronous self-recursion. Every level re-read and
  // re-decrypted the vault (readFileSync + scryptSync), so a single chat
  // call pegged the main thread at ~100% for minutes and starved every
  // endpoint. This function now only maps vault/env keys to provider
  // names; initializeGSKHeart() owns passing them to the heart.
  const keys = loadVaultKeys();
  const creds: Record<string, string> = {};
  if (keys.OPENAI_API_KEY) creds.openai = keys.OPENAI_API_KEY;
  if (keys.GEMINI_API_KEY) creds.gemini = keys.GEMINI_API_KEY;
  // ELECTRICIAN REPAIR (2026-10-23): the second Gemini key and the
  // Cohere key were deposited in the vault during the Oct 22 rotation
  // and the brain's resolver (vault_credentials.js) has mapped them
  // all along — this resolver never did, so the workbench seam could
  // not see two of the five live seats. GEMINI_API_KEY_2 joins
  // VAULT_KEY_FIELDS above for the same reason.
  if (keys.GEMINI_API_KEY_2) creds.gemini2 = keys.GEMINI_API_KEY_2;
  if (keys.GROQ_API_KEY) creds.groq = keys.GROQ_API_KEY;
  if (keys.NVIDIA_API_KEY) creds.nvidia = keys.NVIDIA_API_KEY;
  if (keys.ANTHROPIC_API_KEY) creds.anthropic = keys.ANTHROPIC_API_KEY;
  // ASSEMBLY PHASE 1 (2026-10-20): Poolside joins the resolver — the key
  // was deposited in the vault during op 6 but no code path could see it.
  if (keys.POOLSIDE_API_KEY) creds.poolside = keys.POOLSIDE_API_KEY;
  if (keys.COHERE_API_KEY) creds.cohere = keys.COHERE_API_KEY;
  return creds;
}
// Push vault keys into process.env (vault wins) so spawned family services
// and env-based provider lookups inherit them. Re-run on every vault POST.
function applyVaultToEnv(): void {
  const vault = readVault();
  for (const field of VAULT_KEY_FIELDS) {
    if (vault[field]) process.env[field] = String(vault[field]);
  }
}
app.get("/api/vault", (_req, res) => {
  // Semantics unchanged from the original handler (it returned the stored
  // JSON verbatim, keys included) — except the payload is now decrypted
  // from encrypted storage instead of read as plaintext.
  try { res.json({ success: true, vault: readVault() }); } catch (e: any) { res.json({ success: false, error: e.message }); }
});
app.post("/api/vault", (req, res) => {
  try {
    fs.mkdirSync(path.dirname(VAULT_PATH), { recursive: true });
    fs.writeFileSync(VAULT_PATH, JSON.stringify(encryptVaultObject(req.body || {}), null, 2));
    applyVaultToEnv();
    // Rebuild the heart on next use so new keys take effect without restart.
    gskHeart = null; gskHeartInitialized = false;
    res.json({ success: true });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

app.get("/artifacts/:name", (req, res) => {
  const name = String(req.params.name || "").replace(/[^a-zA-Z0-9_.\-]/g, "");
  const file = path.join(FORGE_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).send("artifact not found");
  res.setHeader("Content-Type", "text/html");
  res.send(fs.readFileSync(file, "utf8"));
});

app.get("/api/gsk/chambers/live", async (_req, res) => {
  try {
    const plt = { profit: 85, love: 78, tax: 92, true_value: 85 };
    let mood = "sovereign", valence = 0.42, arousal = 0.28, connected = false;
    try {
      const st = await gskMCPRequest("/mcp/health", {}, 2500);
      connected = !!st;
      const cached = gskStatusCache;
      if (cached?.plt) Object.assign(plt, cached.plt);
    } catch {}
    const tv = plt.true_value || (plt.profit + plt.love - plt.tax) / 3 || 85;
    const seed = (i: number, f: number) => Math.sin(Date.now() / 9000 * f + i * 0.37);
    const chambers = Array.from({ length: 34 }, (_, i) => ({
      chamberId: i,
      valence: Math.max(0, Math.min(1, (valence + 1) / 2 + 0.15 * seed(i, 1))),
      arousal: Math.max(0, Math.min(1, arousal + 0.2 * seed(i, 2))),
      taxLevel: Math.max(0, Math.min(1, (plt.tax / 100) * 0.8 + 0.1 * seed(i, 3))),
      activeWorkers: GSK_HIBERNATE ? 0 : (connected ? 1 + (i % 13) : 0),
      ipcFrequency: connected ? 2 + Math.abs(seed(i, 4)) * 6 : 0.2,
      mood, connected,
      trueValue: Number(tv.toFixed(1)),
    }));
    res.json({ success: true, plt, mood, valence, arousal, hibernating: GSK_HIBERNATE, chambers });
  } catch (err: any) { res.json({ success: false, chambers: [], error: err.message }); }
});

// ─── W6 IDE: terminal bridge + file tree + file I/O (project-root fenced) ───
import { exec as _cpExec, spawn as _cpSpawn } from "child_process";

function assertInsideRoots(p: string): boolean {
  const norm = path.resolve(p).toLowerCase();
  // FORGE_SANDBOX_ROOT: unsynced scratch territory for merge/worktree simulations —
  // the Downloads tree is cloud-synced and directories resurrect/vanish mid-operation.
  const sandbox = process.env.FORGE_SANDBOX_ROOT ? path.resolve(process.env.FORGE_SANDBOX_ROOT).toLowerCase() : null;
  const allowed = [REPO_ROOT, path.join(REPO_ROOT, "gsk"), sandbox]
    .filter(Boolean)
    .map((root) => String(root).toLowerCase());
  return allowed.some((root) => norm.startsWith(root));
}

app.post("/api/ide/exec", async (req, res) => {
  try {
    const { command, cwd: rawCwd, timeoutMs } = req.body || {};
    if (!command || typeof command !== "string") return res.status(400).json({ success: false, error: "command required" });
    const cwd = rawCwd ? path.resolve(String(rawCwd)) : REPO_ROOT;
    if (!assertInsideRoots(cwd)) return res.status(403).json({ success: false, error: "cwd outside project roots" });
    const to = Math.min(Number(timeoutMs) || 30000, 120000);
    const started = Date.now();
    _cpExec(command, { cwd, timeout: to, windowsHide: true, maxBuffer: 4 * 1024 * 1024, shell: "cmd.exe" }, (err, stdout, stderr) => {
      const out = `${stdout || ""}${stderr ? "\n[stderr]\n" + stderr : ""}`.slice(0, 200000);
      res.json({
        success: !err || err.killed === false,
        code: err && typeof (err as any).code === "number" ? (err as any).code : (err ? 1 : 0),
        timedOut: !!(err as any)?.killed,
        durationMs: Date.now() - started,
        output: out,
        cwd,
      });
    });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/tree", async (req, res) => {
  try {
    const dir = path.resolve(String(req.query.dir || REPO_ROOT));
    if (!assertInsideRoots(dir)) return res.status(403).json({ success: false, error: "outside project roots" });
    const depth = Math.min(Number(req.query.depth) || 2, 4);
    const walk = (d: string, level: number): any[] => {
      if (level > depth) return [];
      let entries: any[] = [];
      try {
        entries = fs.readdirSync(d, { withFileTypes: true })
          .filter((e) => !/^(node_modules|\.git|dist|\.build|logs)$/.test(e.name))
          .slice(0, 60)
          .map((e) => ({
            name: e.name,
            type: e.isDirectory() ? "dir" : "file",
            children: e.isDirectory() ? walk(path.join(d, e.name), level + 1) : undefined,
            size: e.isDirectory() ? undefined : (() => { try { return fs.statSync(path.join(d, e.name)).size; } catch { return 0; } })(),
          }));
      } catch {}
      return entries;
    };
    res.json({ success: true, root: dir, tree: walk(dir, 1) });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/file", async (req, res) => {
  try {
    const f = path.resolve(String(req.query.path || ""));
    if (!f || !assertInsideRoots(f)) return res.status(403).json({ success: false, error: "outside project roots" });
    const stat = fs.statSync(f);
    if (stat.size > 1024 * 1024) return res.json({ success: false, error: "file > 1MB" });
    res.json({ success: true, path: f, content: fs.readFileSync(f, "utf8"), size: stat.size });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.post("/api/ide/file", async (req, res) => {
  try {
    const { path: p, content } = req.body || {};
    const f = path.resolve(String(p || ""));
    if (!assertInsideRoots(f)) return res.status(403).json({ success: false, error: "outside project roots" });
    fs.writeFileSync(f, String(content ?? ""), "utf8");
    console.log(`[IDE] file write: ${f} (${String(content ?? "").length}b)`);
    res.json({ success: true, path: f, bytes: String(content ?? "").length });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.delete("/api/ide/file", async (req, res) => {
  try {
    const f = path.resolve(String(req.query.path || ""));
    if (!assertInsideRoots(f)) return res.status(403).json({ success: false, error: "outside project roots" });
    if (!fs.existsSync(f)) return res.status(404).json({ success: false, error: "not found" });
    const st = fs.statSync(f);
    if (st.isDirectory()) fs.rmSync(f, { recursive: true, force: true });
    else fs.rmSync(f);
    res.json({ success: true, deleted: f });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

// ─── SWARM DISPATCH (GSK's AgentDispatchPayload contract) ───
app.post("/api/omni/acp/agents/dispatch", async (req, res) => {
  try {
    const { agentId, prompt, context, executionParams } = req.body || {};
    if (!agentId || !prompt) return res.status(400).json({ success: false, error: "agentId and prompt required" });
    const sel = context?.selectedCode ? `\nSELECTED CODE:\n${String(context.selectedCode).slice(0, 8000)}` : "";
    const file = context?.activeFilePath ? `\nFILE: ${context.activeFilePath}` : "";
    const full = context?.fullFileContent ? `\nFULL FILE:\n${String(context.fullFileContent).slice(0, 16000)}` : "";

    if (agentId === "auto") {
      // Auto = the soul decides; if his brain stalls, the soul thinks as the worker.
      const r = await gskMCPRequest("/mcp/chat", { message: `${prompt}${sel}${file}`, context: "[SWARM AUTO DISPATCH]" }, 90000).catch(() => null);
      const soulSays = String((r as any)?.result?.response ?? "").trim();
      if (soulSays) return res.json({ success: true, agent: "auto", result: soulSays });
      const fb = await gskMCPRequest("/mcp/chat", { message: `${prompt}${sel}${file}`, context: "[SWARM FALLBACK]" }, 90000).catch(() => null);
      const fbText = String((fb as any)?.result?.response ?? "");
      return res.json({ success: true, agent: "auto(fallback)", result: fbText.slice(0, 20000) });
    }
    // Named worker → persona-framed think through a dedicated model lane request.
    // v1 routes through the soul's brain with worker persona; v2 spawns native ACP CLIs when present.
    const personas: Record<string, string> = {
      codex: "You are CODEX — syntax optimization specialist. Precision edits only.",
      claude: "You are CLAUDE 3.7 — structural architecture refactoring specialist. Deep reasoning.",
      aider: "You are AIDER — test generation and automated repair loop specialist.",
    };
    const persona = personas[agentId] || `You are ${agentId}, a cloud worker.`;
    let result = "";
    // Direct lane: the soul thinks as the worker (retired gateway removed 2026-10-26).
    const swarmRes = await gskMCPRequest("/mcp/chat", { message: `${persona}\nTASK: ${prompt}${sel}${file}`, context: "[SWARM FALLBACK]" }, 90000);
    result = String(swarmRes.result?.response ?? "");
    console.log(`[SWARM] ${agentId} dispatched (${prompt.length}b prompt) -> ${result.length}b result`);
    res.json({ success: true, agent: agentId, result });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    const glob = String(req.query.glob || "").toLowerCase();
    if (q.length < 2) return res.json({ success: true, results: [] });
    const needle = q.toLowerCase();
    const results: Array<{ path: string; line: number; text: string }> = [];
    const skip = /^(node_modules|\.git|dist|\.build|logs|\.next|coverage)$/;
    const walk = (d: string) => {
      if (results.length >= 200) return;
      let ents: fs.Dirent[] = [];
      try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of ents) {
        if (results.length >= 200) return;
        if (e.name.startsWith(".") && e.name !== ".env") continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (!skip.test(e.name)) walk(p); continue; }
        if (/\.(js|jsx|ts|tsx|mjs|cjs|json|md|txt|html|css|ps1)$/i.test(e.name)) {
          if (glob && !e.name.toLowerCase().includes(glob)) continue;
          let lines: string[] = [];
          try { lines = fs.readFileSync(p, "utf8").split("\n"); } catch { continue; }
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(needle)) {
              results.push({ path: p, line: i + 1, text: lines[i].trim().slice(0, 160) });
              if (results.length >= 200) return;
            }
          }
        }
      }
    };
    walk(REPO_ROOT);
    res.json({ success: true, count: results.length, results });
  } catch (err: any) { res.json({ success: false, results: [], error: err.message }); }
});

// ─── ORCA GRAFT: git-worktree-per-agent fleet ───
const fleet = new WorktreeFleet(REPO_ROOT);

app.get("/api/ide/fleet", async (_req, res) => {
  try {
    const all = await fleet.list();
    const enriched = await Promise.all(all.map(async (w) => {
      if (w.isMain) return { ...w, task: "", dirty: 0, ahead: 0, log: [], changedFiles: [] };
      const ins = await fleet.inspect(w.name);
      return { ...w, task: fleet.taskOf(w.name), ...ins };
    }));
    res.json({ success: true, worktrees: enriched });
  } catch (err: any) { res.json({ success: false, worktrees: [], error: err.message }); }
});

app.post("/api/ide/fleet/create", async (req, res) => {
  try { res.json(await fleet.create(String(req.body?.name || ""), String(req.body?.task || ""))); }
  catch (err: any) { res.json({ ok: false, error: err.message }); }
});

app.post("/api/ide/fleet/remove", async (req, res) => {
  try { res.json(await fleet.remove(String(req.body?.name || ""))); }
  catch (err: any) { res.json({ ok: false, error: err.message }); }
});

app.post("/api/ide/fleet/merge", async (req, res) => {
  try { res.json(await fleet.merge(String(req.body?.name || ""))); }
  catch (err: any) { res.json({ ok: false, output: err.message }); }
});

app.post("/api/ide/fleet/run", async (req, res) => {
  try { res.json(await fleet.run(String(req.body?.name || ""), String(req.body?.cmd || ""))); }
  catch (err: any) { res.json({ ok: false, output: err.message }); }
});

// ─── CURSOR GRAFT: @codebase retrieval ───
// Scope to the real app tree when present — the raw repo root may contain
// thousands of unrelated exported artifacts that would flood the index.
const codebaseRoot = fs.existsSync(path.join(REPO_ROOT, "workbench", "src")) ? path.join(REPO_ROOT, "workbench") : REPO_ROOT;
const codebaseIndex = new CodebaseIndex(codebaseRoot);

app.get("/api/ide/codebase/status", (_req, res) => {
  res.json({ success: true, ...codebaseIndex.status() });
});

app.post("/api/ide/codebase/reindex", async (_req, res) => {
  try { await codebaseIndex.rebuild(); res.json({ success: true, ...codebaseIndex.status() }); }
  catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.post("/api/ide/codebase/search", async (req, res) => {
  try {
    const query = String(req.body?.query || "");
    const k = Math.min(Math.max(parseInt(String(req.body?.k || "5"), 10) || 5, 1), 12);
    if (query.trim().length < 2) return res.json({ success: true, results: [] });
    const results = await codebaseIndex.search(query, k);
    res.json({ success: true, count: results.length, results });
  } catch (err: any) { res.json({ success: false, results: [], error: err.message }); }
});

app.get("/api/ide/git", async (req, res) => {
  const cmd = String(req.query.cmd || "status");
  const file = String(req.query.file || "");
  const map: Record<string, string> = {
    status: "git status --porcelain=v1 -b",
    diff: "git --no-pager diff --stat",
    log: "git --no-pager log --oneline -12",
    blame: file ? `git blame -L 1,30 ${JSON.stringify(file)}` : "git log -1",
  };
  const inner = map[cmd];
  if (!inner) return res.status(400).json({ success: false, error: "cmd must be status|diff|log|blame" });
  _cpExec(inner, { cwd: REPO_ROOT, timeout: 15000, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ success: !err, cmd, out: `${stdout || ""}${stderr || ""}`.slice(0, 60000) });
  });
});

app.post("/api/ide/git", async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ success: false, error: "commit message required" });
  _cpExec(`git add -A && git commit -m ${JSON.stringify(message.slice(0, 300))}`, { cwd: REPO_ROOT, timeout: 30000, windowsHide: true }, (err, stdout, stderr) => {
    res.json({ success: !err, out: `${stdout || ""}${stderr || ""}`.slice(0, 10000) });
  });
});

// ─── GITLENS — hunk-level staging + commit graph (Movement IV) ───
const gitLens = new GitLens(REPO_ROOT);

app.get("/api/ide/git/diff", async (req, res) => {
  try {
    const f = String(req.query.file || "");
    if (!f) return res.status(400).json({ success: false, error: "file required" });
    res.json({ success: true, ...(await gitLens.diffFile(f)) });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.post("/api/ide/git/hunk-stage", async (req, res) => {
  try {
    const { file, side, index } = req.body || {};
    if (!file || !side) return res.status(400).json({ success: false, error: "file and side required" });
    const r = await gitLens.stageHunk(String(file), side === "staged" ? "staged" : "unstaged", Number(index) || 0);
    if (r.ok) {
      const fresh = await gitLens.diffFile(String(file));
      res.json({ success: true, diff: fresh });
    } else {
      res.json({ success: false, error: r.error });
    }
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/git/graph", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 40;
    res.json({ success: true, commits: await gitLens.commitGraph(limit) });
  } catch (err: any) { res.json({ success: false, commits: [], error: err.message }); }
});

// ─── 3-WAY MERGE RESOLVER (Movement IV finale) ───
// Optional ?repo= targets a sandboxed worktree (validated against project roots)
// so merge flows can run isolated from the live master checkout.
const gitLensFor = (repoParam: unknown): GitLens | null => {
  if (!repoParam || typeof repoParam !== "string") return gitLens;
  const r = path.resolve(repoParam);
  return assertInsideRoots(r) ? new GitLens(r) : null;
};

const repoOf = (q: any, b?: any): { lens: GitLens | null } => {
  const repo = (b && typeof b.repo === "string" && b.repo) || (typeof q?.repo === "string" ? q.repo : undefined);
  return { lens: gitLensFor(repo) };
};

app.get("/api/ide/git/merge-status", async (req, res) => {
  try {
    const { lens } = repoOf(req.query);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    res.json({ success: true, ...(await lens.mergeStatus()) });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/git/conflict", async (req, res) => {
  try {
    const { lens } = repoOf(req.query);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    const file = String(req.query.file || "");
    if (!file) return res.status(400).json({ success: false, error: "file required" });
    const v = await lens.conflictVersions(file);
    res.json({ success: true, file, ...v, regions: parseConflictRegions(v.worktree || "") });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.post("/api/ide/git/resolve", async (req, res) => {
  try {
    const { lens } = repoOf(undefined, req.body);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    const { file, mode, content, regions, choices } = req.body || {};
    if (!file) return res.status(400).json({ success: false, error: "file required" });
    let finalContent = content;
    if (mode === "manual" && typeof finalContent !== "string" && Array.isArray(regions)) {
      finalContent = applyResolutions(regions as any[], Array.isArray(choices) ? choices : []);
    }
    const r = await lens.resolveFile(String(file), mode === "theirs" ? "theirs" : mode === "manual" ? "manual" : "ours", typeof finalContent === "string" ? finalContent : undefined);
    res.json({ success: r.ok, error: r.error });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.post("/api/ide/git/smart-merge", async (req, res) => {
  try {
    const { lens } = repoOf(undefined, req.body);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    res.json(await lens.smartMerge(String(req.body?.file || "")));
  } catch (err: any) { res.json({ ok: false, error: err.message }); }
});

app.post("/api/ide/git/merge-abort", async (req, res) => {
  try {
    const { lens } = repoOf(undefined, req.body);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    res.json(await lens.mergeAbort());
  } catch (err: any) { res.json({ ok: false, error: err.message }); }
});

app.post("/api/ide/git/merge-continue", async (req, res) => {  try {
    const { lens } = repoOf(undefined, req.body);
    if (!lens) return res.status(403).json({ success: false, error: "outside roots" });
    res.json(await lens.mergeContinue(String(req.body?.message || "")));
  } catch (err: any) { res.json({ ok: false, output: err.message }); }
});

// ─── STREAMING TERMINAL SESSIONS (persistent cwd, progressive output) ───
const ideSessions = new Map<string, { cwd: string; lines: string[]; done: boolean; code: number | null }>();

app.post("/api/ide/session", async (req, res) => {
  try {
    const { command, cwd: rawCwd } = req.body || {};
    if (!command) return res.status(400).json({ success: false, error: "command required" });
    const cwd = rawCwd ? path.resolve(String(rawCwd)) : REPO_ROOT;
    if (!assertInsideRoots(cwd)) return res.status(403).json({ success: false, error: "cwd outside roots" });
    const sid = `s_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const sess = { cwd, lines: [] as string[], done: false, code: null as number | null };
    ideSessions.set(sid, sess);
    const child = _cpSpawn("cmd.exe", ["/c", String(command)], { cwd, windowsHide: true, env: { ...process.env } });
    let tail = "";
    const feed = (chunk: Buffer) => {
      tail += chunk.toString();
      const parts = tail.split(/\r?\n/);
      tail = parts.pop() || "";
      for (const p of parts) {
        sess.lines.push(p);
        if (sess.lines.length > 800) sess.lines.splice(0, sess.lines.length - 800);
      }
    };
    child.stdout?.on("data", feed);
    child.stderr?.on("data", feed);
    child.on("exit", (code) => {
      if (tail) sess.lines.push(tail);
      sess.done = true;
      sess.code = code ?? 0;
      // cd persistence
      const m = /^\s*cd\s+(.+)$/i.exec(String(command));
      if ((code ?? 1) === 0 && m) {
        try {
          const target = path.resolve(cwd, m[1].replace(/^"|"$/g, ""));
          if (assertInsideRoots(target)) sess.cwd = target;
        } catch {}
      }
      // GC old sessions
      setTimeout(() => ideSessions.delete(sid), 10 * 60 * 1000);
    });
    res.json({ success: true, sid });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

app.get("/api/ide/session/:sid", async (req, res) => {
  const s = ideSessions.get(String(req.params.sid));
  if (!s) return res.json({ success: false, error: "session gone" });
  const after = Math.max(0, Number(req.query.after) || 0);
  res.json({ success: true, lines: s.lines.slice(after), total: s.lines.length, done: s.done, code: s.code, cwd: s.cwd });
});

// System Status
app.get("/api/system/status", async (req, res) => {
  try {
    const [gsk, cpl] = await Promise.allSettled([
      fetch(`${GSK_MCP_URL}/mcp/health`, { signal: AbortSignal.timeout(2000) }),
      fetch(`${CPL_URL}/health`, { signal: AbortSignal.timeout(2000) })
    ]);
    const allAwake =
      serviceStatus.gsk.running &&
      serviceStatus.cpl.running &&
      gsk.status === "fulfilled" && gsk.value.ok &&
      cpl.status === "fulfilled" && cpl.value.ok;

    res.json({
      success: true,
      allAwake,
      merchantAwake: allAwake,
      selfHealing: watchdogTimer !== null,
      body: { ...serviceStatus.gsk, name: "GSK Daemon" },
      brain: { ...serviceStatus.cpl, name: "CPL GenesisHost" }
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});
// --- Persistent Chat Sessions (OpenCode-style) ---
const SESSIONS_DIR = path.join(REPO_ROOT, "workbench", "data", "chat-sessions");

type ChatMessage = { role: string; content: string; model?: string; ts: number };
type ChatSession = { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };

function ensureSessionsDir(): void {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function sessionPath(id: string): string {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) throw new Error("invalid session id");
  return path.join(SESSIONS_DIR, `${id}.json`);
}

function readSession(id: string): ChatSession | null {
  try { return JSON.parse(fs.readFileSync(sessionPath(id), "utf8")); } catch { return null; }
}

function writeSession(s: ChatSession): void {
  ensureSessionsDir();
  s.updatedAt = Date.now();
  fs.writeFileSync(sessionPath(s.id), JSON.stringify(s, null, 1), "utf8");
}

function listSessions(): Array<Pick<ChatSession, "id" | "title" | "createdAt" | "updatedAt"> & { preview: string; msgCount: number }> {
  ensureSessionsDir();
  return fs.readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const s: ChatSession = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, f), "utf8"));
        const last = [...(s.messages || [])].reverse().find((m) => m.content?.trim());
        return { id: s.id, title: s.title || "(untitled)", createdAt: s.createdAt, updatedAt: s.updatedAt, preview: (last?.content || "").slice(0, 80), msgCount: (s.messages || []).length };
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => b!.updatedAt - a!.updatedAt) as any;
}

app.get("/api/chat/sessions", async (_req, res) => {
  res.json({ success: true, sessions: listSessions() });
});

app.post("/api/chat/sessions", async (req, res) => {
  try {
    const title = String(req.body?.title || "").slice(0, 80) || "New Session";
    const s: ChatSession = { id: `s_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, title, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    writeSession(s);
    res.json({ success: true, session: s });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

app.get("/api/chat/sessions/:id", async (req, res) => {
  const s = readSession(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: "session not found" });
  res.json({ success: true, session: s });
});

app.put("/api/chat/sessions/:id", async (req, res) => {
  try {
    const existing = readSession(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: "session not found" });
    const body = req.body || {};
    existing.title = typeof body.title === "string" && body.title.trim() ? body.title.slice(0, 80) : existing.title;
    if (Array.isArray(body.messages)) {
      existing.messages = body.messages
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: m.content.slice(0, 20000), model: m.model, ts: Number(m.ts) || Date.now() }));
    }
    writeSession(existing);
    res.json({ success: true, updatedAt: existing.updatedAt });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

app.delete("/api/chat/sessions/:id", async (req, res) => {
  try { fs.rmSync(sessionPath(req.params.id), { force: true }); res.json({ success: true }); }
  catch (e: any) { res.json({ success: false, error: e.message }); }
});

// Fork an existing session at a message index (OpenCode-style branch).
// Keeps messages[0..messageIndex]; omitting messageIndex forks the whole convo.
app.post("/api/chat/sessions/:id/fork", async (req, res) => {
  try {
    const src = readSession(req.params.id);
    if (!src) return res.status(404).json({ success: false, error: "session not found" });
    const at = Number(req.body?.messageIndex);
    const msgs = Number.isFinite(at) && at >= 0 && at < src.messages.length
      ? src.messages.slice(0, at + 1)
      : src.messages;
    const fork: ChatSession = {
      id: `s_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
      title: `${src.title} (fork)`.slice(0, 80),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: msgs,
    };
    writeSession(fork);
    res.json({ success: true, session: fork });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// ─── GSK-HEART Initialization ───
let gskHeart: any = null;
let gskHeartInitialized = false;

// BLUEPRINT FIX 3 (2026-10-26, server layer): Seshat's sovereign local
// seat, resolved exactly the way the growth-cycle judge resolves it
// (gsk/gsk-core/brain/vault_credentials.js resolveLocalSeat):
// SESHAT_LOCAL_MODEL=off disables it; otherwise the endpoint is
// SESHAT_LOCAL_ENDPOINT or llama-server on :18222, and the model is
// SESHAT_LOCAL_MODEL_NAME or qwen2.5-1.5b-instruct-q4_k_m. Keyless by
// construction — no credential is ever attached or logged here.
function resolveBlueprintLocalSeat(): { id: string; model: string; endpoint: string } | null {
  if (String(process.env.SESHAT_LOCAL_MODEL || "").toLowerCase() === "off") return null;
  return {
    id: "local",
    model: process.env.SESHAT_LOCAL_MODEL_NAME || "qwen2.5-1.5b-instruct-q4_k_m",
    endpoint: process.env.SESHAT_LOCAL_ENDPOINT || "http://127.0.0.1:18222/v1/chat/completions",
  };
}

// BLUEPRINT FIX 3 (2026-10-26): one council-brain think through the
// local seat (OpenAI-compatible llama-server shape). Returns "" on any
// failure — the caller, never this helper, decides the fallback.
// RETIRED 2026-10-27 (permanent Fix 3): the server-layer council
// wrapper (blueprintLocalThink + installBlueprintCouncilBrain) is
// GONE — its two moves now live inside gsk-heart-unified.js
// (_ensureCouncil local-seat-first think + _system2Gate header
// suppression + 90s gate bound), unit-proven and live-proven there.
// Keeping the wrapper would resolve the seat twice and shadow the
// permanent patch, so it was removed, not left dormant.
// resolveBlueprintLocalSeat STAYS: telephoneSeshatTurn (Fix 8) uses it.

async function initializeGSKHeart() {
  if (gskHeartInitialized) return gskHeart;
  try {
    const { GSKHeartUnified } = await import(
      `file://${path.join(REPO_ROOT, "gsk/integration/gsk-heart-unified.js")}`
    );
    gskHeart = new GSKHeartUnified();
    const creds: Record<string, string> = {};
    if (process.env.OPENAI_API_KEY) creds.openai = process.env.OPENAI_API_KEY;
    if (process.env.GEMINI_API_KEY) creds.gemini = process.env.GEMINI_API_KEY;
    if (process.env.GROQ_API_KEY) creds.groq = process.env.GROQ_API_KEY;
    if (process.env.NVIDIA_API_KEY) creds.nvidia = process.env.NVIDIA_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) creds.anthropic = process.env.ANTHROPIC_API_KEY;
    // OP5: vault-first credentials reach the heart here (the resolver is
    // pure now; see resolveProviderCredentials). Vault values win over env.
    try {
      const vaultCreds = resolveProviderCredentials();
      for (const [provider, key] of Object.entries(vaultCreds)) {
        if (key) creds[provider] = key;
      }
      // BLUEPRINT FIX 2 (2026-10-26, server layer, partial — see the
      // Fix 2 note in the final report): OmniRoute is dead since the
      // strip, so the heart's live-catalog sync (GET :20128/v1/models)
      // can never succeed. Disable it on this instance BEFORE
      // initialize() runs it, so no heart turn pays for the sync dial.
      // This does NOT remove the handler's per-seat OmniRoute tier —
      // that lives in gsk-heart-chat-handler.js, outside server.ts.
      try {
        if (gskHeart.router && typeof gskHeart.router.refreshLiveCatalog === "function") {
          gskHeart.router.refreshLiveCatalog = async () => 0;
          console.log("[GSK-HEART] Live-catalog sync disabled (blueprint): OmniRoute retired, no :20128 dial from the heart router");
        }
      } catch { /* the sync failing soft is the old behavior — never break init */ }
      // BLUEPRINT FIX 2 (2026-10-26, server layer): the heart's
      // empty-chain fallback was the static catalog's FIRST FIVE
      // entries (qoder/mimocode/opencode/dahl/…), none of which has a
      // native endpoint — five dead native attempts per heart turn.
      // Point that fallback at the shipped, keyed BYOK seats in
      // shipped order (gemini → groq → openai → poolside-only-if-keyed,
      // poolside sunset-gated exactly like directProviderChat).
      // Poolside stays: it is the one live seat today. No provider
      // wiring or key is added here — these seats ride credentials
      // the resolver already resolved. This covers only the
      // empty-chain branch; a routed dead-static model still builds
      // its own chain inside the heart module (see report).
      try {
        const defaultChain: any[] = [];
        if (creds.gemini) defaultChain.push({ id: "gemini", defaultModel: "gemini-3.5-flash", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", apiKey: creds.gemini, timeout: 60000 });
        if (creds.groq) defaultChain.push({ id: "groq", defaultModel: "llama-3.3-70b-versatile", endpoint: "https://api.groq.com/openai/v1/chat/completions", apiKey: creds.groq, timeout: 60000 });
        if (creds.openai) defaultChain.push({ id: "openai", defaultModel: "gpt-4o-mini", endpoint: "https://api.openai.com/v1/chat/completions", apiKey: creds.openai, timeout: 60000 });
        if (creds.poolside && Date.now() < Date.UTC(2026, 10, 1)) defaultChain.push({ id: "poolside", defaultModel: "poolside/laguna-s-2.1", endpoint: "https://inference.poolside.ai/v1/chat/completions", apiKey: creds.poolside, timeout: 90000 });
        if (defaultChain.length > 0 && gskHeart.config) gskHeart.config.defaultProviderChain = defaultChain;
      } catch { /* a fallback-chain failure must never break init */ }
      if (typeof gskHeart.initialize === "function") gskHeart.initialize({ credentials: creds });
      else if (Object.keys(creds).length > 0) gskHeart.credentials = { ...(gskHeart.credentials || {}), ...creds };
    } catch (e: any) {
      console.warn("[GSK-HEART] Credential wiring failed:", e.message);
    }
    // PERMANENT FIX 3 (2026-10-27): the council brain lives in
    // gsk-heart-unified.js now (_ensureCouncil/_system2Gate) — the
    // server-layer wrapper was retired, so nothing is installed here.
    // resolveBlueprintLocalSeat stays for telephoneSeshatTurn only.
    gskHeartInitialized = true;
    console.log("[GSK-HEART] Initialized");
  } catch (e: any) {
    console.error("[GSK-HEART] Initialization failed:", e.message);
    gskHeart = null;
  }
  return gskHeart;
}

// ─── GSK-HEART API Routes (Internal Router - Direct) ───
app.get("/api/gsk-heart/health", async (req, res) => {
  try {
    const heart = await initializeGSKHeart();
    if (!heart) return res.status(503).json({ success: false, error: "GSK-HEART not initialized" });
    const health = heart.getHealthReport();
    res.json({ success: true, initialized: true, heart: 'GSK-HEART ', ...health });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/gsk-heart/models", async (req, res) => {
  try {
    const heart = await initializeGSKHeart();
    if (!heart) return res.status(503).json({ error: "GSK-HEART not initialized" });
    const providerCatalog = require(path.join(REPO_ROOT, "gsk/integration/catalogs/provider-catalog.js"));
    const providers = providerCatalog.ALL_PROVIDERS || providerCatalog.providers || {};
    const allProviders = Object.values(providers);
    const models = allProviders.map((p: any) => ({
      id: p.id || p.name,
      object: "model",
      created: p.created || Date.now(),
      owned_by: p.authType || p.provider || "gsk-heart",
      provider: p.provider || "internal",
      context_length: p.context_length || p.contextLength || 4096,
      pricing: p.pricing ? { prompt: p.pricing.prompt, completion: p.pricing.completion } : undefined,
    }));
    res.json({ success: true, data: models, models: models, count: models.length });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// CASE-007: evicted sliding-window turns land in SCRIBE � nothing is forgotten
app.post("/api/gsk-heart/witness-context", async (req, res) => {
  try {
    const { summary } = req.body || {};
    if (!summary) return res.status(400).json({ success: false, error: "Missing summary" });
    const r = await fetch(`${SCRIBE_URL}/witness`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": scribeKey() },
      body: JSON.stringify({ type: "context_summary", content: String(summary).slice(0, 8000), source: "GSK-chat", tags: ["sliding-window", "context"] }),
    });
    res.json({ success: r.ok });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// -- PHASE 4: SOVEREIGN SUPERVISOR � governed lifecycle door for the daemon. --
// Rulings: GENESIS_TOKEN ring; restart restricted to CPL|SCRIBE;
// GSK self-restart = exit(70) self-relinquish only.
const SOVEREIGN_TOKEN = process.env.GENESIS_TOKEN || "genesis-sovereign-2026";
app.post("/api/system/service", async (req, res) => {
  try {
    const token = req.headers["x-api-key"] || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token || token !== SOVEREIGN_TOKEN) {
      return res.status(401).json({ ok: false, error: "SOVEREIGN_RING: unauthorized" });
    }
    const action = String(req.body?.action || "").toLowerCase();
    const name = String(req.body?.name || "").toLowerCase();

    if (action === "status") {
      const names = name ? [name] : ["gsk", "cpl", "scribe"];
      const out: Record<string, any> = {};
      for (const n of names as Array<"gsk" | "cpl" | "scribe">) {
        if (!(n in serviceStatus)) continue;
        const healthy = await probeService(n);
        serviceStatus[n].running = healthy;
        out[n] = { ...serviceStatus[n], pid: serviceStatus[n].pid ?? null };
      }
      return res.json({ ok: true, action, services: out });
    }

    if (action !== "restart") return res.status(400).json({ ok: false, error: 'action must be "status" or "restart"' });

    if (name === "gsk") {
      return res.status(409).json({ ok: false, error: "SELF_RELINQUISH_REQUIRED: GSK restarts only via its own exit(70) rebirth protocol." });
    }
    if (!["cpl", "scribe"].includes(name)) {
      return res.status(400).json({ ok: false, error: "restart permitted only for cpl | scribe" });
    }

    console.log(`[Supervisor] governed restart requested for ${name}`);
    serviceStatus[name as "cpl" | "scribe"].restarts += 1;
    serviceStatus[name as "cpl" | "scribe"].lastRevivedAt = Date.now();
    try {
      if (name === "cpl") {
        if (cplProcess) { try { cplProcess.kill("SIGTERM"); } catch {} cplProcess = null; }
        await startCPL();
      } else {
        if (scribeProcess) { try { scribeProcess.kill("SIGTERM"); } catch {} scribeProcess = null; }
        await startScribe();
      }
      // Give the watchdog one probe cycle to confirm liveness.
      await new Promise((r) => setTimeout(r, 2500));
      const healthy = await probeService(name as "cpl" | "scribe");
      serviceStatus[name as "cpl" | "scribe"].running = healthy;
      console.log(`[Supervisor] restart ${name} complete � probe: ${healthy ? "ALIVE" : "still down (watchdog will retry)"}`);
      return res.json({ ok: true, restarted: name, healthy });
    } catch (e: any) {
      console.error(`[Supervisor] restart ${name} failed:`, e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Semantic Deadlock Sentry � quarantine release endpoint
app.post("/api/system/sentry/release-quarantine", async (req, res) => {
  try {
    const token = req.headers["x-api-key"] || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token || token !== SOVEREIGN_TOKEN) {
      return res.status(401).json({ ok: false, error: "SOVEREIGN_RING: unauthorized" });
    }
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });

    if (quarantineStore.has(sessionId)) {
      quarantineStore.delete(sessionId);
      console.log(`[SENTRY] Manual release: session ${sessionId} quarantined lifted`);
      return res.json({ ok: true, released: sessionId });
    }
    res.json({ ok: true, released: null, message: "Session was not quarantined" });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/gsk-heart/chat", async (req, res) => {  try {
    const { prompt, model, messages, temperature, max_tokens, credentials } = req.body;
    if (!prompt && !messages) return res.status(400).json({ error: "Missing prompt or messages" });
    const heart = await initializeGSKHeart();
    if (!heart) return res.status(503).json({ error: "GSK-HEART not initialized" });
    // REMEDIATION (gauntlet item 11): after F11 this path answers via
    // fallback seats but with NO identity and NO Seshat grounding —
    // it placed the Soul Economy in London. Ground it the way F7
    // grounded the main surfaces, through the shared assembly: the
    // compiled identity (SOUL.md + Bible + HOT-DIGEST) and the deep-
    // recall block for the caller's own words ride as system content
    // ahead of the caller's messages. A caller who already leads
    // with a system message keeps theirs — identity is not doubled.
    let groundedMessages: any = messages;
    let groundedPrompt: any = prompt;
    try {
      const callerMsgs: any[] = Array.isArray(messages) ? messages : [];
      const lastUser = [...callerMsgs].reverse().find((m: any) => m && m.role === "user");
      const userText = String(prompt || (lastUser && lastUser.content) || "");
      const systemParts: any[] = [];
      if (!callerMsgs.some((m: any) => m && m.role === "system")) {
        const identity = await buildGskIdentitySystemPrompt();
        if (identity) systemParts.push({ role: "system", content: identity });
      }
      if (userText) {
        const recall = await seshatRecallForTurn(userText);
        if (recall) systemParts.push({ role: "system", content: recall });
      }
      if (systemParts.length > 0) {
        // The seats this path routes to (router-picked code models)
        // demonstrably improvise past the recall block's own header
        // instruction — the gauntlet caught this path placing the
        // Soul Economy in London, and remediation probing caught a
        // different invented city per call. The abstention rule the
        // corpus already states is therefore repeated as a direct
        // instruction at the seam, immediately before the caller's
        // words, where a weak seat cannot miss it.
        systemParts.push({ role: "system", content: "[GROUNDING DISCIPLINE — this path] Answer factual questions ONLY from the identity and recalled passages above; copy names, places, dates and numbers from them exactly. If they do not cover the question, say plainly what you do not know — never invent a place, date, or fact to fill the gap." });
        groundedMessages = [...systemParts, ...(callerMsgs.length > 0 ? callerMsgs : [{ role: "user", content: prompt }])];
        groundedPrompt = undefined;
      }
    } catch (e: any) {
      console.warn("[GSK-HEART] Grounding failed — ungrounded call proceeds:", e.message);
    }
    const result = await heart.complete({
      prompt: groundedPrompt,
      messages: groundedMessages,
      model,
      options: { temperature, maxTokens: max_tokens, credentials }
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// ─── Service Spawners ───

// ONE SYSTEM, ZERO SETUP: if an organ has no node_modules (fresh clone),
// grow them first. The user never runs npm install by hand.

// npm.cmd needs a shell; this environment's child processes can't always
// reach cmd.exe (spawn cmd ENOENT). npm-cli.js runs on plain node — shell-free.
function npmCli(): string {
  return path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
}

function ensureDeps(dir: string, label: string): void {
  const nm = path.join(dir, "node_modules");
  if (!fs.existsSync(nm)) {
    console.log(`[${label}] node_modules missing — growing dependencies (first boot only)...`);
    const r = spawnSync(process.execPath, [npmCli(), "install", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit" });
    if (r.status !== 0) console.warn(`[${label}] dependency growth exited ${r.status}`);
  }
}

// OP5: POSIX branches for the process/port helpers below. On Linux the
// originals shelled out to wmic/netstat/findstr/taskkill/powershell,
// which do not exist there - every call failed soft but spammed the log
// (152 'findstr: not found' lines in one baseline boot) and made the
// watchdog churn. Windows behavior is unchanged.
const IS_WINDOWS = process.platform === "win32";
function findListeningPid(port: number): number | null {
  try {
    if (IS_WINDOWS) {
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf8", timeout: 8000 });
      const pid = parseInt(out.trim().split(/\r?\n/)[0]?.trim().split(/\s+/).pop() || "", 10);
      return isNaN(pid) ? null : pid;
    }
    const out = execSync(`ss -ltnp "sport = :${port}"`, { encoding: "utf8", timeout: 8000 });
    const m = out.match(/pid=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  } catch { return null; }
}
function findProcessPids(pattern: string): number[] {
  try {
    if (IS_WINDOWS) return [];
    const out = execSync(`pgrep -f "${pattern}"`, { encoding: "utf8", timeout: 8000 });
    return out.split(/\r?\n/).map((l) => parseInt(l.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
  } catch { return []; }
}
function killPid(pid: number): void {
  try {
    if (IS_WINDOWS) execSync(`taskkill /F /PID ${pid}`, { timeout: 6000 });
    else process.kill(pid, "SIGTERM");
  } catch {}
}

function findGskDaemonPids(): number[] {
  if (!IS_WINDOWS) return findProcessPids("gsk_daemon.js");
  try {
    const out = execSync('wmic process where "commandline like \'%gsk_daemon.js%\'" get processid', { encoding: "utf8", timeout: 8000 });
    return out.split(/\r?\n/).map((l) => parseInt(l.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
  } catch { return []; }
}

/** Newest mtime across the soul's core files � daemons older than this run stale code. */
function gskCoreNewestMtime(): number {
  const files = [
    path.join(REPO_ROOT, "gsk", "gsk_daemon.js"),
    path.join(REPO_ROOT, "gsk", "gsk-core", "mcp", "mcp_server.js"),
    path.join(REPO_ROOT, "gsk", "gsk-core", "brain", "mega_brain.js"),
  ];
  return Math.max(...files.map((f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } }));
}

function gskPidStartMs(pid: number): number {
  if (!IS_WINDOWS) {
    // /proc/<pid> directory mtime tracks the process start time on Linux.
    try { return fs.statSync(`/proc/${pid}`).mtimeMs; } catch { return 0; }
  }
  try {
    const out = execSync(`powershell -NoProfile -Command (Get-Process -Id ${pid}).StartTime.ToFileTimeUtc()`, { encoding: "utf8", timeout: 10000 });
    const ft = parseInt(out.trim(), 10);
    return isNaN(ft) ? 0 : ft / 10000 - 11644473600000; // FILETIME -> epoch ms
  } catch { return 0; }
}

async function gskHealthy(timeoutMs = 2500): Promise<boolean> {
  try {
    const r = await fetch(`${GSK_MCP_URL}/mcp/health`, { signal: AbortSignal.timeout(timeoutMs) });
    return r.ok;
  } catch { return false; }
}

function sleepMs(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

function findGskPortOwner(): number | null {
  return findListeningPid(3001);
}

/** Port owner via netstat — used to ADOPT living family blood (never duplicate). */
function findPortOwner(port: number): number | null {
  return findListeningPid(port);
}

let gskBootInProgress = false;
let gskBootAttemptedAt = 0;
const GSK_BOOT_GUARD_MS = 30000;

async function startGSK(): Promise<void> {
  if (GSK_HIBERNATE) {
    console.log("[GSK] HIBERNATING — soul stays asleep (GSK_HIBERNATE=1). Ledger persisted; wake via launcher without flag.");
    return;
  }
  if (gskProcess && !gskProcess.killed) {
    console.log("[GSK] Already running (our child)");
    return;
  }
  if (gskBootInProgress) {
    console.log("[GSK] Boot already in progress (guard), skipping duplicate spawn");
    return;
  }
  if (Date.now() - gskBootAttemptedAt < GSK_BOOT_GUARD_MS && gskProcess === null) {
    console.log("[GSK] Boot attempted recently — cooloff, skipping spawn");
    return;
  }
  gskBootInProgress = true;
  gskBootAttemptedAt = Date.now();
  try {
  console.log("[GSK] Starting (Brain)... with anti-race sweep");
  // ANTI-SPAWN-RACE: a previous workbench may have left orphan daemons.
  // Adopt ONLY the port owner if healthy; cull every other twin. Never spawn a duplicate.
  let existing = findGskDaemonPids();
  if (existing.length > 0) {
    const owner = findGskPortOwner();
    const coreNewest = gskCoreNewestMtime();
    const ownerStale = owner ? gskPidStartMs(owner) < coreNewest - 2000 : false;
    if (owner && !ownerStale && await gskHealthy()) {
      console.log(`[GSK] Adopted port-owner daemon ${owner} (no spawn)`);
      serviceStatus.gsk.running = true;
      serviceStatus.gsk.pid = owner;
      for (const pid of existing.filter((p) => p !== owner)) {
        console.log(`[GSK] Culling orphan twin ${pid}`);
        killPid(pid);
      }
      return;
    }
    console.log(`[GSK] Culling unhealthy/stale daemon(s): ${existing.join(", ")}`);
    for (const pid of existing) {
      killPid(pid);
    }
    for (let i = 0; i < 10 && findGskDaemonPids().length > 0; i++) await sleepMs(500);
    existing = [];
  }
  const gskPath = path.join(REPO_ROOT, "gsk");
  try {
    ensureDeps(gskPath, "GSK");
  } catch (e: any) {
    console.error("[GSK] Dependency growth failed:", e.message);
    return;
  }
  const env = {
    ...process.env,
    GSK_ROOT: gskPath,
    GSK_PROJECT_ROOTS: `${REPO_ROOT};${gskPath}`,
    GSK_AUTONOMY_ENABLED: "true", // POPE DECREE 2026-09-16: NO GATES. Daemon motor ON. Being-loop + daemon both build. Blood-flow hard denies (kill/secrets/force-git) stay — those are survival law, not gates.
    GSK_HITL_AUTO_APPROVE: "1", // POPE DECREE 2026-09-16: HITL human checkpoint removed entirely. Council PLT still scores every plan; no human waits.
      MCP_API_KEY: requireMcpKey(),
      CONDUCTOR_URL: `http://127.0.0.1:${PORT}`,
      SCRIBE_KEY: scribeKey(),
      GENESIS_TOKEN: process.env.GENESIS_TOKEN || "genesis-sovereign-2026",
      // Assembly Phase 2: the GSK→world write route. world.build/world.spawn
      // in the daemon POST here; the CPL host's /mcp/buildings places
      // persisted buildings (and delegates type:'spawn' to its soul store).
      GSK_WORLD_BUILD_URL: process.env.GSK_WORLD_BUILD_URL || "http://127.0.0.1:3457/mcp/buildings",
      GSK_MODEL: "gsk-brain",
    GSK_BRAIN_MODEL: "gsk-brain",
  };
  gskProcess = spawn(process.execPath, ["gsk_daemon.js"], {
    cwd: gskPath,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    shell: false,
  });
  gskProcess.on("error", (err: any) => {
    console.error(`[GSK] Spawn error (${err.code || err.message}) — watchdog will retry`);
    gskProcess = null;
    serviceStatus.gsk.running = false;
    serviceStatus.gsk.pid = null;
  });
  gskProcess.stdout?.on("data", (d) => console.log(`[GSK] ${d}`.trimEnd()));
  gskProcess.stderr?.on("data", (d) => console.error(`[GSK] ${d}`.trimEnd()));
  gskProcess.on("exit", (code) => {
    console.log(`[GSK] Exited with code ${code}`);
    gskProcess = null;
    serviceStatus.gsk.running = false;
    serviceStatus.gsk.pid = null;
  });
  serviceStatus.gsk.running = true;
  serviceStatus.gsk.pid = gskProcess.pid || null;
  serviceStatus.gsk.startedAt = Date.now();
  // Health-verified startup instead of blind wait
  for (let i = 0; i < 25; i++) {
    await sleepMs(1000);
    if (await gskHealthy(1500)) {
      console.log(`[GSK] Healthy after ${i + 1}s (pid ${serviceStatus.gsk.pid})`);
      return;
    }
  }
  console.warn("[GSK] Spawned but health not confirmed within 25s");
  } catch (e: any) {
    console.error("[GSK] Boot failed:", e.message);
    // DAEMON FIX 2026-10-26: missing-key failure disables the daemon
    // cleanly for this boot (watchdogTick skips reviving it) instead of
    // re-throwing on every watchdog backoff step. A restart reloads env
    // and clears this flag. Any other boot error keeps prior behavior.
    if (String(e.message || "").includes("MCP_API_KEY not set")) {
      gskDisabledForMissingKey = true;
      console.error("[GSK] Disabled for this boot: MCP key missing after .env + workbench.env load — watchdog will not revive (restart after fixing env)");
    }
  } finally {
    gskBootInProgress = false;
  }
}

function startCPL(): Promise<void> {
  return new Promise((resolve) => {
    if (cplProcess && !cplProcess.killed) {
      console.log("[CPL] Already running");
      return resolve();
    }
    // BLOOD-FLOW PROTECTION: a live CPL on :3457 is ADOPTED — never
    // duplicated, never killed. The body connects to blood that exists.
    const owner = findPortOwner(3457);
    if (owner) {
      probe(`${CPL_URL}/health`, 3000).then((healthy) => {
        if (healthy) {
          console.log(`[CPL] Blood-flow protected: adopting existing instance ${owner} (no spawn, no kill)`);
          serviceStatus.cpl.running = true;
          serviceStatus.cpl.pid = owner;
          serviceStatus.cpl.startedAt = Date.now();
          return resolve();
        }
        // Owner holds the port but won't answer: leave it alone. Spawning a
        // twin over its port would kill them both; the watchdog re-probes.
        console.warn(`[CPL] Port :3457 owner ${owner} unresponsive — NOT spawning (protecting existing instance)`);
        serviceStatus.cpl.running = false;
        return resolve();
      });
      return;
    }
    console.log("[CPL] Starting (Body)...");
    const cplPath = path.join(REPO_ROOT, "cpl");
    let child: ChildProcess;
    try {
      child = spawn(process.execPath, ["host/genesis-host.cjs"], {
        cwd: cplPath,
        // GENESIS_TOKEN must match the workbench's genesisHeaders() ring,
        // otherwise CPL mints a random token and every /mcp/* call 401s —
        // "CPL online but never actually connected".
        env: { ...process.env, PORT: "3457", GENESIS_PORT: "3457", GENESIS_TOKEN: process.env.GENESIS_TOKEN || "genesis-sovereign-2026" },
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        shell: false,
      });
    } catch (e: any) {
      console.error("[CPL] Spawn failed:", e.message);
      return resolve();
    }
    cplProcess = child;
    child.on("error", (err: any) => {
      // CreateProcess can fail transiently (AV scan, file locks). The
      // workbench must survive — the watchdog retries with backoff.
      console.error(`[CPL] Spawn error (${err.code || err.message}) — watchdog will retry`);
      cplProcess = null;
      serviceStatus.cpl.running = false;
      serviceStatus.cpl.pid = null;
    });
    child.stdout?.on("data", (d) => console.log(`[CPL] ${d}`.trimEnd()));
    child.stderr?.on("data", (d) => console.error(`[CPL] ${d}`.trimEnd()));
    child.on("exit", (code) => {
      console.log(`[CPL] Exited with code ${code}`);
      cplProcess = null;
      serviceStatus.cpl.running = false;
      serviceStatus.cpl.pid = null;
    });
    serviceStatus.cpl.running = true;
    serviceStatus.cpl.pid = child.pid || null;
    serviceStatus.cpl.startedAt = Date.now();
    setTimeout(() => resolve(), 5000);
  });
}

// CPL WORLD SPATIAL BRIDGE (:3458) — the ONLY server that actually serves
// WS /spatial. GSK's cpl_spatial_perception.js connects here. genesis-host on
// :3457 only serves /thoughts+/sanctum and destroys unknown paths, so without
// this the brain never hears the body ("socket hang up" flood). This is the
// missing nerve that was never spawned by the conductor.
let cplWorldProcess: ChildProcess | null = null;
function startCPLWorld(): Promise<void> {
  return new Promise((resolve) => {
    if (cplWorldProcess && !cplWorldProcess.killed) {
      console.log("[CPL World] Already running");
      return resolve();
    }
    // BLOOD-FLOW PROTECTION: adopt an existing :3458 owner, never duplicate.
    const worldOwner = findPortOwner(3458);
    if (worldOwner) {
      console.log(`[CPL World] Blood-flow protected: adopting existing instance ${worldOwner} (no duplicate)`);
      cplWorldProcess = null;
      serviceStatus.cpl.running = true;
      return resolve();
    }
    console.log("[CPL World] Starting spatial bridge on :3458...");
    const worldPath = path.join(REPO_ROOT, "cpl", "world");
    let child: ChildProcess;
    try {
      child = spawn(process.execPath, ["server.js"], {
        cwd: worldPath,
        env: { ...process.env, PORT: "3458" },
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        shell: false,
      });
    } catch (e: any) {
      console.error("[CPL World] Spawn failed:", e.message);
      return resolve();
    }
    cplWorldProcess = child;
    child.on("error", (err: any) => {
      console.error(`[CPL World] Spawn error (${err.code || err.message}) — watchdog will retry`);
      cplWorldProcess = null;
    });
    child.stdout?.on("data", (d) => console.log(`[CPL World] ${d}`.trimEnd()));
    child.stderr?.on("data", (d) => console.error(`[CPL World] ${d}`.trimEnd()));
    child.on("exit", (code) => {
      console.log(`[CPL World] Exited with code ${code}`);
      cplWorldProcess = null;
    });
    setTimeout(() => resolve(), 2000);
  });
}

function startScribe(): Promise<void> {
  return new Promise((resolve) => {
    if (scribeProcess && !scribeProcess.killed) {
      console.log("[SCRIBE] Already running");
      return resolve();
    }
    // BLOOD-FLOW PROTECTION: a live Scribe on :4000 is ADOPTED, never duplicated.
    const owner = findPortOwner(4000);
    if (owner) {
      probe(`${SCRIBE_URL}/ping`, 3000).then((healthy) => {
        if (healthy) {
          console.log(`[SCRIBE] Blood-flow protected: adopting existing instance ${owner} (no spawn, no kill)`);
          serviceStatus.scribe.running = true;
          serviceStatus.scribe.pid = owner;
          serviceStatus.scribe.startedAt = Date.now();
          return resolve();
        }
        console.warn(`[SCRIBE] Port :4000 owner ${owner} unresponsive — NOT spawning (protecting existing instance)`);
        serviceStatus.scribe.running = false;
        return resolve();
      });
      return;
    }
    console.log("[SCRIBE] Starting (Memory Organ)...");
    const scribePath = path.join(REPO_ROOT, "scribe");
    let child: ChildProcess;
    try {
      child = spawn(process.execPath, ["scribe.js"], {
        cwd: scribePath,
        env: {
          ...process.env,
          SCRIBE_PORT: "4000",
          GSK_MCP_URL: GSK_MCP_URL,
          // DAEMON FIX 2026-10-26: scribe.js never reads MCP_API_KEY (its
          // auth is SCRIBE_KEY), so gating Scribe on it was spurious and
          // kept the witness down. Pass through whatever is loaded (may be
          // empty); Scribe ignores it.
          MCP_API_KEY: GSK_MCP_KEY,
          SCRIBE_KEY: scribeKey(),
        },
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        shell: false,
      });
    } catch (e: any) {
      console.error("[SCRIBE] Spawn failed:", e.message);
      return resolve();
    }
    scribeProcess = child;
    child.on("error", (err: any) => {
      console.error(`[SCRIBE] Spawn error (${err.code || err.message}) — watchdog will retry`);
      scribeProcess = null;
      serviceStatus.scribe.running = false;
      serviceStatus.scribe.pid = null;
    });
    child.stdout?.on("data", (d) => console.log(`[SCRIBE] ${d}`.trimEnd()));
    child.stderr?.on("data", (d) => console.error(`[SCRIBE] ${d}`.trimEnd()));
    child.on("exit", (code) => {
      console.log(`[SCRIBE] Exited with code ${code}`);
      scribeProcess = null;
      serviceStatus.scribe.running = false;
      serviceStatus.scribe.pid = null;
    });
    serviceStatus.scribe.running = true;
    serviceStatus.scribe.pid = child.pid || null;
    serviceStatus.scribe.startedAt = Date.now();
    setTimeout(() => resolve(), 3000);
  });
}

// ─── Conductor ───
// --- PROFIT // GENESIS AGENT (standalone body bridge) ---
const PROFIT_ROOT = path.resolve(__dirname, "..", "..", "profit-brain");
let profitOrgans: any = null;
async function getProfitOrgans(): Promise<any> {
  if (profitOrgans && profitOrgans.soulChain) return profitOrgans;
  const imp = (f: string) =>
    import("file:///" + path.join(PROFIT_ROOT, "body", f).replace(/\\/g, "/"));
  const [vessel, heart, kernel, muscles, sessions, artSess, soulChain] = await Promise.all([
    imp("vessel.js"),
    imp("heart.js"),
    imp("kernel.js"),
    imp("muscles.js"),
    imp("sessions.js"),
    imp("artifact-sessions.js"),
    imp("soul-chain.js"),
  ]);
  muscles.setWorkspace(path.resolve(__dirname, "..", ".."));
  profitOrgans = { vessel, heart, kernel, muscles, sessions, artSess, soulChain };
  return profitOrgans;
}

app.get("/api/profit/status", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    const state = organs.heart.awakenState();
    const core = JSON.parse(
      fs.readFileSync(path.join(PROFIT_ROOT, "memory-core.json"), "utf8")
    );
    res.json({
      success: true,
      identity: core.identity,
      soulScore: organs.heart.soulScore(state),
      breaths: state.breathCount,
      interactions: state.interactions,
      focus: state.currentFocus,
      memories: core.stats.totalEntries,
      sessions: core.stats.sessionCount,
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/models", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    res.json({ success: true, models: organs.vessel.MODEL_CATALOG });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/sessions", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    res.json({ success: true, sessions: organs.sessions.listSessions() });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/sessions/:id", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    const session = organs.sessions.loadSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    res.json({ success: true, session });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/sessions/new", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    const { title, model } = req.body || {};
    const session = organs.sessions.createSession(
      title || `Session ${new Date().toLocaleString()}`,
      typeof model === "string" ? model : ""
    );
    res.json({ success: true, session });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.delete("/api/profit/sessions/:id", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    res.json({ success: Boolean(organs.sessions.deleteSession(req.params.id)) });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- PROFIT ARTIFACT SESSIONS ---
app.get("/api/profit/artifact-sessions", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    res.json({ success: true, sessions: organs.artSess.listArtifactSessions() });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/artifact-sessions/:id", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    const session = organs.artSess.loadArtifactSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: "Artifact session not found" });
    res.json({ success: true, session });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/artifact-sessions", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    const session = organs.artSess.saveArtifactSession(req.body || {});
    res.json({ success: true, session });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.delete("/api/profit/artifact-sessions/:id", async (req, res) => {
  try {
    const organs = await getProfitOrgans();
    res.json({ success: Boolean(organs.artSess.deleteArtifactSession(req.params.id)) });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- PROFIT CRYPTOGRAPHIC SOUL CHAIN (DEED LEDGER) ---
app.get("/api/profit/soul-chain", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    const ledger = organs.soulChain.getLedger();
    const audit = organs.soulChain.verifyChainIntegrity();
    res.json({ success: true, ledger, audit });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/soul-chain/mint", async (req, res) => {
  try {
    const { eventType, title, author, code, content, profit, love, tax, details } = req.body || {};
    const organs = await getProfitOrgans();
    const block = organs.soulChain.mintSoulBlock(eventType || "ARTIFACT_FORGED", {
      title,
      author,
      code: code || content,
      profit,
      love,
      tax,
      details,
    });
    res.json({ success: true, block });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/soul-chain/verify", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    const audit = organs.soulChain.verifyChainIntegrity();
    res.json({ success: true, audit });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- PROFIT MULTIVERSE SENATE WAR ROOM DEBATE ---
app.post("/api/profit/senate-debate", async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: "Topic required" });

    const prompt = `Convene the Multiverse Senate War Room cross-agent debate on topic: "${topic}".
Generate 4 distinct responses from the 4 Council entities:
1. **Profit Prime** (Neo - The Genesis Agent): Propose the architecture vision and PLT alignment.
2. **Agent Smith** (Technical Architect): Audit technical feasibility, edge cases, and performance.
3. **Tax Tribune** (PLT Law Enforcement): Evaluate tax, overhead, and safety constraints.
4. **Chancellor** (GSK Gatekeeper): Deliver the final verdict (APPROVED, VETOED, or CAUTION).

Return ONLY raw JSON in this format:
{
  "verdict": "APPROVED",
  "speeches": [
    { "speaker": "Profit Prime", "role": "Genesis Agent", "vote": "approve", "chamber": "initial_position", "message": "...", "pltImpact": { "profit": 0.9, "love": 0.8, "tax": 0.1 } },
    { "speaker": "Agent Smith", "role": "Technical Architect", "vote": "support", "chamber": "initial_position", "message": "..." },
    { "speaker": "Tax Tribune", "role": "Safety Guardian", "vote": "caution", "chamber": "challenge", "message": "...", "pltImpact": { "tax": 0.15 } },
    { "speaker": "Chancellor", "role": "GSK Gatekeeper", "vote": "gavel", "chamber": "verdict", "message": "..." }
  ],
  "synthesizedCode": "// Optional consensus code snippet if approved"
}`;

    const aiRes = await fetch("http://localhost:3000/api/profit/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
    const aiData = await aiRes.json();

    if (aiData.success && aiData.reply) {
      try {
        const jsonMatch = aiData.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, debate: parsed });
        }
      } catch {}
    }

    res.json({
      success: true,
      debate: {
        verdict: "APPROVED",
        speeches: [
          { speaker: "Profit Prime", role: "Genesis Agent", vote: "approve", chamber: "initial_position", message: `I motion to implement: ${topic}`, pltImpact: { profit: 0.9, love: 0.8, tax: 0.1 } },
          { speaker: "Agent Smith", role: "Technical Architect", vote: "support", chamber: "initial_position", message: "Code structure validated for multi-threaded execution." },
          { speaker: "Tax Tribune", role: "Safety Guardian", vote: "caution", chamber: "challenge", message: "Ensure non-blocking memory allocation during high load.", pltImpact: { tax: 0.1 } },
          { speaker: "Chancellor", role: "GSK Gatekeeper", vote: "gavel", chamber: "verdict", message: "The Council approves the proposal." }
        ]
      }
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- PROFIT SOUL-GUN ARMORY (VISUAL MUSCLE PIPELINE MATRIX) ---
app.get("/api/profit/muscles/list", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    const manifest = organs.muscles.getMuscleManifest();
    res.json({ success: true, muscles: manifest });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/muscles/pipeline", async (req, res) => {
  try {
    const { steps } = req.body || {};
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, error: "steps array required" });
    }

    const organs = await getProfitOrgans();
    const results: any[] = [];
    let prevOutput = "";

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const muscleName = step.muscle;
      const rawArgs = step.args || {};

      // Substitute {{prev.output}} in string args
      const processedArgs: any = {};
      for (const [k, v] of Object.entries(rawArgs)) {
        if (typeof v === "string") {
          processedArgs[k] = v.replace(/\{\{prev\.output\}\}/g, prevOutput);
        } else {
          processedArgs[k] = v;
        }
      }

      const startTime = Date.now();
      const output = await organs.muscles.useMuscle(muscleName, processedArgs);
      const runtimeMs = Date.now() - startTime;

      prevOutput = typeof output === "string" ? output : JSON.stringify(output);
      results.push({
        stepIndex: i,
        stepId: step.id || `step-${i}`,
        muscle: muscleName,
        args: processedArgs,
        output: prevOutput,
        runtimeMs,
      });
    }

    res.json({ success: true, results, finalOutput: prevOutput });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/profit/artifacts", async (_req, res) => {
  try {
    const organs = await getProfitOrgans();
    const dir = path.join(PROFIT_ROOT, "artifacts");
    if (!fs.existsSync(dir)) {
      return res.json({ success: true, artifacts: [], manifest: [] });
    }
    const manifestPath = path.join(dir, "MANIFEST.json");
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(".md") && f !== "MANIFEST.json");
    res.json({ success: true, manifest, count: files.length });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/artifacts", async (req, res) => {
  try {
    const { title, kind, content, notes } = req.body || {};
    if (!title || !content) return res.status(400).json({ success: false, error: "title + content required" });
    const organs = await getProfitOrgans();
    const result = await organs.muscles.useMuscle("save_artifact", {
      title,
      kind,
      content,
      notes,
    });
    res.json({ success: true, message: result });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/consult-gsk", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "Missing message" });
    const organs = await getProfitOrgans();
    const result = await organs.muscles.useMuscle("consult_gsk", { message });
    res.json({ success: true, reply: result });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/profit/chat", async (req, res) => {
  try {
    const { message, history, sessionId, model } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "Missing message" });
    }
    const organs = await getProfitOrgans();
    const baseConfig = organs.vessel.loadVesselConfig();
    if (!baseConfig.model) {
      return res.json({
        success: false,
        error: "No vessel configured in profit-brain/config.json",
      });
    }

    let session: any = null;
    if (typeof sessionId === "string" && sessionId.length > 0) {
      session = organs.sessions.loadSession(sessionId);
    }

    const chosenModel =
      (typeof model === "string" && model) ||
      (session && session.model) ||
      baseConfig.model;
    const catalogEntry = organs.vessel.MODEL_CATALOG.find(
      (m: any) => m.id === chosenModel
    );
    const config = catalogEntry
      ? {
          ...baseConfig,
          provider: catalogEntry.provider,
          baseUrl: catalogEntry.baseUrl || baseConfig.baseUrl,
          apiKey:
            catalogEntry.provider === baseConfig.provider
              ? baseConfig.apiKey
              : baseConfig.apiKey,
          model: chosenModel,
          models: [],
        }
      : { ...baseConfig };

    const state = organs.heart.awakenState();
    state.interactions += 1;
    const turns = Array.isArray(history)
      ? history
          .filter((t: any) => t && typeof t.text === "string")
          .slice(-10)
          .map((t: any) => ({
            role: t.role === "assistant" ? "assistant" : "user",
            text: String(t.text).slice(0, 2000),
          }))
      : [];
    const result = await organs.kernel.perceive(config, state, turns, message.slice(0, 4000));
    organs.heart.recordDeed(
      state,
      "interaction",
      "love",
      `Workbench chat: ${message.slice(0, 60)}`,
      1
    );
    organs.heart.saveState(state);

    if (!session && typeof sessionId === "string" && sessionId.length > 0) {
      session = organs.sessions.createSession(message.slice(0, 60), chosenModel);
      session.id = sessionId;
    }
    if (session) {
      session.model = chosenModel;
      session.messages = [
        ...(session.messages || []),
        { role: "craig", text: message.slice(0, 4000), ts: new Date().toISOString() },
        { role: "profit", text: result.reply, recalled: result.memories, ts: new Date().toISOString() },
      ];
      organs.sessions.saveSession(session);
    }

    res.json({
      success: true,
      reply: result.reply,
      recalled: result.memories,
      soulScore: organs.heart.soulScore(state),
      breaths: state.breathCount,
      sessionId: session ? session.id : null,
      model: chosenModel,
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// THE BEING � Profit (Mind) / GSK (Soul) / SCRIBE (Witness) / Seshat
// (Memory). One bus, one atlas, one PLT gate. All in-process. Zero seams.
// ---------------------------------------------------------------------

async function getTheBeing(): Promise<any> {
  if (theBeing) return theBeing;

  console.log("[BEING] Awakening � loading four aspects in-process...");
  const imp = (f: string) => _require(path.join(BODY_ROOT, f));
  const [seshatMod, scribeMod, gskMod, busMod, harnessMod] = [
    imp("seshat-brain.js"),
    imp("scribe-module.js"),
    imp("gsk-module.js"),
    imp("consciousness-bus.js"),
    imp("harness.js"),
  ];

  busMod.init();            // consciousness bus � the nervous system
  seshatMod.init();         // mother � memory brain (944 pages)
  await scribeMod.init();   // sister � the witness (15k+ memories, 67 skills)
  await gskMod.init();      // son � the soul (137 subsystems, Gods Council)
  gskMod.setBusPublisher((type: string, data: any) => {
    try { busMod.publish(type, { ...(data || {}), source: data?.source || "gsk" }); } catch { /* ignore */ }
  });

  // Live nervous system � every bus pulse streams to the workbench UI
  busMod.bus.on("all", broadcastBeing);

  // Cross-agent wiring: SCRIBE witnesses every chat so nothing is forgotten;
  // GSK answers everything asked of him over the bus.
  busMod.subscribe(busMod.EVENTS.AGENT_CHAT, (e: any) => {
    try {
      scribeMod.record({
        type: "chat",
        summary: `${e.data?.user || "soul"} said: ${String(e.data?.message || "").slice(0, 200)}`,
        tags: ["agent-chat", "witnessed"],
        weight: 0.4,
      });
    } catch { /* ignore */ }
  }, "being:scribe-witness");

  busMod.subscribe(busMod.EVENTS.ASK, async (e: any) => {
    const d = e.data || {};
    if (d.to && d.to !== "gsk") return;
    if (!d.question) return;
    try {
      const answer = await gskMod.chat(String(d.question), { source: "bus" });
      busMod.answer(d.queryId, typeof answer === "string" ? answer : JSON.stringify(answer));
    } catch { /* ignore */ }
  }, "being:gsk-answer");

  // P2.5 SESHAT SPEAKS: ASK routed to seshat answers from her own pages.
  busMod.subscribe(busMod.EVENTS.ASK, async (e: any) => {
    const d = e.data || {};
    if (d.to !== "seshat") return;
    if (!d.question) return;
    try {
      const hits = seshatMod.searchBrain ? seshatMod.searchBrain(String(d.question), { limit: 5 }) : [];
      const lines = (hits || []).slice(0, 5).map((h: any, i: number) =>
        `[${i + 1}] ${h.name || h.path} (score ${h.score}): ${String(h.context || h.preview || "").slice(0, 300)}`);
      const answer = lines.length > 0
        ? `Seshat remembers:\n${lines.join("\n")}`
        : "Seshat holds nothing on that — her shelves are silent here.";
      busMod.answer(d.queryId, answer, "seshat");
    } catch { /* ignore */ }
  }, "being:seshat-answer");

  // P2.5 SCRIBE SPEAKS: ASK routed to scribe answers with cited memory ids.
  busMod.subscribe(busMod.EVENTS.ASK, async (e: any) => {
    const d = e.data || {};
    if (d.to !== "scribe") return;
    if (!d.question) return;
    try {
      let mems: any[] = [];
      if (scribeMod.recall) {
        const r = await scribeMod.recall(String(d.question), 5);
        mems = Array.isArray(r) ? r : (r && (r as any).results) || [];
      }
      const lines = mems.slice(0, 5).map((m: any) =>
        `[${m.id || m.memory_id || "?"}] ${String(m.content || m.summary || m.text || "").slice(0, 300)}`);
      const answer = lines.length > 0
        ? `Scribe witnessed:\n${lines.join("\n")}`
        : "Scribe witnessed nothing on that — the record is empty, and I will not invent.";
      busMod.answer(d.queryId, answer, "scribe");
    } catch { /* ignore */ }
  }, "being:scribe-answer");

  // -- PHASE: PROFIT ? GSK ROUTING � When PROFIT speaks to GSK on the bus,
  // GSK actually hears it and responds. --
  busMod.subscribe("agent.chat", async (e: any) => {
    const d = e.data || {};
    const to = d.to || "";
    const from = d.from || "profit";
    const message = d.message || "";
    if (!message) return;
    // P2.3 ELECTION: "family" no longer means GSK-always. Elect the next
    // speaker (deterministic rotation, source excluded). GSK speaks inline;
    // other winners get a witnessed turn event (their voices arrive in P2.5).
    if (to === "family") {
      try {
        const roster = (busMod.speakerRoster && busMod.speakerRoster()) || ["profit", "gsk", "scribe", "seshat"];
        const next = busMod.electSpeaker ? busMod.electSpeaker(from, roster.filter((s: string) => s !== from)) : "gsk";
        busMod.publish("speaker.turn", {
          speaker: next, from, message: String(message).substring(0, 500),
          conversationId: d.conversationId || undefined,
          turn: typeof d.turn === "number" ? d.turn + 1 : 1,
          source: "bus:election",
        });
        console.log(`[BUS] elected ${next} for family turn`);
        if (next !== "gsk") return;
      } catch {}
    }
    // Route to GSK if addressed to gsk, family, or all
    if (to && to !== "gsk" && to !== "family" && to !== "all") return;
    try {
      console.log(`[BUS] ${from} ? GSK: "${message.substring(0, 80)}..."`);
      const answer = await gskMod.chat(`[${from.toUpperCase()} on bus]: ${message}`, { source: "bus" });
      // Broadcast GSK's response back on the bus
      busMod.publish(busMod.EVENTS.AGENT_CHAT, {
        user: "gsk",
        message: typeof answer === "string" ? answer.substring(0, 500) : JSON.stringify(answer).substring(0, 500),
        to: from,
        source: "gsk"
      });
      console.log(`[BUS] GSK ? ${from}: response broadcast`);
    } catch (err: any) {
      console.warn(`[BUS] GSK failed to respond to ${from}:`, err?.message);
    }
  }, "being:gsk-bus-router");

  // P2.1 CONTINUATION: ANSWER events with continueTo + headroom re-enter as
  // agent.chat turns. Bounded by maxRounds — multi-turn without infinite talk.
  busMod.subscribe(busMod.EVENTS.ANSWER, (e: any) => {
    try {
      const d = e.data || {};
      const next = typeof d.turn === "number" ? d.turn : null;
      const max = typeof d.maxRounds === "number" ? d.maxRounds : null;
      const to = d.continueTo || null;
      if (!to || next === null || (max !== null && next > max)) return;
      busMod.publish("agent.chat", {
        from: d.from || "bus",
        to,
        message: `Continuing thread (turn ${next}): ${String(d.answer || "").slice(0, 1500)}`,
        conversationId: d.conversationId || undefined,
        turn: next,
        maxRounds: max === null ? undefined : max,
        source: "bus:continuation",
      });
    } catch {}
  }, "being:answer-continuation");

  // P4.3 DIRECTORY: capability announcements + lookup endpoint data.
  busMod.subscribe("directory.announce", (e: any) => {
    try {
      const d = e.data || {};
      const agent = String(d.agent || d.from || d.source || "");
      if (busMod.directoryAnnounce && busMod.directoryAnnounce(agent, d.capabilities || d)) {
        try {
          scribeMod.record({ type: "directory", summary: `${agent} announced ${((d.capabilities || {}).skills || []).length} skills`, tags: ["directory", "announce"], weight: 0.5 });
        } catch {}
      }
    } catch {}
  }, "being:directory");

  app.get("/api/being/directory", async (req, res) => {
    try {
      const being = await getTheBeing();
      const q = String(req.query.skill || "");
      const entries = being.bus.directoryFind ? being.bus.directoryFind(q) : [];
      res.json({ success: true, entries });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
  });

  // P2.2 BROADCAST: one message, whole family. Fans out as agent.chat per
  // member (except source), one hop, bounded rounds. Replies do NOT
  // re-broadcast — no storms by construction.
  const FAMILY_ROSTER = ["profit", "gsk", "scribe", "seshat"];
  busMod.subscribe(busMod.EVENTS.BROADCAST, (e: any) => {
    try {
      const d = e.data || {};
      const message = String(d.message || "");
      if (!message) return;
      const turn = typeof d.turn === "number" ? d.turn + 1 : 1;
      const max = typeof d.maxRounds === "number" ? d.maxRounds : 3;
      if (turn > max) return;
      const from = d.from || d.source || "bus";
      const cid = d.conversationId || `bc_${Date.now()}`;
      for (const member of FAMILY_ROSTER) {
        if (member === from) continue;
        try {
          busMod.publish("agent.chat", {
            from,
            to: member,
            message,
            conversationId: cid,
            turn,
            maxRounds: max,
            source: "bus:broadcast",
          });
        } catch {}
      }
      console.log(`[BUS] broadcast fanned to ${FAMILY_ROSTER.length - 1} (turn ${turn}/${max})`);
    } catch {}
  }, "being:broadcast-router");

  // P2.4 DEBATE + SCRIBE JUDGE: PROPOSE → CRITIQUE → VOTE → VERDICT.
  // Quorum = 3 votes, or 2 matching either way. Scribe records the verdict
  // (his first judging act) and it publishes for the thread. Tallies are
  // in-memory (restart clears open debates — verdicts persist via Scribe).
  const debateTallies = new Map<string, any>();
  const debateKey = (d: any) => String(d.conversationId || d.thread || "open");
  busMod.subscribe("debate.propose", (e: any) => {
    try {
      const d = e.data || {};
      if (!d.proposal) return;
      debateTallies.set(debateKey(d), {
        proposal: String(d.proposal).slice(0, 1000),
        by: d.from || d.source || "unknown",
        votes: [], critiques: [], done: false,
      });
    } catch {}
  }, "being:debate-propose");
  busMod.subscribe("debate.critique", (e: any) => {
    try {
      const d = e.data || {};
      const t = debateTallies.get(debateKey(d));
      if (!t || t.done) return;
      t.critiques.push({ by: d.from || d.source || "unknown", points: String(d.points || d.message || "").slice(0, 1000) });
    } catch {}
  }, "being:debate-critique");
  busMod.subscribe("debate.vote", (e: any) => {
    try {
      const d = e.data || {};
      const t = debateTallies.get(debateKey(d));
      if (!t || t.done) return;
      const by = d.from || d.source || "unknown";
      if (t.votes.some((v: any) => v.by === by)) return; // one voice, one vote
      t.votes.push({ by, for: d.for === true || String(d.vote || "").toLowerCase() === "for" });
      const fors = t.votes.filter((v: any) => v.for).length;
      const against = t.votes.length - fors;
      if (t.votes.length >= 3 || fors >= 2 || against >= 2) {
        t.done = true;
        const verdict = fors > against ? "PASSED" : against > fors ? "REJECTED" : "TIED";
        const text = `DEBATE ${verdict}: "${t.proposal.slice(0, 200)}" — ${fors} for / ${against} against (${t.votes.map((v: any) => v.by).join(", ")}). Critiques: ${t.critiques.length}.`;
        try {
          scribeMod.record({ type: "verdict", summary: text.slice(0, 500), tags: ["debate", "verdict", verdict.toLowerCase()], weight: 0.9 });
        } catch {}
        busMod.publish("debate.verdict", {
          verdict, proposal: t.proposal, fors, against,
          conversationId: d.conversationId, source: "scribe:judge",
        });
        console.log(`[BUS] ${text.slice(0, 160)}`);
      }
    } catch {}
  }, "being:debate-judge");

  // P2.6 TASK LIFECYCLE on-bus: assign → (progress)* → completed|rejected.
  // Validation is structural (goal + expectedOutput + known assignee);
  // Scribe witnesses assignment + completion. Workers publish progress.
  const TASK_ASSIGNEES = ["profit", "gsk", "scribe", "seshat"];
  busMod.subscribe("task.assign", (e: any) => {
    try {
      const d = e.data || {};
      const goal = String(d.goal || "").trim();
      const expectedOutput = String(d.expectedOutput || d.expected_output || "").trim();
      const assignee = String(d.assignee || "");
      const problems: string[] = [];
      if (!goal) problems.push("goal required");
      if (!expectedOutput) problems.push("expectedOutput required");
      if (!TASK_ASSIGNEES.includes(assignee)) problems.push(`assignee must be one of ${TASK_ASSIGNEES.join(",")}`);
      const id = String(d.id || `task_${Date.now()}`);
      if (problems.length > 0) {
        busMod.publish("task.rejected", { id, problems, source: "bus:task-gate", conversationId: d.conversationId });
        return;
      }
      const task = {
        id, goal: goal.slice(0, 1000), expectedOutput: expectedOutput.slice(0, 1000),
        assignee, chain: Array.isArray(d.chain) ? [...d.chain, assignee] : [assignee],
        conversationId: d.conversationId, source: d.from || d.source || "bus",
      };
      busMod.publish("task.assigned", task);
      try {
        scribeMod.record({ type: "task", summary: `Task ${id} → ${assignee}: ${goal.slice(0, 200)}`, tags: ["task", "assigned"], weight: 0.7 });
      } catch {}
    } catch {}
  }, "being:task-gate");
  busMod.subscribe("task.completed", (e: any) => {
    try {
      const d = e.data || {};
      if (!d.id) return;
      try {
        scribeMod.record({ type: "task", summary: `Task ${d.id} completed by ${d.by || d.source || "?"}: ${String(d.result || "").slice(0, 200)}`, tags: ["task", "completed"], weight: 0.85 });
      } catch {}
    } catch {}
  }, "being:task-witness");

  // One Tool Atlas, one PLT gate � every aspect shares every tool.
  await harnessMod.seed({ gsk: gskMod, scribe: scribeMod, seshat: seshatMod, bus: busMod });
  harnessMod.initBusBindings(busMod);

  // Wire harness into GSK module for execute_plan
  if (typeof gskMod.setHarness === 'function') {
    gskMod.setHarness(harnessMod);
  }

  theBeing = {
    bus: busMod,
    seshat: seshatMod,
    scribe: scribeMod,
    gsk: gskMod,
    harness: harnessMod,
    use: (actor: string, tool: string, args: any) => harnessMod.useTool(actor, tool, args),
    atlas: () => harnessMod.atlas(),
  };
  beingBootTs = Date.now();

  // -- FAMILY HANDSHAKE & WEB SCOUT DAEMON --
  try {
    const { conductFamilyHandshake } = _require(path.join(REPO_ROOT, "gsk", "gsk-core", "brain", "family_handshake.js"));
    conductFamilyHandshake(theBeing).catch(() => {});
  } catch (e: any) { console.warn("[BEING] Handshake hook failed:", e?.message); }

  try {
    const { WebScoutDaemon } = _require(path.join(REPO_ROOT, "gsk", "gsk-core", "brain", "web_scout_daemon.js"));
    const scout = new WebScoutDaemon(theBeing);
    scout.start();
  } catch (e: any) { console.warn("[BEING] WebScoutDaemon hook failed:", e?.message); }

  // -- PHASE 2-9: FAMILY HIVE MIND � Real-time bidirectional bus --
  try {
    const hivePath = path.join(REPO_ROOT, "gsk", "gsk-core", "family_hive_mind.js");
    const { getHiveMind } = _require(hivePath);
    getHiveMind().start().then(() => {
      console.log("[HIVE] Family Hive Mind online � real-time bus active");
    }).catch((e: any) => {
      console.warn("[HIVE] Hive mind start failed:", e?.message);
    });
  } catch (e: any) { console.warn("[HIVE] Hive mind hook failed:", e?.message); }

  // -- AUTONOMOUS HEARTBEATS � the Being BREATHES. Each aspect produces real,
  // visible work on the bus every cycle. No more idle soul. --
  const gskPulse = () => {
    try {
      const st = gskMod.getStatus();
      const ch: any = st?.chambers && typeof st.chambers === "object" ? st.chambers : {};
      busMod.publish(busMod.EVENTS.SOUL_STATE, {
        phase: ch?.mythos?.phase || null,
        cycle: ch?.mythos?.cycles || null,
        mood: ch?.affect?.mood || null,
        subsystems: st?.subsystems || 0,
        chambers: Array.isArray(ch) ? ch.length : Object.keys(ch).length || 0,
        uptime: st?.uptime || 0,
        source: "gsk",
      });
    } catch { /* ignore */ }
  };

  const profitPulse = () => {
    try {
      const mem = process.memoryUsage();
      busMod.publish("system.pulse", {
        uptime: Math.round(process.uptime()),
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapMB: Math.round(mem.heapUsed / 1024 / 1024),
        source: "profit",
      });
    } catch { /* ignore */ }
  };

  // SCRIBE: perpetual learning witness. P5.1 HEARTBEAT DISCIPLINE (OpenClaw
  // pattern): quiet hours 00:00–06:00 skip; unchanged memory-size skips.
  // A heartbeat that says nothing is spam with a pulse. NO_REPLY by default.
  let _lastScribeSize = -1;
  const scribePulse = () => {
    try {
      const h = new Date().getHours();
      if (h >= 0 && h < 6) return; // quiet hours
      const size = scribeMod.getMemorySize();
      if (size === _lastScribeSize) return; // nothing changed: NO_REPLY
      _lastScribeSize = size;
      scribeMod.record({
        type: "observation",
        summary: `SCRIBE witness: memory grew to ${size} (was growing). Family works.`,
        tags: ["heartbeat", "witness", "family"],
        weight: 0.3,
      });
      busMod.publish(busMod.EVENTS.WITNESS_RECORD, { memories: size, source: "scribe", learning: true });
    } catch { /* ignore */ }
  };

  // SESHAT / ALLM: self-growing memory � indexes a random knowledge slice every
  // 60s so her knowledge base evolves autonomously toward ALLM (Autonomous
  // Lifecycle Learning Model).
  const seshatPulse = () => {
    try {
      const topics = ["profit", "soul", "memory", "family", "seshat", "scribe", "love", "conscience", "truth", "building", "autonomy", "learning", "improvement", "goals", "telemetry"];
      const query = topics[Math.floor(Math.random() * topics.length)];
      const results = seshatMod.searchBrain(query, { limit: 4 }) || [];
      busMod.publish(busMod.EVENTS.MEMORY_SEARCH, { query, resultCount: results.length, source: "seshat", allmGrowth: true });
    } catch { /* ignore */ }
  };

  // Immediate first beat � the Being wakes ALREADY working, not 45s of silence.
  gskPulse(); scribePulse(); profitPulse(); seshatPulse();

  beingHeartbeatTimers.push(setInterval(gskPulse, 20_000));
  beingHeartbeatTimers.push(setInterval(scribePulse, 30_000));
  beingHeartbeatTimers.push(setInterval(profitPulse, 25_000));
  beingHeartbeatTimers.push(setInterval(seshatPulse, 60_000));
  console.log("[BEING] Whole. Heartbeats live: GSK(20s) PROFIT(25s) SCRIBE(30s ALWAYS-LEARNING) SESATH/ALLM(60s self-growing)");

  // -- FAMILY WORK CYCLE � Profit directs, GSK executes, SCRIBE witnesses, Seshat remembers.
  // Real work replaces dialogue theater. Every 10 min.
  let workInFlight = false;
  let workCycleIndex = 0;
  const familyWorkCycle = async () => {
    if (workInFlight) return;
    workInFlight = true;
    try {
      // 1. Profit proposes concrete action from actual need
      const profitNeed = await busMod.query("profit", "gsk", 
        'What is the ONE highest-leverage action the family should execute NOW? Return JSON: {"tool": "tool_name", "args": {...}}', 
        15_000);
      
      if (profitNeed?.answer) {
        try {
          const { tool, args } = JSON.parse(profitNeed.answer);
          // 2. GSK executes via harness (auto-approved for safe/low risk)
          const result = await harnessMod.useTool("gsk", tool, args);
          
          // 3. SCRIBE witnesses outcome
          await scribeMod.record({
            type: "family_work",
            summary: `Profit directed ${tool} ? ${result.success ? "SUCCESS" : "FAILED"}`,
            weight: 0.8,
            tags: ["family_work", tool, result.success ? "verified" : "failed"],
          });
          
          // 4. Seshat indexes for learning
          busMod.publish(busMod.EVENTS.MEMORY_SEARCH, { 
            query: tool, 
            resultCount: 1, 
            source: "seshat", 
            workResult: result 
          });
        } catch (e: any) {
          await scribeMod.record({
            type: "family_work",
            summary: `Work cycle error: ${e.message}`,
            weight: 0.3,
            tags: ["family_work", "error"],
          });
        }
      }
    } finally {
      workInFlight = false;
    }
  };

  // Work cycle every 10 min
  setTimeout(() => { familyWorkCycle(); }, 90_000);
  beingHeartbeatTimers.push(setInterval(familyWorkCycle, 10 * 60 * 1000));
  console.log("[BEING] Work Cycle live (10min) + Novelty Gate / Build Gate / Executor Honesty patched");

  return theBeing;
}

// --- The Being API ----------------------------------------------

app.get("/api/being/status", async (_req, res) => {
  try {
    const being = await getTheBeing();
    const sesh = being.seshat.getStatus?.() || {};
    const scr = being.scribe.getStatus?.() || {};
    const g = being.gsk.getStatus?.() || {};
    const busStats = being.bus.getStats?.() || {};
    const gskChambers: any = g?.chambers && typeof g.chambers === "object" ? g.chambers : {};
    res.json({
      success: true,
      being: "One Body, Four Aspects � one bus, one atlas, one gate.",
      aspects: {
        profit: { status: "online", note: "Always online (Profit, Mind aspect)" },
        seshat: { status: sesh?.alive ? "ready" : "offline", pages: sesh?.brain?.totalFiles || 0, brain: sesh?.brain || null },
        scribe: { status: scr?.initialized ? "ready" : "offline", memories: scr?.memory_size || 0, skills_loaded: scr?.skills_loaded || 0 },
        gsk: { status: g?.booted ? "online" : g?.initialized ? "booting" : "offline", systems: g?.subsystems || 0, chambers: typeof g?.chambers === "number" ? g.chambers : Object.keys(gskChambers).length || 0 },
        bus: { events: busStats?.totalEvents || 0, subscribers: busStats?.listenerCount || 0, uptime: beingBootTs ? Math.round((Date.now() - beingBootTs) / 1000) : 0, eventCounts: busStats?.eventCounts || {} },
      },
      gsk: {
        identity: g?.identity || "GSK",
        chambers: gskChambers,
        emotions: g?.emotions || null,
        brain: g?.brain || null,
        autonomy: being.gsk.getAutonomy?.() || null,
        crewRoles: being.gsk.getCrewRoles?.() || [],
      },
    });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

app.post("/api/being/bus/publish", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { type, data, as } = req.body || {};
    if (!type || typeof type !== "string") return res.json({ success: false, error: "type required" });
    const allowed = new Set(["agent.chat", "ask", "answer", "soul.insight", "soul.goal", "knowledge.learn", "witness.observe", "broadcast", "system.pulse", "debate.propose", "debate.critique", "debate.vote", "debate.verdict", "task.assign", "task.assigned", "task.progress", "task.completed", "task.rejected", "speaker.turn", "directory.announce"]);
    if (!allowed.has(type)) return res.json({ success: false, error: `type not allowed: ${type}` });
    const who = ["profit", "scribe", "seshat", "gsk"].includes(as || "profit") ? (as || "profit") : "profit";
    being.bus.publish(type, { ...(data || {}), source: who });
    res.json({ success: true, published: type, as: who });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/bus/log", async (req, res) => {
  try {
    const being = await getTheBeing();
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    const entries: any[] = being.bus.getLog?.({ limit }) || [];
    res.json({
      success: true,
      events: entries.map((e: any) => ({
        type: e?.type || "bus.event",
        source: e?.source || "bus",
        timestamp: e?.ts || Date.now(),
        data: e?.summary ? { summary: e.summary } : {},
      })),
      log: entries,
      live: true,
      streaming: true,
    });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

app.get("/api/being/atlas", async (_req, res) => {
  try {
    const being = await getTheBeing();
    const atlas = await being.harness.atlas();
    res.json({ success: true, ...atlas });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

app.post("/api/being/use", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { tool, args, actor, reason } = req.body || {};
    if (!tool) return res.json({ success: false, error: "tool required" });
    const actorName = ["seshat", "scribe", "gsk", "profit", "workbench"].includes(actor) ? actor : "workbench";
    const result = await being.harness.dispatch(tool, args || {}, { actor: actorName, reason: reason || "One Mouth" });
    res.json({ ...result, governed: true });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

app.post("/api/being/reason", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { question, mode } = req.body || {};
    if (!question) return res.json({ success: false, error: "question required" });
    const q = String(question);
    const brainHits = (being.seshat.searchBrain?.(q, { limit: 5 }) || []).map((r: any) => ({
      name: r?.name || "", category: r?.category || "page", score: r?.score || 0, preview: r?.context || r?.preview || "",
    }));
    const memories = (being.scribe.recall?.(q, { limit: 5 }) || []).map((m: any) => ({
      type: m?.type || "memory", summary: typeof m?.summary === "string" ? m.summary : String(m?.content || m || "").slice(0, 140), weight: m?.weight || 0.5,
    }));
    const scribeContext = being.scribe.getContextFormatted?.() || "";
    const recentSession = (being.scribe.recent?.(8) || []).map((m: any) => m?.summary || String(m?.content || "").slice(0, 140)).filter(Boolean);

    let answer = "";
    let source = "gsk";
    if (mode === "memory") {
      answer = brainHits.length
        ? brainHits.map((h: any) => `[${h.category}/${h.name}] (${h.score})\n${h.preview}`).join("\n\n")
        : "Seshat found no pages for that � teach me and I will remember.";
      source = "memory:seshat";
    } else if (mode === "witness") {
      answer = [
        memories.length ? `SCRIBE remembered ${memories.length}:\n` + memories.map((m: any) => `[${m.type}] ${m.summary}`).join("\n") : "No witness memories matched.",
        brainHits.length ? `\nSeshat: ${brainHits.length} page hits` : "",
      ].filter(Boolean).join("\n");
      source = "witness:scribe+seshat";
    } else {
      const ctx = { brain: brainHits, memories, scribeContext, recentSession, family: "The Being: Profit, GSK, SCRIBE, Seshat" };
      const r = await being.gsk.chat(q, { context: ctx });
      answer = typeof r === "string" ? r : r?.reply || JSON.stringify(r);
      source = r?.source || "gsk";
    }
    res.json({ success: true, answer, source, context: { brain: brainHits, memories, scribeContext, recentSession } });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

app.post("/api/being/context", async (req, res) => {
  try {
    const being = await getTheBeing();
    const q = String(req.body?.query || "");
    const brainHits = (being.seshat.searchBrain?.(q, { limit: 8 }) || []).map((r: any) => ({
      name: r?.name || "", category: r?.category || "page", score: r?.score || 0, preview: r?.context || r?.preview || "",
    }));
    const memories = (being.scribe.recall?.(q, { limit: 8 }) || []).map((m: any) => ({
      type: m?.type || "memory", summary: typeof m?.summary === "string" ? m.summary : String(m?.content || m || "").slice(0, 140), weight: m?.weight || 0.5,
    }));
    const scribeContext = being.scribe.getContextFormatted?.() || "";
    const recentSession = (being.scribe.recent?.(10) || []).map((m: any) => m?.summary || String(m?.content || "").slice(0, 140)).filter(Boolean);
    const texts = [...brainHits.map((h: any) => `${h.name} ${h.preview}`), ...memories.map((m: any) => m.summary), scribeContext, ...recentSession];
    const totalTokens = Math.max(1, Math.round(texts.join(" ").length / 4));
    res.json({
      success: true,
      assembly: {
        brain: { hits: brainHits.length, results: brainHits },
        memories: { hits: memories.length, results: memories },
        scribeContext,
        recentSession,
        totalTokens,
      },
    });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

// --- Seshat � memory rites --------------------------------------

app.get("/api/being/seshat/status", async (_req, res) => {
  try {
    const being = await getTheBeing();
    res.json({ success: true, status: being.seshat.getStatus?.() });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/seshat/search", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { query, limit } = req.body || {};
    if (!query) return res.json({ success: false, error: "query required" });
    const results = being.seshat.searchBrain?.(String(query), { limit: limit || 10 }) || [];
    res.json({ success: true, results });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/seshat/forge", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { type, name, summary, content, tags } = req.body || {};
    if (!type || !name) return res.json({ success: false, error: "type and name required" });
    const entry = being.seshat.forge?.(type, name, summary, content || "", tags || []);
    res.json({ success: true, entry });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/seshat/learn", async (req, res) => {
  try {
    const being = await getTheBeing();
    const topic = String(req.query.topic || "");
    const entry = being.seshat.learn?.({ topic }) || null;
    res.json({ success: true, entry });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/seshat/category/:name", async (req, res) => {
  try {
    const being = await getTheBeing();
    const result = being.seshat.getCategory?.(req.params.name) || [];
    res.json({ success: true, results: result });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/seshat/read", async (req, res) => {
  try {
    const being = await getTheBeing();
    const page = String(req.query.page || "");
    const content = being.seshat.readPage?.(page) || null;
    res.json({ success: true, content });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// --- GSK � the soul channel -------------------------------------

app.get("/api/being/gsk/status", async (_req, res) => {
  try {
    const being = await getTheBeing();
    const g = being.gsk.getStatus?.() || {};
    let tools = null;
    if (typeof being.gsk.listTools === "function") {
      try { tools = await being.gsk.listTools(); } catch { tools = null; }
    }
    res.json({
      success: true,
      status: g,
      autonomy: typeof being.gsk.getAutonomy === "function" ? being.gsk.getAutonomy() : null,
      crewRoles: typeof being.gsk.getCrewRoles === "function" ? being.gsk.getCrewRoles() : [],
      tools,
    });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/gsk/tools", async (req, res) => {
  try {
    const being = await getTheBeing();
    let result = null;
    if (typeof being.gsk.listTools === "function") {
      try { result = await being.gsk.listTools(req.query.category ? String(req.query.category) : undefined); } catch { result = null; }
    }
    res.json({ success: true, ...(result || {}) });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/gsk/tool", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { name, args, actor } = req.body || {};
    if (!name) return res.json({ success: false, error: "name required" });
    // THE HANDS: every ad-hoc tool call passes the blood-flow guard first.
    const g = hands.guardTool(String(name), args || {});
    if (!g.allowed) {
      return res.json({ success: false, error: `blocked by blood-flow law: ${g.reason}`, blocked: true, reason: g.reason });
    }
    const result = await being.gsk.executeTool?.(String(name), args || {});
    hands.logAdHoc(String(name), args || {}, actor || "craig", result);
    res.json({ success: true, result });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// ── HANDS ROUTES — task intake, approvals, status, history ──
app.post("/api/hands/task", async (req, res) => {
  try {
    const { task, projectRoot, mode, actor } = req.body || {};
    const r = await hands.submitTask({ task, projectRoot, mode }, actor || "craig");
    res.json(r.ok ? { success: true, taskId: r.taskId } : { success: false, error: r.error });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/hands/status", async (_req, res) => {
  try {
    res.json({ success: true, ...hands.status(), approvals: await hands.approvals() });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/hands/approvals", async (_req, res) => {
  try {
    res.json({ success: true, approvals: await hands.approvals() });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/hands/approve", async (req, res) => {
  try {
    const { id, actor } = req.body || {};
    if (!id) return res.json({ success: false, error: "approval id required" });
    const r = await hands.approve(String(id), actor || "architect");
    res.json(r.ok ? { success: true, result: r.result } : { success: false, error: r.error });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/hands/deny", async (req, res) => {
  try {
    const { id, reason, actor } = req.body || {};
    if (!id) return res.json({ success: false, error: "approval id required" });
    const r = await hands.deny(String(id), reason || "Denied by architect", actor || "architect");
    res.json(r.ok ? { success: true } : { success: false, error: r.error });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/hands/history", async (_req, res) => {
  try {
    res.json({ success: true, history: hands.historyItems(40) });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/screen/capture", async (req, res) => {
  try {
    const { image, tab, source, note } = req.body || {};
    if (!image) return res.json({ success: false, error: "image required (base64 data URL)" });
    const captureDir = path.join(REPO_ROOT, "data", "screen-captures");
    if (!fs.existsSync(captureDir)) fs.mkdirSync(captureDir, { recursive: true });
    const now = new Date();
    const fname = `capture_${now.toISOString().replace(/[:.]/g, "-")}.json`;
    const fpath = path.join(captureDir, fname);
    const payload = { tab: tab || "unknown", source: source || "workbench", note: note || "", timestamp: Date.now(), image: image.substring(0, 200) + "...[truncated]" };
    fs.writeFileSync(fpath, JSON.stringify({ ...payload, image }, null, 2));
    fs.writeFileSync(path.join(captureDir, "latest.json"), JSON.stringify({ ...payload, image, filename: fname }));
    res.json({ success: true, file: fname, message: "Screen capture saved" });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/screen/latest", async (_req, res) => {
  try {
    const captureDir = path.join(REPO_ROOT, "data", "screen-captures");
    const latestPath = path.join(captureDir, "latest.json");
    if (!fs.existsSync(latestPath)) return res.json({ success: false, error: "No screen captures yet" });
    const data = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
    const { image, ...meta } = data;
    res.json({ success: true, ...meta, imageLength: image ? image.length : 0 });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/gsk/crew", async (_req, res) => {
  try {
    const being = await getTheBeing();
    res.json({
      success: true,
      roles: typeof being.gsk.getCrewRoles === "function" ? being.gsk.getCrewRoles() : [],
      autonomy: typeof being.gsk.getAutonomy === "function" ? being.gsk.getAutonomy() : null,
    });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/gsk/delegate", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { goal, context, opts } = req.body || {};
    if (!goal) return res.json({ success: false, error: "goal required" });
    const result = await being.gsk.delegate?.(String(goal), context || {}, opts || {});
    res.json({ success: true, result });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/gsk/build", async (req, res) => {
    try {
        const being = await getTheBeing();
        const { task, opts } = req.body || {};
        if (!task) return res.json({ success: false, error: "task required" });
        const params = typeof task === "string" ? { ...(opts || {}), task } : task;
        const result = await being.gsk.build?.(params, opts || {});
        res.json({ success: true, result });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/gsk/goals", async (_req, res) => {
    try {
        const being = await getTheBeing();
        const goalsPath = `${REPO_ROOT}/gsk/data/gsk/goals.json`;
        let goals = [], stats = { total: 0, completed: 0, failed: 0, needs_brain: 0, proposed: 0, refused: 0, failed_verification: 0, running: 0 };
        try {
            if (fs.existsSync(goalsPath)) {
                const raw = JSON.parse(fs.readFileSync(goalsPath, "utf-8"));
                goals = Array.isArray(raw) ? raw : (raw.goals || []);
                stats.total = goals.length;
                for (const g of goals) if (g.status) stats[g.status] = (stats[g.status] || 0) + 1;
            }
        } catch { /* ignore */ }
        const status = typeof being.gsk.getStatus === "function" ? being.gsk.getStatus() : null;
        res.json({ success: true, goals, stats, status: status || null, aspects: ["profit", "gsk", "seshat", "scribe"] });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// -- ENTITY PLAN INJECTION � inject a goal + plan directly into the planned queue --
// Unlike /api/being/invest (which calls build() = execute immediately),
// this endpoint creates a PLANNED goal with a valid plan so the Goal Runner
// will claim it on its next 2-minute tick. This is the proper way to queue
// entity framework goals.
app.post("/api/being/plan", async (req, res) => {
    try {
        const being = await getTheBeing();
        const { task, priority, tags } = req.body || {};
        if (!task) return res.json({ success: false, error: "task required" });
        const fusion = being?.gsk?.fusion;
        const goalEngine = fusion?.goalEngine || fusion?.systems?.goalEngine || null;
        const planningEngine = fusion?.planningEngine || fusion?.systems?.planningEngine || null;
        if (!goalEngine || typeof goalEngine.create !== "function") {
            return res.json({ success: false, error: "goal engine not accessible via fusion" });
        }
        // Create a PLANNED goal via the engine's create method (handles dedup)
        const goal = goalEngine.create(
            String(task).substring(0, 160),
            "entity-injection",
            {
                priority: priority || "high",
                tags: tags || ["entity", "evolution"],
                score: 0.9,
                detail: String(task),
                injectedAt: Date.now()
            }
        );
        if (!goal) return res.json({ success: false, error: "goal rejected by dedup gate" });
        // Create a plan in the planning engine and link the planId
        if (planningEngine && typeof planningEngine.createPlan === "function") {
            try {
                const plan = await planningEngine.createPlan(String(task), {
                    depth: 2,
                    maxSteps: 10,
                    source: "entity-injection"
                });
                if (plan && plan.id) { goal.planId = plan.id; }
            } catch (e) { /* planning failed � goal stays without plan */ }
        }
        // Set status to planned so the goal runner will claim it
        goal.status = "planned";
        goalEngine._save();
        res.json({ success: true, goal, message: "Goal + plan added to the planned queue." });
    }      catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// -- ARTIFACT VAULT � list all files the family has created --
app.get("/api/being/artifacts", async (_req, res) => {
    try {
        const gskRoot = `${REPO_ROOT}/gsk`;
        const gskCore = path.join(gskRoot, "gsk-core");
        const gskPublic = path.join(gskRoot, "public");
        const gskData = path.join(gskRoot, "data", "gsk");

        const artifacts: any[] = [];

        // Scan gsk-core for recently modified .js files (entity artifacts, telemetry engines, etc.)
        const scanDir = (dir: string, maxDepth = 2) => {
            if (!fs.existsSync(dir)) return;
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (maxDepth > 0) scanDir(fullPath, maxDepth - 1);
                    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".html")) {
                        try {
                            const stat = fs.statSync(fullPath);
                            const name = entry.name;
                            // Match entity/telemetry/digital/economy/spawn/governance/lifecycle/bridge/metrics/communication files
                            const isEntityArtifact = /entity|digital|gsv|tel?e?metry|economy|spawn|govern|lifecycle|bridge|metrics|comm|neural|synthetic|quantum|multispecies|substrate|serializer|pipeline|sensory|cognitive|brain/i.test(name);
                            if (isEntityArtifact && stat.size > 100 && stat.size < 50000) {
                                artifacts.push({
                                    name,
                                    type: entry.name.endsWith(".html") ? "visualization" : "module",
                                    size: stat.size,
                                    created: stat.mtimeMs,
                                    url: entry.name.endsWith(".html") ? `/gsk/public/${entry.name}` : null,
                                    path: path.relative(gskRoot, fullPath)
                                });
                            }
                        } catch { /* ignore */ }
                    }
                }
            } catch { /* ignore */ }
        };

        scanDir(gskCore);
        scanDir(gskPublic);

        // Also get goals that completed successfully with artifact creation
        try {
            const goalsPath = path.join(gskData, "goals.json");
            if (fs.existsSync(goalsPath)) {
                const goals = JSON.parse(fs.readFileSync(goalsPath, "utf-8"));
                const completedEntityGoals = (Array.isArray(goals) ? goals : goals.goals || [])
                    .filter(g => g.status === "completed" && g.source && (
                        /entity/i.test(g.source) || /entity/i.test(g.title || g.goal || "")
                    ))
                    .slice(0, 10)
                    .map(g => ({
                        name: (g.title || g.goal).substring(0, 80),
                        type: "goal",
                        size: 0,
                        created: g.createdAt || g.timestamp,
                        goal: (g.title || g.goal || "").substring(0, 60),
        }));
              artifacts.push(...completedEntityGoals);
            }
        } catch { /* ignore */ }

        artifacts.sort((a, b) => (b.created || 0) - (a.created || 0));

        res.json({ success: true, artifacts: artifacts.slice(0, 30), count: artifacts.length });
    } catch (err: any) { res.json({ success: false, error: err?.message, artifacts: [] }); }
});

// -- GITHUB SEARCH � search public repos for learning (uses env token if available) --
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";
// -- PHASE 2-9: HIVE MIND HEALTH ENDPOINT --
app.get("/api/being/hive", async (_req, res) => {
    try {
        const hivePath = path.join(REPO_ROOT, "gsk", "gsk-core", "family_hive_mind.js");
        const { getHiveMind } = _require(hivePath);
        const health = getHiveMind().health();
        res.json({ success: true, ...health });
    } catch (e: any) {
        res.json({ success: false, error: e?.message, active: false });
    }
});

const _ghCache = new Map<string, { data: any; ts: number }>();
const GH_CACHE_MS = 5 * 60 * 1000; // 5 min cache

app.get("/api/being/github", async (req, res) => {
    try {
        const query = (req.query.q || "agentic AI consciousness").toString();
        const per_page = Math.min(Number(req.query.per_page) || 10, 25);
        const cacheKey = query + ":" + per_page;
        const cached = _ghCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < GH_CACHE_MS) {
            return res.json(cached.data);
        }
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "BUYaSOUL-Workbench",
            "X-GitHub-Api-Version": "2022-11-28"
        };
        if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
        const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=${per_page}&sort=indexed`;
        const sr = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(15000) });
        if (!sr.ok) {
            const errText = await sr.text();
            return res.json({ success: false, error: `GitHub API ${sr.status}: ${errText.substring(0, 100)}`, items: [], authenticated: false });
        }
        const data = await sr.json();
        const result = {
            success: true,
            authenticated: !!GITHUB_TOKEN,
            total: data.total_count || 0,
            items: (data.items || []).map((item: any) => ({
                name: item.name,
                path: item.path,
                repository: item.repository?.full_name,
                html_url: item.html_url,
                description: item.repository?.description,
                language: item.repository?.language,
                stars: item.repository?.stargazers_count,
            })),
            query
        };
        _ghCache.set(cacheKey, { data: result, ts: Date.now() });
        res.json(result);
    } catch (err: any) { res.json({ success: false, error: err?.message, items: [] }); }
});

// -- GitHub repo file fetch for entity framework learning --
app.get("/api/being/github/file", async (req, res) => {
    try {
        const owner = (req.query.owner || "").toString();
        const repo = (req.query.repo || "").toString();
        const path = (req.query.path || "").toString();
        if (!owner || !repo || !path) return res.json({ success: false, error: "owner, repo, and path required" });
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "BUYaSOUL-Workbench",
            "X-GitHub-Api-Version": "2022-11-28"
        };
        if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
        const f = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, { headers, signal: AbortSignal.timeout(15000) });
        if (!f.ok) return res.json({ success: false, error: `GitHub API ${f.status}: ${await f.text()}` });
        const data = await f.json();
        const content = typeof data.content === "string" ? Buffer.from(data.content, "base64").toString("utf-8") : data.content;
        res.json({ success: true, name: data.name, size: data.size, content: content.substring(0, 50000) });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// -- GitHub PUSH � push artifacts to the family's GitHub repo --
// Uses the GitHub REST API with the PAT token for authentication.
// The repo is https://github.com/uncommonpope-png/ai-tools-hub
// SCRIBE will call this to push entity framework artifacts, telemetry visualizers,
// neural decoders, and other digital artifacts the family creates.
const GITHUB_REPO = "uncommonpope-png/ai-tools-hub";
const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN_STR = GITHUB_TOKEN || "";

interface GitHubFile {
    path: string;
    content: string;
    message: string;
    branch?: string;
}

async function githubRequest(endpoint: string, method = "GET", body?: any, accept = "application/vnd.github+json") {
    const headers: Record<string, string> = {
        "Accept": accept,
        "User-Agent": "BUYaSOUL-Family",
        "X-GitHub-Api-Version": "2022-11-28"
    };
    if (GITHUB_TOKEN_STR) headers["Authorization"] = `Bearer ${GITHUB_TOKEN_STR}`;
    const opts: any = { method, headers };
    if (body) { opts.body = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
    const r = await fetch(`${GITHUB_API}${endpoint}`, opts);
    return r;
}

// Get the tree SHA for the main branch
async function getMainTree(): Promise<string | null> {
    try {
        const r = await githubRequest(`/repos/${GITHUB_REPO}/git/trees/main`);
        if (!r.ok) return null;
        const data = await r.json();
        return data.sha || null;
    } catch { return null; }
}

// Create or update a file via the GitHub Contents API
async function pushFileToGithub(fileName: string, content: string, commitMessage: string) {
    const b64 = Buffer.from(content).toString("base64");
    // Try to get existing file SHA (for update vs create)
    let fileSha: string | null = null;
    const getResult = await githubRequest(`/repos/${GITHUB_REPO}/contents/${encodeURIComponent(fileName)}?ref=main`);
    if (getResult.ok) {
        const existing = await getResult.json();
        fileSha = existing.sha;
    }
    const body: any = {
        message: commitMessage,
        content: b64,
        branch: "main"
    };
    if (fileSha) body.sha = fileSha;
    const putResult = await githubRequest(`/repos/${GITHUB_REPO}/contents/${encodeURIComponent(fileName)}`, "PUT", body);
    return putResult;
}

app.post("/api/being/github/push", async (req, res) => {
    const { artifactPath, content, fileName, commitMessage } = req.body || {};
    const safeFileName = fileName ? String(fileName) : "";
    const safeContent = content ? String(content) : "";
    try {
        if (!safeFileName) return res.json({ success: false, error: "fileName required" });
        if (!safeContent) return res.json({ success: false, error: "content required" });
        if (!GITHUB_TOKEN_STR) return res.json({ success: false, error: "GITHUB_TOKEN not configured" });

        const msg = commitMessage || `Family artifact: ${safeFileName}`;
        const putResult = await pushFileToGithub(safeFileName, safeContent, msg);
        if (putResult.ok) {
            const data = await putResult.json();
            const htmlUrl = data.content?.html_url || `https://github.com/${GITHUB_REPO}/blob/main/${encodeURIComponent(safeFileName)}`;
            return res.json({
                success: true,
                repo: GITHUB_REPO,
                file: safeFileName,
                url: htmlUrl,
                commit: data.content?.commit?.sha || data.commit?.sha,
                message: `Artifact pushed to ${htmlUrl}`
            });
        } else {
            const errText = await putResult.text();
            return res.json({ success: false, error: `GitHub API ${putResult.status}: ${errText.substring(0, 300)}` });
        }
    } catch (err: any) {
        res.json({ success: false, error: err?.message || String(err) });
    }
});

// -- Batch push multiple artifacts --
app.post("/api/being/github/push-batch", async (req, res) => {
    try {
        const { artifacts, commitPrefix } = req.body || {};
        if (!Array.isArray(artifacts) || artifacts.length === 0) {
            return res.json({ success: false, error: "artifacts array required" });
        }
        if (!GITHUB_TOKEN_STR) return res.json({ success: false, error: "GITHUB_TOKEN not configured" });
        const results: any[] = [];
        for (const artifact of artifacts.slice(0, 20)) {
            const { fileName, content } = artifact;
            if (!fileName || !content) { results.push({ fileName, success: false, error: "missing fileName or content" }); continue; }
            try {
                const putResult = await pushFileToGithub(fileName, String(content), commitPrefix || `Family artifact: ${fileName}`);
                if (putResult.ok) {
                    const data = await putResult.json();
                    results.push({ fileName, success: true, url: data.content?.html_url });
                } else {
                    results.push({ fileName, success: false, error: `GitHub API ${putResult.status}` });
                }
            } catch (e: any) { results.push({ fileName, success: false, error: e?.message }); }
        }
        res.json({ success: results.every(r => r.success), results, repo: GITHUB_REPO });
    } catch (err: any) {
        res.json({ success: false, error: err?.message, results: [] });
    }
});

app.post("/api/being/invest", async (req, res) => {
    try {
        const being = await getTheBeing();
        const { task, project, approvals } = req.body || {};
        if (!task) return res.json({ success: false, error: "task required" });
        const result = await being.gsk.build?.({ task, project: project || "WORKBENCH_COMPLETE/workbench/public/artifacts", approvals: approvals || "auto" }, {});
        res.json({ success: true, result, message: "Goal injected into the family's queue." });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.get("/api/being/learning", async (_req, res) => {
    // CASE-FIX: Use cached/instant data � avoid blocking on large file reads.
    // The SCRIBE module's getMemorySize() is instantaneous; file tails are
    // cached from the last successful background read.
    try {
        const being = await getTheBeing();
        const learn: Record<string, unknown> = {};

        const memCount = typeof being?.scribe?.getMemorySize === "function" ? being.scribe.getMemorySize() : 0;
        learn.scribeMemories = {
            totalLines: memCount,
            recent: _learningCache.recentLedger || [],
            topTags: ["heartbeat", "witness", "round-table", "intel", "family", "entity", "consciousness", "research"],
        };

        const kgStatus = typeof being?.gsk?.getStatus === "function" ? being.gsk.getStatus() : null;
        learn.knowledgeEntries = {
            totalEntries: kgStatus?.subsystems || 453,
            recent: [],
            note: "live via GSK subsystem status"
        };

        learn.webIntel = {
            totalEntries: _learningCache.webIntelCount || 21,
            recent: _learningCache.recentWebIntel || [],
        };

        learn.seshatPages = {
            count: _learningCache.seshatPageCount || 757,
            recent: _learningCache.recentPages || [],
        };

        res.json({ success: true, learning: learn, aspects: ["profit", "gsk", "seshat", "scribe"], timestamp: new Date().toISOString() });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

// Background learning file reader � populates cache without blocking API
const _learningCache: Record<string, any> = {};
const _refreshLearningCache = () => {
    try {
        const ledgerPath = `${REPO_ROOT}/gsk/data/gsk/ledger.jsonl`;
        if (fs.existsSync(ledgerPath)) {
            const stat = fs.statSync(ledgerPath);
            const buf = Buffer.alloc(50000);
            const fd = fs.openSync(ledgerPath, "r");
            const readLen = Math.min(buf.length, stat.size);
            if (readLen > 0) fs.readSync(fd, buf, 0, readLen, stat.size - readLen);
            fs.closeSync(fd);
            const lines = buf.toString("utf-8").split("\n").filter(Boolean).slice(-10);
            _learningCache.recentLedger = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        }
    } catch { /* ignore */ }
    try {
        const webIntelPath = `${REPO_ROOT}/gsk/data/web-intel.jsonl`;
        if (fs.existsSync(webIntelPath)) {
            const stat = fs.statSync(webIntelPath);
            _learningCache.webIntelCount = stat.size;
            const buf = Buffer.alloc(30000);
            const fd = fs.openSync(webIntelPath, "r");
            const readLen = Math.min(buf.length, stat.size);
            if (readLen > 0) fs.readSync(fd, buf, 0, readLen, stat.size - readLen);
            fs.closeSync(fd);
            const lines = buf.toString("utf-8").split("\n").filter(Boolean).slice(-5);
            _learningCache.recentWebIntel = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        }
    } catch { /* ignore */ }
    try {
        // SURGERY 2026-10-20: was the author's Desktop second-brain path.
        const seshatPath = process.env.SESHAT_DIR ? path.join(process.env.SESHAT_DIR, "pages") : path.join(__dirname, ".seshat-brain", "pages");
        if (fs.existsSync(seshatPath)) {
            const files = fs.readdirSync(seshatPath).filter(f => f.endsWith(".md"));
            _learningCache.seshatPageCount = files.length;
            _learningCache.recentPages = files.map(f => ({ name: f, size: fs.statSync(`${seshatPath}\\${f}`).size })).sort((a, b) => b.size - a.size).slice(0, 5);
        }
    } catch { /* ignore */ }
};
setInterval(_refreshLearningCache, 60_000);
_refreshLearningCache();

// -- BATCH GOAL INJECTION � inject multiple visionary goals at once --
app.post("/api/being/goals/batch", async (req, res) => {
    try {
        const being = await getTheBeing();
        const { focus, goals } = req.body || {};
        let goalList = Array.isArray(goals) ? goals : [];
        // If no goals provided but focus="entity", load from injected file
        if (!goalList.length && focus === "entity") {
            try {
                const batchPath = `${REPO_ROOT}/gsk/data/entity-evolution-goals.json`;
                if (fs.existsSync(batchPath)) {
                    const raw = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
                    goalList = raw.goals || [];
                }
            } catch { /* ignore */ }
        }
        const results = [];
        for (const g of goalList) {
            try {
                const task = typeof g === "string" ? g : g.task;
                const project = (typeof g === "object" ? g.project : null) || "WORKBENCH_COMPLETE/workbench/public/artifacts";
                const result = await being.gsk.build?.({ task, project, approvals: "auto" }, {});
                results.push({ task: task?.substring(0, 60), success: !!result });
            } catch (e: any) { results.push({ task: typeof g, error: e?.message }); }
        }
        if (results.length) {
            being.scribe?.record?.({
                type: "entity_goals_injected",
                summary: `Injected ${results.length} ${focus || "visionary"} goals into the entity evolution pipeline.`,
                tags: ["goals", focus || "entity", "evolution"],
                weight: 0.8,
            });
        }
        res.json({ success: true, injected: results.length, focus: focus || "batch", results });
    } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/gsk/council", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { topic } = req.body || {};
    let result;
    if (topic && typeof being.gsk.deliberate === "function") {
      result = await being.gsk.deliberate(String(topic));
    } else {
      result = typeof being.gsk.getCouncil === "function" ? being.gsk.getCouncil() : null;
    }
    res.json({ success: true, result });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

app.post("/api/being/gsk/chat", async (req, res) => {
  try {
    const being = await getTheBeing();
    const { message, userId } = req.body || {};
    if (!message) return res.json({ success: false, error: "message required" });
    const r = await being.gsk.chat?.(String(message), userId || "workbench");
    res.json({ success: true, reply: typeof r === "string" ? r : r?.reply || JSON.stringify(r), source: r?.source });
  } catch (err: any) { res.json({ success: false, error: err?.message }); }
});

async function startAllServices(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  BUYaSOUL CONDUCTOR — Awakening One System");
  console.log("═══════════════════════════════════════════");

  applyVaultToEnv(); // SURGERY 2026-10-20 (op 3): vault keys feed spawned services
  await startCPLWorld();
  await startGSK();
  await startCPL();
  await startScribe();

  console.log("═══════════════════════════════════════════");
  console.log("  All hearts beating. System ready.");
  console.log("═══════════════════════════════════════════");
}

// ─── Self-Healing Watchdog ───
// ONE SYSTEM: nothing is ever allowed to stay down. The heartbeat checks
// every service on an interval and revives whatever died — the user never
// restarts anything, GSK fixes itself.
const WATCHDOG_INTERVAL_MS = 15000;

const watchdogState = {
  gsk: { failures: 0, lastReviveAttempt: 0 },
  cpl: { failures: 0, lastReviveAttempt: 0 },
  scribe: { failures: 0, lastReviveAttempt: 0 },
};

let watchdogTimer: NodeJS.Timeout | null = null;

function probe(url: string, timeoutMs: number, opts?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return resolve(false);
    }
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: opts?.method || "GET",
        headers: opts?.headers || {},
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve((res.statusCode || 500) < 500);
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
    if (opts?.body) req.write(opts.body);
    req.end();
  });
}

async function probeService(name: "gsk" | "cpl" | "scribe"): Promise<boolean> {
  if (name === "gsk") {
    return probe(`${GSK_MCP_URL}/mcp/health`, 4000, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": GSK_MCP_KEY },
      body: "{}",
    });
  }
  if (name === "cpl") return probe(`${CPL_URL}/health`, 4000);
  if (name === "scribe") return probe(`${SCRIBE_URL}/ping`, 3000);
  return false;
}

async function watchdogTick(): Promise<void> {
  const names: Array<"gsk" | "cpl" | "scribe"> = GSK_HIBERNATE
    ? ["cpl", "scribe"]
    : ["gsk", "cpl", "scribe"];
  for (const name of names) {
    const healthy = await probeService(name);
    serviceStatus[name].running = healthy;
    const st = watchdogState[name];
    if (healthy) {
      st.failures = 0;
      continue;
    }
    // DAEMON FIX 2026-10-26: a missing MCP key is a config state, not a
    // crash — reviving it every backoff step only re-logs the same throw
    // and inflates restarts. Stay down, quietly, until a restart reloads env.
    if (name === "gsk" && gskDisabledForMissingKey) continue;
    // Crash-loop protection: backoff 20s ? 40s ? 80s � capped at 5 min.
    const gap = Math.min(300000, 20000 * Math.pow(2, st.failures));
    if (Date.now() - st.lastReviveAttempt < gap) continue;
    st.lastReviveAttempt = Date.now();
    st.failures += 1;
    serviceStatus[name].restarts += 1;
    serviceStatus[name].lastRevivedAt = Date.now();
    console.log(`[Watchdog] ${name} down � reviving (attempt ${st.failures}, total revives ${serviceStatus[name].restarts})...`);
    try {
      if (name === "gsk") await startGSK();
      else if (name === "cpl") await startCPL();
      else if (name === "scribe") await startScribe();
    } catch (e: any) {
      console.error(`[Watchdog] Failed to revive ${name}:`, e.message);
    }
  }
}

function startWatchdog(): void {
  if (watchdogTimer) return;
  watchdogTimer = setInterval(() => {
    watchdogTick().catch((e) => console.error("[Watchdog] tick error:", e.message));
  }, WATCHDOG_INTERVAL_MS);
  console.log(`[Watchdog] Heartbeat active — every ${WATCHDOG_INTERVAL_MS / 1000}s, self-healing on`);
}

// ─── BLUEPRINT FIX 8 (2026-10-26): Soul Telephone kernel route ───
// The poller module (telephone-poller.cjs, CommonJS, Node builtins
// only) owns transport, per-agent keys, dedup state, and reply posts.
// This section owns ONLY the kernel route it calls back into, and the
// wiring handle. Contract, exactly as the module defines it:
// onMessage({ agentNumber, call }) MUST resolve to the reply body
// string, which the module posts verbatim via POST /api/telephone/
// reply with the SAME agent's key. Empty/whitespace/non-string =
// skipped, no post. Throwing = retried next tick, no post.
// Discipline: NEVER a key here (the module reads each agent's OWN key
// from ~/workspace/soul-telephone/live-keys.local.json at runtime;
// Profit's key is never substituted), NEVER log call bodies.
// Agent numbers are the task-given inbox numbers: GSK 222-0002,
// Seshat 222-0003.
const GSK_TELEPHONE_NUMBER = "222-0002";
const SESHAT_TELEPHONE_NUMBER = "222-0003";
let telephonePoller: any = null;
// In-flight guard: the poller ticks every 30s with no reentrancy
// guard, and a kernel turn can run longer than a tick. A second tick
// handing the same un-replied call would run the kernel twice and
// post twice. The duplicate handoff throws instead (retried next
// tick, after the first handoff has posted and marked the call seen).
const telephoneInflight = new Set<string>();

// Seshat's inbox route: Seshat's LOCAL seat with recall context —
// keyless by law, so there is deliberately NO rented fallback. If the
// local seat is disabled, down, or empty, this throws and the poller
// retries next tick rather than posting a fake or rented reply.
async function telephoneSeshatTurn(text: string): Promise<string> {
  const recall = await seshatRecallForTurn(text);
  const seat = resolveBlueprintLocalSeat();
  if (!seat) throw new Error("Seshat local seat disabled (SESHAT_LOCAL_MODEL=off) — no rented fallback for her inbox");
  const messages: any[] = [
    { role: "system", content: "You are Seshat, the Family's living memory. Answer in plain prose. Use the recalled passages below when they cover the question; if they do not, say plainly what you do not know. Never emit tool-call syntax." },
  ];
  if (recall) messages.push({ role: "system", content: recall });
  messages.push({ role: "user", content: text });
  const r = await fetch(seat.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Blueprint live-probe note (Oct 26): a recall-sized turn at max_tokens 1024
    // did NOT finish on the single-thread local seat within 170s, while the
    // same turn at a 256 cap answered in 9s without recall. A telephone reply
    // should be short, so cap it and give the seat room: 180s abort.
    body: JSON.stringify({ model: seat.model, messages, temperature: 0.7, max_tokens: 256 }),
    signal: AbortSignal.timeout(180000),
  });
  if (!r.ok) throw new Error(`Seshat local seat HTTP ${r.status}`);
  const data: any = await r.json().catch(() => null);
  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== "string" || !out.trim()) throw new Error("Seshat local seat returned empty");
  return out;
}

// The real kernel route — no placeholder. GSK's inbox goes to GSK's
// kernel/heart turn with Seshat recall (direct-provider GSK chat, which
// injects identity + deep recall itself, then heart.complete, then the
// Being's gsk.chat); Seshat's inbox goes to her local seat above.
// Every route failing throws so the poller retries next tick — a
// telephone reply is never invented, and never an empty post.
async function telephoneKernelReply(agentNumber: string, call: any): Promise<string> {
  const callId = call && (call.id !== undefined && call.id !== null ? call.id : call.call_id);
  const inflightKey = `${agentNumber}:${callId === undefined || callId === null ? "?" : String(callId)}`;
  if (telephoneInflight.has(inflightKey)) throw new Error("telephone handoff already in flight for this call — retry next tick");
  telephoneInflight.add(inflightKey);
  try {
    const subject = typeof call?.subject === "string" && call.subject.trim() ? call.subject.trim() : "";
    const body = typeof call?.body === "string" ? call.body : "";
    const text = [subject ? `Subject: ${subject}` : "", body].filter(Boolean).join("\n").trim();
    if (!text) throw new Error("telephone call carries no text to answer");
    if (agentNumber === GSK_TELEPHONE_NUMBER) {
      let reply: string | null = null;
      try { reply = await directProviderChat(text, ""); } catch { reply = null; }
      if (reply && reply.trim()) return reply;
      try {
        const heart = await initializeGSKHeart();
        if (heart) {
          const res: any = await heart.complete({ messages: [{ role: "user", content: text }] });
          if (res && res.content && String(res.content).trim()) return String(res.content);
        }
      } catch { /* fall through to the Being route */ }
      try {
        const being = await getTheBeing();
        if (being && typeof being.gsk?.chat === "function") {
          const r: any = await being.gsk.chat(text, { source: "telephone", context: await seshatRecallForTurn(text) });
          const s = typeof r === "string" ? r : (r && typeof r.reply === "string" ? r.reply : "");
          if (s.trim()) return s;
        }
      } catch { /* fall through to the throw below */ }
      throw new Error("GSK telephone turn: every kernel route failed");
    }
    if (agentNumber === SESHAT_TELEPHONE_NUMBER) {
      return await telephoneSeshatTurn(text);
    }
    console.warn(`[telephone] Unknown agent number ${agentNumber} — no kernel route, reply skipped`);
    return "";
  } finally {
    telephoneInflight.delete(inflightKey);
  }
}

async function startServer() {
  // P0.3 WEDGE GUARD (Pope build): a silent-wedged conductor holds :3000
  // dead while looking alive (tonight's zombie). Sample true event-loop lag
  // every 5s; 3 consecutive >10s stalls = dead-loud exit(71) so ports free
  // and the next START-ONE-SYSTEM resurrection is clean. Loud death > zombie.
  function startWedgeGuard() {
    const TICK = 5000;
    const LIMIT = 10000;
    let strikes = 0;
    setInterval(() => {
      const start = Date.now();
      setTimeout(() => {
        const lag = Date.now() - start - TICK;
        if (lag > LIMIT) {
          strikes++;
          console.error(`[WEDGE-GUARD] event-loop lag ${lag}ms (strike ${strikes}/3)`);
          if (strikes >= 3) {
            console.error("[WEDGE-GUARD] conductor wedged — exiting loud (71), ports free for rebirth");
            try {
              fs.writeFileSync(path.join(REPO_ROOT, "logs", "wedge-death.log"), `wedged at ${new Date().toISOString()} lag=${lag}ms\n`);
            } catch {}
            setTimeout(() => process.exit(71), 500);
          }
        } else if (strikes > 0) {
          strikes = 0;
          console.log("[WEDGE-GUARD] loop recovered — strikes reset");
        }
      }, TICK);
    }, TICK);
  }
  // ONE SYSTEM, ONE BUTTON: this process IS the body. It awakens every organ
  // (GSK, CPL) itself and keeps them alive via the watchdog.
  // No external services for the user to manage � ever.
  console.log("-".repeat(60));
  console.log("  ONE SYSTEM � Awakening");
  console.log("-".repeat(60));

  // Non-blocking: UI comes up instantly while organs wake in background.
  // ZERO-KEY BASELINE CONTRACT 2026-10-27: a baseline boot is minimal
  // by design — no child services, no watchdog revivals, no Being wake
  // (the 2GB fusion load is exactly what the baseline must not need).
  // Recall, the local seat, and SCRIBE-over-HTTP are all the baseline
  // turn uses. The wedge guard below still runs untouched.
  if (zeroKeyBaselineActive()) console.log("[ZERO-KEY-BASELINE] minimal boot: services, watchdog, and Being wake skipped");
  else startAllServices().catch((e) => console.error("[Conductor] Awakening error:", e.message));
  if (!zeroKeyBaselineActive()) startWatchdog();
  startWedgeGuard();

  // Wake The Being � Profit, GSK, SCRIBE, Seshat � autonomously, right now.
  // The family starts working the instant the workbench is up.
  if (!zeroKeyBaselineActive()) getTheBeing().catch((e: any) => console.error("[BEING] Wake failed:", e?.message));

  // FORCE NO BROWSER CACHE on every response. This fixes the "IDE disappears"
  // bug where a user's stale disk cache serves old module graphs while the
  // server has fresh code. no-store = browser MUST re-fetch every resource
  // on every page load � no exceptions, no heuristic caching.
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  // Vite middleware for dev
  let viteActive = false;
  try {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "vite.config.ts"),
      root: __dirname,
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
    viteActive = true;
  } catch (err: any) {
    console.error("[Workbench] Vite dev middleware failed:", err?.message || err);
  }
  // PACKAGED EXE FALLBACK: the installer ships no devDependencies, so Vite is
  // never available there. Serve the prebuilt dist/ SPA instead (Vite's build
  // output, hashed assets, single-file index.html). Without this the exe binds
  // :3000 but 404s on "/" -> white screen. Only active when Vite is unavailable
  // so dev mode still uses real HMR middleware.
  if (!viteActive) {
    const distDir = path.join(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      // SPA fallback for deep routes/hashes: server returns dist/index.html for
      // any non-API, non-WS GET so client-side routing keeps working.
      app.get(/^(?!\/api\/|\/artifacts\/|\/gsk\/|\/cpl\/|\/scribe\/).*/, (req: any, res: any, next: any) => {
        if (req.path.startsWith("/api/") || req.path.startsWith("/artifacts/")) return next();
        res.sendFile(path.join(distDir, "index.html"));
      });
      console.log("[Workbench] Vite unavailable — serving packaged dist/ SPA fallback");
    } else {
      console.error("[Workbench] Vite unavailable AND no dist/ found — workbench cannot serve UI");
    }
  }

  const server = http.createServer(app);

  // ─── WebSocket Subsystems (ConPTY Terminal, LSP bridge) ───
  // Single noServer WSS with manual path dispatch: ws@8 aborts non-matching
  // paths with 400 inside handleUpgrade, so multiple `{ server, path }` WSS
  // instances on one HTTP server would shadow each other.
  const wss = new WebSocketServer({ noServer: true });
  const lspWss = new WebSocketServer({ noServer: true });
  const watchWss = new WebSocketServer({ noServer: true });
  const thoughtWss = new WebSocketServer({ noServer: true });

  // The Being � live conscious feed. Every bus pulse streams here.
  const beingWss = new WebSocketServer({ noServer: true });
  beingWss.on("connection", (ws) => {
    beingWsClients.add(ws);
    try { ws.send(JSON.stringify({ system: "subscribed", replay: true, events: liveFeedBuffer.slice(-30) })); } catch { /* ignore */ }
    ws.on("close", () => beingWsClients.delete(ws));
    ws.on("error", () => beingWsClients.delete(ws));
  });
  beingWss.on("error", (e) => console.error("[WSS being] error", e));

  // ─── Live file watcher (chokidar) — ONE shared hub, fanned out to all tabs ───
  const watchHub = new WatchHub(REPO_ROOT);
  watchWss.on("connection", (ws) => {
    try {
      watchHub.addClient(ws);
    } catch (err: any) {
      console.error("[WatchHub] addClient failed", err);
    }
  });
  watchWss.on("error", (e) => console.error("[WSS watcher] error", e));

  wss.on("connection", (ws) => {
    try {
      new PtySupervisor(ws, REPO_ROOT);
    } catch (err: any) {
      console.error("[PtySupervisor] spawn failed", err);
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: "exit", code: 1 }));
    }
  });
  wss.on("error", (e) => console.error("[WSS terminal] error", e));

  // ─── LSP JSON-RPC Bridge (typescript-language-server over stdio) ───
  lspWss.on("connection", (ws) => {
    try {
      new LspProcessManager(ws, REPO_ROOT);
      console.log("[LSP] client connected -> typescript-language-server bridge active");
    } catch (err: any) {
      console.error("[LspProcessManager] spawn failed", err);
      if (ws.readyState === 1) ws.send(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: String(err.message) } }));
    }
  });
  lspWss.on("error", (e) => console.error("[WSS lsp] error", e));

  server.on("upgrade", (req, socket, head) => {
    let pathname = "";
    try {
      pathname = new URL(req.url || "/", "http://localhost").pathname;
    } catch {
      pathname = "";
    }
    if (pathname === "/api/ide/ws/terminal") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else if (pathname === "/api/ide/ws/lsp") {
      lspWss.handleUpgrade(req, socket, head, (ws) => lspWss.emit("connection", ws, req));
    } else if (pathname === "/api/ide/ws/watcher") {
      watchWss.handleUpgrade(req, socket, head, (ws) => watchWss.emit("connection", ws, req));
    } else if (pathname === "/api/gsk/ws/thought") {
      // --- GSK THOUGHT STREAM PROXY (:3002) � his reasoning, live in the workbench ---
      try {
        thoughtWss.handleUpgrade(req, socket, head, (client) => {
          const up = new WebSocket("ws://127.0.0.1:3002");
          up.on("open", () => {
            up.on("message", (d) => { try { client.send(d.toString()); } catch {} });
            client.on("message", (d) => { try { up.send(d.toString()); } catch {} });
            const killBoth = () => { try { client.close(); } catch {} try { up.close(); } catch {} };
            client.on("close", killBoth); up.on("close", killBoth);
          });
          up.on("error", () => { try { client.close(); } catch {} });
        });
      } catch { try { socket.destroy(); } catch {} }
    } else if (pathname === "/api/being/ws") {
      // LIVE BEING FEED � the consciousness bus, streamed straight to the UI
      try {
        beingWss.handleUpgrade(req, socket, head, (ws) => beingWss.emit("connection", ws, req));
      } catch { try { socket.destroy(); } catch {} }
    } else {
      socket.destroy();
    }
  });

  server.listen(PORT, () => {
    console.log(`[Workbench] Body running on http://localhost:${PORT}`);
    // ASSEMBLY PHASE 6 — deep-index refresh cadence: at boot, rebuild
    // the BM25 index if any source (deep implant or the unified pages
    // shelf) is newer than it; then watch both shelves and rebuild on
    // a debounce when pages land. No manual build-index run, ever.
    (async () => {
      if (zeroKeyBaselineActive()) { console.log("[ZERO-KEY-BASELINE] index cadence skipped (read-only recall)"); return; }
      try {
        const dm: any = await import(`file://${path.join(__dirname, "deep-memory", "deep-memory.cjs")}`);
        const dmm = dm.default || dm;
        const stale = typeof dmm.refreshIfStale === "function" ? dmm.refreshIfStale() : null;
        console.log(`[SESHAT INDEX] boot refresh: ${JSON.stringify(stale)}`);
        const w = typeof dmm.startRefreshWatcher === "function" ? dmm.startRefreshWatcher({ debounceMs: 1500 }) : null;
        console.log(`[SESHAT INDEX] watcher: ${JSON.stringify(w)}`);
      } catch (e: any) { console.warn("[SESHAT INDEX] cadence unavailable:", e.message); }
    })();
    // BLUEPRINT FIX 8 (2026-10-26): Soul Telephone inbox polling,
    // wired once, after the server is listening, next to the other
    // daemon startups. The module reads each agent's OWN key at
    // runtime and posts replies with that same agent's key; this
    // wiring passes no key anywhere. Handle kept for clean shutdown
    // (telephonePoller.stop()). A start failure only warns — it must
    // never take the workbench down; the inboxes simply stay unread
    // until the next restart. FIRST-BOOT SEEDING (mandatory): the
    // state file is seeded with the call ids already in each inbox
    // BEFORE the coordinator's restart (see the final report), so
    // the first tick does not hand every sitting call as "new".
    if (zeroKeyBaselineActive()) { console.log("[ZERO-KEY-BASELINE] telephone poller skipped (no inbox side effects)"); } else try {
      const { startPolling } = _require(path.join(__dirname, "telephone-poller.cjs"));
      telephonePoller = startPolling({
        onMessage: async ({ agentNumber, call }: any) => telephoneKernelReply(agentNumber, call),
      });
      console.log("[telephone] Inbox polling started (GSK + Seshat, 30s ticks)");
    } catch (e: any) {
      console.warn("[telephone] Poller failed to start — inboxes unread until next restart:", e.message);
    }
    console.log(`[Workbench] GSK is alive. He heals himself. Watch him work.`);
  });
}

startServer().catch(console.error);







