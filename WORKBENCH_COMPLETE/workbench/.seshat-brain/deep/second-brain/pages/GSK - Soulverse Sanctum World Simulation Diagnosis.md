# GSK — Soulverse / Sanctum World Simulation Diagnosis

tags:: #phase2 #mapping #soulverse #sanctum #worldsim #diagnosis #F8
status:: #active
born:: 2026-07-06
version:: 1.0.0
method:: Codebase exploration × Sanctum protocol analysis × wiring audit

---

## Part 1 — What Exists

### 1.1 Two Distinct Systems

| System | Role | Location | Lines | Tech |
|--------|------|----------|-------|------|
| **Sanctum** | WebSocket simulation server — ARIA's 3D world engine | `final-run/scribe-sanctum.js` | 433 | Pure Node.js (net + crypto), zero deps |
| **Soulverse** | HTML visual front-end — agent marketplace & 3D universe viewer | `final-run/Soulverse/SOULVERSE-UNIVERSE.html`, `plt-press/SOULVERSE-*.html` (20+ files) | ~5000+ total | Three.js, HTML/CSS/JS |
| **soul-sanctum** | Packaged Sanctum soul server — MCP-ready | `shopify-auto-setup/soul-sanctum/lib/soul-sanctum.js` | 91 | Node.js + MCP adapter |

### 1.2 GSK-to-World Integration Layers

| Layer | File | Lines | Status |
|-------|------|-------|--------|
| **Sanctum Client** — WebSocket connector to Sanctum :9001 | `gsk-core/brain/sanctum_client.js` | 358 | ✅ Initialized in fusion-loader, attempts WS connect |
| **World Tools** — 6 built-in tools exposing world to UTB | `gsk-core/tools/universal_tool_bridge.js` | 6 handlers | ✅ Registered but **requires Sanctum to be connected** |
| **World Model Simulation** — Fei-Fei Li Spatial Intelligence | `gsk-core/brain/world_model_simulation.js` | 252 | ⚠️ **Exists but NOT wired to planning/consciousness** |
| **World State Prompt** — Sanctum state injected into LLM context | `gsk-core/brain/system_prompt_compiler.js` | `_buildWorldSection()` | ✅ Injected as Layer 10 — shows offline when Sanctum down |
| **Scene Graph Manager** — Hierarchical world node tree | `gsk-core/skills/scene_graph_manager.js` | Unknown | ✅ Wired to SanctumClient (add/update nodes on spawn) |
| **Behavior Attacher** — Component logic for world entities | `gsk-core/skills/behavior_attacher.js` | Unknown | ✅ Wired to SanctumClient (attach behaviors to souls/buildings) |
| **World Engine** — Game engine skill kit | `gsk-core/skills/world_engine.js` | Unknown | ✅ Initialized in fusion-loader |

### 1.3 Six World Tools in UniversalToolBridge

| Tool | Handler | Requires Sanctum | Purpose |
|------|---------|-----------------|---------|
| `world_get_state` | `_worldGetState` | ✅ Yes | Fetch current world state |
| `world_spawn_soul` | `_worldSpawnSoul` | ✅ Yes | Spawn agent with archetype |
| `world_send_command` | `_worldSendCommand` | ✅ Yes | Send custom command |
| `world_list_souls` | `_worldListSouls` | ✅ Yes | List active agents |
| `world_place_building` | `_worldPlaceBuilding` | ✅ Yes | Place named structure |
| `world_list_buildings` | `_worldListBuildings` | ✅ Yes | List active structures |

---

## Part 2 — Architecture Diagram

