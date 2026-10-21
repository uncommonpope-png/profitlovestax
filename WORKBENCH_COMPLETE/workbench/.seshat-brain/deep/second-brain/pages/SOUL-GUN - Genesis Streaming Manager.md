---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B2
status:: FORGED ✅
---

# SOUL-GUN — Genesis Streaming Manager (B2)

**Manager #2 of the Genesis Engine.** Three.js streams assets; the Manager gives every streamed asset an explicit birth AND death.

## What it does
- `register(assetKey, loaderFn, meta)` — observes the existing `enqueueLazyAsset`/`lazyAssetTasks` queue by wrapping it, so queued lazy assets are also tracked (no duplicated creation sites).
- `ensureLoaded(key)` — runs `loaderFn` once, tracks the result via `ResourceManager.track`.
- `unload(key)` — the death half: calls `MemoryManager.deepDispose(obj, owner)` then `ResourceManager.dispose(owner)`.
- `tick()` — lazy-unloads assets whose `sector` (from meta) is no longer awake via `SectorManager.isAwake`.

## PLT framing
- **Profit:** streaming becomes a closed loop — load, use, free. GPU memory returns to the pool.
- **Love:** the visitor's world stays rich near them and quietly releases what they left behind.
- **Tax:** wrapper over the lazy queue, flag `window.__GENESIS_STREAMING_MANAGER` (false => no-op). Reversible.

## Relation
The unload path is the proving ground of [[SOUL-GUN - Genesis Memory Manager]] (B5) and the sector-awareness of [[SOUL-GUN - Genesis Sector Manager]] (B4).
