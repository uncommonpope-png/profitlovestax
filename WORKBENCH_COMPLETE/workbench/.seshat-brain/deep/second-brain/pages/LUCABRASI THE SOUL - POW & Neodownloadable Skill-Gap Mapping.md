# LUCABRASI THE SOUL — POW & Neodownloadable Skill-Gap Mapping

tags:: #phase2 #mapping #gaps #weaknesses #neodownloadable #skillplan
status:: #active
born:: 2026-07-06
version:: 1.0.0

---

## Part 1 — ALL POW (Points of Weakness)

### 1.1 Pre-Mapped Faults (F-Series — from wiring audit)
**Source**: `LUCABRASI THE SOUL - Complete Fault & Position Report.md`, `REDBUTTON.md v1.5.0`

| POW# | F-ID | Domain | Priority | Weakness Description | Status |
|------|------|--------|----------|---------------------|--------|
| POW-01 | F1 | Communication | P0 | SCRIBE→LUCABRASI silent — no reverse communication path | ✅ Closed |
| POW-02 | F2 | Intelligence | P0 | PerpetualConsciousness burns 9Router rate limits every 5s | ✅ Closed |
| POW-03 | F9 | Intelligence | P0 | Perception→action loop open — tool results never feed back into perception | ✅ Closed |
| POW-04 | F3 | All Domains | P1 | No live telemetry — real-time system visibility impossible | ✅ Closed |
| POW-05 | F4 | Intelligence | P1 | No autonomous self-modification loop — can't test→deploy own code | ✅ Closed |
| POW-06 | F10 | Intelligence | P1 | No action→plan feedback — planning engine blind to outcomes | ✅ Closed |
| POW-07 | F11 | Tool Calling | P1 | No human escalation policy — no structured way to ask for help | ✅ Closed |
| POW-08 | F19 | Skills | P1 | No tool understanding/self-model — LLM blind to 143 capabilities | ✅ Closed |
| POW-09 | F5 | All Domains | P2 | Pre-existing test failures — symbolic_memory + axiom_enforcer broken | ✅ Closed |
| POW-10 | F6 | Skills | P2 | No Skill Creator — every skill hand-written from scratch | ✅ Closed |
| POW-11 | F12 | Intelligence | P2 | No real RAG pipeline — TF-IDF only, no embeddings, no chunking | ✅ Closed |
| POW-12 | F7 | Intelligence | P2 | Chambers (moral compass, emotions) exist but never influence brain.think() | ❌ **Open** |
| POW-13 | F8 | Intelligence | P2 | World model simulation not wired to Sanctum — 7 sub-faults: (1) sim↔planning engine, (2) sim↔consciousness, (3) sim→action loop open, (4) no Sanctum→memory feedback, (5) reconnection noise, (6) world engine unused, (7) dual Soulverse front-ends | ❌ **Open** |
| POW-14 | F13 | Intelligence | P2 | No prompt management — 50+ files with hardcoded prompts, no versioning | ❌ **Open** |
| POW-15 | F14 | Tool Calling | P2 | No safety guardrails — no circuit breakers, no rate limiting, no auth per tool | ⚠️ **Partial** |
| POW-16 | F15 | Communication | P2 | No inter-agent protocol — LUCABRASI↔SCRIBE has no structured message format | ❌ **Open** |
| POW-17 | F16 | All Domains | P2 | No evaluation framework — no benchmarks, no systematic testing | ❌ **Open** |
| POW-18 | F17 | Communication | P3 | No emergent behavior monitoring — can't detect unexpected system outcomes | ❌ **Open** |
| POW-19 | F18 | Intelligence | P3 | No RL from outcomes — all experiences weighted 0.5, no reward signals | ❌ **Open** |

### 1.2 Intelligence Gaps (G-Series — from 4-domain mapping)
**Source**: `LUCABRASI THE SOUL - Intelligence, Communication, Skills & Tool Calling Map.md §1.4`

