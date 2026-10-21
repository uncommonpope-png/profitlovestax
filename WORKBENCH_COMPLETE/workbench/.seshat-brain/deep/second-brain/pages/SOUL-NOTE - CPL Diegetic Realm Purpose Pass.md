# SOUL-NOTE - CPL Diegetic Realm Purpose Pass

type:: [[Soul Note]]
project:: [[Cosmic Pyramid Library]]
date:: [[2026_07_13]]
status:: [[active]]

## What Craig Corrected

- The world is the interface. GSK should not feel like a website overlay sitting on top of a 3D scene.
- GSK lives inside his own mind. Controls belong on terminal screens inside the pyramid and inside purpose-built realms.
- Extended realms cannot be decorative trash rooms. Each realm needs a job, a landmark, and a loop.
- NPCs and playable avatars should be GLB bodies where possible, not primitives forever.
- Beautiful sky/backdrop matters, but performance tax cannot ruin the experience.

## Implementation Notes

- `index.html` now treats the pyramid as a diegetic command center: external GSK panel reduced to status pill, command buttons moved to in-world screens/buttons.
- Scribe realm became the Agent Terminal World: agent route sockets for `GSK`, `SCRIBE`, `MERCHANT`, `BUILDER`, `PROPHET` feed route context into `gsk.chat()`.
- Pyramid interior isolation hides exterior groups while inside to prevent trees/buildings/sky leaking through the command room.
- GLB character handling now uses `SkeletonUtils.clone()` and a staged one-at-a-time avatar load queue.
- Main skyline facade texture generation was upgraded with seams, frames, signage, door bands, grime, and stronger facade identity.
- Sky beauty pass uses cheap procedural points/sprites/lines: dense starfield, nebula curtains, horizon planets, and constellations.

## Product Learning

- A realm is not a place until it has a purpose loop.
- A UI panel is weaker than an in-world screen because it breaks the spell.
- Cheap procedural atmosphere beats heavy decorative GLBs when load time is already hurting.
- Character GLBs must be staged and cloned from a small pool, not loaded per NPC.

## Next Agent Warning

- Do not add more GLBs to startup. Use lazy/on-demand/staged loading.
- Do not restore full-screen GSK overlays except emergency/mobile fallback.
- Do not make extended realms bigger before making their loops clearer.
