# SKILL - CPL immersive NPC mode

type:: [[skill]] [[soul-gun]]
status:: [[built]]
links:: [[DOUR-BIBLE]] [[RESEARCH - CPL perf]] [[CPL ASSET MAP]] [[SKILL - gsk-bridge]]

## Purpose
Make Cosmic Pyramid Library playable from inside the city: toggle camera modes, become an NPC, walk/run/jump/fly, click Heaven to teleport, and talk to NPCs.

## Current Build Intent
- Keep GitHub Pages as the only test/deploy target. Do **not** restart localhost unless Craig explicitly asks.
- Preserve visible baseline. No heavy kit districts until one-at-a-time validation.
- Lazy-load non-essential GLBs after first gesture/idle so the procedural city appears fast.
- Add `ORBIT` / `PLAY NPC` camera controls.
- First-person controls: WASD move, Shift run, Space jump, F fly toggle, mouse/look via heading keys if pointer lock is not used.
- Heaven access: clickable Heaven gate/platform teleports player to Heaven position.
- NPC talk: clicking citizens/Paimon/player-adjacent NPCs spawns dialogue text/whisper.

## Built In This Pass
- Lazy GLB queue in `makeGLTF()` default path: existing GLB calls enqueue and stream after idle / first user gesture instead of blocking first paint.
- Camera mode UI: `ORBIT` and `PLAY NPC` buttons.
- Playable procedural NPC body: visible in orbit, hidden in first-person.
- Controls: WASD move, Shift run, Space jump, F fly toggle, Ctrl/Q descend while flying, C camera toggle, mouse-look via pointer lock, arrow-key fallback.
- Heaven lift: clickable gold platform in city teleports player to Heaven and enables flight.
- NPC talk: citizens and Paimon meshes get `userData.npcTalk`; clicking them spawns dialogue whispers.
- GitHub Pages only workflow. No localhost dependency.

## Safe Implementation Notes
- Use procedural `playerNPC` built from primitives. Do not require a new GLB.
- Do not replace OrbitControls. Disable it only while `cameraMode === 'npc'`.
- Do not make the loading overlay depend on GLB completion. It hides on first frame.
- Keep billboard pass; do not reintroduce `assets/kits` until after baseline verified.

## Continuation Checklist
1. Verify GitHub Pages deployment for the commit after this note.
2. Open `https://uncommonpope-png.github.io/cosmic-pyramid-library/?v=<commit>`.
3. Confirm first paint is faster because GLBs lazy-stream.
4. Test `PLAY NPC`, WASD, Shift, Space, F, Ctrl/Q, mouse look.
5. Click citizens/Paimon for dialogue.
6. Click Heaven lift platform near `z=-52` to teleport/fly in Heaven.
7. If adding building kits later, add **one kit at a time** and measure Pages load.

## Done Criteria
- GitHub Pages loads.
- Orbit mode still works.
- PLAY NPC mode moves inside city.
- Run/jump/fly work.
- Clicking Heaven gate teleports to Heaven.
- Clicking NPCs produces dialogue.
- No localhost dependency.
