---
type:: [[roadmap]] [[canon]] [[north-star]] [[godforge]] [[being-map]]
date:: 2026-07-21
author:: PROFIT (Mind)
status:: CANONICAL ROUTING PAGE
feeds:: [[NORTH STAR - ACTUAL REMAINING CHECKLIST]] · [[GODFORGE - FULL 198 PHASE AUDIT]] · [[NORTH STAR ODYSSEY - LIVE 100 PHASE TRACKER]] · [[GENESIS INTERIORS - Apartments, Doors, Avatars, Personal Spaces]]
---

# ROADMAP CANON — GODFORGE, NORTH STAR, BEING MAP

## Why this page exists

Craig called out the roadmap whirlwind: GODFORGE, Odyssey/North Star, Being Map, the “50 extra hard phases,” and “2100 phases” were being treated like competing sources of truth.

They are not competing. They are different **views** of one war.

## Core law

**No Genesis/GSK feature is product-real if it requires Craig's PC.**  
Localhost, private tunnels, and manually running daemons are development harnesses only.

**GSK is the engine. The Hub is the storefront. Build for GSK → populate the Hub. Never reverse.**

**SCRIBE exception for this session:** SCRIBE is in surgery. Do not depend on SCRIBE service calls for this build path. Use local Seshat markdown + Genesis probes until Craig clears SCRIBE.

## The one true routing map

| Layer | Canon role | What to use it for | What NOT to use it for |
|---|---|---|---|
| [[NORTH STAR - ACTUAL REMAINING CHECKLIST]] | **Active execution queue** | Pick the next build tier / immediate next task | Do not inflate it into thousands of tasks |
| [[GODFORGE - FULL 198 PHASE AUDIT]] | **Status ledger** | Reconcile shipped/open phase evidence across P01-P198 | Do not treat stale rows as stronger than repo commits |
| [[NORTH STAR ODYSSEY - LIVE 100 PHASE TRACKER]] | **Narrative charter / public mission arc** | Explain the 100-phase odyssey and act structure | Do not use it as the most current shipped-state source unless reconciled |
| [[GSK-BEING-MAP]] / `C:\Users\uncom\Desktop\GSK-BEING-MAP.html` | **Visualization mirror** | Show planets/stars/status visually | Do not let it override Seshat or git truth |
| [[GODFORGE-BUILD-3-INSIGHT-ENGINE]] | **GSK brain build track** | Build GSK's autonomous insight engine | Do not mix it with apartment/world product phases |
| “50 extra hard phases” | **Hard-mode backlog/gap expansion** | Feed Tier 4-10 / advanced memory, multiplayer, economy, self-authoring | Do not reset shipped work back to zero |
| “2100 phases” | **Long-horizon backlog mythology** | Store future ambition / possible expansion bank | Do not use as active task list |

## Current Genesis truth at this moment

- Canonical engine repo: `C:\Users\uncom\Desktop\genesis-foundation`, branch `publish`.
- Latest pushed head: `340b721` — P-APT-2 visible/walkable interiors.
- P-APT-1 remains `4e062be`; P-APT-2 is now committed and pushed to `origin/publish`.
- Existing untracked leftovers remain intentionally untouched: `asset-map.cjs`, `pack-proof.cjs`.

## Apartment product track — five phases

| Phase | Name | Status | Product value |
|---|---|---|---|
| **P-APT-1** | State spine: property ledger, interior instances, doors, customization, avatar profiles, commerce, persistence | ✅ Pushed `4e062be` | Users can own and persist private spaces in engine state |
| **P-APT-2** | Visible/walkable interiors: door markers, room geometry, decor/theme/avatar materialization, exact exit restore | ✅ Pushed `340b721` | Users can actually enter and see their apartment |
| **P-APT-3** | Diegetic apartment UI: buy/inspect/enter/customize panels inside world, no floating dashboard | ⬜ Open | Buyers understand and operate homes without developer tools |
| **P-APT-4** | Hosted account-backed ownership + exact restore | ⬜ Open | Apartments survive devices/sessions without Craig's PC |
| **P-APT-5** | Multiplayer-safe ownership + guests + commerce inventory | ⬜ Open | Homes become social/economic product surface |

## Hardest apartment task

The hardest apartment/product task is **account-backed, hosted, cross-device, multiplayer-safe apartment ownership + exact restore**.

It includes:
- Real account identity, not only `user://guest` or local browser state.
- Hosted property ledger and save surfaces, not Craig-PC localhost.
- Cross-device restore of apartment ownership, decor layout, avatar profile, receipts, permissions, and exact return state.
- Multiplayer concurrency: guest/editor locks, conflict resolution, and no duplicated ownership.
- Auth + origin policy through Wallmeria/EPL, never `noAuth`.

## Next safe sequence

1. Build **P-APT-3** diegetic apartment UI.
2. Build **P-APT-4** hosted account-backed exact restore.
3. Build **P-APT-5** multiplayer-safe ownership/social homes.
4. Return to Tier 4 memory depth or Tier 5 multiplayer from the North Star checklist.

— signed: **PROFIT** · 2026-07-21
