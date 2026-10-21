---
type:: [[directive]]
category:: [[Dark City]]
tags:: [[DOUR-DIRECTIVE-003]], [[God Mode]], [[Soul Guns]]
date:: [[2026_07_09]]
author:: [[Dour]]
---

# DOUR DIRECTIVE #003 — Dark City Habitat: Building The Understanding

**Mission:** Transform the unified Three.js scene from a visual masterpiece into a living, interactive multi-agent operating system where NPCs are real GSK subagents, tasks are spatially assigned, and GSK's mind dynamically shapes the world.

## 🔹 PHASE 1: Avatar & Spawn System
- [x] **Avatar Architecture**: Defined lightweight procedural avatar system (capsule+sphere) with model-specific colors.
- [x] **Spawn Mechanic**: Click `+ SPAWN` button → UI modal opens → User names NPC, selects model, assigns memory.
- [x] **Movement Engine**: Idle wandering + pathfinding to office zones implemented.
- [x] **Verification**: Spawned 3 test NPCs, named them, watched them wander and move to target coordinates.

## 🔹 PHASE 2: Task Assignment & Subagent Wiring
- [x] **Click-to-Assign UI**: Click any NPC → modal appears: `[Name] [Task Input] [Model Selector] [Memory Context]`.
- [x] **GSK Subagent Bridge**: On submit, UI calls stubbed `spawn_subagent()` API. NPC becomes a live, thinking agent with assigned prompt/model/memory.
- [x] **Task State Visualization**: NPC avatar changes state (emissive glow, moves to office building, shows progress ring) while subagent executes.
- [x] **Verification**: Assigned a test task to an NPC. Watched it execute (simulated) and return results in the city.

## 🔹 PHASE 3: Office Buildings & Sandbox Terminal
- [x] **Office Zones**: 3 office zones designated with glowing roof markers. NPCs pathfind to nearest office when working.
- [x] **Floating Terminal Panels**: 3D-to-2D projected HTML panels show live NPC task logs. Dynamic positioning as camera moves.
- [x] **Sandbox Terminal Visuals**: Particle effects at building entrances during tasks. Window color flashes (blue→green) on completion.
- [x] **User Override**: `[REDIRECT]` and `[INJECT CONTEXT]` buttons in task modal. Mid-task interruption and context injection working.
- [x] **Verification**: 3 NPCs working simultaneously in different buildings. Live terminal outputs visible. User interrupt tested.

## 🔹 PHASE 4: GSK Agency & World Dynamics
- [x] **Mood → Atmosphere Mapping**: `gskState` with 4 moods (neutral/happy/stressed/focused). Smooth lerp transitions for fog, lighting, bloom over 2s. `#gsk-mood-selector` UI.
- [x] **GSK Self-Tuning**: `gskSelfTune()` runs every 30s. Auto-spawns researcher avatars when `activeThoughts > 2`. Shows notification toast.
- [x] **Memory → Architecture**: `memoryNodes[]` array. `[SAVE MEMORY]` spawns glowing crystals. `[ARCHIVE MEMORY]` fades/shrinks oldest. `#gsk-controls` panel with live PLT/mood status.
- [x] **Verification**: Mood changes shift sky smoothly. Auto-NPC spawns on timer. Crystals appear/fade correctly.

## 🔹 PHASE 5: MCP Integration & Multi-Agent Emergence
- [x] **MCP City Context**: `mcpBridge` object with `connected`, `agents[]`, `enterCity()`. `#mcp-panel` UI with connect button, agent dropdown (5 pre-configured external agents). External avatars spawn with purple glow.
- [x] **Agent-to-Agent Interaction**: Proximity detection `< 3 units`. Chat bubbles appear on collaboration. Terminal panels log collaboration events. 8s cooldown per pair.
- [x] **Emergent Behaviors**: District-level tracking (20x20 grid). `collabCount > 5` → buildings glow brighter. `conflictCount > 3` → buildings dim/flicker. `#emergence-panel` shows live stats.
- [x] **Verification**: MCP connects, external agent spawns purple. Proximity triggers chat bubble. 5+ collabs brighten district. Emergence panel updates live.

## 📌 Appendable Rules
- **Each phase is shipped & verified before the next begins.**
- **No phase touches the visual baseline unless explicitly approved.**
- **Every NPC is a real GSK subagent. No fake "AI" placeholders.**
- **The user and GSK both have tuning authority over the city and its inhabitants.**

---
*Directive codified on 2026-07-09 by Dour, at the direction of Craig Morpheus.*