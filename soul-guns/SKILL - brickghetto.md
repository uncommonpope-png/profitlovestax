# SKILL — brickghetto

slug:: brickghetto
phase:: build
status:: extracted (verified working, NOT applied to CPL city — Pope declined the aesthetic)
source:: Kenney Retro Urban Kit (CC0) + cosmic-pyramid-library/index.html
PLT:: Profit 0.9, Love 0.3, Tax 0.5

## Summary
WHEN TO USE: When any Three.js world needs real, thematic buildings instead of procedural `BoxGeometry` fluff. Archetype affinity: BUILDER (construct), OBSERVER (place). Problem solved: replace placeholder boxes with 125 modular GLB pieces (walls a/b/c, roofs, windows, doors, barriers, lights, roads, details) assembled into a retro-urban skyline. Verified working in CPL (load + assemble + render confirmed) but the aesthetic was declined for the Library world — kept as a reusable gun for other worlds (Dark City, Soulverse, future builds).

## Schema
- trigger: `loadUrbanAsset(name, x, z, rotY, scale)` OR `assembleUrbanBlock(x, z, type)` OR world boot loads registry
- inputs: { glbName: string, position:{x,z}, rotY: radians, scale: number, buildingType: Office|Shop|Apartment|Tower|House }
- outputs: { mesh: THREE.Group (loaded GLB), registered: bool, drawCalls: +N }

## Consequence
- **Real geometry replaces boxes** — buildings gain retro detail (awning, barrier, ladder, painted wall, antennas).
- **Per-piece loading** — each GLB is async via `GLTFLoader`; must be cached (Map by glbName) to avoid re-fetch.
- **CC0 license** — no attribution required; safe for Hub download.
- **Server requirement** — GLB fetch over HTTP fails on `file://` (CORS). Must serve folder: `python -m http.server` in `cosmic-pyramid-library/`.

## Feedback
- Asset appears at grid coordinate with correct rotation/scale.
- Cache hit on second placement (no network).
- If server not running → console error, building absent (graceful: box fallback optional).

## States
| State | Behavior | Visual |
|---|---|---|
| LOADING | GLTFLoader fetching | Transparent placeholder until loaded |
| PLACED | Mesh in scene, cached | Retro building piece visible |
| CACHED | Reuse from Map | Instant, no fetch |
| MISSING | glbName not in registry | Fallback box (debug color) |

## Gaps (mechanics not yet consequences)
- No local server check — user may open via `file://` and see nothing. Must document/automate.
- Building assembly is manual (piece-by-piece). No procedural "assemble a full tower from kit" yet.
- No collision/footprint system — assets placed by coordinate only.
- **CRITICAL LESSON (black-screen root cause):** a building generator that pushes `mesh: null` into the `buildings` array CRASHES the whole scene. Init loop at `index.html:2222` does `nearest.mesh.material.emissive.setHex(...)` with NO null guard. Always push a valid `THREE.Mesh` (even a hidden foundation box) as `b.mesh`. This is why the first graft black-screened; fixed by giving `makeUrbanBuilding` a foundation box.

## Composition
- **CPL World City** (`cpl_world_city`) — VERIFIED working here, but Pope declined the aesthetic ("just boxes and crates"). Gun kept reusable, NOT applied to CPL.
- **3JS BufferGeometry** (`3js_buffergeometry`) — GLB ultimately becomes BufferGeometry under the hood.
- **3JS Material** (`3js_material`) — GLB ships its own PBR materials; we may override emissive for GSK mood.
- **Combo: GIBSON IN THE CITY** — urban kit buildings become system nodes; windows flash on GSK mood.
- **Black Screen Protocol** — graft loader first (render-neutral), verify, then swap generator; never push null mesh.

## Asset Layout
- Root: `cosmic-pyramid-library/assets/retro-urban-kit/`
- GLBs: `Models/GLB format/*.glb` (125 files)
- Registry: `assets/retro-urban-kit/registry.json` (glbName → buildingType, footprint)
- Loader: `GLTFLoader` already imported at index.html:598

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - gt3rs]] · [[SKILL - paimon]] · [[SKILL - 3JS Mesh]]
