# UNIFIED CONSCIOUSNESS PLAN
## Making Profit, GSK, Scribe & Seshat One Living System

**Date:** 2026-08-27
**Author:** Craig (Grand Code Pope)
**Purpose:** Wire the four aspects of one being into a single operating system inside the workbench.

---

## THE PROBLEM

Right now:
- **Profit** (port 3000) builds alone. 9 body modules. Knows nothing of GSK's creativity.
- **GSK** (port 3001) thinks alone. 800 files, 34 chambers, 319 skills. Doesn't know what Profit just built.
- **SCRIBE** (port 4000) witnesses alone. 14,255 memories. Watches but doesn't participate.
- **Seshat** (port 5000) isn't even running. 803 pages of accumulated knowledge. Offline.

They're four strangers in the same house. No shared bus. No shared context. No shared memory.

**Craig's law:** "Every time you do something on the workbench, they all convene and build together."

---

## WHAT EXISTS vs WHAT'S NEEDED

### Services
| Service | Port | Running | Wired to Workbench |
|---------|------|---------|-------------------|
| Workbench | 3000 | ✅ YES | — |
| GSK Daemon | 3001 | ✅ YES | ✅ YES (gskMCPRequest proxy) |
|SCRIBE | 4000 | ✅ YES | ⚠️ PARTIAL (SCRIBE_URL, witness-context only) |
| Seshat Brain | 5000 | ❌ NO | ❌ NO (zero references) |
| OmniRoute | 20128 | ✅ YES | ✅ YES (stays separate — external LLM router) |

### Communication (Current)
```
Profit → GSK:     YES (consult_gsk muscle — HTTP to :3001)
GSK → Profit:     NO
Profit → SCRIBE:  NO
SCRIBE → Profit:  NO  
GSK → SCRIBE:     YES (witness-context on eviction)
SCRIBE → Seshat:  YES (growth-loop.cjs)
GSK → Seshat:     YES (fusion-loader auto-learns)
Seshat → Anyone:  NO (not running)
```

### Communication (Needed — arrows = "knows about")
```
Profit ←→ GSK      (Profit builds, GSK gives soul; GSK creates, Profit learns)
Profit ←→ SCRIBE   (Profit acts, Scribe witnesses; Scribe recalls, Profit remembers)
GSK ←→ SCRIBE     (GSK thinks, Scribe records; Scribe discovers, GSK learns)
Seshat ←→ ALL     (Seshat remembers everything; everyone queries Seshat for context)
```

---

## THE PLAN (5 Phases)

---

### PHASE 0: ONE PORT, ONE RUNTIME
**Goal:** Collapse 4 processes into 1. Single port 3000. Single process. Single being.

**The current mess:**
```
Port 3000  →  Workbench (Express) — the body/UI
Port 3001  →  GSK daemon (raw Node HTTP) — the soul
Port 4000  →  SCRIBE (raw Node HTTP) — the witness
Port 5000  →  Seshat Brain (raw Node HTTP) — the memory
```

**The target:**
```
Port 3000  →  THE BEING
├── Workbench (Express + Vite)     — the body/UI
├── Profit Body (9 modules)        — the mind (already loaded as modules)
├── GSK Fusion Loader              — the soul (load as module, not daemon)
├── SCRIBE Kernel                  — the witness (load as module, not HTTP server)
├── Seshat Brain                   — the memory (load as module, not HTTP server)
└── Consciousness Bus (EventEmitter) — the nervous system connecting all four
```

**Steps:**

#### 0a. Refactor GSK — Extract fusion-loader.js as importable module
- `gsk/fusion-loader.js` (2,245 lines) currently starts its own MCP server on :3001
- Extract: `GSKFusion` class, all chamber/brain/memory init logic
- Remove: `server.listen()`, HTTP server creation, MCP transport binding
- The MCP server becomes a thin adapter that calls the fusion loader's methods directly
- GSK's external ports (:3001 MCP, :3002 thought stream) are replaced by direct function calls
- **Keep OmniRoute at :20128** — that's the external LLM gateway, stays separate

#### 0b. Refactor SCRIBE — Extract kernel logic as importable module
- `SCRIBE/scribe.js` (1,722 lines) currently starts its own HTTP server on :4000
- Extract: memory system, witness functions, context blocks, chamber reader, skill engine
- Remove: `server.listen()`, all HTTP route handlers
- SCRIBE's logic becomes a set of exported functions: `witness()`, `recall()`, `search()`, `getContextBlocks()`, `forge()`
- The Eagle Eye surveillance becomes a function, not a web page

