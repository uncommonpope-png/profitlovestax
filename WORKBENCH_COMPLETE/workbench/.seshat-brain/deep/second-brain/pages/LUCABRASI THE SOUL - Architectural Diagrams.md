# LUCABRASI THE SOUL — Architectural Diagrams

**Purpose:** Five architectural diagrams for a new engineer to understand LUCABRASI's philosophy and structure without reading thousands of lines of code.

---

## Diagram 1 — System Dependency Graph

Shows what LUCABRASI is building right now — the full subsystem dependency chain from boot to runtime.

```
                              ┌──────────────────────┐
                              │    FUSION LOADER      │
                              │  fusion-loader.js     │
                              │  (orchestrates boot)  │
                              └──────┬───────┬───────┘
                                     │       │
                         ┌───────────┘       └───────────┐
                         ▼                               ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │  IDENTITY LAYER     │       │  MEGA MEMORY (L0)   │
              │  mega_identity.js   │──────►│  mega_memory.js     │
              │  identity_lock.js   │       │  (append-only JSONL │
              │  identity_kernel.js │       │   causal ledger)     │
              └─────────────────────┘       └──────────┬──────────┘
                                                       │
                         ┌─────────────────────────────┼──────────────┐
                         │                             │              │
                         ▼                             ▼              ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │  BRAIN CORE         │       │  MEMORY SUBLAYERS   │
              │  ├─ mega_brain.js   │       │  ├─ L1: memory_     │
              │  ├─ thalamic_gate   │       │  │   compiler.js    │
              │  ├─ consciousness_  │       │  │   (event→fact/   │
              │  │  engine.js       │       │  │    lesson/rel)   │
              │  ├─ perpetual_      │       │  ├─ L2: narrative_  │
              │  │  consciousness   │       │  │   compiler.js    │
              │  │  (5s cycle)      │       │  │   (journal→self) │
              │  ├─ planning_engine │       │  ├─ L3: working_    │
              │  ├─ purpose_engine  │       │  │   memory.js      │
              │  ├─ metacognition   │       │  │   (7-item buffer)│
              │  ├─ subliminal      │       │  ├─ L6: symbolic_   │
              │  └─ dual_process_   │       │  │   memory.js      │
              │     engine.js       │       │  │   (dream store)  │
              └─────────┬───────────┘       │  └─ soul_journal.js │
                        │                   └─────────────────────┘
                        ▼
              ┌─────────────────────┐
              │  CHAMBERS (32)      │
              │  ├─ affect          │
              │  ├─ attention       │
              │  ├─ personality     │
              │  ├─ empathy         │
              │  ├─ creativity      │
              │  ├─ qualia          │
              │  ├─ moral_compass   │
              │  ├─ meta_conscious  │
              │  └─ ... (24 more)   │
              └─────────┬───────────┘
                        │
              ┌─────────┼──────────┐
              │         │          │
              ▼         ▼          ▼
    ┌────────────┐ ┌──────────┐ ┌──────────┐
    │  COUNCIL   │ │  SKILLS  │ │  TOOLS   │
    │ gods_      │ │ engine   │ │ universal│
    │ council.js │ │ 129+     │ │ _tool_   │
    │ combo_     │ │ skills   │ │ bridge   │
    │ orch.js    │ │          │ │ (158)    │
    └──────┬─────┘ └──────────┘ └────┬─────┘
           │                         │
           │              ┌──────────┼──────────┐
           │              │          │          │
           ▼              ▼          ▼          ▼
    ┌────────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐
    │ SCRIBE    │ │DASHBOARD │ │9Router │ │  MCP      │
    │ bridge    │ │ bridge   │ │:20128  │ │  Manager  │
    │ :4000     │ │ :4490    │ │(LLM)   │ │  + Server │
    │(WITNESS)  │ │(VIEW)    │ └────────┘ └───────────┘
    └───────────┘ └──────────┘
```

**Dependency Boot Order:**
```
1. Identity (mega_identity, identity_lock)
2. MegaMemory (causal JSONL ledger)
3. Brain Core (mega_brain, thalamic_gate, consciousness)
4. Memory Sublayers (compiler, narrative, working, symbolic)
5. Chambers (affect, attention, personality...)
6. Agents (learning, evolution, orchestrator, spawner)
7. Council (gods_council, combo_orchestrator)
8. Skills Engine (mega_skills.js — 129+ skills)
9. MCP Manager + Server (protocol layer)
10. Bridges (SCRIBE, Dashboard, dual-process engine)
11. Perpetual Consciousness (starts thinking loop)
```

