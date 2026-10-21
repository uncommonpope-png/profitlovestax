# SKILL — clear-obstruction (Remove Full Procedural Scaffolding Before GLB Placement)

slug:: clear-obstruction
phase:: build
status:: active (extracted from Car Showroom scaffolding fix)
source:: cosmic-pyramid-library/index.html (`makeBuilding`, `slot.parts`, showroom swap)
PLT:: Profit 0.8, Love 0.4, Tax 0.3

## Summary
WHEN TO USE: Before placing any real GLB asset into a city cell that previously held generated geometry. Archetype affinity: CLEANER (clear), BUILDER (fit). Problem solved: a procedural building is not just the main box. It also creates windows, neon corner spines, rooftop details, antenna, and sometimes a tower crown/beacon. If only the square box is removed, the leftover generated pieces look like scaffolding and obstruct the new GLB.

## Schema
- trigger: before `swap-building` places a GLB building
- inputs: { slot: { mesh, parts[], x, z }, cityGroup }
- outputs: { cleared: boolean, removedParts: THREE.Object3D[] }

## Consequence
- **Track every procedural part at creation time**: `parts = []` inside `makeBuilding()`.
- **Push each generated object** into `parts`: main box, window strips, neon spines, roof, antenna, tower crown, beacon.
- **Store the manifest**: `buildings.push({ mesh: box, parts, x, z, type, h, w, d })`.
- **Clear the whole slot**: `slot.parts.forEach(part => cityGroup.remove(part))` before GLB placement.
- **Fallback**: if old records have no `parts`, remove `slot.mesh` only — but this is incomplete and should be treated as legacy.

## Feedback
- Correct: GLB sits in a clean cell with no leftover scaffolding/antenna/neon strips.
- Wrong: weird rods, windows, roofs, or glow strips remain around the GLB → not all parts were tracked/removed.

## States
| State | Behavior | Visual |
|---|---|---|
| DIRTY-SLOT | Only main mesh removed | leftover scaffolding/obstructions |
| MANIFESTED | `parts[]` contains every generated piece | cleanup possible |
| CLEAR | every part removed | empty cell ready for GLB |
| SWAPPED | GLB placed after cleanup | clean replacement |

## Gaps (mechanics not yet consequences)
- Does not yet clear nearby random props, trees, lamps, or moving cars. Future occupancy map should clear a radius, not only the building manifest.
- Satellite district buildings are not tracked in `buildings[]` yet.
- No visual debug outline for cleared cell.

## Composition
- **swap-building** (`swap-building`) — consumes this gun before placing a GLB building.
- **car-showroom** behavior — first verified use case.
- **CPL ASSET MAP** (`CPL ASSET MAP`) — records which asset replaced which slot.
- **world-plate** (`world-plate`) — district placement; can also need obstruction radius clearing.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - swap-building]] · [[SKILL - world-plate]] · [[SKILL - gt3rs]] · [[SKILL - 3JS Mesh]]
