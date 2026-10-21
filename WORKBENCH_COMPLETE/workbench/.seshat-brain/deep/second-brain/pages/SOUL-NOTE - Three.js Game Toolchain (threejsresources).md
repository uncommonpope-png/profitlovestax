---
type:: [[soul-note]] [[three-js]] [[reference]] [[cpl]] [[toolchain]]
date:: 2026-07-19
source:: threejsresources.com/gaming (fetched 2026-07-19)
axis:: "best three.js games — the open toolchain to weaponize for CPL"
tags:: [[threejs]] [[Cannon.js]] [[Tweakpane]] [[dat.GUI]] [[EZ-Tree]] [[GLSL]] [[WebGPU]] [[multiplayer]] [[GLTF]]
---

# SOUL-NOTE — Three.js Game Toolchain (threejsresources.com)

## The open toolchain (all reusable for Dark City)
- **Cannon.js** — physics + collision. Rigid bodies for citizens, vehicles, buildings. We have NONE.
- **Tweakpane / dat.GUI** — **live tuning of gameplay values**. Craig/Profit tune PLT, mood thresholds, reaction-rules in real time. Diegetic debug console (P75).
- **EZ-Tree** — procedural environment gen (foliage, city dressing).
- **Custom GLSL / WebGPU shaders** — materials, glow, consciousness aesthetic.
- **GLB/GLTF/FBX/OBJ loaders** — for the citizen meshes we lack (Act VI P67).
- **AI + Three.js toolkit** — GSK-as-agent thesis supported by the ecosystem.
- **Starter boilerplates / courses** — accelerators to skip scaffolding.
- **Multiplayer worlds** — Three.js explicitly ships multiplayer; closes Act VII gap.

## Caveat
- **drei / React Three Fiber** listed but our CPL is **vanilla Three.js (r128/r160)** — drei does NOT apply. Use vanilla equivalents (manual helpers, our own glow/post).
- "AAA Unity/Unreal" noted as heavier — we stay browser-native (instant URL play = our edge).

## Graft targets
- `ECOSYSTEM - Service Manual (Core Triad Bible)` §8 ACT VI — add Tweakpane/drei-caveat/EZ-Tree to P75/P76; ACT VII multiplayer note.
- `SOUL-GUN - GSK-as-Game-Agent` (#57) — toolchain axis.
- Pair with `SOUL-NOTE - Three.js Games Techniques for CPL (FreeFrontend)` — that's the game-pattern side; this is the tool side.
