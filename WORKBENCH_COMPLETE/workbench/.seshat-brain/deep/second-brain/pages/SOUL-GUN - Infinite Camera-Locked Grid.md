---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B3
status:: FORGED ✅
---

# SOUL-GUN — Infinite Camera-Locked Grid (B3)

**The endless floor for a "way bigger" world.** Replaces the static 600×600 plane with a single shader quad that recenters on the camera target every frame and fades to the horizon.

## What it does
- Implements the `THREE.InfiniteGridHelper` (Fyrestar) pattern: a `PlaneGeometry(2,2)` + `ShaderMaterial` whose vertex shader offsets by `cameraPosition.xz` (so the grid never moves in world space — it's pinned to the viewer), and whose fragment shader uses `fwidth` for anti-aliased lines + `pow(distance, 3)` for horizon fade.
- Two layers: minor (cell size) + major (×10), PLT-tinted (cyan/magenta). `transparent`, `depthWrite:false`.
- In the render loop: `grid.position.copy(controls.target).setY(0)` — the grid follows you, so it is *infinite* regardless of how far you fly.
- Replaces `gridFloor` (600u plane) + `gridFloorLines` (400u `GridHelper`). One draw call, no z-fighting with y≈0 objects if `polygonOffset`/slight y-lift used.

## PLT framing
- **Profit:** a horizon that never ends sells "massive" for free.
- **Love:** the visitor always has ground under them, flying forever.
- **Tax:** one shader material; trivial GPU cost; no extra geometry.

## Relation
Pairs with [[SOUL-GUN - World-Alive-On-Boot]] (the survival floor it upgrades). Consumed by [[SOUL-GUN - District Streaming Sectors]] for the far world.
