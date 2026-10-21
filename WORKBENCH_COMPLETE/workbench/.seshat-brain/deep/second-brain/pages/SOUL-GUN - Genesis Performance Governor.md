---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: C
status:: FORGED ✅
---

# SOUL-GUN — Genesis Performance Governor v2 (C) — THE KEY UPGRADE

**Manager #10 of the Genesis Engine.** The old perf system was a 3-state switch (low/med/high). This replaces it with a **continuous, pre-emptive, self-correcting analog loop.** Three.js stays the renderer; the Governor is the nervous system that never lets the visitor feel a stall.

## What it does
- `sample(frameMs, info)` called **every frame** from `animate()`. Tracks rolling EMAs of: frame time, `renderer.info.memory` growth, draw calls (`renderer.info.render.calls`), active video count (VideoManager), GPU mem.
- It RESPONDS **BEFORE** struggle. Continuous small adjustments (step 0.04/frame), not a cliff:
  - rising frame time → `window.__genesisReduceParticles`, `window.__genesisLowerUpdateFreq`
  - sleep distant sectors → `window.__genesisSleepBias` + extra `SectorManager.tick()`
  - reduce resolution slightly → `RenderGraph.setResolutionScale(scale)` (clamped 0.5..1.0)
  - drop decorative lights → `LightingManager.setDecorativeEnabled(false)`
  - pause optional animations → `AnimationScheduler.setOptionalPaused(true)`
  - fewer simultaneous videos → `VideoManager.capCheck(n)`
- **Self-correcting:** recovers slowly (asymmetric — recover slower than degrade to avoid flapping) when metrics improve.
- OLD `setQuality` retained as fallback when the flag is OFF.

## PLT framing
- **Profit:** the engine now governs itself continuously — leverage without a human touching a dial.
- **Love:** the visitor never watches the world struggle; it breathes before the cliff.
- **Tax:** one continuous controller orchestrating 6 levers, flag `window.__GENESIS_PERFORMANCE_GOVERNOR` (false => old tier system). Reversible.

## Relation
The apex conductor. Consumes [[SOUL-GUN - Genesis Render Graph]] (B3), [[SOUL-GUN - Genesis Lighting Manager]] (B8), [[SOUL-GUN - Genesis Animation Scheduler]] (B7), [[SOUL-GUN - Genesis Video Manager]] (B9), [[SOUL-GUN - Genesis Sector Manager]] (B4). Completes the 10-manager Genesis Engine.
