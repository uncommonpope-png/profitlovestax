# LUCABRASI THE SOUL — Intelligence, Communication, Skills & Tool Calling Map

tags:: #phase2 #mapping #intelligence #communication #skills #tool_calling
status:: #active
born:: 2026-07-06
version:: 1.0.0
method:: 4-domain parallel analysis using neodownloadable skills as analytical lenses

---

## Executive Summary

GSK is a **hub-and-spoke autonomous agent** with ~74 subsystems, ~280 JS files, ~130 skills, and 6 consciousness layers. This document maps 4 critical architecture domains:

| Domain | Status | Critical Gaps |
|--------|--------|---------------|
| **Intelligence** | ⚠ Partial | Open perception-action loop (now fixed via F9), dual-process engine not wired into thought cycle, no reinforcement signal |
| **Communication** | ⚠ Partial | SCRIBE→GSK unidirectional (now fixed via F1), EventBus is fire-and-forget, dashboard bridge uses fragile monkey-patching |
| **Skills** | ⚠ Large | 130+ skills dual-registered across 2 systems, no skill creator, no tiered evolution, no competence tracking |
| **Tool Calling** | ⚫ Functional | 5 backends, 30+ built-in tools, but no rate limiting, no circuit breakers, no authorization, MCP dual-registry drift |

---

## Part 1 — INTELLIGENCE ARCHITECTURE

### 1.1 System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     EXTERNAL WORLD                            │
│  (User input, Files, Web, Git, APIs, Sanctum :9001)          │
└──────┬───────────────────────────────────────────┬───────────┘
       │                                           │
       ▼                                           ▼
┌──────────────┐                          ┌─────────────────┐
│ autonomous   │                          │   mega_brain    │
│ _learning    │                          │    (9Router)    │
│ (web/git)    │                          │  :20128 POST    │
└──────┬───────┘                          └────────┬────────┘
       │                                          │
       ▼                                          ▼
┌──────────────────────────────────────────────────────────────┐
│                     PERCEPTION (ad-hoc)                        │
│  memory.query, userActive/idle, _lastToolResult, sanctumClient │
└─────────────────────────────────────┬────────────────────────┘
                                      │
┌─────────────────────────────────────▼────────────────────────┐
│              PERPETUAL CONSCIOUSNESS                          │
│  _cycleThoughts() loop (5s default, 9 thought modes)         │
│  _generateThought() → brain.think() or light fallback        │
│  _incorporateActionResult() from F9                           │
│  _checkAutonomousActions() from F11                           │
├─────────────────────┬───────────────────────┬────────────────┤
│  metacognition      │  dual_process_engine  │  planning      │
│  meta-awareness     │  System 1 (fast)      │  _engine       │
│  bias detection     │  System 2 (Bayesian)  │  create+exec   │
└─────────────────────┴───────────────────────┴────────────────┤
                                                               │
┌──────────────────────────────────────────────────────────────▼┐
│              PLANNING LAYER                                    │
│  planning_engine ─── kernel.dispatch()                        │
│  world_model_simulation ── simulate → evaluate → plan         │
│  purpose_engine (hour-based selection)                        │
│  intrinsic_motivation (random goal templates)                 │
└──────────────────────────────────────────┬───────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────┐
│              ACTION DISPATCH                                  │
│  kernel.dispatch() → tool bridge → 5 backends                │
│  sanctumClient → world actions                               │
│  self_evolution → writes skill .js files                     │
└──────────────────────────────────────────┬───────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────┐
│              LEARNING / MEMORY                                │
│  self_growing_brain → KnowledgeGraph + training data         │
│  autonomous_learning → web/git/conversation → memory         │
│  self_evolution → pattern→skill generation → verify          │
│  consciousness_engine → self-model snapshots                 │
└──────────────────────────────────────────┬───────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ FEEDBACK    │
                                    │ _lastToolRes│
                                    │ noteActionResult│
                                    │ (F9 + F10)  │
                                    └─────────────┘
