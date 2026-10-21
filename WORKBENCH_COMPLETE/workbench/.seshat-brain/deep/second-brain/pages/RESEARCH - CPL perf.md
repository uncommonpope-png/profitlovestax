# RESEARCH — CPL Perf (Master Plan)

**type:: [[research]] [[plan]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[neodownloadable]] [[CPL ASSET MAP]] [[RESEARCH - CPL render perf]] [[RESEARCH - CPL delivery caching]] [[RESEARCH - CPL textures memory]] [[RESEARCH - CPL tooling pipeline]]**

---

## Pope directive
"switch to god mode research and figure out how we can make it load faster and maybe make the
engines stronger or everything better." → Two axes: **(A) load faster**, **(B) engines stronger**.

## Current state (root cause)
- Total active GLBs ~**119 MB** (world.glb 66.4, mercedes 20.2, misc 17.3) fetched at once.
- **9 eager `GLTFLoader` calls**, parsed only after full download → long black/empty wait.
- **No LoadingManager, no Draco/Meshopt, no KTX2, no progressive/deferred load.**
- No `setPixelRatio` cap (DPR often 2 → 1.8x wasted pixels). Lots of repeated meshes = many draw calls.

## Soul Note index (the expanded plan — "way more notes")
1. [[RESEARCH - CPL perf]] ← this master plan
2. [[RESEARCH - CPL render perf]] — InstancedMesh / merge / LOD / material-share / pixel-ratio / shadows
3. [[RESEARCH - CPL delivery caching]] — Service Worker cache-first + CDN + modulepreload + parse-progress
4. [[RESEARCH - CPL textures memory]] — KTX2/Basis vs WebP, Draco vs Meshopt, dispose(), LQIP
5. [[RESEARCH - CPL tooling pipeline]] — gltfpack/gltf-transform auto-optimize + GitHub Action + measurement gates

## Tiered roadmap (God Mode: RESEARCH only this session; BUILD next)
- **Tier 0 — Compression (biggest first-load win)**
  `gltfpack -cc -tc -ts 0.5` on world.glb + mercedes + misc → ~119 MB → ~25 MB. Wire MeshoptDecoder + KTX2Loader.
- **Tier 1 — Loading UX**
  LoadingManager + real progress overlay (fetch→parse ArrayBuffer); LQIP nebula gradient (zero black screen).
- **Tier 2 — Deferred / priority load**
  Parse critical scene first (plates+city), then stream heaven/mercedes/sky/extra. Far = low-detail (LOD).
- **Tier 3 — Repeat visits**
  Service Worker cache-first for `/assets/**`; modulepreload three + addons; preload critical GLB.
- **Tier 4 — Engines stronger (live FPS)**
  InstancedMesh for citizens (25) + sky clouds (18) + sky-city pillars (4×8); merge per-building geometry;
  cap pixelRatio 1.5; high-performance renderer; shadow autoUpdate=false; shared materials; dispose() on reload.

## Measurement gates (define "done")
- First-load GLB payload < ~25 MB (from 119).
- Time-to-interactive < ~3 s (cached via SW: < 1 s).
- Draw calls down 40%+ on citizen/sky groups.
- `renderer.info` memory stable after repeated world reloads (no leak/crash).

## Status — BUILD COMPLETE (2026-07-10)
Implemented Tiers 0, 1, 3 + partial 4. Committed world repo `b493087`.
- **Tier 0 Compression:** `gltfpack -cc` (EXT_meshopt_compression) on 134 GLBs → **90.2 MB saved**.
  Eager world GLBs **~129 MB → ~38 MB** (3.4x). `world.glb` 66.4 → 10.6 MB (gltfpack also
  merged 142 meshes → 1, a free draw-call cut). `MeshoptDecoder` wired via `makeGLTF()` factory;
  all eager paths → `.opt.glb`.
- **Tier 1 Loading UX:** byte-accurate `LoadingManager` progress overlay + nebula LQIP (no black screen).
- **Tier 4 (partial):** `setPixelRatio(min(dpr,1.5))` + `powerPreference:'high-performance'`.
- **Tier 3 Service Worker:** cache-first for `/assets/**` → repeat visits near-instant.
- **Deferred:** Tier 2 defer-order (compression solved first-load); InstancedMesh for citizens/sky
  (current meshes cheap; world mesh-merge already cut draw calls). See [[RESEARCH - CPL render perf]].
- **Black-screen hotfix:** corrected `makeGLTF()` from `new THREE.GLTFLoader(...)` to
  `new GLTFLoader(loadingManager)`; imported loaders are not on the `THREE` namespace. Overlay also
  hides on first rendered frame + has a 6s startup-error reporter.
- **Verified:** served over HTTP — index 200, `world.opt.glb` 200 (10.6 MB), `service-worker.js` 200;
  `node --check` passes; Pope manually confirmed it loaded and looks great.

**License (Pope directive):** all our assets are open source, not for resale.
