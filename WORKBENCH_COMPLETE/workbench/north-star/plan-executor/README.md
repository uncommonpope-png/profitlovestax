# Level-wise plan executor

Node.js, CommonJS, zero dependencies. Runs with plain `node`.

```sh
node plan-executor.test.cjs   # 36 tests, exit 0 on pass
```

## What it implements

A DAG plan executor that runs level by level, with the replan,
hedging, rescue, and recalibration rules from north-star research
batches 169, 171, 173, 175, 177, 179. Task functions are caller-supplied:
each task is `{ id, dependsOn?, kind?, readOnly?, run }` where `run`
is `async (ctx) => value` and `ctx = { taskId, levelIndex, prefix,
executor }`. `prefix` is the list of completed levels only.

### Rule-to-batch mapping

| Rule | Batch | Code |
|---|---|---|
| DAG levels = longest-path depth; siblings in a level may run in parallel | 169 (GAP) | `computeLevels()` |
| Level-wise prefix accumulation: each level's context carries the completed joint observation of prior levels, never partial mid-level state | 169 (GAP gate amendment) | `PlanExecutor.run()`, `prefix` |
| ModeX-with-normalized-AST modal selection for the disputed-hop tier, with the mode-collapse warning as a guardrail | 169 (ModeX) | `modalSelect()`, `MODAL_SELECTION_GUARDRAIL` |
| Replan ONLY at level/iteration boundaries on completed joint observation, never mid-level | 171 Rules 1–2 (LLMCompiler precedent) | `onLevelBoundary` hook; `requestReplan()` refuses mid-level explicitly |
| Committed state is a precondition for replan, never a retraction | 171 Rule 4 | `_applyReplan()` requires `committedState` when any hop committed |
| Emergency abort is a separate path: halts without replanning, no prefix update for the incomplete level | 171 Rule 5 | `abort()` |
| Replan-boundary cost audit: four fields per level (per-sibling start/finish timestamps; invalidator identity + completion time; level completion time → wait W and wait fraction; planner-call duration) + win statistic (early-exit wins only if median W exceeds planner-call + re-issue cost) | 173 measurement spec | `PlanExecutor.audit`, `earlyExitWins()` |
| RULE 6 read-only early-exit: a third path distinct from boundary replan and abort; a read-only task may exit its level early, recorded as `early-exit`, with no prefix update | 173 Rule 6 | `earlyExit` signal on a returned value; `requestEarlyExit()` |
| Hedged reads ported to tool reads ONLY, never commits/writes | 173 (Dean & Barroso) | `ToolLatencyTracker.shouldHedge()` |
| Hedge-rate breaker: >10% over ≥100 calls, measured against a FROZEN baseline (a self-normalizing rolling trigger can never trip) | 173 + 175 correction | `breakerActive`, `frozenP95` |
| Hedging enabled at 100 observations per tool, p95 stable at 400 (provisional 100–399) | 175 tiers | `hedgingEnabled`, `provisional`, `stable` |
| Hedging restricted to multi-path reads (≥2 independent paths); singletons use the stuck-call rule instead | 175 singleton correction | `shouldHedge()` refuses single-path reads |
| Singleton stuck-call rescue = abort-and-restart, NEVER a parallel duplicate (a parallel duplicate on one resource is the retry-storm shape, not a hedge) | 177 Part 1 | `evaluateStuckRescue()` returns `mode: 'abort-and-restart'` only |
| Stuck threshold T_stuck = max(2× frozen p95, p99 if frozen n ≥ 1000), else 2× frozen p95 | 177 Part 2 | `stuckThresholdMs()` |
| Rescue gates, all required: read-only + idempotent, zero progress, true proven abort, single re-issue, budget fit (≥ 2× frozen p95); rescue rate > 2% trips the threshold to 3× p95 | 177 gates 1–6 | `evaluateStuckRescue()`, `recordRescue()` |
| Frozen-baseline recalibration: weekly-check function, ≥100 new calls required, re-freeze only on 20% drift holding 2 consecutive windows OR a CUSUM alarm; downward re-freeze automatic, upward re-freeze refused while the breaker is tripped; re-freeze resets the breaker window, degrading log retained | 177 Part 3 | `weeklyRecalibrationCheck()`, `freezeBaseline()` |
| Per-mode T_stuck, ONLY where the mode is dispatch-observable from the call's inputs (cache key present/absent, index present/absent, argument class, endpoint selected): each mode gets its own frozen baseline (own p95, own p99 if n_mode ≥ 1000, own version); T_stuck(mode) = max(2× frozen p95(mode), frozen p99(mode) if n_mode ≥ 1000); n floors PER MODE (n_mode < 100: no T_stuck, no rescue for that mode; 100 ≤ n_mode < 1000: 2× p95 only). A tool with one mode at n = 800 and another at n = 40 rescues in the first and waits in the second — that asymmetry is correct | 179 Part 1 | `observeMode()`, `freezeModeBaseline()` / `freezeAllModeBaselines()`, `stuckThresholdMsForMode()`, `evaluateStuckRescueForMode()` |
| Circular-label ban: a mode label assigned AFTER the call completes (e.g. "calls over 1s were slow mode") is forbidden — refused loudly, never silently accepted | 179 Part 1 | `observeMode()` throws on `afterCompletion` / `dispatchObservable: false`; `postHocModeLabel()` always throws; `modeLabelAtDispatch()` is the dispatch-time path |
| Unobservable-mode tools: ONE pooled baseline, pooled T_stuck = max(2× pooled p95, pooled p99) (bias toward fewer rescues); the zero-progress gate already narrows spurious rescues to silent slow-mode calls; on a rescue-rate trip the response is a mode-split INVESTIGATION, NOT a blind raise to 3× pooled p95 | 179 Part 1 | `pooledStuckThresholdForUnobservableModes()`, `ToolLatencyTracker` with `{ unobservableModes: true }`, `recordRescue()` investigation path, `unobservableRescueRateResponse()` |
| Mode-share drift: the frozen baseline tuple gains mode label + mode share; a share shift > 20% between freeze and window is a drift signal on its own even if neither mode's p95 moved; the sleep-job path logs it and must NOT re-freeze the pooled baseline to absorb it | 179 Part 1 | `frozenBaselineTuple()`, `modeBaselineTuple()`, `checkModeShareDrift()` (never touches any frozen baseline) |
| Bimodality detectors as TRIGGERS for a split investigation (not gates): (a) a dispatch input separating the latency histogram into two clusters whose medians differ by an order of magnitude (≥ 10×); (b) pooled p95/p50 ratio exceeding ~10× with a visible gap (largest consecutive-value ratio ≥ 2×). A formal mixture test (Hartigan dip) is a later refinement, NOT required or implemented | 179 Part 1 | `bimodalityByDispatchInput()`, `bimodalityByPooledRatio()` |
| Abortable as a three-state field per tool: UNKNOWN (no declaration, no observation — rescue unavailable) → DECLARED (mechanism claimed — rescue STILL unavailable) → PROVEN (at least one abort issued and its effect observed — rescue available) or DISPROVEN (abort issued and work observably continued — rescue disabled). Disproof is STICKY: re-declaration alone never restores rescue; restoration requires re-declare AND re-prove | 179 Part 2 | `AbortAudit` (`declare()`, `recordPositiveProof()`, `recordNegativeProof()`, `recordDisproof()`) |
| Provability classes: HARD (process kill, thread cancel, handle close, connection close where the implementation dies with it — one observed kill suffices, stays proven across versions unless the mechanism changes); COOPERATIVE (cancellation token / AbortSignal / context.Context — proof is an observed early exit attributable to the signal, version-sensitive, re-proven per version); PROTOCOL (MCP notifications/cancelled, Streamable HTTP stream close — proof is NEGATIVE ONLY, recorded as "proven-negatively, window W, n observations", sufficient for read-only tools alone; for non-read-only tools protocol abort is NEVER sufficient for rescue, consistent with never-hedge-commits) | 179 Part 2 | `AbortAudit` (`noteVersion()`, `noteMechanismChange()`, `rescueAvailable()`, `toRecord()`), `abortAuditRescueAvailable()` |
| Rescue gate 3 restated: "abortable = PROVEN in the audit, with a class-appropriate proof." Other gates unchanged (read-only + idempotent, zero progress, single re-issue, budget fit, separate rescue-rate metric). Proof accrues from real stuck-call rescues and real user cancels, not from declarations. A sacrificial probe is legitimate ONLY for a HARD mechanism (bounded cost, definitive result); never for a cooperative mechanism on a stateful tool | 179 Part 2 | `evaluateStuckRescue({ abortAudit })` (audit canonical when supplied; boolean `abortAvailable`/`abortProven` path kept for Batch 177 compatibility), `AbortAudit.sacrificialProbeLegitimate()` |

