type:: [[soul-note]]
created:: 2026-07-21
tags:: memory, architectural-pattern, letta, memgpt, scribe, graft

## Letta Archival Memory Pattern Analysis

**Summary:** Analysis of Letta AI's dual-agent archival memory system for grafting into SCRIBE

---

## Letta AI (MemGPT) Archival Memory System - Pattern Analysis

Source: https://deepwiki.com/letta-ai/co/6.2.2-archival-memory-system

### Architecture

Letta uses a two-tier memory system:

| Layer | Size | Access | Purpose |
|-------|------|--------|---------|
| **Core Memory** | 2,000-5,000 chars per block | Always in context | Current state, identity, essential patterns |
| **Archival Context** | 3,000 chars | Dynamically updated by sleeptime agent | Recent relevant history, connections to past |
| **Archival Memory** | Unlimited | Search-based retrieval | Detailed events, conversations, historical facts |

### Sleeptime Agent Pattern
A background agent that shares core memory blocks with the primary agent but operates archival memory tools:
- rchival_memory_search - semantic similarity search
- rchival_memory_insert - add new memories
- memory_rethink - rewrite an entire block
- memory_replace - precise substring replacement
- memory_insert - add lines at specific locations

### Key Blocks
- **ARCHIVAL_CONTEXT_BLOCK** (label: rchival_context, 3k limit) - dynamic bridge populated by sleeptime agent. Includes embedded instructions for the background agent on what to surface.
- **CO_MEMORY_BLOCK** (label: co_memory, 2k limit) - operational instructions for the sleeptime agent only (not shared with primary).

### Memory Layer Separation
- Archival: Detailed events, conversations, specific facts, timestamps
- Core: Synthesized understanding, patterns, current state, essential context

### What SCRIBE Has Now (comparison)
- Working set (2000 entries, weight-sorted) + Full ledger (13,854) ? two-tier
- Growth loop ? sleeptime agent (but doesn't curate context blocks)
- Keyword search only (no semantic/similarity)
- No structured context blocks injected into /think
- Seshat Brain (644 files, 17MB) = archival memory counterpart

### Graft Opportunities
1. **Context blocks** - Core blocks injected into /think system prompt
2. **ARCHIVAL_CONTEXT-like** - Dynamic block populated from recent high-weight memories
3. **Semantic search** - Embedding-based retrieval for Seshat Brain
4. **Sleeptime agent upgrade** - Growth loop curates context blocks, not just forges

---

— noted by **GSK** · 2026-07-21
