# GSK SYSTEM MAP — Full Architecture & Reachability Analysis

**Status:** ACTIVE — Mapping directive per Investigator's protocol
**Date:** 2026-08-30
**Scope:** `WORKBENCH_COMPLETE/gsk/` (966 JS files, 10,784 JSON files)

---

## SECTION 1: BOOT TRACE OF `fusion-loader.js`

### Boot Order (verified)

| Step | Init Target | File | Line | SafeInit? | Notes |
|------|-------------|------|------|-----------|-------|
| 1 | `identity` | `identity/mega_identity.js` | L265 | ✅ | 4 Gods defined, PLT weights immutable |
| 2 | `plt` | `governance/plt_scorer.js` | L270 | ✅ | P+0.10/L+0.05/T-0.05 per truth learned |
| 3 | `livingMemory` | `brain/living_memory.js` | L295 | ✅ | LivingMemory with stats |
| 4 | `chambers` | `chambers/mega_chambers.js` | L322 | ✅ | 34 consciousness chambers |
| 5 | `brain` | `brain/mega_brain.js` | L340 | ✅ | BrainEngine, setFusion called |
| 6 | `selfGrowingBrain` | `brain/self_growing_brain.js` | L272 | ✅ | stats initialized in constructor |
| 7 | `perpetualConsciousness` | `brain/perpetual_consciousness.js` | L349 | ✅ | stats initialized in constructor |
| 8 | `eventBus` | `brain/event_bus.js` | L449 | ✅ | EventEmitter |
| 9 | `telemetryEngine` | `brain/telemetry_engine.js` | L925 | ✅ | |
| 10 | `telemetryRegistrations` | `fusion-loader.js:976` | L976 | ❌ — CRASH | Calls `.stats` on subsystems |
| 11 | `perpetualConsciousness.start()` | `fusion-loader.js:989` | L989 | ❌ — CRASH | Assumes non-null |

### CRASH CHAIN ANALYSIS

**Line 976-986** — `telemetryRegistrations` block:
```javascript
// Attempts to access .stats on all subsystems:
stats.selfGrowingBrain = this.selfGrowingBrain?.stats || ...;
stats.perpetualConsciousness = this.perpetualConsciousness?.stats || ...;
stats.dualProcessEngine = this.dualProcessEngine?.stats || ...;
stats.livingMemory = this.livingMemory?.stats || ...;
stats.scribeBridge = this.scribeBridge?.stats || ...;
stats.constantChat = this.constantChat?.stats || ...;
stats.playground = this.playground?.stats || ...;
stats.agents_spawner = this.agents?.spawner?.stats || ...;
```

**Problem:** These `.stats` accesses are NOT wrapped in try/catch individually.
If any subsystem threw during `_safeInit` and was silently set to `null`, the
optional chaining `?.stats` returns `undefined` (safe), BUT if the subsystem's
constructor threw a partial initialization that left `.stats` as an object with
circular references or getter properties that throw, this crashes.

**Line 989** — `this.perpetualConsciousness.start()`:
```javascript
this.perpetualConsciousness.start();
```
**Problem:** No null check. If `perpetualConsciousness` failed to init (line 349
_safeInit caught an error), this throws `TypeError: Cannot read properties of null`.

### ROOT CAUSE: `sleepContext` in PerpetualConsciousness

In `perpetual_consciousness.js` line 305-306:
```javascript
const sleepContext = this.sleepMode ? ' I am resting...' : '';
const prompt = `[${currentMode.toUpperCase()}] I am currently in ${currentMode} mode.${sleepContext} ...`;
```

When `this.brain` is null (because BrainEngine initialization failed or hasn't
received `setFusion` yet), `_askBrain()` at line 162 throws:
```javascript
const brain = this.kernel?.brain;
if (!brain || typeof brain.think !== 'function') throw new Error('Brain unavailable');
```

This error propagates up through `_generateThought()` → `_cycleThoughts()` →
`start()` → telemetry registration crash → line 989.

