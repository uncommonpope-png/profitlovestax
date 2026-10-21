---
type:: [[soul-note]] [[page]]
mission:: [[GENESIS ENGINE GAP]]
phase:: B3
status:: RECORDED ✅
---

# SOUL-NOTE — Open-World Scale Doctrine (web research 2026-07-16)

## Sourced from
- Cinevva "Building an open world in the browser" (pt 1 & 3, 2026-02) — frame budget, InstancedMesh, sector sharding, Cloudflare Durable Objects.
- "Open World Zone" (cnblogs) — 4000 buildings, LOD: full interior → pink shell → single skyline block at distance. Threshold model.
- idctop "Three.js step-load large models" — chunk streaming + LOD + Draco/Basis compression, 200MB→2s low-poly first paint.
- three.js forum `THREE.InfiniteGridHelper` (Fyrestar) + `GridPristine` — shader grid locked to camera target, fades by distance, anti-aliased, one draw call.
- three.js official `webgl_batch_lod_bvh` — BatchedMesh + 4 LODs + BVH frustum cull, 500k instances.
- `LODInstancedViewSystem` (DolphinIQ) — InstancedMesh per LOD tier, distance-swapped.
- `Eternal Ride` (2026-05) — periodic-noise infinite terrain, no chunks/seams, float32-safe at 1 AU.

## The doctrine (what "way bigger" actually means)
1. **Sectors, not a bigger box.** Stream districts by distance; sleep far; wake on approach. Genesis `SectorManager` + `Visibility` already implement this — extend it (more/bigger sectors, higher `maxDistance`).
2. **InstancedMesh + LOD tiers** for every repeated entity (buildings, cars, trees, lamps). One draw call per tier.
3. **Infinite floor = camera-locked shader grid** (`InfiniteGridHelper` pattern), not a scaled plane. Free, endless, fades to horizon.
4. **Far districts → impostor skyline** (cross-plane billboard / BatchedMesh LOD). Memory stays flat.
5. **Camera must unlock**: `maxDistance` 200→2000+, `far`→5000+, `enablePan`, WASD free-cam in orbit mode.
6. **Periodic-noise terrain** (future) for ground beyond the grid — seamless, precision-clean at any distance.

## PLT
Profit = engine already built for this; Love = visitor flies a living continent; Tax = must keep frame budget via sleep+instancing.