### Signal convention

A task's returned value object may carry boolean fields:

- `planInvalidating: true` — the task is the level's invalidator
  (Batch 171 Rule 3 / Batch 173 audit field b).
- `earlyExit: true` — the task requests RULE 6 early-exit.

The whole value is kept as the observation; the flags are read off it.

### Neither paper classifies uncertainty sources

Per Batch 169's verdict: GAP is about planning parallelism and ModeX
about selection among sampled outputs. Neither studies uncertainty or
the ignorance-vs-multiplicity distinction. This module does not claim
otherwise, and the Batch 16 three-class split is untouched here.

## Honest limits

- **Design-form spec ported to code.** The batch numbers above are
  design judgments and order-statistic arithmetic, not measurements.
  No runtime latency measurements exist yet: the four audit fields
  and the win statistic are recorded by the executor, but no live
  tool timing data has been collected.
- **No model/tool integration.** This executor takes caller-supplied
  task functions. It does not call any model, tool, or service.
- **Cancellation is modelled, not enforced.** The executor runs each
  level's tasks to completion (`Promise.allSettled`). A RULE 6 exit
  records the notified-sibling intent and marks the level incomplete;
  it cannot kill in-flight JavaScript promises. Real cancel tokens,
  checkpoints, and finalize-in-DAG-order are caller-side
  (Charguéraud, Batch 173).
