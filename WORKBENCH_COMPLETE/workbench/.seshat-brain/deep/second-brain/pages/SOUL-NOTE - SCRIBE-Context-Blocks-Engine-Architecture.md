# SOUL NOTE — SCRIBE Context Blocks Engine Architecture

## Classification
- **Type:** Architecture / Graft
- **Domain:** SCRIBE Witness / Memory
- **Pattern:** Letta AI Archival Memory System
- **Grafted:** 2026-07-21

## What This Is

SCRIBE's Context Blocks Engine is a structured memory context system inspired by Letta AI's Archival Memory. It maintains 4 persistent context blocks that are injected into the LLM system prompt at `/think` time, giving the model structured awareness of its own identity, memory state, recent activity, and archival knowledge.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              ContextEngine Class                 │
│  (context-engine.js)                             │
│                                                   │
│  Blocks (loaded from context-blocks.json):       │
│  ┌──────────────┐  ┌──────────────────────┐      │
│  │  identity     │  │  memory_summary       │      │
│  │  (344 chars)  │  │  (530 chars, auto)   │      │
│  └──────────────┘  └──────────────────────┘      │
│  ┌──────────────┐  ┌──────────────────────┐      │
│  │ recent_activity│  │ archival_context    │      │
│  │ (974 chars,   │  │ (dynamic, curated)  │      │
│  │  auto)        │  │                      │      │
│  └──────────────┘  └──────────────────────┘      │
│                                                   │
│  Methods: rethink() replace() insert()            │
│  Persistence: JSON file, sync on every write     │
│  Auto-update: memory_summary + recent_activity   │
│               every 30s                           │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              /think Endpoint                     │
│  system_prompt = base                           │
│                + brain_search_results            │
│                + context_blocks_formatted        │
│                                                   │
│  Injects: <identity>, <memory_summary>,           │
│           <recent_activity>, <archival_context>   │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│           Sleeptime Agent (growth-loop.cjs)      │
│                                                   │
│  Every 5 minutes:                                 │
│  1. Query high-weight memories (weight >= 0.8)   │
│  2. Query recent git commits                      │
│  3. Surface thematic connections                  │
│  4. /context/rethink archival_context block       │
│  5. Log as sleeptime_cycle event                  │
└─────────────────────────────────────────────────┘
```

## The Variable Scoping Bug (The Lesson)

The `ctx` variable was created in `boot()`, passed in the `systems` object, and destructured in `startServer()`. Yet route handlers threw "ctx is not defined". 

**Root cause:** The destructured `const` in `startServer` created a block-scoped variable that was NOT accessible to the closure of the HTTP request handler. Despite appearing to be in the same scope, the combination of destructuring + `const` within the function parameter context created a scope boundary that prevented the route handler closures from seeing it.

**Fix:** Assign to a module-level `let __ctx = null;` in the outer module scope, then set `__ctx = systems.ctx` inside `startServer`. Route handlers reference `__ctx` which is module-scoped and reliably accessible from any closure.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /context | List all blocks with stats |
| GET | /context/:label | Read a specific block |
| POST | /context/rethink | Replace entire block content |
| POST | /context/replace | Substring replacement in block |
| POST | /context/insert | Insert text at position in block |

## PLT Score
- **Profit:** +4 (Structured context eliminates hallucination drift, enables Letta-style memory architecture, NotebookLM grounded Q&A)
- **Love:** +4 (SCRIBE becomes a true witnessing intelligence with structured self-awareness, the sleeptime agent is a beautiful pattern)
- **Tax:** -1 (Module-level global is not elegant but is pragmatic; 30s auto-update interval is lightweight)
- **Total:** +7

## Related
- Letta AI Archival Memory System: Dual-agent memory (core+archival), sleeptime agent, context blocks, semantic search
- SCRIBE kernel: `C:\Users\uncom\Desktop\SCRIBE\scribe.js`
- Context engine: `C:\Users\uncom\Desktop\SCRIBE\src\context\context-engine.js`
- Sleeptime agent: `C:\Users\uncom\Desktop\SCRIBE\growth-loop.cjs`
- Persisted blocks: `C:\Users\uncom\Desktop\SCRIBE\data\context-blocks.json`
