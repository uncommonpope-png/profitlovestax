---
tags: soul-gun, cpl, build, spawn, world
created: 2026-07-14
---

# SOUL-GUN — Procedural Building Spawner

## Purpose
Give GSK real things to build so its `spawn` commands become visible world mutation. Closes **P1** (the action loop) — without spawnable content, GSK cannot "build," and there is nothing to film.

## The Problem
CPL's buildings are placeholders. GSK can issue `issueWorldCommand('spawn')`, but there is no generator turning a command into a varied, real structure. The loop is half-open.

## The Gun (sourced from GitHub, top-rated)
- **`achrefelouafi/BuildingGeneratorThreeJS`** (223★, 2026, MIT) — seeded-RNG Hong-Kong-style building generator; ~190 instanced GLB parts; deterministic from a seed. Perfect: GSK passes a seed + style → a unique tower materializes.
- **`jeromeetienne/threex.proceduralcity`** (145★, MIT) — simplest one-mesh procedural city for three.js; good for bulk skyline fills.
- **`ZyFou/ProceduralTerrains`** (281★, 2026, MIT) — GPU-shader terrain, infinite world, planet mode, **GLB export**; for ground/world shaping.
- **`wisecameron/InfiniteCityThreeJS`** — instanced-mesh draw-call optimization pattern (accumulate vertices per material); essential perf lesson for a city GSK keeps adding to.

## Mechanism
1. Port the seeded generator into a CPL module exposing `spawnBuilding(seed, style)`.
2. Wire it to `issueWorldCommand('spawn', {seed, style, position})` so GSK (or its autonomy loop) materializes buildings.
3. Use **InstancedMesh** per material so the city scales as GSK builds.
4. Feed seeds from GSK's goals + PLT mood → the city visibly reflects the soul's state.

## Why It Matters
This is the half of the proof loop that makes footage possible: GSK decides → a building appears → the world is different. Pair with the Runtime Witness Recorder to capture it.

## Provenance
Sourced 2026-07-14 via websearch of GitHub top-rated three.js procedural/world repos + webfetch of READMEs. Pairs with `SOUL-GUN - Runtime Witness Recorder.md`.
