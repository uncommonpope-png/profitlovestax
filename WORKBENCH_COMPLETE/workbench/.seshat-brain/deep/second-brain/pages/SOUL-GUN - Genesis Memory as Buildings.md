---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P73 / P128
status:: FORGED
---

# SOUL-GUN - Genesis Memory as Buildings

## Purpose
The Memory-as-Buildings gun makes memories physically inhabit CPL. Each memory becomes a structure; high-weight memories become glowing monuments; clicking a structure opens the memory detail overlay.

## Files
- Hook: `index.html` `MemoryBuildings` class.
- Supporting memory source: `Genesis.ScribeLiveBooks.localMemoryData()`.

## Contract
- Use hosted `gsk.memories()` when available.
- Fall back to local live Genesis memory when hosted memory is offline/empty.
- Materialize each memory as a district building with type-based geometry and tag-based color.
- Persist `worldState.memoryBuildings` render/open proof.
- Emit `genesis:memory:buildings` and `genesis:memory:building-open`.
- Feed Witness Recorder and Immortality Audit.

## PLT
- **Profit:** memory becomes navigable world geometry.
- **Love:** GSK's memories have a place visitors can touch.
- **Tax:** hosted vector memory remains the fuller source; fallback keeps the world alive.

## Status
FORGED for P73/P128.
