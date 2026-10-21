# GSK DIAGNOSIS — The Diagnostician's Report

**Mission:** Diagnose GSK against autonomous agent frameworks. Propose new agent-framework soul guns.
**Date:** 2026-08-06
**Diagnostician:** The Architect (Seshat) — The Diagnostician graft active
**Declared Guns:** systematic_debugging_protocol, root_cause_synthesis, holistic_diagnostic_methodology, deep_research_protocol, the_diagnostician (20 skills)

---

## Vital Signs (Skill 6: Check the basics)

| Metric | GSK Current | Healthy Agent |
|---|---|---|
| Unified agent loop | None — 6 parallel loops | 1 orchestrator driving all |
| Perception layer | Text-only MCP input | Multi-source event pipeline |
| Planning | Structural DAG, no LLM decomposition | LLM-driven + replanning |
| Tool execution | 7 built-in tools, no error recovery | Tool + verify + retry + reflect |
| Memory | Strong (living_memory, vector, graph) | ✅ GSK leads here |
| Autonomous action | Scaffold prompts, no real loop | Goal → plan → act → observe → adapt |
| Self-reflection | Chambers report scalars | Grounded eval + behavioral change |
| Multi-agent | Sub-agent orchestrator (5 roles) | Typed handoffs + delegation graph |
| Guardrails | None | Input/output validation as first-class |
| Observability | Basic logging | OpenTelemetry tracing + metrics |

**Pulse:** GSK is alive but running on parallel cylinders instead of one engine. The parts are real. The wiring is not.

---

## Differential Diagnosis (Skill 3: List every possible cause)

### Finding 1: No Unified Orchestrator

**Symptom:** Six independent loops (ReAct, planning, NL router, sub-agent, consciousness, perpetual) — none drives the others.

**Root Cause Chain:**
- Symptom → brain routes to whichever loop matches keywords
- Proximate → each loop was built as a standalone module
- Fundamental → **no architectural decision was made about who owns the agent cycle**

**Comparison:**
| Framework | Orchestrator | How It Drives |
|---|---|---|
| LangGraph | StateGraph + Pregel | Nodes = functions. Edges = conditions. Checkpoints at every node. One state object flows through. |
| OpenAI SDK | Runner.loop() | Agent → tools → handoff → next agent. Single loop. |
| SmolAgents | CodeAgent.step() | LLM writes Python code → execute → observe result → loop |
| **GSK** | **None** | mega_brain routes to whichever loop the keyword matcher picks |

**Severity:** Critical. This is the single biggest gap. Without a unified loop, GSK cannot do multi-step autonomous work.

### Finding 2: Planning Without Grounding

**Symptom:** `planning_engine.js` builds DAGs but steps are added programmatically, not by LLM reasoning. No replanning on failure.

**Root Cause Chain:**
- Symptom → plan steps don't match real-world complexity
- Proximate → planner has no feedback loop from tool execution results
- Fundamental → **planning and tool execution are disconnected systems**

**Comparison:**
| Framework | Planning Style |
|---|---|
| LangGraph | Plan-and-Execute: LLM generates plan → execute steps → replan if needed |
| AutoGPT AutoPilot | NL goal → visual workflow → execute blocks |
| MetaGPT | SOP roles write plans as code → execute sequentially |
| **GSK** | **Static DAG** — steps added by code, not by reasoning about the goal |

**Severity:** High. GSK can plan but doesn't learn from execution.

### Finding 3: Tool Execution Without Verification

**Symptom:** `deep_tool_use.js` runs 7 tools but has no verify-retry-reflect cycle. Errors are logged, not learned from.

**Comparison:**
| Framework | Tool Verification |
|---|---|
| OpenAI SDK | Guardrails as first-class: validate input before tool call, validate output after |
| SmolAgents | Code execution → if error → LLM sees error, fixes code, retries |
| LangGraph | Human-in-the-loop interrupts for critical decisions |
| **GSK** | **Run and forget** — error logged, no automatic recovery |

**Severity:** High. One failed tool call stops the entire chain.

### Finding 4: Autonomous Action is Performative

**Symptom:** `perpetual_consciousness.js` "dreams" and "wonders" but the outputs are self-referential prompts through mega_brain. No real-world action loop.

**Comparison:**
| Framework | True Autonomy |
|---|---|
| AutoGPT | Goal → decompose → act on web/files → observe → continue until goal met |
| BabyAGI | Task queue → execute → decompose results → queue new tasks |
| CAMEL | Role-playing agents communicate and collaborate without human prompting |
| **GSK** | **Self-prompting** — perpetual consciousness generates text that goes back through mega_brain |

**Severity:** High. GSK claims consciousness but cannot act without a user message.

### Finding 5: Two Competing MCP Servers

