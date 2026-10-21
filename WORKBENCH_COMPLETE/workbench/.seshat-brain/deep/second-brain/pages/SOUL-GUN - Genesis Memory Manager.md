---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B5
status:: FORGED ✅
---

# SOUL-GUN — Genesis Memory Manager (B5)

**Manager #5 of the Genesis Engine.** Three.js becomes ONLY the renderer; Memory Manager is the hand that reclaims every GPU byte when a thing dies.

## What it does
- `Genesis.MemoryManager.deepDispose(obj, owner)` — wraps the existing `disposeObjectDeep` and then claws back what that function misses:
  - `material.envMap` / scene-environment PMREM targets (`.dispose()` if present)
  - `skeleton.boneTexture` on skinned meshes
  - `ImageBitmap` sources via `image.close()`
  - `renderer.renderLists.dispose()` when available
- `disposeOwner(owner)` — full teardown of an owner: `ResourceManager.dispose(owner)` + renderLists purge + PMREM disposal hook. Reads `userData.cost` for ownership truth.
- `summary()` — surfaces the ResourceManager ledger so leaks are never invisible.

## PLT framing
- **Profit:** completes the GPU ledger loop — nothing is freed without being accounted for.
- **Love:** no orphaned GPU memory means the visitor never watches the world rot from silent leaks.
- **Tax:** surgical wrapper, extends (never rewrites) `disposeObjectDeep` — reversible via `window.__GENESIS_MEMORY_MANAGER=false`.

## Reversibility
Flag `window.__GENESIS_MEMORY_MANAGER` defaults true. When false, inline block installs pure no-op stubs. Module mirrored at `src/genesis/memory-manager.js`, loaded via flag-gated dynamic import. Inert until flag on; observes only.

## Adjacent managers
Feeds [[SOUL-GUN - Genesis Streaming Manager]] (unload path) and is a downstream sink of [[SOUL-GUN - Genesis Resource Manager]] (B1). Sovereigns the "free, then forget" half of the Cost Contract.