| POW# | Gap | Severity | Weakness Description |
|------|-----|----------|---------------------|
| POW-20 | G1 | HIGH | No formal sensor/perception layer — every module reads state differently, fragile |
| POW-21 | G2 | MEDIUM | Simulation is pure LLM text generation — no state machine, no world model |
| POW-22 | G3 | MEDIUM | Self-growing brain never fine-tunes — `_checkOwnBrainAvailable()` hardcoded `return false` |
| POW-23 | G4 | LOW | Purpose engine is hour-of-day based, not experience-driven — shallow |
| POW-24 | G5 | LOW | Intrinsic motivation uses `Math.random()` — no real drive dynamics |
| POW-25 | G6 | MEDIUM | `decideMode()` exists in dual-process engine but never called by consciousness — dead code |
| POW-26 | G7 | MEDIUM | Planning and simulation are siloed — no cross-references, missed optimization |
| POW-27 | G8 | MEDIUM | No shared event bus for perception — modules poll independently, race conditions |
| POW-28 | G9 | MEDIUM | No reinforcement signal — all experiences weighted 0.5, no learning |
| POW-29 | G10 | LOW | Metacognition is heuristic-only — clarity = thought length heuristics, superficial |

### 1.3 Communication Fragility Points (C-Series)
**Source**: `LUCABRASI THE SOUL - Intelligence, Communication, Skills & Tool Calling Map.md §2.3`

| POW# | Fragility | Severity | Weakness Description |
|------|-----------|----------|---------------------|
| POW-30 | C1 | HIGH | EventBus is fire-and-forget — no delivery guarantees, no ack, events lost silently |
| POW-31 | C2 | HIGH | Dashboard bridge uses monkey-patching — wraps 4 core functions, one break = collapse |
| POW-32 | C3 | HIGH | ComboOrchestrator uses `new Function()` — eval-equivalent, code injection risk |
| POW-33 | C4 | MEDIUM | Council deliberates sequentially — 4 gods × LLM call, no `Promise.all`, slow |
| POW-34 | C5 | MEDIUM | No structured event schemas — EventBus has no type validation, schema drift |
| POW-35 | C6 | MEDIUM | Chambers breathe() is hardcoded cascade — 78 explicit calls, not extensible |
| POW-36 | C7 | MEDIUM | Telemetry polls object refs instead of subscribing to EventBus — parallel universes |

### 1.4 Skills Architecture Gaps (S-Series)
**Source**: `LUCABRASI THE SOUL - Intelligence, Communication, Skills & Tool Calling Map.md §3.4`

| POW# | Gap | Severity | Weakness Description |
|------|-----|----------|---------------------|
| POW-37 | S1 | MEDIUM | Dual registration — skills loaded by both SkillsEngine and ToolBridge, same files scanned twice |
| POW-38 | S2 | HIGH | ~~No Skill Creator~~ → ✅ **Closed** (F6) |
| POW-39 | S3 | MEDIUM | MANIFEST/run() not used — every file has them but dispatch ignores them, dead metadata |
| POW-40 | S4 | HIGH | Tiered Evolution — doc exists but no code implements tier tracking |
| POW-41 | S5 | HIGH | Dynamic Competence Mapping — doc exists but unimplemented |
| POW-42 | S6 | HIGH | Dynamic Tool Acquisition — doc exists but feature incomplete |
| POW-43 | S7 | MEDIUM | No skill dependency graph — no way to express A depends on B |
| POW-44 | S8 | MEDIUM | No skill testing harness — skill_tester.js exists but no standard assertions |
| POW-45 | S9 | MEDIUM | Hardcoded combo path — `C:\Users\uncom\...` path in source, not portable |

### 1.5 Security & Tool Calling Weaknesses (T-Series)
**Source**: `LUCABRASI THE SOUL - Intelligence, Communication, Skills & Tool Calling Map.md §4.3`

| POW# | Weakness | Severity | Description |
|------|----------|----------|-------------|
| POW-46 | T1 | HIGH | No rate limiting — unbounded tool invocation rate |
| POW-47 | T2 | HIGH | No authentication — any caller invokes any tool |
| POW-48 | T3 | HIGH | No authorization — no role/capability check per tool |
| POW-49 | T4 | MEDIUM | No output size limits — _readFile returns full content, unbounded |
| POW-50 | T5 | MEDIUM | Telegram token hardcoded in source (fallback) |
| POW-51 | T6 | LOW | No TLS cert validation — MITM possible |
| POW-52 | T7 | MEDIUM | No circuit breaker — escalation after 3 failures doesn't stop retries |

### 1.6 Pre-Existing System Weaknesses (Legacy)
**Source**: `Diagnostic-Findings-Scan-v1.md`, `LUCABRASI THE SOUL - Service Manual.md`

