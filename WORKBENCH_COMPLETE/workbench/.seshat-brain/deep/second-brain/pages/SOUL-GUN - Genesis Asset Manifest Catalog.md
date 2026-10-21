---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P103
status:: FORGED
---

# SOUL-GUN - Genesis Asset Manifest Catalog

## Purpose
The Genesis Asset Manifest Catalog gives the engine a single truth map for every shipped asset. It closes the gap where assets live in git without a searchable catalog of id, type, url, LOD, owner, tier, sector, and cost.

## Files
- Generator: `C:\Users\uncom\Desktop\cosmic-pyramid-library\scripts\generate-asset-manifest.cjs`
- Manifest: `C:\Users\uncom\Desktop\cosmic-pyramid-library\asset_manifest.json`
- Loader: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\asset-catalog.js`
- Live hook: `index.html` flag `window.__GENESIS_ASSET_CATALOG`

## Contract
Every manifest asset declares:
- `id`
- `type`
- `url`
- `path`
- `bytes` / `sizeMB`
- `owner`
- `tier`
- `sector`
- `lod`
- `cost`
- `provenance`

## Integration
`asset-catalog.js` fetches `./asset_manifest.json`, registers every asset with `Genesis.AssetPipeline.registerAsset`, and exposes `Genesis.AssetCatalog.summary()`.

## PLT
- **Profit:** makes future CDN/LOD streaming possible without guessing.
- **Love:** protects the visitor from giant eager loads by giving the engine a catalog to stream from.
- **Tax:** asset provenance is currently `unknown` for most assets; that audit remains due.

## Status
Forged for P103. Generated catalog currently scans the local `assets/` tree and reports 621 assets / 694.098 MB.
