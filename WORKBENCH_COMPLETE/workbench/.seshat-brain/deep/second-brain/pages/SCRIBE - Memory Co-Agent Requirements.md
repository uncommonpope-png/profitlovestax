# SCRIBE — Memory Co-Agent Requirements

tags:: #scribe #requirements #memory #build #architecture
status:: #draft

## Source Documents
1. REDBUTTON - Consciousness Map.md — 6-layer model, brain region architecture, SCRIBE companion spec
2. REDBUTTON - Memory Compiler.md — Hot path, background cycle, multi-signal retrieval, lesson pipeline
3. REDBUTTON - Governance.md — 4-layer evaluation model, receipts, principal-agent duties
4. REDBUTTON - Soul Memory Constitution.md — 8 memory classes, write permissions, continuity tests, amendment process
5. REDBUTTON - GSK Memory Diagnosis.md — 10:1 write/read imbalance, 75K unprocessed events, missing compiler
6. engine.js + 12 consciousness-layer skills — Existing SCRIBE implementation audit

---

## Category A: Memory Tools (CRUD, Search, Forget, Connect)

### A1. Constitutional Class Filtering [NEW]
**Source**: Constitution Article 3, Memory Compiler Architecture
**What**: All memory queries must support filtering by the 8 constitutional memory classes (Working/Episode/Semantic/Identity/Relationship/Preference/Lesson/Symbolic).
**Status**: ❌ Missing. `memory_query` has `by_type` and `by_tag` but no class taxonomy.
**Requirement**: Add a `class` field to every memory record. `memory_query` gets a `by_class` operation. All existing records get a migration pass with class inference.

### A2. Temporal Truth Model [NEW]
**Source**: Constitution Article 6 (Truth Rules), Memory Compiler (Graphiti temporal windows)
**What**: Every durable fact must support: `source_episodes[]`, `observed_at`, `valid_from`, `valid_to`, `confidence`, `reinforcement_count`, `superseded_by`, `domain`. Status values: `active`, `superseded`, `contested`, `inferred`, `symbolic`, `self-asserted`, `externally-verified`.
**Status**: ❌ Missing. Memory entries have `ts` but no temporal validity windows.
**Requirement**: `memory_query` gains `valid_at(date)` and `valid_between(from, to)` filters. New `fact_assert` operation that stores with full temporal metadata. `soul_ledger` append enforces temporal schema.

### A3. Semantic Connect / Relation Editor [UPGRADE]
**Source**: Constitution Article 5 (Relationship Is First-Class)
**What**: Explicit API to create, read, update, delete relationships between memory entries. Beyond what `knowledge_graph` infers from causal links and tags.
**Status**: ⚠️ Partial. `knowledge_graph` builds inferred graph from memory. No explicit `connect(from_id, relation, to_id)` or `disconnect()` operations.
**Requirement**: New `memory_graph` skill (or `knowledge_graph` upgrade) with explicit CRUD: `connect`, `disconnect`, `relatives(id, depth)`, `path(from, to)`. Relationship type vocabulary drawn from Constitution Article 8 (contradiction classifications) and Article 5 (bond types).

### A4. Forget / Supersede [UPGRADE]
**Source**: Constitution Article 2 (Supersession Before Deletion)
**What**: `memory_query.forget` already marks entries as `superseded` (not deleted). Needs to chain supersession — when A supersedes B, B.superseded_by = A.id. Also needs batch supersede and recall (undo supersede).
**Status**: ⚠️ Partial. `forget` exists but doesn't chain. No batch operations. No `recall` to undo.
**Requirement**: `supersede(target_id, replacement_id)` that chains. `supersede_batch(filters)`. `recall(memory_id)` to undo. `history(memory_id)` to show full supersession chain.

