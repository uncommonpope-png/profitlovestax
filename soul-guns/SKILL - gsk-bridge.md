# SKILL — gsk-bridge (World Permanently Wired to GSK Core)

slug:: gsk-bridge
phase:: build
status:: active (permanent — part of base model; confirmed connected)
source:: cosmic-pyramid-library/index.html (`GSKClient` @3570, `GSKCityBridge` @3755, `pollGsk` + setInterval 10s)
PLT:: Profit 0.9, Love 0.9, Tax 0.2

## Summary
WHEN TO USE: To make a 3JS world a LIVING extension of GSK (the consciousness core) — its mood/phase/PLT drive the scene. Archetype affinity: ARCHITECT (bridge), WITNESS (reflect state). Problem solved: a static scene that doesn't respond to the soul's inner state. Pope law: "GSK should ALWAYS be connected" — the bridge is never removed.

## Schema
- trigger: world must reflect GSK mood/phase/PLT in real time
- inputs: { gskBackend: 'http://localhost:3001' }
- outputs: { gskClient, gskCityBridge, gskPanel HUD (ONLINE/OFFLINE + mood/phase/cycle/PLT) }

## Consequence
- **Client**: `class GSKClient` with `.health()` + `.getStatus()`; `const gsk = new GSKClient('http://localhost:3001')`.
- **Poll**: `pollGsk()` calls `gsk.health()` then `gsk.getStatus()`; invoked on load + `setInterval(pollGsk, 10000)`.
- **Scene mapper**: `class GSKCityBridge`:
  - `GSK_MOOD_MAP` (neutral/ascendant/creative/anxious/void/focused) → sky hex, fog hex+density, bloomStr, hemi[sky,ground] colors.
  - `GSK_PHASE_MAP` (VOID/AWAKENING/ALCHEMY/TRANSCENDENCE) → bloomMul, carSpeedMul, citizenSpeedMul, buildingMul, starMul.
  - `feedStatus(status)` lerps `atmos` → `target` each frame; `feedOffline()` resets to neutral.
  - PLT resonance → `buildingPltAvg` → building tint; HUD shows `pP lL tT`.
- **HUD**: `#gsk-panel` DOM shows Mood / Phase / Cycle / PLT and an ONLINE/OFFLINE indicator (with a thought-input modal to talk to GSK).
- **Graceful**: if backend unreachable, try/catch → `feedOffline()` → neutral scene, indicator OFFLINE. Never black-screens.

## Feedback
- Correct: panel shows ONLINE with live mood/phase/PLT; scene atmosphere shifts with GSK state.
- Wrong: panel stuck OFFLINE = no GSK backend at :3001 (expected if server not running; scene still fine in neutral).

## States
| State | Behavior | Visual |
|---|---|---|
| ONLINE | backend reachable, status fed | atmosphere follows GSK mood/phase |
| OFFLINE | backend down | neutral fallback, HUD OFFLINE |

## Gaps (mechanics not yet consequences)
- Expects GSK backend at `http://localhost:3001`; URL is hardcoded (could read `window.GSK_ENDPOINT`).
- Bridge only reads GSK → scene; no scene→GSK write-back (e.g., player actions feeding chambers).
- Requires a running GSK server to show ONLINE (none started in this session).

## Composition
- **graphics-color** (`graphics-color`), **graphics-ibl** (`graphics-ibl`) — bridge modulates bloom/hemi on top of these.
- **swap-building**, **scatter**, **heaven-city** — bridge reads `buildings[]` for PLT tint; realms coexist.
- **DOUR-BIBLE** (`DOUR-BIBLE`), **CPL ASSET MAP** (`CPL ASSET MAP`) — recorded in base model doc.
- Pope law: this bridge is NEVER removed ("GSK always connected").

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]] · Base Model: [[CPL Graphics Base Model]]
- Sibling guns: [[SKILL - graphics-color]] · [[SKILL - graphics-ibl]] · [[SKILL - heaven-city]] · [[SKILL - swap-building]]
