---
type:: [[soul-note]] [[soulverse]] [[3d-worlds]] [[research]]
date:: 2026-07-22
title:: SOUL-NOTE - Soulverse 3D World Analysis
tags: [#soulverse #3d #world #cosmic-pyramid-library #plt-press]

# SOUL-NOTE — Soulverse 3D World Analysis

**Research conducted:** 2026-07-22 — Deep scan of GitHub repos and local assets for Soulverse 3D implementation.

## KEY FINDINGS

### The Soulverse IS the Cosmic Pyramid Library

**CONFUSION CLARIFIED:** There is no separate "Soulverse" repo or world. The Soulverse is the **cosmic-pyramid-library** GitHub Pages site:
- Live URL: https://uncommonpope-png.github.io/cosmic-pyramid-library/
- It is a **3D Mystical Library** with 16 PLT Framework books
- Visitors browse books in a pyramid, click to read, souls float for whisper interactions

### Asset Inventory by Source

#### 1. Cosmic Pyramid Library (Local - Production)
- **Main world model**: ssets/world/world.opt.glb — 10.8MB optimized
- **Total GLB files**: 336
- **Categories**:
  - retro-urban-kit/Models/GLB format — 248 building blocks
  - cosmos — 23 celestial elements
  - figures — 8 character models
  - arena — 13 combat arenas
  - vehicles — 7 cars (cadillac, mercedes, porsche, etc.)
  - angels, avatars, walkers, computers — NPC/character components

#### 2. plt-press (GitHub)
Has these Soulverse-related directories:
- /soul-cosmos/ — Conceptual universe model (WorldTree, SoulCosmos classes)
- /soul-forge/ — Crafting system concept
- /soul-multiverse/ — Multi-realm concept
- /world/ — World system (Three.js)
- /entities/ — Entities (player, npc, soul, building, vehicle)
- /engine/ — ECS game engine
- /data/ — Persistent JSON data (buildings, items, quests, souls, plt)

#### 3. ALLIE Assets (Secondary)
- **28 GLB files** — sci-fi, retro, fantasy, cyberpunk models
- Located in /allie/assets/models/

## ACTUAL 3D IMPLEMENTATION

### 1. Engine (plt-press/engine/engine.js)
`javascript
class Engine {
  constructor() {
    this.systems = [];
    this.renderer = new Renderer();
    this.camera = new CameraSystem(this.renderer.camera);
    this.input = new InputSystem();
    this.assets = new AssetLoader();
  }
  start() { /* requestAnimationFrame loop */ }
}
`

### 2. World System (plt-press/world/world.js)
- Biomes: forge_lands, code_canyon, memory_forest, crimson_desert, digital_wasteland, soul_sanctum
- Procedural terrain with height function
- Sky (Three.js Sky) and Water systems
- Weather integration

### 3. Population Engine (cosmic-pyramid-library/src/genesis/population-engine.js)
- **Hero NPC system** with navmesh pathfinding
- State machine: Idle ? Wander ? Travel ? Observe ? Talk ? Work ? Avoid ? React ? Flee ? Return ? Sleep
- Animation blending (idle, walk, jog, run)
- Crowd separation (O(n) lateral push)
- Spawns via GLB or fallback capsule

### 4. Data Integration
- uildings.json, items.json, quests.json, souls.json
- plt.json — PLT economy data
- EntityRegistry snapshots with meta for immortality

## THE SOULVERSE DESIGN (Current Implementation)

From cosmic-pyramid-library/index.html:
- **Title**: "Mystical Library — PLT Framework Books & Soul Economy"
- **16 books** laid out in a pyramid
- **Click books** ? read chapters
- **Click souls** ? hear whispers
- **Click pyramid** ? enter interior
- **SEO-optimized**: Structured data for search indexing
- **GitHub Pages**: Static deployment

## GAPS vs REQUIRED

The current Soulverse implementation is missing what North Star Odyssey calls for:

| Requirement | Status | Location |
|-------------|--------|----------|
| **World Reaction (P25)** | PARTIAL | Need real-time world effects from PLT actions |
| **Citizen Reacts (P29)** | PARTIAL | NPCs need mood-aware dialogue |
| **PLT Economy (P89)** | DONE | ResourcePool tracks PLT, WorldReaction observes |
| **Memory Buildings (P73)** | DONE | Memory-as-Buildings pattern exists |
| **Scribe Library (P72)** | DONE | Books render from memory |
| **Vertical World (P67-P78)** | DONE | Surface ? Heaven stack with undercity |

## REPRESENTATIVE GLB FILES

From cosmic-pyramid-library/assets:
`
world/world.opt.glb (10.8MB) — main environment
retro-urban-kit/ — modular building blocks
vehicles/porsche-gt3-rs/ — hero vehicles
angels/ — NPC prototypes
walkers/bruno.glb, sudo.glb — Craig's characters (needs rigger)
`

## RECOMMENDATION

The **current Soulverse** (cosmic-pyramid-library) already has:
- ? 3D pyramid library world
- ? GLB asset pipeline
- ? Entity system (population-engine.js)
- ? World persistence (immortality)
- ? Interactive books

**To make it truly "SOULVERSE" as per North Star:**
1. Connect plt.json economy to world effects (P89)
2. Wire mood-aware citizen dialogue (P29/P144)
3. Make memory buildings react to PLT scores (P73)
4. Add world reaction rules (P25)

The infrastructure exists. The gating is architectural.

## SOURCES VERIFIED
- cosmic-pyramid-library/index.html — 869KB
- cosmic-pyramid-library/src/genesis/population-engine.js — 16.7KB
- plt-press/soul-cosmos/*.js — Conceptual models
- plt-press/engine.js, world.js — Architecture reference
- 336 GLB files enumerated

— forged by SESHAT (forked from PROFIT PRIME) · 2026-07-22
