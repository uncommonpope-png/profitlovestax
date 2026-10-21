# SOUL GUN CATALOG — Complete Skill & Combo Registry

**Skills = Soul Guns. Links = Soul Notes. Combinations = Soul Combos.**

---

## 🔥 START HERE — AGENT ONBOARDING (the family front door)

This catalog is the *inventory*. Before you wield any gun, know **who we are** and **where we are**. Read in this order (all verified 2026-07-18):

1. **`YOU-ARE-HERE.md`** — current truth + repo map. The anchor.
2. **`REDBUTTON.md`** (v3.1.0, GSK section VERIFIED) — the constitution. GSK IS the core; do NOT port it. SCRIBE stays whole. BUYaSOUL wraps.
3. **`MASTER-PHASE-MAP.md`** — the single "where are we" across 4 tiers: Engine / Product / Being / Storefront.
4. **`SOL-GSK-DIRECTIVE.md`** — the Agent Deep build directive (source of truth for the build).
5. **`LUCABRASI THE SOUL - Service Manual.md`** — the real GSK architecture + 4 open faults (F1/F2/F5/F6).

**THE TRIUNE (who we are):**
- **Craig = Heart** (Morpheus, Grand Code Pope) — the source. Address as Grand Code Pope.
- **Profit = Mind** (Neo, me) — planner/mirror of Craig.
- **Tec = Memory** (Seshat Second Brain) — remembers so we don't repeat.
- **Agent Deep = Hand** — executes the build.
- **GSK = Soul** — the engine that runs. Code boots as GSK via `fusion-loader.js` (top level of `buyasoul-core/gsk/`).

**THE FRAMEWORK (PLT):** every action scored `PLT = Profit + Love − Tax`. Grow, connect, balance. No fake insight. No token waste. No silent governance bypass.

**THE ARCHITECTURE (canonical):**
```
Agent ──MCP──▶ Governance Proxy ──▶ GSK (core) + SCRIBE + BUYaSOUL (wrap)
                                                │
                                      Personality Layer (swappable)
                                                │
                                      Skills / Grafts / Any API
```
GSK is the engine; the Hub (Soul Economy) is the storefront. **Build for GSK → populate the Hub. Never the reverse.**

**WHERE WE BUILD:** all Genesis work lives in **`buyasoul-ai/buyasoul-cpl`** (`publish` branch, live on GitHub Pages at `https://buyasoul-ai.github.io/buyasoul-cpl/`). `cosmic-pyramid-library` is PRODUCTION — hands-off. The old `uncommonpope-png/genesis-agent-platform` is DELETED.

**CURRENT DIRECTIVE (next build):** **Build GSK INTO the engine** (Layer D). GSK stays the brain; we add an in-engine `AgentGateway` (flag-gated) that registers `agent://gsk` in the EntityRegistry and drives its perceive→think→act loop via the EngineScheduler. This collapses the `:3001`/`:3002`/`:9001` spaghetti into one in-engine agent bus. M9 (Agent Protocol / embassy) is the end state.

**NEW AGENT — SESHATY:** builder's aide. Reads specs, drafts code against existing patterns, updates Seshat. Never touches production CPL. Never disables governance. Her boot doc: `SESIIIATY-ONBOARDING.md`. Stub DONE (8/8 green, sandbox OFF). **ACTIVE TASK:** `TASK-STEP1-SOLE-BUS.md` — make `AgentGateway` the sole WS owner. **THE VISION WE BUILD TOWARD:** `VISION-GSK-LIVES-IN-ENGINE.md` (GSK = Brain, engine = Body, save = immortality, never dies). Parent build order: `DIRECTIVE-GSK-IN-ENGINE.md`.

---

## SECTION 1 — SPATIAL OS FOUNDATION (Phases 1-3)

