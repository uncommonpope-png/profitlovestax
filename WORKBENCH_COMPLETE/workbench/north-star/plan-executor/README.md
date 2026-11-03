# Level-wise plan executor

Node.js, CommonJS, zero dependencies. Runs with plain `node`.

```sh
node plan-executor.test.cjs   # 59 tests, exit 0 on pass
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
| TOKEN INTERVALS DO NOT TRANSFER to tool calls: ModeX-Lite's T=100 interval fires zero times on a call finishing before 100 tokens (a no-op that still paid N× generation); §5.1 robustness covers T in {100..500} on long trajectories only; O(NL + N²) with N≪L is weaker for short calls; Lite-vs-full is mixed by model/task, so a Lite tier must be measured on the bundled base, never assumed | 192 (Choi & Li, arXiv:2601.02535, Lite sections) | Header comment; `PREFIX_CHECKPOINTS` |
| Structural checkpoints replace token intervals: C0 tool-name closure (key = tool only), C1 parameter-name-set closure (key = tool + param-name multiset), C2 value-prefix / complete call (key = tool + normalized args prefix) | 192 | `checkpointPrefix()`, `candidatesAtCheckpoint()`, `prefixClusterKey()` |
| Parsed-prefix adjacency, not lexical Jaccard: false merge (same tool + first param, differing later params) and false split (same multi-token tool name, mid-name) both avoided by parsing; unclosed fields are UNKNOWN, never zero; partial-JSON parser closes strings/brackets provisionally FOR PARSING ONLY, never for execution; parser cost unmeasured | 192 | `parsePartialToolCall()`, `PARTIAL_UNKNOWN` |
| Diversity-preserving prune rule: prune ONLY WITHIN a cluster, NEVER across clusters; ≥1 representative per tool cluster (C0) and per (tool, param-set) cluster (C1); within a cluster, prune near-duplicates (same normalized prefix) to centroid-side members; a minority tool cluster is NEVER pruned on modal grounds; cross-cluster modal selection happens ONLY at completion via `modalSelect()`; ModeX §7 mode-collapse under early pruning is IRREVERSIBLE deletion | 192 | `prefixPrune()`, `PREFIX_PRUNE_GUARDRAIL` |
| Two enforced invariants: (a) ModeX candidates are alternative generations FOR THE SAME HOP — GAP siblings refused, never clustered (`hopId` mismatch throws); pruning runs per hop, independently per hop. (b) Pruning does NOT repeal Batch 5's sampling-tax gate — disputed-hop tier stays gated to disputed/high-stakes hops; pruning makes a gated spend cheaper, not an ungated spend free | 192 | `prefixPrune()` hopId guard; `falsifierReplay()` gate note |
| Calibration split: full-call conductance (Batch 169, still open) vs prefix conductance at C0/C1 are SEPARATE thresholds, never merged; no prefix threshold constant is set — calibrate C0/C1 on logged disputed hops, report separately from full-call τ | 192 | `falsifierReplay()` per-checkpoint summary (the calibration input) |
| Falsifier harness: on logged disputed hops with k completed candidates, replay prefix by prefix; report (a) agreement rate (prefix modal cluster == final full-call modal cluster, at checkpoint granularity), (b) prune regret (fraction of pruned candidates that were the final centroid or person-accepted), (c) tokens saved per hop per checkpoint; PASS requires regret ≈ 0 AND agreement monotone C0→C1→C2; also measures the tool-call token-length distribution (proxy tokens) — the distribution, not an assumed length, proves a token interval would have been a no-op | 192 | `falsifierReplay()`, `proxyTokens()` |
| Cost curve (documented, not a constant): earliest checkpoint saves most, carries least information; staged rule = cheap safe duplicate-pruning early, no irreversible cross-tool decision until completion | 192 | `falsifierReplay()` tokens-saved-per-hop output |
| Select is ADVISORY-ONLY: Batch 3's Select step must NOT be constrained rescoring / teacher-forced name selection — at AST level (name + arguments) that protocol loses −19.1 pts pooled to free generation, and even forcing the GOLD name scores below free generation per model (0.24/0.44/0.55 vs 0.28/0.67/0.77). The only Select behavior is a soft advisory hint into a FREE generation of the whole call (pooled AST +1.8, McNemar p=0.06, n.s. — at-worst-neutral, never a deployment win), or a gated dispute-tier re-check that re-generates freely with the hint. Any forced-prefix spec throws | 194 (Chen, arXiv:2606.16364) | `advisoryHint()`, `assertAdvisoryOnlySelect()`, `selectAdvisory()`, `SELECT_ADVISORY_ONLY_GUARDRAIL` |
| Attention-segment selector is SINGLE-HOP ONLY: its gains (+11.9 BFCL / +14.9 Seal-Tools) are name-only, single-call results under a protocol that loses at AST — quoting them as end-to-end call-accuracy gain is a misquote. Multi-turn transfer fails (−27 pts on the τ-bench probe; gate AUROC 0.48/0.73), so multi-turn use is refused until re-validated in a real multi-turn loop; raw ungated selection regresses on 3B (−4.7), so the logprob-margin gate is load-bearing | 194 | `assertSingleHopScope()`, `CHEN_194_FINDINGS` |
| Eager-attention deployment constraint: HAA requires HuggingFace eager attention with output_attentions on; vLLM cannot expose attention weights. The bundled runner must either serve the disputed hop in eager mode (a separate slow path) or forgo attention-segment signals entirely. The 1.2× selector cost is measured against an eager baseline, NOT against an optimized FlashAttention/vLLM path | 194 | `selectorServingPath()`, `EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT` |
| Selector and ModeX are ALTERNATIVES for a disputed hop, not votes: no vote/ensemble path exists — the paper's panel-vote variant loses 32 points. Exactly one tier must be named | 194 | `chooseDisputedHopTier()` |
| Core finding + Correction 2: on 198 real BFCL live_multiple failures, per-candidate attention argmax points to the gold tool on 80% (per-model 0.71/0.86/0.80) vs 21% chance — failure at the readout, not the harness. Input-side repairs recover ≤23% (reorder 18.2%, duplicate 16.7%); the wrong-tool budget goes to readout-side mechanisms (advisory hint, calibrated steering, retraining) and logging the failure as a counterfactual trace for the sleep job. Steering fixes WHICH function is named, never its arguments (calibrated δ=+2: name 0.67/0.04, arguments net-zero 0.13/0.13; δ=+8 under free generation collapses name 0.929→0.20) | 194 | `wrongToolBudgetAllows()`, `CHEN_194_FINDINGS` |
| Round-5 constraint composes with round 4, does not replace it: the C0/C1/C2 diversity-preserving prefix tier STANDS untouched; the advisory hint never deletes a tool identity, so prune (duplicates only) → hint (advice only) → free generation | 194 | `selectAdvisory()` over `prefixPrune()` survivors (test) |

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
- **Round-5 numbers are the paper's, not the product's (Batch 194).**
  Every Chen figure in `CHEN_194_FINDINGS` (80% attention argmax,
  −19.1 AST, +1.8 advisory, +11.9/+14.9 name-only, −27 multi-turn,
  1.2× eager-baseline cost) is the paper's on its benchmarks (BFCL
  live_multiple 300/model, Seal-Tools 294/model, scripted τ-bench
  probe), NOT on the north-star tool pool or the bundled base. No
  live model run, no attention measured, no product gate verified, no
  SEP conformance claimed. The +1.8 advisory figure is within noise
  (p=0.06) and must never be quoted as a deployment win; the
  +11.9/+14.9 figures must never be quoted as end-to-end
  call-accuracy gain. Whether a soft advisory hint helps on the
  person's own repeated tasks, and whether eager-mode disputed hops
  are affordable on the target machine, are both untested.
- **Prefix tier is harness-proven, NOT design-proven (Batch 192).**
  All falsifier tests run on synthetic fixtures: they prove the
  harness mechanics (agreement / regret / token-saved computation,
  monotone check, regret≈0 gate, per-hop and minority-cluster guards),
  not that C0/C1 pruning is safe on real calls. NO real logged
  disputed hops exist yet, so no agreement/regret number from a
  fixture run is a finding. Token counts are proxy counts (word /
  punctuation tokens), not model-tokenizer counts, and the product's
  own tool-call token-length distribution, field order, and
  multi-token tool-name behavior are still unmeasured. The
  partial-JSON parser's cost and provisional-closing correctness are
  unmeasured; it is parse-only and must never feed execution.
  The C0 collapse reading is recorded in code: at C0 the observed
  prefix is the tool name only, so same-tool candidates collapse to
  one survivor per tool cluster, and prune regret is the arbiter of
  whether that bet is safe. If regret condemns C0, the named fallback
  is keeping all same-tool candidates until C1 splits them by
  parameter set. No tool-call-specific early-pruning paper was found
  in Batch 192; the Sun/Hong related-work leads were NOT read in full
  and their numbers are NOT cited or built on here. Chen
  (arXiv:2606.16364) WAS read in full in Batch 194 and is built on in
  the round-5 section above (main text only — appendix tables were
  not re-read, so no appendix-only number is quoted). Default value
  normalization is casefold + sorted
  keys only; full Batch 10 per-argument rules (number tolerance, date
  parse, enum alias, defaults, ignored args) are caller-supplied via
  `normalizeFn`, not claimed by the default.
