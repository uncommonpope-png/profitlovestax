---
type:: [[soul-note]] [[research]] [[asset-streaming]] [[gta]] [[north-star]]
date:: 2026-07-20
author:: PROFIT (Mind/Director) under God Mode study
purpose:: Study how GTA V streams a clothing-store catalog + world assets, and extract the lesson for the CPL/Genesis engine's 750MB asset bloat.
source:: FiveM ped-components docs (https://docs.fivem.net/docs/game-references/ped-components/); GTA Wiki clothing/streaming.
---

# SOUL-NOTE — GTA V Asset Streaming & Catalog Study

## What GTA V actually does
- **Clothing stores are data-driven catalogs** (`shop_ped.meta`). Items organized by *components* (meshes) and *drawables* (variants). The store UI reads **metadata** (IDs, prices, category tags). The heavy binary assets (`.ytd` textures, `.ydd` meshes) are **only streamed into memory when a player views or equips** an item — not all at once.
- **World streaming (RAGE):** proximity + LOD predictive streaming from packed `.rpf` archives. The engine predicts player movement and loads/unloads by distance + visibility. Tiny metadata catalogs (`map.xml`, `popcycle.dat`) point to offsets inside massive binary files.
- **Catalog growth:** DLC adds **manifest entries pointing to streamed files**. Thousands of clothing items only grow the tiny registry; heavy bytes stay in separate archives loaded only if referenced by active player state.

## Our gap (measured)
- `genesis-foundation/assets` = **635 files, 749.6 MB**. Only **132 files (531 MB) are referenced** by engine code; **503 files (218.6 MB) are dead** (unreferenced: `city_pack_3.glb` removed, unoptimized `.glb` vs `.opt.glb` duplicates, hundreds of `downloads-art`/`dayz`/`profit-pics` pngs).
- Even the "used" 531 MB is **shipped in git and loaded eagerly** — no catalog, no on-demand streaming.

## Lesson for CPL/Genesis (the GTA pattern)
1. **Decouple manifest from bytes.** Build `asset_manifest.json` (id, type, url, LOD, owner, loadTier, sector) — tiny, lives in git. This is our `shop_ped.meta`.
2. **Externalize heavy GLBs to a CDN** (engine already loads some by URL, e.g. readyplayer.me avatars). Repo becomes code + manifest (~few MB).
3. **Stream on-demand + LOD** through the StreamingManager that already exists (`Genesis.StreamingManager`, index.html ~L1583) — load by proximity/visibility, like RAGE.
4. **Delete the 218 MB dead assets** now (safe, unreferenced).

Result: repo shrinks from 750 MB → a few MB; world streams like GTA V. Maps to expansion phases **P103–P105** (CAT/CDN/LOD) + **P108** (no local server).

— PROFIT (Mind) · 2026-07-20.
