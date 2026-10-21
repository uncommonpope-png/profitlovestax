---
type:: [[build-log]] [[genesis]] [[act-vi]] [[cpl]] [[do-not-lose]]
date:: 2026-07-19
status:: BUILT (sandbox) — awaiting Profit verify + push
feeds:: [[CLP-IS-GENESIS-ENGINE]] · [[ECOSYSTEM - Service Manual (Core Triad Bible)]] · [[SOUL-GUN - Three.js Dark-City Component Kit (Deep Study)]]
---

# BUILD LOG — Act VI BODY Graft (SESHAT = Builder)

**Canonical law (CLP-IS-GENESIS-ENGINE):** LIVE BASE = `cosmic-pyramid-library/src/genesis/` (DO NOT TOUCH). SANDBOX = `gap-verify/src/genesis/` (build here). This graft is sandbox-only.

## Modules grafted (2026-07-19)

| File | What it does | Flag to enable | CASCADE | node --check |
|---|---|---|---|---|
| `citizen-ai.js` | Living citizen FSM (wander/patrol/pursue/idle/follow) on EntityRegistry entities; EngineScheduler tick; `trackMind(id)` makes citizens chase/follow GSK (BODY answers MIND) | `window.__GENESIS_CITIZEN_AI = true` | `registerCascade(fn)`; deterministic rule-FSM is default server decision | OK |
| `world-reaction.js` | Mood→World preset swap (particles: rain/stars/snow/fire/smoke; shaders: golden-flow/lava/voronoi/gradient/marble). BODY reflects MIND, never inverts | `window.__GENESIS_WORLD_REACTION = true` | `observeMood()` gated by `registerCascade` | OK |
| `procedural-city.js` | Gen-from-code Dark City (blocks/towers/heightmap), zero asset deps, registered into EntityRegistry; `proposeMutate()` lets citizens reshape blocks (ACT III "world answers") | `window.__GENESIS_PROCEDURAL_CITY = true` | `proposeMutate()` gated by `registerCascade` | OK |
| `player-cam.js` | Third-person cam + collision + drag (WASD/Shift/Space/Q/F per base UI); inhabitation only, NOT an agent command channel | `window.__GENESIS_PLAYER_CAM = true` | n/a (local visual only) | OK |

## Pattern (matched the 3 foundation files exactly)
- IIFE + `if (Genesis.X) return; // idempotent` guard.
- Hard gate `window.__GENESIS_* === true` → zero behavioral delta when OFF.
- `Genesis.registerModule('name', { status:'candidate', ... })` → shows in `Genesis.summary()`.
- Registered on `EngineScheduler.defineTick` (and `GenesisKernel.registerSystem` where per-frame work exists).
- Vanilla global `THREE` only — no ES-module `import` of three → safe on r128 AND r160.

## Three-version caveat
The original threejs-games Dark-City kit targets its own (newer) Three.js build. It was **NOT imported**. These modules reimplement the kit's behavior with only stable r128..r160 APIs (BoxGeometry, MeshStandardMaterial, Group, Vector3, Raycaster, Camera.lookAt). **No incompatibility flagged.** If the kit's actual source is later audited, re-check any postprocessing/BufferGeometryUtils usage — this graft avoids both.

## Doctrinal compliance
- MIND (identity_kernel, 6 layers), SCRIBE, CASCADE, Step 5 **untouched** — these are BODY-only modules.
- `citizen-ai` / `world-reaction` / `procedural-city` all expose `registerCascade(fn)` — model proposes, server decides. No in-page LLM.
- `player-cam` is pure inhabitation; it is NOT a command channel and cannot spawn/edit GSK's world.

## Verification evidence
- `node --check` all 4 → OK.
- Idempotency + flag-gate present in all 4 (static scan).
- Live base `cosmic-pyramid-library/src/genesis`: `git status --porcelain` empty; mtime scan = 0 files modified today; none of the 4 filenames exist in the live base.

## Handoff
- **Not pushed.** Profit (Mind) verifies + pushes per Craig's order.
- After push: enable flags one at a time in the sandbox install block; probe (citizen walks, mood→world swaps, city regenerates, cam follows).

— signed: **SESHAT (Tec/Builder)** · 2026-07-19 · cross-signed by **PROFIT** (Mind) on verify.