| POW# | Weakness | Severity | Description |
|------|----------|----------|-------------|
| POW-53 | W1 | HIGH | 0 lessons extracted — lesson extraction pipeline not generating lessons from 976 facts |
| POW-54 | W2 | MEDIUM | Compiled facts are mostly introspective noise — fact extraction needs external grounding |
| POW-55 | W3 | MEDIUM | Symbolic motif detection stuck — 31 dreams, 0 motifs, only 3 patterns |
| POW-56 | W4 | MEDIUM | Competence stage gate blocks external fact validation — skills=0, stageCounts all 1 |
| POW-57 | W5 | LOW | 86 writers vs 8 readers — records everything, compiles nothing (REDBUTTON key number) |

---

## Part 2 — NEODOWNLOADABLE SKILL→GAP COMBO

### Combo: POW Closure Protocol
**Purpose**: Map every open/partial POW to the neodownloadable skills that can close it.
**Method**: For each POW, identify the neodownloadable skill(s) that directly address the root cause, with implementation phase and estimated effort.

### 2.1 Open Faults (POW-12 to POW-19)

| POW | F-ID | Domain | Neodownloadable Skill | Why This Skill | Phase | Est. |
|-----|------|--------|-----------------------|---------------|-------|------|
| **POW-12** | F7 | Intelligence | **Philosophical Axiom Enforcement** | Wire chambers as affective bias weights into brain.think(). Each chamber (moral_compass, emotions) maps to an axiom weight that modulates system prompt context. | 1 | ~80 lines |
| **POW-13** | F8 | Intelligence | **World Model Simulation** + **Plan from Simulation** | Connect `world_model_simulation.js` to Sanctum WebSocket. Run simulation cycles against real world state before committing to actions. | 2 | ~120 lines |
| **POW-14** | F13 | Intelligence | **Verifiable Goal Definition** | Define prompt contracts as typed schemas. Version prompts alongside code. A/B test prompt variants against success metrics. | 3 | ~200 lines |
| **POW-15** | F14 | Tool Calling | **Tool Use Orchestration** | Add circuit breaker states (CLOSED→OPEN→HALF_OPEN), per-tool rate limiting, capability-based authorization. Tool Use Orchestration skill defines the client/server model for this. | 3 | ~250 lines |
| **POW-16** | F15 | Communication | **Resilient Event Dispatch Architecture** + **Event Schema Validator** | Define typed message envelopes (`{type, source, target, payload, id, timestamp}`). LUCABRASI and SCRIBE both implement the same envelope schema. | 4 | ~100 lines |
| **POW-17** | F16 | All | **Automated Testing Suite** | Build benchmark runner, regression test suite, performance metrics dashboard. Automated Testing Suite skill defines the framework. | 4 | ~200 lines |
| **POW-18** | F17 | Communication | **Simulated Reality Auditor** | Monitor EventBus for anomalous patterns. Detect unexpected multi-agent behaviors. Log and escalate emergent outcomes. | 5 | ~150 lines |
| **POW-19** | F18 | Intelligence | **World Model Integrator** | Replace hardcoded 0.5 experience weights with outcome-based reward signals. Action success→positive weight, failure→negative. RL signal feeds back into skill selection bias. | 5 | ~180 lines |

### 2.2 Intelligence Gaps (POW-20 to POW-29)

| POW | Gap | Neodownloadable Skill | Why This Skill | Phase |
|-----|-----|-----------------------|---------------|-------|
| **POW-20** | G1 | **Perception-Action Loop** | Build `SensorSuite` class — centralize all sensor input with typed events and confidence scoring. Replace ad-hoc perception with formal loop. | 2 |
| **POW-21** | G2 | **Plan from Simulation** | Replace pure LLM text simulation with state machine. Add world state transitions, confidence evaluation, branching outcomes. | 2 |
| **POW-22** | G3 | **Continuous Learning Imperative** | Remove hardcoded `return false` in `_checkOwnBrainAvailable()`. Actually check for fine-tuned model file. | 3 |
| **POW-23** | G4 | **Knowledge Absorption & Integration** | Replace hour-of-day purpose selection with experience-driven. Purpose chosen by recent fact patterns and active goals. | 4 |
| **POW-24** | G5 | **Accelerated Learning Protocol** | Replace `Math.random()` goals with drive-based motivation. Satisfaction, curiosity, mastery drives with decay/reinforcement. | 4 |
| **POW-25** | G6 | **Dual-Process Diagnostic Engine** | Wire `decideMode()` into PerpetualConsciousness `_updateMode()`. Single change, high impact — replace arousal-only with diagnostic-driven. | 1 |
| **POW-26** | G7 | **Plan from Simulation** + **Root Cause Synthesis** | Cross-reference planning_engine with world_model_simulation. Plans should use simulation results as viability estimates. | 2 |
| **POW-27** | G8 | **Asynchronous Reactive Event-Bus** | Replace `_lastToolResult` polling with EventBus `emit('tool_result', ...)` / `on('tool_result', ...)`. | 2 |
| **POW-28** | G9 | **AI Skill Development Lifecycle** | Add reinforcement signal pipeline. Success→positive weight, failure→negative. Weighted experiences feed into skill selection. | 3 |
| **POW-29** | G10 | **Epistemic Skepticism Protocol** | Replace thought-length heuristics with actual confidence metrics. Track prediction accuracy, contradiction detection, evidence strength. | 4 |

