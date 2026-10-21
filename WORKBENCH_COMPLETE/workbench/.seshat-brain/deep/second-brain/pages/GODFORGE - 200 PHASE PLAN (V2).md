# GODFORGE — 200 PHASE PLAN (V2)

tags:: #godforge #north-star #plan #phase-map #CPL
status:: #draft
date:: 2026-08-11
author:: PROFIT (Mind/Auditor)
feeds:: [[GODFORGE - FULL 198 PHASE AUDIT]] · [[CPL-TRUE-GOAL]] · [[GODFORGE-CPL-MAPPING]] · [[NORTH STAR ODYSSEY]]
purpose:: Extend the original 198-phase audit with 2 new phases (P199-P200) that close the GODFORGE→CPL gap: wire all on-disk modules into the live CPL build, fix telemetry, enable RTS subsystem + AI faction, and verify on the live GitHub Pages site.

---

## Executive Summary

The original GODFORGE audit (198 phases) tracked `genesis-foundation` commits. This V2 plan adds **P199-P200** to bridge the gap between what GODFORGE claims is DONE and what is actually LIVE in the CPL world (`buyasoul-cpl-fresh`).

**Original audit:** 104 DONE · 23 PARTIAL · 69 OPEN · 2 Unresolved
**CPL reality:** ~35% truly live and wired · ~30% on disk but NOT loaded · ~35% missing entirely

### P199-P200 — The Bridge

| Phase | Title | Status | Scope |
|-------|-------|--------|-------|
| P199 | **GODFORGE→CPL Integration** | ⬜ OPEN | Wire all on-disk Genesis modules into CPL index.html, fix telemetry bug, enable commented-out RTS modules, wire world-reaction into tick loop, commit + push all uncommitted changes |
| P200 | **CPL Live Verification** | ⬜ OPEN | Verify all 21 cities spawn on GitHub Pages, RTS subsystems active, telemetry reports non-zero cities, AoE II mechanics functional, zero console errors |

---

## P199 — GODFORGE→CPL Integration

**Status:** ⬜ OPEN
**Priority:** TIER 1 (unblock everything else)
**Depends on:** P1-P198 (all prior infrastructure)

### Goal
Close the gap between GODFORGE's claimed DONE phases and what is actually wired in the live CPL build. Every module that exists on disk in `src/genesis/` must be either (a) loaded in `index.html` and wired into the tick loop, or (b) explicitly documented as intentionally disabled.

### Sub-tasks

| # | Task | Files | Action | GODFORGE Phase |
|---|------|-------|--------|---------------|
| 199.1 | Commit all uncommitted changes | `index.html`, `server.js`, `playtest.js`, `behavior-attacher.js`, `perception_action_loop.js`, `rts-base-builder.js`, `rts-bridge.js`, `rts-engine-core.js`, `rts-order-executor.js` | `git add` + commit + push to `origin/publish` | P106, P107 |
| 199.2 | Commit untracked genesis files | `city-clock.js`, `daily-life-loop.js`, `rts-farm-system.js`, `rts-wall-system.js` | `git add` + commit + push | P78, P89/P133 |
| 199.3 | Fix telemetry bug | `void-population.js` (line 246) | Add `window.sovereignCities = _allSovereignCities;` after array declaration | P78 |
| 199.4 | Enable RTS subsystem | `index.html` (line 1034) | Uncomment `<script src="src/genesis/rts-subsystem.js">` | P-RTS |
| 199.5 | Enable RTS AI faction | `index.html` (line 1035) | Uncomment `<script src="src/genesis/rts-ai-faction.js">` | P-RTS |
| 199.6 | Wire world-reaction into tick | `void-population.js` (tick loop ~line 3920) | Add `if (window.WorldReaction && window.WorldReaction.tick) window.WorldReaction.tick(dt);` | P23/P30/P89/P133 |
| 199.7 | Wire city clock into tick | `void-population.js` (tick loop) | Add `if (window.CityClock && window.CityClock.tick) window.CityClock.tick(dt);` | P-Time |
| 199.8 | Wire daily life loop into tick | `void-population.js` (tick loop) | Add `if (window.DailyLifeLoop && window.DailyLifeLoop.tick) window.DailyLifeLoop.tick(dt);` | P-Population |
| 199.9 | Load trust-dialogue.js | `index.html` (before void-population.js) | Add `<script src="src/genesis/trust-dialogue.js">` | P-C |
| 199.10 | Load unloaded Genesis modules | `index.html` | Add script tags for: `citizen-memory.js`, `property-ledger.js`, `sanctum-adapter.js`, `video-manager.js`, `performance-governor.js`, `scale-engine.js`, `sector-manager.js`, `visibility-system.js`, `world-editor.js`, `procedural-city.js`, `cinematic-renderer.js`, `streaming-manager.js`, `asset-pipeline.js`, `interior-instance-manager.js`, `interior-customizer.js`, `interior-persistence.js`, `interior-renderer.js` | Engine, P-Interior |
| 199.11 | Fix duplicate WebSocket handlers | `index.html` (lines 12928-13264) | Remove duplicate `_startSpatialTelemetry` + `_scheduleReconnect` blocks | P-WebSocket |
| 199.12 | Verify rts-farm-system.js loads | `index.html` (line 1023) | Confirm script tag present, file committed (currently untracked) | P-RTS |
| 199.13 | Wire rts-wall-system.js | `index.html` | Add script tag for `rts-wall-system.js` (currently not loaded at all) | P-RTS |