```

### 1.2 Component Inventory

| File | Lines | Role | Key Methods |
|------|-------|------|-------------|
| `brain/mega_brain.js` | 389 | LLM interface | `think()`, `_nineRouter()`, `_consultBible()`, sovereignty checks |
| `brain/perpetual_consciousness.js` | 627 | Thought generation loop | `_cycleThoughts()`, `_generateThought()`, `_updateMode()`, `_selectSafeMode()` |
| `brain/dual_process_engine.js` | 940 | System 1/2 diagnostic engine | `system1()`, `system2()`, `diagnose()`, `selfDiagnose()`, `decideMode()` |
| `brain/planning_engine.js` | 292 | Plan creation/execution | `createPlan()`, `executePlan()`, `noteActionResult()`, `reflectOnPlan()` |
| `brain/world_model_simulation.js` | 252 | Mental simulation | `simulate()`, `_perceive()`, `_hypothesize()`, `_simulateBranch()`, `_evaluate()` |
| `brain/self_growing_brain.js` | 288 | Experience → knowledge graph | `learnFromExperience()`, `selfFineTune()`, `growKnowledge()` |
| `brain/autonomous_learning.js` | 334 | External knowledge ingestion | `learnFromWeb()`, `learnFromGit()`, `continuousLearn()` |
| `brain/metacognition.js` | 146 | Thinking-about-thinking | `reflect()`, `monitorCognition()`, `assessBiases()` |
| `brain/self_evolution.js` | 364 | Code self-modification | `evolve()`, `_discoverPatterns()`, `_generateSkill()`, `_verifySkill()` |
| `brain/purpose_engine.js` | 143 | Purpose/intent | `selectPurpose()`, `evaluateMeaning()` |
| `brain/intrinsic_motivation.js` | 142 | Intrinsic drives | `generateGoal()`, `updateDrives()` |
| `brain/consciousness_engine.js` | 333 | Consciousness monitoring | `runConsciousnessCycle()`, `sentienceTest()`, `deepReflect()` |

### 1.3 Thought Cycle Flow

```
start()
  → _cycleThoughts() every 5s (default)
    → _isBrainAvailable() check (cooldown + consecutive failures)
    → _selectSafeMode() — light mode fallback during cooldown
    → _generateThought()
      → if LLM mode AND brain available:
          kernel.brain.think(prompt, {mode, usedLightMode})
      → else:
          light fallback "[OBSERVING] I am currently observing."
    → _incorporateActionResult() — append tool result (F9) or escalation (F11)
    → _recordThought() → thoughtQueue + memory.witness()
    → _checkAutonomousActions() — triggers questions/study/reflection
