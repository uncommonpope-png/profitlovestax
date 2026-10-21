---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B3
status:: FORGED ✅
---

# SOUL-GUN — Instanced LOD Entities (B3)

**One draw call for thousands of buildings/cars/lamps/trees.** The scale tax paid once, so districts can be huge.

## What it does
- For each repeated entity type, build **LOD tiers** (high / mid / low / impostor-cross-plane) and pack each tier into a `THREE.InstancedMesh` (or `BatchedMesh` + BVH for raycast needs).
- A `LODInstancedViewSystem`-style updater: each frame, for visible sector entities, pick the tier by camera distance and write the instance matrix. Near = full mesh, mid = simplified, far = billboard impostor (skyline silhouette).
- Cars: the existing `cars[]` movement loop drives instance matrices instead of per-car `Group`s (28 cars → 2800 cars at same cost).
- Buildings: `makeBuilding` output merged per-tier into instanced batches keyed by facade material (InfiniteCityThreeJS pattern). `applyCityPack` skin applied once per batch.
- Far districts collapse to impostor skyline via `BatchedMesh` LOD (three.js official 500k-instance demo).

## PLT framing
- **Profit:** 10× the world, same frame budget.
- **Love:** density and life everywhere the eye lands.
- **Tax:** instance buffer memory; impostor redraw cost (throttled by angle/distance).

## Relation
Consumed by [[SOUL-GUN - District Streaming Sectors]]. Doctrine from [[SOUL-NOTE - Open-World Scale Doctrine]].