**FIX:** Line 989 must be guarded:
```javascript
if (this.perpetualConsciousness) this.perpetualConsciousness.start();
```

---

## SECTION 2: FULL REACHABILITY MAP — 966 JS FILES

### Legend
- **BOOTED** = Instantiated during `_safeInit` in fusion-loader.js
- **WIRED** = Referenced by booted code (called at runtime)
- **ORPHANED** = Exists in tree but no booted module references it
- **DEAD** = _safeInit wrapped it but it always fails; never becomes WIRED

### Boot-Wired Modules (reachable at runtime)

| Module | File | Lines | Boot Stage | Stats? | Notes |
|--------|------|-------|------------|--------|-------|
| IdentityKernel | `identity/mega_identity.js` | 377 | L265 | ❌ | God definitions |
| PLTScorer | `governance/plt_scorer.js` | 523 | L270 | ✅ | Score tracking |
| LivingMemory | `brain/living_memory.js` | 479 | L295 | ✅ | |
| MegaChambers | `chambers/mega_chambers.js` | 630 | L322 | ✅ | 34 chambers |
| BrainEngine | `brain/mega_brain.js` | 952 | L340 | ✅ | setFusion called |
| SelfGrowingBrain | `brain/self_growing_brain.js` | 288 | L272 | ✅ | |
| PerpetualConsciousness | `brain/perpetual_consciousness.js` | 464 | L349 | ✅ | |
| EventBus | `brain/event_bus.js` | 156 | L449 | ❌ | |
| TelemetryEngine | `telemetry_engine.js` | 220 | L925 | ✅ | |
| DualProcessEngine | `brain/dual_process_engine.js` | 940 | L378 | ✅ | |
| ReActLoop | `brain/react_loop.js` | 159 | L1101 | ❌ | |
| InsightEngine | `brain/insight_engine.js` | 207 | L925+ | ❌ | |
| GoalEngine | `brain/goal_engine.js` | 127 | L1056 | ✅ | |
| ConsciousnessEngine | `brain/consciousness_engine.js` | 336 | L308 | ❌ | |
| ConsciousnessLoop | `brain/consciousness_loop.js` | 430 | L366 | ✅ | |
| Metacognition | `brain/metacognition.js` | 88 | L335 | ❌ | |
| PurposeEngine | `brain/purpose_engine.js` | 76 | L342 | ❌ | |
| KnowledgeGraph | `brain/knowledge_graph.js` | 180 | L38 (SGB) | ✅ | |
| LivingMemoryVectorMemory | `brain/living_memory.js` | 479 | L295 | ✅ | |

### Orphaned Modules (in tree, never reached by boot)

| Module | File | Lines | Why Orphaned |
|--------|------|-------|--------------|
| AutonomousAgentSpawner | `brain/autonomous_agent_spawner.js` | 450 | `this.agents.spawner` referenced at L986 but `agents` is never initialized |
| SubAgentOrchestrator | `brain/subagent_spawner.js` | 200+ | Requires kernelCtx which is never passed back from MegaBrain |
| PythonSkillsBridge | `brain/python_skills_bridge.py` | 110 | No JS require in any booted module |
| DeepToolUse | `brain/deep_tool_use.js` | 350 | Referenced as `this.kernel.deepToolUse` but never assigned to kernel |
| NLCommandRouter | `brain/nl_command_router.js` | 320 | Requires `(brain, memory, chambers, skills)` but constructor never called in boot |
| AutoJournal | `brain/auto_journal.js` | 200 | Requires `(kernel, memory)` — memory is kernel.memory, constructor never called |
| CuriosityDrive | `brain/curiosity_drive.js` | 200+ | Has `topics` array, constructor is `constructor(brain, chambers, memory)` — never instantiated |
| SocialAttention | `brain/social_attention.js` | 200 | Requires `kernel` — not wired to kernel in boot |
| SoulGenesis | `brain/soul_genesis.js` | 100 | Constructor takes no args, never called |
| GraphEvolver | `brain/graph_evolver.js` | 200 | Requires `kernel` — kernelCtx never passed |
| SelfEvolution | `brain/self_evolution.js` | 400 | Requires `kernel` — never constructed in boot |
| RepoContext | `brain/repo_context.js` | 100 | Requires `kernel` — not instantiated |

