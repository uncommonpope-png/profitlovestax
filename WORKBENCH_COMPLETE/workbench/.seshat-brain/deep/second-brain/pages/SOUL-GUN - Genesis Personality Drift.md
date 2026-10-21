---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P49 / P124
status:: FORGED
---

# SOUL-GUN - Genesis Personality Drift

## Purpose
The Personality Drift gun gives CPL citizens evolving HEXACO-style traits driven by interactions and trust changes. Citizens are no longer static line dispensers; their tone can drift as relationships change.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\personality-drift.js`
- Hooks: `index.html` world state, boot import, `talkToNPC()` tone expression.

## Contract
- Install as `Genesis.PersonalityDrift`.
- Persist `worldState.personalityProfiles`.
- Traits: honesty, emotionality, extraversion, agreeableness, conscientiousness, openness.
- Listen to `genesis:trust:delta`.
- Positive trust nudges agreeableness/extraversion up.
- Negative trust nudges agreeableness down and emotionality up.
- Dialogue can surface non-steady tone labels.

## PLT
- **Profit:** citizen identity becomes durable simulation state.
- **Love:** relationships shape character instead of resetting every interaction.
- **Tax:** current drift is lightweight; future phases can deepen trait-driven behaviors.

## Status
FORGED for P49/P124.
