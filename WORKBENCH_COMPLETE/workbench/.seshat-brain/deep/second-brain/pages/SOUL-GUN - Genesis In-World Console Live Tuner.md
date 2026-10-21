---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P75
status:: FORGED
---

# SOUL-GUN - Genesis In-World Console Live Tuner

## Purpose
The In-World Console Live Tuner gun makes SURGE/CALM mood-phase controls affect the world immediately from inside CPL, even when Sanctum is offline.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\world-tuner.js`
- Hooks: `index.html` import/install, `issueWorldCommand()`, `applyLocalWorldTune()`, `window.gskBridge` exposure.

## Contract
- Install as `Genesis.WorldTuner`.
- Persist `worldState.liveTuning` current tune, history, and command outcomes.
- `tune` commands apply local mood/phase visuals and phase speed multipliers.
- Sanctum online: send command and apply local immediate tune.
- Sanctum offline: tune commands still apply locally and report `local tune applied`.
- Emit `genesis:world:tune` and `genesis:world:command`.
- Feed Witness Recorder and Immortality Audit.

## PLT
- **Profit:** console controls now have visible consequence without hosted infra.
- **Love:** the world answers the user immediately.
- **Tax:** non-tune commands remain blocked when Sanctum is offline.

## Status
FORGED for P75.