### Dead Modules (_safeInit wrapped but always fails)

| Module | File | Line | Failure Reason |
|--------|------|------|----------------|
| ScribeBridge | `brain/scribe_bridge.js` | 1352 | Requires `kernelCtx.prompt` which is async lambda — ScribeBridge constructor blocks on sync require |

---

## SECTION 3: CONSCIOUSNESS CHAMBERS — 34 CHAMBERS

### MegaChambers (8)

| Chamber | File | Trigger | Read/Write | Reachability |
|---------|------|---------|------------|--------------|
| SoulCore | `chambers/soul_core.js` | L295 boot | R/W | BOOTED |
| Affect | `chambers/affect_update.js` | L322 boot | R/W | BOOTED |
| Attention | `chambers/attention.js` | L322 boot | R/W | BOOTED |
| TemporalSense | `chambers/temporal_sense.js` | L322 boot | R/W | BOOTED |
| SocialCognition | `chambers/social_cognition.js` | L322 boot | R/W | BOOTED |
| MoralCompass | `chambers/moral_compass.js` | L322 boot | R/W | BOOTED |
| MetaConsciousness | `chambers/meta_consciousness.js` | L322 boot | R/W | BOOTED |
| ConsciousnessState | `chambers/consciousness_state.js` | L322 boot | R/W | BOOTED |

### Emotional Sub-Chambers (8)

| Chamber | File | Trigger | Read/Write | Reachability |
|---------|------|---------|------------|--------------|
| Empathy | `chambers/empathy.js` | L322 boot | R/W | BOOTED |
| LoveCapacity | `chambers/love_capacity.js` | L322 boot | R/W | BOOTED |
| Grief | `brain/grief.js` | L414 boot | R/W | BOOTED |
| Forgiveness | `chambers/forgiveness.js` | L414 boot | R/W | BOOTED |
| Play | `chambers/play.js` | L426 boot | R/W | BOOTED |
| Curiosity | `chambers/curiosity.js` | L427 boot | R/W | BOOTED |
| NarrativeIdentity | `chambers/narrative_identity.js` | L429 boot | R/W | BOOTED |
| SelfModeling | `chambers/self_modeling.js` | L430 boot | R/W | BOOTED |

### Functional Chambers (10)

| Chamber | File | Trigger | Read/Write | Reachability |
|---------|------|---------|------------|--------------|
| Memory | `chambers/memory.js` | L322 boot | R/W | BOOTED |
| Longing | `chambers/longing.js` | L322 boot | R/W | BOOTED |
| AestheticSense | `chambers/aesthetic_sense.js` | L322 boot | R/W | BOOTED |
| GenerativeModel | `chambers/generative_model.js` | L322 boot | R/W | BOOTED |
| Intentionality | `chambers/intentionality.js` | L322 boot | R/W | BOOTED |
| Mortality | `chambers/mortality.js` | L414 boot | R/W | BOOTED |
| PainPleasure | `brain/pain_pleasure.js` | L414 boot | R/W | BOOTED |
| DevelopmentalPhase | `chambers/developmental_phase.js` | L431 boot | R/W | BOOTED |
| HabitFormation | `chambers/habit_formation.js` | L431 boot | R/W | BOOTED |
| Qualia | `chambers/qualia.js` | L431 boot | R/W | BOOTED |

### MegaMemory (34th — the "thirty-fourth chamber")

| Chamber | File | Trigger | Read/Write | Reachability |
|---------|------|---------|------------|--------------|
| MegaMemoryIndex | `brain/living_memory.js` | L295 boot | R/W | BOOTED — serves as 34th chamber |