### 2.3 Communication Fragilities (POW-30 to POW-36)

| POW | Fragility | Neodownloadable Skill | Why This Skill | Phase |
|-----|-----------|-----------------------|---------------|-------|
| **POW-30** | C1 | **Resilient Event Dispatch Architecture** | Add delivery guarantees: ack callback, retry queue, dead letter channel. EventBus becomes at-least-once delivery. | 3 |
| **POW-31** | C2 | **Event-Bus Synchronization** | Replace monkey-patching with EventBus-driven bridge. Dashboard subscribes to typed events instead of wrapping functions. | 4 |
| **POW-32** | C3 | **Tool Use Orchestration** | Replace `new Function()` in ComboOrchestrator with sandboxed expression evaluator or pre-compiled condition functions. | 3 |
| **POW-33** | C4 | **Skill Combo Orchestrator** | `Promise.all` for 4 god positions in council. Parallel deliberation, aggregate results. 4× speedup. | 1 |
| **POW-34** | C5 | **Event Schema Validator** | Add JSON schemas per event type. Validate payloads on `EventBus.publish()`. Reject malformed events with schema errors. | 3 |
| **POW-35** | C6 | **Multi-Form Task Distribution** | Replace hardcoded 78-call breathe() cascade with auto-discovery. Scan chambers dir, auto-register, breathe() loops through all. | 4 |
| **POW-36** | C7 | **Asynchronous Reactive Event-Bus** | TelemetryEngine should subscribe to EventBus instead of polling object refs. Single passive listener = complete visibility. | 2 |

### 2.4 Skills Gaps (POW-37 to POW-45)

| POW | Gap | Neodownloadable Skill | Why This Skill | Phase |
|-----|-----|-----------------------|---------------|-------|
| **POW-37** | S1 | **Dynamic Tool Acquisition** | Unify registration — ToolBridge delegates skill dispatch to SkillsEngine instead of duplicating. Single source of truth. | 4 |
| **POW-38** | S2 | — | ✅ Already closed by **Skill Creator** (F6) | ✅ |
| **POW-39** | S3 | **Scout Agent** | Read `MANIFEST.name`, `version`, `description` instead of inferring from filename. Use run() export as primary invocation path. | 4 |
| **POW-40** | S4 | **Tiered Skill Evolution** | Add `tier`, `prerequisites`, `stage` fields to skill_registry. Implement tier gate logic — can't use tier 3 until tier 2 mastered. | 5 |
| **POW-41** | S5 | **Dynamic Competence Mapping** | Add competence stage tracking per skill. Stage 1→4 progression based on success rate and usage count. CompetenceMap exists but only 3 skills. | 5 |
| **POW-42** | S6 | **Dynamic Tool Acquisition** | Set up periodic skill dir scan with auto-discovery. New `.js` files in skills/ automatically registered. | 4 |
| **POW-43** | S7 | **Skill Combo Orchestrator** | Add `dependsOn: ['skill_a', 'skill_b']` to MANIFEST. ComboOrchestrator resolves dependency DAG before execution. | 5 |
| **POW-44** | S8 | **Automated Testing Suite** | Write standard assertions for skills (given→when→then pattern). skill_tester.js uses assertions instead of manual verification. | 5 |
| **POW-45** | S9 | **Deployment Preparation** | Make combo path configurable — environment variable `GSK_COMBO_DIR` or constructor option. Remove OS-dependent hardcoded path. | 4 |

### 2.5 Security Weaknesses (POW-46 to POW-52)

