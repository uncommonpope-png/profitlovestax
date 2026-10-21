# RESEARCH — CPL Render Perf ("make the engines stronger")

**type:: [[research]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[RESEARCH - CPL perf]] [[RESEARCH - CPL textures memory]] [[graphics-color]]**

---

## Question
Pope: "make the engines stronger or everything better." Beyond load time, the live frame rate
(CPU draw-call cost + GPU memory) is the other half of "better."

## Draw calls = #1 CPU bottleneck (verified prior art)
Each unique geometry+material = one draw call. WebGL per-call overhead is high. Three.js fixes:

1. **InstancedMesh** — same geometry+material, N transforms in ONE draw call. `setMatrixAt(i, m)`.
   Cuts O(n)→O(1); 10x+ gains for repeated objects (tree/rock/coin/NPC-of-same-type).
   - In CPL: the **25 citizens**, **sky clouds (18×~5 lobes)**, **sky-cities pillars (4×8)**,
     **building windows** are prime InstancedMesh candidates.
2. **mergeGeometries** (BufferGeometryUtils) — merge static scattered meshes into ONE geometry =
   1 draw call. Trade-off: lose per-object control. Great for static scenery (buildings, decoration).
   - In CPL: the **procedural buildings** (box+windows+spines+roof+antenna per `makeBuilding`)
     could merge per-building or city-wide.
3. **BatchedMesh** (three.js r0.128+? verify) — multi-draw batch for DIFFERENT geometries, same
   material. Alternative to merge when geometry varies.
4. **Material sharing** — two meshes with separate `MeshStandardMaterial` instances (even identical
   props) = 2 draw calls. Use ONE material instance for same-looking meshes. Texture **atlases**
   let different-looking objects share a material via UV offsets.
5. **LOD** (THREE.LOD) — swap high-poly→low-poly→billboard by camera distance. `lod.addLevel(mesh, d)`.

## GPU memory / stability
- **KTX2/BasisU** textures stay compressed on the GPU (see [[RESEARCH - CPL textures memory]]) —
  PNG/JPEG unpack to 4–8x more VRAM. Directly prevents the "Heavy-Porsche ceiling" crashes.
- `texture.anisotropy` cap, `generateMipmaps` only when needed.
- `renderer.info` to profile draw calls / triangles / textures MB — measure before/after.

## Renderer tuning
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` — uncapped DPR (often 2) = 1.8x pixels
  for zero visual gain on most displays.
- `powerPreference: 'high-performance'`.
- Shadows: `shadowMap.autoUpdate = false` (re-render only when lights move), lower shadow map
  resolution, only the key/hemi light casts — the rest fake with emissive.
- `stencil: false`, `antialias` tradeoff (SMAA post already in base model; native MSAA may be redundant).

## Proposed actions (BUILD)
- Convert citizen/sky-cloud/sky-city-pillar groups to InstancedMesh.
- Merge per-building procedural parts; measure draw calls via `renderer.info`.
- Cap pixel ratio 1.5; high-performance hint.
- Profile with `renderer.info` + `performance.now()` marks.

**License (Pope directive):** all our assets are open source, not for resale.
