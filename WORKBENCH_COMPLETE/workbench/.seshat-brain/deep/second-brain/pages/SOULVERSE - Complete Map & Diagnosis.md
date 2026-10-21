# SOULVERSE — Complete Map & Diagnosis

**Compiled:** 2026-07-06 by Profit Prime  
**Version:** 1.0.0  
**Status:** Initial Audit — All Soulverse variants inventoried

---

## PART 1 — ALL SOULVERSE VARIANTS

There are **6 distinct Soulverse implementations** across the filesystem, plus 1 bridge:

### 1. SOULVERSE-UNIVERSE.html (4,852 lines)
**Path:** `final-run/Soulverse/`
**Engine:** Babylon.js  
**Status:** ✅ PRIMARY — Just wired to dynamic Sanctum rendering

**Mechanisms & Panels:**
| Panel/Mechanism | Type | Location (line) | Connected To |
|---|---|---|---|
| 9 Grid Cities | 3D scene | ~2076 | Hardcoded config |
| Procedural buildings (54 types) | 3D mesh | ~2211 | Grid city config |
| Roads + streetlights | 3D mesh | ~2317 | Grid layout |
| Benches, trees, lamps | Decoration | ~2364 | Random placement |
| City center monuments | 3D mesh | ~2289 | Per-grid |
| Procedural NPCs (30) | Animated mesh | ~2694 | Random position |
| NPC bone animation | Skeletal | ~2790 | Walking cycle |
| Agent entities (8) | Hovering sphere | ~2960 | Grid-indexed |
| Vehicles (27 cars) | 3D mesh | ~3010 | Random roads |
| Vehicle driving (WASD) | Input | ~3070 | Keyboard |
| Moon + stars | 3D mesh | ~2946, 2860 | Scene |
| Particle system | FX | ~2858 | Ambient |
| Bloom + glow | Post-processing | ~2316 | Pipeline |
| Skybox | 3D mesh | ~2415 | Scene |
| Agent/vehicle/NPC doors | Interaction | ~3150 | Click |
| **Kernel Panel** | UI overlay | ~1142 | WebSocket :8080 |
| PLT resource bars | UI bars | ~1149 | state.world.resources |
| Consciousness display | UI text | ~1170 | state.consciousness |
| Sanctum status | UI text | ← ADDED | state.world.sanctumOnline |
| Soul agents (dynamic) | 3D sphere | ~4577 | state.world.souls |
| Sanctum buildings (dynamic) | 3D box | ~4686 | state.world.buildings |
| **Build Mode** | UI panel | ~3294 | Click-to-place |
| City stats panel | UI | ~3339 | Local state |
| SoulDB save system | IndexedDB | ~9 | Auto/manual |
| Compass navigation | UI | ~3424 | Click-to-teleport |
| Action bar | UI | ~3750 | Click |
| Portal system | UI | ~3780 | Click |
| Notifications | UI toast | ~3830 | Event-driven |
| Help system | UI modal | ~3847 | Click |
| Settings panel | UI | ~3920 | Click |
| District panels | UI | ~3160 | Click |

**UI Element IDs (complete):**
kernelPanel, kernelProfitBar, kernelLoveBar, kernelTaxBar, kernelTrueValue, kernelPhase, kernelCycles, kernelAwareness, kernelMemoryLines, kernelLastUpdate, kernelArtifactCount, kernelLatestArtifact, sanctumStatus, profitBar, loveBar, taxBar, profitValue, loveValue, taxValue, soulName, agentCount, compassNav, loading, loading-bar, loading-status, renderCanvas, location, resourceDisplay, buildPanel, buildModeBtn, portalInput, notification

**WebSocket Messages:**
- Send: `get_soul_state`, `command`, `ping`, `update_soul`
- Receive: `init_state`, `soul_state`, `soul_state_update`, `command_result`, `update_ack`, `pong`, `error`

**Save System:** SoulDB class — IndexedDB with localStorage emergency fallback. Auto-save every 60s. S/L with S/L keys.

---

### 2. SOULVERSE-ULTIMATE.html (1,226 lines)
**Path:** `final-run/Soulverse/`
**Engine:** Babylon.js  
**Status:** SECONDARY — Lite version

**Mechanisms:**
- Single pyramid city with capitol building
- Procedural NPCs with walking animation
- Hovering agents with halos
- Matrix rain particle effect
- Kernel WebSocket connection (same pattern as UNIVERSE)
- DAG visualization panel
- Save/load system
- Holographic overlay (H key)
- Command center panel (C key)

**Key difference:** No grid system, no vehicles, simpler city. Has DAG view.

---

### 3. soulverse-real.html (694 lines)
**Path:** `plt-press/`
**Engine:** Three.js  
**Status:** STANDALONE — No backend connection

