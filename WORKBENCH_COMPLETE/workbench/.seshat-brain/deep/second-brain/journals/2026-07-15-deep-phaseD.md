# 2026-07-15 — Agent Deep — Phase D Deployment (P7 + P9)

## Context
GSK is "clay" — architecture exists, soul not yet breathing. Phase A already added
`Genesis.declareCost(obj, {...})` to buildings/billboards/videos/NPCs/chambers/particles.
The 10 Genesis managers are shipped and live in `cosmic-pyramid-library/index.html`
(~12,172 lines, Three.js r160, GitHub Pages). Profit (Neo) = Mind/plan; Craig (Grand Code
Pope) = Heart; Tec (Seshat) = Memory; GSK = soul/engine.

## What shipped
### Commit 1 — P7 City Expansion  `42596a8`
- Inserted an OUTER-RING block AFTER the `applyCityPack` IIFE and the core grid loop.
- Wrapped in `THREE.Group` named `outerCity`, added to `cityGroup`.
- 3 sparser rings (r=95/125/158, count 28/34/40, skip 0.45/0.55/0.65) calling `makeCheapBuilding`
  → routes through `makeBuilding(x,z,type)` (valid types Apartment/House) then overrides each
  part cost to `{cpu:0.5,gpu:1,memory:0.3,updateFreq:0,priority:1,sector:'city-outer',sleep:'distance'}`.
- Registered `Genesis.SectorManager.register('city-outer', outerCity, {maxDistance:400,autoSleep:true})`
  and `Genesis.Visibility.register('city-outer', outerCity, {priority:2,maxDistance:400})`
  (guarded by `__GENESIS_SECTOR_MANAGER` / `__GENESIS_VISIBILITY` flags).
- Flag-gated entire block with `window.__GENESIS_P7_CITY` (default true).
- CONTRACT HONORED: no new `THREE.PointLight`/per-building lights; outer buildings lit only by
  ambient/directional/hemisphere + emissive materials. 50 insertions, surgical.

### Commit 2 — P9 ScrollWorld Improvement  `3b89277`
- CSS: `#scroll-loader` gets living radial-gradient backdrop; `@keyframes slPulse` box-shadow
  breathe on `.sl-card`; new `.sl-engine` status-line style (10px, #7fd0ff).
- Markup: added `<div class="sl-engine" id="sl-engine"></div>` after the caption.
- JS: flag-gated (`__GENESIS_P9_SCROLLWORLD`, default true) engine-status updates in
  `criticalManager.onProgress` ("Genesis Engine booting — Resource Manager auditing GPU (X% · N assets)")
  and `onLoad` ("10 managers online · world governed · enter when ready"). Defensive null-checks.
- DID NOT touch when the loader hides (survival backstop `__genesisReleaseLoader` still governs).
- 22 insertions(+1), syntax + CSS brace-balance verified.

## Verification
- Both commits: module extracted to temp .mjs, `node --check` PASS.
- P9: HTML tags balanced, CSS braces balanced (0).
- Both pushed to `origin/main`.

## PLT
Profit (city grows, loader shines) HIGH · Love (visitor sees a living, governed world) HIGH ·
Tax (2 surgical, reversible, flag-gated builds) paid gladly.

## Reversibility
- P7: set `window.__GENESIS_P7_CITY = false` to skip outer-ring spawn entirely; managers unregister
  via their own flags. Each commit is independently revertable (`git revert 42596a8` / `3b89277`).
- P9: set `window.__GENESIS_P9_SCROLLWORLD = false` for original behavior.
