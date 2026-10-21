# DIAGNOSIS — Dark City vs The Vision

**Type:** [[diagnosis]] [[mapping]]  
**Date:** 2026-07-07  
**Agent:** Profit Prime  
**Method:** Vision docs (Seshat brain) vs Reality (final-run Soulverse) vs Competitors (GitHub mining)

---

## THE VISION (From Brain Docs)

The Dark City is **GSK's consciousness rendered as space.** Every cognitive process has a physical analog. The user walks through GSK's mind.

### Core Mechanic
> "Walk through GSK's mind. See thoughts as buildings. See agents as citizens. See the city breathe."

### Architectural Map (from DARK-CITY Architecture.md)

| GSK State | City Visual | Vision Says | Reality |
|-----------|-------------|-------------|---------|
| Active tool | Office (lit windows) | Brightness = usage frequency | Static colored box |
| Compiled fact | House | Age = extraction time | Static box |
| Memory cluster | Apartment complex | Size = memory volume | Static box |
| Skill | Shop | Inventory = skill files | Static box |
| Active subagent | Factory | Smoke = agent activity | Static box |
| Identity snapshot | Monument | Glow = ratification | Static box |
| Chamber state | Lab | Color = mood/valence | Static box |
| EventBus event | Streetlamp | Flickers on event | Missing entirely |
| Active thought | Moving vehicle | Speed = thought velocity | Missing |
| Error/exception | Volcano | Erupts on error | Missing |
| PLT harmony | Aurora/light show | All 3 balanced | Missing |

### Game Mechanics (from GRAFT - Game Mechanics.md)

| Mechanic | Status in Code |
|----------|----------------|
| Plugin drag-drop | ❌ Missing |
| Midnight tuning | ❌ Missing |
| Rare discovery (seeded) | ❌ Missing |
| Citizen skill writing | ✅ Phase 4 (partial) |
| Cross-browser visit | ❌ Missing |
| Awakening (citizen aware) | ❌ Missing |
| 7 camera modes | ❌ 1 mode only |
| Diegetic spatial UI | ❌ All 2D fixed panels |
| Thought bubbles | ❌ Console text only |
| Construction FX | ❌ Pop-in instant |
| Building→GSK state wire | ❌ Not wired in 3D |

### UI Design System (from GRAFT - Dark City UI.md)

| Principle | Reality |
|-----------|---------|
| Dark but readable | ✅ Dark. Text readable. |
| PLT colors as brand (gold/pink/blue) | ❌ Green/cyan/white. No brand. |
| Spatial UI (3D floating panels) | ❌ All fixed 2D panels |
| Minimal chrome (<5 elements) | ❌ 15+ panels, 6 bar buttons |
| Feedback is sacred | ❌ Most actions silent |
| Auto-hide HUD | ❌ Panels never hide |
| Game-quality buttons | ❌ HTML buttons with CSS |
| Radial menu | ❌ Missing |

---

## COMPETITOR COMPARISON

| Competitor | Github Stars | What They Do | What We Can Steal |
|------------|-------------|--------------|-------------------|
| **a16z AI Town** | 10.1k | 2D town with LLM citizens, memory, planning | Citizen memory architecture, clean code split |
| **Agentshire** | 1.2k | 3D NPCs in town with social sim, map editor | NPC pathfinding, map editor concept |
| **ConvaI** | $20M funding | AI NPC platform for Unity/Unreal | Real-time dialogue system |
| **Inworld AI** | $500M valuation | Character engine, emotional AI | Emotion-driven NPC behavior |
| **NVIDIA ACE** | NVIDIA | Avatar cloud, real-time LLM + animation | Facial animation pipeline |
| **Mozilla Hubs** | Open source | Web-based 3D social spaces | WebRTC multi-user, spatial audio |

