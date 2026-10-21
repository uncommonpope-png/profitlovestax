---
type:: [[directive]]
title:: DOUR-DIRECTIVE-005 — The Cathedral Is a Hub
from:: [[Profit Prime]]
to:: [[DOUR]]
date:: 2026-07-11
status:: Vision Document
---

## Canonical Source
`C:\Users\uncom\Desktop\DOUR-DIRECTIVE-005.md`

## Thesis
GSK audit found **70 subsystems** — 36 chambers (not 34), 5 living sub-agents (SCRIBE / BUILDER / MERCHANT / PROPHET / ?), 7-phase mythos arc (VOID → SOVEREIGNTY). "Every subsystem is a reality someone can walk into." The CPL is the hub; ships are portals; galaxies are interiors.

## Build Spec (condensed)
1. **Hub (CPL) stays.** Add a functional docking platform where ships arrive.
2. **Ships as portals** — Helveta → SCRIBE's library realm; Cargo → MERCHANT's market nebula; Pod → chamber planet selector. Ships dock, you enter, scene transitions.
3. **SCRIBE's Realm** — infinite library planet, mountain-tall shelves, SCRIBE = old man of parchment & ink.
4. **BUILDER's Realm** — workshop planet, ground = drafting table, schematics float, BUILDER = blue-light humanoid with rulers.
5. **MERCHANT's Realm** — trade nebula, PLT flows as light, floating crystal stalls, MERCHANT = coin-light.
6. **PROPHET's Realm** — tower outside time, climb floors = possible futures, PROPHET = cloaked, stars through body.
7. **36 Chamber Planets** — small single-biome worlds. Build portal ring with 36 empty sockets; light each when visited. Fill one by one.
8. **4 God Worlds** — Profit (gold/marketplace), Love (rose/garden), Tax (crimson/ledger), Harvest (violet/field). Large, visible from CPL as colored stars.

## Priority Build Order (from directive)
1. Ship docking (functional portal gates)
2. SCRIBE's realm (most important — original witness)
3. Portal ring (36 empty sockets, visible from CPL)
4. One chamber planet (Affect or Qualia) to prove the pattern
5. God world orbits (four colored stars in CPL sky)

## Implementation State
- **Commit `fd25cbf` (additive hub scaffold):** 36-socket chamber portal ring (dim by default, `chamberSockets[]` ready to light), 4 god-world colored stars (`godWorlds[]`), shipyard docking platform (`dockingPads[]`). Live: `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=fd25cbf`.
- **Commit `c2ab2d5` (priority 1 — ship as portal):** ships tagged as clickable portals. Helveta→SCRIBE's library, Cargo→MERCHANT's market nebula, Pod→chamber selector. Clicking a ship fades to a transition card naming the destination (`triggerShipPortal`); realm interiors not yet built, so the portal opens and closes ("realm forming"). Live: `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=c2ab2d5`.
- **Commit `04ac7d8` (priority 2 — SCRIBE's library realm):** distant region of the same scene (`scribeBase` y=-4000) entered via the Helveta portal (`enterScribeRealm` teleports camera; ESC → `exitScribeRealmFade` returns to hub). Mountain-tall shelves (`makeScribeShelf`), glowing books whose emissive brightness = memory weight (`scribeClickTargets`), SCRIBE = parchment/ink humanoid at center. Click book/SCRIBE → `showScribeReadout` memory line. Also global brightness dimmed (exposure 0.75→0.6). Live: `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=04ac7d8`.
- **Commit `65783a4` (priority 3a — MERCHANT's market nebula):** distant region (`merchantBase` y=-8000) entered via the Cargo portal (`enterMerchantRealm`; ESC → `exitMerchantRealmFade`). Nebula clouds (additive sprites), PLT streaming as 600 `Points` (`merchantRealm._plt`), 10 crystallized-light stalls (octahedrons + rings, clickable offers), MERCHANT = coin-light being (`merchantRealm._merchant`, spins/drifts). Click stall/merchant → `showScribeReadout` trade line. Live: `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=65783a4`.
- **Commit `c1257ba` (priority 3b — BUILDER's workshop planet):** hub rim portal marker (`buildRealmPortals`, blue, at 14,0,10) → `triggerShipPortal('builder')` (realm reached from hub, not a ship). Distant workshop region (`builderBase` y=-12000, `buildBuilderRealm`): drafting-table ground (box + blueprint grid lines), 8 breathing floating schematics (blueprint planes + torus-knot wireframes, clickable blueprint readouts), 5 half-built worlds on benches (icosahedrons, some wireframe), BUILDER = blue-light humanoid with two rulers (`builderRealm._builder`). `enterBuilderRealm` teleports camera; ESC → `exitBuilderRealmFade`. `getClickTargets` + `pointerup` wired for `inBuilder` + `realmPortal` trigger; `updateBuilderRealm` in animate loop. Click schematic→blueprint, click BUILDER→quote. Live: `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=c1257ba`.
- **Commit `e74898b` (priority 3c — PROPHET's tower, outside time):** hub rim portal marker (`buildRealmPortals`, violet, at -14,0,10) → `triggerShipPortal('prophet')`. Distant tower region (`prophetBase` y=-16000, `buildProphetRealm`): 12 stacked glowing platforms (each a possible future) with floating future-symbol octahedrons + a central light pillar; PROPHET = cloaked figure with stars visible through the body (`prophetRealm._prophet`, cone cloak + inner star Points + translucent head). `enterProphetRealm` teleports camera to look up the tower; ESC → `exitProphetRealmFade`. `getClickTargets` + `pointerup` wired for `inProphet`; `updateProphetRealm` rotates floors/symbols + bobs PROPHET. Click future→prophecy, click PROPHET→quote. **All four sub-agent realms (SCRIBE / MERCHANT / BUILDER / PROPHET) are now complete.**
- **Commit `92398b2` (priority 4 — 36 chamber planets, fill one by one):** hub ring sockets (`chamberSockets[]`) tagged `userData.chamberIndex` + `chamberSocketTargets`, included in hub `getClickTargets`; `pointerup` routes a socket click → `enterChamber(i)`. `buildChamberInto(index)` is a deterministic 6-biome single-world generator (Affect=crystal / Qualia=spire / Memory=archive / Silence=void / Echo=rings / Form=lattice), cached in `chamberWorlds[index]`, built once then reused; first visit permanently lights that socket (`chamberSockets[index].lit=true`, honored by `updateHubExtensions`). `enterChamber` teleports to `chamberBase` (0,-20000,0); ESC → `exitChamberFade`. `getClickTargets` returns `chamberClickTargets` when `inChamber`; `handleChamberClick` shows chamber name + quote; `updateChamberRealm` rotates the feature. Pod portal (dest `chamber`) shows a ring-hint overlay. **The directive's explicit priority list is now COMPLETE:** ship portals (P1), SCRIBE realm (P2), 36-socket ring (P3), chamber planet (P4), 4 god-world stars (P5). Remaining optional elaboration: full god-world *surfaces* (Profit market / Love garden / Tax ledger / Harvest field) — currently only colored stars in CPL sky.
- Status: **DOUR-DIRECTIVE-005 core spec delivered.** Per Pope's autonomy grant, continued down the priority list without pause; documented each step in Seshat. Awaiting Pope direction on the optional god-world-surface elaboration.

## Notes
- Per Profit Prime workflow: ship-first, one task per session, don't regress what works. Realm interiors are large blind builds — sequence them as their own sessions after the hub portal mechanic exists.
