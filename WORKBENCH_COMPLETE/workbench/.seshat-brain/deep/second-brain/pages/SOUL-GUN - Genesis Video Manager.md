---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B9
status:: FORGED ✅
---

# SOUL-GUN — Genesis Video Manager (B9)

**Manager #9 of the Genesis Engine.** Three.js decodes video; the Manager decides how many billboard videos may play at once.

## What it does
- `register(videoEl, plane, meta)` — called from `applyBillboardVideo` at billboard creation. meta `{ owner, cost }`.
- `activeCount()` — live count of registered videos.
- `capCheck(maxActive)` — pauses videos beyond the cap: `videoEl.pause()` + `plane.visible=false` for the overflow. Keeps the first `maxActive` registered.
- `tick()` — cheap bookkeeping; cap enforced on demand by the Governor.

## PLT framing
- **Profit:** video decode is the single most expensive per-frame cost; capping it is pure leverage.
- **Love:** the visitor's near billboards still play; far/overflow ones pause silently — no frame cliff.
- **Tax:** observer + pause governor, flag `window.__GENESIS_VIDEO_MANAGER` (false => no-op). Reversible.

## Relation
Prime input to [[SOUL-GUN - Genesis Performance Governor]] (C): active video count is a Governor signal; `capCheck(n)` is a Governor response.
