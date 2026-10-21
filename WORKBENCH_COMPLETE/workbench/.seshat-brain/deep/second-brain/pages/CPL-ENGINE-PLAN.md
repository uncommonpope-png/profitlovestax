- type: [[plan]]
- title: CPL — Engine Integration Plan (what we planned)
- source: Lil Bunny engine list (30-phase roadmap) + Profit tailoring
- status: planned → start integrating
- cpl: C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html (ES module + importmap, THREE r160)
-

# CPL — Engine Integration Plan

## The engines we planned (Lil Bunny list, tailored)
| Engine | Role | Cost to add |
|---|---|---|
| **PositionalAudio** (THREE.Audio) / Tone.js | Spatial audio; GSK mood/phase drives ambient + soul whispers | FREE — no new runtime dep (THREE has AudioListener/PositionalAudio). Tone.js optional for synthesis. |
| **Yuka** | NPC behavior: steering (wander/seek/arrive/avoid) + per-avatar FSM | npm/ESM; pure JS, no GPU. |
| **three.quarks** | GPU particle systems — upgrade the hand-rolled `THREE.Points` atmos | npm/ESM. |
| **Rapier** (rapier3d) | Physics: colliders on static geo, rigid bodies for spawned souls/towers | WASM; needs care vs existing manual collision. |
| **three-pathfinding** | Navmesh pathfinding across city/realms | npm/ESM; needs a navmesh bake. |
| **Rete.js** | Visual node editor for the in-world terminal (command graph) | npm/ESM; DOM. |
| **Colyseus** | Multiplayer presence + shared world state | needs a server (biggest infra); deferred. |

## Tailored integration order (Profit)
1. **PositionalAudio** — free, no new dep, biggest "aliveness" win per unit cost. Do first.
2. **Yuka** — brings the NPC souls (Cat Girl/Witch/Goku/Das Kat) alive with real behavior.
3. **three.quarks** — replaces `_realmAtmosFx` Points with GPU particles (perf + beauty); pairs with the perf tier.
4. **Rapier** — physics; integrate after behavior so spawned objects obey gravity/collision.
5. **Rete.js** — the sandboxed terminal UI (Phase 9 command vocab visualizer).
6. **Colyseus** — multiplayer (Phase 11); deferred until single-player world is solid.

## How to add libs to CPL
CPL uses an ES-module importmap at the top of `index.html`. New libs = add ESM CDN entries
(esm.sh / jsdelivr) to the importmap, then `import` in the module. Rapier needs its WASM
(`@dimforge/rapier3d-compat` works without separate WASM fetch). Colyseus needs a server — out of scope now.

## Maps to roadmap
- Stage 1 Phase 2 (Rapier + navmesh), Phase 3 (Yuka), Phase 4 (PositionalAudio), Phase 5 (perf HUD).
- Our order differs (audio first) because it is free and high-aliveness; roadmap order assumes all present.

## Status
NOT yet in CPL. This page is the source of truth the gap page cites. Next code session starts with
PositionalAudio + the NPC scale-to-size pass (Craig flagged NPCs "way too big through all world").