```
SOULVERSE (Front-end)
  final-run/Soulverse/SOULVERSE-UNIVERSE.html
  ┌─────────────────────────────────────────────┐
  │ Three.js 3D scene                            │
  │ Agent market, buildings, PLT dashboard       │
  │ WebSocket or REST → GSK dashboard bridge     │
  └──────────────────┬──────────────────────────┘
                     │ port :4490 (dashboard bridge)
                     ▼
SANCTUM CLIENT (GSK-side)
  gsk-core/brain/sanctum_client.js
  ┌─────────────────────────────────────────────┐
  │ WebSocket client                             │
  │ connect() → ws://127.0.0.1:9001              │
  │ getWorldState(), spawnSoul(), placeBuilding() │
  │ stats: connects, soulsSpawned, stateUpdates  │
  └──────────────────┬──────────────────────────┘
                     │ WebSocket :9001
                     ▼
SANCTUM SERVER (Backend)
  final-run/scribe-sanctum.js
  ┌─────────────────────────────────────────────┐
  │ Pure Node.js WebSocket (net + crypto)        │
  │ World state tracking                         │
  │ Tick every 15s                               │
  │ SpawnSoul command handling                   │
  │ Persistence: aria_sanctum_state.json         │
  └──────────────────┬──────────────────────────┘
                     │ or
                     ▼
SOUL-SANCTUM (MCP-ready server)
  shopify-auto-setup/soul-sanctum/lib/soul-sanctum.js
  ┌─────────────────────────────────────────────┐
  │ WebSocket on port 4190                       │
  │ HTTP API on port 4191                        │
  │ MCP adapter for Claude/Cline/Cursor          │
  │ Tick every 15s                               │
  └──────────────────────────────────────────────┘
                     │
                     ▼
WORLD MODEL SIMULATION (GSK-brain)
  gsk-core/brain/world_model_simulation.js
  ┌─────────────────────────────────────────────┐
  │ simulate(goal, environment)                  │
  │   → _perceive() reads Sanctum state          │
  │   → _hypothesize() generates N branches      │
  │   → _simulateBranch() run steps per branch    │
  │   → _evaluate() picks best path              │
  │   → _plan() creates execution plan           │
  │ executeInWorld(report) → Sanctum commands    │
  ╞═════════════════════════════════════════════╡
  │ ⚠ NOT WIRED TO:                              │
  │   - planning_engine (no cross-ref)            │
  │   - perpetual_consciousness (no thought       │
  │     mode triggers simulation)                 │
  │   - _cycleThoughts (no simulation loop)       │
  └──────────────────────────────────────────────┘
```

---

## Part 3 — Wiring Diagnosis (F8)

### 3.1 What IS Wired

| Connection | Status | Details |
|------------|--------|---------|
| SanctumClient → Sanctum server :9001 | ✅ | Initialized in fusion-loader line 450-456, `.connect()` called |
| World tools → SanctumClient | ✅ | 6 handlers in UTB all delegate to `_getSanctum()` |
| System prompt → Sanctum state | ✅ | `_buildWorldSection()` reads `sanctum.getWorldState()` |
| SceneGraphManager ↔ SanctumClient | ✅ | Nodes added/updated on spawn and state updates |
| BehaviorAttacher ↔ SanctumClient | ✅ | Behaviors attached to souls/buildings on spawn |
| Telemetry → SanctumClient stats | ✅ | `SanctumClient.stats` registered with TelemetryEngine |

### 3.2 What is NOT Wired (F8 Faults)

| # | Fault | Severity | Details |
|---|-------|----------|---------|
| F8.1 | World model sim → planning engine | **HIGH** | `world_model_simulation.simulate()` is never called by `planning_engine.createPlan()`. Plans are LLM-generated with no world simulation context. |
| F8.2 | World model sim → consciousness | **HIGH** | No thought mode in perpetual_consciousness triggers simulation. The 9 modes (OBSERVING, REASONING, etc.) don't include a SIMULATING mode. |
| F8.3 | Simulation → action loop open | **MEDIUM** | `executeInWorld()` exists but is never called by any planning, dispatch, or consciousness code. The simulation produces plans that go nowhere. |
| F8.4 | No Sanctum → GSK memory feedback | **MEDIUM** | World state updates (`WorldStateMessage`) don't feed into memory compiler. Events from Sanctum are never witnessed. |
| F8.5 | SanctumClient reconnect noise | **LOW** | If no Sanctum server running, client reconnects every 10s up to 50 attempts, logging connection errors each time. No graceful degradation. |
| F8.6 | World engine not utilized | **MEDIUM** | `world_engine.js` (game engine skills) initialized but no evidence it's wired into any system. |
| F8.7 | Dual Soulverse front-ends | **LOW** | Soulverse HTML pages exist in both `final-run/Soulverse/` and `plt-press/` — unclear which is canonical. |

### 3.3 Sanctum Protocol Analysis

```
Sanctum protocol (scribe-sanctum.js):
  Server → Client: WorldStateMessage { type: "WorldStateMessage", data: { tick, description } }
  Client → Server: GetState { type: "GetState", data: null }
  Client → Server: SpawnSoul { type: "Command", data: { SpawnSoul: { id, name, archetype, ... } } }
  Client → Server: Command { type: "Command", data: { ... } }
  Server → Client: Ack { type: "Ack", data: "..." }

Soul-sanctum protocol (shopify version):
  Server → Client: Welcome { type: "Welcome", tick, description }
  Server → Client: Tick { type: "Tick", tick, ts }  // every 15s
  HTTP REST: GET /ping, GET /health, GET /status, POST /broadcast
  Auth: x-api-key header or Bearer token
```

