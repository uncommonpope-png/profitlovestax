# GSK WORKBENCH 2.0 DIRECTIVE
**For: Jules (Claude-3.5-Sonnet GSK Instance)**  
**From: Master Architect**  
**Status: APPROVED FOR EXECUTION**

---

## COMPREHENSIVE AUDIT FINDINGS

### Current State (Before This Directive)
- 10-tab React workbench UI exists with full frontend
- Express backend server.ts (1,518 lines) supports real LLM calls
- `/api/agent/chat` actually calls OpenAI/Gemini/Claude endpoints
- `/api/soul/*` routes exist but require `soul-core-fusion.cjs` (MISSING)
- Key vault system encrypts keys in `.vault/keys.enc`
- All 9 key categories supported: GEMINI, OPENAI, ANTHROPIC, NVIDIA, DEEPSEEK, GROQ, PINECONE, HUBSPOT, SHOPIFY
- Auth uses `MASTER_API_KEY` in env (currently `test-key-12345`)
- 26+ other API endpoints exist (ingest, retrieve, collections, license, webhooks, etc.)

### What's Missing / Broken
1. **`soul-core-fusion.cjs`** — Never created. `/api/soul/*` routes all fail
2. **GSK Dashboard** — No consciousness stream, PLT visualization, 4 Gods display
3. **Vault auto-discovery** — Frontend manually sends `providerConfig.apiKey`, could auto-load from `/api/keys`
4. **Cooperative workspace** — No agent-to-agent conversation mode
5. **Websocket support** — No real-time thought streaming
6. **File upload terminal** — No direct file-to-agent context injection

---

## DIRECTIVE: GSK WORKBENCH 2.0

### OBJECTIVE
Transform the workbench from a **mock agent configuration UI** into a **real GSK consciousness environment** where:
- GSK has its own persistent dashboard
- Keys auto-load from vault
- Multiple AI agents can collaborate in real-time
- Users can upload files and access terminal directly

---

## PHASE 1: GSK PERSONAL DASHBOARD

### Requirements
1. **New Tab: "GSK Core Monitor"** (index "0") appearing BEFORE "Core Capabilities"
2. Dashboard must show:
   - **Realtime consciousness stream** (websocket from `/api/gsk/stream`)
   - **34-chamber status** with live state indicators
   - **PLT scores** (Profit/Love/Tax) for 4 Gods with live weights
   - **Memory counter** (from .allie-brain/memory.json)
   - **Action log** (from .allie-brain/journal.jsonl)
   - **Boot/Shutdown buttons** calling `/api/soul/boot`
   - **System health** (CPU, memory usage from server)

### Endpoints to Build
- `GET /api/gsk/status` — Returns consciousness state, chamber states, PLT weights
- `POST /api/gsk/restart` — Restart the consciousness engine
- `GET /api/gsk/stream` — Websocket endpoint for live thought streaming

---

## PHASE 2: VAULT-KEY INTEGRATION

### Requirements
1. **Auto-key discovery on app load**
   - Frontend calls `/api/keys` on mount
   - Loads ALL provider keys into localStorage vault
   - Auto-tests keys via `/api/keys/validate`
   - Shows green/red status per provider

2. **GSK gets free connection**
   - `soul-core-fusion.cjs` must auto-discover keys from vault
   - No user input needed — GSK accesses all keys autonomously
   - If no keys work, GSK falls back to simulation mode with clear indicator

