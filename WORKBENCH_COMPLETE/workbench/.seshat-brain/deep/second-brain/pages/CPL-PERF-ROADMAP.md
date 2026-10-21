- type: plan
- title: CPL Performance + Capability Roadmap (tailored)
- source: Lil Bunny (hired graphics specialist + game designer) suggestions, tailored by Profit/Neo
- status: active
-

# CPL Performance + Capability Roadmap (Tailored)

Source: suggestions from hired specialist (Lil Bunny). **All items tailored to OUR stack**, not taken literally.

## Hard constraints discovered (must respect)
- Loader decodes **Meshopt only** (`index.html:880-892`, `setMeshoptDecoder`). NO `DRACOLoader`, NO `KTX2Loader` wired. → Any "Draco" or "KTX2" suggestion must be adapted (add decoders) or rejected.
- World is a **single `index.html`** on CDN/UMD scripts. Any npm/ESM lib (Rapier, Yuka, quarks, Rete) needs an `importmap` or inlining.
- **146 `.opt.glb` already exist** in repo (made with `gltfpack -cc`). 6 brutal raw GLBs already deleted (assets 0.97 GB → 0.78 GB, commit pushed).
- No `service-worker.js` exists despite `index.html:987` registering it → registration silently fails. No precache problem, but no offline cache either.

## Compression reality check (pilot result)
- `gltfpack -cc` on `procedural_city_6.glb` → **0%** (geometry already meshopt-quantized; tool warns "file uses quantized geometry").
- npm `gltfpack` **cannot compress textures** ("built without BasisU support").
- `@gltf-transform/cli` is broken on Node 24 (lodash ESM subpath error).
- **Conclusion:** brutal file sizes are **texture-dominated + already geometry-compressed**. "Batch re-compress everything" yields little with current tooling. Real texture shrink needs **native gltfpack binary + wired `KTX2Loader`** (bigger lift).

---

## PHASE 1 — PERFORMANCE (do now, safe items first)

1. **Zone-based lazy loading** (#2) — biggest remaining win. Load only near-player assets + fetch-ahead radius; unload when far. Adapt the ZoneLoader pattern to CPL's `makeGLTF({lazy})` + `loadRealmAssetsOnce`. Replace eager startup loaders with zone-gated ones.
2. **Delete remaining brutal raw GLBs** — beyond the 6 removed: 3 Porsches (raw, unused since `.opt` used), `procedural_city_6.glb`, `baby_goku` + `cat_girl` (loaded raw), `world.glb` raw (unused; `.opt` loaded). Repoint refs.
3. **Finish `.opt.glb` repointing** — every raw path referenced in `index.html` → its `.opt.glb` sibling (146 already exist). Scriptable.
4. **Instancing for repeated props** (#3) — lamp posts, trees, stalls → `InstancedMesh` (1 draw call).
5. **LOD for background scenery** (#4) — `THREE.LOD` for space stations / distant cities.
6. **Lazy-cache service worker** (#5) — add `service-worker.js` that caches HTML/JS/CSS eagerly, `.glb` on first-fetch (not install). Currently absent.
7. **OPTIONAL / bigger lift:** native `gltfpack` binary + wire `KTX2Loader` + `setKTX2Loader` in `makeGLTF` → real texture shrink (KTX2 stays compressed on GPU = VRAM win too).

## PHASE 2 — CAPABILITY ENGINES (after perf solved)

Order (tailored):
1. **THREE.PositionalAudio** — built-in, FREE. Souls whisper louder as you approach. Do first.
2. **Yuka** — steering/state-machine NPC behavior ("Cat Girl wanders"). We have behavior scaffolding; Yuka polishes. ESM → importmap.
3. **three.quarks** — GPU particles for GSK `surge`/`spawn` instead of pop-in.
4. **Rapier physics** (#7) — kinematic character controller for avatars (collision vs walls/pyramid/each other). `kinematicPositionBased` body + `computeColliderMovement`. Keep existing wander/task AI; only resolve movement. `-compat` WASM build works without bundler. Register static world geometry once via trimesh/convexHull colliders.
5. **Rete.js** — node-graph visual scripting for the GSK terminal (compiles to sandboxed calls).
6. **Colyseus** — authoritative multiplayer (last; biggest lift).

## THE DIFFERENTIATOR — GSK Sandboxed Spatial Terminal (#6)
- In-world terminal as `CSS3DObject` / canvas texture (not flat DOM).
- Safe execution: sandboxed iframe (`sandbox="allow-scripts"`, NO `allow-same-origin`) OR Web Worker. NOTE: `Function()` in worker is NOT a true sandbox (can still `fetch`/exfiltrate) — harden before shipping.
- Terminal = raw command layer under existing GSK World Commands (spawn soul / tower / surge / calm). GSK's thought-stream can push generated code straight in → "AI writes code that reshapes the world it's writing in, watched safely." Headline feature; build as first-class, not side panel.
- Rete.js enhances it (visual scripting).

## Decisions still open (ask Craig)
- Compression path: (a) native gltfpack + KTX2Loader, (b) pivot to lazy-load + delete brutal, or (c) both?
- Which Phase-2 engine to start first (recommend PositionalAudio — free).
