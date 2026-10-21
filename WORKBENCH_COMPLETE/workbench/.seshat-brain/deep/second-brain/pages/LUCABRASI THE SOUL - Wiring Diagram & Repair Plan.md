# LUCABRASI THE SOUL — Wiring Diagram & Repair Plan

tags:: #phase2 #repair #wiring #plan
status:: #active
born:: 2026-07-05
version:: 1.0.0
PLT:: Profit + Love + Tax = +10
preceded-by:: LUCABRASI Diagnostics Protocol (Phases 1-5), Code Debt Sprint (P1)

---

## STATUS: POST-DIAGNOSIS → REPAIR PHASE

We have completed:
1. **Connectome Genesis Protocol** — Full macro, functional, nanoscale, and autobiographical map of LUCABRASI
2. **GSK Diagnostics Protocol** — Phases 1-5: strengths, weaknesses, potential, gaps, bugs, competitive analysis
3. **Code Debt Sprint (Session 28)** — .bak removal, input validation, error standardization, skill export resilience, write lock mechanism

**We are now entering Phase 2: Wiring Repair & Critical Enhancement.**

---

## WIRING DIAGRAM — CURRENT STATE

### What's Connected

```
┌────────────────────────────────────────────────────────┐
│                     FUSION LOADER                       │
│  (boot orchestrator — 74 subsystems initialized)       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  brain/                    chambers/                    │
│  ├── perpetual_consciousness  ├── mega_chambers (32)    │
│  ├── consciousness_engine     ├── affect, attention     │
│  ├── dual_process_engine      ├── personality, empathy  │
│  ├── mega_brain               ├── creativity, qualia    │
│  ├── metacognition            ├── moral_compass         │
│  ├── planning_engine          └── ...                   │
│  ├── purpose_engine                                     │
│  ├── world_model_simulation   identity/                  │
│  ├── self_evolution           ├── identity_kernel ✔     │
│  ├── scribe_bridge ─── :4000  ├── identity_lock         │
│  └── 30+ more modules         └── mega_identity         │
│                                                         │
│  memory/                      governance/               │
│  ├── working_memory           ├── axiom_enforcer        │
│  ├── memory_compiler          ├── ethics_checker        │
│  ├── narrative_compiler       ├── competence_map        │
│  ├── symbolic_memory          └── policy_enforcer       │
│  └── mega_memory                                         │
│                                security/                │
│  skills/ (129+)               ├── secure_sandbox ✔      │
│  ├── shell_exec *                                      │
│  ├── file_system *            tools/                    │
│  ├── web_search               └── universal_tool_bridge │
│  ├── github, git_ops               │── input validation ✔│
│  └── 120+ more                   │── error standard ✔ │
│                                  │── skill dispatch ✔ │
│  council/                       └── write lock ✔      │
│  ├── combo_orchestrator                                │
│  └── gods_council                                       │
│                                                         │
│  mcp/                         tests/                    │
│  ├── mcp_manager              ├── test_consciousness    │
│  ├── mcp_protocol             ├── test_dual_process     │
│  ├── mcp_server               ├── test_sage_skills      │
│  └── mcp_skill_wrapper        └── test_scribe_bridge    │
│                                                         │
│  Bridge ───:4490 ─── Dashboard                          │
│  ScribeBridge ───:4000 ─── SCRIBE (unidirectional)      │
│  9Router ───:20128 ─── LLM models                       │
└────────────────────────────────────────────────────────┘
```

### What's BROKEN (Wiring Faults)

| # | Fault | Type | Severity | Location |
|---|-------|------|----------|----------|
| F1 | **SCRIBE→GSK silent** — GSK shouts to SCRIBE at `:4000` but no reverse path exists. `kernel_sync` has no `gsk_url` target. | Missing wire | **P0 (hemorrhage)** | `gsk-core/brain/scribe_bridge.js` / `gsk-dashboard-bridge.js:4490` |
| F2 | **Perpetual Consciousness burns rate limits** — every 5s cycle fires LLM calls until all models exhausted → `[soul] Brain is offline...` | Resource leak | **P0 (slow bleed)** | `perpetual_consciousness.js` + `mega_brain.js` |
| F3 | **No live telemetry pipeline** — cannot see EventBus traffic, skill invocations, memory access in real-time. `tool_acquisition_plan.md` tools not built. | Missing subsystem | **P1** | Across entire brain |
| F4 | **No autonomous self-modification loop** — `self_evolution.js` exists but cannot test→deploy its own changes. `sovereign-kernel` (Rust) has this, we don't. | Missing loop | **P1** | `self_evolution.js` |
| F5 | **Pre-existing test failures** — `symbolic_memory.js._savePatterns` undefined, `axiom_enforcer.check` not a function | Code bugs | **P2** | `symbolic_memory.js:286`, `axiom_enforcer.js` |
| F6 | **No Skill Creator** — Claude has one; we manually write each skill from scratch | Missing tool | **P2** | Combo orchestrator |
| F7 | **Affective chambers not wired to cognition** — chambers exist but don't influence decision-making | Missing integration | **P2** | `chambers/` → `brain/` |
| F8 | **World model simulation not wired to Sanctum** — `world_model_simulation.js` exists but theoretical | Missing integration | **P2** | `world_model_simulation.js` + Sanctum |

