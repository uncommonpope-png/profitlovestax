# SKILL — graphics-ibl (Image-Based Lighting: Realistic Metallic Reflections)

slug:: graphics-ibl
phase:: build
status:: active (Base Model — verified, balanced at exposure 0.55)
source:: cosmic-pyramid-library/index.html (PMREMGenerator + RoomEnvironment)
PLT:: Profit 0.9, Love 0.6, Tax 0.3

## Summary
WHEN TO USE: To stop downloaded metallic GLBs (cars, showroom) from rendering flat/black and to give the whole city soft ambient bounce. Archetype affinity: ARTIST (lighting), ARCHITECT (pipeline). Problem solved: `MeshStandardMaterial` metals need an environment to reflect; without one they read black. `scene.environment` via PMREM is the fix.

## Schema
- trigger: metallic GLBs look black/flat; scene lacks ambient realism
- inputs: { renderer, scene }
- outputs: { scene.environment: PMREM texture }

## Consequence
- **PMREM**: `const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();`
- **RoomEnvironment**: `scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;` — r128 `RoomEnvironment` constructor takes NO args (verified).
- **Effect**: every `MeshStandardMaterial` now samples the env for reflections + ambient IBL. Cars/showroom stop looking black; procedural city gets gentle bounce light.
- **Cost**: PMREM gen is one-time, cheap. Does NOT add heavy load. (Page slowness is from 66MB `world.glb` + other GLBs streaming, not IBL.)
- **Balance**: IBL roughly doubles ambient → must lower `toneMappingExposure` (we went 1.0 → 0.55) and ease bloom (strength 0.7 → 0.45, threshold 0.4 → 0.5).
- **Import**: `three/addons/environments/RoomEnvironment.js` (verified 200 on unpkg r128).

## Feedback
- Correct: metals catch real reflections, scene has soft fill, not blown out.
- Wrong: all-white/washed = exposure too high after IBL; still black metals = env not assigned or materials override `envMap`.

## States
| State | Behavior | Visual |
|---|---|---|
| NONE | no environment | black metals, flat |
| IBL | scene.environment set | reflective metals, ambient (BASE MODEL) |
| UNBALANCED | IBL + high exposure | blown out |

## Gaps (mechanics not yet consequences)
- `scene.environment` lights EVERYTHING globally; no per-object intensity control in r128 (no `scene.environmentIntensity` yet).
- Did not replace the showroom's `metalness=0.2` clamp — IBL now makes that clamp less necessary; candidate for revisit.
- Heavy Porsches (deferred) would also benefit once loaded.

## Composition
- **graphics-color** (`graphics-color`) — its exposure compensates for this gun's ambient.
- **swap-building** (`swap-building`), **scatter** (`scatter`) — grafted GLBs now render correctly under IBL.
- **DOUR-BIBLE** (`DOUR-BIBLE`) / **CPL ASSET MAP** (`CPL ASSET MAP`) — recorded in Base Model doc.
- **brighten-city** (`brighten-city`) — superseded by color+IBL pipeline.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]] · Base Model: [[CPL Graphics Base Model]]
- Sibling guns: [[SKILL - graphics-color]] · [[SKILL - swap-building]] · [[SKILL - scatter]]
