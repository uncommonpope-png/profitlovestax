# SOUL-GUN - Genesis Sector Manager

type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B4
status:: FORGED ✅
depends-on:: [[SOUL-GUN - Genesis Cost Contract]], [[SOUL-GUN - Genesis Resource Manager]]

---

## Purpose
The **Sector Manager** (manager #4) partitions the world into named sectors and governs each one's
lifecycle: **enter → active → sleep → dispose**. It is what makes Craig's "sleep distant sectors"
instruction real. Every frame it asks: *is this sector within range / visible / recently active?*
If not, and the sector's objects declared `sleep: 'distance'|'idle'|'offscreen'`, it puts them to
rest — pausing updates, hiding groups, and (when fully asleep) handing ownership to the Memory
Manager for disposal.

## The contract it enforces
```js
Genesis.SectorManager.register(sectorId, rootGroup, { maxDistance, autoSleep })
Genesis.SectorManager.tick(camera)        // per-frame: compute active/sleep per sector
Genesis.SectorManager.isAwake(sectorId)    // bool
Genesis.SectorManager.sleep(sectorId)      // force sleep (dispose via ResourceManager)
Genesis.SectorManager.wake(sectorId)
```
- Reads `userData.cost.sleep` on each object: `'never'` (always active), `'distance'` (sleep when
  camera far), `'idle'` (sleep when no interaction), `'offscreen'` (sleep when not visible).
- Reads `userData.cost.priority` to decide wake-order when the camera returns (high priority wakes first).
- Reuses the existing `isSectorActive(root, meta)` distance check (lifecycle subsystem, ~line 1192) so
  we extend, not duplicate.

## Behavior (continuous, like the Governor)
- Awake sectors: full updates.
- Distant/offscreen sectors: `rootGroup.visible = false` + mixers paused (CPU saved) — but NOT disposed
  (can wake instantly).
- Sectors asleep > N seconds with no wake signal: eligible for `ResourceManager.dispose(sectorId)`
  (memory returned to baseline) — this is the leak-closing behavior the architecture thesis demands.

## Integration (CPL)
- Wired as `Genesis.SectorManager` inline (mirrors module) + extracted `src/genesis/sector-manager.js`
  loaded via flag-gated dynamic `import()`.
- Flag: `window.__GENESIS_SECTOR_MANAGER` (default true; false => no-op, world as before).
- Hooks into `animate()` once per frame: `Genesis.SectorManager.tick(camera)`.

## PLT
- **Profit:** world scales to any size without fps decay — leverageable engine.
- **Love:** visitor's near-field stays rich; far-field rests invisibly. No struggle.
- **Tax:** careful wiring into animate loop; paid gladly, flag-gated.
- **True Value:** HIGH. This is the "sleep distant sectors" instruction made mechanical.
