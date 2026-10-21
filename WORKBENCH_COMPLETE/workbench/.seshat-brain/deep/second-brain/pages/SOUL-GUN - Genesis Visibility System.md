# SOUL-GUN - Genesis Visibility System

type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B6
status:: FORGED ✅
depends-on:: [[SOUL-GUN - Genesis Cost Contract]], [[SOUL-GUN - Genesis Sector Manager]]

---

## Purpose
The **Visibility System** (manager #6) decides what is *allowed to be seen and updated* each frame.
It extends the Sector Manager's distance sleep with **frustum culling** + **priority-based wake-order**.
This is the "intelligent decision automatically" layer Craig described: the engine looks at each
object's `userData.cost` (priority, sector, sleep) and the camera, then decides visible/updating/sleeping.

## The contract it enforces
```js
Genesis.Visibility.register(id, root, { priority, maxDistance })
Genesis.Visibility.tick(camera)         // per-frame: frustum + distance + priority decisions
Genesis.Visibility.isVisible(id)        // bool
Genesis.Visibility.wakeOrder()          // ids sorted by priority desc (high wakes first)
```
- **Frustum cull:** if `root` is outside the camera frustum AND not `sleep:'never'`, mark not-visible
  (skip updates; cheap hide).
- **Distance:** beyond `maxDistance` → sleep (delegates to Sector Manager if present).
- **Priority wake-order:** when the camera returns, high-`priority` sectors wake first so the most
  important content is ready before decorative content (Love: visitor sees what matters first).

## Behavior (continuous)
- High priority (chambers pri 8, NPCs pri 6) wake immediately on approach.
- Low priority (particles pri 2, buildings pri 3) wake later / stay rested longer.
- `sleep:'never'` objects (critical UI anchors) are always visible regardless of frustum.

## Integration (CPL)
- Wired as `Genesis.Visibility` inline + extracted `src/genesis/visibility-system.js` via flag-gated
  dynamic `import()`.
- Flag: `window.__GENESIS_VISIBILITY` (default true; false => no-op).
- Hooks `animate()` once per frame after SectorManager.tick().

## PLT
- **Profit:** one visibility decision point → all 10 managers reuse it; leverageable.
- **Love:** visitor sees meaningful content first; no pop-in of junk before substance.
- **Tax:** careful per-frame math; paid gladly, flag-gated.
- **True Value:** HIGH. The "intelligent automatic decision" made real.
