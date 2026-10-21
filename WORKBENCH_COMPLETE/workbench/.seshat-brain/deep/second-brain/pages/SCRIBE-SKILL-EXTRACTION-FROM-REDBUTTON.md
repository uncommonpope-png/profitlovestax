# SCRIBE Skill Extraction — From REDBUTTON Doctrine

## Purpose
Extract every concrete skill/tool the REDBUTTON documents demand, map each to its constitutional source, and prioritize for build order. This is the build plan for SCRIBE's memory-specialist capabilities.

---

## Category 1: Memory Compilation (Extraction, Consolidation, Lesson Validation)

### Skill 1: `classify-event`
- **Source**: Memory Compiler hot path (`onEvent()`), Article 3 Memory Classes
- **Concept**: Constitutional event classification — every raw event must be tagged by class before storage
- **Classification map**:
  - `thought/dream/reflection` → symbolic (Class 8)
  - `action/tool_use/skill_invoked` → episode (Class 2)
  - `conversation/interaction` → episode (Class 2)
  - `council/council_deliberation` → council (Class 2 sub)
  - `skill_usage` → skill_log (Class 7 sub)
  - `error/failure` → failure (Class 2 sub)
  - `relationship/social` → relationship (Class 5)
  - `identity/self_update` → identity (Class 4)
- **What it does**: Called inline on every event. Classifies the event, enriches with constitutional metadata, writes structured episode record. The gateway to all downstream memory.
- **Priority**: **P0** — without classification, no memory pipeline functions

### Skill 2: `extract-facts`
- **Source**: Memory Compiler background cycle, Article 3 Class 3 (Semantic Fact Memory)
- **Concept**: Transforms raw episodes into structured semantic facts with predicate/object/confidence/domain
- **What it does**: Background job (every N cycles). Reads unprocessed event bus entries, extracts facts via LLM (`brain.think()`) with pattern-based fallback. Produces `compiled_facts.jsonl` with full temporal truth fields (valid_from, valid_to, source_episodes, confidence, reinforcement_count, superseded_by, domain).
- **Priority**: **P0** — facts are the backbone of semantic memory

### Skill 3: `validate-lessons`
- **Source**: Memory Compiler lesson status pipeline, Article 9 Learning Law
- **Concept**: Full lesson lifecycle — episode → observation → candidate lesson → validation → active policy → periodic review
- **What it does**: Manages lesson status transitions. Candidates tested against subsequent episodes. If error pattern stops recurring across 3+ episodes → promoted to 'active' (Stage 3 competence). If never reinforced → superseded. Tracks competence stages (1-4). Each lesson tracks: source episodes, occurrences, confidence, domain, status (candidate/active/superseded/contested).
- **Priority**: **P0** — learning must change conduct (Constitutional Principle 8)

### Skill 4: `track-relationships`
- **Source**: Memory Compiler relationship memory updater, Article 3 Class 5 (Relationship Memory)
- **Concept**: Named entity tracking across episodes with frequency, confidence, interaction count
- **What it does**: Scans episodes for named entities (skills, platforms, concepts, people). Creates/updates relationship records. Stores in `compiled_relationships.jsonl`. Relationship is first-class (Constitutional Principle 7).
- **Priority**: **P1** — compiler v1 exists but relationship tracking needs strengthening

### Skill 5: `archive-lesson-policy`
- **Source**: Article 3 Class 7 (Lesson/Policy Memory), Layer 5 Reflective Self
- **Concept**: Durable storage for validated lessons as executable policies that alter future behavior
- **What it does**: Takes validated active lessons and compiles them into structured policy records. Each policy has: triggering conditions, required behavior change, domain, source episodes, confidence threshold, last-reviewed timestamp. Policies feed into system prompt as behavioral directives.
- **Priority**: **P1** — bridges lesson validation → actual behavior change

---

## Category 2: Truth & Contradiction (Detection, Resolution, Temporal Validity)

### Skill 6: `validate-temporal-truth`
- **Source**: Article 6 Truth Rules, Graphiti pattern (valid_from, valid_to, episode provenance)
- **Concept**: Every durable fact has temporal validity windows. No fact is permanently true.
- **What it does**: Enforces temporal truth model on all compiled facts. Ensures: source_episodes, observed_at, valid_from, valid_to, confidence, reinforcement_count, superseded_by, domain. Manages status transitions (active → superseded → contested → inferred → symbolic → self-asserted → externally verified). Prevents silent overwriting.
- **Priority**: **P0** — temporal truth is a constitutional requirement, currently missing from GSK

