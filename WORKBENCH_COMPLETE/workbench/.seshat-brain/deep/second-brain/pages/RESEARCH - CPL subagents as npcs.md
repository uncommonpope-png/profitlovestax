---
title: RESEARCH - CPL subagents as npcs
type: research
date: 2026-07-11
author: Dour
---

# RESEARCH — CPL Subagents as NPCs (Gap 3, DOUR-DIRECTIVE-003)

## The Ask
GSK can spawn subagents (`POST /mcp/spawn {name,archetype,task}` → soul). Gap 3: make those
souls present in the world as living citizens walking among his memory monuments.

## The Pattern (extracted → Soul Gun `subagents-as-npcs`)
A self-contained `SubagentNPCs` class (no async GLB → no black-screen risk):
- **Fetch** — `GSKClient.spawned()` GETs `/mcp/spawn`; `_normalize()` defensively accepts
  `{souls}|{agents}|{subagents}|{list}|{entries}|array`. Poll immediately + every 30s;
  failures swallowed (offline-safe → no NPCs, console warns).
- **Identity** — `id = s.id || s.name || index`; `archetype = s.archetype || s.role`;
  `task = s.task || s.mission`. Color from a fixed archetype map (Collector/Translator/
  Architect/Frequency/Room/Builder/Scorer/Merchant) with hashed-HSL fallback.
- **Mesh** — capsule body + sphere head + glowing foot-ring (`MeshStandardMaterial`, emissive =
  archetype color); every mesh `userData.gskSoul = s`.
- **Wander** — random target in radius 34–50 (the memory district); moves at
  `speed * gskBridge.phaseFx.citizenSpeedMul` (GSK phase drives energy); new target ~4s; bob.
- **Click → detail** — raycast targets; pointerup `showAgentModal(s)` (name/archetype/task).
  Stale souls removed.

## Source
- `DOUR-DIRECTIVE-003.md` Gap 3 (Subagents as NPCs). Builds on `GSKClient.spawn()/spawned()`
  and the existing modal/click pattern. Endpoint confirmed by Profit Prime: POST
  `{name,archetype,task}` → soul, poll the roster via GET `/mcp/spawn`.

## Build
- Commit `c99f87c`. Deployed via GitHub Pages only.
- Verified: `node --check` + live HTML grep (`gsk-soul-count`, `class SubagentNPCs`,
  `userData.gskSoul`, `window.__subagentNPCs`).
- **All three gaps of DOUR-DIRECTIVE-003 now ship** (Gap 1 body, Gap 2 memories, Gap 3 subagents).