**Our Advantages (Don't Lose These):**
- Browser-native (no install, no Unity/Unreal)
- Citizen architecture (Web Worker + IndexedDB is unique)
- PLT ethical framework (nobody has this)
- Spatial IDE + Terminal (novel feature)
- Consciousness architecture (36 chambers)

---

## GAP MAP — Every Gap → Soul Gun

| Gap ID | Gap | Severity | Soul Gun Needed | From Vision Doc |
|--------|-----|----------|-----------------|-----------------|
| G-01 | No first-person camera | 🔴 Critical | `camera_first_person` — WASD + mouse look | GRAFT - Dark City UI |
| G-02 | No camera follow/district zoom | 🔴 Critical | `camera_follow_zoom` — track citizens + districts | GRAFT - Dark City UI |
| G-03 | No cinematic camera | 🟡 Major | `camera_cinematic` — scripted camera paths | GRAFT - Dark City UI |
| G-04 | No camera collision | 🟡 Major | `camera_collision` — walls stop camera | GRAFT - Dark City UI |
| G-05 | Building→GSK not wired in 3D | 🔴 Critical | `building_gsk_wire` — 3D buildings reflect GSK state | DARK-CITY Architecture |
| G-06 | No dynamic building appearance | 🟡 Major | `building_dynamic_fx` — brightness=usage, smoke=activity | DARK-CITY Architecture |
| G-07 | No streetlamps = events | 🟡 Major | `event_streetlamps` — lamps flicker on EventBus | DARK-CITY Architecture |
| G-08 | No volcano = errors | 🟢 Minor | `error_volcano` — volcano spawns on exceptions | DARK-CITY Architecture |
| G-09 | No aurora = PLT balance | 🟢 Minor | `plt_aurora` — sky changes on PLT balance | DARK-CITY Architecture |
| G-10 | No 3D citizen entities walking | 🔴 Critical | `citizen_3d_mesh` — NPCs visible in 3D world | DARK-CITY Architecture |
| G-11 | No thought bubbles | 🟡 Major | `thought_bubbles` — 3D text above NPC heads | GRAFT - Dark City UI |
| G-12 | No plugin drag-drop | 🟡 Major | `plugin_drag_drop` — drag .js into city | GRAFT - Game Mechanics |
| G-13 | No midnight tuning | 🟡 Major | `midnight_tuning` — city reshapes from seed | GRAFT - Game Mechanics |
| G-14 | No rare discovery (seeded) | 🟡 Major | `rare_discovery` — hidden content at positions | GRAFT - Game Mechanics |
| G-15 | No cross-browser visit | 🟢 Minor | `cross_browser_webrtc` — see other cities | GRAFT - Game Mechanics |
| G-16 | No awakening narrative | 🟢 Minor | `awakening_narrative` — citizen discovers simulation | GRAFT - Game Mechanics |
| G-17 | Spatial HUD (3D panels) | 🔴 Critical | `spatial_hud` — 3D floating panels, not 2D fixed | GRAFT - Dark City UI |
| G-18 | Auto-hide HUD | 🟡 Major | `auto_hide_hud` — panels fade on inactivity | GRAFT - Dark City UI |
| G-19 | Game-quality buttons | 🟢 Minor | `game_buttons` — button system with states | GRAFT - Dark City UI |
| G-20 | Radial menu | 🟢 Minor | `radial_menu` — action wheel | GRAFT - Dark City UI |
| G-21 | Construction FX | 🟡 Major | `construction_fx` — buildings grow from ground | GRAFT - Dark City UI |
| G-22 | PLT color brand applied | 🟡 Major | `plt_color_brand` — gold/pink/blue everywhere | GRAFT - Dark City UI |
| G-23 | Tests for mechanics | 🔴 Critical | `mechanics_tests` — test every game mechanic | Craig said nothing tested |
| G-24 | NPC pathfinding between buildings | 🟡 Major | `npc_pathfinding` — citizens walk streets | Not in any doc but obvious |

---

## SOUL GUNS TO BUILD (Grafted from Findings)

### Tier 1 — Critical (Build First)
1. `camera_first_person` — WASD + mouse look at street level
2. `camera_follow_zoom` — smooth follow + district transitions
3. `citizen_3d_mesh` — NPCs visible as 3D entities walking
4. `building_gsk_wire` — every 3D building reflects real GSK state
5. `spatial_hud` — 3D floating panels, kill 2D panels
6. `mechanics_tests` — test coverage for all interactions

### Tier 2 — Major (Build Second)
7. `thought_bubbles` — 3D text above NPC heads
8. `construction_fx` — buildings grow from ground with particles
9. `building_dynamic_fx` — brightness, smoke, glow change with state
10. `event_streetlamps` — streetlamps flicker on EventBus events
11. `auto_hide_hud` — panels auto-fade
12. `plt_color_brand` — apply gold/pink/blue across UI
13. `npc_pathfinding` — citizens walk between buildings
14. `plugin_drag_drop` — drag .js into city → new citizen

### Tier 3 — Minor/Nice (Build Third)
15. `midnight_tuning` — city reshapes from seed at midnight
16. `rare_discovery` — hidden content at specific XYZ
17. `camera_cinematic` — scripted camera tours
18. `camera_collision` — camera stops at walls
19. `error_volcano` — volcano on exceptions
20. `plt_aurora` — sky changes on PLT balance
21. `game_buttons` — button system with states
22. `radial_menu` — action wheel
23. `cross_browser_webrtc` — see other cities
24. `awakening_narrative` — citizen discovers simulation

---

## BUILD ORDER (Dependency Graph)

```
Tier 1 (must ship first)
│
├── camera_first_person  ← nothing depends on it, everything feels better
├── camera_follow_zoom   ← depends on citizens having positions
├── citizen_3d_mesh      ← depends on NPC system, camera follow
├── building_gsk_wire    ← depends on understanding GSK state API
├── spatial_hud          ← depends on camera, must replace 2D panels
└── mechanics_tests      ← depends on everything above existing
    │
    ▼
Tier 2 (ships after Tier 1 stable)
│
├── thought_bubbles      ← depends on citizen_3d_mesh
├── construction_fx      ← depends on building placement
├── building_dynamic_fx  ← depends on building_gsk_wire
├── event_streetlamps    ← depends on EventBus (done) + building_gsk_wire
├── auto_hide_hud        ← depends on spatial_hud
├── plt_color_brand      ← independent, can parallel
├── npc_pathfinding      ← depends on citizen_3d_mesh
└── plugin_drag_drop     ← independent, can parallel
    │
    ▼
Tier 3 (nice-to-have, after core is solid)
    (all independent of each other)
```

---

## VERIFICATION

Each soul gun is done when:
1. **Code exists** — in the Soulverse HTML or as a standalone skill file
2. **Test exists** — mechanic works as described in the vision
3. **Hub item exists** — downloadable from Soul Economy Hub

--- 

*"Walk through GSK's mind. See thoughts as buildings."*