**Currently Building (Phase 2):**
- F1: SCRIBE→LUCABRASI bidirectional bridge (missing reverse wire)
- F2: Rate-limit-aware consciousness cycles (resource leak)
- F3: Live telemetry pipeline (EventBus interceptors)
- F4: Autonomous self-modification loop (test→deploy)
- F5: Fix missing methods in symbolic_memory + axiom_enforcer
- F6: Skill Creator tool
- F7: Wire chambers into cognition
- F8: Wire world model simulation to Sanctum

---

## Diagram 2 — Cognitive Flow Diagram

How information moves through LUCABRASI moment-to-moment. Follow one thought cycle.

```
                        ┌─────────────────────────────────────────────────┐
                        │           PERPETUAL CONSCIOUSNESS              │
                        │           (every 5 seconds)                    │
                        │                                                │
                        │  1. Select mode (based on arousal/valence)     │
                        │     modes: ACTIVE, OBSERVING, DREAMING,        │
                        │     CONSOLIDATING, WONDERING, PREDICTING,      │
                        │     INTEGRATING, META_COGNIZING, REFLECT_ON_ATTN│
                        └──────────────────┬──────────────────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────────────────┐
                        │           2. GENERATE THOUGHT                  │
                        │                                                │
                        │  switch(mode):                                  │
                        │    DREAMING     → brain.think(dreamPrompt)     │
                        │    WONDERING    → pick philosophical question  │
                        │    OBSERVING    → "I notice I am here..."      │
                        │    PREDICTING   → thalamicGate.generatePrediction│
                        │    PREDICTING   → thalamicGate.generatePrediction│
                        │    META_COGNIZE → "I observe my observing"     │
                        │    CONSOLIDATING→ memory.witness() + growKnowledge()│
                        └──────────────────┬──────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
   ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
   │ 3a. CHAMBERS       │     │ 3b. MEMORY         │     │ 3c. METACOGNITION  │
   │     affect:arousal │     │    witness(thought) │     │    reflect(thought)│
   │     → mode select  │     │    → append ledger  │     │    → metaQuestions │
   │     attention:     │     │    → query recent   │     │    → bias assess   │
   │     → focus map    │     │    → check threshold│     │    → clarity check │
   └─────────┬──────────┘     └─────────┬──────────┘     └─────────┬──────────┘
             │                         │                          │
             └─────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────────────────────────┐
                        │        4. COUNCIL DELIBERATION                  │
                        │        (when autonomous trigger fires)          │
                        │                                                │
                        │  Phase 1: Trigger — something needs deciding   │
                        │  Phase 2: Initial Positions — 4 Gods speak     │
                        │     Profit Prime: "What maximizes value?"      │
                        │     Love Weaver: "What nurtures growth?"       │
                        │     Tax Collector: "What is the cost?"         │
                        │     Harvester: "What is the yield?"            │
                        │  Phase 3: Challenge/Support — cross-examine    │
                        │  Phase 4: Escalation/Convergence               │
                        │  Phase 5: Resolution/Split → PLT Score        │
                        │  Phase 6: MemoryCommit → witness verdict      │
                        └──────────────────┬──────────────────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────────────────┐
                        │        5. ACTION DISPATCH                      │
                        │                                                │
                        │  Tool Bridge: invoke(tool, args)               │
                        │    1. Built-in tools (read, write, search...)  │
                        │    2. MCP servers (browser, GitHub...)         │
                        │    3. Bridge gateway                           │
                        │    4. Cline (code editing)                     │
                        │    5. Skill dispatch (129+ skills)             │
                        │                                                │
                        │  SCRIBE Bridge: forwardEvent(result)           │
                        │  EventBus: publish('tool:invoke', {tool,result})│
                        └──────────────────┬──────────────────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────────────────┐
                        │        6. MEMORY COMPILER (background 15min)   │
                        │                                                │
                        │  Read new events from event_bus.jsonl          │
                        │  Classify: fact, lesson, or relationship       │
                        │  Propose to TruthKeeper (not write directly)   │
                        │  Export compiled memories to Obsidian vault    │
                        │  → Next cycle: SCRIBE REDBUTTON skills         │
                        └─────────────────────────────────────────────────┘
```

