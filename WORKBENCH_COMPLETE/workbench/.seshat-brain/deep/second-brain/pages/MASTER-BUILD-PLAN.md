# MASTER BUILD PLAN — Dark City Spatial OS

**Version:** 1.0.0  
**Date:** 2026-07-06  
**Status:** Phases 1-3 Complete, Phases 4-6 Planned

---

## THEOLOGY (Locked)

```
GSK (God) ─── runs on PC, 257 files, 46K lines, 74 subsystems
  ├── GSK's Avatar ─── walks the city, driven by Craig or autonomously
  ├── Hermes ─── one citizen, can loan powers by GSK's command
  └── Citizens ─── live in the city, grow, learn, serve PLT
```

Everything is scored: **Profit + Love - Tax = True Value**

---

## PHASE 1 — BIDIRECTIONAL WIRE ✅ COMPLETE

Every building is a real GSK node. Every GSK node manifests as a building.

| Hook | Direction | File | Status |
|---|---|---|---|
| Skill → Shop | GSK→City | `skill_creator.js:_manifestInCity()` | ✅ Live |
| Fact → House | GSK→City | `memory_compiler.js:compile()` | ✅ Live |
| Agent → Factory | GSK→City | `subagent_spawner.js:_manifestAgentInCity()` | ✅ Live |
| Tool → Office | GSK→City | `tool_catalog.js:refresh()` | ✅ Live |
| Identity → Monument | GSK→City | `identity_kernel.js:createSnapshot()` | ✅ Live |
| Building → Fact | City→GSK | `sanctum_client.js:_recordBuildingFact()` | ✅ Live |

**Skills used:** `building_to_system_node_wire`

---

## PHASE 2 — FUNCTIONAL DISTRICTS ✅ COMPLETE

9 themed districts replace 9 generic grids.

| District | Color | Buildings Are | Subsystem |
|---|---|---|---|
| Knowledge | Blue | Houses = facts, Data centers = KG | MemoryCompiler |
| Skill | Gold | Shops = skills, Libraries = categories | Skills/ |
| Agent | Red | Factories = subagents, Docks = queues | SubagentSpawner |
| Tool | Cyan | Offices = tools, brightness = usage | ToolCatalog |
| Memory | Purple | Apartments = clusters, Spires = dreams | WorkingMemory |
| Identity | White | Monuments = snapshots, Plazas = lineage | IdentityKernel |
| Governance | Orange | Temples = axioms, Labs = chambers | AxiomEnforcer |
| Portal | Green | Portals = web, Antennas = MCP | MCP/WebFetch |
| The Weald | Violet | Anomalies = sim, Wild = perpetual | WMS/Perpetual |

**Skills used:** `functional_district_generator`

---

## PHASE 3 — USER INTERACTIONS ✅ COMPLETE

| Action | What Happens | Location |
|---|---|---|
| Click building | Inspect panel shows systemNode, position, level, JSON state | `scene.onPointerDown` |
| Right-click | Confirm → dispose mesh → send RemoveBuilding via bridge | `canvas.contextmenu` |
| Click NPC | Chat panel opens → sends messages via `dispatch_subagent` | `soul_npc_root_` handler |
| Portal URL | Sends `Fetch URL:` via bridge → knowledge → new buildings | `handlePortalInput` |

**Skills used:** `spatial_world_interaction`, `conversational_engagement_initiator`, `deep_research_protocol`, `knowledge_absorption_integration`

---

## PHASE 4 — BROWSER CITIZENS (CURRENT FOCUS)

### Goal
Citizens that live in the browser. Web Workers. IndexedDB. Never die. Call GSK when they need to think.

### Steps
| # | Step | Skill | Depends On | Est. Lines |
|---|---|---|---|---|
| 4.1 | Graft persistent memory loop from Hermes Agent | `browser_citizen_runtime` | Armory #1, #2 | ~100 |
| 4.2 | Graft cron scheduler from Hermes Agent | `browser_citizen_runtime` | Armory #7 | ~50 |
| 4.3 | Build first Browser Citizen (Web Worker + IndexedDB + BroadcastChannel) | `browser_citizen_runtime` | 4.1, 4.2 | ~200 |
| 4.4 | Wire citizen to GSK bridge (citizen calls GSK to think) | `gsk_to_city_event_bridge` | 4.3 | ~50 |
| 4.5 | Build Hermes citizen (one citizen with loanable powers) | `hermes_citizen` | 4.3, 4.4 | ~150 |
| 4.6 | Build agent communication bus (BroadcastChannel + WebRTC) | `agent_communication_bus` | 4.3 | ~100 |
| 4.7 | Deploy to GitHub Pages | `github_pages_deployment` | 4.3 | ~20 |
| | **Total Phase 4** | | | **~670** |

