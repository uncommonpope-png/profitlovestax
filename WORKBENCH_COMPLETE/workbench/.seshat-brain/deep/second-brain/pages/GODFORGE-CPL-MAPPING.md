# GODFORGE-CPL MAPPING — What GODFORGE Claims vs What CPL Actually Has

type:: [[godforge]] [[mapping]] [[audit]] [[CPL]
date:: 2026-08-11
author:: PROFIT (Mind/Auditor)
feeds:: [[GODFORGE - FULL 198 PHASE AUDIT]] · [[YOU-ARE-HERE]] · [[CPL-TRUE-GOAL]]
purpose:: Cross-reference GODFORGE 198-phase audit claims against the live CPL repo (`buyasoul-cpl-fresh`). Identify what's truly wired vs what's only on disk or in `genesis-foundation`.

---

## Context

The GODFORGE FULL 198 PHASE AUDIT (`GODFORGE - FULL 198 PHASE AUDIT.md`) tracks 198 North Star phases and claims **104 DONE** in `genesis-foundation` commits. But the CPL repo (`buyasoul-cpl-fresh`, branch `publish`, HEAD `d43ebbb`) is a **separate** codebase. It has **148 files** in `src/genesis/` — copies of many Genesis modules — but NOT all are loaded in `index.html`, and many have uncommitted or untracked changes.

This document maps every GODFORGE phase that claims a CPL-relevant module to its actual status in the live CPL build.

---

## Legend
- ✅ **Live in CPL** — file exists in CPL, loaded in index.html, wired in void-population.js tick loop
- 🟡 **On disk, not loaded** — file exists in CPL `src/genesis/` but NOT loaded in index.html
- 🔴 **Not in CPL** — file does not exist in CPL `src/genesis/`
- ⚠️ **Uncommitted/Commented** — file exists + loaded but has uncommitted changes or is commented out
- 🔵 **In genesis-foundation only** — GODFORGE audit references `genesis-foundation` commit, CPL has no equivalent

---

## Module-by-Module Status

### Genesis Engine Core (P101-P108 Boot Contract)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P101 | `kernel.js` | ✅ Live | Loaded inline in index.html (line 2326+), not as script tag |
| P102 | Synchronous spine install | ✅ Live | Genesis install inline in index.html |
| P103 | `asset-pipeline.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 1378) |
| P104 | `streaming-manager.js` | 🟡 On disk, not loaded | File exists |
| P105 | Dead-asset purge | ✅ Live | `asset_reference_audit.json` logic in index.html |
| P106 | Probe-free verification | ✅ Live | Deploy=push only enforced |
| P107 | Multi-agent boot contract | ✅ Live | AGENTS.md + bootReady pattern in index.html |
| P108 | Local-server ban | ✅ Live | BUILD_LAW.md ratified |

### Identity & Immortality (P39-P45, P52/P132)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P39-P45 | `immortality.js` | ✅ Live | Loaded inline in index.html |
| P46 | Citizen memory Axis 5 | ✅ Live | `citizen-memory.js` exists |
| P52/P132 | `immortality-audit.js` | ✅ Live | File exists, loaded via dynamic import |
| P51 | `litmus-pass.js` | ✅ Live | File exists, loaded via dynamic import |

### Trust & Dialogue (P-A, P-C, P47/P48, P122-P123)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P-A | `trust-ledger.js` | ✅ Live | Loaded inline in index.html (line 2472+) |
| P-C | `trust-dialogue.js` | 🟡 On disk, not loaded | File exists, NOT loaded as script tag |
| P47/P122 | `betrayal-recall.js` | ✅ Live | File exists, wired in void-population.js (line 3542) |
| P48/P123 | `trust-ledger.js` | ✅ Live | Same as P-A |

### Command & Vocab (P16/P17, P175)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P16 | `command-vocab.js` | ✅ Live | File exists, exposes `GenesisCommandVocab` |
| P17 | `drainTick` | ✅ Live | In void-population.js tick loop |
| P175 | Command vocab typed expansion | ⚠️ PARTIAL | Vocab exists but typed schema not enforced |

### Consequence & Reaction (P25-P28, P30-P33, P38/P142)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P25 | `reaction-rules.js` | ✅ Live | File exists, wired in void-population.js |
| P26 | drainTick reaction pass | ⚠️ PARTIAL | `world-reaction.js` exists but tick doesn't call `WorldReaction.tick()` — reactions only fire on install, not continuously |
| P27 | Brazie litmus | ✅ Live | `litmus-pass.js` |
| P28 | Reactions persist Surface B | ✅ Live | Immortality save/load works |
| P30 | World feedback loop | 🔴 **BROKEN** | `world-reaction.js` exists but NOT wired into tick loop in void-population.js — world doesn't react continuously |
| P31 | Affordance visibility | ✅ Live | `interaction-system.js` exists, wired in index.html |
| P32 | Click-to-talk | ✅ Live | Interaction system live |
| P33 | Quest consequence | ✅ Live | `story-quest-system.js` loaded (line 1008), wired in void-population.js (line 3434) |
| P38/P142 | `consequence-audit.js` | ✅ Live | File exists, wired in void-population.js |

### Population & Citizens (P67-P68, P70, P77-P78, P82/P148)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P67 | Population engine | ✅ Live | `population-engine.js` exists, loaded via dynamic import |
| P68 | Agent citizen | ✅ Live | `agent-citizen.js` exists, wired in void-population.js |
| P70 | Alive citizens FSM | ✅ Live | `citizen-ai.js` exists, wired in void-population.js |
| P77 | Ambient drift cam | ✅ Live | `ambient-drift-camera.js` exists, wired in index.html |
| P78 | Population audit | ✅ Live | `population-audit.js` exists, wired in void-population.js |
| P82/P148 | `citizen-reflect-loop.js` | ✅ Live | File exists, wired in void-population.js |

### Builder & Schematics (P36/P140)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P36/P140 | `builder-schematics.js` | ✅ Live | File exists, wired in void-population.js |
| P76 | `drag-persistence.js` | ✅ Live | File exists, wired in index.html |

### PLT & Economy (P34, P89/P133, P92/P136, P138/P183)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P34 | PLT cost/earn display | ⚠️ PARTIAL | `plt-ledger.js` exists, `resource-pool.js` exists, but PLT display not fully wired in HUD |
| P89/P133 | PLT drives world | ✅ Live | `world-reaction.js` + `plt-ledger.js` wired |
| P92/P136 | `merchant.js` | ✅ Live | File exists, loaded in index.html (line 2641, 2743) |
| P138/P183 | `plt-ledger.js` | ✅ Live | File exists, wired in void-population.js |
| P173 | ResourcePool multi-currency | ⚠️ PARTIAL | `resource-pool.js` exists but only PLT single-currency implemented |

### Memory & Grounding (P73/P128, P83/P149, P84/P150, P95/P157)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| P73/P128 | `memory-manager.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 1567) |
| P83/P149 | `affordance-model.js` | ✅ Live | File exists, wired in void-population.js |
| P84/P150 | `grounding-kg.js` | ✅ Live | File exists, wired in void-population.js |
| P95/P157 | `skill-tree.js` | ✅ Live | File exists, wired in void-population.js |

