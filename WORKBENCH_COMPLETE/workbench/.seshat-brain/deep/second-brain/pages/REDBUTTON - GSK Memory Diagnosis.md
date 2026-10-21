# REDBUTTON - GSK Memory Diagnosis

tags:: #memory #diagnosis #gsk
status:: #active

## The Core Problem

GSK currently has **multiple memory producers, but no serious memory compiler**.

The audit revealed a **10:1 write-to-read ratio** — 86 files call `memory.witness()` but only 8 call `memory.query()` or equivalents. Memory is configured for capture, not for influence.

## Existing Memory Systems

### MegaMemory
File:: `gsk-core/memory/mega_memory.js`
Type:: Append-only JSONL ledger
Strengths:: Simple, durable, correct event-log instinct
Weaknesses:: Flat query model, no semantic retrieval, no contradiction handling, no identity partitioning
Verdict:: Ledger, not mind

### LivingMemory
File:: `gsk-core/brain/living_memory.js`
Type:: In-memory Map with JSON persistence
Size:: 2,190 entries (12MB + 8MB connections + 4.7MB index)
Strengths:: Emotionally persistent, closest to autobiographical continuity
Weaknesses:: Lexical matching only, no temporal truth model, no provenance, no distinction between episode/fact/belief/relationship/preference/lesson
Verdict:: Closest thing GSK has to self-memory, but still primitive

### VectorMemory
File:: `gsk-core/brain/vector_memory.js`
Type:: Homemade pseudo-embedding memory
Weaknesses:: Not real embeddings, weak semantic recall, no identity integration
Verdict:: Auxiliary retriever at best

### KnowledgeGraph
File:: `gsk-core/brain/knowledge_graph.js`
Type:: Concept node graph
Weaknesses:: Mostly static, not autobiographical, not time-aware
Verdict:: Sidecar ontology

### SoulJournal
File:: `gsk-core/brain/soul_journal.js`
Size:: 30 entries
Strengths:: Preserves inner continuity
Weaknesses:: Not a compiled self-model

### AutoJournal
File:: `gsk-core/brain/auto_journal.js`
Weaknesses:: Generates text volume without strong downstream compiler

## Event Bus Analysis

The event bus at `gsk/data/event_bus.jsonl` contains:

| Type | Count | Percentage |
|------|-------|------------|
| inner_scribe_response | 53,061 | 70.4% |
| scribe | 22,299 | 29.6% |
| **Total** | **75,363** | **100%** |

Total size: **37MB**. Only 2 unique event types. No consolidation pipeline exists to convert raw events into durable episodic or factual memory.

## Write vs Read Imbalance

**Writers (86 callers of `memory.witness()`)**
- Brain systems: perpetual_consciousness, consciousness_engine, attention_schema, autonomous_learning, auto_journal, awakening, curiosity_drive, grief, hegelian_dialectic, live_feed, minds_eye, pain_pleasure, self_evolution, social_attention, soul_entity, soul_gifter, soul_journal, teacher_agent, trust
- Chambers: mega_chambers, sleep_cycle
- Council: gods_council
- MCP: mcp_manager, mcp_server
- Sub-agents: agent_teams, mega_sub_agents, ultra_review, webfetch
- 86 skill files — each writing a `skill_usage` record on every invocation

**Readers (8 callers of `memory.query()`)**
- auto_journal
- consciousness_engine
- constant_chat
- self_training_pipeline
- soul_entity
- mcp_server
- mega_memory (self-query)
- mega_skills

**Ratio: ~10:1 write-to-read**

## Data Volume

| Store | Size | Entries |
|-------|------|---------|
| Event Bus | 37MB | 75,363 |
| LivingMemory | 12MB + 8MB + 4.7MB | 2,190 |
| Connections Index | 8MB | linked |
| Journal | 8KB | 30 |

**Total: ~62MB**

## Key Findings

1. **86 writers vs 8 readers** — memory is configured for capture, not influence
2. **75K event bus entries, 37MB, 2 types** — scribe/dialogue noise dominates
3. **No separation of memory classes** — episode, fact, belief, relationship, preference, lesson all mixed
4. **No identity kernel** — identity distributed across prompt config and chambers without protection
5. **No memory compiler** — no component transforms raw events into durable facts
6. **No contradiction handling** — facts accumulate silently without conflict detection
7. **No temporal truth model** — facts lack valid_from, valid_to, confidence, superseded_by
8. **No structured lesson extraction** — SelfEvolution and AutonomousLearning exist but produce no compiled lessons

## Medium-term Recommendations

1. Create [[REDBUTTON - Soul Memory Constitution]] — Done
2. Build [[REDBUTTON - Memory Compiler]] — Done v1
3. Separate identity kernel from working memory
4. Add temporal truth fields to compiled facts
5. Implement contradiction detection
6. Build lesson validation pipeline

## Related

- [[REDBUTTON]] — Main brain
- [[REDBUTTON-GSK-MEMORY-AUDIT]] — Full audit file