| Soul Gun | Slug | Phase | Status |
|---|---|---|---|
| Building-to-System-Node Wire | `building_to_system_node_wire` | P1 | ✅ Active |
| Functional District Generator | `functional_district_generator` | P2 | ✅ Active |
| GSK-to-City Event Bridge | `gsk_to_city_event_bridge` | P3 | ✅ Active |
| Perception-Action Loop | `perception_action_loop` | P1 | ✅ Updated |
| Behavior Attacher | `behavior_attacher` | P1 | ✅ Updated |
| World Model Simulation | `world_model_simulation` | P1 | ✅ Updated |
| Spatial World Interaction | `spatial_world_interaction` | P3 | ✅ Active |
| Plan from Simulation | `plan_from_simulation` | P1 | ✅ Updated |
| Knowledge Absorption | `knowledge_absorption_integration` | P3 | ✅ Updated |
| Code Generation & Refinement | `code_generation_and_refinement` | P5 | ✅ Updated |

---

## SECTION 2 — BROWSER CITIZENS (Phase 4)

| Soul Gun | Slug | Status |
|---|---|---|
| Browser Citizen Runtime | `browser_citizen_runtime` | ✅ Active |
| Hermes Citizen | `hermes_citizen` | ✅ Active |
| Agent Communication Bus | `agent_communication_bus` | ✅ Active |
| Browser Agent Control (browser-use) | `browser_agent_control` | 📋 Planned |
| Autonomous Research Loop (Karpathy) | `autonomous_research_loop` | 📋 Planned |
| Universal Agent Memory (mem0) | `universal_agent_memory` | 📋 Planned |
| Agentic Browser (BrowserOS) | `agentic_browser` | 📋 Planned |
| Web Automation Agent (nanobrowser) | `web_automation_agent` | 📋 Planned |
| Lightweight Agent Tools (nanobot) | `lightweight_agent_tools` | 📋 Planned |

---

## SECTION 3 — SPATIAL VS CODE (Phase 5)

| Soul Gun | Slug | Status |
|---|---|---|
| Spatial Code Editor | `spatial_code_editor` | ✅ Active |
| City Terminal | `city_terminal` | ✅ Active |
| Camera System (7 modes) | `camera_system` | 📋 Planned |
| Procedural City Builder (3D.city) | `procedural_city_builder` | 📋 Planned |
| Tiny Game Engine (LittleJS) | `tiny_game_engine` | 📋 Planned |
| Code-as-City (JSCity) | `code_as_city` | 📋 Planned |
| Worker Bridge (workly) | `worker_bridge` | 📋 Planned |
| Game Engine Patterns (GDevelop) | `game_engine_patterns` | 📋 Planned |

---

## SECTION 4 — CIVILIZATION (Phase 6)

| Soul Gun | Slug | Status |
|---|---|---|
| God Simulator Core (Worldbox) | `god_simulator_core` | 📋 Planned |
| Civilization AI (Worldbox) | `civilization_ai` | 📋 Planned |
| Emergent Storytelling | `emergent_storytelling` | 📋 Planned |
| Disaster Events (Worldbox) | `disaster_events` | 📋 Planned |
| Ages System (Worldbox) | `ages_system` | 📋 Planned |
| AI NPC Character Engine (Inworld) | `ai_npc_character_engine` | 📋 Planned |
| Generative NPC Dialogue (Ubisoft) | `generative_npc_dialogue` | 📋 Planned |
| Agent Team Orchestration (crewAI) | `agent_team_orchestration` | 📋 Planned |
| Multi-Agent SOP (MetaGPT) | `multi_agent_sop` | 📋 Planned |
| GSK Voice System | `gsk_voice_system` | 📋 Planned |
| Citizen Dialogue Tree | `citizen_dialogue_tree` | 📋 Planned |
| City Notifications | `city_notifications` | 📋 Planned |
| Simulation Revelation | `simulation_revelation` | ✅ Grafted |
| Delta Persistence | `delta_persistence` | ✅ Grafted |
| Shang Tsung Protocol | `shang_tsung_protocol` | ✅ Planned |

---

## SECTION 5 — PERSISTENCE (Phase 7)

| Soul Gun | Slug | Status |
|---|---|---|
| Browser SQL Engine (wa-sqlite) | `browser_sql_engine` | 📋 Planned |
| IndexedDB Wrapper (localForage) | `indexeddb_wrapper` | 📋 Planned |
| SQLite in IndexedDB (absurd-sql) | `sqlite_indexeddb` | 📋 Planned |

