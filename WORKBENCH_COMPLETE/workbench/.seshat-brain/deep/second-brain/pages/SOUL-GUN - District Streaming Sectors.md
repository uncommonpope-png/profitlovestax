---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B3
status:: FORGED ✅
---

# SOUL-GUN — District Streaming Sectors (B3)

**The "way bigger" world architecture, built on Genesis's existing SectorManager + Visibility.** Extends the city from a 70u core into named, distance-streamed districts.

## What it does
- Defines district configs: `{ name, radius, maxDistance, buildFn, sleep:true }`. Core stays `off=35`; add districts at r≈300 / 600 / 1000 / 1500, each its own `THREE.Group`.
- Each district registered with `Genesis.SectorManager.register(name, group, { maxDistance: radius+slack, autoSleep:true })` and `Genesis.Visibility.register(name, group, { priority, maxDistance })`. Far districts **sleep** (no render/update cost) until the camera approaches — proven by existing `outerCity` (r95–158, `maxDistance:400`).
- A `DistrictSign` (diegetic holo-panel) at each border; clicking it tweens the camera (`Genesis.AnimationScheduler`) to that district — the "fly-to" feel.
- World plate (`world.opt.glb`) becomes **District 0 anchor**, scaled footprint 60→200 so it reads as a recovered continent, not a coaster.
- Each district's repeated entities (buildings/cars/lamps) spawn via **InstancedMesh + LOD** (see [[SOUL-GUN - Instanced LOD Entities]]), so a 1500u world stays in frame budget.

## PLT framing
- **Profit:** true open-world scale with zero new engine — Genesis already streams.
- **Love:** the visitor discovers districts; the world rewards exploration.
- **Tax:** sector sleep + instancing keep GPU/CPU flat; only the near district is "real."

## Relation
Built on [[SOUL-GUN - Genesis Sector Manager]] + [[SOUL-GUN - Genesis Visibility System]]. Each district owns a finite local floor/terrain mesh; the broken infinite camera-locked grid was retired after it rendered a world-splitting plane. Entities from [[SOUL-GUN - Instanced LOD Entities]]. Vertical expansion uses [[SOUL-GUN - Vertical Dimension Stack]].
