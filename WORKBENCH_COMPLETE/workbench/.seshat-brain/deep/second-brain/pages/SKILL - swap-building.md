# SKILL — swap-building (Procedural Building → GLB Replacement)

slug:: swap-building
phase:: build
status:: active (extracted from Car Showroom fix — removes full procedural building parts before placing GLB)
source:: cosmic-pyramid-library/index.html (makeBuilding + car_showroom.glb)
PLT:: Profit 0.9, Love 0.4, Tax 0.3

## Summary
WHEN TO USE: When Grand Code Pope gives a **building** GLB and it should become part of the city. Rule: building assets do **not** get dropped on top of existing objects. They **replace** one procedural box building in a clear city slot. Archetype affinity: BUILDER (replace), ARCHITECT (fit). Problem solved: procedural buildings are made of multiple parts; removing only the main box leaves windows/spines/roof/antenna behind like scaffolding. This gun removes the entire generated building before placing the GLB.

## Schema
- trigger: `buildingAssetLoader.load(url, onLoad)` OR Pope gives a building asset
- inputs: { url, targetSlot:{x,z}, targetFootprint, clearRadius }
- outputs: { wrap: THREE.Group, removedParts: THREE.Object3D[], slot:{x,z} }

## Consequence
- **Track all generated parts**: `makeBuilding()` now creates `parts = []` and pushes every procedural component: box, window strips, neon spines, roof, antenna, tower crown/beacon.
- **Preserve the building contract**: `buildings.push({ mesh: box, parts, x, z, type, h, w, d })` keeps `mesh` valid for old code while giving swaps full cleanup power.
- **Swap, do not stack**: a building GLB removes `slot.parts` before adding the GLB. Fallback removes `slot.mesh` for older records.
- **Intentional slot selection**: pick a target clear coordinate, then find the nearest procedural building slot. For the showroom: target near `(-21, 21)`.
- **Footprint fit**: normalize GLB footprint to fit inside a 7u grid cell (`targetFoot = 5.5`) so it doesn't crowd neighbors.
- **Interior readability**: add a warm point light to building interiors when needed (showroom glow).

## Feedback
- Correct: GLB building occupies a procedural building slot with no leftover scaffolding.
- Wrong: old windows/roof/antenna remain → `parts[]` was not tracked/removed.
- Wrong: asset overlaps another building → target slot/footprint too crowded.

## States
| State | Behavior | Visual |
|---|---|---|
| PROCEDURAL | default generated box building | box + windows + spines + roof |
| SWAPPING | remove `slot.parts` | empty grid cell |
| GLB-BUILDING | normalized GLB placed at slot | real building replaces box |
| BAD-STACK | GLB placed without cleanup | scaffolding/overlap |

## Gaps (mechanics not yet consequences)
- No automatic occupancy map yet; slot choice is nearest-to-target rather than collision-tested.
- No per-building registry yet (`buildingName → targetSlot → GLB path`). Add this so future buildings persist cleanly.
- No editor UI for selecting the exact building to replace.
- Satellite district buildings are not in `buildings[]`; this gun currently covers the main grid's `makeBuilding()` buildings.

## Composition
- **car-showroom** behavior lives under this gun until a dedicated showroom gun is needed.
- **gt3rs** (`gt3rs`) — vehicle graft; cars place on roads, not building slots.
- **world-plate** (`world-plate`) — district-scale placement, not building swap.
- **recolor-asset** (`recolor-asset`) — restyles swapped GLBs.
- **brighten-city** (`brighten-city`) — global lighting for swapped GLBs.
- **CPL ASSET MAP** (`CPL ASSET MAP`) — logs which asset replaced which slot.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Asset Instance
- **Car Showroom**: `assets/car-showroom/car_showroom.glb`
- Placement rule: nearest procedural building to `(-21, 21)`
- Cleanup: remove `slot.parts` before placing showroom
- Fit: `targetFoot = 5.5`
- Debug handle: `window.__showroom`

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - gt3rs]] · [[SKILL - world-plate]] · [[SKILL - recolor-asset]] · [[SKILL - brighten-city]] · [[SKILL - 3JS Mesh]]