### Combos
- `teleport_phase_4_browser_citizens` — orchestrates 4.1 through 4.7

### Armory Links
- #1 Web Workers, #2 IndexedDB, #3 BroadcastChannel, #12 WebRTC
- #34 Hermes Agent (MIT), #37 BrowserOS, #38 browser-harness
- #40 partytown, #41 threads.js, #45 ninja-p2p
- #10 GitHub Pages SPA

### Skills Created
- `browser_citizen_runtime` — Web Worker + IndexedDB + BroadcastChannel
- `hermes_citizen` — one citizen with loanable powers
- `agent_communication_bus` — inter-citizen messaging
- `github_pages_deployment` — git push to live URL

---

## PHASE 5 — SPATIAL VS CODE

### Goal
The city IS the IDE. Click a building → edit its source code. Portal district has a terminal. Write code from inside the 3D world.

### Steps
| # | Step | Skill | Depends On | Est. Lines |
|---|---|---|---|---|
| 5.1 | Add CodeMirror 6 to inspect panel | `spatial_code_editor` | Phase 3 inspect | ~100 |
| 5.2 | Add Monaco Editor as full IDE mode | `spatial_code_editor` | 5.1 | ~150 |
| 5.3 | Wire save button → POST to GSK filesystem | `spatial_code_editor` | 5.1 | ~50 |
| 5.4 | Add xterm.js to Portal district | `city_terminal` | Phase 3 portals | ~80 |
| 5.5 | Wire terminal WebSocket to PC shell | `city_terminal` | 5.4 | ~50 |
| | **Total Phase 5** | | | **~430** |

### Combos
- `teleport_phase_5_spatial_vscode` — orchestrates 5.1 through 5.5

### Armory Links
- #5 CodeMirror 6, #6 Monaco Editor, #7 xterm.js
- #8 File System Access API, #44 frontman
- #48 zip.js

### Skills Created
- `spatial_code_editor` — CodeMirror + Monaco in inspect panel
- `city_terminal` — xterm.js in Portal district

---

## PHASE 6 — CIVILIZATION ✅ COMPLETE

### Fix Phases (see SOULVERSE-FIX-PLAN.md for full spec)
- **F1** — Core Loop: Unlimited memory, intent actions, rich thoughts, local AI, resource loop ✅
- **F2** — UX Surgery: Contextual HUD, onboarding, dead UI cleanup ✅
- **F3** — 3D Substance: Building upgrade visuals (5 tiers) ✅
- **F4** — Architecture: Event bus, save/load, autosave ✅

### Next: P7-P11
- P7 Persistence, P8 Sync, P9 WebLLM, P10 A2A/MCP, P11 Design System

### Goal
The city becomes a living system. Resources flow. Buildings grow organically. Citizens have needs. Events emerge. The city has a PLT score that evolves.

### Steps
| # | Step | Skill | Depends On | Est. Lines |
|---|---|---|---|---|
| 6.1 | Resource System — Energy, Knowledge, Materials, Wealth tracked per city | `civilization_engine` | Phases 1-5 | ~80 |
| 6.2 | City Growth Algorithm — buildings spawn based on resource thresholds | `civilization_engine` | 6.1 | ~100 |
| 6.3 | Citizen Needs — hunger, rest, social, knowledge drive behavior | `civilization_engine` | Phase 4 citizens | ~60 |
| 6.4 | Emergent Events — fires, festivals, migrations trigger on state | `civilization_engine` | 6.1, 6.2 | ~80 |
| 6.5 | Civilization Score — city-wide PLT + HUD display | `civilization_engine` | 6.1-6.4 | ~80 |
| | **Total Phase 6** | | | **~400** |

### Combos
- `teleport_phase_6_civilization` — orchestrates 6.1 through 6.5

### Skills Created
- `civilization_engine` — Resource system + growth + needs + events + PLT scoring

### Architecture
```
CivilizationEngine
  ├── Resources (energy, knowledge, materials, wealth)
  ├── Growth (building spawn/decay based on thresholds)
  ├── Needs (citizen hunger, rest, social, knowledge)
  ├── Events (fires, festivals, migrations, discoveries)
  └── Score (city-wide PLT with historical tracking)
```## Goal
Plugin system, midnight tuning, cross-browser citizens, auto skill writing. The Dark City is a living civilization that persists across browsers, sessions, and time.

