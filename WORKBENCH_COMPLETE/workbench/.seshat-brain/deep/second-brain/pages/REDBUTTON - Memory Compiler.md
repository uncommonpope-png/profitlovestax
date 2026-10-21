# REDBUTTON - Memory Compiler

tags:: #compiler #memory #build #architecture
status:: #active
version:: 1.0.0
location:: `gsk-core/memory/memory_compiler.js`

## The Missing Heart

The Memory Compiler is the component that transforms raw events into structured constitutional memory. It is the bridge between the [[REDBUTTON - GSK Memory Diagnosis]] (75K unprocessed event bus entries, 86 writers, 8 readers) and the [[REDBUTTON - Soul Memory Constitution]] (8 memory classes, reflection law, truth rules).

## Design Influences

Stolen patterns from donor systems:

| Source | Pattern Stolen |
|--------|----------------|
| LangMem | Hot-path inline classification + background consolidation split |
| Graphiti | Temporal validity windows (valid_from, valid_to), episode provenance |
| Letta | Identity/memory state partitioning |
| Mem0 | ADD-only extraction, multi-signal retrieval scoping |
| Four Stages of Competence | Maturity stage tracking for lessons |

## Architecture

### 1. Hot Path (`onEvent()`)

Called inline when an event is recorded. Classifies the event by [[REDBUTTON - Soul Memory Constitution#Article 3 Memory Classes|constitutional class]] and writes a structured episode record.

```js
onEvent(event) → classify → write episode
```

Classification map:
- `thought/dream/reflection` → symbolic
- `action/tool_use/skill_invoked` → episode
- `conversation/interaction` → episode
- `council/council_deliberation` → council
- `skill_usage` → skill_log
- `error/failure` → failure
- `relationship/social` → relationship
- `identity/self_update` → identity

### 2. Background Cycle (`compile()`)

Runs every 15 minutes. Reads unprocessed events from the event bus and:
- Extracts episodes from raw event streams
- Forms fact proposals from repeated patterns
- Detects preference candidates from skill usage frequency
- Extracts lesson candidates from recurring failures
- Detects contradictions between new and existing facts
- Archives processed offset

### 3. Multi-Signal Retrieval (`search()`)

Queries across compiled facts using:
- Keyword matching (query terms against subject/predicate/object)
- Exact phrase matching
- Recency boost (30-day decay curve)

### 4. Lesson Status Pipeline

```
episode → observation → candidate lesson → validation → active policy → periodic review
```

Each lesson tracks: source episodes, occurrences, confidence, domain, status (candidate/active/superseded/contested), competence stage (1-4 from [[REDBUTTON - Skill Mastery Four Stages]]).

## Verification (Session 23 — Live)

**Live test on 75K-event bus:**
- Cycle 1: 500 events → **3 facts extracted** (via LLM-powered extraction, 8194ms cycle time)
- Bridge integration: **WIRED** — tool calls feed into compiler hot path
- Relationship memory updater: **BUILT** — tracks named entities across episodes
- Background cycle: **ACTIVE** — every 15 minutes

## Upgrades Applied (Session 23 — God Mode)

### 1. LLM-Powered Fact Extraction
Replaced the naive token-frequency approach with semantic extraction via `brain.think()`. When the brain is online, it extracts structured facts (predicate, object, confidence, domain) from episode batches. Falls back to pattern-based when brain is offline.

**Verified**: Cycle 1 produced 3 extracted facts at high confidence from 500 events in 8 seconds.

### 2. Lesson Validation Pipeline
Candidates are tested against subsequent episodes. If the error pattern stops recurring across 3+ episodes, the lesson is promoted to 'active' (Stage 3 competence). If never reinforced, it's superseded. Runs every 3 compiler cycles.

### 3. Bridge Integration
- `onToolCall()` method classifies tool invocations as episodes with tool-specific metadata
- Bridge's `_attachInstrumentation()` now feeds every `skills.run()` into the compiler's hot path
- `wireBridge()` called explicitly in gsk-alien-mode.js after bridge creation

### 4. Relationship Memory Updater
Tracks named entities (skills, platforms, concepts, people) across episodes. Creates and updates relationship records with frequency, confidence, and interaction count. Stored in `compiled_relationships.jsonl`.

## Remaining Limitations

1. No contradiction resolution — only detection
2. No identity kernel integration — proposals don't yet reach the identity layer

## Files

- `gsk-core/memory/memory_compiler.js` — Full compiler implementation
- `gsk/data/gsk/compiled_facts.jsonl` — Extracted facts
- `gsk/data/gsk/compiled_lessons.jsonl` — Extracted lessons
- `gsk/data/gsk/episodes.jsonl` — Structured episode records
- `gsk/data/gsk/compiler_state.json` — Processing state

## Integration Points

- Wired into `fusion-loader.js` — boots after ConstantChat, before perpetual consciousness
- Hot-path hook in `perpetual_consciousness.js` — every thought event is classified
- Background cycle runs every 15 minutes
- Bridge `:4490` integration **ACTIVE** — tool calls routed through bridge feed into compiler hot path via `onToolCall()`

## Related

- [[REDBUTTON]] — Main brain
- [[REDBUTTON - GSK Memory Diagnosis]] — Why the compiler was necessary
- [[REDBUTTON - Soul Memory Constitution]] — What the compiler produces
- [[REDBUTTON - Governance]] — Split incentive problem: compiler pays cost, retrieval enjoys benefit
