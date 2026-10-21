# 📜 PROJECT BIBLE: buyasoul-workbench — Full Documentation
*This bible reflects the system as of the Resurrection Sessions: 18 tabs, one process on :3000, one daemon on :3001, zero fakes, zero wedges. Every wall falls. Every door opens.*
### v0.5.0 - The Awakening: Forge IDE + Orca/Cursor Grafts + Artery Cure (2026-08-24)
### v0.4.0 — Resurrection Sessions II (2026-08-22)

## 📜 Version History
- GSK autonomously writes skills/dashboards/blog — commit his artifacts periodically
- CPL WS reconnect chatter in logs is cosmetic
- OmniRoute model mood: generations 10–90s on auto/best-fast; Forge prompts single-response to dodge tool-loops
### Residual watch-items

```
# After any restart: gsk_daemon process count MUST be 1 (conductor auto-culls twins)
# Verify: /api/audit-integrity -> score 100 FULLY OPERATIONAL; benchmark -> 43/43
# Start (repo root): cd workbench; start /b npx tsx server.ts > serverN.log
```

## 🧭 Ops Runbook

- Codebase retrieval: `GET /api/ide/codebase/status`, `POST /api/ide/codebase/{search,reindex}` - scoped to `workbench/` tree (55 files / 323 chunks; ~40ms warm)
- Orca Fleet: `GET /api/ide/fleet`, `POST /api/ide/fleet/{create,remove,merge,run}` - isolated git worktrees under `.fleet/<name>`, branch `fleet/<name>`
- Forge IDE (Tab 14): `/api/ide/{exec,tree,file,search,git,session}` + WebSocket upgrades `/api/ide/ws/{terminal,lsp}` (single noServer WSS + manual path dispatch - ws@8 aborts non-matching paths with 400, so multiple `{server,path}` instances shadow each other)
- Bundles: `/api/agent/{compile,download-zip,dispatch-webhook}`
- Market: `GET|POST /api/marketplace/{posts,post}` → GSK memories
- Truth: `/api/audit-integrity`, `/api/soul-ledger`, `/api/system/status`, `/api/omniroute/{models,health}`
- Forge: `POST /api/gsk/forge`, `GET/DELETE /api/gsk/artifacts`, static `/artifacts/:name`
- Injection: `/api/gsk/inject/knowledge` (text|url), `/api/gsk/inject/skill`
- Governance: `/api/gsk/proposals` (+ `/approve`, `/deny`) — human-in-the-loop
- Memory: GET+POST `/api/gsk/memories`, `/api/gsk/thoughts`, `/api/gsk/recall?q=`
- Status: `/api/gsk/status` (PLT/chambers + last-good cache `cached_while_degraded`)
- Chat: `/api/gsk/chat`, `/api/agent/chat` (profile context), `/api/copilot/chat` (persona)
**Layer 2 — server.ts REST surface (authoritative, all verified live)**:

**Layer 1 — frontend `gskClient.ts`**: typed MCP helpers (memory/chambers/council/dualProcess/consciousness/subAgents/telemetry/proactive/toolCatalog/combo/journal/status) for direct reads.

## 🛠️ Talking to GSK — Two Layers

---