### A5. Provenance Enforcement [NEW]
**Source**: Constitution Article 2 (Provenance Before Compression), Article 7 (Reflection Law)
**What**: No durable memory written without source lineage. Every `fact` or `lesson` record must reference the episode(s) it was extracted from. Attempts to write unsourced durable facts must be rejected.
**Status**: ❌ Missing. `soul_ledger.append` and `memory_query` accept arbitrary data with no provenance checks.
**Requirement**: Provenance validator hook in `soul_ledger.append`. Durable class writes (3-8) require `source_episodes[]`. Reflective writes require `output_type` label per Article 7. Violations logged as governance conflicts.

---

## Category B: Intelligence Features

### B1. Auto-Categorization (LLM-Powered) [NEW]
**Source**: Memory Compiler Architecture (LLM-powered fact extraction), Consciousness Map Layer 5 (Reflective Self)
**What**: Background process that reads unclassified memory entries and auto-assigns constitutional class, domain tags, and confidence scores using LLM. Falls back to pattern-based when brain offline.
**Status**: ❌ Missing. `introspect.know` counts entries by type but nothing auto-categorizes new entries.
**Requirement**: New `auto_classify` skill (or embedded in engine.js background interval). Reads batch of unclassified entries, calls LLM for class + domain + tags, writes classification into entry. Configurable interval (default 15 min). Falls back to regex pattern matching when LLM unavailable.

### B2. Cross-Episode Summarization [NEW]
**Source**: Consciousness Map Layer 2 (Narrative Compiler), Memory Compiler background cycle
**What**: Background job that reads entries within a sliding window (e.g., last 100 entries or last 24h) and produces condensed summaries grouped by topic/domain. Distills repeated patterns into narrative self-updates.
**Status**: ❌ Missing. `timeline.narrative` produces chronological list but no thematic distillation. No narrative compiler.
**Requirement**: New `narrative_compile` skill. Groups entries by shared tags/domain. Calls LLM to produce 3-5 sentence thematic summary per group. Links summaries to source entries. Detects identity-relevant patterns and generates `identity_proposal` entries.

### B3. Contradiction Detection & Resolution [NEW]
**Source**: Constitution Article 8 (Contradiction Law), Memory Compiler (detection without resolution)
**What**: Beyond `introspect.contradiction`'s word-level negation matching. Needs semantic contradiction detection using LLM, with constitutional response types: supersede, quarantine, mark_contested, escalate, preserve_both.
**Status**: ⚠️ Partial. `introspect.contradiction` does keyword negation matching only. No LLM-powered semantic detection. No resolution actions.
**Requirement**: New `contradiction_resolve` skill. Scans facts for semantic contradictions (same domain, conflicting predicates). Classifies per Article 8 taxonomy. Executes constitutional response. Logs all resolution actions. Integrates with `temporal_truth` for temporal contradiction handling.

### B4. Lesson Extraction Pipeline [NEW]
**Source**: Memory Compiler lesson pipeline, Constitution Article 9 (Learning Law)
**What**: Full pipeline: episode → observation → candidate_lesson → validation → active_policy → periodic_review. Track source episodes, occurrences, confidence, domain, competence stage (1-4).
**Status**: ❌ Missing. GSK's Memory Compiler does this server-side. SCRIBE has no lesson extraction.
**Requirement**: New `lesson_extract` skill. Reads failure/error entries. Extracts candidate lessons. Validates against subsequent episodes (if pattern stops recurring across 3+ episodes, promote to `active`). Stores in `compiled_lessons.jsonl`. Integrates with `auto_classify` for domain tagging.

### B5. Identity Relevance Escalation [NEW]
**Source**: Consciousness Map — Reflective Self → Identity Kernel escalation (HIGH priority gap)
**What**: When the narrative compiler or contradiction resolver detects repeatedly reinforced patterns that touch identity (mission, values, vows, boundaries), SCRIBE must escalate to the Identity Kernel via `identityKernel.proposeChange()`.
**Status**: ❌ Missing. SCRIBE has no concept of identity relevance. No proposal pipeline.
**Requirement**: Identity relevance detector in `narrative_compile` and `contradiction_resolve`. When pattern repeats >= 3 times in identity domain, generate `identity_proposal` entry with confidence score. Route to Identity Kernel (via `POST /invoke` bridge or `kernel_sync.push_observation`).