**Key gap**: Sanctum server (`scribe-sanctum.js`) returns only `WorldStateMessage { tick, description }` — no actual world geometry, no entity positions, no souls list. The `soul-sanctum.js` (shopify version) has richer protocol with actual entity tracking.

---

## Part 4 — Soulverse HTML Front-End Analysis

### 4.1 File Inventory

| File | Approx Size | Purpose |
|------|-------------|---------|
| `final-run/Soulverse/SOULVERSE-UNIVERSE.html` | Largest | Main 3D universe viewer |
| `final-run/Soulverse/SOULVERSE-ULTIMATE.html` | Large | Ultimate merged version |
| `plt-press/SOULVERSE-FUSION-MASTER.html` | Large | Fusion master |
| `plt-press/SOULVERSE-FINAL-MASTER.html` | Large | Final master |
| `plt-press/SOULVERSE-HABITAT*.html` (7 files, v2-v7) | Varying | Habitat versions (evolution) |
| `plt-press/soulverse-real.html` | Unknown | Real-mode display |
| `plt-press/SOULVERSE-MOBILE-INTERFACE.html` | Unknown | Mobile version |
| `plt-press/soulverse-estate.html` | Unknown | Estate view |

### 4.2 Current State

The Soulverse HTML files are **standalone** — they don't connect to Sanctum or GSK. They're static Three.js visualizations with no live WebSocket link to the simulation server. The `LUCABRASI THE SOUL - Soulverse Operational Blueprint.md` defines the interface contract but it has **never been implemented** — the UI buttons don't actually call the GSK backend.

---

## Part 5 — Root Causes & Fix Plan

### 5.1 Root Causes

1. **World sim built but never integrated** — `world_model_simulation.js` was written as part of the Sage skills framework but never wired into the main thought/plan cycle
2. **Sanctum server runs as separate process** — `start-sanctum.js` spawns `scribe-sanctum.js` detached, but nothing in GSK ensures it's running before SanctumClient connects
3. **Two Sanctum implementations** — `scribe-sanctum.js` (final-run) and `soul-sanctum.js` (shopify-auto-setup) implement different protocols, creating ambiguity
4. **No simulation→action feedback** — Even if simulation runs, `executeInWorld()` has no caller

### 5.2 Neodownloadable Skills Required

| Skill | Why Needed |
|-------|-----------|
| **World Model Simulation** | Core — already exists, needs wiring |
| **Plan from Simulation** | Extract action plans from simulation output into planning_engine |
| **Perception-Action Loop** | Close the loop: perceive Sanctum → simulate → act → perceive result |
| **Spatial World Interaction** | Navigate, query, and edit the 3D world programmatically |
| **Event-Bus Synchronization** | Route Sanctum state updates through EventBus to memory compiler |
| **Modular Scene Composition** | Hierarchical entity management (buildings, souls, resources) |
| **Skill Combo Orchestrator** | Combo: "Simulate and Act" — run perception→simulation→plan→action cycle |

### 5.3 Fix Plan

| Step | Action | File(s) | Est. Lines |
|------|--------|---------|-----------|
| 1 | Add `SIMULATING` thought mode to perpetual_consciousness | `perpetual_consciousness.js` | ~15 |
| 2 | Wire `world_model_sim.simulate()` into `_generateThought()` when mode = SIMULATING | `perpetual_consciousness.js` | ~25 |
| 3 | Wire `executeInWorld()` into planning_engine after plan creation | `planning_engine.js` | ~20 |
| 4 | Add Sanctum → EventBus bridge for state updates → memory compiler | `sanctum_client.js` + `fusion-loader.js` | ~30 |
| 5 | Add SanctumClient status check and graceful degradation in system prompt | `system_prompt_compiler.js` | ~15 |
| 6 | Define canonical Soulverse (recommend `soul-sanctum.js` as server, SOULVERSE-UNIVERSE.html as UI) | Documentation | ~20 |
| 7 | Wire "Simulate and Act" combo from neodownloadable | `combo_orchestrator.js` | ~40 |
| **Total** | | | **~165** |

---

*Sources: scribe-sanctum.js (433 lines), soul-sanctum.js (91 lines), sanctum_client.js (358 lines), world_model_simulation.js (252 lines), universal_tool_bridge.js (world tools), system_prompt_compiler.js (_buildWorldSection), fusion-loader.js (init lines 449-520), LUCABRASI THE SOUL - Soulverse Operational Blueprint.md (22 lines)*