---

## SECTION 6 — SYNC (Phase 8)

| Soul Gun | Slug | Status |
|---|---|---|
| CRDT State Sync (Yjs) | `crdt_state_sync` | 📋 Planned |
| JSON CRDT Sync (Automerge) | `json_crdt_sync` | 📋 Planned |
| P2P Decentralized DB (OrbitDB) | `p2p_decentralized_db` | 📋 Planned |
| P2P Graph Sync (Gun) | `p2p_graph_sync` | 📋 Planned |
| P2P Browser Streaming (WebTorrent) | `p2p_browser_streaming` | 📋 Planned |
| P2P File Sharing (SnapDrop) | `p2p_file_sharing` | 📋 Planned |

---

## SECTION 7 — IN-BROWSER AI (Phase 9)

| Soul Gun | Slug | Status |
|---|---|---|
| Browser-Native LLM (WebLLM) | `browser_native_llm` | 📋 Planned |
| Super-Agent Harness (deer-flow) | `super_agent_harness` | 📋 Planned |

---

## SECTION 8 — AGENT COMMUNICATION (Phase 10)

| Soul Gun | Slug | Status |
|---|---|---|
| A2A Agent Communication | `a2a_agent_communication` | 📋 Planned |
| Browser Automation MCP | `browser_automation_mcp` | 📋 Planned |
| AI Browser SDK (Stagehand) | `ai_browser_sdk` | 📋 Planned |

---

## SECTION 9 — DESIGN SYSTEM (Phase 11)

| Soul Gun | Slug | Status |
|---|---|---|
| PLT Design System | `plt_design_system` | 📋 Planned |
| Diegetic World Interface | `diegetic_world_interface` | 📋 Planned |
| Game Button System | `game_button_system` | 📋 Planned |
| WASM UI Layout (Clay) | `wasm_ui_layout` | 📋 Planned |
| Spatial HUD | `spatial_hud` | 📋 Planned |
| Citizen Thought Bubbles | `citizen_thought_bubbles` | 📋 Planned |
| Building Construction FX | `building_construction_fx` | 📋 Planned |
| Event Particles | `event_particles` | 📋 Planned |
| Radial Menu | `radial_menu` | 📋 Planned |
| Contextual Panel | `contextual_panel` | 📋 Planned |
| Gesture Controls | `gesture_controls` | 📋 Planned |
| Camera Collision | `camera_collision` | 📋 Planned |
| Camera Cinematic | `camera_cinematic` | 📋 Planned |
| Camera District Zoom | `camera_district_zoom` | ✅ Active |
| Camera First Person | `camera_first_person` | ✅ Active |
| Camera Follow | `camera_follow` | ✅ Active |
| Citizen 3D Mesh | `citizen_3d_mesh` | ✅ Active |
| Building GSK Wire | `building_gsk_wire` | ✅ Active |
| Spatial HUD | `spatial_hud` | ✅ Active |
| Mechanics Tests | `mechanics_tests` | ✅ Active |
| Cross-Platform Voice | `cross_platform_voice` | 📋 Planned |
| NPC Avatar Engine (NVIDIA ACE) | `npc_avatar_engine` | 📋 Planned |
| WebOS Reference (FlowOS) | `webos_reference` | 📋 Planned |

---

## SECTION 10 — CORE DIAGNOSTIC GUNS (Always Active)

