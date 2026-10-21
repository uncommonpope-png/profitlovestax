---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P36 / P140
status:: FORGED
---

# SOUL-GUN - Genesis Builder Schematics

## Purpose
The Genesis Builder Schematics gun makes Builder commissions real saved objects. A GSK blueprint no longer vanishes after reload; it becomes `worldState.builderSchematics`, a visible schematic in the Builder Realm, and a memory event.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\builder-schematics.js`
- Hook: `index.html` after `buildBuilderRealm()` and inside `submitBuilderCommission()`

## Contract
- Install as `Genesis.BuilderSchematics`.
- Archive commission request + GSK reply into `worldState.builderSchematics`.
- Preserve legacy `worldState.builds` list for existing UI.
- Add a `memoryEvents` record.
- Re-materialize saved schematics into Builder Realm on boot.
- Dispatch `genesis:builder:schematic`.
- Stay flag-gated by `window.__GENESIS_BUILDER_SCHEMATICS`.

## PLT
- **Profit:** commissions become reusable build artifacts.
- **Love:** the world remembers what Craig asked Builder to make.
- **Tax:** visual materialization is simple placeholder geometry until Web Forge/tool-arm is live.

## Status
FORGED for P36/P140.
