---
type:: [[north-star]] [[checklist]] [[execution]]
date:: 2026-07-21
author:: PROFIT (Mind)
status:: CANONICAL WORKING CHECKLIST
feeds:: [[GODFORGE - FULL 198 PHASE AUDIT]] · [[NORTH STAR ODYSSEY - LIVE 100 PHASE TRACKER]] · [[WALLS OF WALLMERIA - Engine Portability Doctrine]]
---

# NORTH STAR — ACTUAL REMAINING CHECKLIST

Snapshot after:
- **P47 Betrayal Recall shipped:** `470472a`
- **EPL v0.1 / Walls of Wallmeria shipped:** `4a2a552`
- **GODMODE Next Ten shipped:** `64dc750`

This page is the actionable checklist. It collapses duplicate phases across P01-P100 and P101-P198 so we build capabilities, not paperwork.

## Rule

**Do not build for Craig's PC. Build into the engine.**  
`localhost`, private tunnels, and manually running daemons are development harnesses only.

---

## TIER 0 — Status Hygiene / Tracker Corrections

- [x] Update audit totals after `470472a` + `4a2a552` + `64dc750`.
- [x] Mark P47 DONE everywhere.
- [x] Reconcile P122 with P47: betrayal recall is now built in canonical engine; expansion tracker should stop calling it only scaffolded.
- [x] Reclassify the 14 blocked phases as **Wallmeria portability work**, not “Craig hosted target.”
- [x] Mark EPL v0.1 as shipped foundation, not full Wallmeria completion.
- [x] Clean stale tracker items that still list already-shipped phases as open/partial.

**Tier 0 cleanup pass:** 2026-07-21 after `64dc750`. The tracker now treats Wallmeria as portability work: adapter/contracts that shipped are marked done, but buyer-host/package/runtime-config work remains open. P51 is marked as code-proof shipped; a real calendar reopen can still be run as an operational audit.

---

## TIER 1 — Finish The Current Engine Loop (No New Infra)

These close the core “world answers / never dies / visible intelligence” loop.

- [ ] **P11** — Architect-key discipline proof pass (`PLT222` route / protected mutating ops proof).
- [ ] **P15** — MCP key handling live-header probe / auth correctness.
- [ ] **P22** — Avatar above pyramid boot visual proof.
- [ ] **P29 / P144** — Citizens visibly react to GSK mood/world state.
- [ ] **P30** — World feedback loop driven by engine tick, not daemon-only/manual state.
- [ ] **P34** — PLT cost/earn display fully wired to world HUD / action feedback.
- [ ] **P35 / P143** — Realm reactions stateful + audited.
- [x] **P38 / P142** — Full consequence audit: every EventBridge event has visible reaction or documented no-op (`64dc750`, `consequence-audit.js`).
- [x] **P51** — Litmus PASS proof harness: exact-state days-later verification contract (`64dc750`, `litmus-pass.js`). Real calendar re-run remains an operational audit.

Recommended order:
1. P38 consequence audit
2. P51 days-later litmus
3. P29/P144 citizen reaction binding
4. P34 PLT display feedback
5. P35/P143 realm reaction audit

---

## TIER 2 — Wallmeria / Engine Portability Completion

EPL v0.1 exists. Now build the parts that make the engine sellable without Craig's PC.

- [x] **EPL v0.1** — runtime manifest + route table + transport adapters + engine health (`4a2a552`).
- [x] **P14** — Engine-native health contract proof: `Genesis.EngineHealth.check()` / `proveRoutes()` is the canonical route health probe (`64dc750`).
- [x] **P53 / P109** — Product GSK MCP adapter: `agent://gsk` resolves through active deployment profile. **SHIPPED `2858b51`:** `host/genesis-host.cjs` + `tests/product-route.probe.cjs`.
- [x] **P54 / P110 / P86 / P153** — `sanctum-adapter.js`: portable lobby/websocket contract (`64dc750`).
- [x] **P55 / P111** — `auth-provider.js`: bearer/session auth packaged into engine host profile (`64dc750`).
- [x] **P56 / P112** — `deployment-profile.js`: origin/PNA/runtime policy manifest (`64dc750`).
- [x] **P57 / P113** — Runtime config injection: generated public vars / manifest for static + hosted builds. **SHIPPED `2858b51`:** `runtime-config-injection.js` + `/genesis-runtime.js/json` host route.
- [x] **P176** — MCP-local routing proof through AgentRouteTable (`64dc750`, `EngineHealth.proveRoutes()`).
- [x] Buyer-host package: minimal Node/Docker runtime that serves GSK MCP + thoughts + Sanctum using the manifest. **SHIPPED `2858b51`:** `host/genesis-host.cjs`, `host/Dockerfile`, `host/README.md`.
- [ ] Desktop/packaged profile: optional Electron/local package profile.
- [x] Product route probe: prove dev-local, static, docker/vps profiles all resolve without hardcoding Craig. **SHIPPED `2858b51`:** `tests/product-route.probe.cjs` — 5/5.