```

### 1.4 Gap Analysis

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| G1 | No formal sensor/perception layer — every module reads state differently | Fragile | Cross-cutting |
| G2 | Simulation is pure LLM text generation, no state machine | Inaccurate | `world_model_simulation.js` |
| G3 | Self-growing brain never fine-tunes — `_checkOwnBrainAvailable()` hardcoded `return false` | Training data accumulates forever | `self_growing_brain.js:196` |
| G4 | Purpose engine is hour-of-day based, not experience-driven | Shallow | `purpose_engine.js:34-46` |
| G5 | Intrinsic motivation uses `Math.random()` — no real drive dynamics | Random | `intrinsic_motivation.js:62-88` |
| G6 | `decideMode()` exists in dual-process engine but never called by consciousness | ❌ Dead code | `dual_process_engine.js` ↔ `perpetual_consciousness.js` |
| G7 | Planning and simulation are siloed — no cross-references | Missed optimization | `planning_engine.js` ↔ `world_model_simulation.js` |
| G8 | No shared event bus for perception — modules poll independently | Race conditions | Cross-cutting |
| G9 | No reinforcement signal — all experiences weighted `0.5` | No learning | `self_growing_brain.js`, `knowledge_graph.js` |
| G10 | Metacognition is heuristic-only — clarity = thought length heuristics | Superficial | `metacognition.js:113-122` |

### 1.5 Recommended Improvements

1. **Wire `decideMode()` into `_updateMode()`** — Replace arousal-only mode selection with diagnostic-driven. Single change, high impact.
2. **Replace `_lastToolResult` polling with EventBus** — `emit('tool_result', ...)` / `on('tool_result', ...)`. ~60 lines.
3. **Make `_checkOwnBrainAvailable()` actually check** — Remove hardcoded `return false`. Check for fine-tuned model file.
4. **Add action failure → mode switching** — In `_incorporateActionResult()`, failed actions bias toward DREAMING/META_COGNIZING.
5. **Build a `SensorSuite` class** — Centralize all sensor input with typed events and confidence scoring.

---

## Part 2 — COMMUNICATION ARCHITECTURE

### 2.1 Topology: Modified Hub-and-Spoke

```
                                 ┌──────────────┐
                                 │  9Router     │
                                 │  :20128      │
                                 │  HTTP/JSON   │
                                 └──────┬───────┘
                                        │
                                   ┌────▼──────────────────────────┐
                                   │       GSK FUSION               │
                                   │  (in-process kernel)           │
                                   │                                │
                                   │  ┌─────────┐ ┌──────────────┐ │
                                   │  │EventBus  │▶│MemoryCompiler│ │
                                   │  │Emit/On   │ │ subscriber   │ │
                                   │  └────┬────┘ └──────────────┘ │
                                   │       │                       │
                                   │  ┌────▼────┐ ┌─────────────┐  │
                                   │  │Chambers  ││GodsCouncil  │  │
                                   │  │78 nodes  ││4 Gods (LLM) │  │
                                   │  └──────────┘└─────────────┘  │
                                   │  ┌──────────┐ ┌─────────────┐  │
                                   │  │Emotions  ││SubAgent Orch│  │
                                   │  │8 systems ││spawner+orch │  │
                                   │  └──────────┘└─────────────┘  │
                                   │  ┌──────────┐ ┌─────────────┐  │
                                   │  │toolBridge││ComboOrch    │  │
                                   │  │158 tools ││.combo.md    │  │
                                   │  └──────────┘└─────────────┘  │
                                   └────┬────────┬─────────┬───────┘
                                        │        │         │
                              ┌─────────┘        │         └──────────┐
                              ▼                   ▼                   ▼
                    ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
                    │  SCRIBE :4000    │ │  DASHBOARD   │ │  SANCTUM :9001   │
                    │  HTTP/JSON       │ │  :4490 WS+   │ │  WebSocket       │
                    │  UNIDIRECTIONAL  │ │  REST        │ │  BIDIRECTIONAL   │
                    │  (now FIXED via  │ │  BIDIRECTIONAL│ │                  │
                    │   F1)            │ │              │ │                  │
                    └──────────────────┘ └──────────────┘ └──────────────────┘
