# SKILL — recolor-asset (Properly Recoloring a Grafted GLB)

slug:: recolor-asset
phase:: build
status:: active (extracted from the neon-pink Mercedes experiment — Pope reverted, wanted the RIGHT way documented)
source:: cosmic-pyramid-library/index.html (Mercedes graft) + threejs.org/docs Material
PLT:: Profit 0.8, Love 0.3, Tax 0.4

## Summary
WHEN TO USE: When you want to recolor / re-skin a grafted GLB asset (car, character, prop) in a Three.js world — e.g. make a Mercedes neon pink. Archetype affinity: BUILDER (restyle), OBSERVER (taste). Problem solved: a naive `material.color.setHex(...)` often does NOT do what you expect because of textures, shared materials, vertex colors, and metalness. This gun documents the correct, safe recoloring path.

## Schema
- trigger: inside the GLB load callback, after `Box3` normalize, before adding to scene
- inputs: { model: THREE.Group, hex: number, opts: { glow, cloneMaterials, stripMap } }
- outputs: { model: recolored, materials unique or shared as chosen }

## Consequence (the correct procedure)
1. **Traverse meshes**: `model.traverse(c => { if (c.isMesh) { ... } })`.
2. **Clone materials first** if you want per-instance unique color (otherwise all instances sharing the material change together): `c.material = c.material.clone();`.
3. **Set base color**: `if (c.material.color) c.material.color.setHex(hex);`.
4. **For glow (neon)**: `if (c.material.emissive) { c.material.emissive.setHex(hex); c.material.emissiveIntensity = 0.5–0.8; }`.
5. **`material.needsUpdate = true`** after changes.
6. **Strip or null the texture map** if you want a FLAT recolor: `c.material.map = null;` (see Gotchas).

## Feedback
- Flat neon: emissive + map=null + low metalness → solid glowing color.
- Tinted: color.setHex only, map kept → color multiplies the texture (subtle tint).
- Wrong: color ignored → usually a texture `map` or vertex colors are overriding it.

## Gotchas (why naive recolor fails)
- **Texture `map` present**: `material.color` MULTIPLIES the map, it does not replace it. A white car tinted pink stays mostly white. To fully recolor, set `material.map = null` (or swap to a solid color material).
- **Shared materials**: GLBs often reuse one material across meshes. Mutating it recolors every mesh using it (sometimes fine, sometimes not). Clone per mesh for independence.
- **Vertex colors**: if geometry has vertex colors, set `material.vertexColors = false` or they win over `material.color`.
- **High metalness + no envMap**: metallic surfaces barely show `color`; the scene has no environment map, so lower `metalness` (≤0.1) or drive `emissive` for the visible color.
- **Transparent / alphaTest materials**: forcing color can break cutouts; preserve `transparent`/`alphaTest`.

## States
| State | Behavior | Visual |
|---|---|---|
| STOCK | No recolor | Original asset colors |
| TINT | color.setHex only | Subtle multiply over texture |
| FLAT | map=null + color | Solid new color |
| NEON | emissive + map=null | Glowing solid color |

## Gaps (mechanics not yet consequences)
- No UI to pick color live (could expose `window.__mercedes.material.color` for console tweaks).
- No palette system (named PLT-themed colors: Profit gold, Love rose, Tax slate).
- Recolor not yet persisted to a registry (would let us restyle without code edits).

## Composition
- **gt3rs** (`gt3rs`) — vehicle grafts this recolors (Porsche, Cadillac, Mercedes).
- **paimon** (`paimon`) — character recolor uses same material override.
- **3JS Material** (`3js_material`) — the canonical doc for `color`/`emissive`/`map`/`metalness`.
- **CPL ASSET MAP** (`CPL ASSET MAP`) — where each asset's current style is logged.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - gt3rs]] · [[SKILL - paimon]] · [[SKILL - 3JS Material]]