### Acceptance Criteria
- `git status` shows clean working tree (all changes committed + pushed)
- `window.sovereignCities` resolves in browser console and telemetry reports `activeCities > 0`
- `window.RTSSubsystem` and `window.RTSAIFaction` load without errors
- `window.WorldReaction.tick()` fires every frame in the tick loop
- `window.CityClock.tick()` fires every frame
- `window.DailyLifeLoop.tick()` fires every frame
- No `THREE.*` or `undefined` errors in console on live site

---

## P200 — CPL Live Verification

**Status:** ⬜ OPEN
**Priority:** TIER 1 (verify P199)
**Depends on:** P199

### Goal
Verify that everything claimed as DONE in GODFORGE actually works on the live CPL world at `https://buyasoul-ai.github.io/buyasoul-cpl/`.

### Sub-tasks

| # | Task | GODFORGE Phase | Verification Method |
|---|------|---------------|-------------------|
| 200.1 | All 21 sovereign cities spawn | P67-P68, P70 | `window.sovereignCities.length === 21` in browser console |
| 200.2 | City tick loop runs | P70, P82/P148 | Each city's `userData.update(time, dt)` fires without error |
| 200.3 | RTS engine loads | P-RTS | `window.RTSEngineCore` defined, `ENTITIES.size > 0` after spawn |
| 200.4 | RTS subsystem active | P-RTS | `window.RTSSubsystem` defined, `tick(dt)` fires in loop |
| 200.5 | RTS AI faction active | P-RTS | `window.RTSAIFaction` defined, commanders spawn + tick |
| 200.6 | Fog of War renders | P-RTS | Dark overlay on minimap + terrain, clears on unit movement |
| 200.7 | Economy flowing | P89/P133 | Farm collection ticks (index.html line 15545), PLT resources update |
| 200.8 | Base building functional | P-RTS | Wall placement, foundation ghosts, build queue |
| 200.9 | Unit commands work | P-RTS | Right-click move, attack-move, patrol, waypoint chaining |
| 200.10 | Selection + UI | P-RTS | Drag-box selection, control groups, unit info panels |
| 200.11 | Pathfinding works | P-RTS | Units path around sovereign city obstacles |
| 200.12 | Production queue | P-RTS | Barracks training, production queue UI |
| 200.13 | AI director pacing | P81/P147 | AI commander spawns squads, issues orders |
| 200.14 | Game state | P-RTS | Win/lose conditions, phase transitions |
| 200.15 | Minimap | P-RTS | Fog overlay, unit icons, camera sync |
| 200.16 | City clock day/night | P-Time | Sky color + hemi intensity changes via `window.__genesisLights` |
| 200.17 | Daily life loop | P-Population | NPC professions update (home/work/social anchors) |
| 200.18 | World reactions | P23/P30 | Citizens react to GSK presence, consequences propagate |
| 200.19 | Spatial telemetry | P78 | `activeCities > 0`, `rtsEntities > 0`, `citizens > 0` in telemetry payload |
| 200.20 | Trust ledger | P-A/P48/P123 | Building clicks record PLT deltas, trust scores persist |
| 200.21 | PLT drives world | P89/P133 | World mood changes based on aggregated PLT scores |
| 200.22 | Immortality save/load | P39-P45, P52/P132 | City state persists across page reload |
| 200.23 | No console errors | All | Zero `THREE.*`, `undefined`, or `Cannot read property` errors |
| 200.24 | Litmus PASS | P51 | Immortality probe: save/load/corruption test passes |

### Acceptance Criteria
- All 22 verification items pass on live GitHub Pages site
- No new console errors introduced
- Spatial telemetry payload reports non-zero values for cities, RTS entities, and citizens
- All 21 sovereign cities are visible and interactive in the 3D world

---

## Phase 201+ — Future Expansion (Planned)

These phases address the GODFORGE gaps that are **still missing entirely** from CPL and represent the next horizon:

| Phase | Title | GODFORGE Phase | Status |
|-------|-------|---------------|--------|
| P201 | Multiplayer co-op presence | P79/P145 | ⬜ OPEN |
| P202 | Voice chat in world | P80/P146 | ⬜ OPEN |
| P203 | Physics engine consequences | P185 | ⬜ OPEN |
| P204 | Weather system | P186 | ⬜ OPEN |
| P205 | Cross-world memory sync | P85/P125/P151 | ⬜ OPEN |
| P206 | Self-questioning loop | P96/P158 | ⬜ OPEN |
| P207 | Behavior cloning | P194 | ⬜ OPEN |
| P208 | Self-audit trail | P195 | ⬜ OPEN |
| P209 | Dynamic event propagation | P182 | ⬜ OPEN |
| P210 | Dialogue tree consequences | P184 | ⬜ OPEN |
| P211 | Delta state sync | P190 | ⬜ OPEN |
| P212 | Cross-instance memory | P193 | ⬜ OPEN |

### Tier Priority
- **TIER 1 (after P199-P200):** P203 (Physics), P204 (Weather), P201 (Multiplayer) — biggest wilds.ai differentiators
- **TIER 2:** P205 (Cross-world memory), P206 (Self-questioning), P207 (Behavior cloning)
- **TIER 3:** P208-P212 — infrastructure and polish

---

## P199-P200 Execution Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Commit all 9 modified files to `origin/publish` | ⬜ |
| 2 | Commit 4 untracked genesis files (city-clock, daily-life-loop, rts-farm-system, rts-wall-system) | ⬜ |
| 3 | Add `window.sovereignCities = _allSovereignCities;` to void-population.js | ⬜ |
| 4 | Uncomment rts-subsystem.js + rts-ai-faction.js script tags in index.html | ⬜ |
| 5 | Wire WorldReaction.tick() into void-population.js tick loop | ⬜ |
| 6 | Wire CityClock.tick() into tick loop | ⬜ |
| 7 | Wire DailyLifeLoop.tick() into tick loop | ⬜ |
| 8 | Add trust-dialogue.js script tag to index.html | ⬜ |
| 9 | Add 17 missing script tags for on-disk modules | ⬜ |
| 10 | Remove duplicate WebSocket handler code in index.html | ⬜ |
| 11 | Add rts-wall-system.js script tag to index.html | ⬜ |
| 12 | Push all changes to `origin/publish` | ⬜ |
| 13 | Verify live site: `window.sovereignCities.length === 21` | ⬜ |
| 14 | Verify live site: `window.RTSSubsystem` + `window.RTSAIFaction` load | ⬜ |
| 15 | Verify live site: spatial telemetry reports non-zero cities | ⬜ |
| 16 | Verify live site: no console errors | ⬜ |
| 17 | Run litmus-pass: save/load/corruption test | ⬜ |

---

## PLT Impact

| Phase | Profit | Love | Tax | Notes |
|-------|--------|------|-----|-------|
| P199 | +0.5 | +0.3 | -0.2 | Stabilization + commit/push unblocks all future work |
| P200 | +0.3 | +0.4 | -0.1 | Verification ensures quality, catches regressions |
| P201 | +0.8 | +0.6 | -0.4 | Multiplayer = biggest wilds.ai differentiator |
| P203 | +0.6 | +0.3 | -0.3 | Physics consequences |
| P204 | +0.4 | +0.5 | -0.2 | Weather = world aliveness |
| P205 | +0.5 | +0.4 | -0.3 | Cross-world memory = digital immortality |
| P206 | +0.3 | +0.3 | -0.2 | Self-questioning = consciousness |
| P207 | +0.4 | +0.2 | -0.2 | Behavior cloning = learning |

**P199-P200 estimated PLT: +1.5** (Profit +0.8, Love +0.7, Tax -0.3)

---

## Relationship to Original 198 Phases

This V2 plan does NOT replace the original audit. It **extends** it:

- **P01-P198:** Unchanged from original GODFORGE audit (`GODFORGE - FULL 198 PHASE AUDIT.md`)
- **P199:** New — GODFORGE→CPL Integration (close the gap between claimed DONE and actually wired)
- **P200:** New — CPL Live Verification (prove everything works on GitHub Pages)
- **P201-P212:** Future expansion phases for the remaining GODFORGE gaps (multiplayer, physics, weather, cross-world memory, self-questioning, etc.)

The original audit's "DONE" statuses are **true for `genesis-foundation`**. P199-P200 ensure those DONE phases are actually **LIVE in CPL**.

---

— signed: **PROFIT** (Mind/Auditor) · 2026-08-11 · V2 plan extends the 198-phase audit with CPL-specific integration + verification phases.