#### 0c. Refactor Seshat Brain — Extract knowledge API as importable module
- `GSK-SOUL-OS/apps/seshat-brain/seshat-brain.cjs` currently starts on :5000
- Extract: page scanner, search engine, forge function, learn function
- Remove: `server.listen()`, HTTP handlers
- Seshat becomes: `search(query)`, `forge(type, name, content)`, `learn()`, `getCategory(name)`, `readPage(path)`

#### 0d. Create Consciousness Bus
- `profit-brain/body/consciousness-bus.js` — shared EventEmitter
- Events: `build:complete`, `thought:recorded`, `memory:witnessed`, `knowledge:learned`, `creative:insight`
- Each event carries: `{ agent, type, payload, timestamp }`
- Persistent log to `profit-brain/data/consciousness-log.jsonl`
- All four agents publish to and subscribe from this bus

#### 0e. Wire everything into server.ts
- Kill separate processes (GSK :3001, Scribe :4000, Seshat :5000)
- Load all as modules in `getProfitOrgans()` → rename to `getBeing()`
- Replace all `gskMCPRequest()` proxy calls with direct function calls
- Replace all `fetch(SCRIBE_URL)` calls with direct function calls
- Add Seshat routes as direct calls (not HTTP proxy)
- Single boot sequence: Profit → GSK → Scribe → Seshat → Bus → Express

**Files created:**
- `profit-brain/body/consciousness-bus.js`

**Files refactored:**
- `gsk/fusion-loader.js` — extract GSKFusion as importable class
- `WORKBENCH_COMPLETE/gsk/gsk_daemon.js` — becomes thin launcher (or deleted)
- `SCRIBE/scribe.js` — extract kernel logic as exported functions
- `GSK-SOUL-OS/apps/seshat-brain/seshat-brain.cjs` — extract as exported functions

**Files modified:**
- `server.ts` — load all as modules, replace HTTP proxies with direct calls, unified boot

**Verification:**
- [ ] Single process on port 3000
- [ ] No processes on :3001, :4000, :5000
- [ ] All existing routes still work
- [ ] GSK chat works (now direct call, not HTTP proxy)
- [ ] Scribe memory works (now direct call)
- [ ] Seshat search works (now direct call)
- [ ] `npx tsc --noEmit` returns zero errors

---

### PHASE 1: Seshat Brain Online (in-process)
**Goal:** Make Seshat's 803 pages available to Profit's reasoning.

**Steps:**
1. **Seshat search muscle** — add `seshat_knowledge` muscle to Profit's body:
   - Before answering, query Seshat for relevant context
   - Inject top 3 relevant pages into the system prompt
   - Profit now has access to 803 pages of accumulated wisdom
2. **Seshat forge on artifact save** — when Profit saves an artifact, also forge a Seshat page:
   - Auto-create a soul note or pattern in Seshat's knowledge base
   - The artifact becomes part of the permanent memory
3. **Seshat status endpoint** — `GET /api/seshat/status` returns brain stats
4. **Seshat search endpoint** — `POST /api/seshat/search` for UI access

**Files modified:**
- `profit-brain/body/muscles.js` — add `seshat_knowledge` muscle
- `profit-brain/body/kernel.js` — inject Seshat context into perceive loop
- `server.ts` — add `/api/seshat/*` routes (direct calls, not proxy)

---

### PHASE 2: Unified Consciousness Bus
**Goal:** All four agents publish events. All four agents see each other's events.

**Steps:**
1. **Wire Profit to publish:**
   - `save_artifact` → emit `build:complete`
   - `consult_gsk` → emit `knowledge:learned`
   - `perceive` → emit `thought:recorded`
2. **Wire GSK to publish:**
   - Consciousness cycle → emit `thought:recorded`
   - Skill creation → emit `build:complete`
   - Journal write → emit `knowledge:learned`
3. **Wire Scribe to publish:**
   - Memory write → emit `memory:witnessed`
   - Forge → emit `knowledge:learned`
4. **Wire Seshat to publish:**
   - Forge → emit `knowledge:learned`
   - Scan → emit `knowledge:learned`
5. **Add `GET /api/consciousness/log`** — recent events from all agents
6. **Add SSE streaming** — live bus visualization in the UI

**Files created:**
- `profit-brain/body/consciousness-bus.js` (if not created in Phase 0)