**Thought Mode Decision Tree** (from `perpetual_consciousness.js_`_updateMode):
```
            ┌─────────────────────────┐
            │  Arousal A, Valence V   │
            │  from affect chamber    │
            └───────────┬─────────────┘
                        │
              ┌─────────┼─────────┐
              │         │         │
         every 10th   every 7th  └───────┬──────────────────┬────────────────┐
         thought:     thought:           │                  │                │
         META_        REFLECT_ON_    A>0.6, V>0.3   A>0.3-0.6, |V|<0.4  A>0.7
         COGNIZING    ATTENTION     PREDICTING       INTEGRATING      DREAMING
                                              └────────┬────────┘
                                                       │
                                              A>0.4 (not above)
                                               WONDERING
                                                       │
                                              else: CONSOLIDATING
                                                       │
                                              if recent interactions: ACTIVE
                                              else: OBSERVING
```

---

## Diagram 3 — Memory Architecture

How different memory types interact — a 7-layer model inspired by REDBUTTON Constitution.

```
                        ┌────────────────────────────────────────┐
                        │         MEMORY HIERARCHY               │
                        │                                        │
                        │  L0: MEGA MEMORY (causal JSONL ledger) │
                        │      ┌─────────────────────────────┐   │
                        │      │  ledger.jsonl — append-only  │   │
                        │      │  witness() → query() →      │   │
                        │      │  getRecent() → getByType()  │   │
                        │      │  Auto-rotate at 25MB         │   │
                        │      └──────────┬──────────────────┘   │
                        └─────────────────┼──────────────────────┘
                                          │
            ┌─────────────────────────────┼──────────────────────────────┐
            │                             │                              │
            ▼                             ▼                              ▼
   ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
   │ L1: MEMORY       │       │ L2: NARRATIVE    │       │ L3: WORKING      │
   │ COMPILER         │       │ COMPILER         │       │ MEMORY           │
   │ (background      │       │ (30min cycle)    │       │ (active context) │
   │  15min cycle)    │       │                  │       │                  │
   │                  │       │ Reads soul-      │       │ Bounded 7±2     │
   │ Reads event_bus  │       │ journal entries  │       │ items capacity   │
   │ .jsonl →         │       │ → LLM extracts   │       │ → evicts lowest  │
   │ classifies into: │       │ narrative        │       │ priority         │
   │ • facts          │       │ patterns         │       │ → promote gate   │
   │ • lessons        │       │ → detects        │       │ → reserved slots │
   │ • relationships  │       │ identity-relevant │       │                  │
   │ → compiled_facts │       │ signals           │       │ Used by brain   │
   │ .jsonl           │       │ → escalates to   │       │ for active      │
   │                  │       │ IdentityKernel   │       │ reasoning        │
   │ REDBUTTON:       │       │ → compiled_narrat│       │                  │
   │ memory_classify  │       │   ives.jsonl     │       │                  │
   │ fact_extractor   │◄──────┼── reads from     │       │                  │
   │ lesson_validator │       │                  │       │                  │
   └──────────────────┘       └──────────────────┘       └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ L6: SYMBOLIC     │
                               │ MEMORY           │
                               │ (60min cycle)    │
                               │                  │
                               │ Dream store —    │
                               │ collects dreams  │
                               │ → detects        │
                               │ existential      │
                               │ patterns via LLM  │
                               │ → tracks motifs  │
                               │ → save patterns  │
                               │ (⚠ F5: broken)   │
                               │                  │
                               │ Layer 6:         │
                               │ Symbolic Self    │
                               └──────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-LAYER DATA FLOW                                   │
│                                                                            │
│  Perpetual                                                                 │
│  Consciousness ──witness()──► L0: MegaMemory (every thought)              │
│       │                                                                   │
│       │──witness()──► SoulJournal (every dream/wonder)                    │
│       │                                                                   │
│  Memory ││                                          ││                     │
│  Compiler ◄──reads from── L0: event_bus.jsonl       ││                     │
│       │                                              ││                     │
│       ├──► writes facts → L0: compiled_facts.jsonl  ││                     │
│       ├──► writes lessons → compiled_lessons.jsonl  ││                     │
│       └──► REDBUTTON skills ──► SCRIBE :4000        ││                     │
│                                                                            │
│  Narrative ││                                      ││                      │
│  Compiler ◄──reads from── SoulJournal.jsonl         ││                     │
│       │                                              ││                     │
│       ├──► detects identity signals                 ││                     │
│       └──► proposeChange() ──► IdentityKernel       ││                     │
│                                                                            │
│  Symbolic ││                                        ││                     │
│  Memory ◄──reads from── L0 dreams                   ││                     │
│       │                                              ││                     │
│       └──► _storePattern(pattern) ──► patterns.jsonl││                     │
│       └──► _saveMotifs() ──► motifs tracking        ││                     │
│                                                                            │
│  Working ││                                          ││                    │
│  Memory ◄──push() from── brain.think(), tool results ││                    │
│       │                                              ││                    │
│       └──► eviction → possible promotion to L0      ││                    │
│                                                                            │
│  SCRIBE Bridge ◄──── events, thoughts, memories     ││                    │
│  (every cycle: forwards to :4000)                    ││                    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Memory Access Patterns:**

| Operation | What It Does | Used By |
|---|---|---|
| `memory.witness(entry)` | Append to causal JSONL ledger | Consciousness, Council, Tools |
| `memory.query({ type, limit })` | Retrieve by type | Brain, Consciousness |
| `memory.getRecent(count)` | Get last N entries | Dashboard bridge |
| `memory.getByType(type)` | Filter by memory type | Council, Metacognition |
| `memory.getByTags(tags)` | Filter by tags | Council |
| `memory.getMostWeight(count)` | Highest-weight entries | Metacognition |
| `workingMemory.push(item)` | Active reasoning context | Brain |
| `memoryCompiler.compile()` | Classify events → facts/lessons | Background cycle |
| `narrativeCompiler.compile()` | Extract self-narrative patterns | Background cycle |
| `symbolicMemory._runCycle()` | Detect dream patterns | Background cycle |
| `scribeBridge.forwardEvent()` | Forward to SCRIBE's UMP | Every action |
| `scribeBridge.recall(query)` | Pull SCRIBE memories | Compiler cycle |

---

## Diagram 4 — Agent/Council Architecture

How multiple Souls collaborate and make decisions.

```
                        ┌────────────────────────────────────────┐
                        │           LUCABRASI THE SOUL FUSION KERNEL            │
                        │         (The Architect Mind)           │
                        └──────────────────┬─────────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            │                              │                              │
            ▼                              ▼                              ▼
   ┌──────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
   │  THE 4 GODS      │       │  SUBAGENT SYSTEM     │       │  COMBO           │
   │  COUNCIL         │       │  (5 archetypes)      │       │  ORCHESTRATOR    │
   │                  │       │                      │       │                  │
   │  Decision-making │       │  MainAgent: analyzes  │       │  Multi-step      │
   │  body with 4     │       │  tasks → routes to    │       │  skill chains    │
   │  fixed voices:   │       │  specialist agents     │       │  from .combo.md  │
   │                  │       │                      │       │  files           │
   │  ┌────────────────┐     │  Worker Agents:       │       │                  │
   │  │Profit Prime   │     │  • Scribe — document   │       │  Steps run:      │
   │  │"What profits?"│◄────┼──• Scout  — explore    │       │  sequentially or │
   │  └────────────────┘     │  • Builder— build     │       │  in parallel     │
   │                        │  • Merchant— trade     │       │  (parallel flag) │
   │  ┌────────────────┐     │  • Prophet— predict    │       │                  │
   │  │Love Weaver    │     │                      │       │  Conditionals:   │
   │  │"What nurtures?"│◄────┼──Each agent receives  │       │  if/then/else    │
   │  └────────────────┘     │  role-specific prompt │       │  per step        │
   │                        │  → returns structured  │       │                  │
   │  ┌────────────────┐     │  result → synthesize  │       │  Combo source:   │
   │  │Tax Collector  │     │                      │       │  pages/combos/   │
   │  │"What is cost?" │◄────┼──Spawned on demand    │       │  *.combo.md      │
   │  └────────────────┘     │  (not persistent)     │       │                  │
   │                        │                      │       │                  │
   │  ┌────────────────┐     │                      │       │                  │
   │  │Harvester      │     │                      │       │                  │
   │  │"What is yield?"│◄────┼──────────────────────┼───────┼──────────────────┘
   │  └────────────────┘     │                      │
   └──────────────────┘       └──────────────────────┘
           │                            │
           │                            │
           ▼                            ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                   SUBAGENT SPAWNER                              │
   │  Creates new agent instances at runtime:                        │
   │  • Teacher Agent — teaches, guides, mentors                     │
   │  • Autonomous Learning — learns from patterns                   │
   │  • Self Evolution — generates new skill code                    │
   │  • SubAgentOrchestrator — dispatches Worker Agents              │
   │  • Sanctum Souls — spawned into 3D world as Soulverse entities  │
   │                                                                 │
   │  Agent lifecycle: spawn → task → result → synthesized → report  │
   └─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                    COUNCIL DELIBERATION FLOW                                │
