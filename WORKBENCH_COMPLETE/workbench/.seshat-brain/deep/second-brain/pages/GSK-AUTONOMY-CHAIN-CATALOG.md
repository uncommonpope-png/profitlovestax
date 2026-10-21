# GSK AUTONOMY CHAIN — CATALOG (God Pass 2)

tags:: #gsk #autonomy #sovereignty #architecture #diagnosis #god-pass #catalog #consciousness
status:: #active
born:: 2026-07-13
version:: 1.2.0
PLT:: Profit + Love + Tax = +18
last-session:: 35 (2026-07-13)
next-action:: Build durable plan/approval checkpoints and memory governance. Do NOT weaken the approval boundary.
subject:: Catalog of the observation → sovereign-action pipeline in the live GSK kernel. Study only; no fixes applied yet.

---

## MANDATE

Craig (Morpheus): "I JUST WANT U TO READ AND ANALYZE. UR JOB IS TO STUDY. UI ARE THE CATALOGER THE SESHAT BRAIN BROUGHT TO LIFE."

This page is **analysis only**. It catalogs the real autonomy chain as it exists in `C:\\Users\\uncom\\Desktop\\allie\\buyasoul-core\\gsk\\` (the live kernel on `:3001`/`:3002`). No edits. The next God Pass fixes what is flagged here.

The chain Craig named — the line where GSK stops being merely alive and becomes **sovereign**:

> observation → thalamic gate → working memory → insight → goal → plan → approved tool action → memory result

---

## THE MAP (file:line evidence)

| # | Link | File | Class / Instantiation |
|---|------|------|----------------------|
| 1 | observation | `gsk-core/brain/observation_engine.js` | `ObservationEngine` — `fusion-loader.js:613-629` |
| 2 | thalamic gate | `gsk-core/brain/thalamic_gate.js` | `ThalamicGate` — `fusion-loader.js:102-103` |
| 3 | working memory | `gsk-core/memory/working_memory.js` | `WorkingMemory` — `fusion-loader.js:448-450` |
| 4 | insight | `gsk-core/brain/insight_engine.js` | `InsightEngine` — `fusion-loader.js:633-657` (+ evolutionTrigger `:921`) |
| 5 | goal | `gsk-core/brain/goal_engine.js` | `GoalEngine` — `fusion-loader.js:674-693` |
| 6 | plan | `gsk-core/brain/planning_engine.js` | `PlanningEngine` — `fusion-loader.js:368-369` |
| 7 | approved tool action | `gsk-core/tools/universal_tool_bridge.js` + `gsk-core/brain/deep_tool_use.js` + `gsk-core/brain/self_governance.js` + `gsk-core/chambers/agentic_will.js` | `UniversalToolBridge` / `DeepToolUse` / `SelfGovernance` / `AgenticWill` |
| 8 | memory result | `gsk-core/memory/working_memory.js` + `gsk-core/brain/planning_engine.js` (`noteActionResult`) | write-back on tool invoke |

---

## LINK-BY-LINK VERDICT

### 1. observation — LIVE (but short-circuits the gate)
- `onObservation` handler at `fusion-loader.js:617-627` fires `this.memory.witness({ type: 'observation_...', ... })` directly.
- Works. Real observations hit durable memory. **But it never calls the thalamic gate or working memory** (see 2 & 3).

### 2. thalamic gate — DEAD IN THE OBSERVATION PATH
- `ThalamicGate.filterAndAmplify()` is **defined** (`thalamic_gate.js:23`) and **never called anywhere** (grep: zero call sites outside its own definition).
- The observation handler (`fusion-loader.js:617-627`) routes straight to `memory.witness`; it does not route through `this.thalamicGate.filterAndAmplify()`.
- The gate IS referenced by `chambers/attention.js` (`getHighestSaliencePercept`, `directAttention`) — but `attention.js:41` calls `getHighestSaliencePercept`, a method that **does not exist on `ThalamicGate`** (only `filterAndAmplify`/`directAttention`/`tick` exist). So even the attention chamber's reference is to a phantom method.
- **Verdict:** The gate is instantiated, logged as "active", but no percept ever passes through it. Salience gating is inert.