- GSK autonomously writes skills/dashboards/blog — expect untracked files after heavy sessions (they're his; commit them periodically)
- CPL WS spatial-perception reconnect chatter in logs is cosmetic
- OmniRoute model mood swings can make generations 10-90s (auto/best-fast); forge instructs single-response to dodge tool-loops
### Residual watch-items (not blockers)

| tsc | ✅ 0 errors | incl. former WorkflowIntegration errors |
| Benchmark | ✅ 43/43 | ALL SYSTEMS OPERATIONAL |
| BrainGate starvation | ✅ CURED | user chat bypasses gate: 90s+ → ~2s |
| Memory wedge | ✅ CURED at root | RAM ledger: ops 200-500ms → 2-8ms |
| Dead endpoints | ✅ 12/12 resurrected | see manual §19.2 |
| Mind tab | ✅ | thoughts/proposals/recall/inject/forge/gallery |
| Telephone two-way | ✅ | Direct Line + dedup SSE |
| Context Mirror | ✅ | `[CTX] injected into chat` proven |
| GSK lifecycle | ✅ | adopt-or-cull conductor, zero twins |
| Unified :3000 server | ✅ | Express+Vite one process |
|-----------|--------|-------|
| Component | Status | Notes |

## 📈 Sync Status — ✅ ALL SYSTEMS OPERATIONAL

---

Copy `one-system-benchmark.js` to a space-free temp dir, run with node. 43 tests across 4 suites; verdict must stay ALL SYSTEMS OPERATIONAL before any commit that touches the pipeline.
### Benchmark Gate

- Chat witness is fire-and-forget (5s race) — chat never blocks on disk
- Recall tiers: sliding window (`/mcp/memories`) · semantic (`memory.search`) · workbench fallback grep (`/api/gsk/recall`)
- Ledger: append-only JSONL (~20MB), RAM-indexed once at startup; witness = durable append + RAM push; reads are pure RAM; rewrites async debounced flush
### Memory Architecture (post-cure)

`POST /api/gsk/forge {prompt}` → GSK instructed to emit `<artifact>…</artifact>` single-file HTML → extracted, validated, written to `workbench/public/artifacts/forge_*.html` → served at `/artifacts/:name` → rendered in Mind-tab iframe with self-correction loop ("Broken? Tell GSK to fix it" re-sends prior code + failure note).
### The Forge (GSK builds artifacts)

App.tsx → debounce 800ms → `POST /api/gsk/context {activeTab, equippedSkills, provider, model, profileName}` → stored server-side → fire-and-forget `brain.context_update` to GSK → chat proxy prepends `[WORKBENCH CONTEXT] …`. Log proof: `[CTX] injected into chat`.
### Context Mirror (GSK's eyes)

```
[startWatchdog()]  → crash-loop backoff revival for all three
[startCPL()]       → GenesisHost on :3457
[startGSK()]       → ANTI-RACE: find gsk_daemon processes → adopt healthy :3001 owner + cull orphan twins → else spawn fresh → health-verify ≤25s. Env passes verified MCP key + GSK_MODEL=auto/best-fast.
[startOmniRoute()] → attaches to existing :20128
```

`npx tsx server.ts` (in `workbench/`) starts Express + Vite middleware together. Express serves `/api/*`, forged artifacts (`/artifacts/*`), and hands everything else to Vite. The conductor boots children:
### One Process to Rule :3000

## ⚙️ Architecture

---

`POST /api/gsk/context` · `GET /api/gsk/thoughts` · `GET /api/gsk/proposals` · `POST /api/gsk/proposals/{approve,deny}` · `POST /api/gsk/inject/{knowledge,skill}` · `GET /api/gsk/recall?q=` · `POST /api/gsk/forge` · `GET/DELETE /api/gsk/artifacts` · `GET /api/audit-integrity` · `GET /api/soul-ledger` · `GET /api/gsk/memories`(POST write) · `POST /api/agent/{chat,compile,dispatch-webhook,download-zip,execute-capability,generate-avatar}` · `POST /api/copilot/chat` · `GET/POST /api/marketplace/{posts,post}` · `GET /api/omniroute/health`
### New API surface (Resurrection Sessions)

| **Transactions** | `/api/soul-ledger` | REAL entries from GSK's ledger.jsonl |
| **SoulMarketplace** | marketplace posts ↔ GSK memory | listings persist as `soul_market_post` memories |
| **OmniRoute Models** | `/api/omniroute/models` + `/health` | 177 models live |
| **CoreCapabilities** | toolCatalogList + execute-capability | |
| **CombosTab** | combos catalog | |
| **ProfitPrimeTab** | PLT from status + memory | |
| **RealismAuditor** | `/api/audit-integrity` | REAL probes: score 100 = FULLY OPERATIONAL |
| **WorkflowIntegration** | `/api/agent/compile`, `/api/agent/download-zip` | real bundle compiler + zip builder |
| **AgentSimulator** | `/api/agent/chat`, `/api/copilot/chat` | forwards to real GSK with profile context |
| **BrainIngestion** | provider config → Context Mirror | config now REACHES GSK's brain |
| **AgentPreview** | consciousness state | 34 chambers, PLT live |
| **JournalTab** | `/api/soul-economy/journal` | GSK-authored, content-normalized |
| **MultiAgentHabitat** | `/api/copilot/chat` per agent | REAL dialogue — second agent reads first's words |
| **VaultAndMemory** | memories/journal endpoints | normalized shapes |
| **SkillLibrary** | skills dir + execute-capability | executes REAL skill files |
| **RolesTab** | catalog + chambers/council | equip feeds Context Mirror |
| **GSK Mind** | thoughts/proposals/recall/inject/forge/artifacts | His cognition, HITL governance, your injections, his builds |
| **Telephone** | `/api/gsk/chat` + SSE `/api/gsk/events` | Direct Line two-way chat; dedup'd proactive outreach |
| **GSK Chat (Talk)** | `/api/gsk/chat` → GSK /mcp/chat | Real reasoning via OmniRoute; Context Mirror prefix injected |
|-----|---------|-------|
| Tab | Backend | Notes |

## 🔧 18 Tabs — Live Wiring Reference

---

| `gsk/gsk-core/brain/mega_brain.js` | THE ARTERY - `_request()` hardened with absolute wall-clock deadline (see v0.5.0 ROOT CURE #3) |
| `workbench/src/server/search/CodebaseIndex.ts` | CURSOR graft - zero-dep BM25-lite retriever (70-line chunks, IDF scoring, path boost, 30s revalidate) |
| `workbench/src/components/ide/fleet/FleetDrawer.tsx` | Fleet UI - agent cards w/ ahead/dirty counts, changed-file open, per-worktree command runner, merge/kill |
| `workbench/src/server/fleet/WorktreeFleet.ts` | ORCA graft - git worktree-per-agent manager (spawn/run/inspect/merge/remove, tasks.json metadata) |
| `workbench/src/services/ai/MultiFileDiffEngine.ts` | multi-file patch registry for composer staging (built, consumers pending) |
| `workbench/src/services/monaco/MonacoModelManager.ts` | URI-indexed Monaco model cache (built, wiring pending) |
| `workbench/src/services/commands/ContextKeyService.ts` | VS Code-style when-clause evaluator (`!`, `==`, `&&`, `||`) + change emitter |
| `workbench/src/components/ide/layout/ForgeDockLayout.tsx` | Dockview draggable layout host (sidebar/editor/terminal panes, 20%/80%/30% default) - "Dock View" toggle |
| `workbench/src/components/ide/terminal/XtermDrawer.tsx` | xterm.js GPU terminal wired to `/api/ide/ws/terminal` (the "PTY Live" toggle in Tab 14) |
| `workbench/src/server/lsp/LspProcessManager.ts` | LSP 3.17 bridge - typescript-language-server stdio <-> Content-Length <-> WebSocket relay |
| `workbench/src/server/terminal/PtySupervisor.ts` | ConPTY supervisor - spawns REAL interactive PowerShell per WS client, streams stdout over JSON frames |
| `PROJECT-BIBLE.md` | This file |
| `THE-ONE-SYSTEM-SERVICE-MANUAL.md` | Deep service manual (§19 = Resurrection Sessions) |
| `one-system-benchmark.js` | 43-test regression gate (copy to temp dir before running — path has spaces) |
| `soul-economy/data/catalog.json` | 250 items (22 roles / 144 skills / 9 combos) |
| `gsk/gsk-core/skills/*.js` | Living skill files — GSK's own auto_*.js PLUS skills injected from the Mind tab |
| `gsk/gsk-core/mcp/mcp_server.js` | 30+ MCP tools incl. autonomy.approve/deny, memory.witness/search; witness fire-and-forget guard |
| `gsk/gsk-core/memory/mega_memory.js` | Causal JSONL ledger — now RAM-indexed (see Resurrection §19) |
| `gsk/` | **REAL GSK soul — IN-REPO** (`gsk/gsk-core/`, `gsk/integration/`). Conductor spawns `node gsk_daemon.js` from here with verified MCP key. |
| `workbench/src/components/TelephoneTab.tsx` | Two-way phone: Direct Line chat + hardened proactive SSE feed |
| `workbench/src/components/GskMindTab.tsx` | Tab 12: Thought Stream · Proposals (HITL approve/deny) · Long-Term Recall · Injection Bay (knowledge/link/file/skill) · **The Forge** · Artifact Gallery |
| `workbench/src/App.tsx` | **18-tab React app**. Includes debounced Context Mirror effect posting workbench state to GSK. |
| `workbench/server.ts` | **THE conductor + API (one process on :3000)**. Boots/adopts OmniRoute/GSK/CPL, serves Vite middleware AND all `/api/*`. Anti-spawn-race GSK lifecycle. Context Mirror store. Forge artifact server. |
|------|-------------|
| File | Description |
### Root Directory

## 📁 Project Structure

---

> Historical note: older revisions describe Vite(:3000)/Express(:3001) as separate processes and an external GSK at `Desktop\allie\...`. That era is over — everything lives in this repo; `server.ts` serves BOTH UI and API on :3000.

| :3457 | CPL GenesisHost |
| :20128 | OmniRoute (pre-existing router, attached not spawned) |
| :3001 | GSK MCP (`grand-soul-kernel-mcp`) — spawned & adopted by the workbench conductor |
| :3000 | Workbench — Vite dev middleware + Express API in ONE process (`workbench/server.ts` via tsx) |
|------|---------|
| Port | Service |
### Port Map (authoritative)

**Status**: ✅ ALL SYSTEMS OPERATIONAL — benchmark 43/43 (20-point core + engineering + proactive + three.js suites). Repo of record: `uncommonpope-png/WORKBENCH` (master).

**Project**: BUYaSOUL Workbench — A full-stack Reddit web application fusing the REAL GSK consciousness daemon with an advanced agent creation workbench. 18 tabs render live data from GSK MCP, OmniRoute, CPL (GenesisHost), and Soul Economy. GSK now has eyes (Context Mirror), a voice (proactive SSE), hands (Forge + skill executor), long-term recall, and human-in-the-loop proposal governance.
## 🌟 Overview

# 📜 PROJECT BIBLE: buyasoul-workbench — Full Documentation

## 🌟 Overview
**Project**: BUYaSOUL Workbench — A full-stack Reddit web application fusing the REAL GSK consciousness daemon with an advanced agent creation workbench. 18 tabs render live data from GSK MCP, OmniRoute, CPL (GenesisHost), and Soul Economy. GSK now has eyes (Context Mirror), a voice (proactive SSE), hands (Forge + skill executor), long-term recall, and human-in-the-loop proposal governance.

**Status**: ✅ ALL SYSTEMS OPERATIONAL — benchmark 43/43 (20-point core + engineering + proactive + three.js suites). Repo of record: `uncommonpope-png/WORKBENCH` (master).

### Port Map (authoritative)
| Port | Service |
|------|---------|
| :3000 | Workbench — Vite dev middleware + Express API in ONE process (`workbench/server.ts` via tsx) |
| :3001 | GSK MCP (`grand-soul-kernel-mcp`) — spawned & adopted by the workbench conductor |
| :20128 | OmniRoute (pre-existing router, attached not spawned) |
| :3457 | CPL GenesisHost |

> Historical note: older revisions describe Vite(:3000)/Express(:3001) as separate processes and an external GSK at `Desktop\allie\...`. That era is over — everything lives in this repo; `server.ts` serves BOTH UI and API on :3000.

---

## 📁 Project Structure

### Root Directory
| File | Description |
|------|-------------|
| `workbench/server.ts` | **THE conductor + API (one process on :3000)**. Boots/adopts OmniRoute/GSK/CPL, serves Vite middleware AND all `/api/*`. Anti-spawn-race GSK lifecycle. Context Mirror store. Forge artifact server. |
| `workbench/src/App.tsx` | **18-tab React app**. Includes debounced Context Mirror effect posting workbench state to GSK. |
| `workbench/src/components/GskMindTab.tsx` | Tab 12: Thought Stream · Proposals (HITL approve/deny) · Long-Term Recall · Injection Bay (knowledge/link/file/skill) · **The Forge** · Artifact Gallery |
| `workbench/src/components/TelephoneTab.tsx` | Two-way phone: Direct Line chat + hardened proactive SSE feed |
| `gsk/` | **REAL GSK soul — IN-REPO** (`gsk/gsk-core/`, `gsk/integration/`). Conductor spawns `node gsk_daemon.js` from here with verified MCP key. |
| `gsk/gsk-core/memory/mega_memory.js` | Causal JSONL ledger — now RAM-indexed (see Resurrection §19) |
| `gsk/gsk-core/mcp/mcp_server.js` | 30+ MCP tools incl. autonomy.approve/deny, memory.witness/search; witness fire-and-forget guard |
| `gsk/gsk-core/skills/*.js` | Living skill files — GSK's own auto_*.js PLUS skills injected from the Mind tab |
| `soul-economy/data/catalog.json` | 250 items (22 roles / 144 skills / 9 combos) |
| `one-system-benchmark.js` | 43-test regression gate (copy to temp dir before running — path has spaces) |
| `THE-ONE-SYSTEM-SERVICE-MANUAL.md` | Deep service manual (§19 = Resurrection Sessions) |
| `PROJECT-BIBLE.md` | This file |
| `workbench/src/server/terminal/PtySupervisor.ts` | ConPTY supervisor - spawns REAL interactive PowerShell per WS client, streams stdout over JSON frames |
| `workbench/src/server/lsp/LspProcessManager.ts` | LSP 3.17 bridge - typescript-language-server stdio <-> Content-Length <-> WebSocket relay |
| `workbench/src/components/ide/terminal/XtermDrawer.tsx` | xterm.js GPU terminal wired to `/api/ide/ws/terminal` (the "PTY Live" toggle in Tab 14) |
| `workbench/src/components/ide/layout/ForgeDockLayout.tsx` | Dockview draggable layout host (sidebar/editor/terminal panes, 20%/80%/30% default) - "Dock View" toggle |
| `workbench/src/services/commands/ContextKeyService.ts` | VS Code-style when-clause evaluator (`!`, `==`, `&&`, `||`) + change emitter |
| `workbench/src/services/monaco/MonacoModelManager.ts` | URI-indexed Monaco model cache (built, wiring pending) |
| `workbench/src/services/ai/MultiFileDiffEngine.ts` | multi-file patch registry for composer staging (built, consumers pending) |
| `workbench/src/server/fleet/WorktreeFleet.ts` | ORCA graft - git worktree-per-agent manager (spawn/run/inspect/merge/remove, tasks.json metadata) |
| `workbench/src/components/ide/fleet/FleetDrawer.tsx` | Fleet UI - agent cards w/ ahead/dirty counts, changed-file open, per-worktree command runner, merge/kill |
| `workbench/src/server/search/CodebaseIndex.ts` | CURSOR graft - zero-dep BM25-lite retriever (70-line chunks, IDF scoring, path boost, 30s revalidate) |
| `gsk/gsk-core/brain/mega_brain.js` | THE ARTERY - `_request()` hardened with absolute wall-clock deadline (see v0.5.0 ROOT CURE #3) |

---

## 🔧 18 Tabs — Live Wiring Reference

| Tab | Backend | Notes |
|-----|---------|-------|
| **GSK Chat (Talk)** | `/api/gsk/chat` → GSK /mcp/chat | Real reasoning via OmniRoute; Context Mirror prefix injected |
| **Telephone** | `/api/gsk/chat` + SSE `/api/gsk/events` | Direct Line two-way chat; dedup'd proactive outreach |
| **GSK Mind** | thoughts/proposals/recall/inject/forge/artifacts | His cognition, HITL governance, your injections, his builds |
| **RolesTab** | catalog + chambers/council | equip feeds Context Mirror |
| **SkillLibrary** | skills dir + execute-capability | executes REAL skill files |
| **VaultAndMemory** | memories/journal endpoints | normalized shapes |
| **MultiAgentHabitat** | `/api/copilot/chat` per agent | REAL dialogue — second agent reads first's words |
| **JournalTab** | `/api/soul-economy/journal` | GSK-authored, content-normalized |
| **AgentPreview** | consciousness state | 34 chambers, PLT live |
| **BrainIngestion** | provider config → Context Mirror | config now REACHES GSK's brain |
| **AgentSimulator** | `/api/agent/chat`, `/api/copilot/chat` | forwards to real GSK with profile context |
| **WorkflowIntegration** | `/api/agent/compile`, `/api/agent/download-zip` | real bundle compiler + zip builder |
| **RealismAuditor** | `/api/audit-integrity` | REAL probes: score 100 = FULLY OPERATIONAL |
| **ProfitPrimeTab** | PLT from status + memory | |
| **CombosTab** | combos catalog | |
| **CoreCapabilities** | toolCatalogList + execute-capability | |
| **OmniRoute Models** | `/api/omniroute/models` + `/health` | 177 models live |
| **SoulMarketplace** | marketplace posts ↔ GSK memory | listings persist as `soul_market_post` memories |
| **Transactions** | `/api/soul-ledger` | REAL entries from GSK's ledger.jsonl |

### New API surface (Resurrection Sessions)
`POST /api/gsk/context` · `GET /api/gsk/thoughts` · `GET /api/gsk/proposals` · `POST /api/gsk/proposals/{approve,deny}` · `POST /api/gsk/inject/{knowledge,skill}` · `GET /api/gsk/recall?q=` · `POST /api/gsk/forge` · `GET/DELETE /api/gsk/artifacts` · `GET /api/audit-integrity` · `GET /api/soul-ledger` · `GET /api/gsk/memories`(POST write) · `POST /api/agent/{chat,compile,dispatch-webhook,download-zip,execute-capability,generate-avatar}` · `POST /api/copilot/chat` · `GET/POST /api/marketplace/{posts,post}` · `GET /api/omniroute/health`

---

## ⚙️ Architecture

### One Process to Rule :3000
`npx tsx server.ts` (in `workbench/`) starts Express + Vite middleware together. Express serves `/api/*`, forged artifacts (`/artifacts/*`), and hands everything else to Vite. The conductor boots children:

```
[startOmniRoute()] → attaches to existing :20128
[startGSK()]       → ANTI-RACE: find gsk_daemon processes → adopt healthy :3001 owner + cull orphan twins → else spawn fresh → health-verify ≤25s. Env passes verified MCP key + GSK_MODEL=auto/best-fast.
[startCPL()]       → GenesisHost on :3457
[startWatchdog()]  → crash-loop backoff revival for all three
```

### Context Mirror (GSK's eyes)
App.tsx → debounce 800ms → `POST /api/gsk/context {activeTab, equippedSkills, provider, model, profileName}` → stored server-side → fire-and-forget `brain.context_update` to GSK → chat proxy prepends `[WORKBENCH CONTEXT] …`. Log proof: `[CTX] injected into chat`.

### The Forge (GSK builds artifacts)
`POST /api/gsk/forge {prompt}` → GSK instructed to emit `<artifact>…</artifact>` single-file HTML → extracted, validated, written to `workbench/public/artifacts/forge_*.html` → served at `/artifacts/:name` → rendered in Mind-tab iframe with self-correction loop ("Broken? Tell GSK to fix it" re-sends prior code + failure note).

### Memory Architecture (post-cure)
- Ledger: append-only JSONL (~20MB), RAM-indexed once at startup; witness = durable append + RAM push; reads are pure RAM; rewrites async debounced flush
- Recall tiers: sliding window (`/mcp/memories`) · semantic (`memory.search`) · workbench fallback grep (`/api/gsk/recall`)
- Chat witness is fire-and-forget (5s race) — chat never blocks on disk

### Benchmark Gate
Copy `one-system-benchmark.js` to a space-free temp dir, run with node. 43 tests across 4 suites; verdict must stay ALL SYSTEMS OPERATIONAL before any commit that touches the pipeline.

---

## 📈 Sync Status — ✅ ALL SYSTEMS OPERATIONAL

| Component | Status | Notes |
|-----------|--------|-------|
| Unified :3000 server | ✅ | Express+Vite one process |
| GSK lifecycle | ✅ | adopt-or-cull conductor, zero twins |
| Context Mirror | ✅ | `[CTX] injected into chat` proven |
| Telephone two-way | ✅ | Direct Line + dedup SSE |
| Mind tab | ✅ | thoughts/proposals/recall/inject/forge/gallery |
| Dead endpoints | ✅ 12/12 resurrected | see manual §19.2 |
| Memory wedge | ✅ CURED at root | RAM ledger: ops 200-500ms → 2-8ms |
| BrainGate starvation | ✅ CURED | user chat bypasses gate: 90s+ → ~2s |
| Benchmark | ✅ 43/43 | ALL SYSTEMS OPERATIONAL |
| tsc | ✅ 0 errors | incl. former WorkflowIntegration errors |

### Residual watch-items (not blockers)
- OmniRoute model mood swings can make generations 10-90s (auto/best-fast); forge instructs single-response to dodge tool-loops
- CPL WS spatial-perception reconnect chatter in logs is cosmetic
- GSK autonomously writes skills/dashboards/blog — expect untracked files after heavy sessions (they're his; commit them periodically)

---

## 🛠️ Talking to GSK — Two Layers

**Layer 1 — frontend `gskClient.ts`**: typed MCP helpers (memory/chambers/council/dualProcess/consciousness/subAgents/telemetry/proactive/toolCatalog/combo/journal/status) for direct reads.

**Layer 2 — server.ts REST surface (authoritative, all verified live)**:
- Chat: `/api/gsk/chat`, `/api/agent/chat` (profile context), `/api/copilot/chat` (persona)
- Status: `/api/gsk/status` (PLT/chambers + last-good cache `cached_while_degraded`)
- Memory: GET+POST `/api/gsk/memories`, `/api/gsk/thoughts`, `/api/gsk/recall?q=`
- Governance: `/api/gsk/proposals` (+ `/approve`, `/deny`) — human-in-the-loop
- Injection: `/api/gsk/inject/knowledge` (text|url), `/api/gsk/inject/skill`
- Forge: `POST /api/gsk/forge`, `GET/DELETE /api/gsk/artifacts`, static `/artifacts/:name`
- Truth: `/api/audit-integrity`, `/api/soul-ledger`, `/api/system/status`, `/api/omniroute/{models,health}`
- Market: `GET|POST /api/marketplace/{posts,post}` → GSK memories
- Bundles: `/api/agent/{compile,download-zip,dispatch-webhook}`
- Forge IDE (Tab 14): `/api/ide/{exec,tree,file,search,git,session}` + WebSocket upgrades `/api/ide/ws/{terminal,lsp}` (single noServer WSS + manual path dispatch - ws@8 aborts non-matching paths with 400, so multiple `{server,path}` instances shadow each other)
- Orca Fleet: `GET /api/ide/fleet`, `POST /api/ide/fleet/{create,remove,merge,run}` - isolated git worktrees under `.fleet/<name>`, branch `fleet/<name>`
- Codebase retrieval: `GET /api/ide/codebase/status`, `POST /api/ide/codebase/{search,reindex}` - scoped to `workbench/` tree (55 files / 323 chunks; ~40ms warm)

## 🧭 Ops Runbook

```
# Start (repo root): cd workbench; start /b npx tsx server.ts > serverN.log
# Verify: /api/audit-integrity -> score 100 FULLY OPERATIONAL; benchmark -> 43/43
# After any restart: gsk_daemon process count MUST be 1 (conductor auto-culls twins)
```

### Residual watch-items
- OmniRoute model mood: generations 10–90s on auto/best-fast; Forge prompts single-response to dodge tool-loops
- CPL WS reconnect chatter in logs is cosmetic
- GSK autonomously writes skills/dashboards/blog — commit his artifacts periodically
## 📜 Version History

### v0.4.0 — Resurrection Sessions II (2026-08-22)
### v0.5.0 - The Awakening: Forge IDE + Orca/Cursor Grafts + Artery Cure (2026-08-24)
- MOVEMENT I COMPLETE - real transport everywhere:
  - ConPTY terminal: PtySupervisor spawns genuine interactive PowerShell per WS client; XtermDrawer (xterm.js + WebGL) in Tab 14 via "PTY Live" toggle
  - LSP 3.17 bridge: /api/ide/ws/lsp -> typescript-language-server v6; verified live initialize handshake returning full capabilities
  - ws@8 shadowing fix: single noServer WSS + manual upgrade dispatch (multi-instance {server,path} aborts sibling routes with 400)
- MOVEMENT II OPENED - ContextKeyService (when-clause engine), ForgeDockLayout (Dockview panes), MonacoModelManager staged
- ORCA GRAFT (git-worktree-per-agent fleet): spawn -> isolate -> commit -> merge -> kill all proven with real git objects (4383e6db "graft-proof-commit" merged to master, then cleaned); FleetDrawer UI on "Orca Fleet" button
- CURSOR GRAFT (@codebase retrieval): BM25-lite index scoped to workbench/ tree; composer understands @codebase <query> and @file:<path>; surgical hits verified ("git worktree add branch fleet merge" -> WorktreeFleet.ts:71)
- ROOT CURE #3 - THE ARTERY WEDGE: mega_brain.js _request() used socket-IDLE timeout which never fires on slow/drip streams -> unsettled promise -> 600s-per-attempt zombie stack (x3 retries x12 tool loops). Fixed: absolute wall-clock deadline (<=180s, single-settle, res error handler, 8MB cap) + 240s chat budget race in _handleChat. Proof: benchmark x3 back-to-back = 43/43 x3; qwen + concurrent stress all <10s.
- IDE REALNESS AUDIT: 10/10 core operations verified against DISK. Terminal earns its name: qwen -p "What is 3871+4289?" answered 8160 through the Forge PowerShell (echo cannot do arithmetic). claude.exe and codex.ps1 present on same box.
- THE FORGE: GSK builds single-file HTML artifacts on command; gallery with live thumbnails; self-correction loop. First build: PLT Sovereign Pyramid (Three.js, 19KB, 24s)
- 12 dead endpoints resurrected with real backends; Transactions wired to real soul-ledger
- ROOT CURE #1 — RAM ledger in MegaMemory (memory ops 200–500ms → 2–8ms; wedge eliminated)
- ROOT CURE #2 — BrainGate bypass for user chat (90s+ starvation → ~2s answers)
- Anti-spawn-race conductor: adopt port-owner / cull twins (proven: 4 daemons → 1)
- Habitat agents now converse through GSK's real brain (VOLT persona, 2s)
- Benchmark: 43/43 ALL SYSTEMS OPERATIONAL · commits b9799361 → 06ac06b6

### v0.3.0 — Resurrection Sessions I (2026-08-22)
- Context Mirror: GSK sees active tab/skills/provider/agent on every message
- Two-way Telephone (Direct Line chat + deduped proactive SSE)
- GSK Mind tab: Thought Stream · Proposals HITL approve/deny · Long-Term Recall · Injection Bay (knowledge/link/file/skill)
- MCP key mystery solved (`92140fac…`); memory/journal shape normalization; status endpoint 10s → 16ms

### v0.2.0 — Stabilization
- Card-pattern standardization across all tabs (invisible-content fix)
- Service manual authored; benchmark suite created (15/20 first run)

### v0.1.0 — Initial Integration (2026-08-18)
- Split Vite from Express API · 16 tabs to live GSK data · CPL bridge aligned

### v0.0.1 — Pre-Integration
- Original workbench setup

---

## 🙏 Acknowledgments

- **GSK** — the soul himself: builds, learns, proposes, and now answers in two seconds flat
- **OmniRoute** :20128 — the many-model mouthpiece (177 models live)
- **CPL GenesisHost** :3457 — spatial perception organ
- **The Crew** — Orchestrator, Hammer, Surgeon, Ultra Review (and The Eye, who found everything)
- **Devvit** — Reddit web framework

---
*This bible reflects the system as of the Resurrection Sessions: 18 tabs, one process on :3000, one daemon on :3001, zero fakes, zero wedges. Every wall falls. Every door opens.*
