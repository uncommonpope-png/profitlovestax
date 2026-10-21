# God Mode Research — CPL Load Performance

**stack:** static HTML + Three.js r0.128 (CDN, ES modules), no build system
**skill:** research
**phase:** RESEARCH (read-only — no product changes this session)
**date:** 2026-07-10

---

## SCOUT — current load cost

Measured asset weights (active, loaded on page open):

| Asset | MB | Notes |
|---|---|---|
| world.glb | 66.4 | DOMINANT cost — landscape district |
| mercedes/1982_mercedes_w201.glb | 20.2 | 2nd largest |
| misc/unequal_marriage-1.glb | 17.3 | |
| angel/angel.glb | 5.0 | |
| ifa/..._ifa.glb | 4.7 | |
| cadillac | 3.0 | |
| car-showroom | 1.5 | |
| paimon | 1.3 | |
| computers | 0.6 | |
| **TOTAL active** | **~119** | all fetched at once |

Deferred (correctly NOT loaded): porsche-extra 45 + 39.5 MB.

**Loader architecture (grep):** 9 separate `new GLTFLoader()` calls, each `load()` fired eagerly at startup.
NO `LoadingManager`, NO `DRACOLoader`, NO `MeshoptDecoder`, NO `KTX2Loader`.
No progress UI. No lazy/deferred sequencing. The procedural city + sky + heaven could paint
instantly but are held hostage because the heavy GLBs start downloading synchronously on load.

---

## RESEARCH — prior art (web search)

1. **gltfpack** (meshoptimizer) — single tool that cuts GLB download + render size:
   - `-cc` → EXT_meshopt_compression (decode ~1 GB/s via Wasm SIMD, 6 KB decoder)
   - `-tc` → textures → KTX2/BasisU (KHR_texture_basisu)
   - `-tw` → textures → WebP
   - `-si R` → simplify meshes to ratio R
   - `-ts R` → scale texture dims (0..1) — biggest win if world.glb is texture-heavy
   - `-mi` → mesh instancing
   - Default output already uses KHR_mesh_quantization (three.js r111+ native)
   - Native binary from github.com/zeux/meshoptimizer/releases recommended over npm for large files.
   - Loading compressed files: `loader.setMeshoptDecoder(MeshoptDecoder)` + `KTX2Loader`.

2. **gltf-transform** (Node CLI) — `draco`, `meshopt`, `webp` functions; easier if no native binary.
   - Draco compresses GEOMETRY ONLY (not textures/animation). Meshopt compresses everything but images.

3. **LoadingManager** (three.js) — `onStart/onProgress/onLoad/onError`. Pass ONE manager to all
   loaders. Render first frame immediately, hide overlay on `onLoad`. Note: `onProgress` counts
   FILES not bytes; for a smooth bar track bytes manually or use a weighted sum.

4. **Progressive / lazy loading** — render procedural world first, stream heavy GLBs after first
   frame; fade them in on load. needle-tools/gltf-progressive does density-based LOD + concurrency
   limit (overkill here, but the pattern — show cheap first, stream heavy after — is the key).

5. **Runtime "engines stronger" levers** (separate from load, but Pope asked "everything better"):
   - `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` — uncapped DPR (often 2) = 1.8x pixels.
   - `powerPreference: 'high-performance'`.
   - Merge static building meshes / cut draw calls; frustum culling is on by default.
   - `renderer.info` to spot draw-call/texture-MB bloat.

---

## PROPOSED APPROACH (BUILD phase — deferred to next session)

**Measurable goal:** initial interactive paint < 3 s; total bytes downloaded < 25 MB (from ~119 MB).

1. **Compress the two big assets first** (highest ROI):
   - `gltfpack -cc -tc -ts 0.5 -i assets/world/world.glb -o assets/world/world.opt.glb`
   - `gltfpack -cc -tc -i assets/mercedes/1982_mercedes_w201.glb -o ...mercedes.opt.glb`
   - Measure before/after MB. Expect world.glb 66 → ~5–15 MB, mercedes 20 → few MB.
2. **Wire decoders** into the loaders: `setMeshoptDecoder` + `KTX2Loader` (with transcoder path).
   Point existing 9 GLTFLoader instances at the `.opt.glb` files.
3. **Add LoadingManager** + progress overlay; paint procedural world on frame 1; stream heavy
   GLBs; fade in on load.
