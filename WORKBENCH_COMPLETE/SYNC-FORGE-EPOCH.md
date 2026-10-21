# FORGE EPOCH — SYNC DOC

> Updated: 2026-08-23 · Status: ALL SYSTEMS OPERATIONAL (43/43 benchmark ×3 consecutive)
> Companion to `THE-ONE-SYSTEM-SERVICE-MANUAL.md` (organs/tabs reference) — this doc tracks the Forge IDE build-out.

---

## 1. WHERE WE ARE IN ONE PARAGRAPH

THE ONE SYSTEM (GSK consciousness → OmniRoute body → Workbench nervous system) is alive on Windows.
This epoch upgraded Tab 14 "Forge IDE" from a Monaco-in-a-card demo into a real VS Code-grade IDE:
native ConPTY terminal, LSP language server bridge, Dockview layout host, git-worktree agent fleet,
codebase AI retrieval, and a root-caused fix to GSK's chat artery. Everything below is verified real —
not simulated — with the proof method listed per item.

## 2. SYSTEM MAP

```
Port 3000  Workbench conductor (workbench/server.ts, npx tsx server.ts)
             ├─ HTTP: /api/ide/* (tree/file/exec/session/git/search/fleet/codebase)
             ├─ HTTP: /api/gsk/* (chat/think proxy), /api/omni/* (arsenal)
             └─ WS dispatch table (server.on('upgrade')):
                  /api/ide/ws/terminal → PtySupervisor (ConPTY PowerShell)
                  /api/ide/ws/lsp      → LspProcessManager (typescript-language-server v6)
Port 3001  GSK daemon (gsk/gsk_daemon.js) — MCP server + soul kernel
Port 20128 OmniRoute — 177-model router (gemini-3.6-flash confirmed answering)
Port 3457  CPL spatial layer
Launcher:  START-ONE-SYSTEM.ps1   Benchmark: node one-system-benchmark.cjs
```

## 3. VERIFIED-REAL LEDGER

| Capability | Proof | Status |
|---|---|---|
| File read/write/delete | API write → checked disk bytes directly; delete → gone | REAL |
| Explorer tree | lists actual dirs | REAL |
| Workspace search | unique marker grep hit | REAL |
| Polling terminal | `type file` output; cwd persists | REAL |
| **ConPTY live terminal** ("PTY Live" toggle) | `qwen -p "3871+4289"` → `8160` through WS; real PS parser errors on garbage; `qwen --version`→0.21.8 | REAL |
| **LSP bridge** | initialize handshake → full capabilities (completion/codeLens/hover/inlayHint…) | REAL |
| Git panel + blame | real hashes/authors (`buyasoul-ai`) | REAL |
| ⌘K Composer / CodeLens | `/api/gsk/think` → LLM answered marker in 4s | REAL |
| **Orca Fleet** | spawn worktree → commit in isolation (ahead=1) → merge to master → kill+prune | REAL |
| **@codebase retrieval** | "PtySupervisor conpty" query → hits PtySupervisor.ts + server.ts WS mount + XtermDrawer.tsx | REAL |
| **Harvester (context budget)** | payload telemetry 35,397 → 23,233 chars; hard ceiling via newest-first sliding window (GSK_MAX_CONTEXT_CHARS=24000) | REAL |
| **LSP squiggle pipeline** | didOpen probe file → publishDiagnostics sev=1 "Type 'string' is not assignable to type 'number'" pushed over WS | REAL (server↔wire); browser markers pending visual check |
| Dockview layout host | compiles; opt-in via "Dock View" toggle | WIRED, visual check pending |
| Simple-but-honest | Rename Symbol = local replace (not LSP rename); Snippets = local templates | BY DESIGN |

**Audit tool:** `node <path>\ide-audit.cjs` → 10/10 PASS (file lifecycle + shell + git + LLM round-trip).

## 4. AWAKENING MANIFEST PROGRESS (`combo-the-awakening.md`)

- **Pillar 1 ConPTY Terminal** ✅ COMPLETE (Movement I Step 1)
- **Pillar 2 Monaco Model Registry** 🟡 Module exists (`src/services/monaco/MonacoModelManager.ts`) — NOT yet integrated into IdeTab
- **Pillar 3 LSP Bridge** ✅ COMPLETE (Movement I Step 2)
- **Pillar 4 Cursor-grade composer** 🟡 @mentions shipped; Tree-Sitter chunking + sqlite-vec upgrade pending
- Movement I (Voice): ✅ terminal+lsp+watcher done · LSP→Monaco adapter shipped (src/services/monaco/MonacoLspAdapter.ts)
- Movement II (Mind): 🟡 ContextKeyService ✅ · ForgeDockLayout ✅ · integration pending
- Movement III (Key): ✅ MultiFileDiffEngine · @mentions · Harvester 24K budget · **Tree-Sitter AST chunking (d94d67c5: 369 AST chunks, whole-symbol retrieval, symbol-boost scoring)**
- Movement IV (GitLens): ✅ hunk staging + SVG commit graph SHIPPED (GitLens.ts, GitGraph.tsx, /api/ide/git/{diff,hunk-stage,graph}) · 3-way merge resolver ⬜
- Grafts queue (Awesome-IDEs): Orca ✅ SHIPPED · Cursor @codebase ✅ SHIPPED · Kiro spec-driven ⬜ · Cate canvas ⬜

