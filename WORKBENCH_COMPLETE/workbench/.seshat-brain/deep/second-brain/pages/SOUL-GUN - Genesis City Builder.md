---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: P8-targeted / P7-unblocker
status:: FORGED
---

# SOUL-GUN - Genesis City Builder

## Purpose
The Genesis City Builder extracts city-expansion work out of the dangerous `index.html` monolith and into a governed module. It is the first targeted CPL module split created specifically to unblock the North Star build campaign.

## Problem It Solves
`C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html` is over 14k lines. Direct multi-part edits are risky because tool reads/truncation and lack of scoped replace can corrupt the file. P7 City Expansion was blocked because the old `makeBuilding()` writes directly to `cityGroup` and cannot safely be refactored in place.

## Contract
The module lives at:

`C:\Users\uncom\Desktop\cosmic-pyramid-library\src\cpl\city-builder.js`

It must:
- Build outer-city geometry outside the old `makeBuilding()` monolith.
- Use shared geometries/materials to lower GPU/memory pressure.
- Declare `userData.cost` through `Genesis.declareCost`.
- Track resources through `Genesis.ResourceManager`.
- Register the outer city with `Genesis.SectorManager` as `city-outer`.
- Register visibility with `Genesis.Visibility` at low priority.
- Stay flag-gated by `window.__GENESIS_CITY_BUILDER_MODULE`.
- Disable the old broken inline `__GENESIS_P7_CITY` ring when module mode is active.

## Integration
`index.html` dynamically imports:

```js
import('./src/cpl/city-builder.js')
```

Then calls:

```js
m.install(window.Genesis, THREE, scene, cityGroup, {}).buildOuterCity()
```

The old inline P7 ring remains as fallback but is disabled by default when the module is active.

## PLT
- **Profit:** unlocks the entire 50-task build campaign by making city work safe and modular.
- **Love:** gives the visitor a larger living city without making the page struggle.
- **Tax:** leaves old monolith code intact as fallback; avoids risky extraction until module seams are proven.

## Status
FORGED and ready for commit/push with P8-targeted City Builder module.
