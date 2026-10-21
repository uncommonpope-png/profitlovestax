# RESEARCH — CPL Tooling & Compression Pipeline

**type:: [[research]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[RESEARCH - CPL perf]] [[RESEARCH - CPL delivery caching]] [[neodownloadable]]**

---

## Question
How to make compression reproducible + automatic so every future Soul Gun ships already-fast,
instead of hand-optimizing each GLB.

## The plan: a pre-deploy pipeline
1. **Gather** all GLBs under `assets/`.
2. **Optimize** each with `gltfpack` (meshopt + KTX2 + weld + dedup). Option: `gltf-transform`
   (better control / scripting / no external binary) with its `meshopt`, `texture-compress` (ktx2),
   `dedup`, `prune`, `weld` commands.
3. **Verify** sizes + open in `gltf.report` (web) for draw-call / texture / parse-time budget.
4. **Measure** before/after with browser Resource Timing API + `renderer.info` (draw calls, MB).
5. **Ship** via existing GitHub Pages; add Service Worker ([[RESEARCH - CPL delivery caching]]).

## Tools (verified prior art)
- **gltfpack** (meshoptimizer, single binary; `gltfpack -i in.glb -o out.glb -cc -tc -ts 0.5`).
- **gltf-transform** (npm, `cli` + `lib`) — pipeline as code, CI-friendly.
- **gltf.report** / **gltf-viewer** for visual + budget check.
- **draco3d** if going Draco route (not preferred for CPL — see textures memory note).

## GitHub Actions (auto on push)
- Workflow: on push to `main`, run optimize step, commit optimized assets (or artifact), deploy Pages.
- Keeps originals in a `/raw` dir; optimized in `/assets` served to users.

## Measurement gates (define "done")
- First-load total GLB payload < ~25 MB (from ~119 MB).
- Time-to-interactive < ~3 s on a mid laptop (cached: < 1 s via SW).
- `renderer.info.memory.geometries/textures` stable (no climb) after repeated world reloads.
- Draw calls reduced (InstancedMesh) by target 40%+ on citizen/sky groups.

## Proposed actions (BUILD)
- `npm i -D gltf-transform-cli` (or `gltfpack`).
- Script `optimize.mjs`: optimize all `assets/**/*.glb` → `assets.opt/`.
- GitHub Action to run + deploy.
- Add `renderer.info` + Performance marks to index.html for before/after.

**License (Pope directive):** all our assets are open source, not for resale.