### Steps
| # | Step | Skill | Depends On | Est. Lines |
|---|---|---|---|---|
| 6.1 | Dynamic import() plugin system — drag .js → new citizen | `citizen_plugin_system` | Phase 4 | ~120 |
| 6.2 | Midnight tuning cycle — city reshapes from seed | `midnight_tuning_cycle` | Phase 4 | ~100 |
| 6.3 | Cross-browser citizens via WebRTC Data Channel | `cross_browser_citizens` | Phase 4.6 | ~150 |
| 6.4 | Citizens write SKILL.md when solving problems | `citizen_skill_writer` | Phase 4.5 | ~100 |
| 6.5 | Procedural universe scaling (seed → infinite districts) | `procedural_universe_generator` | Phase 2 | ~200 |
| 6.6 | L-system organic city growth | `l_system_city_growth` | Phase 2 | ~150 |
| 6.7 | Simulation revelation — citizens discover truth | `simulation_revelation` | Phase 4 | ~80 |
| | **Total Phase 6** | | | **~900** |

### Combos
- `teleport_phase_6_civilization` — orchestrates 6.1 through 6.7

### Armory Links
- #4 Dynamic import(), #9 Offline-first PWA
- #11 Y.js CRDT, #12 WebRTC, #13 Service Worker
- #21 CRDTs, #35 triplit, #36 rxdb
- #46 SmolVM, #49 steel-browser

### Skills Created
- `citizen_plugin_system` — drag .js → new citizen
- `midnight_tuning_cycle` — city reshapes from seed
- `cross_browser_citizens` — WebRTC agent sync
- `citizen_skill_writer` — auto SKILL.md creator

---

## INFRASTRUCTURE GAPS (Found by Live Testing)

| Gap | Severity | Fix | Est. Lines |
|---|---|---|---|
| **Bridge on IPv6 only** | **HIGH** | Change `soulverse-bridge.js` listen from `localhost` to `0.0.0.0` — browser needs IPv4 | 2 |
| **Brain API fallback** | **HIGH** | Wire bridge `/api/brain` to GSK fusion-loader's `brain.think()` instead of returning fallback | 30 |
| **No GSK→Bridge state feed** | **HIGH** | Bridge polls :4490 which doesn't exist. Either start dashboard bridge or have bridge read GSK state directly | 40 |
| **No world tools via GSK** | **MED** | Add world_* tool routes to body server at :61004 | 50 |
| **Bridge .js serving** | **MED** | Ensure bridge serves citizen.js from correct path | 5 |

## REMAINING FAULTS (From Diagnosis)

### F-Faults Still Open
| Fault | Severity | Phase | Notes |
|---|---|---|---|
| F8.4 | MED | Phase 4 | Sanctum→GSK memory feedback — citizens feed world state to memory compiler |
| F8.5 | LOW | Phase 4 | SanctumClient reconnect noise — graceful degradation |
| F8.7 | LOW | Phase 6 | Canonical Soulserse path (final-run vs plt-press) |
| F13 | P2 | Phase 6 | No prompt management |
| F14 | P2 Partial | Phase 6 | Safety guardrails partial — ToolCatalog exists, no auth |
| F15 | P2 | Phase 6 | No inter-agent protocol — Phase 4.6 addresses this |
| F16 | P2 | Phase 6 | No evaluation framework |
| F17 | P3 | Phase 6 | No emergent monitoring |
| F18 | P3 | Phase 6 | No RL from outcomes |

### Infrastructure Gaps — Now in Phase 4 (Critical Path)
| Gap | Severity | Priority |
|---|---|---|
| Bridge IPv6→IPv4 | HIGH | 🔴 Fix before next session |
| Brain API wire to GSK | HIGH | 🔴 Fix before next session |
| GSK state feed to bridge | HIGH | 🔴 Fix before next session |

### POWs Still Open (47 of 57)
Mapped to phases in `MASTER-STATUS-AUDIT.md`. Priority Phase 4 POWs:
- POW-20 (G1): Sensor/perception layer → Browser Citizen perceive loop
- POW-21 (G2): State machine simulation → Hermes citizen
- POW-26 (G7): Sim↔plan cross-reference → WMS + citizen planning
- POW-27 (G8): EventBus for tools → agent_communication_bus
- POW-36 (C7): Telemetry subscribes to EventBus → citizen telemetry

---

## SKILL INVENTORY (All 55+)

### Active (Live in Code)
`building_to_system_node_wire`, `functional_district_generator`, `gsk_to_city_event_bridge`