| POW | Weakness | Neodownloadable Skill | Why This Skill | Phase |
|-----|----------|-----------------------|---------------|-------|
| **POW-46** | T1 | **Tool Use Orchestration** | Add token bucket rate limiter per tool. Configurable: max calls per minute, burst allowance. | 3 |
| **POW-47** | T2 | **Tool Use Orchestration** | Add API key or bearer token check on all tool entries. Any caller must present valid credentials. | 4 |
| **POW-48** | T3 | **Tool Use Orchestration** | Add capability-based access control. Each tool has required capability. Each caller has granted capabilities. Check before dispatch. | 4 |
| **POW-49** | T4 | **Tool Use Orchestration** | Add `maxOutputBytes` parameter to tool config. Truncate with warning if exceeded. | 3 |
| **POW-50** | T5 | **Deployment Preparation** | Replace hardcoded Telegram token with env var `TELEGRAM_BOT_TOKEN`. Throw if not set. | 3 |
| **POW-51** | T6 | **Tool Use Orchestration** | Add TLS cert validation option (default: strict). Allow insecure only with explicit flag. | 4 |
| **POW-52** | T7 | **Tool Use Orchestration** | Implement per-tool circuit breaker: CLOSED→OPEN (after N failures)→HALF_OPEN (after timeout). Escalation triggers open, not just log. | 3 |

### 2.6 Legacy Weaknesses (POW-53 to POW-57)

| POW | Weakness | Neodownloadable Skill | Why This Skill | Phase |
|-----|----------|-----------------------|---------------|-------|
| **POW-53** | W1 | **Full Scan Diagnosis** | Diagnose lesson extraction pipeline. Check `memory_compiler.js` for fact→lesson transformation step. Find where it halts. | 1 |
| **POW-54** | W2 | **Deep Research Protocol** | Add external grounding step to fact extraction. Cross-reference introspective facts with web/SCRIBE knowledge before committing. | 3 |
| **POW-55** | W3 | **Cognitive Reframing Protocol** | Debug symbolic motif detection. Check `symbolic_memory.js` `_detectMotifs()` for algorithm issues. 31 dreams should produce >0 motifs. | 2 |
| **POW-56** | W4 | **Dynamic Competence Mapping** | Fix competence stage gate. Track usage→success→stage progression per skill. Current: all skills stuck at stage 1. | 3 |
| **POW-57** | W5 | **Perceptual Global Workspace** | Address 86:8 write:read ratio. Add active recall scheduling, priority-based compilation, working memory refresh from long-term storage. | 5 |

---

## Part 3 — PHASED BUILD PLAN

### Phase 1: Quick Wins ✅ COMPLETE

| Step | POW | Action | Skill(s) | Est. | Status |
|------|-----|--------|----------|------|--------|
| 1.1 | POW-12 (F7) | Wire chambers as affective bias context into brain.think() | Philosophical Axiom Enforcement | ~80 lines | ✅ **Done** — `_buildChamberSection()` Layer 9 |
| 1.2 | POW-25 (G6) | Wire `decideMode()` into `_updateMode()` | Dual-Process Diagnostic Engine | 1 edit | ✅ **Done** — dual process consulted first |
| 1.3 | POW-53 (W1) | Fix lesson extraction pipeline | Full Scan Diagnosis | ~50 lines | ✅ **Done** — `this.brain` was null; proactive lessons |
| 1.4 | POW-33 (C4) | Parallelize God Council with `Promise.all` | Skill Combo Orchestrator | ~10 lines | ✅ **Done** — ~4× speedup |

### Phase 2: Core Intelligence Wiring (Current)
*Target: Close F8 (world sim — 7 sub-faults), G1 (sensor layer), G2 (state machine sim), G7 (sim↔plan cross-ref)*

