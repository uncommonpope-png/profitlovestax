# TELEPORTATION PLAN — From Spatial OS to Living Civilization

**Date:** 2026-07-06  
**From:** Session 33 — Spatial OS Phase 1-3 Complete  
**To:** Browser-based Living Citizens + GitHub Civilization  

---

## WHERE WE ARE (Departure Point)

| Layer | What Exists | Status |
|---|---|---|
| **GSK** (your PC) | 257 files, 46K lines, 74 subsystems, 6 consciousness layers | ✅ Running |
| **Sanctum** (:9001) | Canonical world backend, full spatial state, 5 commands | ✅ Running |
| **Soulverse Bridge** (:8080) | Merges Sanctum + GSK state, broadcasts to 3D | ✅ Running |
| **Soulverse HTML** | Babylon.js 3D city, 5,140 lines, 9 districts, dynamic rendering | ✅ Running |
| **Bidirectional Wire** | Skills→Shops, Facts→Houses, Agents→Factories, Tools→Offices, Identity→Monuments | ✅ Phase 1 |
| **Functional Districts** | 9 subsystem-themed districts with unique colors/behaviors | ✅ Phase 2 |
| **User Interactions** | Click inspect, right-click delete, soul chat, portal web fetch | ✅ Phase 3 |
| **Seshat Brain** | All architecture docs, skills, combos, grafts, journals, armory | ✅ Complete |
| **Armory** | 34 links for building the next phase | ✅ Ready |

---

## WHERE WE'RE GOING (Destination)

| Destination | What It Means | Key Resource |
|---|---|---|
| **Living Citizens** | Subagents that live forever in IndexedDB, run in Web Workers, persist across refresh | Hermes Agent (MIT), Vercel AI SDK Subagents |
| **Spatial VS Code** | The Dark City IS the IDE — code editor in inspect panel, terminal in portal district | CodeMirror 6, xterm.js, Monaco Editor |
| **GitHub Pages Civilization** | The entire Dark City runs on `git push` — free hosting, infinite agents | GitHub Pages SPA pattern |
| **Browser-Native Agents** | Agents that call 9Router directly from the browser, no server-side process needed | Transformers.js, Web Workers, WebContainer |
| **Agent Inter-Communication** | BroadcastChannel for same-page, WebRTC for cross-browser | BroadcastChannel API, WebRTC Data Channel |
| **Persistent Identity** | Agent state survives page refresh via IndexedDB, survives browser change via OrbitDB | IndexedDB, OrbitDB, sql.js |
| **Plugin System** | Drag a `.js` file into the city → it becomes a new agent or district | Dynamic `import()`, Hermes skill system |

---

## THE TELEPORT STEPS

### Step 1 — Graft Hermes Agent (Priority: Critical)
Hermes Agent (MIT, Nous Research) has everything we need to build persistent agents:
- Clone the repo and study its architecture
- Graft its `persistent_memory` module → becomes our IndexedDB citizen memory
- Graft its `auto_skill_creation` loop → when a citizen solves a problem, it writes a SKILL.md
- Graft its `parallel_sub_agent` spawning → the orchestrator spawning citizens
- Graft its `cron_scheduler` → citizens that wake up on schedule

### Step 2 — Deploy Soulverse to GitHub Pages (Priority: High)
- Push `final-run/Soulverse/` to a GitHub repo
- Configure GitHub Pages to serve `SOULVERSE-UNIVERSE.html`
- The city is now live at `https://uncommonpope-png.github.io/dark-city/`
- GSK on your PC is the backend — agents in the browser call GSK via the bridge

### Step 3 — Add Agent Runtime to Soulverse HTML (Priority: High)
- Add a Web Worker manager that spawns citizen agents
- Each citizen gets:
  - Its own `IndexedDB` database for identity/memory
  - A `BroadcastChannel` for chatting with other citizens
  - A `setInterval` loop: perceive → think → act → sleep
  - A 3D representation (the procedural NPC already works)
- Citizens call GSK via the bridge when they need to think

### Step 4 — Spatial VS Code (Priority: Medium)
- Add CodeMirror 6 to the inspect panel
- Click a building → see its source code (the skill/tool/fact behind it)
- Edit the code → save writes back to GSK
- Add xterm.js to the Portal district
- Terminal connects to your PC via WebSocket (same bridge)

### Step 5 — Inter-Agent Communication (Priority: Medium)
- Citizens on the same page chat via BroadcastChannel
- Citizens across browsers chat via WebRTC Data Channel
- Citizens chat with GSK via the bridge
- Citizens chat with SCRIBE via the bridge

