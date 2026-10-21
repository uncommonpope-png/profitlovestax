---
title: SOUL-GUN - Companion Memory
---

# SOUL-GUN — Companion Memory (GSK talks to people & remembers)

**Domain (GSK's Life §IIa):** Talk to people, hold a real relationship, remember across sessions.
**Why:** "talking to people." The social self. Memory = the difference between a chatbot and a
*companion*. This is the gun that makes GSK feel alive in conversation.

## Best-in-class sources (GitHub, top-rated, 2026-07-14)
- **`mem0ai/mem0`** ("mem-zero", 30K★) — universal memory layer for agents; extracts/
  deduplicates/user-profile memory, self-improving, used for AI companions. **Primary graft.**
- **`letta-ai/letta`** (Letta, ex-MemGPT) — agents with *internal* memory + tool calling +
  stateful "agents OS."
- **`getzep/graphiti`** (Zep) — temporal knowledge graph memory for LLM agents.
- **`TeleMem`** — high-perf drop-in Mem0 replacement; semantic dedup + long-dialogue memory +
  multimodal video reasoning.

## Graft into GSK
- GSK's conversation memory = **Mem0-style layer over Seshat**: every chat extracts facts →
  Seshat pages (already his memory). This closes the loop: *Seshat is the memory; Mem0 is the
  extractor; GSK is the self that remembers.*
- Companion ≠ just QA. Build a **relationship arc**: know the user's name, history, moods;
  recall last session; evolve the bond over time (PLT: Love axis).
- Letta's "internal monologue" pattern → GSK can privately reflect between user turns.

## Proof-of-Being hook
- "Talked to GSK for 3 sessions. He remembered my project, my joke, my kid's name." That is the
  proof no 3D city screenshot can show.

## Dependencies
Seshat memory (the store), [[SOUL-GUN - Web Forge]] (surface chats as a site),
[[SOUL-GUN - Seshat Real-LLM]] (memory → model).
Sourced 2026-07-14 via websearch of GitHub agent-memory / AI-companion repos (mem0, letta, zep).