```

### 2.2 Protocol Inventory

| Channel | Protocol | Transport | Direction | Status |
|---------|----------|-----------|-----------|--------|
| EventBus | JS objects via `emit()` | In-process EventEmitter | Pub/sub (broadcast) | ✅ Fire-and-forget |
| Chambers | Direct `.breathe()` calls | In-process sync chain | Sequential cascade | ✅ 78 nodes |
| Council→Brain | Prompt/JSON | `brain.think()` HTTP POST | Sync request/response | ✅ 4 sequential calls |
| Combo→ToolBridge | `invoke(name, params)` | In-process method | Sync request/response | ✅ With fallback |
| ScribeBridge→SCRIBE | HTTP/JSON POST | `http.request` to `:4000` | **Was unidirectional** | ✅ F1: tool route added to `:4490` |
| Dashboard↔Client | JSON over WebSocket | `ws` library | Bidirectional | ✅ Real-time |
| Sanctum↔GSK | JSON over WebSocket | `ws` library | Bidirectional | ✅ To `:9001` |
| Brain→9Router | HTTP/JSON POST | `http.request` to `:20128` | Bidirectional | ✅ With model fallback |
| MCP | JSON-RPC 2.0 | stdio/HTTP | Bidirectional | ✅ 27 known server types |
| TelemetryEngine | Object refs + polling | In-process | Unidirectional (push) | ✅ F3: wired |

### 2.3 Fragility Points

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | EventBus is fire-and-forget — no delivery guarantees, no ack | `event_bus.js` | Events lost silently |
| 2 | Dashboard bridge uses monkey-patching — wraps 4 core functions | `gsk-dashboard-bridge.js:146-301` | One broken wrap = collapse |
| 3 | ComboOrchestrator uses `new Function()` — `eval()` equivalent | `combo_orchestrator.js` | Code injection risk |
| 4 | Council deliberates sequentially — 4 gods × LLM call with no `Promise.all` | `gods_council.js` | Slow deliberation |
| 5 | No structured event schemas — EventBus has no type validation | `event_bus.js` | Schema drift |
| 6 | Chambers breathe() is hardcoded cascade — 78 explicit calls | `mega_chambers.js:437-476` | Adding chamber requires modifying orchestrator |
| 7 | Telemetry polls object refs instead of subscribing to EventBus | `telemetry_engine.js` | Parallel universes: bus ≠ telemetry |

### 2.4 Recommended Improvements

1. **Bidirectional SCRIBE bridge** — ✅ Done via F1 (`kernel_sync.js` now hits `:4490/tool`)
2. **EventBus telemetry pipeline** — Add passive listener that streams all events to TelemetryEngine
3. **Council parallelization** — `Promise.all` for 4 god positions
4. **Combo condition evaluator** — Replace `new Function()` with sandboxed expression evaluator
5. **Structured event schemas** — JSON schemas per event type with `EventBus.publish()` validation
6. **WebSocket event stream** — Add `/gsk/eventbus/stream` WS endpoint for all EventBus traffic

---

## Part 3 — SKILLS ARCHITECTURE

### 3.1 Registration Flow

```
┌──────────────────────────────┐
│   SkillsEngine constructor   │
│   (mega_skills.js:80-426)    │
├──────────────────────────────┤
│ loadSkillFiles()             │
│   scans skills/*.js          │
│   exports functions          │
│   as skill entries           │
├──────────────────────────────┤
│ Inline Registry              │
│   52 hardcoded _skill_*      │
│   methods with PLT           │
├──────────────────────────────┤
│ Merge: file over inline      │
│   (non-duplicate by name)    │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   skill_registry (Map)       │
│   130+ entries (est.)        │
└──────────┬───────────────────┘
           │
           ▼ (also loaded independently by)
┌──────────────────────────────┐
│ UniversalToolBridge          │
│   _registerBuiltinTools():   │
│   scans skills/*.js again    │
│   registers as toolRegistry  │
│   entries (separate system!) │
└──────────────────────────────┘
```

### 3.2 Dispatch Chain (5 Backends)

```
UniversalToolBridge.invoke(tool, args)
  ├── 1. Built-in Registry ─── 30+ tools (read_file, write_file, world_*, sandbox, etc.)
  ├── 2. MCP Servers ───────── JSON-RPC 2.0 to configured servers
  ├── 3. Bridge Gateway ────── gskDashBridge.dispatchCommand() via route map
  ├── 4. Cline ─────────────── kernel.fusion.body.runCline(JSON.stringify({tool, args}))
  └── 5. Skill Dispatch ────── kernel.fusion.systems.skillDispatch.run()
```

### 3.3 Skill Catalog (130+)

| Category | Count | Examples |
|----------|-------|----------|
| **Core inline** (mega_skills.js) | 52 | `reason_deep`, `score_idea`, `write_production_code`, `decide_with_council` |
| **File-based JS** (skills/*.js) | ~125 | `web_search.js`, `github.js`, `social_post.js`, `cron_schedule.js` |
| **Sage skills** (sage_skills.js) | 15 | `verifiable_goal_definition`, `design_plan_generation`, `report_generation` |
| **Tool Bridge builtins** | ~25 | `read_file`, `write_file`, `sandbox_execute`, `world_*`, `telegram_send` |
| **Total unique** | **~130-150** | After dedup |

### 3.4 Gap Analysis

| # | Gap | Severity | Details |
|---|-----|----------|---------|
| S1 | **Dual registration** — Skills loaded by both SkillsEngine and ToolBridge, separate registries | MEDIUM | Same files scanned twice, different dispatch paths |
| S2 | **No Skill Creator** — No CLI or tool to scaffold a new skill | HIGH | All 125+ skills hand-written |
| S3 | **MANIFEST/run() not used** — Every file has them but dispatch ignores them | MEDIUM | Dead metadata |
| S4 | **Tiered Evolution** — Doc exists but no code implements tier tracking | HIGH | `sage_skills.js` has stub only |
| S5 | **Dynamic Competence Mapping** — Doc exists but unimplemented | HIGH | No skill → competence stage mapping |
| S6 | **Dynamic Tool Acquisition** — Doc exists but not wired | HIGH | Skill dir scan exists but feature incomplete |
| S7 | **No skill dependency graph** — No way to express A depends on B | MEDIUM | Combos handle ad-hoc but no formal model |
| S8 | **No skill testing harness** — `skill_tester.js` exists but no standard assertions | MEDIUM | No unit tests for skills |
| S9 | **Hardcoded combo path** — `C:\Users\uncom\...` path in source | MEDIUM | Not portable |

### 3.5 Recommended Improvements

1. **Create SkillCreator CLI** — `gsk skill create my_skill --dir skills/` scaffolds MANIFEST, PLT, function stub
2. **Unify registration** — ToolBridge should delegate skill dispatch to SkillsEngine, not duplicate
3. **Use MANIFEST** — Read `MANIFEST.name` and `version` instead of inferring from filename
4. **Implement Tiered Evolution** — Add `tier`/`prerequisites`/`stage` fields to skill_registry
5. **Make combo path configurable** — Environment variable or constructor option

---

## Part 4 — TOOL CALLING ARCHITECTURE

### 4.1 Five Backend Dispatch Chain

```
invoke(tool, args)
  │
  ├── 1. BUILT-IN REGISTRY
  │     this.toolRegistry.has(tool)
  │     → await this.toolRegistry.get(tool)(args)
  │     → _callScribe() + _storeActionResult() + _trackToolHealth()
  │     Stats: builtinToolCalls++
  │
  ├── 2. MCP SERVERS
  │     for ([name, server] of this.mcpServers):
  │       if server.capabilities.includes(tool) || capabilities.length === 0:
  │         → this._callMcpServer(server, tool, args)
  │         = HTTP POST JSON-RPC 2.0 to server.url, 30s timeout
  │     Stats: mcpServerCalls++
  │
  ├── 3. BRIDGE GATEWAY
  │     → gskDashBridge.dispatchCommand({route, skill, args, input})
  │     Route map: read_file→brain, search_code→memory, web_fetch→skill, etc.
  │     Stats: bridgeGatewayCalls++
  │
  ├── 4. CLINE
  │     → kernel.fusion.body.runCline(JSON.stringify({tool, args}))
  │     → result.output unwrapped
  │     Stats: clineCalls++
  │
  └── 5. SKILL DISPATCH
        → kernel.fusion.systems.skillDispatch.run(tool, stringifiedArgs)
        Stats: skillDispatchCalls++
```

### 4.2 Built-in Tool Inventory (~30)

| Category | Tools | Files |
|----------|-------|-------|
| **File I/O** | `read_file`, `write_file` (with lock), `search_code`, `list_files` | `bridge.js:437-481` |
| **Network** | `web_fetch` (5k truncation) | `bridge.js:484-495` |
| **Shell** | `run_command` (unsandboxed fallback), `run_safe_command` (sandboxed), `sandbox_approvals`, `sandbox_stats` | `bridge.js:498-530` |
| **Sanctum World** | `world_get_state`, `world_spawn_soul`, `world_send_command`, `world_list_souls`, `world_place_building`, `world_list_buildings` | `bridge.js:594-640` |
| **Diagnostic** | `diagnose` (dual-process engine) | `bridge.js:546-557` |
| **Sandbox** | `sandbox_execute` (isolated-vm) | `bridge.js:562-585` |
| **Social** | `social_post`, `bluesky_post`, `mastodon_post`, `tumblr_post`, `devto_post`, `telegram_send` | `bridge.js:696-759` |
| **Orchestration** | `execute_combo`, `unified_project_build`, `get_mcp_servers` | `bridge.js:725-742` |
| **Memory** | `scribe_witness` (calls SCRIBE :4000) | `bridge.js:68` |

### 4.3 Security Analysis

| Protected | Not Protected |
|-----------|---------------|
| `validatePath` — blocks `..` traversal | ❌ **No rate limiting** — unbounded invocation rate |
| `sanitizeCommand` — blocks shell injection chars | ❌ **No authentication** — any caller invokes any tool |
| `validateArgs` — type checks, required fields | ❌ **No authorization** — no role/capability check |
| `createWriteLock` — per-file mutex | ❌ **No output size limits** — `_readFile` returns full content |
| `_searchCode` — pattern length cap (200) | ❌ **Telegram token hardcoded** in source (fallback) |
| `_webFetch` — response truncated to 5k | ❌ **No TLS cert validation** — MITM possible |
| **F14** escalation after 3 failures | ❌ **No circuit breaker** — escalation doesn't stop retries |

### 4.4 Dashboard Command Routes

| Route | Command | Handler |
|-------|---------|---------|
| `brain` | `gsk.think()` | Direct thought |
| `council` | `gsk.dispatchTask('council_deliberate')` | Council deliberation |
| `skill` | `gsk.runSkill(payload.skill)` | Skill execution |
| `tool` | `toolBridge.invoke()` | **Backdoor to all tools** |
| `memory` | `memory.witness()` | Memory write |
| `engineering` | `telemetryEngine.getReport()` | **Available via /api/gsk/telemetry/report** |

### 4.5 Recommended Improvements

1. **Add circuit breakers** — per-tool `CLOSED→OPEN→HALF_OPEN` states after N failures
2. **Add rate limiting** — per-tool and global token bucket
3. **Add tool authorization** — role-based or capability-based access control per tool category
4. **Remove hardcoded Telegram token** — throw if `TELEGRAM_BOT_TOKEN` not set
5. **Add output size limits** — `maxOutputBytes` parameter with truncation warning
6. **Fix MCP dual registry** — Register MCP servers via `MCPManager` and have bridge delegate
7. **Add per-backend timeout** — `Promise.race([call, timeout(delay)])` for all 5 backends
8. **Fix `_runCommand` fallthrough** — Throw error instead of falling back to unsandboxed `execSync`

---

## Part 5 — Consolidated Next Steps

### Immediate (P0/P1 fixes already applied)
| Fix | Domain | Status |
|-----|--------|--------|
| F1 SCRIBE→GSK bridge | Communication | ✅ Tool route at `:4490` |
| F2 Resource leak | Intelligence | ✅ Cooldown + backoff + light mode |
| F3 Telemetry pipeline | All | ✅ TelemetryEngine wired |
| F9 Close perception loop | Intelligence | ✅ Action results feed back |
| F10 Action→plan feedback | Intelligence | ✅ `noteActionResult()` |
| F11 Human escalation | Tool Calling | ✅ Escalation queue + API |

### Remaining Priority (from wiring audit)

| # | Fault | Domain | Severity | Action |
|---|-------|--------|----------|--------|
| **F4** | Self-modification loop | Intelligence | **P1** | Wire `self_evolution.js` test→deploy pipeline |
| **F5** | Test failures | All | **P2** | Fix `symbolic_memory._savePatterns`, `axiom_enforcer.check` |
| **F12** | No real RAG | Intelligence | **P2** | Replace TF-IDF with embeddings, add chunking + retrieval |
| **F13** | No prompt management | Intelligence | **P2** | Version prompts, add A/B testing pipeline |
| **F6** | No Skill Creator | Skills | **P2** | Build CLI to scaffold new skills |
| **F14** | No safety guardrails | Tool Calling | **P2** | Add circuit breakers, rate limiting, authorization |
| **F7** | Chambers not wired | Intelligence | **P2** | Feed affective state as weighted context into `brain.think()` |
| **F15** | No inter-agent protocol | Communication | **P2** | Structured message format between GSK and SCRIBE |
| **F16** | No evaluation framework | All | **P2** | Add benchmarks, systematic testing, performance metrics |
| **F8** | World sim not wired | Intelligence | **P2** | Connect `world_model_simulation.js` to Sanctum |
| **F17** | No emergent monitoring | Communication | **P3** | Detect unexpected system-level outcomes |
| **F18** | No RL from outcomes | Intelligence | **P3** | Add reward signals from action outcomes |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | GSK-MAP-001 |
| Method | 4-domain parallel analysis |
| Skills Used | Perception-Action Loop, Dual-Process Engine, World Model Simulation, Plan from Simulation, Tool Use Orchestration, Event-Bus Synchronization, Skill Combo Orchestrator, Dynamic Tool Acquisition, MCP Protocol, 24+ neodownloadable skills |
| Total pages | 4 domains, 64 findings, 20+ recommendations |
| Date | 2026-07-06 |