- **Modal selection is the exact-adjacency reduction, not full ModeX.**
  With 0/1 normalized-AST adjacency the modal cluster is the largest
  equivalence class and the centroid is its first member, which is
  what `modalSelect()` computes. The full spectral bipartition
  (Fiedler vector) and conductance-τ stopping rule are NOT
  implemented; the caller supplies the normalized-AST key function
  (the default key does no case/date/number normalization).
- **CUSUM is an input, not a computation.** `weeklyRecalibrationCheck`
  accepts a caller-supplied `cusumAlarm` boolean from the sleep job;
  it does not compute the CUSUM statistic (k = 0.5σ, h = 5σ) itself.
- **Emitter scoring is out of scope.** The executor carries joint
  observations level-wise; it does not compute prefix-poisoning scores
  or the level-wise emitter accumulation statistic (Batch 169's
  emitter test remains a separate piece).
- **Mode chapter and audit chapter are design specs awaiting logged
  per-tool latencies and real abort observations.** No tool latencies,
  mode shares, or abort observations were measured in Batch 179 —
  there are no logged per-tool latency distributions or abort logs to
  calibrate on. The 10× p95/p50 bimodality trigger, the 20% mode-share
  drift threshold (borrowed from Batch 177's p95 drift number), and
  the negative-observation window W for protocol aborts are design
  judgments, not measurements; W itself is unnamed (it must exceed the
  tool's normal late-response window, which is tool-specific). The MCP
  cancellation synthesis in Batch 179 is secondary (a blog synthesis +
  SDK docs), not a read of the MCP spec text itself; the "SHOULD stop
  / MAY ignore / MUST NOT respond" triple should be verified against
  the spec before it is built on. A formal mixture test (Hartigan dip)
  is a later refinement, not implemented here; the visible-gap rule in
  `bimodalityByPooledRatio()` (largest consecutive-value ratio ≥ 2×)
  is a design judgment, not a paper constant.
- **Per-mode auto-freeze caveat.** `observeMode()` auto-freezes a mode
  at its first 100 samples, mirroring the pooled tracker's behaviour;
  a sleep job that wants the full sample set as the frozen baseline
  should call `freezeModeBaseline()` / `freezeAllModeBaselines()`
  explicitly (the tests do this for n > 100 sets).
- **Audit proof sources are caller-attested.** `AbortAudit` refuses
  proof without a source in {real-stuck-rescue, real-user-cancel,
  sacrificial-probe} and refuses sacrificial probes for non-HARD
  classes, but it cannot verify that a caller-supplied "real" event
  really happened — that verification lives in the caller's logging.
- **Upward re-freeze rule follows the task formulation:** upward
  re-freeze is refused while the breaker is tripped and allowed once
  the drift test passes with the breaker clear. Batch 177's stricter
  reading (upward re-freeze as a recorded sleep-job decision, never
  automatic) is not enforced by this function; callers that want it
  should gate upward re-freezes on a recorded decision.
