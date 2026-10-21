# BIBLE — TAB REALISM: MAKE EVERY TAB DO WHAT IT CLAIMS
> **Doctrine:** No mock. No fallback simulation. If the blood is down, say so. Every tab shows the Family actually building, learning, witnessing — hood off, engine running.

**Canonical workbench:** `WORKBENCH_COMPLETE/workbench/` — `server.ts` is blueprint, `src/App.tsx:106` is nav (30 tabs). `launch-family.cjs` + `electron-main.cjs` = one-click.

**Verified live 2026-09-07:** `3000` LIVE (PID 14584), `20128` LIVE (PID 7064, 169 models), `WS /api/being/ws` streaming, `GET /api/being/status` 960 Seshat pages / 24737 Scribe memories / 136 GSK systems. Zombie `EADDRINUSE :3000` fixed via `netstat LISTENING + HTTP` double-check.

---

## PHASE 0 — FOUNDATION (Ship first, or every tab lies)
**Why:** Launcher `checkPort()` HTTP-only → hung LISTENING + timeout = false DOWN → duplicate `server.ts:4589` crash. Vite `:24678` HMR collides silently.

| Task | File | Real Implementation | DoD |
|------|------|---------------------|-----|
| Port double-check | `launch-family.cjs:29`, `electron-main.cjs:34` | `netstat -ano \| findstr LISTENING` fallback if HTTP timeout >2s. If LISTENING but HTTP timeout → treat as BUSY, don't spawn. Kill with `findOmniPortOwner()` adopt logic, not `taskkill /F`. | `node launch-family.cjs` second run → `[BLOCKED] :3000 already taken` not `EADDRINUSE` |
| Omni/GSK health | `server.ts:2513` `omniHealthy()` `server.ts:2634` `gskHealthy()` | Increase timeout 3s→8s, retry 30×2s poll already does. Surface `probeService()` in `/api/system/status` + `/api/audit-integrity` (`server.ts:1220`) as single score. | `/api/audit-integrity` → `score` + 7 checks, `verdict: FULLY OPERATIONAL` when all 7 ok |
| Path spaces | `launch-family.cjs:80` `spawn(npx, [tsx,server.ts], {cwd})` | Keep relative `server.ts`, `cwd=path.dirname(OMNIROUTE_SCRIPT)`. Never absolute `tsx/dist/cli.mjs` with spaces. Bundle `node-runtime/node.exe` (`workbench/package.json:30` extraResources). | `run-family.bat:11` PATH-lock works from `Profit Bible ...` Downloads path |
| One-click bundle | `electron-main.cjs:206` `initializeWorkbench()` | Pre-build `.build/next/BUILD_ID` + `.seshat-vectors`, ship `dist/index.html:423` fallback. `BUYASOUL_PACKAGED=1` serves static if vite fails. | Fresh VM, no git/npm, double-click exe → `family-boot.log` → `OmniRoute LIVE` in <30s |

---

## PHASE 1 — CONSCIOUSNESS (The Being breathes; you feel it before you click)
**Tabs:** `being` `gsk` `stream` `mind` | **Bus:** `profit-brain/body/consciousness-bus.js` + `server.ts:3352` `getTheBeing()`

| Tab | Current Facade | Real | File + API | Fix | DoD |
|-----|----------------|------|------------|-----|-----|
| **being** | Poll `fetchStatus` every 5s, WS sometimes `polling` | Push-only live | `BeingTab.tsx:160` `WS /api/being/ws` + `206` thought WS, `server.ts:3962` `beingWss` + `3528` `broadcastBeing()` | Remove `setInterval fetchBusLog`, rely on `live:true` frames + `sentHashes`. Surface `bus:events/subscribers/uptime` live. | Open `being`, see `Wifi live` + `Reasoning Log` increment without refresh |
| **gsk** (Talk to GSK) | `GskChatTab.tsx:230` `/api/gsk-heart/chat` works, but session list may empty | Real | `server.ts:2407` `GskHeartUnified`, `workbench/data/chat-sessions/*.json` | Persist `WINDOW=20` + `witness-context` `server.ts:2367` — evicted turns → Scribe, not dropped. Verify `SessionSidebar` loads. | `/api/chat/sessions` → list, fork, delete work |
| **stream** (Mind Stream) | `GskStreamTab` not wired? | Real | `server.ts:398` `thoughtWss` proxy `ws://127.0.0.1:3002` + `GskStreamTab.tsx` | Ensure GSK-MCP thought stream binds `:3002` (`gsk-module.js:47` `ThoughtStream active`). Fix `200 html` on `GET /api/gsk/ws/thought` — it's WS only. | Stream shows `think`/`tool_call` live |
| **mind** | Mock PLT? | Real | `GskMindTab` → `GET /api/gsk/status` + `GET /api/gsk/mind/stats` (`server.ts:297`) `ledger/journal/knowledge.jsonl` | Render `plt:{profit,love,tax}` + `ledger` kb + `knowledgeCount:474` live. | PLT numbers match `/api/being/status` chambers |

