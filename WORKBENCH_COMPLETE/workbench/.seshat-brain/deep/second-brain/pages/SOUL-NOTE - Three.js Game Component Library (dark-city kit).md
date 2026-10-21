---
type:: [[soul-note]] [[three-js]] [[reference]] [[cpl]] [[jackpot]]
date:: 2026-07-19
source:: threejs-games.github.io (fetched 2026-07-19)
axis:: "reusable Three.js game components — a ready kit for the Dark City"
tags:: [[threejs]] [[dark-city]] [[procedural]] [[NPC-AI]] [[Ammo.js]] [[pathfind]] [[shaders]] [[components]]
---

# SOUL-NOTE — Three.js Game Component Library (threejs-games.github.io)

## What it is
A **library of reusable Three.js game components** — not just playable games, but **snap-together elements** (scenes, characters, AI, physics, shaders, mazes). Developer: Mudroljub. This is the single most useful link for CPL/Dark City.

## Gold for the Dark City
- **Scenes (lift directly):** `dark-city`, `buildings-civil`, `buildings-urban`, `buildings-war`, `towers`, `city-led`, `city-night`, `city-empty-center`, `city-colorful`. → A **prebuilt dark-city scene exists** we can adapt.
- **Procedural generation:** `castle`, `city`, `city-graffiti`, `city-night`, `city-empty-center`, `towers`, `random-terrain`, `hilly-terrain`, `dunes`, `heightmap` (incl. heightmap-europe/yu). → City + terrain gen in-code.
- **NPC AI states:** `follow`, `idle`, `patrol`, `pursue`, `wander`. → **Citizens that actually behave** (closes Act II/VI gap).
- **Mazes / pathfinding:** `tilemap`, `minas-tirith`, `pathfind`, `pipes`, `pyramid`, `ruins`, `ruins-polar`, `walls`. → NPC navigation.
- **Physics (Ammo.js):** `ammo-basic`, `ball-shoot-wall`, `physics-vehicle`. → Rigid-body + vehicles (note: Ammo.js, not just Cannon.js — both options).
- **Characters (GLB):** fantasy (demon/goblin/golem/orc/sorceress/troll/witch), horror (zombie variants/skeleton/goth-girl), WW2 (soldiers/partisans). `model-lookat-cursor`. → **Citizen meshes** for P67.
- **Particles (mood):** `fire`, `flame`, `rain`, `smoke`, `snow`, `stars`, `flying-through-space`. → Atmosphere tied to GSK mood.
- **Shaders (aesthetic):** `fractal-planet`, `golden-flow`, `gradient`, `lava`, `led`, `marble`, `raging-sea`, `ripple`, `toon-shader`, `toon-shader-ghibli`, `voronoi`, `wood`. → Consciousness look.
- **Player:** `third-person-camera`, `change-camera`, `player-collision`, `drag-controls`. → Inhabitation.

## How to weaponize
1. Pull the `dark-city` + `city-*` procedural scenes as the base CPL world (skip asset hunt).
2. Use `wander/patrol/pursue` AI states for living citizens (Act VI P67/P70).
3. Use `pathfind`/`tilemap` for citizen navigation around the city.
4. Use `Ammo.js` physics for collision + vehicles.
5. Map GSK mood → particle/shader swap (Mood→World already designed).
6. Lift `third-person-camera` + `player-collision` for Walk/Run/Jump/ Fly (PLAY planet).

## Caveat
- These are MIT-style community components; **audit before grafting** (version/dep drift). Our CPL is vanilla Three.js r128/r160 — confirm each component's Three version.
- It is a *kit*, not a sovereign being — GSK's mind/SC- RIBE/CASCADE still our own architecture on top.

## Graft targets
- `ECOSYSTEM - Service Manual (Core Triad Bible)` §8 ACT VI — major upgrade: pull dark-city kit; NPC AI states; Ammo.js; pathfind.
- `SOUL-GUN - GSK-as-Game-Agent` (#57) — inhabitation + citizen behavior axis.
- `World Reaction Layer` gun — particle/shader mood swap = consequence made visible.