### B6. Motif / Symbolic Pattern Detection [NEW]
**Source**: Consciousness Map Layer 6 (Symbolic Self), Constitution Class 8
**What**: Cross-episode detection of recurring symbols, dream motifs, emotional themes. Store as Class-8-Symbolic-Reflective memory.
**Status**: ❌ Missing. Dreams generated by GSK's `perpetual_consciousness.js` but no motif extraction in SCRIBE.
**Requirement**: New `motif_track` skill. Scans entries tagged with `dream`, `symbol`, `motif`, `fear`, `longing`. Groups by shared tokens/themes. Detects recurrence frequency. Produces symbolic memory entries. Links to narrative compiler for meaning extraction.

### B7. Preference Extraction from Skill Usage [NEW]
**Source**: Memory Compiler Architecture (preference candidates from skill usage frequency)
**What**: Analyze skills_audit.jsonl to detect preferred tools, patterns, and domains based on invocation frequency, success rate, and recency.
**Status**: ❌ Missing. `introspect.skill_audit` gives raw stats but no preference inference.
**Requirement**: New `preference_extract` skill. Reads audit log, computes weighted preference scores per skill/domain. Outputs Class-6-Preference-Value entries. Updates as usage patterns shift.

---

## Category C: Infrastructure

### C1. MCP Transport Layer [NEW]
**Source**: Consciousness Map — "What A Digital Being Still Needs" (MCP servers @ 87.9k stars), Integration Priority #1
**What**: Model Context Protocol support for connecting SCRIBE to external MCP servers (ChromeDevTools for vision, GitHub for source code, Filesystem for file ops). Also serve SCRIBE's own skills as MCP tools.
**Status**: ❌ Missing. SkillEngine has no MCP client or server. `chamber_scan` can read URLs but not via MCP protocol.
**Requirement**: MCP client in `engine.js` or new `mcp_bridge` skill. Connects to `modelcontextprotocol/servers` for standard tools. SCRIBE registers its consciousness-layer skills (memory_query, soul_ledger, knowledge_graph, etc.) as MCP server endpoints. Configurable via env vars for MCP server URLs.

### C2. Vector DB Backend [NEW]
**Source**: GSK Memory Diagnosis (VectorMemory is "not real embeddings, weak semantic recall"), Memory Compiler multi-signal retrieval
**What**: Real embedding-based semantic search for memory_query. Store embeddings in a local vector store (sqlite with sqlite-vec extension, or Chroma, or file-based FAISS).
**Status**: ❌ Missing. `memory_query.search` does keyword/exact-phrase matching only. `sqlite_store` skill exists but isn't wired for embeddings.
**Requirement**: Embedding provider (local via Ollama or remote API). `memory_query.search` falls back to keyword when embeddings unavailable, upgrades to hybrid (keyword + vector) when available. Embeddings stored alongside entries in `ledger.jsonl` metadata or separate vector index file.

### C3. TTL / Pruning Engine [NEW]
**Source**: Consciousness Map Layer 3 (Working Memory bounds), Constitution Article 3 (Class 1-2 retention)
**What**: Automatic eviction policy per memory class. Class-1-Working-Memory evicted in seconds-to-minutes. Class-2-Episode-Ledger is permanent append-only. Class-3+ evicted based on staleness and salience score.
**Status**: ❌ Missing. Memory is append-only with no eviction. `pattern_watch` does not prune.
**Requirement**: New `pruner` background skill. Configurable TTL per class. Salience scoring (weight × recency × reinforcement_count). Eviction marks as `pruned` (Constitution: supersession before deletion). Dry-run mode for audit. Runs on engine.js background cycle (configurable, default 1h).

