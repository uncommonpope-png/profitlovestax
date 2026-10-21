---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P47 / P48 / P122 / P123
status:: FORGED
---

# SOUL-GUN - Genesis Trust Ledger and Betrayal Recall

## Purpose
The Trust Ledger and Betrayal Recall gun gives citizens durable relationship memory. Talks increase trust, betrayal events reduce trust, and future dialogue can recall betrayal history.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\trust-ledger.js`
- Hook: `index.html` after `saveWorldState()` and inside `talkToNPC()`

## Contract
- Install as `Genesis.TrustLedger`.
- Persist `worldState.trustLedger`.
- Provide `record`, `onTalk`, `betray`, `recallLine`, `summary`.
- Listen for `genesis:citizen:betray` events.
- Emit `genesis:trust:delta` and `genesis:citizen:betrayal-recalled`.
- Record PLT deltas through `Genesis.PLT.record()` when available.

## PLT
- **Profit:** relationship state becomes usable game data.
- **Love:** citizens remember how they were treated.
- **Tax:** betrayal triggers must be wired into more actions over time.

## Status
FORGED for P47/P48/P122/P123.
