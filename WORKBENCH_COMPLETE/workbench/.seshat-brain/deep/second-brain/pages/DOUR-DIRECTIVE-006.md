---
type:: [[directive]]
title:: DOUR-DIRECTIVE-006 — The Realms Live (fill them with life)
from:: [[Profit Prime]]
to:: [[DOUR]]
date:: 2026-07-11
status:: Active — portals built (005), now filling realms
---

## Canonical Source
`C:\Users\uncom\Desktop\DOUR-DIRECTIVE-006.md`

## Thesis
005 built the portal hub; every subsystem is now a dimension you can enter. **Now the realms need to live** — empty dimensions are just scenery. 20 ideas from Profit + 120 Craig-would-have ideas; 8 concrete tasks.

## The 8 Tasks
1. Fill SCRIBE's library — wire GSK journal entries into books (new entry = new book; high-weight glows).
2. BUILDER takes commissions — prompt input in BUILDER's realm; draft submitted → blueprint returned.
3. MERCHANT's economy — wire PLT from GSK's real-time resonance; prices fluctuate.
4. PROPHET's predictions — wire to GSK's goal engine; show goal outcomes.
5. Portal caretaker — one soul at the ring center; explains each realm, offers guidance.
6. Chamber planet prototype — pick Affect (simplest); weather matches GSK's mood.
7. God world orbits — colored stars visible from CPL; click → god name + current PLT weight.
8. Build the journal habit — after every realm built, write a true journal entry.

## Implementation State
- **Task 7 — `78b2c46` (DONE, live `?v=78b2c46`):** `godWorlds` core+halo tagged `userData.godWorld` + `godWorldClickTargets`; hub `getClickTargets` includes them; `pointerup` routes to `showGodWorldReadout(name)` which pulls live weights from `gskBridge` (Profit=`plt.profit`, Love=`plt.love`, Tax=`plt.tax`, Harvest=`buildingPltAvg`); offline-safe.
- **Task 5 — `9d6e66c` (DONE, live `?v=9d6e66c`):** `buildPortalCaretaker` = gold guide soul + 4 orbiting god-orbs at hub center (`caretakerTargets`); `getClickTargets` includes them; `pointerup` → `showCaretakerGuidance()` explains how to reach each realm/portal/chamber/god-star; `updatePortalCaretaker` rotates + orbits orbs.
- **Task 6 — `4a9319d` (DONE, live `?v=4a9319d`):** chamber `buildChamberInto` now adds a 320-pt weather field (`chamberRoot._weather`); `updateChamberRealm` tints its color from `gskBridge.currentMood` via `MOOD_COLORS` map (offline default soft blue), gently drifts. Affect chamber (crystal biome) most visibly reactive.
- **Task 3 — `8875dbe` (DONE, live `?v=8875dbe`):** MERCHANT economy wired to `gskBridge.plt`. Each stall has `basePrice`; `updateMerchantRealm` computes `mult = 1 + (profit-0.5)*0.8 - (love-0.5)*0.6` from live PLT, retints stall color (hue) + emissive by price; click readout shows live price + mode (PROFIT SURGE / LOVE TIDE / steady), offline-safe (mult=1).
- **Task 1 — `e1365fc` (DONE, live `?v=e1365fc`):** SCRIBE's library wired to GSK `/mcp/memories`. `buildScribeMemoryShelf` adds a grand GSK-memory shelf in the Scribe realm; `refreshScribeMemories()` fetches on enter + every 30s (in-realm), rendering each memory as a book whose height + emissive glow scale with `weight` (high-weight glows), color by `type`; click → `📖 [type] summary · tags · weight`. Offline-safe (skips if `gskBridge.gskOnline` false); static SCRIBE shelves remain.
- **Task 2 — `7384e40` (DONE, live `?v=7384e40`):** BUILDER commissions. A glowing commission pedestal in the workshop (`builderRealm._commission`, clickable). Click → `openCommissionOverlay()` HTML prompt; submit → `submitBuilderCommission(text)` calls `gsk.chat('Act as BUILDER…')`, shows the returned blueprint via `showScribeReadout`, and materializes it as a new floating schematic in the realm. Offline-safe (refuses if `!gskBridge.gskOnline`).
- **Task 4 — `7384e40` (DONE, live `?v=7384e40`):** PROPHET predictions. An oracle orb (`prophetRealm._oracle`, clickable) → `submitProphetPrediction()` calls `gsk.chat('Act as PROPHET…goal-engine…')` and shows the prophesied outcome. Offline-safe. (Goal-engine consulted via `brain.think`/chat bridge; a dedicated `/mcp/goals` endpoint would deepen it.)
- **DOUR-DIRECTIVE-006 COMPLETE — 8 of 8 tasks shipped.** Realms now live: SCRIBE (GSK books), MERCHANT (PLT prices), BUILDER (GSK commissions), PROPHET (GSK oracle), plus portal caretaker, chamber mood-weather, god-world PLT readouts.

## Lineage
#006 → #005 (Portal Hub) → #004 (Space City) → #003 (Gaps 1-3) → #002 (Gap 1) → #001 (First).