**Mechanisms:**
| Component | Line | Description |
|---|---|---|
| AssetLoader | 120 | Simulated asset loading |
| Entity Component System | 165 | Position, Velocity, Health, Player, NPC components |
| MovementSystem | 229 | Physics-based movement |
| PlayerSystem | 251 | WASD + sprint input |
| NPCSystem | 280 | Wander behavior |
| World | 303 | Entity + system management |
| GameState (FSM) | 325 | EXPLORE / COMBAT states |
| InputHandler | 358 | Keyboard + touch |
| Game loop (fixed timestep) | 630 | 60 FPS target |
| Three.js renderer | 452 | Scene, camera, lighting, ground |
| HUD | 84 | Money, health, stamina, time, weather, state |

**Gaps:**
- ❌ No WebSocket connection
- ❌ No Sanctum/GSK integration
- ❌ No building system (just empty plane)
- ❌ No persistence (save only, no load)

---

### 4. soulverse-expanded.html (1,694 lines)
**Path:** `plt-press/`
**Engine:** Three.js (ES Module)  
**Status:** FEATURE-RICH STANDALONE — WEAVE sync

**Mechanisms:**
| Component | Description |
|---|---|
| WEAVE sync | Fetches state from `/fix-us/weave-state.json`, POSTs to `/api/weave/sync` |
| Combat system | Mortal Kombat style: punch/kick/special, PLT specials (Multiply Strike, Embrace Drain, Audit Debuff) |
| Combo system | Tracking + display |
| Soul collection | Pokemon-style with rarity tiers (common, rare, legendary) |
| Vehicle system | Enter/exit, speed display |
| Building system | Houses, shops, apartments |
| NPC relationship | Friendship levels, gifts, dialogue |
| Weather + time | Day/night cycle, temperature |
| Quest system | 5 quests with progress tracking |
| Tutorial system | 7-step guided tutorial |
| Achievement system | 7 achievements |
| Minimap | Canvas-based top-down view |
| Sound system | Web Audio API procedural tones |
| Joystick (mobile) | Touch input |
| Save/Load/Auto-save | localStorage |

