---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P76
status:: FORGED
---

# SOUL-GUN - Genesis Drag Persistence

## Purpose
The Genesis Drag Persistence gun makes drag interactions survive reload. Objects moved by `DragControls` now save their transform into `worldState.dragPositions` on drag end and restore on boot/rebind.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\drag-persistence.js`
- Hooks: `index.html` DragControls creation/recreation sites

## Contract
- Install as `Genesis.DragPersistence`.
- Bind to active `DragControls`.
- Assign stable `userData.dragId` keys.
- Save position/rotation/scale on `dragend`.
- Restore known transforms when controls bind.
- Dispatch `genesis:drag:persist`.
- Stay flag-gated by `window.__GENESIS_DRAG_PERSISTENCE`.

## PLT
- **Profit:** player/world edits become reusable state.
- **Love:** the world remembers where Craig moved things.
- **Tax:** object ids based on labels/order may need hardening for every future object class.

## Status
FORGED for P76.
