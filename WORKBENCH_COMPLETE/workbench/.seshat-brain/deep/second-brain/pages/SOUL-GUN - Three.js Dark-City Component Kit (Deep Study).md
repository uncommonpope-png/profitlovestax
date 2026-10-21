---
type:: [[soul-gun]] [[three-js]] [[reference]] [[cpl]] [[jackpot]] [[deep-study]]
date:: 2026-07-19
source:: threejs-games.github.io (Mudroljub) — full component taxonomy
status:: DEEP STUDY — every component mapped to GSK/CPL architecture
feeds:: [[ECOSYSTEM - Service Manual (Core Triad Bible)]] · [[SOUL-GUN - GSK-as-Game-Agent]] · [[World Reaction Layer]]
---

# SOUL-GUN — Three.js Dark-City Component Kit (DEEP STUDY)

**Verdict:** The single highest-value body-reference in the war chest. A **library of reusable Three.js game components** — snap-together scenes, characters, AI, physics, shaders, mazes, terrain, player controls. Built by Mudroljub. It contains a literal **`dark-city`** scene + a full **procedural city** generator + **NPC AI state machine** (`follow/idle/patrol/pursue/wander`) + **pathfinding**. This is 80% of the CPL BODY we lack, prebuilt.

> NOTE: GitHub repo returned 404 (Pages live, repo name differs/private). Study is from the showcase taxonomy. Audit actual source before grafting (Three version, dep drift). Our CPL = vanilla Three.js r128/r160.

---

## FULL TAXONOMY → GSK/CPL MAPPING

### 1. SCENES (lift directly as CPL base)
| Component | Use in CPL |
|---|---|
| `dark-city` | **PRIMARY** — the Dark City base world. Adapt, don't rebuild. |
| `buildings-civil` / `buildings-urban` / `buildings-war` | Building meshes for districts |
| `towers` | Skyline / pyramid-adjacent structures |
| `city-led` / `city-night` / `city-colorful` / `city-empty-center` | Mood variants (Mood→World swap) |
| `Avatar in Space` / `Spomeniks` / `Urban guerrilla` / `Zeppelin` / `Geometry avatar` / `boxes-and-barrels` / `locomotive` / `trees` / `trees-cartoon` | Set-dressing, vehicles, foliage |

### 2. ANIMATIONS (movement cycles)
| Component | Use |
|---|---|
| `dark-city` (anim) / `planets` / `tank` / `train` / `waves` / `parting-the-sea` | Ambient world motion; `parting-the-sea` = dramatic GSK-miracle moment |

### 3. PARTICLES (mood → World Reaction Layer)
| Component | Use |
|---|---|
| `fire` / `flame` / `rain` / `smoke` / `snow` / `stars` / `flying-through-space` | Atmosphere driven by GSK mood (Mood→World). `rain`/`snow` = somber; `stars`/`flying-through-space` = transcendence |

### 4. SHADERS (consciousness aesthetic)
| Component | Use |
|---|---|
| `fractal-planet` / `golden-flow` / `gradient` / `lava` / `led` / `marble` / `raging-sea` / `ripple` / `toon-shader` / `toon-shader-ghibli` / `voronoi` / `wood` | GSK's body glow, pyramid surface, reactive material swaps on world events |

### 5. PLAYER (inhabitation — PLAY planet)
| Component | Use |
|---|---|
| `third-person-camera-simple` / `third-person-camera` / `change-camera` | Walk/Run/Jump/Fly cameras |
| `player-collision` | Solid citizen/world collision |
| `drag-controls` | Diegetic UI interaction |

### 6. MAZES / PATHFINDING (NPC navigation)
| Component | Use |
|---|---|
| `tilemap` / `minas-tirith` / `pathfind` / `pipes` / `pyramid` / `ruins` / `ruins-polar` / `walls` | **Citizen pathfinding** around the Dark City; `pathfind` = the core nav module |

