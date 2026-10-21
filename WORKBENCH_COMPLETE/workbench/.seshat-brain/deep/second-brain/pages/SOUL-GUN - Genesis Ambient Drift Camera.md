---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P77
status:: FORGED
---

# SOUL-GUN - Genesis Ambient Drift Camera

## Purpose
The Ambient Drift Camera gun gives CPL a subtle idle camera breath so the world feels alive without stealing control from the player.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\ambient-drift-camera.js`
- Hook: `index.html` NPC camera update.

## Contract
- Install as `Genesis.AmbientDriftCam`.
- Apply tiny camera offsets only while player is idle in NPC camera mode.
- Fade out immediately during movement, dragging, flight, or command-center use.
- Persist bounded drift stats in `worldState.ambientDriftCam`.
- Emit `genesis:camera:drift` on a slow interval for proof systems.

## PLT
- **Profit:** improves world feel with tiny code and bounded writes.
- **Love:** the city breathes while Craig pauses.
- **Tax:** drift is gated and subtle to avoid motion sickness/control theft.

## Status
FORGED for P77.
