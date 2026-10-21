# Scribe Record — 2026-07-16 — Genesis Integration Audit

## Task Completed
Built and independently verified Phase 0 of Craig's engine-first roadmap: Genesis strata now govern simulation, not only visibility. No art, assets, dependency, realm, economy, vehicle, or population expansion entered this pass.

## CPL Files Changed
- `index.html` — ancestor-aware simulation API, coarse Surface/Heaven gates, single mixer path, work counters, truthful diagnostics, Backquote debug expansion.
- `src/genesis/animation-scheduler.js` — sole mixer update ownership, vertical-state enforcement, duplicate-frame guard, owner/stratum counts.
- `src/genesis/sector-manager.js` — Vertical Stack precedence and vertical wake rejection.
- `src/genesis/vertical-stack-manager.js` — public `isSimulationActive` / `getObjectStratumId` APIs.
- `src/genesis/video-manager.js` — truthful active/registered video accounting.
- `src/genesis/visibility-system.js` — vertical ownership and simulation-state enforcement.
- `tests/genesis-vertical-stack.probe.cjs` — 88-contract browser proof.

## Architecture Decisions
- **Visibility is not sleep:** a SLEEPING stratum must stop CPU simulation and mixers.
- **Vertical state has precedence:** Sector, Visibility, lifecycle, and scheduler may narrow work but may not wake a vertically sleeping root.
- **One mixer owner:** registered AnimationMixers update only in `AnimationScheduler.tick(dt, frameToken)`.
- **Truthful diagnostics only:** particle systems derive from actual `THREE.Points` objects plus ready Quarks; no assumed totals.
- **No new HUD surface:** extend the existing compact Genesis debug pill; `genesisDebug=1` pins and Backquote expands it.
- **No new realm:** Dark City remains static Surface content (`updateFreq:0`); playable Underworld is deferred.

## Verification
- `node --check` passed for all changed extracted manager modules and the focused CJS probe.
- `node tests/genesis-vertical-stack.probe.cjs` passed **88/88**.
- Five framebuffer captures used the real composer; compose count 0→5; fallback count 0.
- Zero page errors, shader errors, unexpected console errors, or unexpected request failures.
- `git diff --check` passed with line-ending warnings only.

## State Changes
- **Production:** unchanged at deployed `f33c824`.
- **Local candidate:** seven intended CPL files modified, uncommitted and undeployed.
- **Dependencies:** none added.

## Approved Roadmap
1. Review/ship Phase 0 only when Craig explicitly requests it.
2. Phase A: one premium CPL street from free CC0/permissive assets normalized headlessly to GLB/KTX2; Blender GUI is not required and does not run on Craig's PC.
3. Phase B: one navmesh-driven hero NPC / Genesis Population Engine.
4. Phase C: one Rapier-driven hero car / Genesis Vehicle Controller.
5. Phase D: Genesis Cinematic Renderer.
6. Phase E: bounded population and traffic scale.
7. Genesis World Editor begins after Phase A stabilizes.

## Seshat Update
- Journal: `journals/2026_07_16.md`
- Current state: `YOU-ARE-HERE.md`
- Canonical engine plan: `pages/GENESIS-ENGINE-GAP.md`
- Bible: `pages/THE-PROFIT-BIBLE.md` v43.8.0
