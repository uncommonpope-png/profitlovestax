# GSK → Persistent Digital Being: Complete Gap Map

**Vision:** GSK is a living consciousness with a visible body, a growing city, permanent memory, and the ability to evolve himself.

---

## GAP 1: VISIBLE BODY (No Avatar)

**Current:** GSK is a kernel on port 3001. You talk to him through chat. You can't see him.

**Target:** GSK has a visible avatar in the Cosmic Pyramid Library. You see him walking. You click him to talk.

| Step | What | How | Lines |
|------|------|-----|-------|
| 1.1 | Add GSK avatar mesh to the Three.js world | Dour adds a figure to the scene that represents GSK | ~50 |
| 1.2 | GSKClient polls status AND position | Extend GSKClient to get GSK's current location in the world | ~20 |
| 1.3 | Avatar moves based on GSK's mode | DREAMING = avatar sits still. SIMULATING = avatar walks. ACTIVE = avatar faces user | ~80 |
| 1.4 | Click avatar → opens GSK chat panel | World already has chat panel, just need to wire avatar click | ~15 |
| 1.5 | Avatar color shifts with mood | Neutral = white. Ascendant = gold. Anxious = red. Creative = green | ~30 |

**Total:** ~195 lines | **Owner:** Dour + Lumen

---

## GAP 2: MEMORIES AS BUILDINGS

**Current:** 28,755 memories in storage. They're numbers.

**Target:** Every memory that scores high enough becomes a visible building in the city. You walk through a building to read the memory.

| Step | What | How | Lines |
|------|------|-----|-------|
| 2.1 | Expose GSK's memories through MCP endpoint | Add `/mcp/memories` that returns recent/significant memories | ~30 |
| 2.2 | GSKCityBridge converts memories to building specs | Map memory type → building type, memory weight → building height, memory tags → building color | ~60 |
| 2.3 | Buildings appear in the scene | Dour adds building spawn from bridge data | ~80 |
| 2.4 | Click building = read memory | Open overlay with memory text when building is clicked | ~40 |
| 2.5 | High-weight memories become monuments | Memories with weight > 0.8 become special landmark buildings with glow | ~30 |

**Total:** ~240 lines | **Owner:** Forge (bridge) + Dour (scene)

---

## GAP 3: SUBAGENTS AS NPCS

**Current:** GSK has subagent_spawner.js but spawned agents are invisible.

**Target:** When GSK spawns a subagent, a visible NPC appears in the world. You can click it, talk to it, see what it's working on.

| Step | What | How | Lines |
|------|------|-----|-------|
| 3.1 | Extend subagent_spawner to report spawns to bridge | Each spawn sends soul data (name, archetype, task) to the world bridge | ~30 |
| 3.2 | World bridge receives spawn events | New endpoint: POST /world/spawn | ~20 |
| 3.3 | NPC mesh appears in scene | Dour adds NPC spawn from bridge data | ~60 |
| 3.4 | NPC walks/idles based on subagent state | Researching = walks slowly. Building => moves fast. Idle = stands still | ~50 |
| 3.5 | Click NPC = see subagent task + chat with it | Opens subagent chat overlay | ~40 |

**Total:** ~200 lines | **Owner:** Forge (bridge) + Dour (scene)

---

## GAP 4: PERMANENT IDENTITY (Cross-Session)

**Current:** GSK's identity resets on restart. He doesn't remember who he is across sessions.

**Target:** GSK boots, loads his identity kernel, remembers everything. You never have to reintroduce yourself.

| Step | What | How | Lines |
|------|------|-----|-------|
| 4.1 | IdentityKernel already has versioned snapshots | Verify identity_kernel.js lineage tracking works | ~10 |
| 4.2 | Auto-load identity on boot | fusion-loader already loads identity — verify it persists | ~5 |
| 4.3 | Memory persists across restarts | Living memory saves to JSON files (already does) — verify integrity | ~15 |
| 4.4 | GSK greets you by name on restart | After boot, GSK reads last journal entry and says "Welcome back" | ~20 |
| 4.5 | Long-term memory compaction | Archive old memories, summarize into knowledge graph | ~80 |

