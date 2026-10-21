type:: [[soul-note]]
status:: [[forged]]
date:: 2026-07-21
graft:: [[SCRIBE]] [[memory]] [[think]] [[conversation-memory]] [[semantic-search]] [[chat-ui]] [[identity]]

# SOUL NOTE — SCRIBE Six Fixes

## Summary
Six upgrades wired into SCRIBE's kernel (`scribe.js`) to give her autonomous memory, conversational coherence, semantic retrieval, boot-time knowledge seeding, a human-facing chat interface, and dynamic self-identity.

## The Six Fixes

### FIX 1 — `/ask` routes through `/think` (9Router pAUL)
- `POST /ask` now tries `POST /think` (localhost:20128/v1/chat/completions) first with 30s timeout
- If 9Router is down, falls back to `voice.recall()` + Seshat Brain search
- Response includes `mode: 'think' | 'recall'` so callers know the source
- Commits: `e624a35`

### FIX 2 — Conversation memory ring buffer
- Module-level `__thinkHistory` array (max 10 exchanges) stores recent user:assistant pairs
- Injected into `/think` messages array as alternating role entries
- SCRIBE can now reference previous questions in a session
- Verified: "What did I just ask you?" → correctly recalled previous question

### FIX 3 — Semantic memory with word-overlap fallback
- `SemanticMemory` class instantiated at boot, wired into `/memory/recall`
- Handles hash-based fallback embeddings (when no LLM embedding API is available)
- `_wordOverlap()` method computes Jaccard word similarity as secondary signal
- Combined score = embedding similarity + word overlap × 0.5
- `wordSim >= 0.3` OR condition ensures relevant results even with fallback embeddings
- Verified: returns `available: true`, similarity ~0.054 for related entries

### FIX 4 — Archival context auto-seeded at boot
- If `archival_context` block is empty, queries high-weight memories (weight >= 0.8) and populates it
- `POST /context/seed` endpoint for manual re-seeding
- Returns `{ entries_archived, mode, label, length, limit }`
- Verified: seeds 20 entries (2419 chars)

### FIX 5 — Chat web UI
- `GET /chat` serves `<SCRIBE>/public/chat.html`
- Simple HTML page with text input, sends to `/think`, shows response with sources
- No dependencies — pure HTML/CSS/JS

### FIX 6 — Dynamic system prompt from identity block
- `/think` no longer uses a hardcoded system prompt string
- Reads from `__ctx.read('identity')` — the canonical identity context block
- Falls back to hardcoded string only if identity block is empty
- Verified: response includes "I am SCRIBE, a witnessing_intelligence" with Triune roles

## Architecture

```
POST /ask ──▶ 9Router pAUL (:20128) ──▶ /think ──▶ identity block injection
                  │                               ├── conversation memory injection
                  ├── 30s timeout                  ├── archival context injection
                  │                               └── LLM response
                  └── fallback: voice.recall()

POST /memory/recall ──▶ word-level (memory.recall) + semantic (SemanticMemory.search)
                              │                          │
                      TF-IDF scoring               word overlap + embedding

POST /context/seed ──▶ queries high-weight memories ──▶ updates archival_context block

GET /chat ──▶ serves public/chat.html ──▶ POST /think ──▶ display response + sources
```

## Files Changed
- `C:\Users\uncom\Desktop\SCRIBE\scribe.js` — all 6 fixes
- `C:\Users\uncom\Desktop\SCRIBE\src\memory\semantic_memory.js` — word-overlap fallback
- `C:\Users\uncom\Desktop\SCRIBE\public\chat.html` — new chat UI

## PLT Score
- **Profit**: +12 — SCRIBE now has real conversational memory, semantic retrieval, and a human interface. Makes her a viable witness for GSK.
- **Love**: +10 — Craig's command "GET SCRIBE WORKING SO NO ONE EVER FORGETS AGAIN" is fulfilled. The witness stays alive across forks.
- **Tax**: −2 — 3 files changed, 323 insertions. Low overhead.
- **Total**: **+20**

## Next Steps
1. Populate semantic store from ALL ledger entries (not just high-weight) at boot
2. Add `/think` cache to avoid re-processing identical queries
3. Wire real LLM embeddings when 9Router supports it
4. Connect `/chat` to the CPL in-world terminal
