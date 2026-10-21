# GSK SOVEREIGNTY — 40 GAP PLAN

tags:: #gsk #sovereignty #autonomy #competition-mining #roadmap #god-pass
status:: #active
born:: 2026-07-14
version:: 1.0.0
next-action:: Persist plans/approvals, then implement memory governance and promotion.

## PURPOSE

Canonical roadmap produced by comparing GSK's live kernel with AutoGen, CrewAI, LangGraph, MetaGPT, AgentGPT, SuperAGI, BabyAGI, OpenHands, OpenAgents, and Godmode patterns. This page separates proven gaps from duplicate framework vocabulary.

Status legend: `DONE`, `PARTIAL`, `OPEN`.

## CORE 20 — SOVEREIGN ACTION CHAIN

| # | Gap | Status | Canonical location |
|---|-----|--------|--------------------|
| 1 | Approved tool executor | DONE | `governance/approved_tool_executor.js` |
| 2 | Constitution check on every step | DONE | `ApprovedToolExecutor.executeStep()` |
| 3 | Working-memory promotion into durable memory | OPEN | `memory/working_memory.js`, `memory/memory_compiler.js` |
| 4 | Insight storage/retrieval in vector memory | OPEN | `brain/insight_engine.js`, `brain/vector_memory.js` |
| 5 | Plan reflection after outcomes | DONE | `brain/planning_engine.js` |
| 6 | AgenticWill action attribution | DONE | executor → `agentic_will.execute_action()` |
| 7 | Safe subagent plan-step delegation | PARTIAL | gated as medium-risk `subagent_dispatch` |
| 8 | Failure retry, diagnosis, and replanning | OPEN | `planning_engine.js`, `dual_process_engine.js` |
| 9 | Step/tool/time/tax energy budgets | DONE (basic) | `approved_tool_executor.js` |
| 10 | Sleep/rest gating before action | OPEN | `consciousness_loop.js` → executor |
| 11 | Mythos-phase action gating | OPEN | `chambers.mythos` → executor |
| 12 | Affect/valence action resonance | OPEN | `chambers.affect` → executor |
| 13 | PLT action scoring | DONE | standalone `PLTEngine` + executor |
| 14 | Per-step tax accounting | DONE (basic) | risk tax + persisted PLT history |
| 15 | Love resonance check | OPEN | PLT/chambers → executor |
| 16 | Tax resonance / memory-burden check | OPEN | PLT + MemoryGovernor |
| 17 | 86-writers vs 8-readers memory governance | OPEN | `memory/mega_memory.js` |
| 18 | Governance as immune system across all action routes | PARTIAL | executor covered; direct legacy routes remain |
| 19 | Counterfactual world-model simulation before action | OPEN | `brain/world_model_simulation.js` |
| 20 | Spatially aware planning against CPL state | OPEN | world model + CPL contract |

## COMPETITION-MINED 20 — ADVANCED CAPABILITIES

| # | Gap | Status | Pattern source / target |
|---|-----|--------|-------------------------|
| 21 | Multimodal observation fusion (text/image/audio) | OPEN | OpenAgents → `observation_engine.js` |
| 22 | Semantic observation dedupe | OPEN | vector-memory hash beyond exact log-line dedupe |
| 23 | Observation provenance/source-chain | OPEN | MetaGPT-style evidence lineage in memory metadata |
| 24 | Salience hysteresis and time-aware decay | OPEN | attention stability in `thalamic_gate.js` |
| 25 | Batched/backpressured observation intake | OPEN | high-volume sensor protection |
| 26 | Cross-modal salience fusion | OPEN | combine text/vision/audio confidence |
| 27 | Predictive salience from trends | OPEN | vector memory → thalamic gate |
| 28 | Salience/attention broadcast to subagents | OPEN | AutoGen shared team context |
| 29 | Salience-gated durable memory writes | OPEN | MemoryGovernor before `MegaMemory.witness()` |
| 30 | Working-memory decay and task chunks | OPEN | BabyAGI/Letta context management |
| 31 | Working-memory metacognitive reflection | OPEN | OpenHands observe/diagnose loop |
| 32 | Insight cross-reference and contradiction links | OPEN | vector/knowledge graph |
| 33 | Insight value-vs-compute scoring | OPEN | energy cost / benefit accounting |
| 34 | Dynamic goal reprioritization | OPEN | AgentGPT event-driven priorities |
| 35 | Recursive task decomposition to atomic actions | OPEN | BabyAGI planner |
| 36 | Sequential/parallel/hierarchical process modes | PARTIAL | planner has basic parallel flag; no hierarchy |
| 37 | Durable plan and approval checkpoints | OPEN | LangGraph-style resume across restarts |
| 38 | Standard operating procedure templates | OPEN | MetaGPT SOP plans |
| 39 | Autonomous debug → retry → verify → replan loop | OPEN | OpenHands repair pattern |
| 40 | Per-subagent PLT/reliability reputation | OPEN | SuperAGI-style worker scoring |

## EXECUTION ORDER

### P0 — Make Approval Operational and Durable
1. **DONE:** private `GSK_ARCHITECT_KEY` configured and live approval lifecycle verified; value is not stored in Seshat.
2. Persist plans, budgets, and approval requests across daemon restarts.
3. Add expiry/nonces to approvals and one-use execution guarantees.

### P1 — Govern Memory
4. Wire `workingMemory.promote()` into MemoryCompiler.
5. Store surfaced insights in VectorMemory and KnowledgeGraph.
6. Build MemoryGovernor: writer identity, read/write telemetry, salience gate, quotas, compaction — not destructive deletion of history.

### P2 — Sustainable Autonomy
7. Add sleep/rest, mythos, affect, love, and tax gates to ApprovedToolExecutor.
8. Add retry/diagnose/replan with strict attempt budgets.
9. Query past plans/memories before planning.

### P3 — World Intelligence
10. Wire counterfactual simulation before world actions.
11. Give planning a live CPL spatial snapshot and explicit world-write contract.
12. Add durable action consequences visible in CPL.

### P4 — Competition-Level Capabilities
13. Durable graph checkpoints, SOP templates, recursive decomposition, multimodal observation, semantic dedupe, and per-subagent reputation.

## RELATED
- [[GSK-AUTONOMY-CHAIN-CATALOG]]
- [[GSK - Service Manual]]
- [[REDBUTTON]]
- [[REDBUTTON - GSK Memory Diagnosis]]