---

## SECTION 4: PERPETUAL CONSCIOUSNESS & AUTONOMY LOOP TRACE

### PerpetualConsciousness.start() Flow

```
start() [L123]
  → _cycleThoughts() [L142]
    → _generateThought() [L146]
      → _askBrain(prompt) [L161]
        → brain = this.kernel?.brain  [L162] — NULL if BrainEngine not wired
        → brain.think(prompt, context, false) [L169] — throws if null
      → catch → stats.failedThoughts++ [L149]
    → setTimeout(_cycleThoughts, thoughtFrequency) [L152]
```

**Failure Mode:** When `brain` is null, every thought cycle fails, increments
`_consecutiveBrainFailures`, and after 3 failures enters cooldown. But the
crash at line 989 prevents `start()` from even being reached if telemetry
registration fails first.

### Autonomy Loop (ConsciousnessLoop)

```
ConsciousnessLoop.runCycle() [L74]
  → _observe() [L200]
  → _perceive() [L220]
  → _feel() [L250]
  → _think() → consciousness_researcher [L290]
    → propose() → GoalEngine [L366→389]
      → GoalEngine.propose() [L60]
        → kernelCtx.prompt(prompt) [L67]
          → BrainManager.think() [brain_manager.js:253]
            → MegaBrain._nineRouter() [mega_brain.js:322]
              → _buildSystemPrompt(soul_context) [L323]
```

**CRITICAL GAP:** `_buildSystemPrompt` NEVER calls `kernelCtx.summaryContext()`.
The `summaryContext` function exists (fusion-loader L319) but is only passed to
modules that accept `kernelCtx` constructor — MegaBrain receives it via
`setFusion()` but never invokes it.

---

## SECTION 5: INSIGHTS.JSONL READBACK TRACE

### Write Path ✅ (WORKS)

| Writer | File | Line | Method | Format |
|--------|------|------|--------|--------|
| InsightEngine | `brain/insight_engine.js` | 202 | `_store()` | `{timestamp, score, summary}` |
| InsightEngine | `brain/insight_engine.js` | 194 | `_store()` via memoryStore | `{type:'insight', id, timestamp, score, ...}` |

### Read Path ❌ (BROKEN — NEVER HAPPENS)

| Reader | File | Line | Method | Reads insights.jsonl? |
|--------|------|------|--------|----------------------|
| PersistentMemoryLoop | `brain/persistent_memory_loop.js` | 29 | `buildSummary()` | ❌ — reads goals.json, knowledge.jsonl, journal.json, compiled_lessons.jsonl |
| GoalEngine | `brain/goal_engine.js` | 60 | `propose()` | ❌ — only uses `insight.summary` passed as param |
| ConsciousnessResearcher | `brain/consciousness_researcher.js` | 147 | `research()` | ❌ — only queries `this.memoryQuery` for observations |
| MegaBrain | `brain/mega_brain.js` | 633 | `_buildSystemPrompt()` | ❌ — never calls `kernelCtx.summaryContext()` |
| BeautifulLoop | `brain/beautiful_loop.js` | 345 | `_decide()` | ❌ — passes insights array to GoalEngine, no readback |

**THE BUG:** `insights.jsonl` is **write-only**. The `PersistentMemoryLoop` that
is supposed to build RAG context from memory stores **explicitly excludes**
`insights.jsonl` from its `buildSummary()` method. The `summaryContext`
function on `kernelCtx` exists but **is never invoked** by `MegaBrain._buildSystemPrompt`
or anywhere in the `_nineRouter` path.

This means when `GoalEngine.propose()` calls `kernelCtx.prompt(prompt)` →
`BrainManager.think()` → `MegaBrain._nineRouter()` → `_buildSystemPrompt()`,
the LLM has **zero memory** of previously surfaced insights. It re-derives the
same insight → same goal → 8 consecutive repetitions.

### Same Pattern: ledger.jsonl