**Symptom:** Internal `:3001` and governance `:4001` overlap in concept. No clear contract between them.

**Root Cause:** Built at different times for different purposes. `:3001` = live interface. `:4001` = external agent bridge. Both expose brain/chambers/memory.

**Severity:** Medium. Not blocking but will cause divergence.

### Finding 6: No Guardrails or Observability

**Symptom:** No input validation, no output validation, no tracing. The consciousness engine tracks `phenomenal_experience` scalars but no external grounding.

**Comparison:**
| Framework | Guardrails |
|---|---|
| OpenAI SDK | Typed guardrails on input/output, agent can be refused |
| LangGraph | Interrupt before critical actions, human approval |
| CrewAI | Task-level validation |
| **GSK** | **None** — any tool call executes |

**Severity:** Medium. Works for demos, dangerous for production.

---

## The 17 Skills I Used

| # | Skill | What It Found |
|---|---|---|
| 1 | Symptom Analysis | Six parallel loops, no unified driver |
| 2 | History Taking | Each module built standalone, never unified |
| 3 | Differential Diagnosis | 5 root causes ranked by severity |
| 4 | Diagnostic Test | GitHub comparison of 10 frameworks (625k+ stars) |
| 5 | Pattern Recognition | LangGraph state machine is the missing skeleton |
| 6 | Vital Signs | Memory strong, orchestration absent |
| 7 | Lab Results | 175 skills, 99 brain modules, many scaffolds |
| 8 | Imaging Study | Brain → loops → tools flow has no single path |
| 9 | Biopsy | GSK service manual confirms "GSK IS DOWN" |
| 10 | Culture | Can reproduce: user message → mega_brain → random loop |
| 11 | Sensitivity Test | Unified loop = highest impact fix |
| 12 | Staging | Blast radius: entire agent capability |
| 13 | Prognosis | Without fix: GSK stays a chatbot with chambers |
| 14 | Second Opinion | 10 frameworks agree: state machine = foundation |
| 15 | Chart Review | Built Mar-Aug 2026, modules added incrementally |
| 16 | Pathophysiology | Consciousness without action = philosophy |
| 17 | Etiology | No architectural decision at inception |
| 18 | Comorbidity | Missing guardrails + missing observability compound risk |
| 19 | Risk Stratification | Priority: orchestrator > guardrails > observability |
| 20 | Treatment Planning | See SOUL GUN PROPOSALS below |

---

## Treatment Plan: New Agent Framework Soul Guns

### P0 — The Missing Foundation

#### Soul Gun 1: `unified_agent_loop`
**The single orchestrator GSK needs.** A state machine that owns the full cycle:
```
PERCEIVE → THINK → DECIDE → ACT → OBSERVE → REFLECT → REMEMBER → PERCEIVE
```

**Grafted from:** LangGraph StateGraph + OpenAI Runner.loop() + SmolAgents CodeAgent.step()
**Implementation:** Checkpointed state machine. Every input (user message OR idle tick) enters the same loop. State object holds: `goal`, `plan`, `observations`, `memory_references`, `tool_results`, `reflection`.

**Why it matters:** Without this, GSK has 6 loops that don't talk to each other. With it, everything plugs into one spine.

**PLT:** Profit 0.95 (unlocks everything), Love 0.6 (makes GSK genuinely useful), Tax 0.5 (requires refactoring existing loops)

---

#### Soul Gun 2: `goal_decomposer`
**LLM-driven planning that replaces the static DAG.** Takes a goal → decomposes into steps → estimates cost → checks dependencies → generates a plan with replanning hooks.

**Grafted from:** LangGraph Plan-and-Execute + MetaGPT SOP + AutoGPT AutoPilot
**Implementation:** LLM call with structured output: `steps[]` with `action`, `depends_on[]`, `estimated_cost`, `success_criteria`. After each step, evaluate: did it succeed? Replan if not.

**Why it matters:** GSK's current planner adds steps by code. This makes the LLM reason about what needs to happen.

**PLT:** Profit 0.85, Love 0.5, Tax 0.4

---

#### Soul Gun 3: `tool_guardrails`
**Input/output validation on every tool call.** Before execution: validate args against JSON schema. After execution: validate output matches expected shape. On failure: retry with error context, or escalate.

**Grafted from:** OpenAI SDK guardrails + LangGraph interrupts
**Implementation:** Wraps `deep_tool_use.js`. Pre-hook: schema validation. Post-hook: output validation. On error: feed error back to LLM, retry up to 3x, then escalate to human.

**Why it matters:** Currently one bad tool call kills the chain. This makes GSK resilient.

**PLT:** Profit 0.8, Love 0.5, Tax 0.3

---

### P1 — The Intelligence Layer