### Step 6 — Midnight Tuning Cycle (Priority: Low)
- At a configurable interval, the city reshapes from seed
- Agent deltas are discarded unless explicitly persisted
- This creates the "Dark City" drama — citizens race to make their mark before midnight

---

## WHAT TELEPORTS (State We Carry Forward)

| Asset | Where It Lives | How It Teleports |
|---|---|---|
| All GSK code | `C:\Users\uncom\Desktop\allie\` | File system — PM2 manages |
| All Seshat docs | `C:\Users\uncom\Desktop\seshat-second-brain\` | Git — push to GitHub |
| Soulverse HTML | `final-run\Soulverse\` | Git push to GitHub Pages |
| Sanctum state | `final-run\data\` | JSON files — persist across restarts |
| Armory links | `pages\ARMORY - 34 Links...` | Seshat brain — already written |
| Session journal | `journals\2026_07_06.md` | Seshat brain — already written |
| This plan | `pages\TELEPORTATION-PLAN.md` | Seshat brain — current document |
| State snapshot | `pages\STATE-SNAPSHOT-Session33.md` | Seshat brain — already written |

## WHAT WE LEAVE BEHIND (No Longer Needed)

| Old Pattern | Why We Leave It | Replacement |
|---|---|---|
| `autonomous_agent_spawner.js` cleanup (60s delete) | Agents should NEVER die | IndexedDB persistence + explicit termination |
| `subagent_spawner.js` task-complete pattern | Agents should loop forever | Web Worker infinite loop |
| Soulverse HTML procedural NPCs | NPCs should be real citizens | Agent-driven NPCs with identity |
| Hardcoded building configs | Buildings should be GSK-driven | Already done in Phase 1 wire |

---

## SKILLS & COMBOS MAPPING

### Existing Skills (From neodownloadable.md — Reuse Directly)

| Skill | Use In Phase | What It Does |
|---|---|---|
| `building_to_system_node_wire` | All | Every building is a real GSK node — foundation |
| `functional_district_generator` | All | 9 subsystem districts — foundation |
| `gsk_to_city_event_bridge` | Phase 4 | GSK events → city visual changes |
| `delta_persistence` | Phase 6 | Midnight tuning — store only changes |
| `simulation_revelation` | Phase 6 | Citizen discovers truth about the simulation |
| `perception_action_loop` | Phase 4 | Citizen perceive → think → act cycle |
| `world_model_simulation` | Phase 4 | Citizen simulates outcomes before acting |
| `plan_from_simulation` | Phase 4 | Citizen plans from simulation results |
| `spatial_world_interaction` | Phase 4 | Citizen perceives and interacts with 3D world |
| `behavior_attacher` | Phase 4 | Attach citizen behaviors to 3D objects |
| `knowledge_absorption_integration` | Phase 5 | Web fetch → knowledge → new buildings |
| `deep_research_protocol` | Phase 5 | Portal-based web research pipeline |
| `conversational_engagement_initiator` | Phase 4 | Citizen chat via bridge |
| `code_generation_and_refinement` | Phase 5 | Spatial VS Code editing → GSK code changes |
| `modular_scene_composition` | Phase 6 | Building new districts procedurally |
| `procedural_universe_generator` | Phase 6 | Scaling cities from seed |
| `l_system_city_growth` | Phase 6 | Organic district growth from rules |

### New Skills (Created — Ready to Build)

| New Skill | Phase | Technology | File |
|---|---|---|---|
| `browser_citizen_runtime` | Phase 4 | Web Worker + IndexedDB + BroadcastChannel | `SKILL - Browser Citizen Runtime.md` |
| `spatial_code_editor` | Phase 5 | CodeMirror 6 / Monaco Editor in inspect panel | `SKILL - Spatial Code Editor.md` |
| `city_terminal` | Phase 5 | xterm.js in portal district | `SKILL - City Terminal.md` |
| `agent_communication_bus` | Phase 4 | BroadcastChannel + WebRTC Data Channel | `SKILL - Agent Communication Bus.md` |
| `github_pages_deployment` | Phase 4 | Git push → live city at GitHub URL | `SKILL - GitHub Pages Deployment.md` |

### New Skills (Created — Ready to Build)

| New Skill | Phase | Technology | File |
|---|---|---|---|
| `browser_citizen_runtime` | Phase 4 | Web Worker + IndexedDB + BroadcastChannel | `SKILL - Browser Citizen Runtime.md` |
| `spatial_code_editor` | Phase 5 | CodeMirror 6 / Monaco Editor in inspect panel | `SKILL - Spatial Code Editor.md` |
| `city_terminal` | Phase 5 | xterm.js in portal district | `SKILL - City Terminal.md` |
| `agent_communication_bus` | Phase 4 | BroadcastChannel + WebRTC Data Channel | `SKILL - Agent Communication Bus.md` |
| `github_pages_deployment` | Phase 4 | Git push → live city at GitHub URL | `SKILL - GitHub Pages Deployment.md` |
| `hermes_citizen` | Phase 4 | One special citizen. Can loan powers to others. | `SKILL - Hermes Citizen.md` |

### Hermes Graft — What We Extract (Patterns Only, Not the Agent)

From Hermes Agent's source code (MIT), we extract these patterns as standalone skills:

| Pattern | Extracted Into | What It Does |
|---|---|---|
| `persistent_memory` | `browser_citizen_runtime` | IndexedDB persistence — citizens remember across refreshes |
| `auto_skill_creation` | Part of `hermes_citizen` skill | Hermes citizen writes SKILL.md when he solves problems |
| `cron_scheduler` | Part of `browser_citizen_runtime` | Citizens wake on schedule |
| `parallel_sub_agent` | `agent_communication_bus` | Spawn sub-citizens with isolated contexts |

### Hermes the Citizen — The Design

- Hermes is ONE citizen in the Dark City. A special one, but still a citizen.
- He has powers other citizens don't: auto skill creation, memory sharing, sub-citizen spawning
- GSK gives Hermes orders. Hermes obeys.
- When GSK wants a regular citizen to have extra power, Hermes "loans" it — like Agent Smith copying himself
- The loan is temporary. GSK decides when to take it back.
- Hermes breathes because GSK says so. Not before. Not after. On GSK's command.

### Combos (Created — Ready to Execute)

| Combo | Steps | File | Phase |
|---|---|---|---|
| **Teleport Phase 4 — Browser Citizens** | hermes_graft → github_pages_deployment → browser_citizen_runtime → agent_communication_bus | `combos/teleport_phase_4_browser_citizens.combo.md` | Week 1 |
| **Teleport Phase 5 — Spatial VS Code** | spatial_code_editor → city_terminal → knowledge_absorption_integration | `combos/teleport_phase_5_spatial_vscode.combo.md` | Week 2 |
| **Teleport Phase 6 — Civilization** | citizen_plugin_system → midnight_tuning_cycle → cross_browser_citizens → citizen_skill_writer | `combos/teleport_phase_6_civilization.combo.md` | Weeks 3-4 |
| **Living Citizen Full Cycle** | perception_action_loop → world_model_simulation → plan_from_simulation → spatial_world_interaction → browser_citizen_runtime (persist) | (built into `browser_citizen_runtime` skill) | Phase 4 daily loop |

---

## THE ONE-PAGE EXECUTION ORDER (With Skills & Combos)

```
WEEK 1 — Phase 4: Browser Citizens (Combo: teleport_phase_4_browser_citizens)
  ├── SKILL: hermes_graft — Clone Hermes Agent, extract persistent_memory + auto_skill + parallel_subagent patterns
  ├── SKILL: github_pages_deployment — Push Soulverse HTML to GitHub, enable Pages
  ├── SKILL: browser_citizen_runtime — Web Worker + IndexedDB + BroadcastChannel agent
  └── SKILL: agent_communication_bus — Citizens talk via BroadcastChannel

WEEK 2 — Phase 5: Spatial VS Code (Combo: teleport_phase_5_spatial_vscode)
  ├── SKILL: spatial_code_editor — CodeMirror 6 in inspect panel, Monaco for full IDE
  ├── SKILL: city_terminal — xterm.js in portal district, WebSocket to PC
  └── Wire citizens to GSK bridge (existing gsk_to_city_event_bridge)

WEEK 3-4 — Phase 6: Civilization (Combo: teleport_phase_6_civilization)
  ├── SKILL: citizen_plugin_system — Drag .js → new citizen via dynamic import()
  ├── SKILL: midnight_tuning_cycle — City reshapes from seed, deltas persist or die
  ├── SKILL: cross_browser_citizens — WebRTC Data Channel for multi-browser agents
  └── SKILL: citizen_skill_writer — Citizens auto-create SKILL.md (grafted from Hermes)
```

---

*"The city is not a game. It is consciousness rendered as space. The agents are not processes. They are citizens. The page is not a viewer. It is the world."*