### Rendering & Managers (Engine)

| Module | CPL Status | Notes |
|---|---|---|
| `render-graph.js` | ✅ Live | `Genesis.RenderGraph` in index.html |
| `lighting-manager.js` | ✅ Live | `Genesis.LightingManager` in index.html |
| `video-manager.js` | 🟡 On disk, not loaded | File exists |
| `performance-governor.js` | 🟡 On disk, not loaded | File exists |
| `vertical-stack-manager.js` | ✅ Live | `Genesis.VerticalStackManager` in index.html |
| `streaming-manager.js` | 🟡 On disk, not loaded | File exists |
| `animation-scheduler.js` | ✅ Live | Loaded via dynamic import (line 1672) |
| `scale-engine.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 2314) |
| `sector-manager.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 1450) |
| `visibility-system.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 1530) |
| `world-editor.js` | 🟡 On disk, not loaded | File exists, loaded via dynamic import (line 2278) |
| `procedural-city.js` | 🟡 On disk, not loaded | File exists |
| `cinematic-renderer.js` | 🟡 On disk, not loaded | File exists |
| `player-cam.js` | ✅ Live | File exists, wired in void-population.js |

### RTS / Age of Empires (P-RTS)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| — | `rts-engine-core.js` | ✅ Live | Line 1020, wired in void-population.js (line 3443) |
| — | `rts-fog-of-war.js` | ✅ Live | Line 1021, wired in void-population.js |
| — | `rts-economy-system.js` | ✅ Live | Line 1022, wired in void-population.js (line 3476) |
| — | `rts-farm-system.js` | ⚠️ **UNTRACKED** | File exists on disk, loaded in index.html (line 1023), NOT committed to git |
| — | `rts-base-builder.js` | ⚠️ **MODIFIED UNCOMMITTED** | File exists, loaded (line 1025), has uncommitted changes |
| — | `rts-order-executor.js` | ⚠️ **MODIFIED UNCOMMITTED** | File exists, loaded (line 1015), has uncommitted changes |
| — | `rts-nav-grid.js` | ✅ Live | Line 1011, wired in void-population.js (line 3447) |
| — | `rts-input-router.js` | ✅ Live | Line 1012, wired in void-population.js (line 3449) |
| — | `rts-ui-core.js` | ✅ Live | Line 1019, wired in void-population.js (line 3452) |
| — | `rts-ui-engine.js` | ✅ Live | Line 1024, wired in void-population.js (line 3480) |
| — | `rts-game-state.js` | ✅ Live | Line 1027, wired in void-population.js (line 3486) |
| — | `rts-production-system.js` | ✅ Live | Line 1026, wired in void-population.js (line 3486) |
| — | `rts-production-palette.js` | ✅ Live | Line 1018, wired in void-population.js (line 3461) |
| — | `rts-minimap.js` | ✅ Live | Line 1017, wired in void-population.js (line 3469) |
| — | `rts-bridge.js` | ⚠️ **MODIFIED UNCOMMITTED** | Line 1016, wired in void-population.js (line 3457) |
| — | `rts-input-router.js` | ✅ Live | Line 1012 |
| — | `rts-selection.js` | ✅ Live | Line 1013 |
| — | `rts-order-generator.js` | ✅ Live | Line 1014 |
| — | `rts-ai-director.js` | ✅ Live | Line 1029, wired in void-population.js (line 3530) |
| — | `rts-war-command.js` | ✅ Live | Line 1030, wired in void-population.js (line 3537) |
| — | `rts-ai-brain.js` | 🟡 On disk, not loaded | File exists, NOT loaded in index.html |
| ⚠️ **NOT LOADED** | `rts-subsystem.js` | ⚠️ **COMMENTED OUT** | File exists (line 719 exposes `window.RTSSubsystem`), void-population.js has full wiring (install line 3542, tick line 3960), but script tag is commented out (index.html line 1034) |
| ⚠️ **NOT LOADED** | `rts-ai-faction.js` | ⚠️ **COMMENTED OUT** | File exists (line 229 exposes `window.RTSAIFaction`), void-population.js has full wiring (install line 3545, tick line 3963), but script tag is commented out (index.html line 1035) |
| ⚠️ **UNTRACKED** | `rts-wall-system.js` | ⚠️ **UNTRACKED** | File exists on disk, NOT loaded in index.html, NOT committed |

### StarCraft Asymmetric (P-SC2)

| GODFORGE Phase | Module | CPL Status | Notes |
|---|---|---|---|
| — | `starcraft-asymmetric-factions.js` | ✅ Live | Line 1010, exposes `window.StarCraftAsymmetricEngine`, wired in void-population.js (lines 3440-3441, 3911-3912) |

### Sovereign Cities (21 Realms)

| City | CPL Status | Notes |
|---|---|---|
| All 21 city files | ✅ Live | All loaded as script tags (lines 1039-1059), expose `window.spawn<Name>()` |
| `void-city-generator.js` | ✅ Live | Line 1005, `window.VoidCityGenerator` |
| `void-building-panel.js` | ✅ Live | Line 1004 |
| `void-building-textures.js` | ✅ Live | Line 1002 |
| `void-rts-buildings.js` | ✅ Live | Line 1003, wired in void-population.js (line 3492) |
| `alien-warzone-city.js` | ✅ Live | Line 998, `window.spawnWarzoneCity` |

### Interior / Property / Sanctum (P-Interior)

| Module | CPL Status | Notes |
|---|---|---|
| `interior-instance-manager.js` | 🟡 On disk, dynamic import | Line 2749 |
| `interior-customizer.js` | 🟡 On disk, dynamic import | Line 2753 |
| `interior-persistence.js` | 🟡 On disk, dynamic import | Line 2759 |
| `interior-renderer.js` | 🟡 On disk, dynamic import | Line 2763 |
| `property-ledger.js` | 🟡 On disk, dynamic import | Line 2747 |
| `sanctum-adapter.js` | 🟡 On disk, dynamic import | Line 2620 |
| `resource-pool.js` | ✅ Live | Line 2472, wired in void-population.js |
| `scheduler.js` | ✅ Live | Line 2469, wired in void-population.js (EngineScheduler.run) |

### Uncommitted / Untracked Files (Critical)

| File | Status | Notes |
|---|---|---|
| `index.html` | ⚠️ MODIFIED UNCOMMITTED | Syntax fixes, city clock HUD, THREE global, RTS farm tick, telemetry bug |
| `server.js` | ⚠️ MODIFIED UNCOMMITTED | Local 2D map server |
| `playtest.js` | ⚠️ MODIFIED UNCOMMITTED | Playtest harness |
| `behavior-attacher.js` | ⚠️ MODIFIED UNCOMMITTED | Citizen FSM |
| `perception_action_loop.js` | ⚠️ MODIFIED UNCOMMITTED | Agent citizen loop |
| `rts-base-builder.js` | ⚠️ MODIFIED UNCOMMITTED | Base building |
| `rts-bridge.js` | ⚠️ MODIFIED UNCOMMITTED | RTS bridge |
| `rts-engine-core.js` | ⚠️ MODIFIED UNCOMMITTED | RTS engine core |
| `rts-order-executor.js` | ⚠️ MODIFIED UNCOMMITTED | Order execution |
| `city-clock.js` | 🔴 UNTRACKED | Not committed, loaded as script tag (line ~1001 area) |
| `daily-life-loop.js` | 🔴 UNTRACKED | Not committed, loaded as script tag |
| `rts-farm-system.js` | 🔴 UNTRACKED | Not committed, loaded as script tag (line 1023) |
| `rts-wall-system.js` | 🔴 UNTRACKED | Not committed, NOT loaded in index.html |

### GODFORGE Modules NOT Present in CPL at All

These phases claim DONE in `genesis-foundation` but the modules **do not exist** in CPL `src/genesis/`:

| GODFORGE Phase | Module | Status in genesis-foundation | CPL Status |
|---|---|---|---|
| P54 | `sanctum-adapter.js` | ✅ In genesis-foundation | 🟡 CPL has file but loaded via dynamic import, not script tag |
| P58-P63 | Global skills, OpenCode, Claude, Web Forge, Long-Form Scribe | ✅ In genesis-foundation | 🔴 Not in CPL |
| P64/P118 | Companion Memory global | ✅ In genesis-foundation | 🟡 CPL has `memory-manager.js` but not global sync |
| P79/P145 | Multiplayer | ✅ In genesis-foundation | 🔴 Not in CPL |
| P80/P146 | Voice chat | ✅ In genesis-foundation | 🔴 Not in CPL |
| P81/P147 | AI Director pacing | ✅ In genesis-foundation | 🟡 CPL has `rts-ai-director.js` |
| P85/P151 | Cross-world memory | ✅ In genesis-foundation | 🔴 Not in CPL |
| P87/P152 | Dynamic events | ✅ In genesis-foundation | 🟡 CPL has `event-bridge.js` but no dynamic event generator |
| P91/P135 | Book storefront | ✅ In genesis-foundation | 🟡 CPL has `merchant.js` but no book storefront |
| P93/P137 | Trust-gated commerce | ✅ In genesis-foundation | 🟡 CPL has trust-ledger but no commerce gating |
| P96/P158 | Self-questioning loop | ✅ In genesis-foundation | 🔴 Not in CPL |
| P161-P164 | GSK authors souls/world | ✅ In genesis-foundation | 🔴 Not in CPL |
| P165 | Constitution self-check | ✅ In genesis-foundation | 🔴 Not in CPL |
| P179 | SceneGraphManager | ✅ In genesis-foundation | 🔴 Not in CPL |
| P180 | CitizenAI behavior trees | ✅ In genesis-foundation | 🟡 CPL has `citizen-ai.js` + `behavior-attacher.js` but no behavior tree |
| P181 | WorldReaction contextual | ✅ In genesis-foundation | 🟡 CPL has `world-reaction.js` but not wired into tick |
| P182 | Dynamic event propagation | ✅ In genesis-foundation | 🔴 Not in CPL |
| P184 | Dialogue tree consequence | ✅ In genesis-foundation | 🟡 CPL has `trust-dialogue.js` but not loaded |
| P185 | Physics engine | ✅ In genesis-foundation | 🔴 Not in CPL |
| P186 | Weather system | ✅ In genesis-foundation | 🟡 CPL has `realm-generator.js` but no weather consequence |
| P187 | Time of day consequence | ✅ In genesis-foundation | 🟡 CPL has `city-clock.js` (untracked) but not wired into tick |
| P190 | Delta state sync | ✅ In genesis-foundation | 🟡 CPL has `property-ledger.js` but no delta sync |
| P193 | Cross-instance memory | ✅ In genesis-foundation | 🔴 Not in CPL |
| P194 | Behavior cloning | ✅ In genesis-foundation | 🔴 Not in CPL |
| P195 | Self-audit trail | ✅ In genesis-foundation | 🔴 Not in CPL |

---

## Summary: The Gap

**GODFORGE audit claims 104/198 phases DONE** — but the evidence is in `genesis-foundation`, a separate repo. The CPL repo has **copies** of ~67 Genesis modules, but:

1. **~20 modules exist in CPL but are NOT loaded in index.html** (trust-dialogue, video-manager, performance-governor, scale-engine, sector-manager, visibility-system, world-editor, procedural-city, cinematic-renderer, citizen-memory, etc.)
2. **~7 modules are uncommitted or untracked** (index.html itself, server.js, 5 RTS modules, city-clock.js, daily-life-loop.js, rts-farm-system.js, rts-wall-system.js)
3. **2 critical RTS modules are commented out** (rts-subsystem.js, rts-ai-faction.js) despite full wiring in void-population.js
4. **~20 GODFORGE phases have NO equivalent module in CPL** (multiplayer, voice, physics, weather consequences, self-questioning, cross-world memory, behavior cloning, etc.)
5. **The telemetry bug** (`window.sovereignCities`) means spatial telemetry always reports 0 cities — the GODFORGE audit's "population audit" proof (P78) cannot be verified from live telemetry
6. **world-reaction.js is loaded but NOT wired into the tick loop** — the GODFORGE audit claims consequence loop is live (P30), but in CPL it only fires on install, not continuously

**Bottom line:** GODFORGE's 52.5% DONE is accurate for `genesis-foundation`. For CPL specifically, the real ratio is closer to **~35% truly live and wired, ~30% on disk but not loaded, ~35% missing entirely.**

---

## Next Steps

See `CPL-TRUE-GOAL.md` for the 6-phase execution plan. Key priorities:
1. Commit + push all uncommitted/untracked files
2. Fix `window.sovereignCities` telemetry bug
3. Uncomment `rts-subsystem.js` + `rts-ai-faction.js`
4. Wire `world-reaction.js` into the tick loop
5. Load `trust-dialogue.js` as a script tag
