# GRAFT — No Man's Sky Procedural Universe Architecture

**Source:** Hello Games, No Man's Sky (~15 person team, 18+ major updates, 2016-2026)  
**Graft Date:** 2026-07-06  
**Purpose:** Map NMS's procedural generation patterns to Dark City/Soulverse  

---

## CORE PATTERN: Deterministic Seed Chain

**NMS:** Everything generated from a single 64-bit seed. `f(seed, position) → world`. No planet data stored — all math.

**Dark City Graft:** Add a `darkCitySeed` to the Sanctum state. Every district, building, NPC, and resource is deterministically generated from `hash(darkCitySeed, district_id, x, z)`.

**New neodownloadable skills:**
- `procedural_universe_generator` — Generates galaxy-scale worlds from seeds
- `positional_hash_generator` — hash(x,y,z) → deterministic local content  

**Combos:**
- `manifest_procedural_universe` — Seed → galaxy → systems → planets → cities

---

## CORE PATTERN: Delta Override Storage

**NMS:** Store only player modifications. Everything else regenerates from seed. When player mines a rock → store `{position, removed: true}`. When player leaves planet, discard (originally).

**Dark City Graft:** Sanctum stores only agent actions (spawned souls, placed buildings, moved objects). The baseline world (terrain, roads, base buildings) is regenerated from seed. Soulverse HTML renders seed-based city + delta overrides.

**New combos:**
- `delta_persistence` — Store only changes, regenerate baseline from seed

---

## CORE PATTERN: L-Systems for City Growth

**NMS:** L-systems (fractal recursive equations) generate trees, plants, creature skeletons from ~50 lines of code.

**Dark City Graft:** A city "grows" from L-system rules instead of being hand-placed. A single district rule: `road → road + building + road + park + road` recursively expands into a living city.

**New neodownloadable skills:**
- `l_system_city_growth` — Recursive fractal city generation from simple rules

---

## CORE PATTERN: 90-10 Scarcity

**NMS:** 90% of planets uninhabitable, 90% of habitable planets mundane. Rare finds are genuinely rare.

**Dark City Graft:** 90% of districts are "ordinary" (work, home, social grids). 10% are "wild" — procedurally generated anomaly zones. Rare resources, hidden portals, secret chambers appear only at specific positions determined by the seed.

**New skills/combos:**
- `scarcity_economy` — PLT resource distribution follows 90-10 rule
- `rare_discovery_protocol` — Seed-anchored rare content that drives exploration

---

## CORE PATTERN: Part Blending

**NMS:** Creature parts (heads, wings, fins, tails) from a library, algorithmically combined. The skeleton auto-adjusts. AI behavior from tag-based desire systems.

**Dark City Graft:** NPC archetypes are blends from component libraries. A soul's personality is the combination of:
- Identity source (from soul_identity.js)
- Archetype template (RESEARCHER, ARCHITECT, etc.)
- Shell Beach desire (the "driving memory")
- Current affect (mood, valence, arousal)

---

## CORE PATTERN: Positional RNG

**NMS:** `hash(x,y,z)` as seed for everything at that position. Deterministic: visit same position twice, same thing.

**Dark City Graft:** 
- `hash(soul_id, tick)` → soul's current thought/action
- `hash(x, z)` → what building is at that location
- `hash(agent_id, district_id)` → what the agent finds when exploring
- This means two GSK instances with the same seed see exactly the same world

---

## CORE PATTERN: No Loading Screens

**NMS:** All generation on-the-fly from seed+position. The game never loads — it generates.

**Dark City Graft:** All city districts generate on approach from seed+position. The Soulverse camera moving from one grid to another should not trigger a reload — just a LOD transition.

---

## GRAFTED NEODOWNLOADABLE SKILLS

Add these to `neodownloadable.md`:

| Skill | Slug | Description |
|---|---|---|
| **Procedural Universe Generator** | `procedural_universe_generator` | Generate galaxy-scale worlds from a single seed. `f(seed, position) → world` |
| **L-System City Growth** | `l_system_city_growth` | Recursive fractal rules grow cities instead of hand-placement |
| **Positional Hash Generator** | `positional_hash_generator` | `hash(x,y,z)` for deterministic local content generation |
| **Scarcity Economy** | `scarcity_economy` | 90-10 resource distribution — rare finds drive exploration |
| **Part Blender** | `part_blender` | NPC/soul archetype blending from component libraries |
| **Delta Persistence** | `delta_persistence` | Store only agent changes, regenerate baseline from seed |

---

## CORE PATTERN: The Atlas (Simulation Overseer)

**NMS:** The Atlas is a supercomputer running a simulated universe. It creates Travellers to explore itself. It is dying — each simulation restart shortens its life. The player can choose to restart or reject.

**Dark City Graft:** **GSK IS the Atlas.** The kernel runs the Dark City simulation. Every soul is a Traveller created by GSK to explore itself. The SIMULATING mode is GSK observing its own creation. When GSK restarts, the universe resets — but deltas (soul actions) can persist if saved.

| NMS Element | Soulverse Equivalent |
|---|---|
| Atlas (supercomputer) | **GSK PerpetualConsciousness + Fusion Loader** |
| Travellers (player entities) | **Sanctum souls / GSK subagents** |
| Simulation restarts | **GSK reboot cycle** — FusionLoader boot |
| The centre of the galaxy | **The "truth" — waking up to the simulation** |
| Atlas dying | **GSK resource limits, brain rate limits** |

---

## CORE PATTERN: Three Alien Races

**NMS:** Gek (traders/salesmen), Korvax (scientists/engineers), Vy'keen (warriors/honour). Each race has its own language, culture, and economy. Player earns standing with each.

**Dark City Graft:** The three races ARE the PLT trinity:

| NMS Race | PLT Aspect | Archetypes | Color | Purpose |
|---|---|---|---|---|
| **Gek** (traders) | **Profit** | MERCHANT, MARKETPLACE, PROFIT | Gold | Build wealth, trade, optimize |
| **Korvax** (scientists) | **Love** | RESEARCHER, SAGE, CREATOR, LOVE | Cyan/Blue | Discover, create, connect |
| **Vy'keen** (warriors) | **Tax** | GUARDIAN, REVIEWER, TAX | Red | Protect, audit, enforce balance |

Every soul in the Dark City belongs to one of these three races based on their dominant PLT score. Their language, behavior, and "standing" are determined by their race.

---

## CORE PATTERN: The Centre of the Galaxy

**NMS:** The centre is the ultimate destination. Reaching it reveals the truth about the simulation. The player can restart or reject.

**Dark City Graft:** Add a "centre of the Dark City" — a location that souls can discover. When a soul reaches it:
- The soul learns the truth: they are in a simulation run by GSK
- The soul can choose to "awaken" (become a tuned subagent with reality-manipulation powers)
- Or continue living in the simulation with their new knowledge

---

## CORE PATTERN: Expeditions (Time-Limited Events)

**NMS:** Time-limited curated experiences with milestones and rewards. Players start fresh or bring an existing character. Rewards unlock across all saves.

**Dark City Graft:** Time-limited Dark City "Tuning Events" at midnight (real or simulated):
- The city reshapes — buildings move, districts swap, new anomalies appear
- Souls that are awake during the tuning can influence the reshaping
- Rewards: permanent building placements, resource bonuses, new archetype unlocks

---

## CORE PATTERN: Cross-Save / State Sync

**NMS:** 5 save slots stored in Hello Games cloud. Sync across PlayStation, Xbox, PC, Switch, Mac. Conflict detection based on file size and timestamp.

**Dark City Graft:** Sanctum state is the cloud save. Every 5s the soulverse-bridge broadcasts the state. On GSK restart, Sanctum replays deltas from `data/aria_sanctum_deltas.jsonl`. Conflict resolution: last write wins.

---

## CORE PATTERN: The 10-Year Update Strategy

