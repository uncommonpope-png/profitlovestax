# SKILL — brighten-city (Global Scene Brightness Pass)

slug:: brighten-city
phase:: build
status:: active (verified — exposure 0.8→1.5 brightened whole CPL city + World plate)
source:: cosmic-pyramid-library/index.html (renderer + lights)
PLT:: Profit 0.8, Love 0.4, Tax 0.2

## Summary
WHEN TO USE: When the whole Three.js scene (city + every grafted asset + the World plate) is too dim and you want to lift it globally — not per-object. Archetype affinity: OBSERVER (taste), BUILDER (lighting). Problem solved: assets graft fine but the scene reads dark because the renderer tone-maps low and the ambient/hemi/fill lights are weak. This gun brightens everything at once via three global levers.

## Schema
- trigger: at renderer/scene setup, or a live tweak
- inputs: { exposure, hemiIntensity, fillIntensity }
- outputs: { scene uniformly brighter }

## Consequence (the verified lever set)
- **`renderer.toneMappingExposure`** (ReinhardToneMapping): `0.8 → 1.5` — global lift, the biggest lever.
- **`HemisphereLight(sky, ground, intensity)`**: `0.6 → 1.1` — sky/ground fill.
- **`DirectionalLight` fill**: `0.2 → 0.5` — key fill.
- Optional: add `THREE.AmbientLight` for flat fill if still dim.
- These are GLOBAL — they brighten the city, the World plate, Paimon, cars, scattered props together. No per-mesh edits.

## Feedback
- Whole scene visibly brighter; grafts that were near-black (metallic) also benefit from more ambient.
- Over-bright → washout; pull exposure back toward 1.2.

## States
| State | Behavior | Visual |
|---|---|---|
| DIM (default) | exposure 0.8, hemi 0.6, fill 0.2 | Moody, dark |
| BRIGHT | exposure 1.5, hemi 1.1, fill 0.5 | Clear, readable |
| WASHED | exposure >2.0 | Blown out |

## Gaps (mechanics not yet consequences)
- No per-zone brightness (e.g. city bright, Heavens dim). Would need layered lights or post-processing.
- Not persisted to a config; currently a code edit. Could expose `window.__exposure` for live tweaks.
- Self-lit characters (paimon) already have point lights; global brighten is additive on top.

## Composition
- **world-plate** (`world-plate`) — the scene this brightened.
- **recolor-asset** (`recolor-asset`) — per-object restyle vs this global lift.
- **gt3rs** / **paimon** — grafts that benefit from the brighter scene.
- **3JS Light** — canonical doc for Ambient/Hemisphere/Directional/Point lights.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - world-plate]] · [[SKILL - recolor-asset]] · [[SKILL - 3JS Light]] · [[SKILL - gt3rs]] · [[SKILL - paimon]]