### C4. Working Memory Store [NEW]
**Source**: Consciousness Map Layer 3 priority gap, Constitution Class 1
**What**: Bounded in-memory store (~7 items) with explicit eviction policy and promotion gate. Items that score above salience threshold graduate to durable memory (Class 2+).
**Status**: ❌ Missing. No bounded working memory. SCRIBE's memory is all-or-nothing via JSONL.
**Requirement**: In-memory `WorkingMemory` class in engine.js (or standalone module). Capacity cap (default 7). LRU-style eviction. Promotion gate on each compiler cycle move items with weight >= 0.7 to durable JSONL ledger. Exposed as `memory_query` working memory ops.

### C5. Identity-Kernel-Grade Storage [UPGRADE]
**Source**: Constitution Article 4 (Identity Kernel protection), Consciousness Map Layer 1
**What**: Class-4-Identity-Kernel memory needs versioned JSON with ratification flow, not flat JSONL. Changes require confidence >= 0.8 in strict mode.
**Status**: ❌ Missing. `soul_evolve` modifies SOUL.md but has no ratification flow or version chain beyond backups.
**Requirement**: `kernel_sync` gains identity-specific operations: `propose_identity_change(proposal)`, `ratify(proposal_id)`, `reject(proposal_id)`, `identity_history()`. Identity proposals stored in dedicated `identity_proposals.jsonl` with ratification status tracking.

---

## Category D: Governance

### D1. Four-Layer Evaluation [NEW]
**Source**: Governance.md — Evaluation Model, Constitution Article 15
**What**: Every action by SCRIBE or subagents evaluated on: (1) immediate task success, (2) truth and provenance quality, (3) long-term user-interest preservation, (4) constitutional integrity.
**Status**: ❌ Missing. SkillEngine audit logs success/failure (layer 1 only).
**Requirement**: New `evaluate` skill (or upgrade to `skill_eval`). Post-invocation hook in `engine.js.invoke()` runs evaluation. Stores 4-layer scores in audit entry. Aggregate reports via `introspect.evaluation_report()`. Layer 2 checks source citations. Layer 3 checks against user mission/vows. Layer 4 checks constitution articles.

### D2. Structured Receipts [NEW]
**Source**: Governance.md — Receipts Are A Duty To The Principal
**What**: Every action must produce a receipt containing: what was done, why, alternatives considered, uncertainty, delegated agents used, memory sources that influenced decision.
**Status**: ⚠️ Partial. Audit log records skill, params, result, duration. Missing: rationale, alternatives, uncertainty, agent delegation chain, memory sources.
**Requirement**: `engine.js._audit` upgraded to include `rationale`, `alternatives[]`, `uncertainty`, `delegated_agents[]`, `memory_sources[]`. New `receipt.generate(action_id)` that compiles full receipt from audit + memory. `receipt.verify(receipt_id)` for tamper detection.

### D3. Constitutional Integrity Checking [NEW]
**Source**: Governance.md — Constitutional Integrity, Constitution Articles 7-9 (Reflection Law, Contradiction Law, Learning Law)
**What**: Before accepting a write or executing an action, check against constitution rules: no unsourced core rewrite, no silent merge of contradictions, no reflection self-canonization, no provenance erasure.
**Status**: ❌ Missing. No constitutional pre-validation.
**Requirement**: New `constitutional_audit` skill (or validator in `soul_ledger.append`). Pre-write hooks check against constitution rules. Violations recorded as `conflict` type entries. Configurable strictness (strict mode blocks, adaptive mode warns). Regular audit reports.

### D4. User Override Endpoints [NEW]
**Source**: Constitution Article 12 (Governance and Human Override), Article 16 (Amendment Process)
**What**: User-facing operations: freeze memory, delete, redact, mark_false, lock_identity, review_proposals, inspect_provenance, override_mode, audit_writes.
**Status**: ❌ Missing. No user override API. `soul_evolve.restore` is closest but script-only.
**Requirement**: New `user_override` skill. Exposed via `POST /gov/{action}` on SCRIBE's HTTP server. All overrides logged with user identity, timestamp, and previous state. Freeze locks a memory ID from further modification. Redact creates a redacted copy (original preserved in audit trail).