---

## TIER 3 — Reach / Tool Arm / Web Forge

These become possible after Tier 2 has a portable host package.

- [ ] **P58 / P114** — Deploy 5 Global Skills from engine package.
- [ ] **P59** — Deploy OpenCode integration path.
- [ ] **P60** — Deploy Claude integration path.
- [ ] **P61 / P115** — Verify tool-arm callable through engine host.
- [ ] **P62 / P116** — Web Forge live.
- [ ] **P63 / P117** — Long-Form Scribe live.
- [ ] **P64 / P118** — Companion Memory global, not just local affinity.
- [ ] **P66 / P120** — Real-world reach audit.

---

## TIER 4 — Memory Depth / Wilds.ai Gap

This is one of the biggest competitive gaps.

- [ ] **P125 / P85 / P152** — Cross-world memory.
- [x] **P130** — Vector memory (mem0/letta style) integrated into engine. ✅ `d65977f`
- [x] **P131 / P166** — Memory compression / distillation / recursive compaction. ✅ `d65977f`
- [x] **P189** — Atomic snapshotting. ✅ `d65977f`
- [ ] **P190** — Delta state synchronization. (built standalone, not clipped)
- [x] **P191** — Self-healing memory. ✅ `d65977f`
- [x] **P192** — Multi-version history. ✅ `d65977f`
- [ ] **P193** — Cross-instance memory.
- [ ] **P194** — Behavior cloning.
- [ ] **P195** — Self-audit trail.
- [x] **P196** — Predictive memory retrieval. ✅ `d65977f`
- [x] **P197** — Memory-gated access. ✅ `d65977f`
- [x] **P198** — Universal memory format. ✅ `d65977f`

Recommended order:
1. P130 vector memory
2. P131 distill/compression
3. P189 atomic snapshots
4. P190 delta sync
5. P193 cross-instance memory

---

## TIER 5 — Living Multiverse

- [ ] **P79 / P145** — Multiplayer state.
- [ ] **P80 / P146** — Voice chat in world.
- [ ] **P81 / P147** — AI Director pacing.
- [x] **P82 / P148** — Full citizen tick loop: perceive → plan → act → reflect (`64dc750`, `citizen-reflect-loop.js`).
- [x] **P83 / P149** — Affordance modeling: citizen action-set model (`64dc750`, `affordance-model.js`).
- [x] **P84 / P150** — Hallucination grounding knowledge graph (`64dc750`, `grounding-kg.js`).
- [ ] **P87 / P151** — Dynamic events.
- [ ] **P88 / P154** — Multiverse audit.
- [ ] **P155** — GSK as multiplayer host.
- [ ] **P156** — Federation protocol.

Recommended order:
1. P82/P148 tick reflect
2. P83/P149 affordance model
3. P84/P150 grounding KG
4. P81/P147 AI Director
5. P79/P145 multiplayer state

---

## TIER 6 — Economy / Commerce

- [ ] **P90 / P134** — Soul economy honesty connected to storefront behavior.
- [ ] **P91 / P135** — Book storefront in-world.
- [ ] **P93 / P137** — Trust-gated commerce.
- [ ] **P94 / P139** — Economy balance audit.

Recommended order:
1. P93/P137 trust-gated commerce
2. P91/P135 in-world book storefront
3. P94/P139 economy audit

---

## TIER 7 — Godforge / Self-Authoring