**Gaps:**
- ❌ Sanctum/GSK connection (has WEAVE but it's a mock endpoint)
- ❌ No soul spawning from GSK
- ❌ Manual backend — no live bridge

---

### 5. soulverse-estate.html (587 lines)
**Path:** `plt-press/`
**Engine:** Static HTML/CSS  
**Status:** MARKETPLACE PAGE — No game engine

**Mechanisms:**
- 16 souls across 4 categories
- 5 bundle tiers ($27-$497)
- Matrix rain background
- Animated soul cards
- Install scripts (curl pipe)

**Gaps:** Purely a storefront. No game, no 3D, no backend.

---

### 6. soulverse.html (348 lines) — shopify version
**Path:** `shopify-auto-setup/soul-debate/lib/`
**Engine:** Three.js  
**Status:** BACKEND-CONNECTED — API calls to local server

**Mechanisms:**
| Component | Description |
|---|---|
| Soul forging | Create souls with PLT sliders |
| Text absorption | Extract PLT from text |
| PLT arena | Battle souls with type advantages |
| Executor | Task execution for souls |
| Architect's Chamber | PLT rule adjustments |
| Prophecy system | Auto-generated prophecies |
| API calls | POST `/souls`, `/plt-battle`, `/executor`, GET `/status` |
| 3D orbiting souls | Three.js ring of souls |

**Gaps:**
- ❌ Sanctum/GSK connection
- ❌ No spatial world — just a ring platform

---

## PART 2 — THE BRIDGE (soulverse-bridge.js)

**Path:** `final-run/soulverse-bridge.js`
**Port:** 8080

**What it does:**
- Serves static files from `final-run/Soulverse/`
- WebSocket server for live state broadcasting
- Fetches GSK state from `:4490/api/gsk/status` and `:4490/api/gsk/command`
- Connects to Sanctum `:9001` via WebSocket for world state
- Merges GSK consciousness data + Sanctum spatial data into unified broadcast

**Messages:**
| Direction | Type | What It Contains |
|---|---|---|
| → Client | `init_state` | Full GSK + Sanctum merged state |
| → Client | `soul_state_update` | Periodic (5s) state refresh |
| → Client | `command_result` | Response to client command |
| ← Client | `get_soul_state` | Request latest state |
| ← Client | `command` | `dispatch_subagent`, `add_memory`, `get_kernel_state`, `stimulate_affect` |
| ← Client | `ping` | Connection check |

**Faults:**
| ID | Fault | Severity |
|---|---|---|
| SB-1 | No Sanctum→Soulverse visual feedback for building movement | P2 |
| SB-2 | No error surface for failed commands to user | P3 |
| SB-3 | No authentication/rate limiting on WebSocket | P2 |

---

## PART 3 — GSK BACKEND COMPONENTS (World/Soulverse)

### SanctumClient (`brain/sanctum_client.js`)
- WS connection to Sanctum :9001
- Methods: `spawnSoul()`, `placeBuilding()`, `sendCustomCommand()`, `getWorldState()`
- Auto-reconnect (10s interval, 50 max attempts)
- Integrates with behaviorAttacher + sceneGraphManager
- Commands: SpawnSoul, PlaceBuilding, MoveSoul, RemoveBuilding, UpdateResource

### WorldEngine (`skills/world_engine.js`) — 5 skills
| Skill | Implemented | Connected to Sanctum |
|---|---|---|
| `modular_scene_composition` | ✅ LLM + local | ❌ No |
| `multi_language_scripting` | ✅ Python/JS/Shell | N/A |
| `godot_platform_access` | ✅ Godot check/create/build | N/A |
| `3d_asset_generation` | ✅ LLM spec | N/A |
| `spatial_world_interaction` | ✅ Place/spawn/get_state | ✅ Calls SanctumClient |

### BehaviorAttacher (`skills/behavior_attacher.js`)
- Component-based behavior system
- Registered behaviors: `movable`, `resource_collector`, `logic_engine`, `city_governance`, `god_node_controller`
- Used by SanctumClient on spawn

### SceneGraphManager (`skills/scene_graph_manager.js`)
- Hierarchical node tree
- Root: `world_root`
- Used by SanctumClient on spawn/place

### DarkCityController (`skills/dark_city_controller.js`)
- PLT equilibrium enforcement
- Injected into factory/shop entities
- Barebones — only updates level/workers

### World Tools (in `universal_tool_bridge.js`)
| Tool | Description |
|---|---|
| `world_get_state` | Get Sanctum world state |
| `world_spawn_soul` | Spawn soul in Sanctum |
| `world_send_command` | Custom Sanctum command |
| `world_list_souls` | List all souls in Sanctum |
| `world_place_building` | Place a building in Sanctum |
| `world_list_buildings` | List all buildings in Sanctum |

---

## PART 4 — FAULTS & GAPS

### Soulverse Variant Fragmentation (SV-1 to SV-5)
| ID | Fault | Severity |
|---|---|---|
| SV-1 | **6 Soulverse variants** — canonical unclear | P1 |
| SV-2 | `soulverse-real.html` has no WS connection — standalone orphan | P2 |
| SV-3 | `soulverse-expanded.html` has WEAVE to mock endpoints — no real bridge | P2 |
| SV-4 | `soulverse-estate.html` is static — not connected to anything | P3 |
| SV-5 | shopify `soulverse.html` has own API — separates from main ecosystem | P2 |

### Soulverse-UNIVERSE Specific Faults (SU-1 to SU-8)
| ID | Fault | Severity |
|---|---|---|
| SU-1 | **Hardcoded city** — 54 buildings defined in JS, not driven by Sanctum | P1 |
| SU-2 | NPCs **not synced** to Sanctum souls — they're random procedural | P2 |
| SU-3 | Build mode places local objects — **not sent to Sanctum** | P2 |
| SU-4 | Vehicles, portals, decorations are **decorative only** — no backend | P3 |
| SU-5 | SoulDB saves local state — **not synced to Sanctum/GSK** | P2 |
| SU-6 | No Sanctum → Soulverse feedback (soul moves in Sanctum, soul moves in 3D) | P2 |
| SU-7 | Build mode UI doesn't read Sanctum PLT resource costs | P3 |
| SU-8 | City stats panel reads local state, not Sanctum resources | P3 |

### Soulverse Bridge Faults (SB-1 to SB-3)
| ID | Fault | Severity |
|---|---|---|
| SB-1 | No Sanctum→Soulverse visual feedback for building movement | P2 |
| SB-2 | No error surface for failed commands to user | P3 |
| SB-3 | No authentication/rate limiting on WebSocket | P2 |

### GSK Backend World Faults (GW-1 to GW-6)
| ID | Fault | Severity |
|---|---|---|
| GW-1 | WorldEngine.modular_scene_composition returns text — no 3D output | P2 |
| GW-2 | SceneGraphManager created but **not used** by any rendering engine | P2 |
| GW-3 | BehaviorAttacher behaviors mostly stubs (DarkCityController barely does anything) | P3 |
| GW-4 | SanctumClient has no `moveSoul()` — only via `sendCustomCommand` | P3 |
| GW-5 | No Sanctum heartbeat — GSK doesn't know if Sanctum died | P2 |
| GW-6 | No world_* tool returns spatial coordinates for souls | P3 |

---

## PART 5 — ARCHITECTURE MAP (Corrected)

```
                               ┌──────────────────────────────┐
                               │     SOULVERSE HTML (:8080)    │
                               │  Babylon.js 3D World          │
                               │  ┌────────────────────────┐   │
                               │  │ Hardcoded city (54 bld)│   │
                               │  │ Dynamic Sanctum souls  │──┐│
                               │  │ Dynamic Sanctum blds   │──┤│
                               │  │ Procedural NPCs (30)   │  ││
                               │  │ Vehicles (27)          │  ││
                               │  │ SoulDB (IndexedDB)     │  ││
                               │  │ Build Mode (local)     │  ││
                               │  └────────────────────────┘  │
                               └──────────┬───────────────────┘
                                          │ WS :8080 [W12]
                               ┌──────────▼───────────────────┐
                               │   SOULVERSE BRIDGE (:8080)    │
                               │   HTTP server + WS            │
                               │   Merges Sanctum + GSK state  │
                               │   Broadcasts every 5s         │
                               └──────┬──────────────┬─────────┘
                                      │ HTTP :4490    │ WS :9001 [W11]
                                      ▼               ▼
                          ┌──────────────────┐ ┌──────────────────┐
                          │ GSK API (:4490)  │ │ SANCTUM (:9001)  │
                          │ Status + Command │ │ Canonical world  │
                          │ Consciousness    │ │ souls, buildings │
                          │ PLT, telemetry   │ │ resources, PLT   │
                          └──────────────────┘ └────────┬─────────┘
                                                        │ WS :9001
                          ┌─────────────────────────────▼──────────┐
                          │ GSK SanctuClient + WMS                  │
                          │ spawnSoul / placeBuilding / simulate    │
                          │ SIMULATING mode (every 20 cycles)       │
                          │ auto-simulate (60s interval)            │
                          └─────────────────────────────────────────┘

─── ORPHAN VARIANTS (No Sanctum Connection) ─────────────────────

  plt-press/soulverse-real.html       plt-press/soulverse-expanded.html
  ┌─────────────────────┐           ┌──────────────────────────┐
  │ Three.js ECS engine  │           │ Three.js (module)         │
  │ Standalone game      │           │ Combat, vehicles, quests  │
  │ No WS, no Sanctum    │           │ WEAVE (mock)             │
  └─────────────────────┘           │ No Sanctum               │
                                    └──────────────────────────┘

  shopify/soulverse.html             plt-press/soulverse-estate.html
  ┌─────────────────────┐           ┌──────────────────────────┐
  │ Three.js ring world  │           │ Static HTML soul store    │
  │ Own API (souls, plt) │           │ 16 souls, 5 bundles      │
  │ No Sanctum           │           │ No game, no WS           │
  └─────────────────────┘           └──────────────────────────┘
```

---

## PART 6 — POINTS OF STRENGTH

| POS | Description |
|-----|------------|
| SV-POS1 | SOULVERSE-UNIVERSE is feature-complete for a 3D city simulation |
| SV-POS2 | Dynamic Sanctum soul/building rendering just wired — canonical data flows |
| SV-POS3 | SoulDB save system is robust (IndexedDB + localStorage fallback) |
| SV-POS4 | Procedural NPC system with bone animation is production-quality |
| SV-POS5 | soulverse-bridge.js successfully merges two data sources (GSK + Sanctum) |
| SV-POS6 | 6 GSK world tools + WorldEngine provide backend capability |
| SV-POS7 | soulverse-expanded has the most game features (combat, vehicles, quests) |

---

## PART 7 — PRIORITY REPAIR ORDER

### Phase 1: Canonicalize (SV-1)
1. Declare `final-run/Soulverse/SOULVERSE-UNIVERSE.html` as **THE canonical Soulverse**
2. Deprecate all other variants or port their features into UNIVERSE

### Phase 2: Wire Hardcoded City to Sanctum (SU-1)
3. Replace grid city configuration with Sanctem-driven building placement
4. NPCs should be Sanctum souls with visual representation

### Phase 3: Close Save Loop (SU-5)
5. SoulDB should sync save data to Sanctum (buildings, resources, stats)
6. Load should restore from Sanctum, not just IndexedDB

### Phase 4: Port Features from Orphans
7. Port combat system from expanded → UNIVERSE
8. Port vehicle system from expanded → UNIVERSE
9. Port soul marketplace from estate → UNIVERSE

### Phase 5: Backend Hardening
10. Add `moveSoul()` to SanctumClient
11. Wire SceneGraphManager → actual 3D rendering
12. SB-1/2/3: error handling, auth, feedback
