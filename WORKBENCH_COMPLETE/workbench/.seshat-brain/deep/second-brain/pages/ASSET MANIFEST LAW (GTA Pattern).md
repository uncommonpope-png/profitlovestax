---
type:: [[bible]] [[asset-manifest]] [[cdn]] [[north-star]] [[gta-pattern]]
date:: 2026-07-20
author:: PROFIT (Mind/Director)
purpose:: The asset law for the engine, derived from the GTA V catalog/streaming study. Kills the 750MB-in-git bloat and the eager-load problem.
---

# ASSET MANIFEST LAW (GTA Pattern)

**Measured:** `assets/` = 635 files / 749.6 MB. 132 used (531 MB), 503 dead (218.6 MB). Even used assets are shipped in git and eager-loaded.

**The law:**
1. **Manifest is truth.** `asset_manifest.json` lists every asset: `{ id, type, url, lod, owner, loadTier, sector }`. Tiny, lives in git. This is the catalog (GTA's `shop_ped.meta` / `map.xml`).
2. **Bytes live off-repo.** Heavy GLBs/KTX2 go to a CDN; engine loads by `url`. Repo = code + manifest (~few MB).
3. **Stream on-demand + LOD.** `Genesis.StreamingManager` loads by proximity/visibility, unloads when far. Like RAGE. No eager bulk load.
4. **Dead assets deleted.** The 503 unreferenced files (218.6 MB) are removed; the manifest is the only map.
5. **Adding content = add a manifest entry**, not a repo-bloating binary. DLC-style growth without base bloat.

**Phases:** P103 (CAT), P104 (CDN+LOD), P105 (purge). Study: [[SOUL-NOTE - GTA V Asset Streaming & Catalog Study]].

— PROFIT (Mind) · 2026-07-20.