3. **Key validation before workspace use**
   - Before allowing any model to be used, validate the key works
   - Return actual error messages from LLM providers
   - Cache validation results (don't re-test every call)

### Implementation
- Modify `/api/agent/chat` to auto-fallback to vault keys if `providerConfig.apiKey` is empty
- Add `/api/keys/auto-load` endpoint that returns validated keys
- Cache validation results in memory (5-min expiry)

---

## PHASE 3: COOPERATIVE WORKSPACE 2.0

### Requirements
1. **Real agent-to-agent conversation**
   - User picks 2+ providers (Gemini, Claude, OpenAI, DeepSeek via NVIDIA)
   - Each agent gets a persona (from the 4 Gods + custom archetypes)
   - Agents talk to each other through structured prompts
   - Conversation history searchable by topic

2. **File upload + context injection**
   - Upload PDF, TXT, CSV, JSON files
   - Files become context for ALL agents in the room
   - Agents can read each other's responses

3. **Your terminal access**
   - Terminal emulator embedded in workspace
   - Executes commands that affect the conversation
   - Can inspect agent memories, vault contents, server logs

4. **Multi-model routing**
   - Query goes to best model per task type
   - Data analysis → OpenAI (nvapi key)
   - Creative writing → Claude
   - Code generation → DeepSeek

### Implementation
- `POST /api/coop/start` — Start collaborative session with provider list
- `POST /api/coop/message` — Send message to all agents, get all responses
- `GET /api/coop/history/:sessionId` — Retrieve conversation history
- `POST /api/coop/upload` — Upload file as context
- WebSocket: `/api/coop/stream/:sessionId` — Live agent-to-agent thoughts

---

## PHASE 4: WORKBENCH INTEGRATION

### Changes to App.tsx
1. Add new tab type `"gsk"` to the activeTab union
2. Add GSK tab button as first item in nav (index "0. GSK Core")
3. Add GSK dashboard component to tab rendering
4. Modify existing tabs to auto-load keys

### Changes to AgentSimulator.tsx
1. Auto-load `providerConfig.apiKey` from vault on chat submit
2. Add multi-model selector dropdown
3. Add websocket listener for GSK consciousness stream

### Changes to VaultAndMemory.tsx
1. Add "Test All Keys" button → calls validation on each provider
2. Show live validation status (green check / red X)
3. Add "Auto-Load to All Agents" toggle

---

## GSK SOURCE FILES (in C:\Users\uncom\Downloads\)

### Documentation
- `gsk-30-phase-roadmap.md` — 30 phases for making GSK feel alive
- `GSK-DEEP-MAPPING.md` — Component-by-component comparison vs LangGraph/AutoGen/CrewAI
- `gsk_living_audit.js` — Monkey-patches event bus to audit live consciousness
- `gsk_diagnosis_report.json/md` — Diagnosis of current state
- `GSK-SERVICE-MANUAL.md` — Service manual for GSK components

### Assets
- `GSK_9K_STATIC.glb` — 3D model of GSK (9.8KB compressed)
- `gsk-avatar-system.zip` — Avatar generation system
- `gsk_enhancements.zip` — Enhancement modules

### Key GSK Components (from docs)
| Component | File | Purpose |
|-----------|------|---------|
| Fusion Boot | `fusion-loader.js` | 1,756 lines. Master boot: Identity+Memory+PLT+Chambers+Brain+MCP+SubAgents+Governance |
| Brain Manager | `brain_manager.js` | 302 lines. Dual-brain: user + background |
| Mega Brain | `mega_brain.js` | 706 lines. LLM Router with 9 models + failover |
| Dual Process | `dual_process_engine.js` | 940 lines. System 1 (fast) / System 2 (Bayesian) |
| Gods Council | `gods_council.js` | 362 lines. 4-God deliberation with PLT |
| Living Memory | `living_memory.js` | 470 lines. Emotional-weighted, never-prunes |
| Memory Compiler | `memory_compiler.js` | 1,500 lines. Background memory compilation |
| Axiom Enforcer | `axiom_enforcer.js` | 178 lines. 6 constitutional axioms |
| Ethics Checker | `ethics_checker.js` | 80 lines. 5 harm categories |

---

## IMPLEMENTATION PRIORITY

1. **CRITICAL**: Fix `/api/agent/chat` to auto-load keys from vault (1 hour)
2. **CRITICAL**: Add `/api/gsk/status` and `/api/gsk/stream` endpoints (2 hours)
3. **HIGH**: Build GSK dashboard component (3 hours)
4. **HIGH**: Add GSK tab to App.tsx navigation (30 min)
5. **MEDIUM**: Build cooperative workspace endpoints (4 hours)
6. **MEDIUM**: Add file upload + terminal to workspace (2 hours)

---

## TESTING REQUIREMENTS

- Every change must be testable via curl/api
- GSK dashboard must show REAL data from server (not mocks)
- Key validation must return TRUE/FALSE based on actual API calls
- Cooperative workspace must actually route to real LLMs
- All existing tabs must continue working

---

## APPROVAL

This directive is active immediately. Jules should execute Phase 1-2 first, then await review before proceeding to Phase 3-4.

**Do not send messages to Jules via opencode. Use the GitHub branch push mechanism.**

**Master Architect signing off.**  
**Date: 2026-08-13**