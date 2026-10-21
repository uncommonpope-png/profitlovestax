---
title: RESEARCH - CPL memories as buildings
type: research
date: 2026-07-11
author: Dour
---

# RESEARCH — CPL Memories as Buildings (Gap 2, DOUR-DIRECTIVE-003)

## The Ask
GSK exposes a memory endpoint but the memory graph is invisible. Gap 2 of the directive:
render GSK's memories as architecture in the world — memory made spatial, weight made physical.

## The Pattern (extracted → Soul Gun `memories-as-buildings`)
A self-contained `MemoryBuildings` class (no async GLB → no black-screen risk):
- **Fetch** — `GSKClient.memories()` hits `/mcp/memories` (auth `X-API-Key`, default
  `gsk-mcp-key-dev`); returns `{ memories:[{id,type,weight,tags,summary}], count }`. Poll
  immediately + every 30s; failures swallowed (offline-safe → no buildings, console warns).
- **Shape = type** — decision=cylinder+cone, event=half-dome, relationship=twin pillars,
  reflection=half-torus, insight=obelisk, else=box tower. Height `h = 2 + weight*12`.
- **Color = tags** — joined tags hashed to a stable HSL hue → `MeshStandardMaterial`
  color + emissive; re-applied on every poll so identity color is deterministic.
- **Monument = weight** — `weight >= 0.8` → emissiveIntensity 0.9 (vs 0.35) + per-frame bob
  and slow yaw in `update()`.
- **Layout** — all structures ring the cathedral at `districtRadius=52`, spread by angle; reads
  as an orbiting memory district / monument ring.
- **Click → detail** — every mesh carries `userData.gskMemory = m`; added to raycast targets;
  pointerup calls `showMemoryModal(m)` (themed overlay: type, `#tag` chips, resonance %, summary).
  New structures grow in from scale 0.001; stale memories removed from scene + Map.

## Source
- `DOUR-DIRECTIVE-003.md` Gap 2 (Memories as Buildings). Builds on `GSKClient` (new `memories()`
  method + default api key) and the existing modal/click pattern (`showGskThoughtModal`).
- Profit Prime's stated post-Gap-2+3 priority is "Memory Monuments" — this ring doubles as that
  concept (elevated weight = monument).

## Build
- Commit `335fae8`. Deployed via GitHub Pages only.
- Verified: `node --check` + live HTML grep (`memory-overlay`, `gsk-memory-count`,
  `class MemoryBuildings`, `_colorForTags`, `userData.gskMemory`).
- Gaps remaining: Gap 3 (Subagents as NPCs).
