# SKILL — gt3rs (Porsche 911 GT3 RS — Real GLB Vehicle Graft)

slug:: gt3rs
phase:: build
status:: active (verified in CPL city at (10,0,0), rotated to face road)
source:: 2017_porsche_911_991_gt3_rs.glb + cosmic-pyramid-library/index.html
PLT:: Profit 0.9, Love 0.4, Tax 0.3

## Summary
WHEN TO USE: When grafting a real downloaded GLB vehicle (car) into any Three.js world. Archetype affinity: BUILDER (place), OBSERVER (admire). Problem solved: a raw Sketchfab/store GLB has unknown units, pivot, and orientation — dropped in blindly it is microscopic, gigantic, sunk underground, or off-coordinate. The gun normalizes it deterministically so it always lands correct. Verified working in CPL: Porsche 911 (991) GT3 RS renders at ~4m, sits on the road, faces traffic.

## Schema
- trigger: `gltfLoader.load(url, onLoad)` OR world boot places hero vehicle
- inputs: { url: string, position:{x,z}, rotY: radians, targetSize: number (default 4m) }
- outputs: { wrap: THREE.Group (normalized model), sizeMeters: {x,y,z} }

## Consequence
- **Auto-normalize** — `THREE.Box3().setFromObject(model)` → size + center. Scale `s = targetSize / maxDim`. Model recentred `-center.x, -box.min.y, -center.z` so base sits on ground. Wrapped in a Group so scale/rotation never fight the model's own transform.
- **No black screen** — load is async; failure only `console.warn`, scene stays alive.
- **Material extensions** — model used `KHR_materials_clearcoat/emissive_strength/specular/transmission`; standard GLTFLoader handles these. No Draco/Meshopt in this file (would need DRACOLoader).
- **Server requirement** — GLB over HTTP only; `file://` blocks fetch (CORS). Serve via `python -m http.server`.

## Feedback
- Success: vehicle visible at coordinate, correct size, on ground. Console logs normalized size in meters.
- A magenta debug sphere marks the target coordinate until load succeeds (self-removed on load).
- Failure: warning in console, marker remains, no vehicle.

## States
| State | Behavior | Visual |
|---|---|---|
| LOADING | GLTFLoader fetching + normalizing | Magenta marker at coord |
| PLACED | Wrap in scene, scaled/centered | Vehicle correct size on ground |
| FAILED | Parse/network error | Marker stays, warning logged |

## Gaps (mechanics not yet consequences)
- Static prop only — no driving physics, no click interaction, no GSK link yet.
- DRACOLoader not wired — Draco-compressed GLBs would fail (add `DRACOLoader` + decoder path if needed).
- Shadow/lighting may need a ground shadow catcher for best look.

## Composition
- **brickghetto** (`brickghetto`) — same asset-graft family (real GLB → Three.js world).
- **3JS Mesh** (`3js_mesh`) — GLB becomes a Mesh/Group under the hood.
- **3JS Material** (`3js_material`) — clearcoat/transmission PBR from the GLB.
- **Combo: GIBSON IN THE CITY** — hero vehicle as a system node; could flash/respond to GSK mood.

## Asset Layout
- GLB: `cosmic-pyramid-library/assets/porsche-gt3-rs/2017_porsche_911_991_gt3_rs.glb` (9.1 MB)
- GLB: `cosmic-pyramid-library/assets/cadillac/cadillac_cts-v_coupe_race_car.glb` (3.0 MB) — added 2026-07-10
- Loader: `GLTFLoader` (index.html:598); graft block after ships loop (~index.html:2054)
- Debug handles: `window.__porsche` (Porsche wrap), `window.__cadillac` (Cadillac wrap)

## Instances (all governed by this gun)
- **Porsche 911 GT3 RS (2017)** → (10, 0, 0), faces traffic. `window.__porsche`.
- **Cadillac CTS-V Coupe Race Car** → (-10, 0, 0), opposite side. `window.__cadillac`.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - brickghetto]] · [[SKILL - paimon]] · [[SKILL - 3JS Mesh]]