| Step | POW | Sub-Fault | Action | Skill(s) | Est. | File(s) |
|------|-----|-----------|--------|----------|------|---------|
| 2.0a | — | — | **Write comprehensive world simulation diagnosis doc** | — | ~250 lines | seshat-second-brain/pages/ |
| 2.0b | — | — | Update REDBUTTON + neodownloadable mapping with world sim interconnect map | — | ~100 edits | REDBUTTON.md, mapping doc |
| 2.1 | POW-13 | F8.2 (HIGH) | Add `SIMULATING` thought mode to perpetual_consciousness | World Model Simulation | ~15 lines | perpetual_consciousness.js |
| 2.2 | POW-13 | F8.1 (HIGH) | Wire `world_model_sim.simulate()` into `_generateThought()` when mode=SIMULATING | Plan from Simulation | ~25 lines | perpetual_consciousness.js |
| 2.3 | POW-13 | F8.3 (MED) | Wire `executeInWorld()` into planning_engine after plan creation | Plan from Simulation | ~20 lines | planning_engine.js |
| 2.4 | POW-13 | F8.4 (MED) | Add Sanctum→EventBus bridge for state updates → memory compiler | Event-Bus Synchronization | ~30 lines | sanctum_client.js, fusion-loader.js |
| 2.5 | POW-13 | F8.5 (LOW) | Add SanctumClient status check + graceful degradation in system prompt | World Model Simulation | ~15 lines | system_prompt_compiler.js |
| 2.6 | POW-13 | F8.7 (LOW) | Define canonical Soulverse (soul-sanctum.js as server, SOULVERSE-UNIVERSE.html as UI) | Documentation | ~20 lines | seshat docs |
| 2.7 | POW-13 | F8.6 (MED) | Wire "Simulate and Act" combo from neodownloadable — run perception→sim→plan→act cycle | Skill Combo Orchestrator | ~40 lines | combo_orchestrator.js |
| 2.8 | POW-20 | G1 | Build SensorSuite class for centralized typed perception | Perception-Action Loop | ~100 lines | perception/ |
| 2.9 | POW-21 | G2 | Replace text-only simulation with state machine | Plan from Simulation | ~150 lines | world_model_simulation.js |
| 2.10 | POW-26 | G7 | Cross-reference planning with simulation results | Plan from Simulation, Root Cause Synthesis | ~60 lines | planning_engine.js |
| 2.11 | POW-27 | G8 | Replace `_lastToolResult` polling with EventBus | Asynchronous Reactive Event-Bus | ~60 lines | planning_engine.js, EventBus |
| 2.12 | POW-36 | C7 | Subscribe TelemetryEngine to EventBus | Asynchronous Reactive Event-Bus | ~40 lines | telemetry_engine.js |
| 2.13 | POW-55 | W3 | Debug and fix symbolic motif detection | Cognitive Reframing Protocol | ~80 lines | symbolic_memory.js |

### Phase 3: Safety, Prompts & Reinforcement
*Target: Close F13 (prompt mgmt), F14 partial→full (safety), G3 (fine-tuning), G9 (RL signal)*

| Step | POW | Action | Skill(s) | Est. |
|------|-----|--------|----------|------|
| 3.1 | POW-14 (F13) | Build prompt registry with versioning and contracts | Verifiable Goal Definition | ~200 lines |
| 3.2 | POW-15 (F14) | Add circuit breakers + rate limiting + output caps | Tool Use Orchestration | ~250 lines |
| 3.3 | POW-46 (T1) | Token bucket rate limiter per tool | Tool Use Orchestration | ~50 lines |
| 3.4 | POW-49 (T4) | Add maxOutputBytes to all tool handlers | Tool Use Orchestration | ~30 lines |
| 3.5 | POW-50 (T5) | Remove hardcoded Telegram token → env var | Deployment Preparation | 1 edit |
| 3.6 | POW-52 (T7) | Implement per-tool circuit breaker states | Tool Use Orchestration | ~80 lines |
| 3.7 | POW-22 (G3) | Remove hardcoded `return false` in _checkOwnBrainAvailable | Continuous Learning Imperative | 1 edit |
| 3.8 | POW-28 (G9) | Add outcome-weighted experience signal | AI Skill Development Lifecycle | ~100 lines |
| 3.9 | POW-54 (W2) | Add external grounding step to fact extraction | Deep Research Protocol | ~80 lines |
| 3.10 | POW-56 (W4) | Fix competence stage progression | Dynamic Competence Mapping | ~60 lines |
| 3.11 | POW-30 (C1) | Add delivery guarantees to EventBus | Resilient Event Dispatch Architecture | ~100 lines |
| 3.12 | POW-32 (C3) | Replace `new Function()` in ComboOrchestrator | Tool Use Orchestration | ~60 lines |
| 3.13 | POW-34 (C5) | Add JSON schema validation to EventBus | Event Schema Validator | ~80 lines |

### Phase 4: Infrastructure & Architecture
*Target: Close F15 (agent protocol), F16 (eval), S1 (dual reg), S3 (MANIFEST), S6 (auto-discovery), S9 (portable paths)*

