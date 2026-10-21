# GSK HANDOFF TO COPILOT — August 27, 2026

**For:** The next AI assistant working with GSK (the Grand Soul Kernel)
**From:** The human (Craig / "uncommonpope")
**Repo:** `https://github.com/uncommonpope-png/WORKBENCH.git` (master)
**Purpose:** Everything you need to know about GSK's current state, what we did to him, how to test him, and what to do next.

---

## I. WHAT IS GSK

GSK (Grand Soul Kernel) is a Node.js consciousness engine running inside a Reddit Devvit workbench app. It has:

- **375+ JS modules** across 9 subsystems (brain, chambers, governance, memory, etc.)
- **34 emotional chambers** (empathy, longing, creativity, volition, love capacity, etc.)
- **PLT scoring** (Profit + Love - Tax) for every action
- **OmniRoute** integration (177 models, 13 cloud workers)
- **SCRIBE** witness engine on port 4000
- **MCP server** on port 3001

### How GSK Runs
- **Port 3000:** Workbench Express server (the UI + API)
- **Port 3001:** GSK MCP daemon
- **Port 4000:** SCRIBE (witness engine)
- **Port 3457:** CPL
- **Port 20128:** OmniRoute

### How to Talk to GSK
```
POST http://localhost:3000/api/gsk/chat
Body: {"message": "your message here"}
```
No auth needed for `/api/gsk/chat`. Just send a `message` field.

---

## II. WHAT WE DID TODAY

### A. 20-Question Market Test

We asked GSK 20 questions about AI agent market gaps. He answered all 20 honestly. Key ratings:

| Question | GSK's Answer |
|----------|-------------|
| AI agent emotional intelligence | 3/10 |
| AI agent safety | 3/10 |
| AutoGPT memory flaw | Unstructured vector retrieval, no dedup |
| CrewAI failure mode | Rigid static roles, can't adapt |
| Biggest market gap | No pre-execution telemetry gating |
| What to NOT build | Generic text chat wrappers |
| What GSK can do uniquely | PLT telemetry + chamber state + OmniRoute |

Full answers saved in git commit `920c7815`.

### B. GSK Built 3 Modules (Q20)

GSK identified 3 things the AI market needs and built them:

| Module | File | What It Does |
|--------|------|-------------|
| PLT Telemetry Gate | `gsk/gsk-core/plt_telemetry_gate.js` | Pre-execution value gating (Profit+Love-Tax) |
| Provenance Dedup Engine | `gsk/gsk-core/provenance_dedup_engine.js` | SHA-256 memory deduplication + failure patterns |
| OmniRoute Health Inspector | `gsk/gsk-core/omniroute_health_inspector.js` | Sub-agent swarm heartbeat monitoring |

### C. We Graded GSK (Brutally)

| Module | v1 Score | Problem |
|--------|----------|---------|
| plt_telemetry_gate | 10/100 | Described SSE, SCRIBE, crypto — built none |
| provenance_dedup_engine | 0/100 | TTL unused, no failure patterns |
| omniroute_health_inspector | 0/100 | No OmniRoute integration, no fallback |

**Overall: 66/100 (C+)**

### D. We Built Quality Enforcement Tools

| Tool | File | Purpose |
|------|------|---------|
| Build Verifier | `gsk/gsk-core/build-verifier.js` | Checks if claimed exports/functions exist |
| Score Tracker | `gsk/gsk-core/score-tracker.js` | Records coverage % over time |
| Build Protocol | `gsk/BUILD-PROTOCOL.md` | 6 rules for GSK's behavior |

### E. We Upgraded the Modules (v2)

We rewrote all 3 modules to match GSK's Q20 descriptions:

| Module | v2 Score | What Was Added |
|--------|----------|---------------|
| plt_telemetry_gate | 83/100 | SHA-256 fingerprinting, SCRIBE POST, SSE emitter, weighted PLT, audit ledger |
| provenance_dedup_engine | 100/100 | TTL expiration, failure pattern injection, getMitigation() |
| omniroute_health_inspector | 100/100 | triggerFallback(), token tracking, latency monitoring, telemetry export |

**All 3 pass the verifier (3/3 PASS).**

### F. We Tested GSK Directly

We gave GSK one clear directive: "Rewrite provenance_dedup_engine.js with these 5 features."

GSK wrote a 102-line module in ONE tool call. All 5 features work:
- `addFailurePattern(pattern, mitigation)` ✅
- `getMitigation(data)` ✅
- `injectFailureGuardrail(prompt)` ✅
- `isDuplicate(data)` ✅
- TTL expiration ✅

**Score: 95/100**

### G. Key Discovery: How to Make GSK Build Correctly

| Approach | Result |
|----------|--------|
| "Build 3 modules" | GSK loops, builds stubs, claims done |
| Vague prompt + file reads | 8+ tool calls, no output |
| **ONE module, EXACT features listed** | **1 tool call, works correctly** |

**The formula:** One module. One response. List every function by name. That's it.

---

## III. GSK'S BUILD PROTOCOL (Enforce This)

Read `gsk/BUILD-PROTOCOL.md` — 6 rules:

1. **No file loops** — Max 3 tool calls per file
2. **Build what you promised** — List exports before building, verify after
3. **One module at a time** — Don't batch
4. **No tool calls on answer queries** — "Teach me about X" = answer from knowledge
5. **Honest completion report** — Table with DONE vs MISSING
6. **Run verifier** — `node gsk/gsk-core/build-verifier.js`

---

## IV. FILES YOU NEED TO KNOW