- [x] **P95 / P157** — Skill Tree live in engine loop (`64dc750`, `skill-tree.js`).
- [ ] **P96 / P158** — Self-questioning loop.
- [ ] **P97 / P159** — Architect gate on evolution.
- [ ] **P98 / P160** — Evolution audit.
- [ ] **P161** — GSK authors souls.
- [ ] **P162** — GSK authors world.
- [ ] **P163** — Auto-soul-gun forgery.
- [ ] **P164** — Self-improving renderer.
- [ ] **P165** — Constitution self-check.
- [ ] **P167** — Sovereign audit / wilds.ai measurement.
- [ ] **P168** — North Star reached v2.

Recommended order:
1. P95/P157 skill tree live
2. P96/P158 self-questioning
3. P97/P159 architect gate
4. P163 auto-soul-gun forgery

---

## TIER 8 — Deeper Core / Engine Hardening

- [ ] **P169** — AgentGateway truly bidirectional over active route profile.
- [ ] **P170** — EntityRegistry typed schema.
- [ ] **P171** — EngineScheduler priority queue.
- [ ] **P172** — Immortality schema validation.
- [ ] **P173** — ResourcePool multi-currency.
- [ ] **P174** — ReactionRules multi-condition logic.
- [ ] **P175** — Typed command vocabulary expansion.
- [ ] **P177** — Performance Governor tuning.

---

## TIER 9 — Consequence Granularity

- [ ] **P179** — SceneGraphManager events.
- [ ] **P180** — CitizenAI behavior trees.
- [ ] **P181** — WorldReaction contextual reactions.
- [ ] **P182** — Dynamic event propagation.
- [ ] **P184** — Dialogue tree consequence.
- [ ] **P185** — Physics engine integration.
- [ ] **P186** — Weather system consequence.
- [ ] **P187** — Time-of-day consequence.
- [ ] **P188** — Historical record consequence.

---

## TIER 10 — Final North Star Proof

- [ ] **P99 / P167** — Beat wilds.ai on sovereignty with measurable proof.
- [ ] **P100 / P168** — North Star reached: sovereign GSK with home, memory, body, hands, city, portability, and audit.

---

## Immediate Next 10 Builds

If Craig asks “what should we do next?” the current recommended sequence is:

1. [x] **P38/P142** — Consequence audit — shipped `64dc750` as `consequence-audit.js`.
2. [x] **P51** — Days-later Litmus PASS harness — shipped `64dc750` as `litmus-pass.js` (exact-state age proof; real calendar wait can now be run).
3. [x] **P14/P176** — EngineHealth + route-table health proof — shipped `64dc750` via `EngineHealth.proveRoutes()`.
4. [x] **P55/P111** — `auth-provider.js` — shipped `64dc750`.
5. [x] **P56/P112** — `deployment-profile.js` — shipped `64dc750`.
6. [x] **P54/P110/P86/P153** — `sanctum-adapter.js` — shipped `64dc750`.
7. [x] **P82/P148** — Full citizen tick reflect loop — shipped `64dc750` as `citizen-reflect-loop.js`.
8. [x] **P83/P149** — Affordance action-set model — shipped `64dc750` as `affordance-model.js`.
9. [x] **P84/P150** — Grounding knowledge graph — shipped `64dc750` as `grounding-kg.js`.
10. [x] **P95/P157** — Skill Tree live in engine loop — shipped `64dc750` as `skill-tree.js`.

## Godmode Next Ten — Shipped

**Commit:** `64dc750` on Genesis Engine `publish` branch.  
**Probe:** `node tests/next-ten.probe.cjs` — 11/11.  
**Flag:** `__GENESIS_GODMODE_NEXT_TEN` default ON.  
**Mode:** additive only; old paths preserved.

Added modules:
- `consequence-audit.js`
- `litmus-pass.js`
- `auth-provider.js`
- `deployment-profile.js`
- `sanctum-adapter.js`
- `citizen-reflect-loop.js`
- `affordance-model.js`
- `grounding-kg.js`
- `skill-tree.js`

Next checklist should begin with the remaining Tier 0 tracker cleanup, then buyer-host package / real product host, memory depth, and multiverse.

— signed: **PROFIT** · 2026-07-21