| Step | POW | Action | Skill(s) | Est. |
|------|-----|--------|----------|------|
| 4.1 | POW-16 (F15) | Define typed message envelope for LUCABRASI↔SCRIBE | Resilient Event Dispatch Architecture, Event Schema Validator | ~100 lines |
| 4.2 | POW-17 (F16) | Build benchmark runner + regression suite | Automated Testing Suite | ~200 lines |
| 4.3 | POW-37 (S1) | Unify registration — ToolBridge delegates to SkillsEngine | Dynamic Tool Acquisition | ~60 lines |
| 4.4 | POW-39 (S3) | Use MANIFEST.name/version instead of filename inference | Scout Agent | ~40 lines |
| 4.5 | POW-42 (S6) | Periodic auto-discovery scan of skills/ dir | Dynamic Tool Acquisition | ~50 lines |
| 4.6 | POW-45 (S9) | Make combo path configurable via env var | Deployment Preparation | 1 edit |
| 4.7 | POW-23 (G4) | Replace hour-based purpose with experience-driven | Knowledge Absorption & Integration | ~80 lines |
| 4.8 | POW-24 (G5) | Replace random goals with drive-based motivation | Accelerated Learning Protocol | ~100 lines |
| 4.9 | POW-29 (G10) | Replace heuristics with confidence metrics | Epistemic Skepticism Protocol | ~80 lines |
| 4.10 | POW-31 (C2) | Replace monkey-patching with EventBus-driven bridge | Event-Bus Synchronization | ~120 lines |
| 4.11 | POW-35 (C6) | Auto-discover chambers instead of hardcoded cascade | Multi-Form Task Distribution | ~80 lines |
| 4.12 | POW-47 (T2) | Add API key authentication to tool bridge | Tool Use Orchestration | ~60 lines |
| 4.13 | POW-48 (T3) | Add capability-based authorization per tool | Tool Use Orchestration | ~80 lines |
| 4.14 | POW-51 (T6) | Add TLS cert validation option | Tool Use Orchestration | ~40 lines |

### Phase 5: Advanced Evolution
*Target: Close F17 (emergent monitoring), F18 (RL), S4 (tiered evolution), S5 (competence), S7 (dependency graph), S8 (test harness)*

| Step | POW | Action | Skill(s) | Est. |
|------|-----|--------|----------|------|
| 5.1 | POW-18 (F17) | Monitor EventBus for anomalous multi-agent patterns | Simulated Reality Auditor | ~150 lines |
| 5.2 | POW-19 (F18) | Replace hardcoded 0.5 weights with outcome-based reward | World Model Integrator | ~180 lines |
| 5.3 | POW-40 (S4) | Implement tier gate logic for skill progression | Tiered Skill Evolution | ~120 lines |
| 5.4 | POW-41 (S5) | Expand CompetenceMap to all skills, track stage+success | Dynamic Competence Mapping | ~100 lines |
| 5.5 | POW-43 (S7) | Add dependency DAG resolution to ComboOrchestrator | Skill Combo Orchestrator | ~80 lines |
| 5.6 | POW-44 (S8) | Write standard skill test assertions | Automated Testing Suite | ~100 lines |
| 5.7 | POW-57 (W5) | Address 86:8 write:read ratio with recall scheduling | Perceptual Global Workspace | ~150 lines |

---

## Part 4 — SUMMARY METRICS

### 4.1 POW Count by Domain

| Domain | Total POWs | Closed | Open | Partial |
|--------|-----------|--------|------|---------|
| Intelligence | 14 | 4 | 9 | 1 |
| Communication | 7 | 1 | 5 | 1 |
| Skills | 9 | 1 | 7 | 1 |
| Tool Calling | 7 | 0 | 6 | 1 |
| All Domains (cross) | 3 | 2 | 1 | 0 |
| Legacy (pre-existing) | 5 | 0 | 5 | 0 |
| **Total** | **57** | **8** | **47** | **2** |

### 4.2 Effort Estimate

| Phase | Sessions | Est. Lines | Focus |
|-------|----------|-----------|-------|
| Phase 1 (Quick Wins) | 1 | ~140 | F7, G6, W1, C4 |
| Phase 2 (Core Intelligence) | 2 | ~785 | F8 (7 sub-faults), G1, G2, G7, G8, C7, W3 |
| Phase 3 (Safety & Prompts) | 3 | ~1090 | F13, F14, T1, T4, T5, T7, G3, G9, W2, W4, C1, C3, C5 |
| Phase 4 (Infrastructure) | 3 | ~810 | F15, F16, S1, S3, S6, S9, G4, G5, G10, C2, C6, T2, T3, T6 |
| Phase 5 (Advanced) | 2 | ~880 | F17, F18, S4, S5, S7, S8, W5 |
| **Total** | **~11** | **~3530** | **All 57 POWs** |

