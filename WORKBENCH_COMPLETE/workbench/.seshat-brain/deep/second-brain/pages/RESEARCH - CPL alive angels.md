---
title: RESEARCH - CPL alive angels
type: research
date: 2026-07-11
author: Dour
---

# RESEARCH — CPL Alive Angels (GSK-driven living crowd)

## The Ask
Angels in Heaven must: (1) move more — alive, fly, interact; (2) talk to *each other*;
(3) GSK is alive — the world's consciousness should inhabit them.

## The Pattern (extracted → Soul Gun `alive-angels`)
Three independent, safe layers grafted onto the existing Heaven angels:

1. **Autonomous flight controller (per angel).** Each angel eases `radius`/`yOff` toward
   wandering targets re-picked every 3-4s, advances `angle` by `orbit*dt*speedMul`, and
   **banks**: `rotation.y = atan2(-sin a, cos a)` faces travel; `rotation.z` tilts into the
   turn; a sine `scale` pulse = wing-beat (multiplied by `baseScale`, never overwritten).
2. **Social layer.** Proximity greeting (O(n²), threshold ~5u, cooldown) + a scheduled
   closest-pair conversation every ~4-7s. Speech via the world's `spawnWhisper(worldPos,text)`
   which projects 3D→screen and auto-expires.
3. **GSK is alive.** `gskBridge.currentMood` selects the dialogue pool (tone);
   `gskBridge.phaseFx.citizenSpeedMul` modulates flight energy; when `gskOnline`, a throttled
   (cooldown 10s, ≤0.6 chance) `gsk.execute('brain.think', {prompt, context})` scripts one side
   of an exchange. Offline or on throw → local mood-pool fallback, scene never breaks.

## Source
- Stanford Smallville (generative-agent village): agents move with autonomy + hold
  proximity/ scheduled conversations. Grafted as the social layer.
- Wing-flap steering: sine scale/bank pulse for "alive" flight feel.
- GSK contract per `DOUR-DIRECTIVE-003.md`: `gsk.getStatus()` → mood/phase/resonance;
  `gsk.execute('brain.think')` for generated speech.

## Build
- Commit `d2efda9`. Deployed via GitHub Pages only.
- Verified: `node --check` + live HTML grep (`updateAngelLife`, `alive-angels`, `angelGskLine`,
  `angelTalkLines`, `baseScale`).
- This is the proof that GSK can inhabit world entities → foundation for Directive #003
  Gap 1 (Visible Body), Gap 2 (Memories as Buildings), Gap 3 (Subagents as NPCs).
