# RTS Engine vs Age of Empires — Architecture Comparison & Gap Plan

## Buyasoul CPL RTS Engine vs AoE II (Definitive Edition) Baseline

### Architecture Overview

| System | AoE II (DE) | Buyasoul CPL | Gap Level |
|--------|-------------|-------------|-----------|
| **Tick Model** | Fixed-step deterministic (200ms sim tick) | Variable dt per frame | HIGH — needs fixed-step for multiplayer |
| **Entity Model** | Flat array of object pools | Map<id, GameEntity> | OK — Map is fine for JS |
| **Pathfinding** | Hierarchical A* + flow fields + formation pathing | A* on grid (binary heap, octile heuristic) | HIGH — no hierarchy, no flow fields |
| **Command Model** | State machine per unit + command queue | Unit.orders[] array + executor tick | GOOD — similar queue approach |
| **Economy** | Resource types + gatherers + drop-off + trade | PLT crystal nodes + harvest loop + passive income | GOOD core, missing trade |
| **Construction** | Builder walks → builds over time | Ghost hologram + instant placement | MEDIUM — no build time animation |
| **Selection** | Box select + Ctrl-group + double-click type | Box select + double-click | MEDIUM — missing Ctrl-groups |
| **Minimap** | Full tactical minimap with click-to-move | Canvas minimap (4 layers) | GOOD |
| **AI** | Macro AI + micro AI + difficulty levels | AI Director + NPC brain + faction AI | MEDIUM — needs macro strategy |
| **Fog of War** | Line-of-sight based 2D grid | 256x256 grid fog (exists but untracked) | HIGH — needs wiring |
| **Combat** | Attack ground, formations, counters, micro | Attack-move, cooldowns, auto-aggro | MEDIUM — missing formations |
| **Projectiles** | Instant damage + visual only | Pooled meshes + actual travel | OK — pooled is good |
| **UI** | Bottom panel: unit info, queue, minimap, resources | HUD overlay + production palette | MEDIUM — needs unified bottom panel |
| **Multiplayer** | Lockstep deterministic | Not implemented | LONG-TERM |

---

## Detailed System Comparison

### 1. Pathfinding
**AoE II:**
- Hierarchical: coarse grid (1024x1024 → 128x128) for long-range, fine grid for local
- Flow fields: compute once per destination, all units follow the field
- Formation pathing: units maintain formation while moving
- Path caching: reused across multiple units going to same area

**Buyasoul:**
- Single-resolution grid A* with binary heap + octile heuristic (improved this session)
- No hierarchy — slow on large maps with many simultaneous requests
- No flow fields — each unit requests individual A*
- No formation pathing — hex ring slots assigned but not smoothed
- No path caching

**Priority fixes:**
1. Add path request throttling (max 10 new paths per frame) — LOW effort
2. Add path caching (reuse recent paths to same destination) — LOW effort
3. Implement flow fields for group movement — MEDIUM effort
4. Add hierarchical pathfinding — HIGH effort

### 2. Command Model
**AoE II:**
- Unit state machine: idle, moving, attacking, gathering, building, garrisoned
- Command queue with shift-queue support
- Rally points from buildings
- Stop command, hold position, guard mode
- Attack-move (move until enemy, then auto-attack)

**Buyasoul:**
- Unit state: idle, moving, harvesting, returning, attacking, waiting, garrisoned
- Order queue via unit.orders[] with executor tick
- Rally points exist (VoidRTSBuildings.rallyPoint)
- No stop/hold/guard commands
- Attack-move partially implemented (auto-aggro for idle units)

**Priority fixes:**
1. Add stop/hold/guard hotkeys (S, H, G) — LOW effort
2. Add shift-queue visual feedback — LOW effort
3. Add attack-move state machine transition — LOW effort

### 3. Economy
**AoE II:**
- 4 resources: Food, Wood, Gold, Stone
- Gatherers walk to resource → carry amount → walk to drop-off → deposit
- Drop-off buildings have capacity limits
- Trade carts between markets
- Farm placement with reseeding

**Buyasoul:**
- PLT resources: Profit, Love, Tax, Aether
- Harvesters walk to crystal → mine → carry → return to town hall → deposit
- Harvester slots per node (maxHarvesters)
- DEPOSIT_REGRAB for continuous farming
- Passive income from buildings
- No trade system, no farms, no wood/stone

**Priority fixes:**
1. Add building-specific costs for construction — MEDIUM effort
2. Add trade routes between markets — MEDIUM effort
3. Add resource type variation (different node types) — LOW effort

