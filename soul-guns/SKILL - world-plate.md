# SKILL — world-plate (Edge-Connecting District / "World" Graft)

slug:: world-plate
phase:: build
status:: active (verified — world.glb 66MB grafted flush at +X city edge, grid-snapped)
source:: world.glb + cosmic-pyramid-library/index.html
PLT:: Profit 0.9, Love 0.5, Tax 0.4

## Summary
WHEN TO USE: When grafting a large environment/"world" GLB so it **connects to the city grid edge like a LEGO plate** — flush against the boundary, grid-snapped, sharing the city's coordinate space. Archetype affinity: BUILDER (extend), ARCHITECT (connect). Problem solved: dropped blindly, a big world floats, overlaps, or sits disconnected. This gun pins it to the grid edge so it reads as a contiguous district. Verified with `world.glb` (66 MB) at the +X edge of the CPL city.

## Schema
- trigger: `worldLoader.load(url, onLoad)` at world boot
- inputs: { url, edge: '+X'|'-X'|'+Z'|'-Z', targetFootprint: number (default 60), snap: GRID_SP }
- outputs: { wrap: THREE.Group (normalized world), edgeX: number }

## Consequence
- **Grid math**: city grid `gs=11, sp=7` → half-extent `GRID_OFF = (gs-1)*sp/2 = 35`. Cell spacing `GRID_SP = 7` is the LEGO snap.
- **Normalize footprint**: `s = targetFootprint / max(size.x, size.z)`; center XZ + sit base on ground (`model.position = -center.x, -box.min.y, -center.z`).
- **Flush placement**: near edge at `GRID_OFF + halfX` (model's near edge on the boundary, extending outward), then `Math.round(wx / GRID_SP) * GRID_SP` to snap to grid.
- **Level the seam (hill fix)**: if the asset is a slope/hill, `wrap.rotation.y = Math.PI` spins the hill AWAY from the city so the level edge connects. The connection point stays pinned at the boundary regardless of spin.
- **Buffer gap (anti-cram)**: to avoid cramming against the outermost buildings, place the near edge at `GRID_OFF + GAP + halfX` (GAP ~20) so it reads as its own district with breathing room.
- **Same space**: add to `cityGroup` (not scene) so it shares the city's coordinates → visually connects.
- **Single heavy load**: 66 MB loaded fine as ONE asset. The earlier crash was BATCHING heavy files. One big load = safe ceiling; batching = crash.
- **Not Draco** (only `KHR_materials_pbrSpecularGlossiness`) → standard `GLTFLoader` works.

## Feedback
- World appears as a contiguous district flush against the city edge, grid-aligned.
- Needs brightening (whole city is dim) — see Gaps.

## States
| State | Behavior | Visual |
|---|---|---|
| LOADING | GLTFLoader fetching 66MB | Nothing yet (few sec) |
| PLACED | Flush at edge, snapped | Connected district |
| TUNED | Scale/rotation/snap adjusted | Tighter seam |

## Gaps (mechanics not yet consequences)
- **Brightness**: whole city was too dim → solved by [[SKILL - brighten-city]] (exposure 0.8→1.5, hemi 0.6→1.1, fill 0.2→0.5).
- No rotation control yet (faces default axis). Add `wrap.rotation.y` to orient the seam.
- No interior lighting for the World's own meshes (self-light per the gt3rs/paimon pattern if it renders black).
- **License**: open source per Pope directive (not for resale).

## Composition
- **gt3rs** (`gt3rs`) — single-asset graft pattern this extends to big environments.
- **paimon** (`paimon`) — self-light fix if the World renders dark.
- **recolor-asset** (`recolor-asset`) — restyle the World.
- **brickghetto** (`brickghetto`) — modular-kit cousin.
- **3JS Scene** (`3js_scene`) / **3JS Light** — the brightness pass lives here.
- **CPL ASSET MAP** (`CPL ASSET MAP`) — where this asset is logged.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - gt3rs]] · [[SKILL - paimon]] · [[SKILL - brickghetto]] · [[SKILL - recolor-asset]] · [[SKILL - brighten-city]] · [[SKILL - 3JS Light]]
