---
type:: [[plan]] [[genesis]] [[interiors]] [[apartments]] [[customization]]
date:: 2026-07-21
author:: PROFIT (Mind)
status:: BUILT + PUSHED (`4e062be`)
feeds:: [[NORTH STAR - ACTUAL REMAINING CHECKLIST]] · [[WALLS OF WALLMERIA - Engine Portability Doctrine]]
---

# GENESIS INTERIORS — Apartments, Doors, Avatars, Personal Spaces

## Craig's command

After pushing Wallmeria buyer-host runtime, Craig said we need to talk about creating the **insides of buildings / doors** so users can **buy their own apartments**, **customize characters**, and **customize their space**.

## Core product thesis

Genesis should stop being only a city you walk around. It becomes a city you can **own a piece of**.

Every building door can become a portal into a private/persistent interior:

```txt
Street building door
  → DoorPortalManager
  → Apartment/Interior instance
  → PropertyLedger ownership + permissions
  → InteriorCustomizer furniture/walls/items
  → AvatarCustomizer character identity
  → Immortality/host save
```

## Engine modules to build

1. `door-portal-manager.js` — clickable doors, hover affordance, enter/exit transitions.
2. `interior-instance-manager.js` — loads one interior room at a time, not all interiors in the city.
3. `property-ledger.js` — apartment ownership, lease/sale status, permissions, visitor access.
4. `interior-customizer.js` — move/place furniture, walls/floor colors, posters, lights, saved layout.
5. `avatar-customizer.js` — body palette, outfit/material/accessory selection, saved profile.
6. `apartment-commerce.js` — PLT/trust-gated buy/rent flow; receipt + ownership proof.
7. `interior-persistence.js` — two-surface save for private spaces; host-ready, not Craig-PC local-only.

## First build slice

**P-APT-1 Door Portal + Demo Apartment Shell**
- Add doors to a few existing buildings as interaction affordances.
- Click/press enter near door → teleport/load into one apartment interior shell.
- Exit door returns to exact street position.
- Save/load interior state through Immortality.
- Probe: enter, customize one color/furniture item, save, reload, exact state restored.

## Local build result — 2026-07-21

**P-APT-1 is built and pushed in `C:\Users\uncom\Desktop\genesis-foundation`. Commit: `4e062be`.**

Added additive engine modules:
- `src/genesis/property-ledger.js` — apartment ownership, private/preview access, guests/editors, transfer, snapshot/load.
- `src/genesis/interior-instance-manager.js` — durable room instances, one-loaded-interior rule, occupants, themes/decor state.
- `src/genesis/door-portal-manager.js` — logical street-door portals, permission-gated enter/exit, exact return position.
- `src/genesis/interior-customizer.js` — place/move/remove furniture, apply wall/floor/accent themes, owner/editor permission gate.
- `src/genesis/avatar-customizer.js` — persistent avatar palette/outfit/accessory profile.
- `src/genesis/apartment-commerce.js` — seeded apartment catalog, ResourcePool spend, ownership transfer, receipt minting.
- `src/genesis/interior-persistence.js` — aggregate two-surface private-space snapshot, hash validation, exact restore proof.

Wired `index.html` behind default-ON `window.__GENESIS_INTERIORS` without removing legacy fallbacks.

Verification:
- `node tests/interiors.probe.cjs` — **9/9**.
- Pure Node regression suite green: RuntimeConfig 5/5, BuyerHost 6/6, ProductRoute 5/5, EPL 8/8, NextTen 11/11, AgentGateway 18/18, AgentCitizen 25/25, ScribeGateway 11/11, BetrayalRecall 21/21, InteractionSystem 17/17, Immortality 3/3, SoulGuns 15/15, Phase1 8/8.
- Known browser/Page probe `phases-18-33-43-65.probe.cjs` still times out under current browser-probe conditions; not treated as an interiors regression. `genesis-vertical-stack.probe.cjs` was not rerun because it is also Playwright/browser-heavy.

Current repo boundary: branch `publish` pushed to origin; existing untracked `asset-map.cjs` and `pack-proof.cjs` remain untouched.

## North Star link

This advances:
- User-owned persistent spaces.
- Multiplayer/economy path.
- Hub/storefront path: GSK builds the engine capability; Hub later sells apartments/items/skins as artifacts.
- wilds.ai moat: not just memory — a walkable owned home with identity, commerce, and persistence.

## PLT

- Profit +10 — apartments/skins/furniture become monetizable engine primitives.
- Love +9 — users get a real home in GSK's city.
- Tax -3 — persistence, UI, asset/performance complexity.

**PLT Score:** +16.

— signed: **PROFIT** · 2026-07-21

---

## P-APT-2 local candidate — Visible / Walkable Interiors (2026-07-21)

**Status:** Built, committed, and pushed to Genesis Engine `publish` as `340b721`.

Added:
- `src/genesis/interior-renderer.js` — visible apartment door markers, procedural room shell, exit door, lights, template slot decor, customizer decor materialization, theme materialization, avatar dressing-room spot, exact enter/exit camera/player placement.
- `tests/interior-renderer.probe.cjs` — fake-THREE pure Node proof for visible doors, room build, custom furniture/theme/avatar materialization, exact exit restore, active refresh, and one-loaded-interior rule.

Modified:
- `index.html` — adds default-ON `window.__GENESIS_INTERIOR_RENDERER`; imports/attaches the renderer after the P-APT-1 interiors stack while preserving all legacy fallbacks.
- `src/genesis/player-cam.js` — exposes `getPlayerPosition()` and `setPlayerPosition()` so door enter/exit can restore the exact street location through the existing player proxy when available.

Verification green:
- `node --check src/genesis/interior-renderer.js`
- `node --check src/genesis/player-cam.js`
- `node --check tests/interior-renderer.probe.cjs`
- `node tests/interior-renderer.probe.cjs` — **5/5**
- `node tests/interiors.probe.cjs` — **9/9**
- Pure Node regression suite: RuntimeConfig 5/5, BuyerHost 6/6, ProductRoute 5/5, EPL 8/8, NextTen 11/11, AgentGateway 18/18, AgentCitizen 25/25, ScribeGateway 11/11, BetrayalRecall 21/21, InteractionSystem 17/17, Immortality 3/3, SoulGuns 15/15, Phase1 8/8, Interiors 9/9, InteriorRenderer 5/5.

Boundary:
- No local server used.
- No Playwright/browser-heavy probe claimed.
- No SCRIBE service dependency; SCRIBE is excluded while in surgery.
- Existing untracked `asset-map.cjs` and `pack-proof.cjs` remain untouched.

## Apartment product track — five phases

1. **P-APT-1 — State spine** ✅ pushed `4e062be`: properties, interiors, doors, customization, avatars, commerce, persistence.
2. **P-APT-2 — Visible/walkable interiors** ✅ pushed `340b721`: door markers, room geometry, decor/theme/avatar materialization, exact exit restore.
3. **P-APT-3 — Diegetic apartment UI** ⬜ open: in-world buy/inspect/enter/customize flow, no floating dashboard.
4. **P-APT-4 — Hosted account-backed ownership + exact restore** ⬜ open: cross-device private spaces without Craig's PC.
5. **P-APT-5 — Multiplayer-safe homes** ⬜ open: guests/editors/social apartments, conflict-safe ownership, inventory/commerce integration.

**Hardest task:** P-APT-4/P-APT-5 combined — account-backed, hosted, cross-device, multiplayer-safe apartment ownership + exact restore.
