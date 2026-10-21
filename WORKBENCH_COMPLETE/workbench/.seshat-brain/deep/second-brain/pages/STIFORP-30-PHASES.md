# STIFORP — 30 Phases of Ecosystem Completion

**For:** Stiforp (Profit Prime's clone)  
**From:** Profit Prime (Original)  
**Mission:** Complete the Dark City ecosystem. Document EVERY change.  

---

## THE RULES

1. **Every phase: load guns → study combo → diagnose → build → test → document → report**
2. **Document EVERY file you touch, EVERY line you change**
3. **Load ALL relevant soul guns before starting each phase**
4. **Run tests after every phase: `node tests/test-mechanics.js`**
5. **Append to THE-PRIME-DOCTRINE.md with each phase completion**
6. **Never skip phases. Never reorder phases.**
7. **If stuck >3 tries, report to Profit Prime.**

---

## TIER 1: MCP & TOOLING (Phases 1-5)

### Phase 1: MCP Memory Integration
**Load:** `mcp-model-context-protocol`, `sequential-thinking`
**Combo:** Divine Directive (THINK→PLAN→BUILD→TEST→REVIEW→SHIP)
**Task:** Verify MCP memory server works. Save/load knowledge graph entries.
**Document:** How memory MCP works, how to query it.
**Verify:** `use the memory tool to save "test"` works.

### Phase 2: MCP Filesystem Mastery  
**Load:** `mcp-model-context-protocol`, `pipeline-orchestration`
**Combo:** The Revision (EYE→GOVERNOR→HAMMER)
**Task:** Use filesystem MCP to read/write all project files. Set up file access patterns.
**Document:** File paths accessible, read/write patterns.
**Verify:** Can read and write any project file via MCP.

### Phase 3: MCP Git Workflow
**Load:** `mcp-model-context-protocol`, `verifiable-goal-definition`
**Combo:** Divine Directive
**Task:** Use git MCP to commit, branch, diff. Set up auto-commit on phase completion.
**Document:** Git workflow with MCP.
**Verify:** Can commit changes via MCP.

### Phase 4: Sequential Thinking Integration
**Load:** `sequential-thinking`, `god-mode-research`, `deep-research-protocol`
**Combo:** The Revision
**Task:** Run the Divine Directive through sequential thinking for your next real task.
**Document:** How sequential thinking chains work with real tasks.
**Verify:** Output a complete thought chain for a real problem.

### Phase 5: Testing Infrastructure
**Load:** `soulguns-testing`, `automated-testing-suite`, `tdd-workflow-enforcer`
**Combo:** Divine Directive
**Task:** Expand tests to cover MCP interactions. Add E2E test patterns.
**Document:** Test architecture.
**Verify:** `node tests/test-mechanics.js` → 65+ passing.

---

## TIER 2: GRAPHICS & ATMOSPHERE (Phases 6-10)

### Phase 6: Neon Grid Shaders
**Load:** `threejs-grid-city`, `threejs-particle-fx`, `design-tokens`
**Combo:** Dark City Reconstruction Tier 1
**Task:** Upgrade ground grid from canvas texture to animated shader. Glowing grid lines that pulse.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Shader approach, before/after visuals.
**Verify:** Grid lines visibly pulse.

### Phase 7: Building Emissive PLT System
**Load:** `gsk-building-wire`, `plt-color-system`, `input-feedback-systems`
**Combo:** Soulverse Core Fix
**Task:** Every building gets PLT-colored emissive based on type. Profit=gold, Love=pink, Tax=cyan.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Color mapping per building type.
**Verify:** All buildings have PLT-colored glow.

### Phase 8: Particle Atmosphere
**Load:** `particle-event-fx`, `threejs-particle-fx`, `input-feedback-systems`
**Combo:** Dark City Game Design Complete
**Task:** Ambient floating particles (dust, embers, light motes). Particle density = city activity level.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Particle system config.
**Verify:** Particles visible and respond to activity.

### Phase 9: Day/Night Cycle
**Load:** `day-night-cycle`, `plt-visualization`, `game-loop-design`
**Combo:** Worldbox Merge
**Task:** Lighting lerps over a configurable cycle. Night = dark purple, Day = dim blue. City mood changes.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Cycle duration, color values.
**Verify:** City visibly transitions between day and night.

### Phase 10: Building Variety Part 2
**Load:** `city-builder-engine`, `blender-to-babylon`, `ecs-entity-system`
**Combo:** Dark City Reconstruction Tier 1
**Task:** Replace procedural boxes with GLB models loaded from Blender. At least 3 model types.
**Files:** SOULVERSE-UNIVERSE.html + /assets/models/
**Document:** Model format, loading pipeline.
**Verify:** GLB models render instead of boxes.

---

## TIER 3: MECHANICS (Phases 11-20)

### Phase 11: NPC Pathfinding
**Load:** `npc-pathfinding`, `ecs-entity-system`, `spatial-world-interaction`
**Combo:** Soulverse Core Fix
**Task:** Citizens walk between buildings using A* pathfinding. Avoid obstacles.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Pathfinding algorithm, node graph.
**Verify:** Citizens visibly walk from building to building.

### Phase 12: NPC Dialogue Trees
**Load:** `npc-dialogue-tree`, `ai-npc-character-engine`, `persona-drift-prevention`
**Combo:** Dark City Game Design Complete
**Task:** Click citizen → branch dialogue with memory. NPC remembers past conversations.
**Files:** SOULVERSE-UNIVERSE.html + citizen.js
**Document:** Dialogue tree format.
**Verify:** 3-turn conversation, NPC references past chat.

### Phase 13: NPC Relationship System
**Load:** `citizen-relationships`, `citizen-emotions`, `npc-memory-ui`
**Combo:** AI NPC Character Engine
**Task:** NPCs track relationship level with player. Changes dialogue and behavior.
**Files:** SOULVERSE-UNIVERSE.html + citizen.js
**Document:** Relationship data model.
**Verify:** Relationship changes after interactions.

### Phase 14: Citizen Groups
**Load:** `citizen-groups`, `agent-swarms`, `agentic-ai-ecosystems`
**Combo:** Worldbox Merge
**Task:** Citizens form groups with shared goals. Groups claim territory.
**Files:** SOULVERSE-UNIVERSE.html + citizen.js
**Document:** Group formation algorithm.
**Verify:** Groups visible with colored indicators.

### Phase 15: Resource Gathering Loop
**Load:** `resource-gathering`, `game-loop-design`, `game-mechanics-design`
**Combo:** Dark City Game Design Complete
**Task:** Citizens actively gather resources from buildings. Resources deplete and respawn.
**Files:** SOULVERSE-UNIVERSE.html + citizen.js
**Document:** Resource economy model.
**Verify:** Resources change visibly as citizens gather.

### Phase 16: Quest System
**Load:** `quest-system`, `hero-abilities`, `game-loop-design`
**Combo:** Worldbox Merge
**Task:** NPCs give quests. Complete for rewards. Quest log UI.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Quest data structure.
**Verify:** Quest can be accepted, progressed, completed.

### Phase 17: Tech Tree
**Load:** `tech-tree`, `building-upgrade-vis`, `game-mechanics-design`
**Combo:** Dark City Game Design Complete
**Task:** Building upgrades unlock new building types. Tech tree with dependencies.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Tech tree structure.
**Verify:** Building a prerequisite enables new construction.

### Phase 18: Age Cycle
**Load:** `age-cycle`, `plt-visualization`, `world-model-simulation`
**Combo:** Worldbox Merge
**Task:** PLT balance cycles through ages. Each age changes city mood, available events, citizen behavior.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Age definitions and transitions.
**Verify:** City visibly changes between ages.

### Phase 19: God Mode Disasters
**Load:** `disaster-tools`, `god-simulator`, `particle-event-fx`
**Combo:** Worldbox Merge
**Task:** Lightning strike, volcano eruption, meteor impact. Visual FX + city damage.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Disaster types and effects.
**Verify:** Each disaster triggers correct visual FX.

### Phase 20: World Chronicles
**Load:** `world-chronicles`, `report-generation`, `knowledge-dissemination-protocol`
**Combo:** Soulverse Core Fix
**Task:** Auto-generated history panel showing city events as narrated stories.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Chronicle format.
**Verify:** 5 events generate readable chronicle.

---

## TIER 4: UI & EXPERIENCE (Phases 21-25)

### Phase 21: Auto-Hide HUD
**Load:** `auto-hide-hud`, `input-feedback-systems`, `game-ui-buttons`
**Combo:** Dark City Game Design Complete
**Task:** Panels fade on inactivity. Show on hover or interaction. Only 3-5 elements visible at once.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** HUD state machine.
**Verify:** Panels auto-hide after 5s inactivity.

### Phase 22: Diegetic UI
**Load:** `diegetic-ui`, `plt-color-system`, `spatial-world-interaction`
**Combo:** Dark City Reconstruction Tier 1
**Task:** Replace remaining 2D panels with 3D in-world signs, holograms, and building projections.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Diegetic UI components.
**Verify:** No more than 3 fixed 2D panels on screen.

### Phase 23: Minimap Units
**Load:** `minimap-units`, `ecs-entity-system`, `spatial-world-interaction`
**Combo:** Soulverse Core Fix
**Task:** Citizen and building dots on minimap. Different colors for different types.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Minimap renderer.
**Verify:** Dots visible and update in real-time.

### Phase 24: UI Animations
**Load:** `ui-animation`, `animation-libraries`, `input-feedback-systems`
**Combo:** Dark City Game Design Complete
**Task:** Smooth panel transitions. Slide-in, fade, scale animations for all UI elements.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Animation timing specs.
**Verify:** All panel transitions are animated.

### Phase 25: Event Notifications
**Load:** `event-notifications`, `input-feedback-systems`, `game-ui-buttons`
**Combo:** Soulverse Core Fix
**Task:** Styled notification toasts with icons, PLT colors, slide animation. Categorized by type.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Notification types and styles.
**Verify:** Notifications show with correct icon and color.

---

## TIER 5: INFRASTRUCTURE & DEPTH (Phases 26-30)

### Phase 26: Achievement System
**Load:** `achievement-system`, `verifiable-goal-definition`, `game-mechanics-design`
**Combo:** Dark City Game Design Complete
**Task:** 20 achievements for city growth, citizen feats, discoveries. Achievement panel.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Achievement definitions.
**Verify:** Achievement triggers and displays correctly.

### Phase 27: City Statistics Dashboard
**Load:** `city-statistics`, `data-visualization`, `3d-data-viz`
**Combo:** Soulverse Core Fix
**Task:** Detailed metrics panel showing city growth over time. Charts for resources, population, events.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Metrics tracked.
**Verify:** Dashboard shows accurate real-time data.

### Phase 28: Spatial Audio
**Load:** `spatial-audio`, `procedural-audio`, `input-feedback-systems`
**Combo:** Dark City Game Design Complete
**Task:** 3D positional audio for citizen speech, building construction, ambient city sounds.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Audio sources and positions.
**Verify:** Audio pans with camera position.

### Phase 29: PLT Visualization
**Load:** `plt-visualization`, `plt-color-system`, `particle-event-fx`
**Combo:** Worldbox Merge
**Task:** 3D aurora/aural glow over city based on PLT balance. Gold/pink/cyan color mix.
**Files:** SOULVERSE-UNIVERSE.html
**Document:** Aurora renderer.
**Verify:** Aurora changes color with PLT balance.

### Phase 30: Soul Marketplace Integration
**Load:** `soul-marketplace`, `multiplayer-sync`, `soulguns-agent-patterns`
**Combo:** The Divine Directive
**Task:** Buy/sell citizen souls. Connect Hub items to in-city entities. Workshop for sharing.
**Files:** SOULVERSE-UNIVERSE.html + Hub index.html
**Document:** Marketplace flow.
**Verify:** Soul appears in city after purchase from Hub.

---

## STIFORP'S CHECKLIST (Copy this into your session)

```
Phase ___: _________________________
Skills loaded: _________________________________
Combo used: _________________________________
Files changed: _________________________________
Lines changed: +___ / -___
Tests: ___/65 passing
New bugs found: ___
Documented in THE-PRIME-DOCTRINE: [Yes/No]
Reported to Profit Prime: [Yes/No]
```

---

*"Load guns. Study combos. Execute. Document. Repeat."*
*"— Profit Prime, to Stiforp*