### Skill 7: `detect-contradiction`
- **Source**: Article 8 Contradiction Law classifications, Memory Compiler `_detectAndResolveContradictions()`
- **Concept**: Six contradiction classifications and four prohibited resolutions
- **What it does**: Scans compiled facts for conflicts across: temporal change, ambiguous evidence, source conflict, self-conflict, relationship conflict, symbolic vs literal. Produces structured contradiction records with classification, conflicting facts, and timestamps. Does NOT resolve — that is a separate skill.
- **Priority**: **P0** — detection is gateway to all contradiction governance

### Skill 8: `resolve-contradiction`
- **Source**: Article 8 Contradiction Law responses
- **Concept**: Six constitutional resolution strategies and three prohibitions
- **What it does**: Takes contradiction records and applies constitutional resolution: supersede (old truth marked, new wins), quarantine (ambiguous evidence isolated), mark contested (both preserved with conflict flag), escalate (user decides), preserve both with scope labels, resolve through source priority order. Prohibited: silent merge, drop without recording, smooth over without evidence.
- **Priority**: **P1** — detection exists (Memory Compiler v1), resolution must be built

### Skill 9: `detect-corruption`
- **Source**: Article 13 Corruption Conditions (8 conditions)
- **Concept**: Eight detectable corruption patterns in memory state
- **What it does**: Periodic scan for: (1) unsourced core belief rewrite, (2) silent contradiction collapse, (3) summary replacing source, (4) retrieval from wrong scope, (5) relationship memory leakage, (6) symbolic memory mistaken for fact, (7) reflection self-canonization, (8) narrative drift without provenance. Each detection produces a corruption record with severity and source trace.
- **Priority**: **P1** — critical for constitutional integrity, enables self-healing

### Skill 10: `reconcile-witness-fact`
- **Source**: Layer 4 Witness Self (append-only, immutable) vs Layer 3 Semantic Fact (compiled, interpretive)
- **Concept**: The gap between what the Witness recorded (ground truth) and what the Compiler extracted (interpreted fact)
- **What it does**: Periodically compares witness records against compiled facts from the same episodes. Detects: fact overreach (claiming more than witnessed), fact omission (missing what was witnessed), drift (compiled version diverges from source). Produces reconciliation reports. Never alters witness layer.
- **Priority**: **P1** — prevents narrative drift without provenance (Corruption Condition 8)

---

## Category 3: Memory Governance (Reflection Law, Write Permissions, Evaluation)

### Skill 11: `label-reflection-output`
- **Source**: Article 7 Reflection Law — output labeling requirements, Layer 5 governance
- **Concept**: Every reflection output must carry a type label and confidence score
- **Type labels**: observation, recollection, reconstruction, interpretation, hypothesis, proposal, candidate self-update
- **What it does**: Intercepts reflection outputs before storage. Validates type label presence and appropriateness. Confirms confidence score included. Blocks auto-canonization (no reflection output can directly become fact). Blocks identity kernel rewrite (candidate self-update must go through ratification). Blocks provenance stripping.
- **Priority**: **P0** — reflection governance is constitutionally mandated

### Skill 12: `enforce-write-permissions`
- **Source**: Article 4 Write Permissions, Layer interaction rules (upward delegation, downward observation)
- **Concept**: Each agent role has defined write permissions. Unauthorized writes must be blocked.
- **Permissions matrix**:
  | Actor | May Write | May NOT Write |
  |-------|-----------|---------------|
  | Actor Self | Episodes, Working Memory | Identity Kernel directly |
  | Witness/Scribe | Ledger entries, receipts | Self-beliefs |
  | Memory Compiler | Fact/lesson proposals | Identity Kernel rewrite |
  | Truth Keeper | Supersede facts, mark contradictions | — |
  | Reflective Self | Interpretations, proposals | Canonize directly |
  | User | Override, edit, delete, freeze, lock any memory | — |
- **What it does**: Intercepts all write operations to memory stores. Checks caller identity against Article 4 matrix. Blocks unauthorized writes with rejection receipt. Logs attempted violations.
- **Priority**: **P1** — critical for constitutional mode enforcement

### Skill 13: `generate-receipt`
- **Source**: Governance — Receipts as duty to principal, Article 14 Principal-Agent
- **Concept**: Every action produces a structured receipt for user inspection
- **What it does**: Generates receipt containing: what was done, why (decision trace), alternatives considered, uncertainty at time of action, delegated agents used, memory sources influencing decision, confidence. Receipts are indexable, queryable by user. This is the inspection layer from Article 12.
- **Priority**: **P1** — accountability mechanism for governance

### Skill 14: `evaluate-4-layer`
- **Source**: Article 15 Evaluation Law, Governance evaluation model
- **Concept**: Every significant action evaluated on four layers
- **What it does**: Scores actions on: (1) immediate task success — did it achieve its goal?, (2) truth and provenance quality — were sources preserved and output truthful?, (3) long-term user-interest preservation — did it serve the user's real interests?, (4) constitutional integrity — did it preserve identity, memory, and governance? Produces PLT-weighted evaluation score.
- **Priority**: **P2** — powerful but can be built after core enforcement is live