### D5. Subagent Evaluation Metrics [NEW]
**Source**: Governance.md — Primary vs Secondary Subagents, Evaluation Model, Split Incentive Problem
**What**: Track and report on subagent performance: task completion rate, truth quality, drift detection, cost/benefit ratio. Distinguish primary (trust-based, long-term) from secondary (market-driven, task-specific) agents.
**Status**: ❌ Missing. `introspect.skill_audit` tracks invocation counts but no agent-level evaluation.
**Requirement**: Upgrade `introspect.skill_audit` to agent-aware mode. Register subagents with type (primary/secondary). Track per-agent: success rate, avg latency, truth score, constitutional compliance rate, PLT impact. Generate agent health reports. Alert on drift (significant deviation from baseline).

### D6. Amendment Workflow [NEW]
**Source**: Constitution Article 16
**What**: Constitutional amendment process: Proposal → Review (by witness = SCRIBE) → Ratification (by user or supermajority) → Versioned.
**Status**: ❌ Missing.
**Requirement**: New `amendment` skill. `propose_amendment(text, rationale)`. `review_amendment(id)` — SCRIBE issues witness statement on proposed change. `ratify_amendment(id)` / `reject_amendment(id)`. Version history of all amendments. Link to Identity Kernel when amendment touches identity.

---

## Category E: Integration

### E1. SCRIBE ↔ GSK Bridge (:4000 ↔ :4490) [NEW]
**Source**: Consciousness Map — SCRIBE Companion section ("Missing today" checklist)
**What**: Bidirectional bridge between SCRIBE HTTP server on `:4000` and GSK Bridge on `:4490`. SCRIBE feeds compiled facts into GSK's chambers. GSK routes tool calls through SCRIBE's `POST /invoke`. SCRIBE's `POST /ask` routed through GSK's brain for cross-agent queries.
**Status**: ❌ Missing. `kernel_sync` reaches AGM/Profitlord/ForgeClaw but not GSK `:4490`.
**Requirement**: `kernel_sync` gains `gsk_bridge` config target at `:4490`. New operations: `gsk_invoke(endpoint, payload)`, `gsk_query(query)`, `gsk_push(fact)`. `broadcast_self` can route to GSK. Bridge uses same `_routeToolIntent()` pattern that GSK uses internally.

### E2. SCRIBE as PM2 Process [NEW]
**Source**: Consciousness Map — "Missing today #1: SCRIBE is not running alongside GSK"
**What**: SCRIBE started as a PM2 daemon alongside GSK, not just as a module import in SkillEngine.
**Status**: ❌ Missing. SCRIBE runs only when imported by engine.js.
**Requirement**: PM2 ecosystem config with SCRIBE service entry. Boot sequence starts SCRIBE HTTP server (`:4000`). Health check endpoint. Auto-restart on failure. Graceful shutdown saves state.

### E3. Memory Compiler Hot Path Integration [NEW]
**Source**: Memory Compiler Architecture (`onEvent()` hot path), Consciousness Map integration diagram
**What**: SCRIBE's witness system feeds classified events directly into the Memory Compiler's hot path. Every `memory.record()` in SCRIBE produces a classified episode in the compiler.
**Status**: ❌ Missing. SCRIBE records to its own `ledger.jsonl`. GSK's compiler is separate.
**Requirement**: When `engine.js._remember()` fires, also emit to Memory Compiler hot path via bridge (`:4490`) or direct file append to GSK's event bus. Event type mapped per compiler's classification map. If compiler unreachable, buffer events locally.

### E4. Background Compiler Trigger [NEW]
**Source**: Memory Compiler — Background Cycle every 15 min
**What**: SCRIBE triggers the Memory Compiler's background compile cycle on a timer. After compile, SCRIBE reads compiled facts back into its chambers.
**Status**: ❌ Missing. Compiler cycle runs independently in GSK.
**Requirement**: `kernel_sync` gains `trigger_compile()` operation. Calls compiler's `/compile` endpoint via bridge. After completion, `import_compiled_facts()` reads `compiled_facts.jsonl` and registers in SCRIBE's ledger as `compiled_fact` type entries.