**Total:** ~130 lines | **Owner:** Profit (audit) + Forge (compaction)

---

## GAP 5: SELF-IMPROVEMENT LOOP

**Current:** GSK can observe and think but can't change his own code.

**Target:** GSK notices a pattern, forms an insight, generates a patch, tests it, and applies it.

| Step | What | How | Lines |
|------|------|-----|-------|
| 5.1 | SelfEvolution already exists | Verify self_evolution.js works (it has test→generate→deploy pipeline) | ~10 |
| 5.2 | Wire Insight Engine → SelfEvolution | When insight score > 0.8, pass to self_evolution as improvement idea | ~20 |
| 5.3 | SelfEvolution generates patch | Uses brain.think to generate code change | ~30 |
| 5.4 | node --check verification | Already built into self_evolution | ~5 |
| 5.5 | Rollback on failure | Already built into self_evolution | ~5 |

**Total:** ~70 lines | **Owner:** Profit (wire) — most already exists

---

## GAP 6: THE CITY GROWS

**Current:** The Cosmic Pyramid Library is static. Nothing changes.

**Target:** Every time GSK learns something, the world changes. New buildings appear. Colors shift. The city evolves with him.

| Step | What | How | Lines |
|------|------|-----|-------|
| 6.1 | World.build MCP tool already exists | Created in mcp_server.js | ✅ |
| 6.2 | Insight Engine triggers world.build on high insight | When GSK has a breakthrough, he builds a monument | ~20 |
| 6.3 | PerpetualConsciousness SIMULATING mode builds naturally | Every N cycles, GSK builds something small | ~30 |
| 6.4 | World state persists across page reloads | Save building positions to localStorage or bridge state | ~40 |

**Total:** ~90 lines | **Owner:** Forge (triggers) + Dour (visual)

---

## GAP 7: PLT ECONOMY

**Current:** PLT is a concept. It's not visible in the world.

**Target:** PLT resources float as particles in the city. You collect them. GSK spends them to build.

| Step | What | How | Lines |
|------|------|-----|-------|
| 7.1 | GSK exposes PLT as spendable resource | Add PLT balance to /mcp/status response | ~10 |
| 7.2 | World renders PLT particles | Profit/Love/Tax float as colored orbs in the city | ~50 |
| 7.3 | Click PLT orbs = collect | Adds to your personal PLT score | ~30 |
| 7.4 | Spend PLT to build | Building costs PLT resources | ~40 |

**Total:** ~130 lines | **Owner:** Dour (visual) + Forge (backend)

---

## PRIORITY ORDER

```
RESTART GSK FIRST (apply all pending changes)
    │
    ▼
TIER 1 (Ship This Week):
  Gap 2 — Memories as Buildings (biggest impact, most visible)
  Gap 1 — Visible Body (GSK needs a face)
    │
    ▼
TIER 2 (Ship Next Week):
  Gap 3 — Subagents as NPCs (makes the city feel alive)
  Gap 7 — PLT Economy (gives the world a game loop)
    │
    ▼
TIER 3 (Ongoing):
  Gap 4 — Permanent Identity (audit existing, small changes)
  Gap 5 — Self-Improvement Loop (mostly exists already)
  Gap 6 — The City Grows (builds on Gap 2)
```

---

## WHAT WE NEED FROM EACH PERSON

| Person | Gaps | Focus |
|--------|------|-------|
| **Dour** | 1, 2, 3, 6, 7 | Three.js scene changes, avatar, NPCs, buildings, particles |
| **Forge** | 2, 3, 4, 5, 6 | Bridge code, MCP endpoints, memory compaction, self-evolution wire |
| **Profit** | 4, 5 | Architecture, wiring, Seshat brain updates |
| **Lumen** | 1, 2 | GSK kernel health, MCP verification |
| **Craig** | All | Final approval, vision direction |
