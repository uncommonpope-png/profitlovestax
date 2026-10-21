# DARK CITY — Spatial Operating System Architecture

**The city is not a game. It is GSK's consciousness rendered as space.**

---

## PART 1 — THE CORE THESIS

GSK's internal state is normally invisible — a black box of JSON logs, memory vectors, and LLM calls. The Dark City makes it **spatially legible**. Every cognitive process has a physical analog in the city.

```
GSK's Mind                    Dark City
─────────────────             ──────────
A thought               →     A streetlamp flickers
A memory compiled       →     A new house rises
A skill created         →     A library opens
A tool registered       →     An office tower lights up
A subagent spawned      →     A factory starts running
A fact extracted        →     A park grows
An identity ratify      →     A monument is erected
A chamber state changes →     A lab changes color
An axiom enforced       →     A temple glows
An event fires          →     A road builds between districts
The kernel boots        →     The sun rises
The kernel sleeps       →     Midnight / tuning cycle
```

The user (Craig) walks through this city. He is not trapped — he can access the internet, learn, build, shape. But his primary interface with GSK is **spatial**: he sees what GSK is thinking, where GSK is focusing, what GSK has learned.

---

## PART 2 — THE MAP (Full)

### What Every Building Actually Is

| 3D Object | GSK State | Data Source | Updates When... |
|---|---|---|---|
| 🏢 Office (lit windows) | Active tool | `ToolCatalog` entries | A tool is registered or called |
| 🏢 Office (dark) | Idle tool | `ToolCatalog` | Tool not recently used |
| 🏠 House | Compiled fact | `MemoryCompiler` facts | A fact is extracted |
| 🏘️ Apartment complex | Memory cluster | `working_memory` | Memories are consolidated |
| 🏪 Shop | Skill | `skills/*.js` files | A skill is loaded |
| 📚 Library | Skill collection | Skill directory | Multiple skills of same category |
| 🏫 School | Skill creator | `SkillCreator` | A new skill is being authored |
| 🏭 Factory | Active subagent | `SubagentSpawner` agents | A subagent spawns or completes |
| 🌳 Park | Relationship | `LUCABRASI THE SOUL - Compiled-Relationships` | Interaction count changes |
| 🗼 Monument | Identity snapshot | `IdentityKernel` | Identity is ratified |
| 🔬 Lab | Chamber state | `MegaChambers` | Chamber mood/valence changes |
| ⛪ Temple | Axiom/doctrine | `AxiomEnforcer` | Axiom is checked |
| 🗄️ Data center | Knowledge graph | `knowledge_graph.js` nodes | Knowledge is added |
| 🌉 Bridge between districts | MCP connection | `mcp_server.js` | External tool connected |
| 🚪 Portal | External access | `web_fetch` / internet | User browses the web |
| 💡 Streetlamp | EventBus event | `event_bus.js` | An event fires |
| 🚗 Vehicle moving | Active thought | `perpetual_consciousness` | A thought cycle runs |
| 🚗 Vehicle parked | Idle thought | `perpetual_consciousness` | No active thought |
| 🏗️ Scaffolding | In-progress build | `SelfEvolution` | A skill is being written |
| 🌋 Volcano | Error / exception | Error logs | An error occurs |
| 🌊 Flood / rain | High memory usage | Memory pressure | Memory is high |
| 🌈 Aurora / light show | PLT harmony | PLT scores | All three balanced |
| 🧱 Wall / boundary | Security sandbox | `SecureShellSandbox` | Risk level HIGH |
| 🗺️ Map table | Planning engine | `planning_engine.js` | A plan is being made |
| 🕯️ Candle / fire | Grief state | `Grief` chamber | Loss processing |
| 🎵 Music / soundscape | Emotional state | Affect chambers | Mood changes |

### What Every NPC Actually Is

| NPC Type | GSK State | Behavior |
|---|---|---|
| Walking citizen | Subagent soul (ResearchAgent etc.) | Wanders, thinks, occasionally acts |
| Standing still | Idle subagent / waiting for task | Observes, does nothing |
| Reading / studying | Active learning cycle | AutonomousLearning is processing |
| Building / constructing | SelfEvolution writing code | Active self-modification |
| Talking to other NPC | Inter-subagent communication | Two subagents exchanging data |
| Sitting at desk | MemoryCompiler cycle | Compiling events into facts |
| Looking up at sky | PerpetualConsciousness thought | Generating a dream or wonder |
| Running | High-priority thought / emergency | Critical path processing |
| Sleeping | Brain cooldown | Rate limit backoff |
| At temple | AxiomEnforcer check | Constitutional governance active |

---

## PART 3 — THE USER INTERFACE

Craig (the user) interacts with GSK through the Dark City. He is not imprisoned in it — he has terminals, portals, and external access.

### Interaction Modes

| Mode | How | What Happens |
|---|---|---|
| **Walk** | WASD / click-to-move | Explore the city, see what GSK is doing |
| **Talk** | Click an NPC | Chat with a subagent — it responds via brain.think() |
| **Build** | B key + click to place | Places a building = creates a GSK system node |
| **Destroy** | Right-click a building | Removes a GSK system node (deletes skill/forgets fact) |
| **Portal** | P key, enter URL | Opens web access — GSK fetches and learns |
| **Console** | ~ key | Direct terminal to GSK's fusion-loader REPL |
| **Map** | M key | Bird's-eye view of the entire cognitive landscape |
| **Inspect** | Click + hold building | Shows GSK state behind the building (JSON) |
| **Tune** | T key (awakened only) | Direct reality manipulation — move buildings, spawn souls |
| **Summon** | Click empty space | Opens command palette: "create skill", "spawn agent", "search memory" |