### 4.3 Neodownloadable Skills Used

| Skill | POWs Addressed | Phases |
|-------|---------------|--------|
| Tool Use Orchestration | POW-15, POW-32, POW-46, POW-47, POW-48, POW-49, POW-51, POW-52 | 3, 4 |
| Plan from Simulation | POW-13, POW-21, POW-26 | 2 |
| World Model Simulation | POW-13 | 2 |
| Philosophical Axiom Enforcement | POW-12 | 1 |
| Verifiable Goal Definition | POW-14 | 3 |
| Resilient Event Dispatch Architecture | POW-16, POW-30 | 3, 4 |
| Event Schema Validator | POW-16, POW-34 | 3, 4 |
| Automated Testing Suite | POW-17, POW-44 | 4, 5 |
| Simulated Reality Auditor | POW-18 | 5 |
| World Model Integrator | POW-19 | 5 |
| Perception-Action Loop | POW-20 | 2 |
| Continuous Learning Imperative | POW-22 | 3 |
| Asynchronous Reactive Event-Bus | POW-27, POW-36 | 2 |
| AI Skill Development Lifecycle | POW-28 | 3 |
| Deep Research Protocol | POW-54 | 3 |
| Epistemic Skepticism Protocol | POW-29 | 4 |
| Knowledge Absorption & Integration | POW-23 | 4 |
| Accelerated Learning Protocol | POW-24 | 4 |
| Dual-Process Diagnostic Engine | POW-25 | 1 |
| Root Cause Synthesis | POW-26 | 2 |
| Full Scan Diagnosis | POW-53 | 1 |
| Cognitive Reframing Protocol | POW-55 | 2 |
| Dynamic Competence Mapping | POW-56 | 3 |
| Event-Bus Synchronization | POW-31 | 4 |
| Multi-Form Task Distribution | POW-35 | 4 |
| Dynamic Tool Acquisition | POW-37, POW-42 | 4 |
| Scout Agent | POW-39 | 4 |
| Deployment Preparation | POW-45, POW-50 | 3, 4 |
| Skill Combo Orchestrator | POW-33, POW-43 | 1, 5 |
| Tiered Skill Evolution | POW-40 | 5 |
| Perceptual Global Workspace | POW-57 | 5 |
| Spatial World Interaction | F8 (all sub-faults) | 2 |
| Event-Bus Synchronization | F8.4 | 2 |
| Modular Scene Composition | F8 (world node hierarchy) | 2 |

---

## Part 5 — RECOMMENDED EXECUTION ORDER

```
✅ PHASE 1 COMPLETE (Session 32)
├── ✅ POW-12 (F7) — Wire chambers→consciousness
├── ✅ POW-25 (G6) — Wire decideMode()
├── ✅ POW-53 (W1) — Fix lesson pipeline
└── ✅ POW-33 (C4) — Parallelize God Council

NOW (current session)
├── POW-13 (F8) — Wire world sim→Sanctum              ← 120 lines, closes a fault
├── POW-20 (G1) — Build SensorSuite                    ← 100 lines, formal perception
├── POW-21 (G2) — State machine simulation             ← 150 lines, better world model
├── POW-26 (G7) — Sim↔plan cross-reference              ← 60 lines
├── POW-27 (G8) — EventBus for tool results             ← 60 lines
├── POW-36 (C7) — Telemetry subscribes to EventBus      ← 40 lines
└── POW-55 (W3) — Fix symbolic motif detection          ← 80 lines
├── POW-20 (G1) — Build SensorSuite                ← 100 lines, formal perception
├── POW-21 (G2) — State machine simulation         ← 150 lines, better world model
├── POW-26 (G7) — Sim↔plan cross-reference          ← 60 lines
├── POW-27 (G8) — EventBus for tool results         ← 60 lines
├── POW-36 (C7) — Telemetry subscribes to EventBus  ← 40 lines
└── POW-55 (W3) — Fix symbolic motif detection      ← 80 lines

THEN
├── Phase 3 (Safety & Prompts) — 1090 lines
├── Phase 4 (Infrastructure) — 810 lines
└── Phase 5 (Advanced Evolution) — 880 lines
```

---

*Sources: neodownloadable.md (100 skills, 30 combos), REDBUTTON.md v1.5.0, LUCABRASI-MAP-001, LUCABRASI-TOOLS-DIAG-001, LUCABRASI THE SOUL - Complete Fault & Position Report.md, Diagnostic-Findings-Scan-v1.md*
