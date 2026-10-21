---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B3
status:: FORGED ✅
---

# SOUL-GUN — Genesis Render Graph (B3)

**Manager #3 of the Genesis Engine.** Three.js has always owned the composer; now the composition is a governed, adjustable pass.

## What it does
- `addPass(pass, meta)` — registers a post pass `{ owner, optional }` and forwards to `effector.addPass`.
- `setResolutionScale(scale)` — clamps scale to [0.5, 1.0], calls `renderer.setPixelRatio(baseDPR * scale)` + `effectComposer.setPixelRatio/setSize`. The Governor's resolution lever.
- `compose()` — when flag ON, `animate()` routes its render through `RenderGraph.compose()` (mirrors `effectComposer.render()`; never changes output unless a pass is added). Default mirrors existing inline render so visuals are untouched.
- `tick()` — bookkeeping.

## PLT framing
- **Profit:** resolution becomes a live dial, not a one-time tier setting — leverage the GPU can feel.
- **Love:** the visitor's picture stays correct; the dial only moves to protect their frame rate.
- **Tax:** wrapper over `effectComposer`, flag `window.__GENESIS_RENDER_GRAPH` (false => original inline render path). Reversible.

## Relation
`compose()` is the single render chokepoint the [[SOUL-GUN - Genesis Performance Governor]] (C) pulls via `setResolutionScale`.