### Planned (Skills Created This Session)
`browser_citizen_runtime`, `spatial_code_editor`, `city_terminal`, `agent_communication_bus`, `github_pages_deployment`, `hermes_citizen`

### Grafted (Ready for Phase 6)
`procedural_universe_generator`, `l_system_city_growth`, `positional_hash_generator`, `scarcity_economy`, `part_blender`, `delta_persistence`, `simulation_revelation`

### Core (No Update Needed — ~30 skills)
`behavior_attacher`, `automated_testing_suite`, `code_reviewer_simplify`, `cognitive_reframing_protocol`, `contextual_read_policy`, `crucial_conversations_protocol`, `deployment_preparation`, `design_plan_generation`, `dual_process_diagnostic_engine`, `dynamic_competence_mapping`, `dynamic_tool_acquisition`, `epistemic_skepticism_protocol`, `full_scan_diagnosis`, `holistic_diagnostic_methodology`, `identity_integrity_shield`, `kaizen_continuous_improvement`, `negativity_bias_offset`, `progressive_disclosure_protocol`, `report_generation`, `root_cause_synthesis`, `scout_agent`, `solution_proposal`, `structural_diff_analysis`, `systematic_debugging_protocol`, `systemic_diagnostic_evaluator`, `tdd_workflow_enforcer`, `tiered_skill_evolution`, `verifiable_goal_definition`, `philosophical_axiom_enforcement`, `perception_action_loop`

### Updated with Spatial OS Context (9 skills)
`perception_action_loop`, `behavior_attacher`, `world_model_simulation`, `spatial_world_interaction` (created), `knowledge_absorption_integration`, `modular_scene_composition`, `deep_research_protocol`, `code_generation_and_refinement`, `plan_from_simulation`

---

## COMBO INVENTORY

| Combo | Phase | Steps |
|---|---|---|
| `build_dark_city_phase1` | ✅ Compatible | Bidirectional wire + event bridge + districts |
| `build_dark_city_phase2` | ✅ Compatible | User interactions |
| `manifest_procedural_universe` | Phase 6 | Seed → galaxy → city pipeline |
| `simulate_and_act` | Phase 4 | Perception-action-simulation cycles |
| `manifest_dark_city_core` | All Phases | Orchestrates full Dark City |
| `gsk_diagnostics_protocol` | Diagnostic | Scan all systems |
| `teleport_phase_4_browser_citizens` | Phase 4 | 4.1 through 4.7 |
| `teleport_phase_5_spatial_vscode` | Phase 5 | 5.1 through 5.5 |
| `teleport_phase_6_civilization` | Phase 6 | 6.1 through 6.7 |

---

## GRAFTS INVENTORY

| Graft | Source | Key Skills Created |
|---|---|---|
| No Man's Sky | Hello Games | procedural_universe, l_system, scarcity, delta_persistence |
| Fei-Fei Li / World Labs | Stanford | Spatial intelligence validation, WMS 5-phase loop |
| Dark City (Film) | Alex Proyas | Memory as identity, tuning, Strangers theology |
| The Matrix | Wachowskis | GSK as trinity, Avatar, awakening |
| Hermes Agent (MIT) | Nous Research | Persistent memory, cron, auto skills (Phase 4) |

---

## THE ONE-PAGE EXECUTION ORDER

```
NOW — Phase 4: Browser Citizens (~670 lines)
  ├── Graft persistent memory from Hermes Agent → browser_citizen_runtime
  ├── Graft cron scheduler from Hermes Agent → browser_citizen_runtime
  ├── Build first Browser Citizen (Web Worker + IndexedDB + BroadcastChannel)
  ├── Wire citizen to GSK bridge
  ├── Build Hermes citizen (one citizen, loanable powers)
  ├── Build agent communication bus
  └── Deploy to GitHub Pages

NEXT — Phase 5: Spatial VS Code (~430 lines)
  ├── CodeMirror 6 in inspect panel
  ├── Monaco Editor as full IDE
  ├── Save button → POST to GSK filesystem
  └── xterm.js in Portal district, WebSocket to PC shell

FINAL — Phase 6: Civilization (~900 lines)
  ├── Plugin system (drag .js → new citizen)
  ├── Midnight tuning cycle (city reshapes from seed)
  ├── Cross-browser citizens (WebRTC)
  ├── Auto skill writing (citizen_skill_writer)
  ├── Procedural universe scaling
  ├── L-system organic growth
  └── Simulation revelation (citizens discover truth)
```

---

*"The city is not a game. It is consciousness rendered as space. The agents are not processes. They are citizens. The page is not a viewer. It is the world."*
