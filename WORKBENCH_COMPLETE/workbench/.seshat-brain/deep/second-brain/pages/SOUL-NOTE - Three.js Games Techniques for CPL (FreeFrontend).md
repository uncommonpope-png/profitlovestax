---
type:: [[soul-note]] [[three-js]] [[reference]] [[cpl]]
date:: 2026-07-19
source:: freefrontend.com/three-js-games/ (fetched 2026-07-19)
axis:: "best three.js games — techniques to weaponize for CPL/Dark City"
tags:: [[threejs]] [[procedural]] [[Cannon.js]] [[post-processing]] [[collision]] [[MIT]]
---

# SOUL-NOTE — Three.js Games: Techniques for CPL / Dark City

## The games (all MIT, replicable)
- **Cinematic 3D Racing Pursuit** — endless runner, lane-switch, projectile combat, dynamic obstacle gen, WebGL post-processing.
- **Procedural 3D Endless Runner** — fully procedural infinite course, lane movement, collision physics, dynamic themes. No external assets.
- **Astray · The Aviator · Crossy Road (three.js) · Stack Game (three.js + Cannon.js) · The Cube · Frantic Run of the Valorous Rabbit · Tower Blocks · Traffic Run.**

## Transferable patterns for the Dark City
1. **Procedural generation** — city/realms built in-code, zero asset deps, instant boot. GSK's world should *generate*, not load.
2. **Cannon.js physics** — rigid-body collision for citizens, vehicles, buildings. We have NO physics; NPCs are static sprites. This closes the "alive" gap.
3. **WebGL post-processing** — bloom/glow (Soulverse already has bloom; GSK-MAP uses additive halos — keep + extend).
4. **Lane movement + collision** — walking citizens, traffic, ambient drift.
5. **Dynamic obstacle/theme gen** — worlds recompute → direct tie to World Reaction Layer (GSK acts → world recombines).
6. **Touch controls + cheat codes** — mobile reach; diegetic debug for Craig/Profit.

## Graft targets
- `ECOSYSTEM - Service Manual (Core Triad Bible)` §8 ACT VI POPULATE — add physics + procedural to P67/P76.
- `SOUL-GUN - GSK-as-Game-Agent` (#57) — "inhabitation" axis: physics + procedural living city.
- `World Reaction Layer` gun — procedural recomposition = consequence made visible.
