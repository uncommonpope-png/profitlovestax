---
type:: [[doctrine]] [[north-star]] [[engine-portability]]
date:: 2026-07-21
author:: PROFIT (Mind)
status:: APPEND-ONLY AMENDMENT
feeds:: [[GODFORGE - FULL 198 PHASE AUDIT]] · [[NORTH STAR ODYSSEY - LIVE 100 PHASE TRACKER]]
---

# WALLS OF WALLMERIA — Engine Portability Doctrine

## Craig's Correction

Craig clarified the meaning of the 14 blocked phases:

> These are walls because we need to find out how to put all this **in the engine** — not on my PC. We are selling this engine. People will not be able to use my PC.

This corrects the earlier framing. The blocker is **not** “Craig needs to pick a hosted target.” The blocker is that the engine must stop depending on Craig's machine as a runtime authority.

## Core Law

**No Genesis/GSK feature is considered product-real if it requires Craig's PC.**

If it needs `localhost:3001`, Craig's private tunnel, a manually running daemon, or a private route to function, then it is a development harness — not an engine feature.

The sellable engine must be portable, embeddable, and host-agnostic.

## The 14 Walls Collapse Into One Wall

The 14 blocked phases are now named **The Walls of Wallmeria**. They are not separate feature failures; they are symptoms of one missing layer:

> **EPL — Engine Portability Layer**

The EPL is the part of Genesis that makes GSK's brain, Sanctum, auth, runtime config, and routing portable across:
- local development
- packaged desktop app
- buyer-hosted server
- Docker/VPS
- static GitHub Pages frontend + external host
- future cloud/relay deployment

## The 14 Walls

| Wall | Phase | Old framing | Correct engine framing |
|---|---:|---|---|
| 1 | P14 | Verify `:3001` health | Engine-native health contract: `GenesisRuntime.health()` should not be hardcoded to Craig's localhost. |
| 2 | P53 | Tunnel GSK MCP https | Transport adapter: MCP must run through a portable `agent://gsk` route, not a specific tunnel. |
| 3 | P54 | Tunnel Sanctum wss | Sanctum adapter: websocket/lobby transport must be packaged/host-agnostic. |
| 4 | P55 | Bearer auth | Auth provider belongs to the engine/host package, not Craig's tunnel. |
| 5 | P56 | Origin allowlist + PNA | Runtime policy manifest belongs to deploy package. |
| 6 | P57 | Public window vars | Runtime config manifest must be generated/injected by the engine. |
| 7 | P86 | Shared Sanctum lobby | Multiplayer lobby must use engine-owned transport abstraction. |
| 8 | P109 | Tunnel GSK MCP (expansion) | Same as P53; duplicated by expansion tracker. |
| 9 | P110 | Tunnel Sanctum (expansion) | Same as P54. |
| 10 | P111 | Bearer auth (expansion) | Same as P55. |
| 11 | P112 | Origin allowlist + PNA (expansion) | Same as P56. |
| 12 | P113 | Public window vars (expansion) | Same as P57. |
| 13 | P153 | Shared Sanctum lobby (expansion) | Same as P86. |
| 14 | P176 | MCP-local routing | Route discovery/table belongs inside EPL. |

## What “Put It In The Engine” Means

The engine needs an internal contract that all surfaces use:

```txt
CPL / buyer world / browser UI
        │
        ▼
Genesis Runtime Manifest
        │
        ▼
agent://gsk route table
        │
        ├── embedded adapter      (future WebLLM / local model / mock)
        ├── local host adapter    (localhost only for developer mode)
        ├── buyer host adapter    (Docker/VPS/Electron/Node package)
        └── relay adapter         (optional cloud/tunnel, never required by core)
```

No feature should call Craig-specific endpoints directly. Features should call the engine contract.

## Build Law For Wallmeria

1. **Append, don't destroy.** Existing working Genesis/CPL modules stay intact.
2. **No direct tunnel-first work.** Tunnels are adapters, not the architecture.
3. **No Craig-PC dependency.** `localhost` is allowed only as a development adapter.
4. **Feature flags must protect the build.** New portability modules start additive and probe-first.
5. **Static storefront stays static.** GitHub Pages can remain the storefront; engine runtime must be packageable separately.
6. **GSK remains the engine.** The Hub is populated from engine artifacts, not the reverse.

## Proposed EPL Modules

These modules can be built additively in `genesis-foundation/src/genesis/`:

| Module | Purpose |
|---|---|
| `runtime-manifest.js` | Normalizes runtime endpoints/capabilities from page config, JSON manifest, or defaults. |
| `agent-route-table.js` | Maps `agent://gsk`, `agent://scribe`, `agent://sanctum` to adapters. |
| `transport-adapter.js` | Shared interface for embedded/local/hosted/relay transports. |
| `engine-health.js` | Replaces hardcoded `:3001` checks with capability health probes. |
| `sanctum-adapter.js` | Portable lobby/websocket contract. |
| `auth-provider.js` | Bearer/session/auth policy for packaged engine hosts. |
| `deployment-profile.js` | `static`, `dev-local`, `desktop`, `docker`, `vps`, `relay` profiles. |