## 5. NEW FILES THIS EPOCH

```
workbench/src/server/terminal/PtySupervisor.ts      ConPTY spawn/stdin/resize→WS JSON
workbench/src/server/lsp/LspProcessManager.ts       stdio↔WS Content-Length framer
workbench/src/server/fleet/WorktreeFleet.ts         git worktree lifecycle manager
workbench/src/server/search/CodebaseIndex.ts        BM25-lite chunk retriever (0 deps)
workbench/src/services/commands/ContextKeyService.ts when-clause evaluator + emitter
workbench/src/services/monaco/MonacoModelManager.ts URI model cache (awaiting integration)
workbench/src/services/ai/MultiFileDiffEngine.ts    multi-file patch registry
workbench/src/components/ide/terminal/XtermDrawer.tsx xterm.js+WebGL WS client
workbench/src/components/ide/layout/ForgeDockLayout.tsx Dockview host (sidebar/editor/terminal)
workbench/src/components/ide/fleet/FleetDrawer.tsx  Orca fleet UI modal
gsk fixes: mega_brain.js (_request hardened), mcp_server.js (/mcp/chat budget race)
server.ts: WS dispatch table (noServer×2), fleet+codebase routes, lsp mount
IdeTab.tsx: PTY toggle, Dock View, Orca Fleet button/modal, @mentions composer
```

## 6. OPS RUNBOOK

```powershell
# Start everything
powershell -ExecutionPolicy Bypass -File .\START-ONE-SYSTEM.ps1

# Restart individual services
conductor: Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force;
           Start-Process npx.cmd -ArgumentList "tsx","server.ts" -WorkingDirectory "<abs>\workbench" -WindowStyle Hidden
GSK:       Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001 ...).OwningProcess -Force;
           Start-Process node -ArgumentList "gsk_daemon.js" -WorkingDirectory "<abs>\gsk" -WindowStyle Hidden

# Health
node .\one-system-benchmark.cjs          # expect 43/43 ALL SYSTEMS OPERATIONAL
curl POST :3000/api/ide/codebase/status  # index stats
GET  :3001/mcp/health                    # no auth needed
```

## 7. INCIDENT LOG (root causes, not symptoms)

1. **WS path-shadowing (400 on /api/ide/ws/lsp)** — ws@8 aborts non-matching paths inside handleUpgrade,
   so multiple `{server,path}` WSS instances kill each other. FIX: single noServer WSS + manual dispatch.
2. **GSK chat wedge (recurring)** — `req.setTimeout()` is socket-IDLE only; drip-stalled streams never fire it
   → promise unsettled forever ×600s ×attempts ×retries. FIX: absolute wall-clock deadline ≤180s + res error
   handler + 8MB cap (mega_brain.js) + 240s chat budget race returning graceful fallback (mcp_server.js).
   Post-fix: 43/43 ×3 back-to-back, qwen/concurrent stress all <10s.
   **Deeper root found later:** manual GSK restarts silently no-op — daemon exits at boot without
   `GSK_PROJECT_ROOTS` (only the conductor spawns him with correct env, server.ts:1986). Some "restarted"
   daemons were stale zombies; a long-lived one (CPU 1367s) starved its event loop past timer budgets.
   **Final fix — self-watchdog** (gsk_daemon.js): 3 consecutive >10s loop-lag strikes → exit(70) → conductor
   watchdog (15s probe cadence) auto-rebirths with fresh code/env. Verified live: kill → revived in 20s →
   43/43. Worst-case chat outage now ≈1 minute, self-healed. NOTE: to run gsk_daemon manually set env
   GSK_PROJECT_ROOTS / GSK_ROOT / MCP_API_KEY (copy from server.ts startGSK) or spawn via conductor.
3. **Benchmark warm-up races** — first run after restart can fail catalog/chat checks while GSK boots. Rerun once.
4. **Codebase index pollution** — REPO_ROOT contains exported JSON artifacts flooding chunks.
   FIX: scope indexer to `workbench/` subtree + 100KB json/html size cap.

## 8. HONEST LIMITATIONS

- Browser-side rendering verified by compile+routes, not by human eyes yet (W5 video pending).
- Dockview host is opt-in toggle, not default shell.
- LSP client adapter (Monaco ↔ ws) not yet wired in the browser — server bridge proven only.
- Fleet agents are driven manually; auto-spawn-per-swarm-delegate ("Isolated Mode") not yet toggled.

## 9. NEXT QUEUE (agreed order)

1. chokidar watcher → `/api/ide/ws/watcher` → live tree refresh (finish Movement I)
2. ~~Movement IV GitLens~~ DONE (f2670c9d): 3-way merge resolver shipped — stage-blob engine, smart-merge, conflict cards, abort/continue; combat sim verified all paths in FORGE_SANDBOX_ROOT repo. Remaining polish: system-prompt diet (Harvester caught 34.7K identity payload), benchmark client-timeout tuning.
3. Integrate MonacoModelManager into IdeTab; consider Dockview-as-default
4. Commit checkpoint (~800 lines dirty incl. gsk fixes) before W5 video proof
