# Level-wise plan executor

Node.js, CommonJS, zero dependencies. Runs with plain `node`.

```sh
node plan-executor.test.cjs   # 171 tests, exit 0 on pass
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
| Advisory-hint test design, pre-registered: three arms (free / Plan-top1 advisory / gold-hint ceiling Chen lacks), frozen personal gold, one-third confusable, three routines, AST decomposition (name AND arguments, order-independent) | 197 | `ADVISORY_TEST_ARMS`, `advisoryArmSpec()`, `assertTaskSet()`, `scoreCall()`, `scoreArms()` |
| Tiered sample-size honesty: 20–30 falsifier ("not falsified" vs "falsified," never "works"); 100-task pilot cannot confirm Chen's +1.8 ("consistent with noise"); 300-task Chen-scale ceiling is "no large harm + direction," never "replicates Chen"; never pool across models/bases | 197 §4 | `SAMPLE_TIERS`, `tierForN()`, `checkClaim()`, `mcnemarReport()` |
| Pairing controls: freeze memory/adapter/tool-pool growth, fixed order, fresh context per arm, full Batch 4 audit row per call | 197 §6 | `assertPairingControls()` |
| Multi-turn survival: M1 embedded single-hop, M2 full episodes with final-state verdict; M1/M2 only after the pilot passes; Chen last-token-margin gate BANNED in multi-turn; turn-1 positive + final-state ≤ 0 = FAIL for loop use | 197 §7 | `assertMultiTurnOrder()`, `assertMultiTurnGate()`, `multiTurnVerdict()` |
| Abort rules: advise-all AST below free with valid@1 down > 2 or ExecRate down > 3 stops the hint; A-gold helps but A-rec does not stops to re-examine the RECOMMENDATION | 197 §8 | `abortCheck()`, `assertPilotPassed()` |
| Hint wording fixed and verbatim (Chen publishes none): one system-prompt line, arguments never included; a result without its verbatim hint string is not reproducible | 197 §3 | `ADVISORY_HINT_TEMPLATE`, `advisoryHintText()`, `assertVerbatimHint()` |
| Lever disentanglement: Chen oracle residual (90.9% / 1.9%, Jaccard 0.865) is GOLD-POINTED, oracle-only, never deployable; Wu gold-free steering (56–78% full-name, 0% near-synonyms) is a LAB-ONLY arm behind the pilot; Wang ASA is a trigger-axis mechanism, WITHDRAWN, numbers quarantined | 199 (Wu arXiv:2605.07990v3; Wang arXiv:2602.04935) | `RESIDUAL_LEVERS`, `leverGate()`, `CHEN_ORACLE_LEVER`, `WU_STEERING`, `ASA_QUARANTINE` |
| Wu steering guards: prefix-rule 81–100% is never a switch rate; first-token bound (≤165/210 switchable); near-synonym exclusion (parallel vectors → advisory hint fallback); steered calls pass Batch 4 verifier + argument checks, never credited with argument repair (30/30 fail); tool vectors are base-specific (cross-family 0%, rebuild 2–3 examples/tool); loop claims pass Batch 197 M2 final-state rule, injection inside a loop refused as untested | 199 | `assertSwitchRateQuote()`, `firstTokenSeparable()`, `assertSteeringPair()`, `assertSteeredCallVerified()`, `toolVectorArtifact()`, `assertToolVectorBase()`, `wuLoopClaim()` |
| Disputed-hop tier order, canonical, cheapest first: (1) advisory hint, (2) Wu cosine-gap DETECTOR candidate, (3) Wu steering lab arm, (4) Chen S2 attention — Batch 194's "residual lever as cheaper alternative" framing RETIRED; Batch 3 Select stays advisory-only (Chen −19.1 untouched) | 199 | `DISPUTED_HOP_TIERS_199`, `canonicalTierOrder()`, `assertTierOrder()`, `BATCH_194_RESIDUAL_FRAMING` |
| Wu cosine gap as pre-generation detector candidate, not selector, not shipped: one last-token read, <0.1 ms over the prompt pass, BFCL AUROC 0.61–0.78, NO threshold set (ranking only, 13–61 errors/model); needs within-routine validation (Batch 13) + comparison vs Batch 5 logprob-margin gate; flags uncertainty, not wrongness; silent on confident errors | 199 | `WU_GAP`, `assertGapThreshold()`, `assertGapUse()`, `gapDetectorStatus()`, `gapReading()` |
| Infrastructure convergence: gap needs Batch 7/8 in-process capture (one layer); steering needs the same PLUS a prefill write hook; neither works over HTTP; one-layer element bound ~6,553 (vs 1,310 for 5 layers), still a full-tensor copy, fail-soft to G-NLL + verifier; SEP-TBG probe and Wu gap share one capture only if layers coincide, else the budget doubles | 199 | `CAPTURE_CONVERGENCE`, `captureElementBound()`, `captureCopies()`, `assertCapturePath()` |
| Detector stack as a TIMELINE by time, not a menu — Healy slotting correction: (0) advisory hint first; (1) Wu gap PRE-generation (selection-only); (2) logprob/first-token margin DURING generation (first-token only, selection-only); (3) Healy-style classifier POST-generation, PRE-execution — the ONLY stage that sees arguments, the first argument/completeness-error detector; (4) Batch 4 schema verifier + argument checks mandatory after every stage (no detector stage repairs arguments). Round 7's tier order stands untouched; the timeline extends it by adding a stage, not replacing one | 201 (Healy, arXiv:2601.05214) | `DETECTOR_TIMELINE_201`, `detectorTimeline()`, `assertTimelineOrder()`, `assertHealyNotPreGeneration()`, `assertExecutionRequiresVerifier()` |
| Healy gate is CONFIRMATION-TIER ONLY: it may flag for person confirmation or an advisory re-pick, NEVER auto-block or decide on its own — justification verbatim: hallucination recall 0.53–0.62 (best model misses about half), Qwen precision 0.34 (two-thirds of flags false alarms). Any auto-block policy throws | 201 | `HEALY_CONFIRMATION_JUSTIFICATION`, `healyGatePolicy()` |
| Headline number corrected: the abstract's "up to 86.4% accuracy" and Table 1's rows are WEIGHTED averages, NOT hallucination-class performance. Real hallucination-class figures (Table 2, test split): GPT-OSS-20B 0.86/0.53/0.66 (support 587); Llama-3.1-8B 0.71/0.61/0.66 (support 1036); Qwen-7B 0.34/0.62/0.44 (support 333). Quoting the abstract/Table 1 as hallucination-class throws | 201 | `HEALY_201`, `healyHallucinationClass()`, `assertHealyQuote()` |
| Healy method + limits as spec: feature vector z = Π(h at function-name's first sub-token ‖ mean over argument-region tokens ‖ h at closing delimiter), last layer only; five-type taxonomy BUT bypass never measured separately (do NOT cite Healy for bypass detection); intervention policy (block/confirm/fallback/repair-by-reprompting) PROPOSED, never evaluated — no measured effect on task success; ablation simplification — all ten feature methods within 0.007 accuracy (0.739–0.746), last-token 0.744 / mean-pooled 0.746, so a future build starts with last-token or mean-pooled features | 201 | `HEALY_201`, `assertHealyBypassClaim()` |
| Healy reporting inconsistencies carried as caveats, NOT resolved: (a) Eq. (1) Π identity gives m = 3d, but training config lists input dims equal to hidden dim d (Qwen-7B 3584, GPT-OSS-20B 2880, Llama-3.1-8B 4096); (b) main protocol 60/20/20 over 2,411 per model, but Qwen Table 2 totals 2,000 and the ablation uses a different 70/30 split | 201 | `HEALY_201.reportingInconsistencies` |
| Healy scope limits + personal-data recipe: five calculator-style Glaive domains, single-call canonicalizable tasks — NOT multi-turn routines, NOT real side-effect APIs, NOT similar-tool disputes; no near-synonym test (beats-Wu-on-confusables UNKNOWN, not favorable); no within-routine score; τ validation-tuned per model per dataset, so a personal deployment re-tunes τ on personal data. Recipe: masked-agreement labels from the person's verified calls (Batch 2 person-as-corrector in classifier form), but at personal scale (tens to low hundreds vs Healy's ~1,447/model) the honest version is a SMALLER classifier or probe, evaluated on within-routine hallucination recall/precision — not Healy's MLP at Healy's scale | 201 | `HEALY_201.scopeLimits`, `HEALY_201.personalDataRecipe` |
| Healy infrastructure cost + artifact: "single forward pass" holds only in-process — it needs streaming capture DURING generation (function token, argument span, closing delimiter); on a server path it means a second pass over generated text. Trained, base-specific artifact joining the Batch 8/9 versioning tuple — a base swap orphans it | 201 | `HEALY_201.infrastructureCost`, `healyClassifierArtifact()`, `assertHealyArtifactBase()` |
| What Healy does NOT change (guards, no regress): Batch 3's Select stays advisory-only (Healy gates execution, it does not select); Batch 197's pilot order stands (Healy is a later gate arm — do NOT merge it into the 100-task pilot); Batch 199's Wu-steering lab-arm exclusion stands (Healy detects, it does not steer) | 201 | `assertHealyNotPilotArm()`, `assertHealyNotSteering()` |
| ASA re-checked, still withdrawn — quarantine STANDS: arXiv abstract 2602.04935, "withdrawn by Youjin Wang," v1 Feb 4 2026, v4 Aug 28 2026, no PDF; ASA numbers never cited as evidence. Wu-citation correction: Healy is cited by Wu §1 ONLY (not §1/§6) until a different Wu version shows otherwise | 201 | `ASA_RECHECK_201`, `assertAsaQuarantineStands()`, `WU_HEALY_CITATION_201`, `assertWuHealyCitation()` |
| Multi-sample live tool gate stays CLOSED: Batch 5 sampling-tax rule + Batch 10 demotion (multi-sample SE offline-only for tool hops; G-NLL_SMT live) STAND, now with two more primary sources (Sun arXiv:2410.20290v2, Hong arXiv:2509.13990v1). No code path may reopen a live multi-sample gate for tool hops — any such request throws | 204 (Sun, Hong) | `MULTI_SAMPLE_LIVE_GATE_CLOSURE_204`, `assertLiveToolGate()`, `assertNoGateReopening()` |
| SR-logprob variant disqualification + correction: SR with the model's own average log-probability s(Y) = (1/len) ln p(Y|X) needs NO reward model (the naive "SR needs a reward model" objection FAILS for this variant), BUT it selects for probability — the confident-error direction on tool hops (Batch 10 FC collapse: mean token probability 0.97; wrong calls identical except syntactic tokens). DETACHED: legitimate generation accelerator for FREE-CHAT hops only, never a gate, never for tool hops | 204 (Sun §5.3) | `SR_LOGPROB_204`, `assertSrLogprobScope()` |
| SR's other two independent disqualifications for the live tool gate: destructive pruning (a killed candidate is gone; partial scores computed before late arguments are written) and no uncertainty output (SR returns one winner, feeds no F_t/TPS). Slim-SC transfer limits: at most ~45% off a still-fatal 3–5× cost; embedder unnecessary for tool calls (normalized-AST distance strictly better and free); thought segmentation does not map to tool hops (no warm-up period, no long redundant chains in 30-token tool calls); models 14B/32B reasoning on STEM, not 4B tool loop | 204 (Sun §4–§6, Hong §2–§6) | `SR_DISQUALIFICATIONS_204`, `SLIM_SC_TRANSFER_204` |
| Four-rule constraint set for ANY future sampled step (offline bootstrap, disputed-hop tier, Healy-gate sampling arms), each as an enforced guard: (a) WARM-UP/DELAY — no pruning, scoring, or rejection before the decision-bearing tokens exist; for tool hops never prune/score before arguments are written; a partial score on a function name alone is not a gate input. (b) WITHIN-CLUSTER PRUNING ONLY — prune redundant members within an equivalence cluster (Batch 16 Class 1), one representative per cluster; a mode-selecting prune (ModeX, Batch 18) throws. (c) ABSOLUTE THRESHOLDS, NOT QUANTILES — SR's kill-the-bottom-α rule rejected as a gate shape; needs a τu/τv-family bar (Batch 5) or an equivalence test (Batch 16). (d) SELECTION ≠ UNCERTAINTY — a sampled step that prunes its own sample cannot report that sample's spread; pruned-pool agreement is never a confidence signal (F_t/TPS/multiplicity) | 204 | `SAMPLED_STEP_RULES_204`, `assertWarmUpDelay()`, `assertGateInputNotPartialScore()`, `assertWithinClusterPrune()`, `withinClusterPrune()`, `assertAbsoluteThreshold()`, `assertConfidenceNotFromPrunedPool()`, `assertSampledStep()` |
| Parked free-chat test shape, NOTE ONLY (not a live path): SR-logprob vs single greedy on free-chat hops, latency + person-accepted quality, NOT perplexity alone (PPL is the objective, so a PPL win is circular). Never on tool hops | 204 | `PARKED_FREE_CHAT_SR_TEST_204`, `assertParkedFreeChatSrTest()` |
| Sampled-step compliance check of the Batch 197 pilot: PASS on all four rules — Rule 1 with its verb scope (decisions ON generated candidates; pre-generation suggestions like Batch 3 Plan–Retrieve–Select top-1 are not gate decisions), Rule 2 PASS VACUOUSLY recorded as "no sampled pool exists" (one call per arm, greedy/temperature 0, fresh context per arm), Rule 3 absolute abort bars (valid@1 down > 2, ExecRate down > 3, multi-turn final-state ≤ 0 with single-hop positive) with McNemar as a measurement not a cull, Rule 4 reported quantities on complete calls with the logprob margin kept separate as a gate input | 206 | `PILOT_COMPLIANCE_206`, `classifyPilotStep()`, `pilotRule2VacuousPass()`, `assertPilotAbsoluteBars()`, `mcnemarMeasurement()`, `assertPilotReportLabels()`, `checkPilotSampledStepCompliance206()` |
| Pilot pre-registration AMENDMENT (before any task runs): A-rec runs as ADVISE-ALL — hint on every task, no logprob-margin gate on hint delivery; any margin-gated hint variant is REFUSED inside the pilot. Logprob-margin hint gating is PARKED as a separate post-pilot arm (gated-vs-advise-all comparison, if wanted). Rationale: Chen's gated variant (hint only below the per-model MEDIAN name margin; gated 0.579, worse than advise-all 0.590) is a RELATIVE threshold (fails Rule 3's fraction-regardless-of-quality test) and its margin is computed on the selector's name output before arguments are written (Rule 1 ambiguity); advise-all removes both in one stroke. The margin stays logged in the Batch 4 audit row, labeled "gate input, pre-generation" if reported alongside AST deltas, never "confidence in the call" | 206 | `PILOT_AMENDMENT_206`, `assertAdviseAllArec()`, `advisoryArmSpec()` gated-variant refusal, `postPilotGatedComparisonArm()`, `assertPostPilotArmNotInPilot()`, `checkRelativeThresholdGate()`, `assertNoMedianMarginGateInPilot()` |
| Carried cautions, enforced: the Healy-gate ban is what keeps Rule 2 vacuous — any future pilot revision adding ANY sampled arm (Healy sampling arms, Slim-SC dedup arm) re-applies Rule 2 in full (within Batch 16 Class 1 equivalence clusters only, one representative per cluster; "prune duplicates" without the cluster definition attached is NOT compliance). No change to the disputed-hop tier order: this check adds no stage and removes none | 206 | `assertFuturePilotSampledArm()`, `assertHealyNotPilotArm()` in the composite, `assertTierOrderUnchanged206()` |
| NO live periodic critic stage on the resident tier: SWE-PRM (Gandhi et al., arXiv:2509.02360) is a prompted LLM critic every 5 steps over the last 8 transcript steps, NOT a trained scalar reward head — same-model critic scores at or below base on every variant (best taxonomy variant −1.2 pp, unguided −20.4 pp, 32B policy 8× the resident tier); frontier-critic gain (+10.6 pp) is key-dependent and forbidden as a live dependency; ~99.6% flag rate makes it a prompt, not a gate. A revisit needs a same-tier arm AND a flag-accuracy measurement | 208 | `assertNoLivePeriodicCriticStage208()`, `assertCriticRevisitPreregistration208()`, `SWE_PRM_208` |
| SWE-PRM taxonomy STOLEN as ledger labels, not as a model: 12 categories in three families (Specification / Reasoning / Coordination), mapped to existing ledger fields where Batch 208 maps them; TWO new ledger event types (step repetition = re-executing a completed action; termination unawareness = acting after the completion predicate fired); four categories UNMAPPED pending the Q9 audit, never silently mapped; per-category recovery actions NOT recorded (Batch 208 quotes the pairing, not the individual texts). A category that never fires on personal routines is a dead label and drops | 208 | `SWE_PRM_TAXONOMY_208`, `taxonomyCategory208()`, `newLedgerEventTypes208()`, `labelTrajectoryWindow208()`, `deadLabelCheck208()` |
| Offline critic placement + promotion rule: the taxonomy-guided pass runs in the sleep job over LOGGED completed trajectories (same cadence: 8-step window, every 5 hops), guidance appended and ignorable only — abort, discard, and prescription all refused (PRMDR prescription shortens runs but loses accuracy, 44.8% vs PRMD 50.6%). Labels become training data ONLY when outcome-corroborated; critic-labeled corrections earn their place ONLY by beating person-correction labels alone WITHIN routines, otherwise the pass stays diagnostic only | 208 | `checkOfflineCriticSpec208()`, `assertOfflineCriticNonDestructive208()`, `offlineCriticLabel208()`, `offlineCriticPromotion208()` |
| Citation discipline for SWE-PRM: the artifact is quoted as "periodic taxonomy-guided critic" only; +10.6 pp is an outcome gain under a frontier critic, never a gate AUROC (no per-window flag accuracy, no false-positive rate, no within-task decomposition reported); paper costs are July 2025 cloud prices, never local-machine costs | 208 | `assertCriticName208()`, `assertSwePrmOutcomeQuote208()` |
| SCORE in full CONFIRMS Batch 208 Decisions 1 and 3, changes neither: weak self-verifier F1 ~51–57 (LLaMA-2-13B 51.1, Gemma-7B 56.8) vs strong ~88–90 (GPT-4 88.4/89.5), self-verifier final-accuracy gain ~0 vs +4 to +8 strong / +9 to +19 oracle — the REFINER is capable (oracle ceiling +8.8 to +18.8 pp), the VERIFIER strands it. This is the Batches 2/3 teacher pattern a fifth time. NAME COLLISION: SCORE (Zhang et al., arXiv:2404.17140, Self-COrrection in REasoning) is NOT SCoRe (Lyu et al., ICML 2026, 72B teacher) — merging their claims throws | 211 | `SCORE_211`, `assertScoreIdentity211()`, `assertNoLivePeriodicCriticStage211()` |
| SCORE two-stage filter is the ONLY path by which an offline-critic flag becomes adapter training data: Stage 1 well-formed label (one of the 12 Batch 208 categories + logged window steps + evidence COPIED from the trajectory, matching Batch 208 ledger fields); Stage 2 outcome-corroborated (flagged window precedes a verified failure, OR applying the recovery action yields a verified success — verification is tool-result/person-acceptance, NOT a gold answer). Honest prior: 8.8–57.4% of raw critiques kept; a pipeline keeping ~99.6% of flags has skipped its filter and throws | 211 | `scoreFilterStage1_211()`, `scoreFilterStage2_211()`, `scoreFilterLabel211()`, `scoreFilterKeepRate211()` |
| FIRST-ERROR-ONLY labeling: the offline critic labels the FIRST error window per trajectory, not every flagged window (SCORE Table 3: 40.2 / oracle 49.5, beating every-step 39.6 / 46.4). The comparable rate across critics is the per-trajectory first-flag rate, not the per-invocation rate | 211 | `firstErrorLabel211()` |
| TWO-SIDED calibration reporting: every critic report MUST carry flag rate AND outcome-corroborated precision AND miss rate — a flag-rate-only report is uncalibrated by construction and throws. SCORE under-fires (LLaMA self 19.0% vs oracle 62.8%) while SWE-PRM over-fires (~99.6%): weak verification is miscalibrated in BOTH directions | 211 | `criticCalibration211()` |
| Promotion test AMENDED to THREE arms (Batch 208 Q10): (a) person-correction labels alone, (b) critic labels raw, (c) critic labels through the SCORE two-stage filter — measured WITHIN routines on the Batch 4 metric set, with two-sided calibration in all arms; Batch 4 rollback triggers (−2 valid@1 / −3 ExecRate / +20% p95) abort regardless of arm scores. The promotable arm is the FILTERED arm; the verdict is about label quality, not dataset size (weak-verifier data scaling is flat, SCORE §5.4) | 211 | `offlineCriticPromotion211()`, `checkOfflineCriticSpec211()` |
| DECOUPLING reporting rule for ALL future gate/critic work: Self-Correct := Verify + Refine, decoupled — any claim MUST report a verifier figure (F1 or AUROC) AND a refiner contribution, separately; a single "self-correction accuracy" is not citable and throws | 211 | `assertDecoupledCriticClaim211()` |
| Weak-verifier ensembling (oversample-then-rerank, k=10, temp 0.9: LLaMA 37.2 → 44.3, +8.8 with refinement) belongs in the SLEEP JOB ONLY — 4.5× latency vs the live pipeline's 1.3–1.4× base, never on the resident live path. Weaver (Saad-Falcon et al., arXiv:2506.18203) is an UNVERIFIED lead (abstract only), never evidence | 211 | `assertEnsemblePlacement211()`, `weaverLead211()` |
| Weaver in full CLOSES the Batch 211 lead with a qualification that changes the design: Weaver generalizes SCORE's ensemble gain BY SUBSTITUTION (33 diverse external RMs/judges + label-free weak-supervision weights), NOT by rescuing same-model self-verification — a same-model ensemble inherits the violated conditional-independence assumption, not Table 1's numbers (87.7 avg vs majority 72.2, Pass@1 68.4, oracle Pass@100 91.9). Ensemble members MUST be heterogeneous signals; diversity, not count, is the resource | 212 | `WEAVER_212`, `assertWeaverSubstitution212()`, `assertEnsembleHeterogeneous212()` |
| NEW STAGE 0 for the offline-critic filter (proposal, not a tested result): BEFORE SCORE's two stages — normalize with ROBUST PERCENTILES (5th→0, 95th→1, never min-max merged into the same rule), binarize from the person's own ~5–25 outcome-labeled routines (Table 4: naive 0.5 averages 79.0, 1% dev 84.5, 5% dev 87.5 = 20%/100%), drop extreme-marginal verifiers by the paper's band rule (balance 20–80% → drop outside 20–80%; balance <20% → drop >80% positives; balance >80% → drop <20% positives). Weaver's posterior is a SOFT label only — SCORE's outcome test remains the hard gate | 212 | `weaverStage0_212()` |
| MECHANICAL DROP RULE: a critic whose flag rate falls outside 20–80% while routine success balance sits in 20–80% is DROPPED mechanically — SWE-PRM's 99.6% flagger fails outright. Table 5 anchor: extreme-marginals dropped 85.2 vs no-drop 79.4 (+5.8 points — never the paper text's 12.5% claim). Boundary judgment: within 2 points of a band edge is down-weighted, decided by its estimated weight, not hard-dropped alone (SCORE's 19.0% under-firer sits at the boundary) | 212 | `weaverMechanicalDrop212()`, `assertWeaverQuote212()` |
| DISTILLED-VERIFIER PLACEMENT: a 400M-class cross-encoder trained on Weaver pseudolabels per routine cluster is SLEEP-JOB ONLY (per-routine, task-specific, never general) — any live-path placement throws in this round, including live-advisory. NUANCE RECORDED, NOT ADOPTED: Batch 212's own text allows live-path advisory score with separate F1 reporting under Batch 211's decoupling rule; this round enforces the stricter brief rule pending parent reconciliation | 212 | `assertDistilledVerifierPlacement212()` |
| DIFFICULTY CLUSTERING: cluster routines by OBSERVED tool-verified success rate (never gold correctness / oracle difficulty) and fit per-cluster thresholds — but TEST per-cluster vs global on the pilot, do not assume clusters help (Weaver 70B: clustering alone HURTS, 85.8 → 79.3; 8B: helps, 70.0 → 74.8) | 212 | `weaverDifficultyClustering212()` |
| Promotion test gains a WEAVER STAGE-0 ARM (Batch 212 amendment to Batch 211 Q10): weighted + dropped ensemble vs raw critic flags, BEFORE the SCORE filter, within routines, Batch 4 rollback triggers abort regardless — a stage-0 win prioritizes, it does not promote by itself (only SCORE-outcome-passing flags become training data) | 212 | `weaverPromotionArm212()`, `weaverStatus212()`, `checkOfflineCriticSpec212()` |

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
- **Round-13 Weaver stage-0 spec + mechanical drop + distilled sleep-job placement are a spec, NOT executed (Batch 212).**
  No verifier, ensemble, or distilled model was run; no label was applied to a personal trajectory; no promotion test was run. All Weaver numbers are the paper's on math/reasoning benchmarks with 7B–72B verifiers and gold answers for evaluation, not personal tool tasks; no 4B Weaver result exists (8B is the smallest scale evidenced, and its verifiers are external models, not the generator itself). The personal-task substitutions are all proposals, untested anywhere in this paper or this log: outcome-labeled routines as the dev set, heterogeneous critic signals as the verifier set, tool-verified success rate as the difficulty proxy, Weaver posterior + SCORE outcome test as a stacked filter. Weaver's conditional-independence assumption is unmeasured for the north-star critic set — pairwise-agreement / precision-matrix decorrelation must be measured on the pilot's actual critic signals before weights are trusted. Two design judgments in this round are NOT the paper's: the ±2-point boundary band for weight-plus-drop (the paper gives the 20–80% band, not a boundary tolerance), and the stricter distilled-verifier rule (sleep-job only, including live-advisory) — Batch 212's own text allows a live-path advisory score with separate F1 reporting, recorded here, not silently adopted, pending parent reconciliation. Weaver is CLOSED by this batch; the next lead must be named by a future batch. The Q9 taxonomy-to-ledger mapping audit is still owed; Q10 is amended with a stage-0 arm by this round, not executed. The Batch 205 fork-base wording flag was NOT resolved or cited here; the OATR re-run (due after 2026-11-04T03:08:00.089Z) was NOT run here.
- **Round-12 SCORE filter + calibration + three-arm promotion are a spec, NOT executed (Batch 211).**
  No critic, verifier, or refiner was run; no taxonomy label was applied to a personal trajectory; no promotion test was run. All SCORE numbers are the paper's on math/commonsense reasoning with gold answers, not personal tool tasks. The person-correction-as-hint substitution (the load-bearing north-star adaptation of SCORE's hint step) is untested anywhere in this paper or this log — the hint's quality (person-correct vs gold-correct) is unmeasured. Its models are 7B/13B, not the 4B resident tier; no 4B weak-verifier F1 exists in this paper. One refinement iteration only, greedy decoding; the verifier threshold is tuned on a dev set with gold labels (the personal analogue, per Batch 5's re-fit rule, is a proposal, not a tested transfer). Whether the ~99.6% flag rate is a prompt artifact or a true base rate is still unmeasured. Weaver (arXiv:2506.18203) was NOT read in full — abstract only, carried as a lead. The Q9 taxonomy-to-ledger mapping audit is still owed; Q10 is amended to three arms by this round, not executed. The Batch 205 fork-base wording flag was NOT resolved or cited here; the OATR re-run (due after 2026-11-04T03:08:00.089Z) was NOT run here.
- **Round-11 taxonomy labels + offline critic spec are a spec, NOT executed (Batch 208).**
  No critic was run, no taxonomy label was applied to a personal
  trajectory, and the 4B same-tier harm prediction is an extrapolation
  from 32B same-model results, not a 4B measurement — the 4B tier
  could be worse (weaker self-critique) or more legible, and no 4B
  critic data exists in this paper to decide. Whether the ~99.6% flag
  rate is a prompt artifact or a true base rate is unmeasured and
  matters for the offline calibration pass. SCORE (weak-self-verifier
  failure) is still unread in full; the Q9 taxonomy-to-ledger mapping
  audit and the Q10 promotion test design are owed, not done here.
  The Batch 205 fork-base wording flag was NOT resolved or cited here.
- **Round-10 compliance check + amendment is a spec, NOT executed (Batch 206).**
  No task was run, no hint was tested, no AST number exists here for
  personal tasks — the four-rule PASS and the advise-all amendment are
  a pre-registration change, not a result. Whether advise-all actually
  beats gated on the resident 4B base is itself an empirical question
  the amended pilot does NOT answer (its A-rec arm has no gated arm to
  compare against); a gated-vs-advise-all comparison, if wanted, is a
  post-pilot arm. The Batch 205 fork-base wording flag was NOT resolved
  or cited here. The disputed-hop tier order is unchanged by this
  check (five stages, none added, none removed).
- **Round-9 gate-spec pruning rules are a spec, NOT executed (Batch 204).**
  No SR or Slim-SC run was executed, no paper code was cloned or run —
  every SR/Slim-SC figure is the paper's on its models/tasks (SR:
  Llama-3-8B + RM-Mistral-7B on AlpacaFarm, H100 DGX; Slim-SC:
  14B/32B reasoning models on GPQA/AIME/AQuA-RAT), NOT on the
  north-star's 4B GGUF or personal tool routines. Sun's Appendix B
  partial–final correlation coefficients were not tabulated from the
  main text and are cited qualitatively, not numerically; Slim-SC's
  0.3% embedding-overhead figure is the paper's estimate from a
  separate-GPU setup, not a resident-machine measurement (moot for
  tool calls, since the north-star dedup needs no embedder). The
  parked free-chat SR-logprob test shape is a note only — it is not
  built as a live path and must never run on tool hops. Neither paper
  reopens the multi-sample live gate anywhere in this module.
- **Round-8 slotting correction is a spec, NOT executed (Batch 201).**
  No Healy classifier was trained, no gap was computed, no Healy
  feature was extracted — every Healy figure is the paper's on Glaive
  calculator-style tasks (five domains, single-call, canonicalizable
  arguments), NOT on the north-star tool pool or the bundled base.
  Whether Healy beats, duplicates, or complements the Wu gap /
  logprob margin on the SAME hops is unmeasured (different
  benchmarks, different label definitions: Healy's agreement label
  includes argument errors, Wu's gap AUROC is selection-error only).
  Healy's intervention policy, its threshold τ, its personal-data
  scale behavior, and its near-synonym performance are all
  unmeasured. The abstract/Table 1 numbers must never be quoted as
  hallucination-class performance; the Eq. (1) dimension and
  split-size inconsistencies are carried as caveats, not resolved.
  ASA's re-check is from the arXiv abstract page (still withdrawn,
  no PDF), and the Wu §1-only citation correction rests on the Wu
  v3 HTML read in Batch 201.
- **Round-7 disentanglement is a spec, NOT executed (Batch 199).**
  No tool vector was built, no steering was run, no cosine gap was
  computed — every Wu/ASA figure is the paper's on its benchmarks
  (synthetic 15-tool, τ-bench, ToolBench, BFCL, MTU-Bench), not on the
  north-star tool pool or the bundled base. The near-synonym exclusion
  takes a caller-supplied parallelism verdict because Batch 199 sets no
  parallelism threshold (an open question, not a guessed constant), and
  the capture bound is claimed only for 1 and 5 layers (6,553 / 1,310).
  ASA's withdrawal reason is quoted from arXiv comments via a search
  result, not from a v4 PDF (unavailable for the withdrawn version);
  ASA numbers here carry the quarantine label only. Wu's gap threshold,
  within-routine AUROC, and multi-turn injection behavior are all
  unmeasured; the multi-turn override result (N=20, n.s.) neither proves
  benefit nor harm. Whether the Wu gap and SEP-TBG probe share a capture
  layer is a prototype question, not answered here.
- **Round-6 harness is pre-registered, NOT executed (Batch 197).**
  No task was run, no hint was tested, no AST number exists here for
  personal tasks — the three-arm design, tier ceilings, pairing
  controls, and multi-turn verdict rule are a spec plus guard code,
  not results. The 100/300-task power ceilings are design judgments
  from McNemar's discordant-only structure, not computed power
  analyses for a specific base/task set; a real power calculation
  needs the pilot's observed discordant rate. BFCL AST details and
  τ-bench framing are secondary/abstract-level sources, not the
  official eval code or the τ-bench paper in full. Execution order
  is fixed by the batch: pilot first (100 tasks, three arms, frozen
  gold), M1/M2 only after the pilot passes its abort rules, never M2
  before the pilot, never wording-sensitivity arms merged into the
  pilot.
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
  at Batch 192 time — they WERE read in full in Batch 204 and are
  cited and built on in the round-9 section above (gate closure +
  four-rule sampled-step constraints), not in the prefix tier itself.
  Chen
  (arXiv:2606.16364) WAS read in full in Batch 194 and is built on in
  the round-5 section above (main text only — appendix tables were
  not re-read, so no appendix-only number is quoted). Default value
  normalization is casefold + sorted
  keys only; full Batch 10 per-argument rules (number tolerance, date
  parse, enum alias, defaults, ignored args) are caller-supplied via
  `normalizeFn`, not claimed by the default.
