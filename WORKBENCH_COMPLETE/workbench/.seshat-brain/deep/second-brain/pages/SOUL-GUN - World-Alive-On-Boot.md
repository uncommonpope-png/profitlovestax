---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B2
status:: FORGED ✅
---

# SOUL-GUN — World-Alive-On-Boot (B2-FIX)

**The fix that makes the CPL city breathe without a click.** Previously every living GLB (walker rigs, traffic cars, denizen bodies, world plate, avatars) was queued as a `lazy` asset gated behind a user gesture (`pointerdown`/`keydown`/`touchstart`) or a 4.5–12s idle callback. On a quiet load the world stood dead — bare primitive placeholders, no walking NPCs, no real cars.

## What it does
- Splits `enqueueLazyAsset` into two tiers: `decor` (kept lazy, user-gated) and `world` (essential living assets).
- `startWorldAssets(trigger)` runs all `world`-tier tasks the moment `__cplReady` is true — via `window.addEventListener('cpl:ready', …)` or immediate if already ready. Hard fallback: `requestIdleCallback`/`setTimeout` at 3s so the world is never permanently bare.
- `makeGLTF({ tier: 'world' })` routes essential loads through the world queue while keeping them on `criticalManager` (so they still respect the readiness race).
- `primeNpcBodies()` (denizen GLB swap) now also fires on `cpl:ready` (was 12s idle / gesture only).

## PLT framing
- **Profit:** the world sells itself on first paint — citizens walk, cars drive, towers stand. No "press any key to live."
- **Love:** the visitor arrives into a living place, not a loading apology.
- **Tax:** adds one queue + one listener. Reversible via `window.__GENESIS_COST_CONTRACT = false` guard already present on cost declares.

## Relation
Pairs with [[SOUL-GUN - Genesis Streaming Manager]] (B2) — world assets are the first things the streaming manager should track. Proves [[SOUL-GUN - Staged GLB Character Pool]].