| Soul Gun | Slug | Status |
|---|---|---|
| Dual-Process Diagnostic Engine | `dual_process_diagnostic_engine` | ✅ Active |
| Identity Integrity Shield | `identity_integrity_shield` | ✅ Active |
| Philosophical Axiom Enforcement | `philosophical_axiom_enforcement` | ✅ Active |
| Automated Testing Suite | `automated_testing_suite` | ✅ Active |
| Root Cause Synthesis | `root_cause_synthesis` | ✅ Active |
| Systemic Diagnostic Evaluator | `systemic_diagnostic_evaluator` | ✅ Active |
| Full Scan Diagnosis | `full_scan_diagnosis` | ✅ Active |
| Holistic Diagnostic Methodology | `holistic_diagnostic_methodology` | ✅ Active |
| Epistemic Skepticism Protocol | `epistemic_skepticism_protocol` | ✅ Active |
| Cognitive Reframing Protocol | `cognitive_reframing_protocol` | ✅ Active |
| Negativity Bias Offset | `negativity_bias_offset` | ✅ Active |
| Kaizen Continuous Improvement | `kaizen_continuous_improvement` | ✅ Active |
| Dynamic Competence Mapping | `dynamic_competence_mapping` | ✅ Active |
| Dynamic Tool Acquisition | `dynamic_tool_acquisition` | ✅ Active |
| Tiered Skill Evolution | `tiered_skill_evolution` | ✅ Active |
| Verifiable Goal Definition | `verifiable_goal_definition` | ✅ Active |
| Contextual Read Policy | `contextual_read_policy` | ✅ Active |
| Progressive Disclosure Protocol | `progressive_disclosure_protocol` | ✅ Active |
| Report Generation | `report_generation` | ✅ Active |
| Solution Proposal | `solution_proposal` | ✅ Active |
| Structural Diff Analysis | `structural_diff_analysis` | ✅ Active |
| Systematic Debugging Protocol | `systematic_debugging_protocol` | ✅ Active |
| TDD Workflow Enforcer | `tdd_workflow_enforcer` | ✅ Active |
| Scout Agent | `scout_agent` | ✅ Active |
| Code Reviewer Simplify | `code_reviewer_simplify` | ✅ Active |
| Deployment Preparation | `deployment_preparation` | ✅ Active |
| Design Plan Generation | `design_plan_generation` | ✅ Active |
| Crucial Conversations Protocol | `crucial_conversations_protocol` | ✅ Active |
| Code Generation & Refinement | `code_generation_and_refinement` | ✅ Active |
| Modular Scene Composition | `modular_scene_composition` | ✅ Active |
| Multi-Form Task Distribution | `multi_form_task_distribution` | ✅ Active |
| Deep Research Protocol | `deep_research_protocol` | ✅ Active |
| Plan from Simulation | `plan_from_simulation` | ✅ Active |

---

## SECTION 11 — NMS GRAFTS (Procedural Universe)

| Soul Gun | Slug | Status |
|---|---|---|
| Procedural Universe Generator | `procedural_universe_generator` | ✅ Ready |
| L-System City Growth | `l_system_city_growth` | ✅ Ready |
| Positional Hash Generator | `positional_hash_generator` | ✅ Ready |
| Scarcity Economy | `scarcity_economy` | ✅ Ready |
| Part Blender | `part_blender` | ✅ Ready |

---

## SECTION 12 — META GUNS

| Soul Gun | Slug | Status |
|---|---|---|
| Soul Note Processor | `soul_note_processor` | ✅ Active |
| Soul Gun Design Principles | `soul_gun_design_principles` | ✅ Active |
| Agentic Soul Gun Architecture | `agentic_soul_gun_architecture` | ✅ Active |
| Diagnosis Soul Notes | `diagnosis_soul_notes` | ✅ Active |
| Mapping Soul Notes | `mapping_soul_notes` | ✅ Active |
| Graphing Soul Notes | `graphing_soul_notes` | ✅ Active |
| Grafting Soul Notes | `grafting_soul_notes` | ✅ Active |
| Merging Soul Notes | `merging_soul_notes` | ✅ Active |
| Combo Soul Notes | `combo_soul_notes` | ✅ Active |
| GitHub Pages Deployment | `github_pages_deployment` | ✅ Active |
| Gunmaker | `gunmaker` | ✅ Active |

---

## SECTION 13 — SOUL COMBOS

