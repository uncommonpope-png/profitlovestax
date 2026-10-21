# SKILL — paimon (Genshin Character → Walking Three.js NPC)

slug:: paimon
phase:: build
status:: active (verified in CPL city — self-lit, wandering, floating)
source:: genshin_impact_paimon.glb + cosmic-pyramid-library/index.html
PLT:: Profit 0.9, Love 0.5, Tax 0.3

## Summary
WHEN TO USE: When grafting a downloaded character GLB (game NPC, hero, mascot) into a Three.js world as a living, walking NPC. Archetype affinity: OBSERVER (presence), BUILDER (place), GUIDE (she is the companion). Problem solved: raw character GLBs usually (a) render BLACK because they are metallic with no environment map, (b) have NO embedded skeletal animations, and (c) have unknown units/pivot. This gun makes any character visible, walking, and alive. Verified with Genshin's Paimon in CPL: she loads, self-lights, slides around the city, and bobs.

## Schema
- trigger: `gltfLoader.load(url, onLoad)` OR world boot spawns companion NPC
- inputs: { url, home:{x,z}, targetSize: number (height meters), speed: number }
- outputs: { wrap: THREE.Group (normalized+lit character), paimonNPC: live handle }

## Consequence
- **Self-light fix (critical):** character GLBs are metallic + no envMap → render black. Traverse meshes: `metalness = min(metalness, 0.1)`, `roughness = 0.75`, boost `emissiveIntensity`, then attach a `THREE.PointLight` child to the wrap. WITHOUT THIS SHE IS INVISIBLE.
- **No embedded animations:** the GLB had no `animations` array → `AnimationMixer` has nothing to play. So we FAKE life with a float-bob: `wrap.position.y = 0.15 + Math.sin(time*2)*0.08`.
- **Auto-normalize:** `Box3().setFromObject` → `s = 1.5 / size.y` (height to ~1.5m), recenter XZ + sit base on ground, wrap in Group.
- **Dedicated wander:** independent of the generic `citizens` loop. Every 4s pick random target (r 6–28), slide at 2 u/s, face direction (`rotation.y = atan2(dir.x, dir.z)`). Guarantees movement (the generic loop left her static).
- **Tagged NPC:** `wrap.userData = { name:'Paimon', isNPC:true }`.
- **Server requirement:** GLB over HTTP only; `file://` blocks fetch (CORS).

## Feedback
- Visible lit character walking the city, gentle float.
- Debug beacon (tall unscaled cyan column) used during tuning; REMOVE after confirm.
- Failure: `console.warn('[Paimon] load failed:')`; marker sphere remains at spawn.

## States
| State | Behavior | Visual |
|---|---|---|
| LOADING | GLTFLoader fetching + normalizing + lighting | Cyan marker at spawn |
| WALKING | Dedicated wander + float-bob | Lit character sliding, bobbing |
| FAILED | Parse/network error | Marker stays, warning logged |

## Gaps (mechanics not yet consequences)
- No real skeletal animation (GLB lacked clips). Could swap to an animated Paimon model, or add procedural limb sway.
- Not clickable yet — no `userData` payload / interaction. GIBSON-combo candidate: click Paimon → whisper shows lore.
- No GSK mood link (generic citizens get speed-modulated; Paimon uses fixed speed). Wire `paimonSpeed *= gskPhase.citizenSpeedMul`.
- **LICENSE (Pope directive):** All our assets are **open source, not for resale**. Technique is ours; build and share freely. If a third-party asset's license ever genuinely conflicts, flag it — but the default stance is open source. No commercial restriction.

## Composition
- **gt3rs** (`gt3rs`) — same real-GLB graft family (auto-normalize + self-light pattern).
- **brickghetto** (`brickghetto`) — asset-graft family.
- **3JS Mesh** (`3js_mesh`) — GLB becomes Group of meshes.
- **3JS Material** (`3js_material`) — metalness/emissive fix is pure Material work.
- **3JS Vector3** (`3js_vector3`) — wander direction math.
- **Soul Note: Skeleton/SkinnedMesh** — the canonical doc for real skeletal anim; this gun is the clip-less fallback.
- **Combo: GIBSON IN THE CITY** — Paimon as a guide NPC; click → lore whisper.

## Asset Layout
- GLB: `cosmic-pyramid-library/assets/paimon/genshin_impact_paimon.glb` (1.27 MB, no Draco, no animations)
- Loader: `GLTFLoader` (index.html:598); graft after citizens loop (~index.html:2102)
- Wander update: animate loop (~index.html:3912)
- Debug handles: `window.__paimon` (wrap), `window.__paimonMixer`

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - brickghetto]] · [[SKILL - gt3rs]] · [[SKILL - 3JS Mesh]] · [[SKILL - 3JS AnimationMixer]]
- Soul Note: Skeleton / SkinnedMesh (the clip-less fallback technique)