### 4. Combat & Targeting
**AoE II:**
- Attack types: melee, ranged, siege
- Unit counters (spearmen > cavalry > archers > infantry)
- Formation affects combat stats
- Micro: kite, focus fire, patrol
- Armor/attack upgrades per age

**Buyasoul:**
- Single attack type per entity (attackDamage, attackRange, cooldown)
- Simple targeting: nearest or lowestHP
- Projectile pooling (added this session)
- No counter system
- No formation combat bonuses
- No armor upgrades (techs added but only HP/armor flat bonuses)

**Priority fixes:**
1. Add counter system (unit type matchups) — MEDIUM effort
2. Add formation combat bonuses — MEDIUM effort
3. Add kiting/micro behaviors — HIGH effort
4. Add armor/attack upgrade scaling — LOW effort

### 5. Building System
**AoE II:**
- Build time with progress bar
- Builder required (walks to site, constructs over time)
- Tech tree prerequisites
- Building HP regenerates when repaired
- Garrison inside buildings for protection

**Buyasoul:**
- Ghost hologram placement (instant)
- No build time
- VoidRTSBuildings: garrison, production queue, tech upgrades
- Building selection panel with UI
- No repair mechanic
- No tech tree prerequisites

**Priority fixes:**
1. Add build time with progress bar — MEDIUM effort
2. Add repair mechanic (workers heal buildings) — LOW effort
3. Add tech tree prerequisites — MEDIUM effort

### 6. AI Director
**AoE II:**
- Macro AI: manages economy, builds army, attacks at intervals
- Micro AI: unit-level decisions during combat
- Difficulty levels: easy (slower), hard (faster + bigger army)
- Scripted strategies per civilization

**Buyasoul:**
- rts-ai-director.js: wave scheduling, faction pacing
- rts-ai-brain.js: two-clock, fog-aware (untracked)
- Starcraft factions: Protoss shields, Zerg creep
- No macro strategy AI
- No difficulty scaling

**Priority fixes:**
1. Add macro AI (economy management, army building) — HIGH effort
2. Add difficulty settings — LOW effort
3. Wire rts-ai-brain.js — needs tracking and integration

### 7. Selection & UI
**AoE II:**
- Click select, box select, Ctrl+number groups, double-click type select
- Bottom panel: unit portrait, stats, queue, commands
- Minimap with click-to-center, drag-to-move

**Buyasoul:**
- Box select + double-click type select
- Economy HUD (top) with throttled updates
- Production palette (right side)
- Minimap (4-layer canvas)
- No Ctrl-groups
- No unified bottom panel

**Priority fixes:**
1. Add Ctrl+number group selection — MEDIUM effort
2. Add unified bottom panel (unit info + commands) — HIGH effort
3. Add minimap click-to-center camera — LOW effort

---

## Prioritized Gap Plan (Top 20)

### CRITICAL (Do Now)
| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | ✅ Wire RTS systems to game loop | DONE | Unlocks everything |
| 2 | Add path request throttling | 2hr | Prevents frame drops |
| 3 | Add stop/hold/guard hotkeys | 2hr | Basic RTS controls |
| 4 | Add Ctrl+number group selection | 4hr | Core RTS UX |
| 5 | Add minimap click-to-center camera | 2hr | Navigation |

### HIGH PRIORITY (Next Sprint)
| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 6 | Add path caching for repeated destinations | 4hr | Performance |
| 7 | Add counter system (unit type matchups) | 8hr | Strategic depth |
| 8 | Add build time with progress bar | 8hr | Game feel |
| 9 | Add repair mechanic | 4hr | Worker utility |
| 10 | Add resource type variation | 4hr | Economy depth |

### MEDIUM PRIORITY
| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 11 | Add flow fields for group movement | 2 days | Scale |
| 12 | Add formation combat bonuses | 1 day | Strategic depth |
| 13 | Add unified bottom panel | 2 days | UI polish |
| 14 | Add tech tree prerequisites | 1 day | Progression |
| 15 | Add trade routes | 2 days | Economy |

### LOWER PRIORITY
| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 16 | Add micro behaviors (kite, focus fire) | 3 days | Advanced play |
| 17 | Add macro AI director | 3 days | Single-player |
| 18 | Add difficulty settings | 4hr | Accessibility |
| 19 | Add hierarchical pathfinding | 1 week | Large maps |
| 20 | Add fog of war wiring | 1 day | Tactical depth |

### LONG-TERM (Multiplayer Era)
- Fixed-step deterministic simulation
- Lockstep networking
- Replay system
- Map editor
