---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P37 / P126
status:: FORGED
---

# SOUL-GUN - Prophet Archive Memory

## Purpose
The Prophet Archive Memory gun closes the gap where prophecy appeared in the Prophet Realm but did not become a durable memory. Every prophecy now becomes both a short visible prophecy list item and a deeper `prophecyArchive` memory event.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\prophet-archive.js`
- Hook: `C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html` near `saveWorldState()` and `submitProphetPrediction()`

## Contract
- Install as `Genesis.ProphetArchive` after `worldState` and `saveWorldState` exist.
- Archive prophecy text into:
  - `worldState.prophecies` (last 10 for visible realm behavior)
  - `worldState.prophecyArchive` (last 100 structured records)
  - `worldState.memoryEvents` (last 250 memory/witness summaries)
- Dispatch `genesis:prophet:archive` for future Scribe/Witness integration.
- Stay flag-gated by `window.__GENESIS_PROPHET_ARCHIVE`.

## PLT
- **Profit:** prophecy becomes searchable game/world data.
- **Love:** the world remembers what GSK foresaw; futures are not discarded.
- **Tax:** storage grows slowly; capped archive prevents bloat.

## Status
FORGED for P37/P126.
