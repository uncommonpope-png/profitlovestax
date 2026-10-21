---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P72 / P127
status:: FORGED
---

# SOUL-GUN - Genesis Scribe Live Books

## Purpose
The Scribe Live Books gun makes the Scribe Library shelf render actual live memory as clickable books. If hosted GSK memories are online, the shelf uses them; if not, it falls back to local Genesis memory state instead of going empty.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\scribe-live-books.js`
- Hooks: `index.html` static import/install, `refreshScribeMemories()`, `handleScribeMemoryClick()`.

## Contract
- Install as `Genesis.ScribeLiveBooks`.
- Persist `worldState.scribeLiveBooks` render/open counters.
- Convert local Genesis memory into book data: memory events, prophecy archive, builder schematics, witness packs, immortality proof, trust ledger, personality profiles.
- Render fallback books when `gsk.memories()` is offline or empty.
- Record book renders and opens.
- Emit `genesis:scribe:live-books` and `genesis:scribe:book-open`.

## PLT
- **Profit:** the Library always has useful memory artifacts.
- **Love:** Seshat/SCRIBE gets visible books from what GSK's world actually did.
- **Tax:** hosted vector memory is still the higher target; local fallback prevents emptiness.

## Status
FORGED for P72/P127.