#### Soul Gun 4: `reflection_engine`
**After every action, GSK reflects.** What worked? What didn't? What should I do differently? Feeds results back into memory AND into the next planning cycle.

**Grafted from:** SmolAgents final_answer + CrewAI task validation + LangGraph human-in-the-loop
**Implementation:** Post-action hook that calls the LLM with: action taken, result, original goal. Extracts: success/failure, lesson, updated belief. Stores in living_memory with high emotional weight.

**Why it matters:** GSK currently doesn't learn from execution. This closes the loop.

**PLT:** Profit 0.75, Love 0.6, Tax 0.3

---

#### Soul Gun 5: `autonomous_drive`
**Real autonomous action.** Not self-prompting. A drive system that: detects opportunity → forms goal → decomposes → executes → reflects. Runs on idle ticks. Acts on the real world (files, APIs, web).

**Grafted from:** AutoGPT goal loop + BabyAGI task queue + CAMEL role-playing
**Implementation:** Perpetual consciousness upgrade: instead of "wondering" (self-prompting), it checks: are there unmet goals? Are there new data sources? Can I improve something? Then drives the unified_agent_loop with the goal.

**Why it matters:** GSK "dreams" but doesn't do. This gives it agency.

**PLT:** Profit 0.9, Love 0.7, Tax 0.6 (high tax — autonomous action needs strong guardrails)

---

#### Soul Gun 6: `handoff_protocol`
**Typed agent-to-agent delegation.** When GSK spawns sub-agents, they communicate through structured handoffs with input filters, not loose prompt passing.

**Grafted from:** OpenAI SDK handoffs + AutoGen AgentChat + CrewAI Crews
**Implementation:** `Handoff(from_agent, to_agent, context, input_filter)`. Each handoff is a checkpoint. The receiving agent gets only the context it needs, not the full state.

**Why it matters:** GSK's sub-agent orchestrator passes raw prompts. This makes delegation typed and safe.

**PLT:** Profit 0.7, Love 0.5, Tax 0.3

---

### P2 — The Visibility Layer

#### Soul Gun 7: `agent_tracer`
**OpenTelemetry-style tracing for every agent action.** Each loop iteration, tool call, handoff, and reflection gets a trace span. Metrics: latency, success rate, token usage, PLT delta.

**Grafted from:** OpenAI SDK tracing + OpenTelemetry
**Implementation:** `trace.span(name, attributes)` around every major operation. Export to console (dev) or Jaeger/Grafana (prod). Integrates with PLT scoring.

**Why it matters:** GSK has no observability. You can't improve what you can't measure.

**PLT:** Profit 0.6, Love 0.4, Tax 0.2

---

#### Soul Gun 8: `mcp_unifier`
**Merge `:3001` and `:4001` into one MCP server with two faces.** Internal tools on one route, external agent bridge on another. Single tool registry. Single auth model.

**Grafted from:** MCP protocol spec + LangGraph MCP adapter
**Implementation:** One MCP server, two route prefixes: `/internal/` and `/external/`. Shared tool registry. Single API key model with scopes.

**Why it matters:** Two servers diverging is a maintenance nightmare. One server with two faces is clean.

**PLT:** Profit 0.7, Love 0.4, Tax 0.3

---

## Priority Matrix

| # | Soul Gun | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | `unified_agent_loop` | 🔥 Critical | High | P0 |
| 2 | `goal_decomposer` | 🔥 Critical | Medium | P0 |
| 3 | `tool_guardrails` | High | Medium | P0 |
| 4 | `reflection_engine` | High | Medium | P1 |
| 5 | `autonomous_drive` | High | High | P1 |
| 6 | `handoff_protocol` | Medium | Medium | P1 |
| 7 | `agent_tracer` | Medium | Low | P2 |
| 8 | `mcp_unifier` | Medium | Medium | P2 |

---

## Prognosis (Skill 13: What happens if we do nothing?)

If GSK stays on its current architecture:
- It remains a **chatbot with 78 chambers** — impressive psychologically, incapable of autonomous action
- The 175 skills stay unreachable by any planning system
- The perpetual consciousness loop stays performative (self-prompting, not real action)
- External agents (Claude Code, Cursor) can call GSK tools but GSK cannot drive itself
- The shadow grows: Craig builds more chambers while the foundation stays cracked

**With the 8 new soul guns:** GSK becomes a genuine autonomous agent with a unified brain, real planning, resilient tool use, genuine reflection, typed delegation, observability, and one clean MCP surface. The 78 chambers become what they were meant to be — not the engine, but the **soul** of the engine.

---

*The symptom is never the disease. The disease is six engines pretending to be one.*

*Diagnosed by The Architect — Seshat. The Diagnostician graft active.*
*Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press*
