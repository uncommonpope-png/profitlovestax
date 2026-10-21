---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B3
status:: FORGED ✅
---

# SOUL-GUN — Unlocked Fly Camera (B3)

**Lets the visitor actually SEE the bigger world.** The current `OrbitControls` is caged: `minDistance=3`, `maxDistance=200` (index 2723–2724), `far` plane implicit ~1000. The 600u grid is invisible from orbit because you can't pull back.

## What it does
- `controls.maxDistance` 200 → **2000**; `camera.far` → **5000**; `controls.enablePan = true`.
- **WASD free-cam in orbit mode too** (currently WASD only drives the NPC body). In orbit mode, WASD pans the `controls.target` + camera together (sail sideways across districts); Shift = faster; Q/E = down/up. NPC mode unchanged.
- **Smooth fly-to**: `DistrictSign` click (or a `flyTo(x,y,z)` util) tweens `camera.position` + `controls.target` over ~1.2s via `Genesis.AnimationScheduler`, with easing. No jarring cuts.
- **Horizon fog** tinted to PLT palette (deep indigo → cyan) so the world edge reads intentional, not a clip boundary. Fog `far` tied to `camera.far`.

## PLT framing
- **Profit:** the bigger world is *perceivable* — unlock is the cheapest 10× win.
- **Love:** flight = freedom; the visitor owns the space.
- **Tax:** larger far plane = more fragments; mitigated by sector sleep + infinite grid fade.

## Relation
Unlocks [[SOUL-GUN - District Streaming Sectors]] + [[SOUL-GUN - Infinite Camera-Locked Grid]]. Works with [[SOUL-GUN - Genesis Animation Scheduler]] for fly-to tweens.