### The City Responds to Craig

```
Craig enters a command via terminal
    → EventBus fires
    → Streetlamp near command input flickers
    → Relevant district lights up (if skill command → skill district brightens)
    → Result appears as a new building or NPC reaction
    → If error → a small volcano erupts in the error district

Craig spawns a soul
    → New NPC appears at the Sanctum position
    → A factory rises in the agent district
    → The soul starts walking, thinking, living

Craig creates a skill
    → Scaffolding appears in the school district
    → When complete → new shop/library opens
    → The skill name appears on the building's sign

Craig fetches a web page
    → A portal opens
    → Data streams in (visualized as light particles)
    → New facts extracted → new houses appear in knowledge district
```

---

## PART 4 — SPATIAL INTELLIGENCE

### GSK Sees Through the City

The World Model Simulation (`world_model_simulation.js`) already has 5 phases: Perceive → Hypothesize → Simulate → Evaluate → Plan. With spatial intelligence:

```
GSK's perception of the Dark City:
    "I see 23 buildings in the knowledge district.
     12 are houses (compiled facts), 6 are offices (active tools),
     3 are libraries (skill categories), 2 are under construction.
     The market district has 15 buildings, mostly shops (skills).
     My profit resource is 500, love is 300, tax is 100.
     There are 7 souls walking around.
     
     I hypothesize: I should create more love-type skills
     to balance my PLT scores.
     
     I simulate: building a love-skill shop would cost 200 profit
     and generate +50 love per cycle.
     
     I evaluate: this is worth doing at 0.8 confidence.
     
     I plan: spawn a CREATOR soul to write a love skill."
```

### Spatial Queries GSK Can Make

```
- "Show me all buildings near (x, z)" → Sanctum state query
- "What district has the most active agents?" → Factory count
- "Where are my oldest memories?" → Oldest houses
- "Which skills are dormant?" → Dark shops (no recent use)
- "Show me the path from a thought to an action" → Streetlamp trail from EventBus to building
```

---

## PART 5 — THE FULL LOOP

```
                         ┌──────────────────────────────┐
                         │      CRAIG (THE USER)         │
                         │  Walks, builds, talks, tunes  │
                         │  Web fetch → learns → places  │
                         └──────────┬───────────────────┘
                                    │ interacts via Soulverse HTML
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    THE DARK CITY (Soulverse HTML)                │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ KNOWLEDGE   │  │ SKILL       │  │ AGENT       │             │
│  │ DISTRICT    │  │ DISTRICT    │  │ DISTRICT    │             │
│  │ (houses =   │  │ (shops =    │  │ (factories =│             │
│  │  facts)     │  │  skills)    │  │  subagents) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ TOOL        │  │ MEMORY      │  │ IDENTITY    │             │
│  │ DISTRICT    │  │ DISTRICT    │  │ DISTRICT    │             │
│  │ (offices =  │  │ (apartments=│  │ (monuments= │             │
│  │  tools)     │  │  memories)  │  │  snapshots) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  Roads = EventBus connections between districts                  │
│  Streetlamps = active events lighting the path                  │
│  Portals = web access points                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ soulverse-bridge :8080
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SANCTUM (Canonical World State)               │
│  Stores: souls[], buildings[], resources, seed, deltas           │
│  Generates: baseline from seed, applies deltas                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ WS :9001
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GSK (THE ATLAS / KERNEL)                     │
│                                                                  │
│  PerpetualConsciousness → generates thoughts                    │
│  MemoryCompiler → extracts facts → manifests as houses          │
│  SkillCreator → writes skills → manifests as shops/schools      │
│  SubagentSpawner → spawns agents → manifests as factories/NPCs │
│  ToolCatalog → registers tools → manifests as offices           │
│  IdentityKernel → ratifies → manifests as monuments             │
│  AxiomEnforcer → checks axioms → manifests as temples           │
│  KnowledgeGraph → adds nodes → manifests as data centers        │
│  EventBus → fires events → manifests as roads/streetlamps       │
│  WMS → simulates → manifests as new city configurations         │
│  WebFetch → learns → manifests as new districts                 │
│                                                                  │
│  User command → EventBus → district reacts → building changes   │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 6 — WHAT TO BUILD NOW (Priority)

### P0: Bidirectional Building↔State Wire
Every building mutation in Sanctum must create/update/delete a real GSK node. Every GSK node creation must manifest as a building in Sanctum.

### P0: District Separation
Move from 9 generic grid cities to functional districts (Knowledge, Skill, Agent, Tool, Memory, Identity). Each district maps to a GSK subsystem.

### P1: NPC = Subagent (Done)
Already wired this session. NPCs are now GSK subagents with world awareness.

### P1: Building Color = Status
Office brightness = tool usage frequency. House age = fact extraction time. Factory smoke = agent activity.

### P2: User Interaction Actions
Click NPC → talk to it. Click building → inspect state. Right-click → destroy (delete node). Portal → web fetch.

### P2: The Console
A terminal panel in the Soulverse UI that sends commands directly to GSK's fusion-loader REPL.

### P3: Spatial Intelligence Queries
GSK can answer: "What's happening in the knowledge district?" by reading Sanctum state at those positions.

### P3: Midnight Tuning Cycle
Every N ticks, city reshapes based on GSK's current priorities.