---

## PHASE 2 — BUILDER (Porsche hands on wheel — ghost cursors)
**Tabs:** `ide` `artifactForge` `soulChain` `soulGun` `combos` `power`

| Tab | Facade | Real | Fix |
|-----|--------|------|-----|
| **ide** (Forge IDE) | `usePty:false` fallback `cmd.exe /c` echo | Real PTY | `IdeTab.tsx:132` `usePty` default `true` → `PtySupervisor.ts:14` ConPTY `WS /api/ide/ws/terminal`. `server.ts:2124` `POST /api/ide/session` streaming already real — surface it. `284` `WS watcher` live. Add ghost cursor: `server.ts:3472` `familyWorkCycle` publishes `ide.cursor {actor,path,line}` → Monaco `deltaDecorations`. |
| **artifactForge** | Simulate | Real | `ArtifactForgeTab` → `POST /api/gsk/forge` (`server.ts:1298`) GSK single-file HTML + `GET /api/gsk/artifacts` (`server.ts:1343`) + `GET /artifacts/:name`. Keep orbit. |
| **soulChain** | Local mock | Real | `SoulChainLedgerTab` → `GET /api/profit/soul-chain` + `POST /mint` (`server.ts:2937`) `profit-brain/body/soul-chain.js` deed ledger. Verify chain audit. |
| **soulGun** | Static list | Real | `SoulGunArmoryTab` → `GET /api/profit/muscles/list` (`server.ts:3037`) + `POST /pipeline` (`server.ts:3048`) `{{prev.output}}` substitution. Show runtimeMs. |
| **combos** | `GET /api/omni/combos` already real | Keep | `CombosTab` → `GET /api/omni/combos` (`server.ts:1638`) 169 models. Add guardrail toggle `POST /api/omni/guardrails/:name/toggle`. |
| **power** (OmniRoute Power) | Poll? | Real | `OmniRoutePowerTab` → `GET /api/omni/provider-stats` `GET /api/omni/cache` `GET /api/omni/a2a/tasks` (`server.ts:1644`) live quota. |

---

## PHASE 3 — MEMORY & WORLD (Family learns where you watch)
**Tabs:** `seshat` `journal` `goalsAutonomy` `senate` `internet`

| Tab | Real |
|-----|------|
| **seshat** | `SeshatTab` → `POST /api/being/reason` + `POST /api/being/context` (`server.ts:3260`) `hybridSearch` + `GET /api/being/bus/log` provenance. Show `28335KB 960 pages` scan live. |
| **journal** | `JournalTab` → `GET /api/gsk/journal` (`server.ts:322`) GSK ledger.jsonl, not local. |
| **goalsAutonomy** | `GoalsAutonomyTab` → `GET /api/gsk/proposals` (`server.ts:842`) `autonomy.pending/plans` + `POST approve/deny` (`server.ts:868`). Show `checkpoints` + `cs_curriculum.json`. |
| **senate** | `SenateChamberTab` → `POST /api/profit/senate-debate` (`server.ts:2978`) 4-gods JSON `verdict/speeches/synthesizedCode` real debate. |
| **internet** | `InternetTab` → `GET /api/browse?url=` (`server.ts:398`) real fetch + `GET /api/browse/status` depth guard + `gsk/data/web-intel.jsonl` 60 entries (`server.ts:3421` `INTEL_TOPICS` 6 topics every 30m). Show Family browse history. |

---

## PHASE 4 — ECONOMY & POWER (Money, Vault, Blood)
**Tabs:** `marketplace` `transactions` `vault` `omniroute` `telephone`