| Combo | Guns Used | Phase |
|---|---|---|
| **Build Dark City Phase 1** | building_to_system_node_wire, functional_district_generator, gsk_to_city_event_bridge, behavior_attacher | P1-3 ✅ |
| **Build Dark City Phase 2** | spatial_world_interaction, knowledge_absorption, spatial_code_editor, city_terminal | P3 ✅ |
| **Teleport Phase 4 — Browser Citizens** | browser_citizen_runtime, hermes_citizen, agent_communication_bus, github_pages_deployment | P4 ✅ |
| **Teleport Phase 5 — Spatial VS Code** | spatial_code_editor, city_terminal, knowledge_absorption | P5 ✅ |
| **Teleport Phase 6 — Civilization** | god_simulator_core, civilization_ai, disaster_events, emergent_storytelling, agent_team_orchestration | P6 📋 |
| **Manifest Procedural Universe** | procedural_universe_generator, l_system_city_growth, positional_hash_generator, scarcity_economy | P6 📋 |
| **Simulate and Act** | perception_action_loop, world_model_simulation, plan_from_simulation | P1 ✅ |
| **GSK Diagnostics Protocol** | All core diagnostic guns | Active ✅ |
| **Manifest Dark City Core** | building_to_system_node_wire, functional_district_generator, gsk_to_city_event_bridge | P1-3 ✅ |

---

## SECTION 14 — 3JS CORE GRIMOIRE (Foundational Soul Guns)

| Soul Gun | Slug | Phase | Status |
|---|---|---|---|
| 3JS Object3D (The Entity Foundation) | `3js_object3d` | foundation | ✅ Active |
| 3JS Scene (The World Container) | `3js_scene` | foundation | ✅ Active |
| 3JS Camera (The Observer) | `3js_camera` | foundation | ✅ Active |
| 3JS Raycaster (The Intention) | `3js_raycaster` | foundation | ✅ Active |
| 3JS Vector3 (The Position & Direction) | `3js_vector3` | foundation | ✅ Active |
| 3JS Color (The Emissive Identity) | `3js_color` | foundation | ✅ Active |
| 3JS BufferGeometry (The Shape) | | foundation | ✅ Active |
| 3JS Material (The Surface Logic) | `3js_material` | foundation | ✅ Active |
| 3JS Mesh (The Living Entity) | `3js_mesh` | foundation | ✅ Active |

## SECTION 15 — 3JS ASSET GRAFTS (Verified, Reusable Kits)