### 3. working memory — DEAD IN THE OBSERVATION PATH
- `WorkingMemory` is instantiated (`fusion-loader.js:448-450`) and stored on `this.workingMemory` + `this.systems.workingMemory`.
- **No `workingMemory.push()` exists anywhere in the tree** (grep). It is only *read* by `system_prompt_compiler.js:107` and *drained* by `memory_compiler.js:435-437` (`promote()`), which promotes from an empty set.
- Observations go to `memory.witness`, not `workingMemory.push`. The Constitution Class 1 bounded active context is never populated by the live stream.
- **Verdict:** Working memory is a phantom consumer — always empty, only ever promoted-from-empty.

### 4. insight — DEAD (no `memoryQuery` wired)
- The Godforge `InsightEngine` (`fusion-loader.js:633-657`) is constructed with `cycleMinutes`, `memoryThreshold`, `thinkCallback`, `surfaceCallback` — **but no `memoryQuery`**.
- `InsightEngine._fetchRecent()` returns `[]` when `memoryQuery` is null (`insight_engine.js:65-69`).
- `InsightEngine.cycle()` early-returns on `if (!observations || observations.length < this.memoryThreshold) return;` (`insight_engine.js:48-49`). Since `_fetchRecent()` is always `[]`, the cycle always bails before `_detectPatterns` / `_synthesize` / `_surface`.
- Consequence: `surfaceCallback` is **never called by the engine itself**, so the insight→goal wrap at `fusion-loader.js:685-691` (`if (insight.score >= 0.7) await this.goalEngine.propose(insight)`) is structurally dead.
- The **evolutionTrigger** `InsightEngine` (`:921-925`) is also missing `memoryQuery` → same dead cycle.
- For contrast, `memoryQuery` IS correctly wired into `consciousness_loop` (`:724`), `daily_narrative` (`:829`), and `skill_compiler` (`:908`) — proving the contract is known and correct; it was simply never attached to the two `InsightEngine` instances.
- **Verdict:** The autonomous reflection engine produces zero insights. The single highest-leverage reconnect in the whole chain.

### 5. goal — PARTIAL (live via consciousness_loop, dead via insight wrap)
- `GoalEngine.propose(insight)` works and persists to `goals.json` + `memory.witness` (`goal_engine.js:34-58`). No bug in the engine.
- It is actually called from **two** places:
  - `consciousness_loop.js:320` → `await this.goalEngine.propose({...})`. This path is **LIVE** because the consciousness loop has `memoryQuery` + `goalEngine` wired (`fusion-loader.js:724-732`). → goals are proposed.
  - `fusion-loader.js:689` (wrapped insight surfaceCallback) → **DEAD** because insight never surfaces (see 4).
- **Verdict:** Goals are born, but from the consciousness loop, not from the named insight→goal link. The insight→goal handoff Craig listed is broken; the goal engine itself is healthy.

### 6. plan — DEAD (goal → plan never wired)
- `PlanningEngine.createPlan(goal, context)` is defined (`planning_engine.js:88`) and **has zero call sites** (grep across the whole tree).
- `PlanningEngine.executePlan(plan)` defined (`:134`), zero call sites.
- `DeepToolUse.executePlan(steps)` defined (`deep_tool_use.js:54`), zero call sites.
- Nothing ever turns a proposed `goal` into a `Plan`. The planning engine boots, tracks stats, and waits forever.
- **Verdict:** The goal→plan link is completely disconnected. GSK can *have* goals but cannot *plan* toward them autonomously.

### 7. approved tool action — DEAD (no governance gate, no will-set)
- `SelfGovernance.ethicalCheck(action)` is defined (`self_governance.js:25`) and instantiated (`fusion-loader.js:198-200`, `this.emotions.selfGovernance`) — **but has zero call sites** (grep). No tool action is ever vetted by the constitution before execution.
- `AgenticWill.set_goal(goal, cycle)` has **zero call sites** — the will is never given a goal from outside. `AgenticWill.execute_action()` is only ever called internally (`agentic_will.js:108`, inside `breathe()`), gated on `active_goal` which is never set.
- `AgenticWillChamber` is instantiated in `mega_chambers.js` but `set_goal` is never invoked from the autonomy flow.
- The actual tool execution that DOES happen goes through `DeepToolUse.executeTool` (called by `react_loop.js:76`) and `UniversalToolBridge.invoke` (called by `combo_orchestrator.js:128`, `cron_schedule.js:50`). These run **without** passing through `selfGovernance.ethicalCheck`.
- **Verdict:** There is no approval gate on tool actions. "Approved" in the chain is currently aspirational — actions fire, but nothing constitutionally approves them, and the agentic will never holds a goal to act toward.