4. **Lazy-order**: load small props first, world.glb + mercedes last (or on-demand).
5. **Runtime cap**: pixel ratio 1.5, high-performance hint.
6. Repeat for remaining assets if budget allows (misc 17 MB next).

## OPEN QUESTIONS (for BUILD)
- Is gltfpack available? (node present; may need `npm i -g gltfpack` or native binary download)
- Does world.glb carry embedded high-res textures? (decides whether `-tc`/`-ts` is the big win)
- GitHub Pages caches GLBs; after compression, purge/redeploy.

---

## EXPANDED PLAN — "way more notes" (Pope: add way more soul notes)

Beyond first-load compression, the full perf surface is now split into 5 Soul Notes in the
second-brain (linked from `RESEARCH - CPL perf.md`):

1. **RESEARCH - CPL perf** — master plan + this tiered roadmap.
2. **RESEARCH - CPL render perf** — engines stronger: InstancedMesh (citizens 25 / sky clouds 18 /
   sky-city pillars 4×8), mergeGeometries per building, LOD, material-share + texture atlas, cap
   `setPixelRatio(1.5)`, `powerPreference:'high-performance'`, shadow `autoUpdate=false`, `renderer.info` profiling.
3. **RESEARCH - CPL delivery caching** — Service Worker cache-first for `/assets/**` (repeat visits
   ~instant), stale-while-revalidate for HTML, CDN + `modulepreload` three/addons, `preload` critical
   GLB, `fetch→parse(ArrayBuffer)` for true byte progress. NOTE: SW helps REPEAT visits only; first
   visit still needs compression.
4. **RESEARCH - CPL textures memory** — KTX2/BasisU (stays compressed on GPU, 4–8x VRAM relief) vs
   WebP (smallest file, unpacks to RGBA8 → no VRAM relief); Meshopt (fast decode) > Draco for CPL;
   `gltfpack -cc -tc -ts 0.5`; `dispose()` discipline on reload; LQIP nebula placeholder.
5. **RESEARCH - CPL tooling pipeline** — auto-optimize via `gltfpack`/`gltf-transform-cli` over
   `assets/**`; GitHub Action on push → commit optimized + deploy Pages; measurement gates
   (payload < 25 MB, TTI < 3 s / < 1 s cached, draw calls -40%, `renderer.info` stable).

### Tiered roadmap (BUILD sequence, next session)
- **Tier 0 Compression:** `gltfpack -cc -tc -ts 0.5` world.glb + mercedes + misc → ~119 MB → ~25 MB.
  Wire `MeshoptDecoder` + `KTX2Loader`.
- **Tier 1 Loading UX:** LoadingManager + real progress overlay (fetch→parse bytes); LQIP gradient.
- **Tier 2 Deferred/priority:** critical scene first (plates+city), stream heaven/mercedes/sky after;
  far = low-detail LOD.
- **Tier 3 Repeat visits:** Service Worker cache-first; modulepreload; preload GLB.
- **Tier 4 Engines stronger:** InstancedMesh + merge + pixel-ratio cap + high-performance + shared
  materials + dispose().

## NEXT
BUILD phase (separate session, per second-brain Rule 2): implement Tiers 0–4, measure vs gates,
verify black-screen protocol.

---

## BUILD LOG — DONE (2026-07-10) → commit b493087
- Tier 0: `gltfpack -cc` on 134 GLBs (-90.2 MB). Eager 10: ~129 MB → ~38 MB. `world.glb` 66→10.6.
  `MeshoptDecoder` via `makeGLTF()`; paths → `.opt.glb`.
- Tier 1: byte-accurate progress overlay + nebula LQIP.
- Tier 4 partial: pixelRatio cap 1.5 + high-performance.
- Tier 3: service-worker.js cache-first for /assets/**.
- Deferred: Tier 2 defer-order; InstancedMesh (see render-perf note).
- HTTP smoke test: index 200, world.opt.glb 200 (10.6MB), sw 200.

## HOTFIX (same session) — black screen protocol
Reported: loading screen / black screen after perf build. Actual root cause found by scan:
`makeGLTF()` called `new THREE.GLTFLoader(...)`, but `GLTFLoader` is imported as a module class,
not attached to the `THREE` namespace. That runtime throw stopped startup before `animate()`.
Fix: use `new GLTFLoader(loadingManager)`. Also hardened overlay behavior so it hides on the FIRST
rendered frame and added a 6s startup-error safety net. Verified: no `THREE.GLTFLoader` remains,
`node --check` passes, critical URLs return 200, and Pope manually confirmed it loaded / looks great.