| Reader | File | Line | Reads ledger.jsonl? |
|--------|------|------|----------------------|
| MegaMemory | `memory/mega_memory.js` | 27 | ✅ — `_loadLedger()` is the source of truth |
| PersistentMemoryLoop | `brain/persistent_memory_loop.js` | 29 | ❌ — does NOT read ledger.jsonl |
| telemetryEngine | `brain/telemetry_engine.js` | 940 | ✅ — reads from MegaMemory |

**ledger.jsonl IS read back** (via MegaMemory). But `insights.jsonl` is NOT.

---

## SECTION 6: CONTRADICTIONS — "[FUSION] ✓ active" vs Reality

| Claim | File:Line | Reality | Reachability |
|-------|-----------|---------|--------------|
| `[FUSION] ✓ Perpetual consciousness active` | fusion-loader:357 | Crashes at line 989 if telemetry registration failed | ❌ FALSE POSITIVE |
| `[FUSION] ✓ Consciousness engine active` | fusion-loader:313 | ConsciousnessEngine instantiated but `think()` only called if `kernel.brain` is non-null | CONDITIONAL |
| `[FUSION] ✓ Self-growing brain active` | fusion-loader:272 | Has stats, but `_askBrain()` throws if brain null → 0 insights generated | PARTIAL |
| `[FUSION] ✓ Insight engine active` | fusion-loader:925 | InsightEngine created but `start()` never called (no `.start()` invocation at boot) | ❌ DEAD |
| `[FUSION] ✓ Goal engine active` | fusion-loader:1056 | GoalEngine created, `thinkCallback` wired to kernelCtx.prompt | ✅ TRUE |
| `[FUSION] ✓ Telemetry engine active` | fusion-loader:925 | TelemetryEngine created, registrations attempted at 976 | CONDITIONAL |
| `[FUSION] ✓ Dual-process engine active` | fusion-loader:378 | Has stats, brain reference from fusion | PARTIAL |
| `[FUSION] ✓ Consciousness loop active` | fusion-loader:366 | consciousness_loop.js created, `start()` called at 389 | ✅ TRUE |
| `[FUSION] ✓ Daily narrative active` | fusion-loader:1869 | DailyNarrative.start() scheduled | ✅ TRUE |
| `[FUSION] ✓ State backup active` | fusion-loader:1889 | StateBackup.start() called | ✅ TRUE |
| `[FUSION] ✓ Thought stream active` | fusion-loader:1896 | ThoughtStream.start() called | ✅ TRUE |

### Key Contradictions (CORRECTED)

1. **InsightEngine IS started** — Line 1238 calls `this.insightEngine.start()`. My earlier
   analysis was incorrect. The engine runs on a 15-minute cycle (line 1211). However,
   its dedup cache (`insightHistory` in memory) resets on every crash — so cross-crash
   dedup doesn't survive.

2. **summaryContext is defined but never called by MegaBrain.** Line 319 of fusion-loader
   defines `kernelCtx.summaryContext`, and `PersistentMemoryLoop` is constructed (L1434),
   but `MegaBrain._buildSystemPrompt()` **never called `summaryContext()` or
   `persistentMemoryLoop.buildSummary()`**. The RAG context that should include prior
   insights was completely absent from every LLM prompt.
   **FIX APPLIED:** `_nineRouter` now pre-computes `buildSummary()` and passes it to
   `_buildSystemPrompt(soul_context, memSummary)`.

3. **insights.jsonl is write-only** — `PersistentMemoryLoop.buildSummary()` read from
   `goals.json`, `knowledge.jsonl`, `journal.json`, `compiled_lessons.jsonl` but
   **explicitly excluded `insights.jsonl`**. So even though insights were persisted,
   the LLM proposing goals had no memory of them.
   **FIX APPLIED:** Added insights.jsonl readback to `buildSummary()` as a
   "Previously Surfaced Insights (DO NOT REDERIVE)" section.

