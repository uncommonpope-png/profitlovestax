---
type:: [[ultra-review]] [[genesis]] [[github-pages]] [[boot-fix]]
date:: 2026-07-21
author:: PROFIT (Mind)
status:: SHIPPED (`bf9a0c7`)
feeds:: [[GENESIS INTERIORS - Apartments, Doors, Avatars, Personal Spaces]] · [[ROADMAP CANON - GODFORGE, NORTH STAR, BEING MAP]]
---

# ULTRA REVIEW — Genesis Pages Boot Fix 2026-07-21

## Trigger

Craig tried to open the GitHub Pages engine after P-APT-2 and reported the page was erroring / inaccessible.

## Boundary

- No SCRIBE service calls. SCRIBE is in surgery.
- No local server.
- No Playwright/browser automation on Craig's PC.
- Canonical live engine: `C:\Users\uncom\Desktop\genesis-foundation`, branch `publish`, Pages URL `https://buyasoul-ai.github.io/buyasoul-cpl/`.

## Root cause

The live `index.html` had a top-level JavaScript Temporal Dead Zone crash:

- `establishGenesisBootContract()` used `BOOT_FAILURE_TIMEOUT` before it was declared as a later `const`.
- `collectDetail()` also called missing helper `moduleReady()`.
- Result: the main module could throw before first frame / before the engine rendered.

## Fix shipped

Commit: `bf9a0c7` — `Fix GitHub Pages boot crash and add static page probe`

Changes:
- Moved `GENESIS_SAVE_KEY`, `GENESIS_LAST_GOOD_KEY`, and `BOOT_FAILURE_TIMEOUT` above boot-contract use.
- Added `moduleReady()` before `collectDetail()`.
- Added rollback reload-attempt cap via `sessionStorage` to prevent reload loops.
- Added `markCplReady()` so critical load and first-frame fallback dispatch `cpl:ready`.
- Made `__GENESIS_NPC_RIG` default `false` so absent Bruno/Sudo GLBs are not requested unless explicitly enabled.
- Added `tests/static-page.probe.cjs` to guard:
  - inline module syntax
  - all `src/genesis/*.js` module syntax
  - local static refs
  - boot constant order
  - `moduleReady` order
  - `cpl:ready` dispatch
  - NPC rig explicit gating
  - rollback reload cap

## Verification

Local pure Node verification green:
- `static-page.probe.cjs` — 8/8
- RuntimeConfigInjection — 5/5
- BuyerHost — 6/6
- ProductRoute — 5/5
- EPL — 8/8
- NextTen — 11/11
- AgentGateway — 18/18
- AgentCitizen — 25/25
- ScribeGateway module probe — 11/11
- BetrayalRecall — 21/21
- InteractionSystem — 17/17
- Immortality — 3/3
- SoulGuns — 15/15
- Phase1 — 8/8
- Interiors — 9/9
- InteriorRenderer — 5/5

Live Pages verification:
- `https://buyasoul-ai.github.io/buyasoul-cpl/?v=bf9a0c7` returned `200` and contains the fixed boot code.
- Key static files returned `200`:
  - `cpl-config.js`
  - `src/genesis/kernel.js`
  - `src/genesis/population-audit.js`
  - `src/genesis/interior-renderer.js`
  - `tests/static-page.probe.cjs`
  - `src/genesis/player-cam.js`

## CPL repo scan

Production CPL repo `C:\Users\uncom\Desktop\cosmic-pyramid-library` is clean and does **not** have the fatal `BOOT_FAILURE_TIMEOUT` TDZ bug. It does share two non-blocking hazards:

1. `cpl:ready` listeners exist but direct `window.__cplReady = true` assignments do not dispatch the event.
2. `__GENESIS_NPC_RIG` defaults effectively ON (`!== false`) while Bruno/Sudo rig assets are absent.

These are not the reported GitHub Pages engine crash, but they should be patched in a separate CPL-safe pass if Craig wants production CPL hardened too.

## Current state

- Genesis branch `publish` is up to date with `origin/publish` at `bf9a0c7`.
- Existing untracked files remain untouched: `asset-map.cjs`, `pack-proof.cjs`.

— signed: **PROFIT** · 2026-07-21