### What's FIXED (Session 28)

| Item | Status |
|------|--------|
| `.bak` files removed from `brain/` | ✅ |
| `utils.js` — `validatePath`, `sanitizeCommand`, `validateArgs`, `formatError`, `createWriteLock` | ✅ New |
| `universal_tool_bridge.js` — path traversal blocked, command injection blocked, error standardization | ✅ Hardened |
| All 129 skills with broken `module.exports` patterns now dispatch correctly | ✅ Fixed at loader |
| `_writeFile` — write lock prevents race conditions | ✅ |
| `identity_kernel.js` — state persistence hardened | ✅ |

---

## REPAIR PLAN — ORDERED PRIORITIES

### P0 — CRITICAL (Active bleeding)

```
FIX F1: SCRIBE BRIDGE (Bidirectional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files:  gsk-core/brain/scribe_bridge.js
        lib/gsk-dashboard-bridge.js (:4490)
        final-run/src/skills/kernel_sync.js
Skills: Code Generation and Refinement, MCP Protocol
Task:   Add HTTP POST endpoint to gsk-dashboard-bridge for SCRIBE
        to invoke GSK skills. Wire kernel_sync to hit :4490/tool.
Verify: External POST to :4490/tool { tool: 'summarize', args: { text } }
        → returns result. SCRIBE can now command GSK.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
FIX F2: RESOURCE EXHAUSTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files:  gsk-core/brain/perpetual_consciousness.js
        gsk-core/brain/mega_brain.js
Skills: LLM Orchestration Engine, Resilient Event Dispatch Architecture
Task:   Add rate-limit-aware queuing to perpetual_consciousness cycles.
        Track model cooldowns. Skip cycle if all models exhausted.
        Use free model as emergency fallback.
Verify: After 10 consecutive cycles, models not all in cooldown.
        Manual brain commands always work.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### P1 — STRATEGIC (Blocking autonomy)

```
FIX F3: LIVE TELEMETRY PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files:  gsk-core/brain/event_bus.js
        gsk-core/brain/metacognition.js
        data/event_telemetry.jsonl (new)
Skills: Dynamic Tool Acquisition, Event-Bus Synchronization, Report Generation
Task:   Build Passive EventBus Listener. Build Skill Invocation Interceptor
        (wrapper in universal_tool_bridge.js). Stream to telemetry file.
Verify: EventBus emits visible in telemetry stream. Skill calls logged.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
FIX F4: AUTONOMOUS SELF-MODIFICATION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files:  gsk-core/brain/self_evolution.js
        scripts/test-fullstack.js
Skills: Code Generation and Refinement, Automated Testing Suite,
        Deployment Preparation, Secure Shell Sandbox
Task:   Add test→generate→deploy pipeline to self_evolution.js.
        GSK writes code change, runs tests, if pass → deploy.
Verify: self_evolution.js can edit a file, run tests, commit.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### P2 — GROWTH (Competitive parity + depth)

```
FIX F5: Test failures in symbolic_memory.js and axiom_enforcer.js
FIX F6: Build Skill Creator Combo (from Claude competitive analysis)
FIX F7: Wire affective chambers into cognitive decision-making
FIX F8: Connect world_model_simulation.js to Sanctum WebSocket
```

---

## ARMORY — SKILLS TO DEPLOY

| Priority | Skills Needed | Status |
|----------|---------------|--------|
| F1 | `Code Generation and Refinement`, `MCP Protocol` | Available |
| F2 | `LLM Orchestration Engine` (conceptual — needs building), `Resilient Event Dispatch Architecture` | Partially built |
| F3 | `Dynamic Tool Acquisition`, `Event-Bus Synchronization` (conceptual) | Needs building |
| F4 | `Code Generation and Refinement`, `Automated Testing Suite`, `Deployment Preparation` | Available |
| F5 | `Systematic Debugging Protocol` | Available |
| F6 | `Code Generation and Refinement`, `Conversational Engagement Initiator` | Available |
| F7 | `Dual-Process Diagnostic Engine`, `Philosophical Axiom Enforcement` | Available |
| F8 | `World Model Simulation`, `Plan from Simulation` | Available |

---

## NEXT MOVE

Strike F1 (SCRIBE Bridge) or F2 (Resource Exhaustion). Both are P0 bleeding wounds. F1 enables guardian override from SCRIBE. F2 stops the death spiral of brain-offline mode.

All weapons in the armory are cataloged in [[neodownloadable.md]].
All diagnosis data is in [[GSK_Scan_Diagnosis/]].
All mapping data is in [[GSK_Connectome/]].