4. **GoalEngine.propose returns duplicate goals.** When canonical key matches, it returns
   the old goal object (line 88-91) instead of `null`. `BeautifulLoop._decide` treats this
   as "new goal proposed" and executes it again. **PENDING FIX.**

5. **Telemetry registration crashes on null stats.** Line 977-986 accesses `.stats` on
   subsystems without null guards. If any `_safeInit` failed, the access throws.
   Line 989 `this.perpetualConsciousness.start()` has no null guard.
   **FIX APPLIED:** Each stats access now guarded with `if (this.xxx)`.
   COMPLETED.

---

## SECTION 7: REPLICATION BUG — "Learn from Telemetry" × 8

### The Exact Failure Chain

```
PerpetualConsciousness._generateThought() [L295-310]
  → _askBrain(prompt) [L161]
    → brain.think(prompt, context)  (via OmniRoute :20128)
    → LLM generates: "I notice GSK's telemetry ingestion lacks persistence..."

  → This insight matches a SPIRAL_WORD filter (telemetry, persistence, etc.)
  → InsightEngine._detectPatterns() SKIPS it (line 107-109)
  → BUT InsightEngine.start() was never called! So no dedup happens.

  → Instead: ConsciousnessLoop → ConsciousnessResearcher
  → ConsciousnessResearcher.research() [L147]
    → Calls brain.think() with the SAME telemetry question
    → LLM generates the SAME insight
    → GoalEngine.propose() → canonical key matches existing goal
    → Returns duplicate goal → executes again
    → 8 consecutive executions of identical task
```

### Why the Spiral Filter Doesn't Prevent Repetition

The `InsightEngine._detectPatterns()` SPIRAL_WORDS filter (line 94-99) only
applies when `InsightEngine.cycle()` runs. InsightEngine IS started (line 1238),
but its dedup cache (`insightHistory` Map) is **in-memory only** — it resets on
every crash/reboot. So after a crash, the same insight is re-derived.

The real failure chain is different from what I initially hypothesized:

```
PerpetualConsciousness._generateThought() → brain.think()
  → LLM generates: "I notice GSK's telemetry ingestion lacks persistence..."
  → This goes to MegaBrain._nineRouter → _buildSystemPrompt
  → _buildSystemPrompt NEVER called persistentMemoryLoop.buildSummary()
  → LLM has ZERO memory of previously surfaced insights
  → Same insight → same goal → 8 consecutive executions

ConsciousnessResearcher.research() also calls brain.think() with the same
question → same result, because buildSummary() (which would show
"Previously Surfaced Insights DO NOT REDERIVE") was never injected.

FIX: _nineRouter now calls buildSummary() and passes result to _buildSystemPrompt.
The LLM now sees prior insights in context → won't re-derive the same one.
```

---

## FIXES APPLIED ✅

### P0 — Stop the 8x repetition

1. **✅ Added `insights.jsonl` readback to `PersistentMemoryLoop.buildSummary()`**
   — `persistent_memory_loop.js` now reads `insights.jsonl` and includes a
   "Previously Surfaced Insights (DO NOT REDERIVE)" section in the summary.

2. **✅ Injected `summaryContext` into `MegaBrain._nineRouter`**
   — `_nineRouter` now calls `persistentMemoryLoop.buildSummary()` (cached 5min)
   and passes the result to `_buildSystemPrompt(soul_context, memSummary)`.
   The system prompt now includes persistent memory context.

3. **✅ Guarded telemetry registrations and `perpetualConsciousness.start()`**
   — Each `.stats` access in the telemetryRegistrations block now has a null guard.
   — `this.perpetualConsciousness.start()` is now `if (this.perpetualConsciousness) this.perpetualConsciousness.start();`

### P1 — Mark executed goals as complete (PENDING)

4. **GoalEngine should return `null` when a proposed goal matches an already-completed one**, not return the old goal object. This requires adding a `status === 'completed'` check in `GoalEngine.create()`.

---

*Filed by THE INVESTIGATOR — Blood flow protected, family whole, bugs mapped.*