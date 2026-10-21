---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P104
status:: FORGED
---

# SOUL-GUN - Genesis Asset LOD Streamer

## Purpose
The Genesis Asset LOD Streamer bridges `asset_manifest.json` into the live `Genesis.StreamingManager`. It makes assets queueable by id, tier, owner, sector, and LOD without eager-loading them.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\asset-lod-streamer.js`
- Catalog dependency: `C:\Users\uncom\Desktop\cosmic-pyramid-library\asset_manifest.json`
- Live hook: `index.html` after `Genesis.AssetCatalog` registers

## Contract
- Register model assets from the manifest with `Genesis.StreamingManager.register`.
- Load by id through `Genesis.AssetPipeline.load`.
- Preserve metadata: owner, sector, tier, priority, LOD, label.
- Never eager-load the whole catalog.
- Stay flag-gated by `window.__GENESIS_ASSET_LOD_STREAMER`.

## Why It Matters
P104's final CDN step needs an infra destination, but the runtime pattern can ship now: manifest → streaming queue → on-demand load. Later, changing URLs to CDN endpoints should not require changing engine logic.

## PLT
- **Profit:** turns 621 cataloged assets into addressable engine resources.
- **Love:** avoids loading hundreds of MB up front.
- **Tax:** true CDN upload remains blocked until a hosted/static asset target is chosen.

## Status
FORGED and connected as the local P104 bridge.