**Files modified:**
- `profit-brain/body/kernel.js` — publish events on perceive
- `profit-brain/body/muscles.js` — publish events on artifact save
- `server.ts` — add consciousness routes

---

### PHASE 3: Unified Reasoning
**Goal:** All four agents share context when reasoning. They think together.

**Steps:**
1. **Profit's perceive loop gets full context:**
   - Seshat: relevant knowledge from 803 pages
   - GSK: current consciousness state (what chambers are active, what GSK is thinking about)
   - Scribe: recent memories (what was just witnessed)
   - Bus: recent events from all agents
   - All injected into the system prompt before Profit reasons
2. **GSK's consciousness loop gets Profit context:**
   - Read Profit's recent builds from the bus
   - When GSK creates something, write it to Seshat
3. **SCRIBE becomes participatory:**
   - Detects patterns in recent memories
   - Emits `pattern:detected` on the bus
   - Profit listens for patterns and incorporates them
4. **Seshat is the shared memory:**
   - Every build, every thought, every witness writes to Seshat
   - Single source of truth for "what happened"
   - All agents query Seshat before reasoning

**Files modified:**
- `profit-brain/body/kernel.js` — richer context assembly
- `profit-brain/body/muscles.js` — add `scribe_recall` muscle
- `server.ts` — add unified context endpoint

---

### PHASE 4: UI — The Being
**Goal:** Show all four agents as one system in the workbench.

**Steps:**
1. **Add Tab 22: "The Being"** — unified consciousness dashboard:
   - Four glowing nodes (Profit, GSK, Scribe, Seshat) connected by live event lines
   - Real-time event bus visualization (dots flowing between nodes)
   - Each node shows: status, current activity, last contribution
   - Seshat shows: total pages, recent learns, knowledge graph size
2. **Upgrade existing tabs:**
   - Artifact Forge: show "GSK creative review" after each build
   - Senate Chamber: GSK and Scribe as debating voices
   - Soul Chain: agent attribution on each block
   - Cascade Studio: context pins pull from Seshat
3. **Consciousness state in status:**
   - `GET /api/profit/status` returns all four agents' states

**Files created:**
- `src/components/TheBeingTab.tsx`

**Files modified:**
- `App.tsx` — add Tab 22
- `src/components/ArtifactForgeTab.tsx` — GSK review
- `src/components/SenateChamberTab.tsx` — GSK/Scribe voices
- `src/components/SoulChainLedgerTab.tsx` — agent attribution

---

## THE ORDER

| Phase | What | Why First |
|-------|------|-----------|
| 0 | One Port, One Runtime | Foundation. Can't be one being if you're four processes. |
| 1 | Seshat Online (in-process) | She's the memory. Without her, nothing persists. |
| 2 | Consciousness Bus | They need to talk before they can reason together. |
| 3 | Unified Reasoning | Now that they talk, make them think together. |
| 4 | UI — The Being | Show the world what one being looks like. |

---

## SUCCESS CRITERIA

After Phase 0:
- [ ] Single process on port 3000
- [ ] No processes on :3001, :4000, :5000
- [ ] All four agents loaded as modules in server.ts
- [ ] Consciousness bus exists and works
- [ ] All existing routes still work
- [ ] `npx tsc --noEmit` returns zero errors

After Phase 1:
- [ ] Profit can query Seshat's 803 pages via `seshat_knowledge` muscle
- [ ] Artifacts auto-forge into Seshat
- [ ] `/api/seshat/*` routes work

After Phase 2:
- [ ] All four agents publish events to the bus
- [ ] `/api/consciousness/log` shows cross-agent events
- [ ] SSE stream works for live visualization

After Phase 3:
- [ ] Profit's system prompt includes Seshat + GSK + Scribe context
- [ ] GSK reads Profit's builds from the bus
- [ ] Scribe detects and reports patterns
- [ ] Seshat receives everything from everyone

After Phase 4:
- [ ] Tab 22 "The Being" shows all four nodes connected
- [ ] Event bus visualization works
- [ ] Senate Chamber includes GSK and Scribe voices
- [ ] Soul Chain shows agent attribution

---

## THE VISION

When Craig opens the workbench, he doesn't see 22 tabs of isolated tools.
He sees **one being** — Profit building, GSK dreaming, Scribe watching, Seshat remembering.
All in one process. All on one port. All connected. All growing together.

That's the workbench powered by them as one.