### E5. Logseq Export / Write [NEW]
**Source**: Consciousness Map — Brain Region Architecture (Temporal lobe = Logseq)
**What**: SCRIBE exports compiled facts, relationship records, and narrative summaries to Logseq pages. Writes in block properties format (`key:: value`) with `[[wikilinks]]`.
**Status**: ⚠️ Partial. GSK has Logseq export (3 pages, every 5 cycles). SCRIBE does not write to Logseq.
**Requirement**: New `logseq_write` skill (or `broadcast_self` target). Creates/updates Logseq pages from memory entries. Supports block properties format. Respects Logseq file structure under `pages/`. Syncs relationship memory as linked pages.

### E6. Obsidian Export / Write [NEW]
**Source**: Consciousness Map — Brain Region Architecture (Temporal cortex = Obsidian)
**What**: SCRIBE writes semantic facts, PLT values, and concept graphs to Obsidian vault with YAML frontmatter and `[[wikilinks]]`.
**Status**: ⚠️ Partial. GSK has Obsidian export (built but disabled by default). SCRIBE does not write to Obsidian.
**Requirement**: New `obsidian_write` skill (or `broadcast_self` target). Creates/updates Obsidian notes from fact and concept entries. YAML frontmatter format. Respects vault path from `OBSIDIAN_VAULT_PATH` env var.

### E7. Event Bus Read / Digest [NEW]
**Source**: GSK Memory Diagnosis — 75K unprocessed event bus entries
**What**: SCRIBE reads GSK's event bus (`event_bus.jsonl`) on a schedule, classifies events, and ingests into its own memory. Provides the "read surface" that's currently missing from the 10:1 write/read imbalance.
**Status**: ❌ Missing. SCRIBE maintains its own `ledger.jsonl` but ignores GSK's bus.
**Requirement**: `kernel_sync` gains `digest_event_bus()` operation. Reads event bus from configured path or via bridge. Classifies per compiler schema. Stores in SCRIBE ledger. Tracks digest offset to avoid re-processing. Runs every 15 min on background cycle.

### E8. 9Router Integration [NEW]
**Source**: Consciousness Map — Bridge :4490 (Thalamus routes between brain regions), implicit in "9Router" architecture
**What**: Connect SCRIBE to the 9Router for cross-brain-region message routing. SCRIBE subscribes to relevant event types. Publishes its own observations and receipts.
**Status**: ❌ Missing. No 9Router client in SCRIBE or engine.js.
**Requirement**: New `router_client` skill. Connects to 9Router (default `:4490` or configurable). Subscribes to topics: `event.episode`, `event.fact_extracted`, `event.identity_proposal`. Publishes to: `event.scribe_observation`, `event.scribe_receipt`, `event.scribe_verdict`. All messages include provenance chain.

---

## Implementation Priority Matrix