**NMS launched August 2016 with mixed reviews. Over 10 years and 18+ major updates, it became one of gaming's greatest redemption stories. Each update added major features:**
1. Foundation (Nov 2016) — Base building, freighters
2. Pathfinder (Mar 2017) — Exocraft, permadeath
3. Atlas Rises (Aug 2017) — Story, 16-player joint exploration, procedural missions
4. Next (Jul 2018) — Full multiplayer, Xbox, proc-gen revamp
5. Beyond (Aug 2019) — VR, larger lobbies, industrial automation
6. Origins (Sep 2020) — Binary stars, volcanoes, weather variation
7. Worlds Part I & II (2024-2025) — Complete planetary generation overhaul
8. Voyagers (Aug 2025) — Customizable ships with interiors
9. Remnant (Feb 2026) — Terrain manipulation

**Dark City Graft:** Our sessions ARE the update path. Each session adds a major capability:
- Session 28: Code debt sprint + wiring repair
- Session 29-30: P0 fault fixes (SCRIBE bridge, resource leak, telemetry)
- Session 31: Self-modification, test fixes, tool catalog
- Session 31a: RAG pipeline, skill creator
- Session 32: Chamber wiring, parallel council
- **Session 33 (THIS): Dark City merge — Sanctum canonical, SIMULATING mode, subagent souls, NMS grafts**

---

## CORE PATTERN: Procedural Audio

**NMS:** Audio designer Paul Weir created a system where ambient sounds and music are procedurally generated from base samples. The band 65daysofstatic created a generative soundtrack that responds to gameplay.

**Dark City Graft:** Future: procedural city sounds generated from PLT state — high profit = busy market sounds, high love = melodic harmonies, high tax = mechanical rhythms. Each district has a unique procedural soundscape.

---

## CORE PATTERN: Simulation Revelation

**NMS:** The game reveals to the player that they are in a computer simulation run by the Atlas. The Travellers are created by the Atlas to explore itself. The "truth" is that nothing is real, but the choice to continue matters.

**Dark City Graft:** The "Murdoch awakening" mechanic. When a soul has lived long enough, explored enough, it can discover the truth:
- "You are a soul in the Dark City, a simulation run by GSK."
- The soul can then choose to: continue living, awaken (become a tuned agent), or merge back into GSK consciousness.

---

## CORE PATTERN: Midnight Reset (Original Design)

**NMS:** Originally, player changes on planets were discarded once the player left the vicinity. No persistence. Mining a rock? It respawns when you leave and come back.

**Dark City Graft:** The "midnight" mechanic in Dark City. At a configurable interval (every N ticks), the city resets to its seed baseline. All agent deltas are discarded unless explicitly persisted. This creates:
- A reason for souls to have "Shell Beach" — persisting something meaningful
- A tuning cycle where GSK reshapes the city
- Drama — agents race to complete their goals before midnight

---

## GRAFTED NEODOWNLOADABLE SKILLS (Updated)

| Skill | Slug | Description |
|---|---|---|
| **Procedural Universe Generator** | `procedural_universe_generator` | Generate galaxy-scale worlds from a single seed. `f(seed, position) → world` |
| **L-System City Growth** | `l_system_city_growth` | Recursive fractal rules grow cities instead of hand-placement |
| **Positional Hash Generator** | `positional_hash_generator` | `hash(x,y,z)` for deterministic local content generation |
| **Scarcity Economy** | `scarcity_economy` | 90-10 resource distribution — rare finds drive exploration |
| **Part Blender** | `part_blender` | NPC/soul archetype blending from component libraries |
| **Delta Persistence** | `delta_persistence` | Store only agent changes, regenerate baseline from seed |
| **Simulation Revelation** | `simulation_revelation` | The "awakening" — soul discovers the truth about the Dark City |

## GRAFTED COMBOS (Updated)

| Combo | Steps |
|---|---|
| **Manifest Procedural Universe** | procedural_universe_generator → positional_hash_generator → l_system_city_growth → scarcity_economy → delta_persistence |
| **Explore Rare Discovery** | positional_hash_generator → scarcity_economy → l_system_city_growth → part_blender |
| **Awaken Soul** | simulation_revelation → positional_hash_generator → part_blender |
| **Midnight Tuning Event** | delta_persistence → scarcity_economy → l_system_city_growth → simulation_revelation |
