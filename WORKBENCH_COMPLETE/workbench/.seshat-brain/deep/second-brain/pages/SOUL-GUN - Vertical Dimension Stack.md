---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: WORLD-STACK
status:: DEPLOYED ✅ (`f33c824`, PR #5)
---

# SOUL-GUN — Vertical Dimension Stack

**Makes several independent cities feel like one continuous vertical world by linking their Y boundaries and streaming only the active stratum.**

## When to invoke
Use when a world needs underworld/surface/sky layers, multiple contextual ground floors, or vastly greater vertical scale without loading every simulation simultaneously.

Do not use for floors inside one ordinary building, decorative floating platforms, or render-only visibility toggles.

## Schema
```js
{
  strata: [
    { id: 'underworld', order: -1, root, entryTop, entryBottom, state: 'UNLOADED' },
    { id: 'surface',    order:  0, root, entryTop, entryBottom, state: 'ACTIVE' },
    { id: 'heaven',    order:  1, root, entryTop, entryBottom, state: 'UNLOADED' }
  ],
  connectors: [
    { from: 'surface', edge: 'TOP', to: 'heaven', arrival: 'GROUND', prewarm: 40 }
  ]
}
```

## Pattern
1. Detect entry into a connector or Y-boundary volume.
2. Prewarm destination sectors while preserving the visible source baseline.
3. Map player/camera XZ into destination-local coordinates.
4. Resolve arrival using `GROUND`, `CAVE`, or `AIR` placement.
5. Activate destination only after its floor/landmark is ready.
6. Transfer player/camera, then sleep source simulation.
7. Preserve NPC/economy/memory state under the stratum ID.

## CPL implementation contract
- One `THREE.Group` per stratum; no giant global grid plane.
- One local floor/terrain system per stratum.
- One traffic controller and one NPC navigation surface per stratum—cars never share routes across layers.
- Genesis Sector Manager handles horizontal cells; a new stratum coordinator handles vertical state.
- Genesis Streaming Manager prewarms adjacent strata.
- Genesis Visibility sleeps inactive roots.
- Connector UI is diegetic: elevator, tunnel, staircase, cable car, portal seam—not a HUD menu.
- First prototype: `surface <-> heaven`; do not build underworld until this transition passes tests.

## Visual doctrine — Chongqing graft
- Multiple entrances at multiple heights.
- Mid-height bridges and rooftop plazas.
- Transit passes beside or through structures.
- Lower, middle, and upper levels have distinct urban purposes.
- Every connector exposes a recognizable destination landmark before transfer.

## Verification
- No visible partition/grid plane intersects the world.
- Crossing the connector preserves XZ continuity and lands on a valid surface.
- At most two strata are loaded and only one runs full traffic/NPC simulation.
- Returning restores the previous stratum state.
- No black screen during transition; destination floor is visible before source sleeps.
- Cars and NPCs remain bound to their own stratum.

## PLT
- **Profit:** triples explorable world scale without an engine migration.
- **Love:** travel feels continuous and discoverable rather than menu-driven.
- **Tax:** transition complexity, state persistence, safe landing, and vertical wayfinding.

## Combos
[[SOUL-GUN - District Streaming Sectors]] + [[SOUL-GUN - Genesis Sector Manager]] + [[SOUL-GUN - Genesis Streaming Manager]] + [[SOUL-GUN - Genesis Visibility System]] + [[SOUL-GUN - Unlocked Fly Camera]]

## Source lineage
[[SOUL-NOTE - Vertically Stacked Worlds]]

## CPL implementation record — 2026-07-16
- Module: `cosmic-pyramid-library/src/genesis/vertical-stack-manager.js`.
- Surface ↔ Heaven is live with destination prewarm, two-way transfer, full Surface sleep/resume ownership, safe return-state restoration, finite Heaven boundaries/collision, and a finite Dark City underside below Surface.
- Final focused browser contract: 68/68; all five framebuffer captures used the production composer; fallback count 0; no page/shader/unexpected request errors.
- Merged by PR #5 as production `f33c824`; GitHub Pages run `29501829907` succeeded; live module fetch verified.
- Playable Underworld remains the next stratum after Craig reviews the prototype.