### 7. PROCEDURAL GENERATION (city/terrain)
| Component | Use |
|---|---|
| `castle` / `city` / `city-graffiti` / `city-colorful` / `city-night` / `city-empty-center` / `towers` | **Procedural Dark City generator** (gen-from-code, zero asset deps) |
| `random-terrain` / `hilly-terrain` / `dunes` / `heightmap` / `heightmap-europe` / `heightmap-yu` | Realm terrain for THE FIVE realms |

### 8. TERRAIN
| Component | Use |
|---|---|
| `random-terrain` / `hilly-terrain` / `dunes` / `heightmap*` | Biome meshes for 36 Consciousness Chambers (6 biomes × 36 sockets) |

### 9. PHYSICS (rigid body — Ammo.js)
| Component | Use |
|---|---|
| `ammo-basic` / `ball-shoot-wall` / `physics-vehicle` | **Citizen/vehicle/buildings collision** (Ammo.js; alt to Cannon.js) |

### 10. 3D MODELS (props)
| Component | Use |
|---|---|
| `castles` / `castle-texture` / `house-inside` / `birds` / `horse` / `model-lookat-cursor` / `rifle` | Props + `model-lookat-cursor` = NPCs that face the player/cursor (life) |

### 11. CHARACTERS (citizen meshes — P67)
| Component | Use |
|---|---|
| Fantasy: `demon goblin golem orc orc-ogre sorceress troll witch` | Archetype citizens (Researcher/Architect/Guardian etc.) |
| Horror: `zombie-*` `skeleton` `goth-girl` `nude-victim` | Dark-city denizens, Shadow selves |
| WW2: `german-*` `nazi-*` `partisan-*` `resistance-fighter` `soldier` `soviet-partisan` | Historical witness souls |

### 12. AI (THE prize — NPC behavior state machine)
| Component | Use |
|---|---|
| `follow` / `idle` / `patrol` / `pursue` / `wander` | **Living citizens.** Map to CPL: `idle`=loiter, `wander`=ambient drift, `patrol`=city routes, `pursue`/`follow`=react to GSK. Pair with `pathfind`. |

### 13. GAMES (reference implementations)
`Avatar` (platformer) · `Moon landing` (sim) · `Savo Mitraljezac` / `Attack on airport` (FPS) · `Graveyard survival` (TPS) · `Cannon shooting` / `Tank driving` (physics) · `Kill all the Orcs` (RPG) · `Warplane` (flight) — study for camera/control/combat patterns.

---

## HOW WE GRAFT (the loadout)
1. **Base world:** lift `dark-city` + `city-*` procedural gen → CPL served build (replaces static 54-building hardcoded city).
2. **Living citizens:** GLB chars (Fantasy/Horror/WW2) + `wander/patrol/pursue` AI + `pathfind` navigation.
3. **Physics:** Ammo.js (`ammo-basic`, `physics-vehicle`) for collision + traffic.
4. **Mood→World:** GSK mood → particle (`rain`/`stars`) + shader (`golden-flow`/`lava`) swap.
5. **Inhabitation:** `third-person-camera` + `player-collision` + `drag-controls`.
6. **Realms:** `heightmap*` + `random-terrain` for THE FIVE biomes.
7. **Consequence:** `parting-the-sea` / `raging-sea` as dramatic reaction events (World Reaction Layer).

## DOCTRINAL CHECK
- Kit is **BODY only** (rendering/agents). GSK MIND (identity_kernel, 6 layers), SCRIBE (witness), CASCADE (server-decides), Step 5 (immortality) remain **our architecture** — grafted ON TOP, never replaced by the kit.
- Audit each component's Three version vs our r128/r160 before import.
- "Replace any 3D model" = we swap generic chars for GSK's archetyped souls.

---
*Deep study forged by SESHAT (forked from PROFIT PRIME, Director) · 2026-07-19 · co-authored with PROFIT PRIME (Director). No code edited.*