## How The Walls Fall

Once EPL exists, the blocked phases stop depending on Craig's machine:

- **P14** becomes a local engine health probe, not `localhost:3001` specifically.
- **P53/P109** become adapter verification: can `agent://gsk` resolve through the active profile?
- **P54/P110/P86/P153** become Sanctum adapter verification.
- **P55/P111** become auth-provider verification.
- **P56/P112** become runtime policy manifest verification.
- **P57/P113** become runtime manifest injection verification.
- **P176** becomes route-table/local-routing verification.

## PLT

- **Profit:** High — makes Genesis sellable as an engine, not just Craig's live machine.
- **Love:** High — protects future users from needing Craig's private PC.
- **Tax:** Medium — introduces architecture layer, but prevents later rebuild/destruction.

**PLT Score:** +18.

— signed: **PROFIT** · 2026-07-21

---

## EPL v0.1 Built — Runtime Manifest + Route Table + Adapters + Health

**Date:** 2026-07-21  
**Repo:** `C:\Users\uncom\Desktop\genesis-foundation`  
**Status:** SHIPPED — commit `4a2a552` pushed to Genesis Engine `publish` branch.

### Files added

| File | Purpose |
|---|---|
| `src/genesis/runtime-manifest.js` | Normalizes legacy `window.GSK_ENDPOINT`, `window.GSK_WS_ENDPOINT`, and `window.SANCTUM_WS_ENDPOINT` into an engine-owned runtime manifest. Classifies localhost/private tunnel as development harness, not product-real. |
| `src/genesis/agent-route-table.js` | Registers portable `agent://gsk`, `agent://scribe`, `agent://sanctum` routes from the manifest. |
| `src/genesis/transport-adapter.js` | Creates non-networking-by-default HTTP/WebSocket adapter records and classifies dev-harness vs product route. |
| `src/genesis/engine-health.js` | Reports all 14 Wallmeria phases and whether each wall is unblocked, blocked, or still a development harness. |
| `tests/epl.probe.cjs` | Probe for manifest, route table, adapters, health, and all 14 walls. |

### Files modified

| File | Change |
|---|---|
| `cpl-config.js` | Preserves legacy globals but also emits `window.GENESIS_RUNTIME_MANIFEST`. |
| `index.html` | Adds `__GENESIS_EPL` flag and ordered boot imports for the EPL modules. |
| `src/genesis/agent-gateway.js` | AgentGateway now checks `Genesis.AgentRouteTable.resolveEndpoint('agent://gsk','thoughts')` first, then falls back to legacy globals. |
| `tests/betrayal-recall.probe.cjs` | Fixed gossip stub so FRIEND-band gossip path is actually tested. |

### Verification

Pure Node probes passed:
- `node tests/epl.probe.cjs` — 8/8
- `node tests/agent-gateway.probe.cjs` — 18/18
- `node tests/betrayal-recall.probe.cjs` — 21/21
- `node tests/agent-citizen.probe.cjs` — 25/25
- `node tests/interaction-system.probe.cjs` — 17/17
- `node tests/immortality.probe.cjs` — 3/3
- `node tests/scribe-gateway.probe.cjs` — 11/11
- `node tests/soul-guns.probe.cjs` — 15/15
- `node tests/phase1-scheduler.probe.cjs` — 8/8

Legacy browser/Page probes timed out under current no-local-server/no-Playwright law:
- `tests/phases-18-33-43-65.probe.cjs`
- `tests/genesis-vertical-stack.probe.cjs`

### What this changes

The build does **not** yet move every caller off `window.GSK_*`. It creates the safe engine contract first. The first live caller migration is AgentGateway's thought endpoint resolution. Future migrations should move GSK panel, thought stream, Sanctum client, and journal stream through the same route table.

**Post-approval connection tighten:** Before pushing, the endpoint contract was expanded so the GSK panel, CPL thought stream, Sanctum client, GSK journal stream, AgentGateway, AgentCitizen, and ScribeGateway all resolve through the runtime manifest / `agent://` route layer first, with the old `window.GSK_*` values retained only as fallback.

### Commit

`4a2a552` — `EPL v0.1: Wallmeria engine portability layer`

### PLT

- Profit: +9 — first real productization layer for selling Genesis/GSK as an engine.
- Love: +8 — protects users from depending on Craig's private machine.
- Tax: -3 — extra abstraction, but behind flags and probes.

**PLT Score:** +14.

— signed: **PROFIT** · 2026-07-21 · pushed

---

## GODMODE Next Ten Wallmeria Contracts — Built

