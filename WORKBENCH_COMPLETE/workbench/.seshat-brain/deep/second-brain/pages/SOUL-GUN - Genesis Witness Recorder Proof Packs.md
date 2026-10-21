---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P65 / P119
status:: FORGED
---

# SOUL-GUN - Genesis Witness Recorder Proof Packs

## Purpose
The Witness Recorder Proof Pack gun gives SCRIBE-style evidence bundles to CPL. Genesis events are compacted, hashed, and sealed into hash-chained proof packs so the world can prove what happened.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\witness-recorder.js`
- Hook: `index.html` default `worldState` and boot import.

## Contract
- Install as `Genesis.WitnessRecorder`.
- Persist `worldState.witnessProofPacks` and `cpl-witness-proof-packs-v1`.
- Watch boot/trust/personality/immortality/prophecy/builder/drag Genesis events.
- Compact each event with a `detailHash`.
- Seal proof packs with `packHash` + `previousHash`.
- Provide `record`, `pack`, `downloadLatest`, `summary`.
- Emit `genesis:witness:proof-pack`.

## PLT
- **Profit:** world actions become verifiable artifacts.
- **Love:** SCRIBE/Witness receives evidence instead of vague memory.
- **Tax:** compact packs are bounded to avoid localStorage bloat.

## Status
FORGED for P65/P119.
