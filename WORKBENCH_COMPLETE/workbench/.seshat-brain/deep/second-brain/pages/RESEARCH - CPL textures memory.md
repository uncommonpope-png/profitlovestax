# RESEARCH — CPL Textures & Memory

**type:: [[research]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[RESEARCH - CPL perf]] [[RESEARCH - CPL render perf]] [[graphics-color]]**

---

## Question
How textures (the heaviest part of most GLBs) are stored on disk vs in GPU memory, and how to
stop VRAM blowups that crash low-end devices (the "Heavy-Porsche ceiling").

## KTX2 / Basis Universal (verified prior art)
- Container for **GPU-compressed** textures (ASTC / ETC / BC7 / S3TC) chosen per-device at load.
- Stays compressed ON the GPU → **4–8x less VRAM** than PNG/JPEG (which unpack to RGBA8).
- Faster upload (no CPU decode), smaller GLB via `gltfpack -tc`.
- Three.js: `KTX2Loader` + `renderer` transcoder path. **Must** set `meshopt`/`basis` transcoder base.

## WebP (per prior search) — small FILE, not small VRAM
- WebP (via `gltfpack -tc`? no — that's KTX2; WebP is `-wp` in gltfpack) = smallest FILE size, but
  **unpacked into RGBA8 on GPU** → no VRAM relief. Pick WebP for bandwidth-only, KTX2 for VRAM relief.
- Rule of thumb: KTX2 when the texture is bound by GPU memory / frame stability; WebP when bound by
  download time on a capable device. For CPL's heavy scenes → **KTX2 first**.

## Draco vs Meshopt (vertex geometry)
- **Draco**: best ratio (~20% of raw), slowest decode (~100ms/100k verts) — fine for static one-shot.
- **Meshopt**: near-Draco ratio, ~10x faster decode, **stream-friendly + GPU-friendly**; pairs with
  KTX2 in `gltfpack`. **Recommended** for CPL (fast decode + KTX2 combo).

## gltfpack switches (the actual tool)
- `-cc` compress meshes (meshopt), `-tc` KTX2 textures, `-ts 0.5` texture scale, `-si 0.5` / `-mi 100`
  simplify, `-kn` / `-ke` weld/quantize normals.
- `prune` + `dedup` remove unused nodes/materials/textures → smaller + faster parse.

## Disposal discipline (prevents slow leaks / crashes)
- On scene swaps (e.g., reloading a GLB, navigating worlds), call `geometry.dispose()`,
  `material.dispose()`, `texture.dispose()` — or GPU memory climbs until crash.
- Reuse shared materials/geometries across instances (don't clone per-citizen).

## LQIP poster (instant first paint)
- Render a tiny blurred placeholder (even a CSS gradient matches CPL's nebula) while GLB loads →
  perceived speed, zero black-screen risk.

## Proposed actions (BUILD)
- `gltfpack -cc -tc -ts 0.5` world.glb + mercedes + misc.
- Wire `KTX2Loader` + `MeshoptDecoder` (transcoder paths via CDN).
- Add `dispose()` on reload; share materials across citizens.
- LQIP gradient/placeholder behind loader.

**License (Pope directive):** all our assets are open source, not for resale.