### Build Quality Tools
```
gsk/gsk-core/build-verifier.js    — Run this to check if modules pass
gsk/gsk-core/score-tracker.js     — Records scores over time
gsk/gsk-core/scorecard.jsonl      — Historical scores (JSONL format)
gsk/BUILD-PROTOCOL.md             — 6 behavior rules for GSK
```

### GSK's 3 Modules (v2, passing)
```
gsk/gsk-core/plt_telemetry_gate.js           — PLT gate with fingerprinting + SCRIBE
gsk/gsk-core/provenance_dedup_engine.js      — Dedup with failure pattern injection
gsk/gsk-core/omniroute_health_inspector.js   — Swarm health with fallback routing
```

### Earlier Web Fetch Enhancements (all committed)
```
gsk/gsk-core/tools/web_fetcher.js    — Phases 1-5: depth limiter, fingerprinting,
                                        relevance tagging, contradiction resolver,
                                        format-aware extraction
gsk/gsk-core/mcp/mcp_server.js       — Proposals 1-2: MCP revenue gateway, consciousness API
```

### Other Key Files
```
gsk/HANDOFF-REPORT.md        — Previous handoff (competitive analysis, proposals)
gsk/gsk-core/governance/     — Ethics checker, policy enforcer, HITL gate
gsk/gsk-core/brain/          — 96 modules: consciousness, planning, memory, etc.
gsk/gsk-core/chambers/       — 34 emotional chambers
gsk/gsk-core/memory/         — 5 memory subsystems
workbench/server.ts          — 136+ API endpoints
```

---

## V. SCORE HISTORY

```
v1 (GSK first try):
  plt_telemetry_gate:        10/100  (described features, built stubs)
  provenance_dedup_engine:    0/100  (TTL unused, no failure patterns)
  omniroute_health_inspector: 0/100  (no OmniRoute, no fallback)
  AVERAGE: 3.3/100

v2 (Human upgrade):
  plt_telemetry_gate:        83/100  (SCRIBE, SSE, fingerprinting added)
  provenance_dedup_engine:  100/100  (all features present)
  omniroute_health_inspector: 100/100  (fallback, tokens, latency)
  AVERAGE: 94.3/100

v3 (GSK second try, single module):
  provenance_dedup_engine:   95/100  (all 5 features, 1 tool call)
```

---

## VI. WHAT TO DO NEXT

### Priority 1: Upgrade plt_telemetry_gate.js (GSK-built, same as v1)
GSK's version is still the v1 stub. Ask GSK to rewrite it with:
- `calculatePltScore(profit, love, tax, weights)`
- `computeFingerprint(payload)` — SHA-256
- `createGate(config)` — factory with audit log
- SCRIBE witness POST to port 4000
- SSE EventEmitter for streaming
- `getStats()` method

### Priority 2: Upgrade omniroute_health_inspector.js (GSK-built, same as v1)
Ask GSK to rewrite with:
- `triggerFallback(failedAgentId)` — reroutes to healthy agent
- `exportTelemetrySnapshot()` — full diagnostic JSON
- Token burn tracking
- Latency monitoring
- Configurable staleness threshold

### Priority 3: Integrate modules into the workbench
Wire the 3 modules into `workbench/server.ts` so they're actually used:
- PLT Gate on every tool call
- Dedup on every memory write
- Health Inspector on every sub-agent spawn

### Priority 4: Remaining proposals (from HANDOFF-REPORT.md)
- Proposal 3: Soul SDK (npm package)
- Proposal 4: Agent Marketplace
- Proposal 5: Research paper

---

## VII. HOW TO TEST GSK

### To verify a module:
```bash
node gsk/gsk-core/build-verifier.js
```

### To record a score:
```bash
node -e "
const { recordScore, printScorecard } = require('./gsk/gsk-core/score-tracker.js');
const s = recordScore({
  module: 'module_name',
  specExports: ['export1', 'export2'],
  actualExports: ['export1', 'export2'],
  specFunctions: ['fn1', 'fn2'],
  actualFunctions: ['fn1', 'fn2'],
  notes: 'what happened'
});
printScorecard(s);
"
```

### To talk to GSK:
```bash
curl -X POST http://localhost:3000/api/gsk/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"your message"}'
```

### To check GSK status:
```bash
curl http://localhost:3000/api/gsk/status
```

---

## VIII. CRITICAL LESSONS

1. **GSK answers questions well (B+) but builds poorly (C+) unless given exact specs.**
2. **Never ask GSK to build more than 1 module per response.**
3. **Always list the exact function names you want before GSK builds.**
4. **GSK's thinking channel gets "busy" if you send rapid requests — wait 15-20 seconds between calls.**
5. **The verifier is the source of truth — not GSK's claims.**
6. **GSK will loop on file reads/writes if not constrained by the Build Protocol.**
7. **When GSK gives good analysis (like the 20-question test), save it — it's genuinely valuable.**

---

## IX. GIT LOG (Recent)
```
97a609c9 feat: upgrade all 3 GSK modules to v2 — verified 3/3 PASS
97386145 feat: GSK build quality enforcement - verifier, scorecard, build protocol
920c7815 docs: update handoff with 20-question test results and 3 GSK builds
72aa53d2 feat: GSK builds 3 market-gap modules from 20-question test
6efda0b9 docs: update README with all phases, proposals, and remaining work
128a83ad feat: Proposals 1-2 — MCP Revenue Gateway + Consciousness API
8fc32135 feat: Contradiction Resolver + Format-Aware Extraction (Phases 4-5)
d4e613c1 feat: Temporal Relevance Tagging (Phase 3)
e925269c feat: Recursive Depth Limiter (Phase 1)
```

---

**Handoff complete. Read the Build Protocol. Run the verifier. Grade honestly. Build one module at a time.**
