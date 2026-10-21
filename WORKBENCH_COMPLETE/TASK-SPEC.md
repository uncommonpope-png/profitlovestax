# TASK SPEC — Phase A+B Dispatch (Strict Orders)

## Coordinator: top-level session | Workers report back in specified format

## FILE OWNERSHIP (violations = rejected work)
- **THE HAMMER** (backend): `workbench/server.ts`, process control, benchmark runs. MUST NOT touch anything under `workbench/src/`.
- **THE SURGEON** (frontend): `workbench/src/App.tsx` ONLY. MUST NOT touch `server.ts`. Minimal diff.
- Neither worker commits to git. Coordinator commits after Ultra Review passes.

---

## THE HAMMER — Backend Specialist

### H1. Discover the REAL GSK MCP API key (do not assume)
The running GSK (port 3001) rejects both `gsk-dev-key` and `gsk-mcp-key-dev`.
Steps:
- `wmic process where processid=<pid_on_3001> get commandline` — inspect launch flags/env hints
- Search repo for `.env*` files and any hardcoded keys near `MCP_API_KEY`
- Probe: `curl -m 3 -X POST http://127.0.0.1:3001/mcp/status -H "x-api-key: <candidate>"` for each candidate (`gsk-dev-key`, `gsk-mcp-key-dev`, `92140facf0a3b8484f85b9d343687a95703e91b4724928e2ec78b8fd9d4aefc6`, anything found in env files)
- ACCEPTANCE: you can state the exact working key, proven by a non-unauthorized response.

### H2. Make server.ts + GSK spawn agree on that key
- Set `GSK_MCP_KEY` fallback in `workbench/server.ts` to the verified key.
- Find where the workbench/conductor spawns GSK; ensure it passes `MCP_API_KEY=<verified key>` in the child env so future respawns match.
- ACCEPTANCE: grep shows single consistent key source; no divergent fallbacks remain.

### H3. Fix the `/api/gsk/status` hang (~server.ts:120-159)
Current: Promise.allSettled of `/mcp/health` (5s) + `/mcp/execute consciousness.state` (10s) — the second call hangs.
- Reduce timeouts: health 3000ms, consciousness 4000ms.
- If consciousness.state keeps hanging even with the right key, swap it for a cheap tool (e.g. `plt.scores` or `memory.list` with limit 1) — whatever responds fast with the verified key.
- ACCEPTANCE: `curl -m 8 http://127.0.0.1:3000/api/gsk/status` returns JSON with `success:true` (or structured partial) in under 8s, every time (run 3x).

### H4. Normalize `GET /api/gsk/memories`
Every returned memory object MUST have: `type:string` (default `"memory"`), `summary:string` (fallback chain: summary → content → text → JSON.stringify(m).slice(0,200)).
ACCEPTANCE: response contains ≥0 items, zero items missing either field.

### H5. Normalize `GET /api/soul-economy/journal`
Every entry MUST have `content:string` (fallback chain: content → text → body → JSON.stringify(e).slice(0,300)).
ACCEPTANCE: 10 entries, all with non-empty content.

### H6. Context Mirror backend (Phase B)
- New route `POST /api/gsk/context`: store payload in module-level `let latestContext`; respond `{success:true}`; fire-and-forget `gskMCPRequest("/mcp/execute", {tool:"brain.context_update", args:{...}})` inside try/catch — NEVER crash route if GSK down.
- In the `/api/gsk/chat` handler: if `latestContext` exists, prepend `[WORKBENCH CONTEXT] tab=… skills=… provider=… model=… agent=…` to the outbound context; add `console.log("[CTX] injected into chat")`.
- ACCEPTANCE: POST context → POST chat → server log shows `[CTX] injected into chat`.

### H7. Clean restart
Kill PIDs on :3000 and :3001. Relaunch workbench (`npx tsx server.ts` in workbench dir, background, log to file). Wait for :3000 LISTENING and GSK respawn on :3001.
ACCEPTANCE: `/mcp/health` ok; workbench health 200.

### H8. Re-run benchmark (20/20 target)
Copy `one-system-benchmark.js` to `C:\Users\uncom\AppData\Local\Temp\opencode\` (path spaces break cmd) and run. Tests 07/08/16/17 must now PASS.
ACCEPTANCE: 20/20 PASS, paste full output.

### REPORT BACK FORMAT
```
HAMMER REPORT
H1 key: <verified key> (proof: <response snippet>)
H2: <files changed>
H3: <final approach + 3 timings>
H4/H5: <normalization summary>
H6: <log line proof>
H7: <new PIDs :3000/:3001>
H8: <benchmark output 20 lines>
Deviations: <none | list>
```

---

## THE SURGEON — Frontend Specialist

### S1. Recon (read-only)
Read `workbench/src/App.tsx`. Identify exact identifiers/state for: active tab, equipped/active skills, provider config, model, profile name. Note their declaration lines.

### S2. Context Mirror effect
Add ONE `useEffect` near the other top-level effects:
- Dependencies: those state values.
- Debounce 800ms (setTimeout + cleanup).
- Body: `fetch("/api/gsk/context", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({activeTab, equippedSkills: <ids array>, provider, model, profileName})}).catch(()=>{})` — silent failure, no toast, no state writes.
- No new dependencies, no renames, minimal diff.

### S3. Type-check
Run `npx tsc --noEmit` in `workbench/` (or repo's type-check script). Zero NEW errors attributable to your change.

### REPORT BACK FORMAT
```
SURGEON REPORT
Anchors found: <identifiers + line numbers>
Diff summary: <+lines/-lines, functions touched>
tsc: <pass | pre-existing errors listed separately>
Deviations: <none | list>
```

---

## ULTRA REVIEW AGENT — runs AFTER both workers finish (coordinator dispatches)

Binary checklist (each = command + expected):
1. `git diff --stat` — only server.ts + App.tsx (+log files excluded); no stray files staged
2. `git diff` on App.tsx — one useEffect added, no renames/removals
3. `grep -c "gsk-dev-key\|gsk-mcp-key-dev" server.ts` — matches H1-verified key only
4. `curl -m 8 :3000/api/gsk/status` ×3 — all <8s, valid JSON
5. memories: every item has type+summary
6. journal: every entry non-empty content
7. POST /api/gsk/context → POST /api/gsk/chat → log contains `[CTX] injected into chat`
8. benchmark output shows 20/20 PASS
9. `npx tsc --noEmit` — no new errors
10. no secrets/API keys committed beyond existing patterns
VERDICT: PASS | FAIL(reasons) — coordinator commits only on PASS.
