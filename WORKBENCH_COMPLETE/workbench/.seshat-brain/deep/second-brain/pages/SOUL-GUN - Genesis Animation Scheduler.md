---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B7
status:: FORGED ✅
---

# SOUL-GUN — Genesis Animation Scheduler (B7)

**Manager #7 of the Genesis Engine.** Three.js animates; the Scheduler decides WHO gets a frame.

## What it does
- `registerMixer(mixer, meta)` — meta `{ root, maxDistance, owner, critical, optional }`. Observes the existing `Genesis.lifecycle.registerMixer` by wrapping it, so every mixer ever registered is known without duplicating creation sites.
- `tick(dt)` — updates ONLY active mixers: in-range (distance gate), awake via `SectorManager`/`lifecycle.isSectorActive`, visible via `Visibility`. Far/critical-skipped mixers simply pause (their `.time` is not advanced), so they cost zero CPU.
- `setOptionalPaused(bool)` — the Performance Governor's lever to freeze non-essential animations first.
- Reuses the existing `isSectorActive(root, meta)` helper and `Genesis.lifecycle.updateMixer` when present; falls back to a direct `mixer.update(dt)`.

## PLT framing
- **Profit:** animation CPU is now metered by distance/importance — the engine scales.
- **Love:** the visitor's nearby characters always move; distant ones cost nothing they'd never see.
- **Tax:** wrapper + registry, flag `window.__GENESIS_ANIM_SCHEDULER` (false => no-op). Reversible.

## Relation
Downstream sink of [[SOUL-GUN - Genesis Sector Manager]] (B4) and [[SOUL-GUN - Genesis Visibility System]] (B6). The Governor (C) calls `setOptionalPaused` on struggle.