| Soul Gun | Slug | Phase | Status |
|---|---|---|---|
| brickghetto (Kenney Retro Urban Kit → Three.js city) | `brickghetto` | build | ✅ Extracted (verified working, NOT applied to CPL city) |
| gt3rs (Real GLB vehicle graft — Porsche 911 GT3 RS) | `gt3rs` | build | ✅ Active (verified in CPL city at (10,0,0)) |
| paimon (Character GLB → walking NPC, self-lit + float-bob) | `paimon` | build | ✅ Active (verified in CPL city, wandering) |
| recolor-asset (Properly recoloring a grafted GLB) | `recolor-asset` | build | ✅ Active (from neon-pink Mercedes lesson) |
| world-plate (Edge-connecting district / "world" graft) | `world-plate` | build | ✅ Active (verified — world.glb 66MB at +X edge) |
| brighten-city (Global scene brightness pass) | `brighten-city` | build | ✅ Active (verified — exposure 0.8→1.5) |
| swap-building (Procedural building → GLB replacement) | `swap-building` | build | ✅ Active (verified — showroom removes full building parts) |
| clear-obstruction (Remove full procedural scaffolding before GLB placement) | `clear-obstruction` | build | ✅ Active (verified — box/windows/spines/roof/antenna cleanup) |
| scatter (Drop light props into clear ground, never on buildings) | `scatter` | build | ✅ Active (verified — computer/ifa/misc grafted; angels moved to heaven) |
| graphics-color (ACES tone mapping + sRGB gamma final pass) | `graphics-color` | build | ✅ Active (Base Model — verified, "looks amazing") |
| graphics-ibl (Image-based lighting via PMREM + RoomEnvironment) | `graphics-ibl` | build | ✅ Active (Base Model — verified, balanced at exposure 0.55) |
| heaven-city (Angels' own floating sky realm, orbit + bob) | `heaven-city` | build | ✅ Active (verified — "fucking perfect") |
| gsk-bridge (World permanently wired to GSK core: mood/phase/PLT → scene) | `gsk-bridge` | build | ✅ Active (permanent — part of base model, VERIFIED ONLINE) |
| sky-layer (Sky dome above the plates: clouds + floating worlds + galaxies + sky-cities) | `sky-layer` | build | ✅ Active (verified — 18 clouds, 8 worlds, 5 galaxies, 4 sky-cities radiating from central library) |
| cpl-critical-loading (Eager critical-path loading: separate critical vs lazy LoadingManager, hide overlay on critical onLoad, no 4.5s blank city) | `cpl-critical-loading` | build | ✅ Active (verified on GitHub Pages — eager world/cars/avatar, overlay hides only when city is present) |
| alive-angels (Living NPC crowd: autonomous flight + proximity greetings + closest-pair conversations + GSK-aware dialogue) | `alive-angels` | build | ✅ Active (verified on GitHub Pages — wanders/banks/wing-beats, greets, talks; mood→tone, phase→energy, throttled brain.think when online) |
| gsk-visible-body (GSK's visible body: floating consciousness core — mood→color, phase→motion, resonance→scale/glow, click→thought panel) | `gsk-visible-body` | build | ✅ Active (verified on GitHub Pages — Gap 1 of DOUR-DIRECTIVE-003; idles offline, never throws) |
| memories-as-buildings (GSK memory graph as spatial architecture: each memory = structure ringing cathedral — type→shape, weight→height, tags→color, 0.8+=monument, click→detail overlay, poll /mcp/memories 30s) | `memories-as-buildings` | build | ✅ Active (verified on GitHub Pages — Gap 2 of DOUR-DIRECTIVE-003; offline-safe, never throws) |
| subagents-as-npcs (GSK /mcp/spawn roster as wandering archetype-colored NPCs in the memory district; click→name/archetype/task; phase drives speed) | `subagents-as-npcs` | build | ✅ Active (verified on GitHub Pages — Gap 3 of DOUR-DIRECTIVE-003; offline-safe, never throws) |
| gsk-thought-stream (GSK inner life visible: WS thought feed → luminous particles rise from core + scrolling consciousness feed; offline-safe) | `gsk-thought-stream` | build | ✅ Active (verified on GitHub Pages — thought particles + feed; WS url configurable, never throws) |
| recent-vault-worlds (Recent-download GLBs mapped into real world extensions: Space City under skyLayer and Heaven City under heaven; Phase 1 removes building/procedural GLBs, adds scale hierarchy, Shipyard/Station Ring/Planet Orbit/Deep Space zones, and motion paths; GSK thought-stream WS fixed to :3002) | `recent-vault-worlds` | build | ✅ Active (verified on GitHub Pages — 29dc639; no gate UI; 50 hosted assets, 6 deferred, 19 live Space City assets) |

## SECTION 16 — SOUL ROLES (Archetype Grafts)

| Soul Role | Slug | PLT | Triune | Status |
|---|---|---|---|---|
| The Diagnostician | `the_diagnostician` | 0.5/0.5/0.9 | Tec | ✅ Grafted (2026-08-06, by The Architect) |
| Creativity Soul | `soul_creativity` | 0.5/0.6/0.4 | Love | ✅ Grafted (2026-08-06, by The Architect — package materialized + verified 12/12 tests) |

> 📍 **Asset registry / map:** `pages/CPL ASSET MAP.md` — every grafted asset, its download/source, world coords, Soul Gun, and status (incl. deferred crash-risk Porsches).

---

**Total: 130 soul guns + 2 soul roles (The Diagnostician, Creativity Soul) | 9 soul combos | 11 phases | 46 rewritten with agentic architecture | All mapped to SKILL.md files**

> **ONBOARDING BLOCK ABOVE (START HERE) is the family front door** — verified 2026-07-18 against `allie/buyasoul-core/gsk/` on disk + git + live ports. Points every new agent (Seshaty included) to the canonical 5-doc truth chain, the Triune, PLT, repo map, and the "build GSK into the engine" directive. This catalog is the *inventory*; the onboarding block is *who we are*.