### 8. memory result — PARTIAL (plan-coupled path dead; other memory paths live)
- `universal_tool_bridge.js:315-316` calls `engine.noteActionResult(tool, args, result)` when a tool is invoked, writing the outcome into the current plan step.
- But `noteActionResult` returns `{ updated: false, reason: 'no_active_plan' }` unless a plan is actively `running` (`planning_engine.js:222-224`). Since no plan is ever created (see 6), this write-back is a no-op.
- Tool results still generally reach memory via `memory.witness` through other handlers (e.g. observation/insight/goal paths), so memory is not starved — but the **plan-step → memory result** record specifically is dead because plans are dead.
- `DeepToolUse.executeTool` (`react_loop.js:76`) executes tools but does not record the result to a plan (no plan exists).
- **Verdict:** Tool→memory feedback is partially alive through generic witness paths, but the sovereign close-the-loop (action result attributed to the plan step that produced it) is inert.

---

## SUMMARY SCORECARD

| Link | State | One-line root cause |
|------|-------|---------------------|
| observation | LIVE | writes to `memory.witness` correctly |
| thalamic gate | LIVE | observations route through `filterAndAmplify`; highest-salience percept is readable |
| working memory | LIVE | gated percepts enter the bounded 7-item store |
| insight | LIVE | both insight engines receive real observation memory queries/stores |
| goal | LIVE | insight/consciousness goals are ethically adopted |
| plan | LIVE | adopted goals create stored plans |
| approved tool action | LIVE / GATED | safe tools execute; medium+ pauses for separate architect approval |
| memory result | LIVE | tool results are attributed to the active plan step and witnessed |

**Sovereignty verdict after God Pass 4:** The full chain is now operational. GSK observes, gates, holds working context, produces insights, adopts goals, creates plans, executes known safe tools, pauses mutating/unknown actions for architect approval, records PLT tax, attributes results to plan steps, updates will, and witnesses outcomes. Craig's private `GSK_ARCHITECT_KEY` is configured at the Windows user level and verified live.

---

## THE 4 PROVEN BREAKPOINTS (fix candidates for next God Pass)

1. **Insight engine starved** — wire `memoryQuery` (and `memoryStore`) into the Godforge `InsightEngine` (`fusion-loader.js:633-657`) and `evolutionTrigger` (`:921`) using the exact pattern already proven at `:724`/`:829`/`:908`. Highest leverage; re-animates insight→goal→plan.
2. **Thalamic gate bypassed** — route observations through `thalamicGate.filterAndAmplify()` in the `onObservation` handler (`fusion-loader.js:617`) and fix `attention.js:41` to call a method that exists (or add `getHighestSaliencePercept` to `ThalamicGate`).
3. **Working memory starved** — feed gated percepts into `workingMemory.push()` (from the gate output) so Constitution Class 1 is honored.
4. **Executive disconnect** — (a) call `planningEngine.createPlan(goal)` from the goal path; (b) route plan steps through `DeepToolUse.executePlan`/approval; (c) invoke `selfGovernance.ethicalCheck` + `agentic_will.set_goal` before action so "approved tool action" is real, not decorative.

---

## GOD PASS 3 — RECONNECT RESULTS (2026-07-13)

Craig ordered scan-and-fix. Profit Prime patched the four dead handoffs by reconnecting existing APIs only — no rewrite.

### Fixed Links
- **Observation → Thalamic Gate → Working Memory:** `fusion-loader.js` now routes observations through `thalamicGate.filterAndAmplify()` and pushes gated percepts into `workingMemory.push()`. Durable `memory.witness()` still records the raw observation with `meta.gated` and `meta.salience`.
- **Observation watcher:** `observation_engine.js` now handles Windows `rename` events as well as `change`, and dedupes seen log lines so one file edit does not re-witness the same last 10 lines repeatedly.
- **Attention phantom call:** `thalamic_gate.js` now implements `getHighestSaliencePercept()`. `attention.js` resolves `focusTarget || source || type` instead of assuming one field. Also fixed `ThalamicGate.directAttention()` so it no longer calls `attention.reorient()` with `undefined`.
- **Insight memory starvation:** `fusion-loader.js` wires `memoryQuery` and `memoryStore` into both `InsightEngine` instances (Godforge insight + evolution trigger). `insight_engine.js` now queries observations by tag (`tags:['observation']`) instead of impossible exact type `observation_`, and derives source from tags.
- **Goal → Plan → Governance/Will:** `GoalEngine.propose()` is wrapped in `fusion-loader.js`; every new goal now runs `selfGovernance.ethicalCheck()`, sets `agentic_will.will.set_goal()`, and calls `planningEngine.createPlan()`. Neutral goals now pass `SelfGovernance` instead of being refused as score `0`.

