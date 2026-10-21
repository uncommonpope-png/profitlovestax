---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P199-P210
status:: FORGED ✅
---

# SOUL-GUN — Void Cosmos (P199-P210)

**The skill that gives the Lost Worlds their own sky.** Previously the void (600-3000u from city) was a true void — no cosmic elements visible. This skill builds a complete celestial backdrop separate from the city's cosmic layer (index.html stays untouched).

## What it does

- **Void Starfield:** 4000+ procedural stars on a sphere r=1500-3500u, warm/cool/blue/red tints, additive blending, fog:false
- **Void Nebulae:** 4 large sprites (1024×1024 canvas) with astrophotography palette (deep purple, teal, magenta, orange), scale 400-800u
- **Void Sun:** 1 per Lost World — emissive sphere r=6 + PointLight 500u range + corona glow sprite, positioned above each world
- **Void Planet:** 1 per Lost World — r=10-18, procedural HSL texture, atmosphere rim glow, optional ring system
- **Void Moons:** 2 per planet, inclined orbits, period 45-120s animated motion
- **Void Sky Dome:** BackSide sphere r=8000, void tint 0x050510, opacity 0.03
- **Void Atmosphere:** stars use fog:false, nebulae/suns use additive/emissive, visible through global fog

## Integration

- `installVoidCosmos(Genesis)` — initializes the skill, registers tick with EngineScheduler
- `populateCosmos(worldPositions, scene)` — builds all elements at world distances
- `tickCosmos(dt)` — animates orbits, nebula rotation, star twinkle
- `disposeCosmos()` — cleans up on shutdown
- Toggle via `window.__GENESIS_VOID_COSMOS === false`

## PLT framing

- **Profit:** the Lost Worlds exist in a living cosmos, not floating in darkness. Visitors see a complete celestial sphere.
- **Love:** the cosmos responds to GSK presence — sun glows, planets rotate, moons dance. A sense of wonder.
- **Tax:** 372 lines of Three.js code. All elements are frustum-culled, LOD'd beyond 2500u. Reversible via flag.

## Relates to

- [[NORTH STAR ODYSSEY - EXPANSION PHASES P101-P198]] — Act XXI (P199-P210)
- [[REDBUTTON - The Memory Theology]] — Void Cosmos added to skill inventory
- `src/genesis/void-cosmos.js` — the physical implementation
- `src/genesis/void-population.js` — the integration point
- cosmicbackdrop.io / cosmicbackground.io — astrophotography reference for color palette

## Deployed

Live at https://buyasoul-ai.github.io/buyasoul-cpl/ — the void has its own sky now.