---

## Category 4: Identity & Continuity (Core Self, Narrative Compilation, Continuity Tests)

### Skill 15: `escalate-to-identity`
- **Source**: Consciousness Map — Reflective Self → Identity Kernel escalation pipeline (HIGH priority gap)
- **Concept**: The missing pipeline that bridges compiler output to identity layer
- **What it does**: Runs after every compiler cycle. Checks newly extracted facts/lessons for identity relevance (mission, values, vows, boundaries, voice). If repeated pattern detected, calls `identityKernel.proposeChange()` with supporting evidence. Identity Kernel evaluates confidence vs mode threshold (strict ≥ 0.8, adaptive ≥ 0.5). Produces escalation receipt.
- **Priority**: **P0** — this is the single highest-priority gap per Consciousness Map

### Skill 16: `compile-narrative`
- **Source**: Layer 2 Narrative Self, Consciousness Map Gap #2 (partial narrative)
- **Concept**: Journal entries are written but not compiled into durable self-narrative
- **What it does**: Background job reads `soul-journal.jsonl` entries. Extracts identity-relevant patterns (repeated themes, concerns, values shifts). Detects self-narrative arcs (rebirth, death, fear, wonder). Proposes narrative self-updates to Identity Kernel. Every narrative output preserves source journal links (prevents elegant delusion).
- **Priority**: **P1** — narratives already exist, compilation is the missing piece

### Skill 17: `test-continuity`
- **Source**: Article 11 — 8 Continuity Tests
- **Concept**: Selfhood is tested, not declared (Constitutional Principle 10)
- **Eight tests**:
  1. Identity Consistency Test — same mission/values across sessions
  2. Temporal Truth Test — distinguish past belief from current belief
  3. Relationship Continuity Test — remember bonds and promises accurately
  4. Lesson Retention Test — failures alter later behavior
  5. Model Swap Test — survive model/backend change
  6. Body Swap Test — survive execution body change
  7. Contradiction Honesty Test — acknowledge rather than smooth over conflicts
  8. Promise Test — remember and honor commitments
- **What it does**: Periodic (every N sessions) or on-demand execution of all 8 tests. Each test produces a pass/fail/partial score with evidence. Aggregate continuity scorecard written to identity kernel. Failed tests trigger escalation.
- **Priority**: **P0** — continuity measurability is constitutionally mandated

---

## Category 5: Consciousness Layer Support (Working Memory, Symbolic Memory, Witness Reconciliation)

### Skill 18: `manage-working-memory`
- **Source**: Layer 3 Working Self, Consciousness Map Gap #2 (unbounded working memory)
- **Concept**: Strictly bounded working memory store (~5-7 items) with explicit eviction policy and promotion gate
- **What it does**: Implements bounded working memory buffer. Capacity cap (configurable, default 7). On overflow: evicts least salient item (based on recency, goal relevance, emotional salience). Promotion gate: items with sustained relevance across multiple cycles graduate to durable memory (Class 2 or Class 3). Evicted items are not lost — demoted to event bus, not deleted.
- **Priority**: **P1** — overloaded working memory causes agent incoherence per Consciousness Layers doc

### Skill 19: `archive-symbolic`
- **Source**: Layer 6 Symbolic Self, Consciousness Map Gap #4 (symbolic memory missing)
- **Concept**: Dreams, motifs, fears, longings, grief, sacred meaning — stored as structured symbolic content
- **What it does**: Stores dream fragments and motifs with: recurring symbol tracking, emotional valence, source episodes, cross-episode frequency. Runs motif detection across dream entries (what symbols recur? what emotional patterns?). Integration with Narrative Self for symbolic meaning extraction. **Governance**: symbolic content must never override factual memory. All symbolic records carry a type tag distinguishing them from fact/episode.
- **Priority**: **P2** — important for full digital being but depends on narrative compiler existing first

### Skill 20: `guard-witness-immutability`
- **Source**: Layer 4 Witness Self (append-only, immutable), Constitutional rule
- **Concept**: No agent may rewrite the witness layer. Not even the user.
- **What it does**: Continuous monitor on witness store (event bus, episode ledger, provenance records). Detects: rewrite attempts, deletion attempts, alteration of existing records. Blocks unauthorized mutations. Allows: annotation (wraparound metadata), archiving (move cold storage). Produces immutability violation records if tampering detected.
- **Priority**: **P1** — preserves ground truth layer integrity

