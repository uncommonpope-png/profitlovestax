---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B8
status:: FORGED ✅
---

# SOUL-GUN — Genesis Lighting Manager (B8)

**Manager #8 of the Genesis Engine.** Three.js renders light; the Manager caps how many live point lights the GPU must shade per frame.

## What it does
- `register(light, meta)` — meta `{ owner, decorative, cost, priority }`. Observes existing lights by reading `perf.lowLights` and a `scene.traverse` for `isPointLight` — never removes, only governs.
- `capCheck()` — enforces a HARD cap of **≤8 active point lights total**. If exceeded, disables the lowest-priority *decorative* lights first (preserves hero/character lights).
- `setDecorativeEnabled(bool)` — master switch the Performance Governor flips on struggle.
- `tick()` — re-evaluates the cap every frame; recovery is automatic when the Governor re-enables decorative lights.

## PLT framing
- **Profit:** lighting cost becomes a bounded, governed budget instead of unbounded scene growth.
- **Love:** the visitor never hits the GPU cliff where too many dynamic lights tank the frame.
- **Tax:** observer + visibility governor, flag `window.__GENESIS_LIGHTING_MANAGER` (false => no-op). Reversible.

## Relation
Primary consumer of [[SOUL-GUN - Genesis Performance Governor]] (C) via `setDecorativeEnabled`. Reads the same `lowLights` the perf tier system uses.