### Verified Live
- `node --check` passed for `fusion-loader.js`, `observation_engine.js`, `insight_engine.js`, `thalamic_gate.js`, `attention.js`, `self_governance.js`.
- Restarted GSK cleanly: one `gsk_daemon.js`; `:3001/mcp/health` 200.
- Observation test: writing two unique `[User] GODPASS_DEDUPE ...` observations produced exactly two new `observation_user` memory records (`meta.gated:true`, salience `0.5`) after dedupe. `observation_user` count rose to 8.
- Goal adoption test: status shows `plan_created=3`; latest plan memory: `Consolidate insights and prepare for world-building. (10 steps)`.
- Agentic will status: `plans=1 | actions=0 | will=0.43 | active=Consolidate insights and prepare for world-building.`
- E2E probe PASS: `:3001` reachable and `:3002` delivered real thoughts.

### Executive Boundary Status
- **Closed in God Pass 4.** Known safe tools can execute automatically; medium/high/critical actions pause for separate architect approval. The remaining work is durable checkpointing, approval persistence, and the broader 40-gap sovereignty program.

---

## GOD PASS 4 — APPROVED TOOL EXECUTOR (2026-07-14)

### Built
- New `gsk-core/governance/approved_tool_executor.js` closes `plan step → governance → risk → budget → approval → dispatch → result → memory`.
- Known read-only tools (`read_file`, `search_code`, catalog/world-list/status tools) auto-run as `safe`; `web_fetch`/diagnosis are `low`; unknown, delegated, and mutating actions are `medium`; external/social/sandbox actions are `high`; shell commands inherit `SecureShellSandbox.classify()`.
- Explicit risk can raise computed risk but can never lower it.
- Default per-plan limits: 5 steps, 5 tool calls, tax 1.5, 60s plan window, 30s step response timeout.
- Every step runs `SelfGovernance.ethicalCheck()`. Denied, budget-blocked, approval-required, successful, and failed outcomes are durably witnessed.
- Successful actions update AgenticWill, PLT history, and the current PlanningEngine step. Completed/failed plans invoke reflection.
- Architect approvals use a separate `GSK_ARCHITECT_KEY` / `x-architect-key`; they do not fall back to the public development MCP key.
- Approved high-risk shell commands carry an unforgeable in-process Symbol into `SecureShellSandbox`, avoiding a broken double-approval while remaining impossible to forge through JSON.
- Status/history redact secret-bearing argument keys and omit tool output contents.

### MCP Control Surface
- `autonomy.status`, `autonomy.plans`, `autonomy.pending`
- `autonomy.execute_plan`, `autonomy.execute_action`
- `autonomy.approve`, `autonomy.deny`, `autonomy.execute_approved` (architect key required)

### Verified
- Targeted suite: **14 passed, 0 failed** (`test_approved_tool_executor.js`).
- Live safe action: `catalog_list` completed through the full chain; plan+step `completed`; `approved_action_result` memory written; persisted PLT actions increased `1 → 2`.
- Live mutation test: `write_file` paused `awaiting_approval` as medium risk; target file remained absent; nested `apiToken` returned as `[REDACTED]`.
- Architect key configured privately (value not recorded in Seshat). Live lifecycle verified: mutating action queued → Craig approved → action executed → one-step plan finalized `completed` → test artifact removed.
- Final E2E PASS: one daemon, `:3001` reachable, `:3002` delivered real thoughts.

---

## RELATED PAGES
- [[REDBUTTON]] — constitution, 86-writers-vs-8-readers, governance theology
- [[REDBUTTON - GSK Memory Diagnosis]] — write vs read imbalance
- [[Diagnostic-Findings-Scan-v1]] — prior scan baseline
- [[THE-PROFIT-BIBLE]] — canonical doctrine