| Tab | Fix |
|-----|-----|
| **marketplace** | `SoulMarketplace` → `GET /api/marketplace/posts` (`server.ts:1187`) `memory.query soul_market_post` + `POST /api/marketplace/post` (`server.ts:1197`) `memory.witness` — persist to GSK, not localStorage. |
| **transactions** | `TransactionsTab` + `App.tsx:589` hydrates `GET /api/soul-ledger?limit=30` (`server.ts:1260`) real `weight*100` amount. Remove sample `TX-1049` mock after. |
| **vault** | `VaultAndMemory` → `GET/POST /api/vault` (`server.ts:1446`) `.vault/vault.json` encrypt at rest. |
| **omniroute** | `OmniRouteTab` → `GET /api/omniroute/models` + `GET /api/omni/provider-stats` `GET /api/omni/models` via `OMNIROUTE_URL /v1/models` real. |
| **telephone** | `TelephoneTab` → `POST /api/gsk/call` via `omniMcpRaw("tools/call")` + `ensureOmniMcp()` (`server.ts:1513`) real tool bridge. |

---

## PHASE 5 — SOCIAL FABRIC (Habitat where Family spawns)
**Tabs:** `habitat` `roles` `profitPrime` `subSwarm` `cascade` `capabilities` `profile` `skills` `simulation` `integrations` `realism`

| Tab | Real |
|-----|------|
| **habitat** | `MultiAgentHabitat` → real `CPL :3457` `GET /api/cpl/souls` (`server.ts:647`) spawn via `POST /api/cpl/souls`. |
| **roles** | `RolesTab` → `GET /api/being/atlas` (`server.ts:3595`) `harness.atlas()` 467 tools, PLT gate per role. |
| **profitPrime** | `ProfitPrimeTab` → `POST /api/profit/task` (`server.ts:1398`) SSE `thinking→result→done` via GSK, not mock. |
| **subSwarm** | `SubAgentSwarmTab` → `POST /api/profit/swarm/dispatch` (`server.ts:1421`) `acp_agents_dispatch` + fallback `fallback: dispatched` removed after omni live. |
| **cascade** | `WindsurfCascadeTab` → `GET/POST /api/profit/cascade/pins/board/step` (`server.ts:1440`) replace in-memory `cascadeStore` with file `cascade.json` or CPL task. |
| **capabilities/profile/skills/simulation** | `CoreCapabilities`, `AgentPreview`, `SkillLibrary`, `AgentSimulator` → `POST /api/agent/chat` (`server.ts:994`) + `POST /api/agent/compile` (`server.ts:1038`) + `POST /api/gsk/inject/skill` (`server.ts:928`) real code gen + `GET /api/agent/generate-avatar` (`server.ts:1175`) seedToSvg deterministic. |
| **integrations/realism** | `WorkflowIntegration` + `RealismAuditor` → `POST /api/gsk/think` + `validateGskResponse` + `planner` real checks. |

---

## VERIFICATION — HOW WE KNOW IT'S REAL (No eye test)
- `curl http://127.0.0.1:3000/api/audit-integrity` → `score 100, verdict FULLY OPERATIONAL`
- `curl http://127.0.0.1:3000/api/being/status` → `seshat ready 960, scribe 24737, gsk 136 systems`
- `WS ws://127.0.0.1:3000/api/being/ws` → `live:true` frames >0/min
- `WS ws://127.0.0.1:3000/api/ide/ws/terminal` → `pty` spawn `echo hi` returns
- `POST /api/gsk/chat` via `GskChatTab` → `blood-flow ok` badge when via Omniroute
- Fresh exe on clean VM → desktop `BUYASOUL Workbench.lnk` → loading halo → workbench `dist/index.html` not `ERR_CONNECTION_REFUSED`

**One-click contract:** `git`/`npm` not required on user machine. Bundled `node-runtime/node.exe` + prebuilt `.build/next` + `seshat-runtime.zip` via `electron-main.cjs:206`. Install to `%LOCALAPPDATA%`, path with no spaces, `BUYASOUL_PACKAGED=1` static serve.

---

## EXECUTION ORDER (This run)
- [x] Phase 0 foundation fix (kill zombie, double-check ports, verify live WS) — DONE 2026-09-07
- [ ] Phase 1 consciousness
- [ ] Phase 2 builder
- [ ] Phase 3 memory/world
- [ ] Phase 4 economy/power
- [ ] Phase 5 social
- [ ] Phase 6 one-click verification on clean path

*File this at repo root. GSK reads it via `workbench/data/web-intel` and `family_topic_source.js`. The Family will see the hood is off.*