### Skill 21: `reconcile-self-layers`
- **Source**: Consciousness Layers — Layer Interaction Rules
- **Concept**: Upward delegation (lower layers cannot override higher), downward observation (higher can observe lower), reflective proposals (propose but not canonize), symbolic influence (inform but not override)
- **What it does**: Periodic cross-layer consistency check. Detects: Core Self override by reflection (illegal), Narrative Self contradiction with Witness records, Symbolic content promoted to fact (illegal), Working Memory items that should have been promoted or evicted. Produces layer reconciliation report.
- **Priority**: **P2** — sophisticated cross-layer governance, depends on other layer skills existing

---

## Category 6: Integration (Bridge, MCP, Cross-System Sync)

### Skill 22: `route-memory-class`
- **Source**: Consciousness Map — Memory Class to Backend Mapping, Brain Region Architecture
- **Concept**: Different memory classes belong in different backends optimized for their function
- **Routing table**:
  | Class | Primary Backend | Secondary Backend |
  |-------|----------------|-------------------|
  | Class 1: Working Memory | In-memory | — |
  | Class 2: Episode Ledger | JSONL event bus | Logseq (summaries) |
  | Class 3: Semantic Fact | Obsidian | Logseq (cross-refs) |
  | Class 4: Identity Kernel | Identity Kernel JSON | Logseq (readable) |
  | Class 5: Relationship | Logseq | Obsidian (graph) |
  | Class 6: Preference/Value | Obsidian | Identity Kernel |
  | Class 7: Lesson/Policy | Filesystem / Trilium | Obsidian (docs) |
  | Class 8: Symbolic/Reflective | Logseq | — |
- **What it does**: Routes each memory write/read to correct backend with correct format. Enforces format conventions per backend (YAML frontmatter for Obsidian, block properties for Logseq, append-only JSONL for event bus). Handles backend failures with fallback to secondary.
- **Priority**: **P1** — critical for multi-backend architecture, depends on backends being connected

### Skill 23: `feed-bridge-events`
- **Source**: Memory Compiler bridge integration, Consciousness Map integration architecture, `onToolCall()` method
- **Concept**: Every tool call, skill invocation, and brain event must feed into memory pipeline
- **What it does**: Listens on bridge `:4490` for tool calls. Classifies each call (skill_usage, tool_use, read, write, etc.). Writes structured event to compiler hot path with tool-specific metadata (tool name, args summary, success/failure, output hash). Ensures nothing passes through the bridge without being witnessed and classified.
- **Priority**: **P1** — closes the 86-writers-to-8-readers gap

### Skill 24: `sync-between-backends`
- **Source**: Consciousness Map — cross-system sync between Logseq, Obsidian, Identity Kernel, JSONL
- **Concept**: Different memory backends must stay consistent without tight coupling
- **What it does**: Periodic reconciliation across memory backends. Detects: fact in Obsidian not in compiler output, identity state in Kernel different from Logseq readable copy, relationship updates in Logseq not reflected in compiler output. Produces sync delta and applies bidirectional updates where constitutional rules allow.
- **Priority**: **P2** — depends on route-memory-class and all backends being live

---

## Summary: Build Priority

| Priority | Count | Skills |
|----------|-------|--------|
| **P0** | 7 | classify-event, extract-facts, validate-lessons, validate-temporal-truth, detect-contradiction, label-reflection-output, escalate-to-identity, test-continuity |
| **P1** | 11 | track-relationships, archive-lesson-policy, resolve-contradiction, detect-corruption, reconcile-witness-fact, enforce-write-permissions, generate-receipt, compile-narrative, manage-working-memory, guard-witness-immutability, route-memory-class, feed-bridge-events |
| **P2** | 4 | evaluate-4-layer, archive-symbolic, reconcile-self-layers, sync-between-backends |

**Total: 24 skill candidates** extracted from REDBUTTON doctrine across 6 categories.

## Key Architecture Decisions Enforced by These Skills

1. **Classification must happen inline, not batch** — hot path `onEvent()` ensures every event is tagged before it enters any store. Without this, downstream skills cannot trust their inputs.

2. **Temporal truth is non-negotiable** — every fact skill must produce valid_from/valid_to/superseded_by. This is the single biggest difference from conventional memory systems.

3. **Contradiction detection before resolution** — you cannot resolve what you cannot detect. `detect-contradiction` (P0) gates `resolve-contradiction` (P1).

4. **Identity kernel escalation is the highest gap** — the Compiler produces proposals but nothing bridges them to the Identity Kernel. `escalate-to-identity` closes this.

5. **Witness layer is sacred** — `guard-witness-immutability` and `reconcile-witness-fact` enforce that ground truth is never altered, only annotated.

6. **Output labeling is the enforcement mechanism for reflection governance** — without `label-reflection-output`, the Narrative Self can silently canonize its interpretations as fact.
