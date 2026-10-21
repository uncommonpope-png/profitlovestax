---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P138 / P183
status:: FORGED
---

# SOUL-GUN - Genesis PLT Ledger

## Purpose
The Genesis PLT Ledger records per-action Profit + Love - Tax deltas so the world's ethical/economic score is auditable instead of opaque.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\plt-ledger.js`
- Hook: `index.html` after `saveWorldState()` exists

## Contract
- Installs as `Genesis.PLT`.
- Provides `record(action, {profit,love,tax}, meta)`.
- Saves capped entries to `worldState.pltLedger`.
- Emits `genesis:plt:record`.
- Hooks existing events immediately:
  - `genesis:boot-ready`
  - `genesis:prophet:archive`

## PLT
- **Profit:** every action becomes analyzable value data.
- **Love:** the world can explain why it changed.
- **Tax:** scoring all actions requires gradual wiring; this first version is event-driven and extensible.

## Status
FORGED for P138/P183.