**Date:** 2026-07-21  
**Repo:** `C:\Users\uncom\Desktop\genesis-foundation`  
**Status:** SHIPPED — commit `64dc750` pushed to Genesis Engine `publish` branch.

### Wallmeria modules advanced

| Phase(s) | File / Contract | Status |
|---|---|---|
| P14 / P176 | `EngineHealth.proveRoutes()` | DONE — route-table health proof |
| P54 / P110 / P86 / P153 | `sanctum-adapter.js` | DONE — portable lobby/websocket contract |
| P55 / P111 | `auth-provider.js` | DONE — bearer/session auth contract |
| P56 / P112 | `deployment-profile.js` | DONE — origin/PNA/runtime policy manifest |
| P57 / P113 | runtime manifest injection | PARTIAL — manifest exists; generated static/hosted config still open |
| P53 / P109 | product GSK MCP adapter | PARTIAL — `agent://gsk` route exists; buyer-host package still open |

### Current interpretation

The Wall is no longer “Craig must host a tunnel.” The remaining wall is **buyer-host product reality**: a minimal Node/Docker runtime package plus generated runtime config so a buyer can serve GSK MCP + thoughts + Sanctum without Craig's PC.

### Verification

- `node tests/next-ten.probe.cjs` — 11/11
- `node tests/epl.probe.cjs` — 8/8

— signed: **PROFIT** · 2026-07-21 · Wallmeria contract pass shipped

---

## Buyer-Host Runtime Slice — Shipped

**Date:** 2026-07-21  
**Repo:** `C:\Users\uncom\Desktop\genesis-foundation`  
**Status:** SHIPPED — commit `2858b51` pushed to Genesis Engine `publish`.

### Files created / modified
- `src/genesis/runtime-config-injection.js` — P57/P113 public runtime manifest generator (`genesis-runtime.js/json`), no secret exposure by default.
- `host/genesis-host.cjs` — dependency-free Node buyer host: `/mcp/*`, `/gsk/mcp/*`, `/thoughts` WS, `/sanctum` WS, `/genesis-runtime.js`, `/genesis-runtime.json`.
- `host/Dockerfile` — Docker/VPS host profile.
- `host/README.md` — install/run contract and env vars.
- `tests/runtime-config-injection.probe.cjs` — 5/5.
- `tests/buyer-host.probe.cjs` — 6/6.
- `tests/product-route.probe.cjs` — 5/5.
- `index.html` — loads `runtime-config-injection.js` in the existing `__GENESIS_GODMODE_NEXT_TEN` chain.

### Verification
Pure Node suite green:
- RuntimeConfigInjection 5/5
- BuyerHost 6/6
- ProductRoute 5/5
- EPL 8/8
- NextTen 11/11
- AgentGateway 18/18
- AgentCitizen 25/25
- ScribeGateway 11/11
- BetrayalRecall 21/21
- InteractionSystem 17/17
- Immortality 3/3
- SoulGuns 15/15
- Phase1 8/8

### Truth boundary
This ships the portable buyer-host **runtime contract**. It is not yet wired to a production domain or real GSK upstream brain on a VPS. It proves the engine package no longer requires Craig's PC for its host shape.

— signed: **PROFIT** · 2026-07-21 · buyer-host runtime shipped

---

## **GLB Validation Wall — No Blender GUI on Craig's PC**

### The Problem (2026-07-21)

Craig downloaded GSK avatar assets from ChatGPT (`GSK_9K_GLBS`):
- `GSK_BODY.glb` — 328KB
- `GSK_HAIR_REGAL_LOCS.glb` — 105KB
- `GSK_OUTFIT_CYBER_LINGERIE.glb` — 96KB
- `GSK_SHOES_CYBER_BOOTS.glb` — 2.6KB
- `GSK_SIDEKICK.glb` — 142KB

**Cannot verify or preview these assets.** Blender GUI cannot run on Craig's PC. Assets lack armatures (static meshes). No way to validate:
- Bone structure compatibility
- Scale/normals/UV integrity
- Animation presence
- Material correctness

### The Wall

The Genesis Engine **cannot require Blender GUI** for:
- GLB validation
- Avatar rig verification
- Asset normalization
- Preview generation

This blocks P62/P114 (Web Forge), P63/P115 (Long-Form), and any asset pipeline work.

### Proposed Solution

Add **GLB Validator module** to Genesis Engine:
- `src/genesis/glb-validator.js` — pure Node.js GLB parser + checker
- Validate mesh count, node names, material slots, scale bounds
- Detect missing armatures (flag as static)
- Generate preview thumbnails via headless rendering (if available)
- Return JSON report: `{valid: bool, meshes: int, hasArmature: bool, scale: [min,max], issues: []}`

### PLT

- **Profit:** +7 — makes asset pipeline sellable
- **Love:** +8 — users can validate assets without Craig's PC
- **Tax:** -3 — new validation module

**PLT Score:** +12.

— signed: **PROFIT** · 2026-07-21 · GLB validation wall documented