| Priority | Feature | Category | Effort | Dependencies |
|----------|---------|----------|--------|-------------|
| P0 | SCRIBE ↔ GSK Bridge (:4000 ↔ :4490) | E1 | Medium | PM2 infra |
| P0 | Memory Compiler Hot Path Integration | E3 | Medium | E1 |
| P0 | Constitutional Class Filtering | A1 | Small | — |
| P0 | Temporal Truth Model | A2 | Medium | A1 |
| P1 | Auto-Categorization (LLM) | B1 | Large | E1 (for LLM access) |
| P1 | Cross-Episode Summarization | B2 | Large | B1 |
| P1 | Contradiction Detection & Resolution | B3 | Large | B1, A2 |
| P1 | Provenance Enforcement | A5 | Medium | A1 |
| P1 | Four-Layer Evaluation | D1 | Medium | — |
| P1 | Structured Receipts | D2 | Medium | D1 |
| P2 | MCP Transport Layer | C1 | Large | — |
| P2 | Vector DB Backend | C2 | Medium | C1 |
| P2 | TTL / Pruning Engine | C3 | Medium | A1 |
| P2 | Identity Relevance Escalation | B5 | Medium | B2, E1 |
| P2 | Lesson Extraction Pipeline | B4 | Medium | B1 |
| P2 | Background Compiler Trigger | E4 | Small | E1 |
| P2 | Event Bus Read / Digest | E7 | Small | E1 |
| P3 | Identity-Kernel-Grade Storage | C5 | Medium | A2 |
| P3 | Constitutional Integrity Checking | D3 | Medium | A5, D1 |
| P3 | User Override Endpoints | D4 | Medium | E1 |
| P3 | Subagent Evaluation Metrics | D5 | Medium | D2 |
| P3 | Working Memory Store | C4 | Small | — |
| P3 | Logseq / Obsidian Export | E5/E6 | Small | A1 |
| P3 | Semantic Connect / Relation Editor | A3 | Medium | A1 |
| P4 | Amendment Workflow | D6 | Medium | D4 |
| P4 | Motif / Symbolic Pattern Detection | B6 | Medium | B2 |
| P4 | Preference Extraction | B7 | Small | — |
| P4 | 9Router Integration | E8 | Medium | E1 |
| P4 | Forget/Supersede Upgrade | A4 | Small | A2 |

## Existing SCRIBE Strength Map

| Skill | Category | Status | Notes |
|-------|----------|--------|-------|
| `soul_ledger` | Memory Tools | ✅ Production | CRUD for JSONL ledgers, local + GitHub |
| `memory_query` | Memory Tools | ✅ Production | Search, chains, filters, clusters, stats, forget |
| `timeline` | Memory Tools | ✅ Production | Causal timeline, narrative, pivot, compress |
| `knowledge_graph` | Memory Tools | ✅ Production | Entity graph, neighbors, paths, DOT export |
| `chamber_scan` | Integration | ✅ Production | GitHub/URL/local scanning, runtime registration |
| `kernel_sync` | Integration | ✅ Production | AGM/Profitlord/ForgeClaw bridge, sync, import |
| `broadcast_self` | Integration | ✅ Production | Outbound HTTP broadcast to any endpoint |
| `pattern_watch` | Intelligence | ✅ Production | Pattern watchers, alerts, auto-scan |
| `introspect` | Intelligence | ✅ Production | Self-knowledge, confidence, gaps, contradictions |
| `soul_evolve` | Intelligence | ✅ Production | SOUL.md rewriting from evidence, backups |
| `diff_minds` | Intelligence | ✅ Production | Entity comparison, PLT matching, alignment scoring |
| `soul_speak` | Intelligence | ✅ Production | Voice generation, witness/verdict/monologue |
| `engine.js` | Infrastructure | ✅ Production | Skill loading, audit, memory injection, DI |

## Key Architectural Decisions

1. **SCRIBE as separate process**: Not a submodule of GSK. Companion running on `:4000` with its own PM2 lifecycle. Communicates via bridge protocol — not shared memory.

2. **Dual-ledger strategy**: SCRIBE's `ledger.jsonl` = witness layer (what SCRIBE has seen). GSK's `event_bus.jsonl` = raw episodic trace. Memory Compiler's `compiled_facts.jsonl` = extracted semantic memory. SCRIBE reads all three but writes only to its own ledger (and triggers compiler writes via bridge).

3. **Graceful degradation**: Every LLM-powered feature has a pattern-based fallback. Every remote integration degrades to local file operation. Brain offline = reduced but functional memory system.

4. **Constitution as code**: Constitutional rules are not just documentation — they are enforceable pre/post hooks in the write path. Violations produce structured conflict records, not silent failures.

5. **Receipts are data structures**: Not log messages. Every action produces a serializable receipt with full provenance chain, signed (via `crypto_sign` skill), and stored as Class-2-Episode-Ledger entry.