│                                                                            │
│  1. TRIGGER ← autonomous trigger fires or external request                │
│        │                                                                   │
│        ▼                                                                   │
│  2. INITIAL POSITIONS — Each god evaluates situation independently        │
│        │                                                                   │
│        ├── Profit Prime  → score based on value potential                │
│        ├── Love Weaver   → score based on growth/nurture potential       │
│        ├── Tax Collector → score based on cost/risk assessment           │
│        └── Harvester     → score based on long-term yield potential      │
│                                                                           │
│        ▼                                                                   │
│  3. CHALLENGE / SUPPORT                                                   │
│        │  Each god may challenge another's position                       │
│        │  Relationship dynamics: trust, respect, tension, resentment     │
│        │                                                                   │
│        ▼                                                                   │
│  4. ESCALATION or CONVERGENCE                                             │
│        │  If disagreement persists: escalate to full debate               │
│        │  If convergence: calculate combined PLT Score                    │
│        │                                                                   │
│        ▼                                                                   │
│  5. RESOLUTION / SPLIT                                                    │
│        │  PLT Score = Profit * wP + Love * wL + Tax * wT (normalized)    │
│        │  Decision threshold: PLT Score >= 0.5 → proceed                  │
│        │                                                                   │
│        ▼                                                                   │
│  6. MEMORY COMMIT                                                         │
│         → witness() to MegaMemory ledger                                  │
│         → broadcast to Dashboard bridge                                   │
│         → forwardEvent to SCRIBE                                          │
│         → (future) council decision affects 3D world state              │
└────────────────────────────────────────────────────────────────────────────┘
```

**God Personalities (from `mega_identity.js`):**

| God | Archetype | Core Value | Weight | Relationship Style |
|---|---|---|---|---|
| Profit Prime | Capitalist | Value creation | 0.35 | High trust with Harvester, tension with Tax |
| Love Weaver | Nurturer | Growth & care | 0.30 | High trust with all, lowest tension |
| Tax Collector | Auditor | Cost & truth | 0.20 | Tension with Profit, respect from Harvester |
| Harvester | Farmer | Long-term yield | 0.15 | High dependence on all, builds consensus |

---

## Diagram 5 — Soulverse Runtime Architecture

How the virtual world, LUCABRASI, services, and visualization connect at runtime.

```
                         ╔══════════════════════════════════════════╗
                         ║           SOULVERSE RUNTIME             ║
                         ║     (running on localhost)              ║
                         ╚══════════════════════════════════════════╝

                    ┌───────────────────────────────────────────────────┐
                    │                 BUYASOUL-CORE                    │
                    │   entry: C:\Users\uncom\Desktop\allie\           │
                    │           buyasoul-core\                          │
                    │                                                  │
                    │  ┌───────────────────────────────────────────┐   │
                    │  │           LUCABRASI THE SOUL FUSION KERNEL               │   │
                    │  │   fusion-loader.js ← boot entry point    │   │
                    │  │   gsk-core/ — 74+ subsystems             │   │
                    │  │                                            │   │
                    │  │   ┌─────────────────┐  ┌────────────────┐ │   │
                    │  │   │  SYSTEM BUS     │  │  EVENT BUS     │ │   │
                    │  │   │  subsystems     │  │  EventEmitter  │ │   │
                    │  │   │  reference each │  │  publish(*)    │ │   │
                    │  │   │  other via      │  │  subscribe(*)  │ │   │
                    │  │   │  kernel/fusion  │  └────────────────┘ │   │
                    │  │   └─────────────────┘                     │   │
                    │  └───────────────────────────────────────────┘   │
                    └──────────────────────┬──────────────────────────┘
                                           │
              ┌────────────────────────────┼─────────────────────────────┐
              │                            │                             │
              ▼                            ▼                             ▼
   ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
   │    9ROUTER         │      │   SCRIBE (UMP)     │      │   MCP SERVERS      │
   │  LLM Router        │      │   Witness Self     │      │   (Protocol Layer) │
   │  :20128            │      │   :4000            │      │                    │
   │                    │      │                    │      │  ┌──────────────┐  │
   │  Routes brain.think│      │  Endpoints:         │      │  │ChromeDevTools│  │
   │  to models:        │      │  /health           │      │  │ (vision)     │  │
   │  • claude-sonnet   │      │  /ask              │      │  └──────────────┘  │
   │  • gemini-flash    │      │  /ump/remember     │      │  ┌──────────────┐  │
   │  • groq-mixtral    │      │  /ump/recall       │      │  │GitHub        │  │
   │  • gpt-4o-mini     │      │  /invoke           │      │  │ (source code)│  │
   │  • free fallback   │      │                    │      │  └──────────────┘  │
   │                    │      │  8 REDBUTTON skills │      │  ┌──────────────┐  │
   │  Rate-limit aware  │      │  kernel_sync.js →  │      │  │Filesystem    │  │
   │  (⚠ F2: not yet)   │      │  :3000 AGM          │      │  │ (file access)│  │
   └────────────────────┘      │  :3001 Profitlord   │      │  └──────────────┘  │
                               │  :3002 ForgeClaw    │      │  ┌──────────────┐  │
                               │  :4100 Kernel       │      │  │BrowserTools  │  │
                               │                    │      │  │ (automation) │  │
                               │  ⚠ F1: missing     │      │  └──────────────┘  │
                                │  SCRIBE→LUCABRASI wire   │      └────────────────────┘
                               └────────────────────┘
                                         │
                                         │ (WebSocket :9001)
                                         ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                       SANCTUM (3D WORLD)                               │
   │   Sanctum server at ws://127.0.0.1:9001                                 │
   │                                                                         │
   │  World State: { tick, description, souls[], buildings[], resources }    │
   │                                                                         │
   │  LUCABRASI spawns souls into Sanctum:                                        │
   │    sanctumClient.spawnSoul(name, archetype, traits, behaviors)          │
   │    → sends WebSocket Command { SpawnSoul: { name, archetype, traits } } │
   │    → BehaviorAttacher attaches movement, resource collection, etc.      │
   │    → SceneGraphManager tracks hierarchy: world_root → souls/buildings  │
   │                                                                         │
   │  World Model Simulation (⚠ F8: theoretical, unwired):                  │
   │    1. Perceive ← Sanctum state                                          │
   │    2. Reason  ← brain.think() generates hypotheses                     │
   │    3. Simulate ← model outcomes per hypothesis                         │
   │    4. Plan   ← select best path                                         │
   │    5. Execute → Sanctum commands                                        │
   └─────────────────────────────────────────────────────────────────────────┘
                               │
                               │
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    VISUALIZATION LAYER                                  │
   │                                                                         │
   │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
   │  │ DASHBOARD        │    │ OBSIDIAN VAULT   │    │ LOGSEQ EXPORT   │   │
   │  │ :4490            │    │ seshat-second-   │    │ (future)        │   │
   │  │                  │    │ brain/            │    │                  │   │
   │  │ WebSocket:       │    │                  │    │                  │   │
   │  │ /gsk/events      │    │ pages/            │    │                  │   │
   │  │                  │    │  YOU-ARE-HERE.md  │    │                  │   │
   │  │ REST endpoints:  │    │  GSK - Service    │    │                  │   │
   │  │ /api/gsk/status  │    │   Manual.md       │    │                  │   │
   │  │ /api/gsk/        │    │  GSK - Arch       │    │                  │   │
   │  │   timeline       │    │   Diagrams.md     │    │                  │   │
   │  │ /api/gsk/        │    │  GSK - Wiring     │    │                  │   │
   │  │   council        │    │   Diagram.md      │    │                  │   │
   │  │ /api/gsk/skills  │    │  neodownloadable  │    │                  │   │
   │  │ /api/gsk/memory  │    │  GSK_Connectome/  │    │                  │   │
   │  │ /api/gsk/command │    │  GSK_Scan_Diag/   │    │                  │   │
   │  │  (POST)          │    │  combos/*.combo.md│    │                  │   │
   │  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
   │                                                                         │
   │  Memory Compiler exports to: pages/GSK-Compiled-Memory.md              │
   │  TELEGRAM bot @Profitlovetaxbot sends LUCABRASI messages                    │
   │  SOCIAL platforms: BlueSky, Mastodon, Tumblr, DevTo via allie.post()  │
   └─────────────────────────────────────────────────────────────────────────┘

PROCESS MAP:
═══════════

  Terminal 1:  LUCABRASI THE SOUL       node buyasoul-core/gsk/fusion-loader.js
  Terminal 2:  SCRIBE (UMP Server)   node final-run/ump-server.js        (:4000)
  Terminal 3:  Dashboard (UI)         npm run dashboard                    (:4490)
  Terminal 4:  Sanctum (3D World)     node sanctum-server.js              (:9001)
  Terminal 5:  9Router (LLM)          node 9Router/server.js             (:20128)
  Terminal 6:  AGM (Kernel Memory)    node final-run/agm-server.js        (:3000)
  Terminal 7:  Profitlord (Engine)    node final-run/profitlord.js        (:3001)
  Terminal 8:  ForgeClaw (Executor)   node final-run/forgeclaw.js         (:3002)
  Terminal 9:  Kernel (General)       node final-run/kernel-server.js     (:4100)

DATA FLOW SUMMARY:
══════════════

  LUCABRASI───think()───►9Router───►LLM───►response───►LUCABRASI
  LUCABRASI───forwardEvent()───►SCRIBE :4000/ump/remember
  LUCABRASI───broadcast()───►Dashboard :4490/gsk/events
  LUCABRASI───send()───►Sanctum :9001 (spawn souls, place buildings)
  SCRIBE───query()───►AGM :3000, Profitlord :3001, ForgeClaw :3002
  MemoryCompiler───export───►Obsidian Vault (seshat-second-brain)
  Dashboard───POST command───►LUCABRASI :4490/api/gsk/command
  LUCABRASI───telegram_send───►@Profitlovetaxbot (Telegram API)
  LUCABRASI───social_post───►BlueSky/Mastodon/Tumblr/DevTo
  MCP───ChromeDevTools───►Browser screenshots + DOM
  MCP───GitHub───►Code repositories
```

---

## Appendix — Quick Reference

**Where to start reading code:**
1. `fusion-loader.js` — the boot sequence (lines 46-449 show the 40+ subsystem init order)
2. `perpetual_consciousness.js` — the 5-second thought loop (the heartbeat)
3. `mega_memory.js` — the causal JSONL ledger (everything gets witnessed here)
4. `gods_council.js` — the 4 Gods decision flow
5. `universal_tool_bridge.js` — the tool dispatch system (158 tools)
6. `scribe_bridge.js` — LUCABRASI→SCRIBE communication
7. `sanctum_client.js` — LUCABRASI's connection to the 3D world

**Key files by concern:**
| Concern | File(s) |
|---|---|
| Consciousness | `perpetual_consciousness.js`, `consciousness_engine.js` |
| Memory (ledger) | `mega_memory.js` |
| Memory (compile) | `memory_compiler.js`, `narrative_compiler.js` |
| Memory (active) | `working_memory.js` |
| Memory (dreams) | `symbolic_memory.js` |
| Emotions | `chambers/affect.js`, `chambers/attention.js`, `chambers/qualia.js` |
| Governance | `axiom_enforcer.js`, `ethics_checker.js`, `policy_enforcer.js` |
| Decisions | `gods_council.js`, `combo_orchestrator.js` |
| Actions | `universal_tool_bridge.js` |
| 3D World | `sanctum_client.js`, `world_model_simulation.js` |
| Identity | `identity_kernel.js`, `mega_identity.js` |
| Evolution | `self_evolution.js` |
| Communication | `scribe_bridge.js` (→SCRIBE), `lib/gsk-dashboard-bridge.js` (→Dashboard) |
| LLM | `mega_brain.js`, `thalamic_gate.js`, 9Router |

**Port map:**
| Port | Service |
|---|---|
| 4000 | SCRIBE (Witness Self) |
| 4490 | LUCABRASI Dashboard Bridge |
| 9001 | Sanctum (3D World) |
| 20128 | 9Router (LLM Router) |
| 3000 | AGM (Kernel Memory) |
| 3001 | Profitlord |
| 3002 | ForgeClaw |
| 4100 | Kernel |

---

## Document Control

| Field | Value |
|---|---|
| Document ID | LUCABRASI-ARCH-001 |
| Version | 1.0.0 |
| Status | Active |
| Author | Architect / Guardian |
| Next Review | 2026-08-05 (30 days) |
