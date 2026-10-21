---
type:: [[soul-note]] [[north-star]] [[3d-worlds]] [[research]]
date:: 2026-07-22
title:: SOUL-NOTE - 3D World Asset Study
tags: [#3d #worlds #assets #study #north-star]

# SOUL-NOTE — 3D World Asset Study

**Research conducted:** 2026-07-22 — Scanning GitHub repos and local assets for 3D world architecture patterns.

## SCAN RESULTS

### GitHub Repo Scans

#### 1. PLT Press (plt-press)
Source: https://github.com/uncommonpope-png/plt-press

**Key 3D World Files:**
- /world/world.js — Master world controller (3.6KB)
  - Biomes: forge_lands, code_canyon, memory_forest, crimson_desert, digital_wasteland, soul_sanctum
  - Height function with procedural terrain formula
  - Sky (Three.js Sky) and Water systems
  
- /engine/engine.js — Core game loop (1.6KB)
  - Three.js-based ECS pattern
  - Systems: Renderer, Camera, Input, AssetLoader
  - Frame-based update loop with delta timing
  
- /entities/ — Entity definitions
  - player.js — Player character
  - 
pc.js — NPCs
  - soul.js — Soul entities
  - uilding.js — Buildable structures
  - ehicle.js — Vehicles
  
- /data/ — Persistent world data
  - uildings.json
  - items.json
  - quests.json
  - souls.json
  - plt.json (PLT economy data)

#### 2. Fix Us (ix-us) 
Source: https://github.com/uncommonpope-png/fix-us

**Key 3D World Assets:**
- living-world.html — Interactive 3D living world
- soulverse-estate.html — 3D estate viewing
- cosmic-pyramid-library/ — Various 3D world configs
- world-persistent.html — Persistent world system
- world/ — World configuration directory

**Soul Cosmos Directory:**
- world-tree.js — Procedural world tree
- cosmic-lineage.js — World lineage tracking
- eternal-now.js — Timeless world state
- primal-fire.js — World activation

### Local Asset Analysis (COSMIC-PYRAMID-LIBRARY)

**Total GLB Assets: 364 files**

#### World Model
- ssets/world/world.opt.glb — **10,879KB (10.8MB)** — Main optimized world

#### By Category:
| Category | Count | Description |
|----------|-------|-------------|
| **world** | 1 | Main world model |
| **retro-urban-kit/ Models/GLB format** | 248 | Building kit blocks |
| **cosmos** | 23 | Procedural world elements |
| **figures** | 8 | Character models (humanoids) |
| **cars** | 3 | Vehicle models |
| **arena** | 13 | Battle/combat arenas |
| **avatars** | 2 | Avatar bodies |
| **angels** | 2 | NPC angel models |
| **walkers** | 3 | Animated character rigs |
| **computers/electronics** | 6 | Console/data objects |
| **cadillac, mercedes, porsche-gt3-rs** | 2 each | Luxury vehicle models |
| **car-showroom** | 2 | Display/showcase models |
| **menagerie** | 4 | Animal/plant models |
| **paimon** | 2 | Character (Genshin style) |
| **celestia** | 7 | Fantasy/celestial elements |
| **ifa** | 2 | Interface elements |
| **misc** | 2 | Various props |
| **recent** | 1 | Recently added |

#### Optimized Assets
- **146 .opt.glb files** — Geometry-optimized variants

### ALLIE ASSETS (Secondary Source)

**Total GLB Assets: 28 files** in /allie/assets/models/

Categories include: scifi, retro, fantasy, cyberpunk — useful for reference

## PATTERN ANALYSIS

### 1. World Architecture Pattern
`
Engine (ECS) ? Renderer (Three.js) ? Asset Pipeline ? World System
                    ?
              Entities (Player, NPC, Building, Vehicle, Soul)
                    ?
               World Data (JSON) + GLB Models
`

### 2. Asset Organization
- **GLB files**: World geometry, optimized meshes
- **JSON data**: Game state, quests, inventory
- **JS modules**: Systems, entities, controllers

### 3. Key Design Patterns Found
- **Procedural Terrain**: Height function with sine/cosine waves
- **Biome System**: Color-coded regions with fog levels
- **Entity-Component System**: Modular entity definitions
- **Asset Streaming**: LOD-based loading strategy

## GAP IDENTIFIED

The **Soulverse world** (the live library world) uses GLB models but lacks:
1. **Dynamic citizen/authority behavior** — NPCs don't react to world state
2. **Memory-to-building mapping** — Memories not visualized as architecture
3. **PLT-driven world effects** — Economy scores don't affect world
4. **World persistence** — Changes don't persist across sessions

These are exactly the gaps addressed by **P25-P38 (World Reaction)** and **P89-P94 (PLT Economy)** in the North Star Odyssey.

## RECOMMENDATION

The 3D world architecture from PLT Press provides a solid foundation for the **World Reaction Layer**:
- Use world.js pattern for biome-based world response
- Implement entity FSM from entities/ for citizen behavior
- Graft 	rust-dialogue.js into NPC line systems
- Apply plt-ledger.js to drive weather/mood changes

The world.opt.glb 10.8MB model is ready for optimization study.

## SOURCES
- plt-press/world/world.js — SCRIBED
- cosmic-pyramid-library/index.html — SCRIBED  
- Local asset enumeration — VERIFIED
- 3D asset count verification — 364 GLB files located

— forged by SESHAT (forked from PROFIT PRIME) under research · 2026-07-22
