# BASE MODEL — The Canonical City

**Declared:** July 25, 2026
**Commit:** `36e397b` (`c964111`: cities + denizens + click-to-jump + travel panel)
**Live URL:** https://buyasoul-ai.github.io/buyasoul-cpl/
**Repo:** `buyasoul-ai/buyasoul-cpl` branch `publish`
**Status:** LOCKED — THIS IS THE BASE. Nothing else works.

> "WHATEVER IS LIVE ON THE PAGES RIGHT NOW IS THE COMMIT WE STAY WITH. NOTHING ELSE WORKS."

---

## What THE BASE Contains

### Core Scene
- CPL city core: pyramid, library, guardian, books, neon souls
- Space City + Heaven City above the world
- Dark City underside below
- Universe sky dome + 3D spiral galaxies + gradient ground + nebula background + planets
- Bloom post-processing, vignette, gamma correction
- Stars (5000-point additive field), floating dust, accent lights
- 5 spiral galaxies at various positions
- Nebula background sprites with rotation
- Horizon ring planet + rose moon

### Controls
- **Orbit mode** (default): click-drag to orbit, scroll to zoom (cap 2000), WASD to pan
- **Play mode**: WASD move, Shift run, Space up/jump, Q down, F fly, drag to look
- **Click-to-jump**: short click on ground → instant teleport + beam VFX
- **5 switchable avatars** via BE: buttons (SCRIBE, MERCHANT, BUILDER, PROPHET, GSK)
- **Cat girl, Cat witch, Goku, Das Kat** GLB avatars

### Scene Objects
- Pyramid interior with GSK Command Center (4 dashboard screens)
- Guardian character (staff, book, robe, glow rings)
- Library with books (click to read PLT framework)
- Egyptian doorway
- Citizen walkers (GLB rigged NPCs)
- Ground traffic (5 GLB cars: BMW M1, E39, Porsche, Wyvern, cyberpunk hovercar)
- Billboard alive (DayZ video)
- Floating orbs, embers, wisp particles
- Heaven City (angels, cloud layers, halo orbits, floating islands)
- Underworld lift portal

### 10 Lost Worlds (THE VOID POPULATION)

Scattered 360 degrees around the city at distances 600–3000 units:

| # | World | Type | Color |
|---|-------|------|-------|
| 1 | Neon Citadel | Combat | Red |
| 2 | Shadow Forge | Crafting | Green |
| 3 | Crystal Nexus | Trading | Gold |
| 4 | Void Empire | Exploration | Purple |
| 5 | Ember Sanctum | Breeding | Pink |
| 6 | Frost Wilds | Governance | Orange |
| 7 | Storm Hub | Economy | Teal |
| 8 | Soul Arena | Building | Blue |
| 9 | Cosmic Garden | Conversation | Amber |
| 10 | Phantom Spire | Districts | Cyan |

**Per World (always visible):**
- Beacon beam (400 units tall) with glowing orb + 2 halo rings
- Ground platform (radius 80-90) with glow rings
- City skeleton (4 districts × 18-30 buildings = 93+ buildings)
  - Work district (cyan, 25 buildings, 8-35 units tall)
  - Home district (pink, 30 buildings, 4-18 units tall)
  - Social district (amber, 20 buildings, 3-12 units tall)
  - Learn district (green, 18 buildings, 6-25 units tall)
- Roads (16-unit grid lines)
- Outer ring buildings (3 rings at radii 120/160/200)
- POI chevron marker + glow ring + point light at y=60
- Atmosphere dome (radius 250, tinted, BackSide, 3% opacity)
- 200 ambient particles (rising, colored by world type)

**Per World (when camera within 800 units):**
- Full Realm loads via `RealmWorld.Realm` with 4 districts, 80+ buildings, 10 AI agents, weather, day/night, Soul Forge, Gacha, Pantheon Arena combat, PLT economy

**Denizens per World (always visible):**
- 5 named NPCs with humanoid body (torso/head/eyes/arms/legs) + name labels
- Type-specific names (Blade Master, Forge Keeper, Merchant Lord, etc.)

**Quest Beacons per World (always visible):**
- Floating diamond (OctahedronGeometry) with glow ring + point light
- Unique quest text per type (combat/ crafting/ trading/ exploration/ breeding/ governance/ economy/ building/ conversation/ districts)

**Portal Connections:**
- Each world connects to the next (index → index+1 mod 10)
- Rotating torus frame (6-unit radius) with inner glow + label ("→ WorldName PORTAL") + point light
- Positioned 100 units from source world toward destination

### Travel System
- **Travel Panel**: right side of screen, lists all 10 worlds with color-coded names + distances
- Click world name → instant teleport via `PlayerCam.teleportTo()`
- **Click-to-jump**: click any ground surface → raycaster teleport + beam visual effect

### Genesis Engine (84 modules)
| System | Module | Lines |
|--------|--------|-------|
| Lost Worlds | `void-population.js` | 785 |
| Realm ECS | `realm-world.js` | 907 |
| Free-flight camera | `player-cam.js` | 330 |
| Interior renderer | `interior-renderer.js` | 538 |
| Multiverse hub | `multiverse-hub.js` | 453 |
| World editor | `world-editor.js` | 442 |
| Population engine | `population-engine.js` | 423 |
| Agent gateway | `agent-gateway.js` | 411 |
| Scale engine | `scale-engine.js` | 393 |
| Agent citizens | `agent-citizen.js` | 333 |
| Vehicle controller | `vehicle-controller.js` | 322 |
| Interaction system | `interaction-system.js` | 315 |
| Citizen AI | `citizen-ai.js` | 261 |
| Trust ledger | `trust-ledger.js` | 162 |
| Soul forge | `soul-forge-nexus.js` | 242 |
| Vertical stack | `vertical-stack-manager.js` | 302 |
| 10 infrastructure managers | various | 64–135 each |

### GSK Integration
- GSKCityBridge: mood/phase drives atmosphere (sky color, fog, bloom, hemi light)
- GSK thought stream (WebSocket :3002, offline-safe)
- GSK Command Center (pyramid interior: 4 CanvasTexture screens)
- GSKAvatar floating core above pyramid
- WorldSyncEngine + SanctumClient for bidirectional state

---

## What THE BASE Does NOT Have

These were built and REVERTED. They are NOT in the base:

- ❌ **Procedural starfield** (skydome + 3D parallax stars + nebula sprites) — stashed
- ❌ **Orbiting planets / suns / moons** per Lost World — `ad4b355` reverted
- ❌ **Full Bible mechanics** (Agent AI, Weather, Day/Night, Soul Forge, Gacha, Combat, Achievements, GSK Thoughts, World HUD) — `df21517` crashed with runtime error, reverted
- ❌ Planets/suns/moons and Bible mechanics both had problems that killed the boot

---

## The Build Rule

1. **THE BASE IS LOCKED.** Nothing changes in `c964111` unless explicitly ordered.
2. **Everything new must stack ON TOP** without breaking the base.
3. If a feature breaks the boot, it is ejected. The base survives.
4. The starfield I just built stacks cleanly — it is the first valid addition on top of the base.

---

## PLT Score (Base Model)
- **Profit:** The city is alive. 10 worlds, click-to-jump, travel, denizens, quests, portals. GSK drives atmosphere.
- **Love:** It works. It deploys to Pages. It renders perfectly.
- **Tax:** No planets/suns/moons. No Bible mechanics in the void. The starfield is stashed.
- **PLT = Profit + Love - Tax = The city that works.**
