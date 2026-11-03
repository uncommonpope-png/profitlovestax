'use strict';
// Tests for plan-executor.cjs. Run: node plan-executor.test.cjs (exit 0 on pass).
// Uses only node:assert / node:test. No model, tool, or network use:
// task functions are caller-supplied stubs.
const test = require('node:test');
const assert = require('node:assert');
const {
  percentile,
  computeLevels,
  modalSelect,
  MODAL_SELECTION_GUARDRAIL,
  ToolLatencyTracker,
  earlyExitWins,
  PlanExecutor,
  MODE_SHARE_DRIFT_THRESHOLD,
  modeLabelAtDispatch,
  postHocModeLabel,
  bimodalityByDispatchInput,
  bimodalityByPooledRatio,
  AbortAudit,
  abortAuditRescueAvailable,
  PARTIAL_UNKNOWN,
  PREFIX_CHECKPOINTS,
  PREFIX_PRUNE_GUARDRAIL,
  parsePartialToolCall,
  prefixClusterKey,
  canonicalToolCallJson,
  checkpointPrefix,
  candidatesAtCheckpoint,
  prefixPrune,
  proxyTokens,
  falsifierReplay,
  SELECT_ADVISORY_ONLY_GUARDRAIL,
  EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT,
  CHEN_194_FINDINGS,
  advisoryHint,
  assertAdvisoryOnlySelect,
  selectAdvisory,
  assertSingleHopScope,
  selectorServingPath,
  chooseDisputedHopTier,
  wrongToolBudgetAllows,
  ADVISORY_TEST_ARMS,
  ADVISORY_HINT_TEMPLATE,
  advisoryHintText,
  assertVerbatimHint,
  RECOMMENDATION_SOURCES,
  assertRecommendationSource,
  advisoryArmSpec,
  SAMPLE_TIERS,
  tierForN,
  checkClaim,
  mcnemarReport,
  scoreCall,
  scoreArm,
  scoreArms,
  assertTaskSet,
  assertPairingControls,
  abortCheck,
  assertPilotPassed,
  assertMultiTurnOrder,
  assertMultiTurnGate,
  multiTurnVerdict,
} = require('./plan-executor.cjs');

const read = (id, dependsOn, run) => ({ id, dependsOn, kind: 'read', readOnly: true, run: run || (async () => `${id}-done`) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------ DAG levels

test('level computation on a sample DAG: levels are longest-path depth', () => {
  const { levels, levelOf } = computeLevels([
    { id: 'a', dependsOn: [] },
    { id: 'b', dependsOn: ['a'] },
    { id: 'c', dependsOn: ['a'] },
    { id: 'd', dependsOn: ['b', 'c'] },
    { id: 'e', dependsOn: ['a'] },
    { id: 'f', dependsOn: ['d', 'e'] },
  ]);
  assert.deepEqual(levels, [['a'], ['b', 'c', 'e'], ['d'], ['f']]);
  assert.equal(levelOf.d, 2); // d waits for the longer path, not just one hop
  assert.equal(levelOf.f, 3);
});

test('level computation rejects cycles and unknown dependencies', () => {
  assert.throws(() => computeLevels([{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]), /cycle/);
  assert.throws(() => computeLevels([{ id: 'a', dependsOn: ['ghost'] }]), /unknown/);
  assert.throws(() => computeLevels([{ id: 'a' }, { id: 'a' }]), /duplicate/);
});

// ------------------------------------------------------- prefix accumulation

test('prefix accumulation carries only completed levels', async () => {
  const seen = {};
  const ex = new PlanExecutor([
    read('a', [], async (ctx) => { seen.a = ctx.prefix.length; return 'A'; }),
    read('b', ['a'], async (ctx) => { seen.b = ctx.prefix.length; seen.bObs = ctx.prefix[0].observations.a.value; return 'B'; }),
    read('c', ['b'], async (ctx) => { seen.c = ctx.prefix.length; return 'C'; }),
  ]);
  const out = await ex.run();
  assert.equal(out.status, 'completed');
  assert.equal(seen.a, 0); // first level sees an empty prefix
  assert.equal(seen.b, 1); // second level sees only the completed first level
  assert.equal(seen.bObs, 'A');
  assert.equal(seen.c, 2);
  assert.equal(out.prefix.length, 3);
  // No partial mid-level state ever entered the prefix: each prefix level
  // holds the whole level's joint observation.
  assert.deepEqual(Object.keys(out.prefix[0].observations), ['a']);
});

// ------------------------------------------------------------- replan rules

test('mid-level replan is refused explicitly and changes nothing', async () => {
  const ex = new PlanExecutor([
    read('slow', [], async () => { await sleep(60); return 'slow-done'; }),
    read('next', ['slow'], async () => 'next-done'),
  ]);
  const runP = ex.run();
  await sleep(10); // level 0 still in flight
  assert.equal(ex.isMidLevel, true);
  const refusal = ex.requestReplan();
  assert.equal(refusal.allowed, false);
  assert.match(refusal.reason, /mid-level replan refused/);
  const out = await runP;
  assert.equal(out.status, 'completed');
  assert.deepEqual(out.completedTaskIds, ['slow', 'next']);
  assert.equal(out.traces.filter((t) => t.kind === 'replan').length, 0);
  assert.equal(out.refusals.filter((r) => r.kind === 'mid-level-replan').length, 1);
});

test('boundary replan is allowed on a completed joint observation', async () => {
  const ran = [];
  const ex = new PlanExecutor([
    read('a', [], async () => { ran.push('a'); return 'A'; }),
    read('old', ['a'], async () => { ran.push('old'); return 'OLD'; }),
  ], {
    onLevelBoundary: async ({ levelIndex, jointObservation }) => {
      if (levelIndex === 0) {
        assert.equal(jointObservation.observations.a.value, 'A');
        return { replan: [read('new', [], async () => { ran.push('new'); return 'NEW'; })] };
      }
      return null;
    },
  });
  const out = await ex.run();
  assert.deepEqual(ran, ['a', 'new']); // old remainder replaced, never ran
  assert.equal(out.traces.filter((t) => t.kind === 'replan').length, 1);
  assert.equal(out.prefix.length, 2); // completed level 0 + replanned level
});

test('boundary replan without committedState is refused after a commit; with it, allowed', async () => {
  const mk = (withState) => new PlanExecutor([
    { id: 'c', dependsOn: [], kind: 'commit', run: async () => 'COMMITTED' },
    read('old', ['c'], async () => 'OLD'),
  ], {
    onLevelBoundary: async ({ levelIndex }) => {
      if (levelIndex === 0) {
        return withState
          ? { replan: [read('new', [], async () => 'NEW')], committedState: { c: 'COMMITTED' } }
          : { replan: [read('new', [], async () => 'NEW')] };
      }
      return null;
    },
  });
  const refused = await mk(false).run();
  assert.deepEqual(refused.completedTaskIds, ['c', 'old']); // old plan continued
  assert.equal(refused.refusals.filter((r) => r.kind === 'replan-precondition').length, 1);
  assert.deepEqual(refused.committedEffects, ['c']);
  const allowed = await mk(true).run();
  assert.deepEqual(allowed.completedTaskIds, ['c', 'new']);
  assert.equal(allowed.traces.filter((t) => t.kind === 'replan').length, 1);
});

test('abort halts without replanning and produces no prefix update for the incomplete level', async () => {
  const ran = [];
  const ex = new PlanExecutor([
    read('a', [], async (ctx) => { ctx.executor.abort('person intervention'); ran.push('a'); return 'A'; }),
    read('b', ['a'], async () => { ran.push('b'); return 'B'; }),
  ]);
  const out = await ex.run();
  assert.equal(out.status, 'aborted');
  assert.equal(out.abortReason, 'person intervention');
  assert.deepEqual(ran, ['a']); // level 1 never ran
  assert.equal(out.prefix.length, 0); // aborted level contributed nothing
  assert.equal(out.traces.filter((t) => t.kind === 'abort').length, 1);
  assert.equal(out.traces.filter((t) => t.kind === 'replan').length, 0);
});

// -------------------------------------------------------------- RULE 6

test('RULE 6 read-only early-exit does not replan and adds no prefix update', async () => {
  const ex = new PlanExecutor([
    read('r1', [], async () => ({ value: 'invalidating-read', planInvalidating: true, earlyExit: true })),
    read('r2', [], async () => 'r2-done'),
    read('down', ['r1'], async () => 'down-done'),
  ]);
  const out = await ex.run();
  assert.equal(out.status, 'completed');
  assert.equal(out.prefix.length, 0); // incomplete level: no prefix update
  assert.equal(out.audit[0].traceKind, 'early-exit');
  assert.equal(out.traces.filter((t) => t.kind === 'early-exit').length, 1);
  assert.equal(out.traces.filter((t) => t.kind === 'replan').length, 0);
  assert.ok(out.droppedTaskIds.includes('down')); // dependent dropped, no replan kept it
});

test('RULE 6 early-exit refused when the level contains a commit; level completes instead', async () => {
  const ex = new PlanExecutor([
    read('r1', [], async () => ({ value: 'x', earlyExit: true })),
    { id: 'c', dependsOn: [], kind: 'commit', run: async () => 'COMMITTED' },
  ]);
  const out = await ex.run();
  assert.equal(out.prefix.length, 1); // level completed under Rule 2
  assert.equal(out.audit[0].traceKind, 'completed');
  assert.equal(out.refusals.filter((r) => r.kind === 'early-exit-gate').length, 1);
  assert.equal(out.traces.filter((t) => t.kind === 'early-exit').length, 0);
});

// ------------------------------------------------------------- hedging

function trackerWith(n, ms) {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < n; i++) t.observe(ms);
  return t;
}

test('hedging disabled below 100 observations, enabled at 100, stable flag at 400', () => {
  const t = trackerWith(99, 100);
  assert.equal(t.shouldHedge({ kind: 'read', paths: 2 }).hedge, false);
  assert.equal(t.hedgingEnabled, false);
  t.observe(100);
  assert.equal(t.hedgingEnabled, true);
  assert.equal(t.provisional, true);
  assert.equal(t.stable, false);
  const d = t.shouldHedge({ kind: 'read', paths: 2 });
  assert.equal(d.hedge, true);
  assert.equal(d.triggerMs, 100);
  assert.equal(d.provisional, true);
  for (let i = 0; i < 300; i++) t.observe(100);
  assert.equal(t.n, 400);
  assert.equal(t.stable, true);
  assert.equal(t.shouldHedge({ kind: 'read', paths: 2 }).stable, true);
});

test('breaker does not trip on a self-normalizing baseline: baseline is frozen', () => {
  const t = trackerWith(100, 100);
  assert.equal(t.frozenP95, 100);
  // Tool degrades 5x, but the frozen baseline must not move.
  for (let i = 0; i < 100; i++) t.observe(500);
  assert.equal(t.frozenP95, 100); // frozen until recalibration
  assert.equal(t.breakerActive, true); // 100% of window calls exceed frozen p95
  assert.equal(t.shouldHedge({ kind: 'read', paths: 2 }).hedge, false);
});

test('breaker does not trip below a 100-call window', () => {
  const t = trackerWith(100, 100);
  for (let i = 0; i < 50; i++) t.observe(500); // all exceed, but window < 100
  assert.equal(t.breakerActive, false);
  assert.equal(t.shouldHedge({ kind: 'read', paths: 2 }).hedge, true);
});

test('hedging refused for writes/commits and for single-path reads', () => {
  const t = trackerWith(100, 100);
  assert.equal(t.shouldHedge({ kind: 'write', paths: 2 }).hedge, false);
  assert.match(t.shouldHedge({ kind: 'write', paths: 2 }).reason, /never-hedge-commits/);
  assert.equal(t.shouldHedge({ kind: 'commit', paths: 2 }).hedge, false);
  assert.equal(t.shouldHedge({ kind: 'read', paths: 1 }).hedge, false);
  assert.match(t.shouldHedge({ kind: 'read', paths: 1 }).reason, /stuck-call/);
  assert.equal(t.shouldHedge({ kind: 'read' }).hedge, false); // paths undeclared = not multi-path
});

// ------------------------------------------------------- stuck-call rescue

test('stuck rescue refused when any gate fails; allowed only as abort-and-restart', () => {
  const t = trackerWith(100, 100);
  const base = { readOnly: true, idempotent: true, progressMade: false, abortAvailable: true, abortProven: true, attemptsUsed: 0, remainingBudgetMs: 1000 };
  const ok = t.evaluateStuckRescue(base);
  assert.equal(ok.rescue, true);
  assert.equal(ok.mode, 'abort-and-restart'); // never a parallel duplicate
  assert.equal(ok.thresholdMs, 200); // 2x frozen p95
  assert.equal(t.evaluateStuckRescue({ ...base, idempotent: false }).rescue, false); // non-idempotent
  assert.equal(t.evaluateStuckRescue({ ...base, readOnly: false }).rescue, false);
  assert.equal(t.evaluateStuckRescue({ ...base, progressMade: true }).rescue, false); // progress already made
  assert.equal(t.evaluateStuckRescue({ ...base, abortAvailable: false }).rescue, false); // no true abort
  assert.equal(t.evaluateStuckRescue({ ...base, abortProven: false }).rescue, false); // unproven abort counts as unavailable
  assert.equal(t.evaluateStuckRescue({ ...base, attemptsUsed: 1 }).rescue, false); // single re-issue only
  assert.equal(t.evaluateStuckRescue({ ...base, remainingBudgetMs: 150 }).rescue, false); // budget below 2x p95
});

test('stuck threshold uses p99 when the frozen set has n >= 1000', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 985; i++) t.observe(130);
  for (let i = 0; i < 15; i++) t.observe(5000);
  t.freezeBaseline(); // frozen set now 1000: p95 130, p99 5000
  assert.equal(t.frozenN, 1000);
  assert.equal(t.frozenP95, 130);
  assert.equal(t.frozenP99, 5000);
  assert.equal(t.stuckThresholdMs(), 5000); // max(2x130, 5000)
});

test('rescue-rate trip above 2% moves the threshold to 3x p95', () => {
  const t = trackerWith(100, 100);
  for (let i = 0; i < 100; i++) t.observe(100); // 100-call window
  assert.equal(t.stuckThresholdMs(), 200);
  t.recordRescue();
  t.recordRescue();
  assert.equal(t.stuckMultiplier, 2); // 2% is not above 2%
  const r = t.recordRescue();
  assert.equal(r.tripped, true);
  assert.equal(t.stuckMultiplier, 3);
  assert.equal(t.stuckThresholdMs(), 300);
  assert.equal(t.degradingLog.filter((e) => e.kind === 'rescue-rate-trip').length, 1);
});

// ---------------------------------------------------------- recalibration

test('recalibration refuses with fewer than 100 new calls', () => {
  const t = trackerWith(100, 100);
  const r = t.weeklyRecalibrationCheck(new Array(50).fill(70));
  assert.equal(r.refrozen, false);
  assert.match(r.reason, /fewer than 100/);
  assert.equal(t.frozenP95, 100);
});

test('recalibration refuses upward re-freeze while the breaker is tripped', () => {
  const t = trackerWith(100, 100);
  for (let i = 0; i < 100; i++) t.observe(500); // breaker trips vs frozen 100
  assert.equal(t.breakerActive, true);
  const r = t.weeklyRecalibrationCheck(new Array(100).fill(500), { cusumAlarm: true });
  assert.equal(r.refrozen, false);
  assert.match(r.reason, /refused while the breaker is tripped/);
  assert.equal(t.frozenP95, 100);
});

test('recalibration re-freezes downward only after drift holds 2 windows (or CUSUM)', () => {
  const t = trackerWith(100, 100);
  const first = t.weeklyRecalibrationCheck(new Array(100).fill(70));
  assert.equal(first.refrozen, false); // drift 30% but only 1 of 2 windows
  assert.match(first.reason, /1 of 2/);
  const second = t.weeklyRecalibrationCheck(new Array(100).fill(70));
  assert.equal(second.refrozen, true);
  assert.equal(second.direction, 'downward');
  assert.equal(t.frozenP95, 70);
  // CUSUM path: a single window with an alarm also satisfies persistence.
  const t2 = trackerWith(100, 100);
  const viaCusum = t2.weeklyRecalibrationCheck(new Array(100).fill(70), { cusumAlarm: true });
  assert.equal(viaCusum.refrozen, true);
  // Within-20% drift never re-freezes, even with an alarm (magnitude required).
  const t3 = trackerWith(100, 100);
  assert.equal(t3.weeklyRecalibrationCheck(new Array(100).fill(110), { cusumAlarm: true }).refrozen, false);
});

test('upward re-freeze is allowed when the breaker is not tripped', () => {
  const t = trackerWith(100, 100);
  t.weeklyRecalibrationCheck(new Array(100).fill(130));
  const r = t.weeklyRecalibrationCheck(new Array(100).fill(130));
  assert.equal(r.refrozen, true);
  assert.equal(r.direction, 'upward');
  assert.equal(t.frozenP95, 130);
  assert.equal(t.breakerWindowCalls, 0); // re-freeze resets the breaker window
});

// ------------------------------------------------------- audit + win stat

test('audit records the four Batch 173 fields and the win statistic compares correctly', async () => {
  const ex = new PlanExecutor([
    read('inv', [], async () => { await sleep(5); return { value: 'bad', planInvalidating: true }; }),
    read('slow', [], async () => { await sleep(30); return 'slow-done'; }),
  ]);
  const out = await ex.run();
  const a = out.audit[0];
  assert.equal(a.traceKind, 'completed');
  assert.ok(a.siblingStarts.inv !== undefined && a.siblingFinishes.slow !== undefined); // (a) per-sibling timestamps
  assert.equal(a.invalidatorId, 'inv'); // (b) invalidator identity + time
  assert.ok(typeof a.tInvMs === 'number');
  assert.ok(typeof a.levelCompletionMs === 'number'); // (c) level completion -> wait
  assert.ok(a.waitMs >= 0 && a.waitFraction >= 0 && a.waitFraction <= 1);
  assert.equal(a.plannerCallMs, null); // (d) no boundary replan, so no planner call
  assert.equal(earlyExitWins(500, 200, 100), true); // wait beats planner + re-issue
  assert.equal(earlyExitWins(150, 200, 100), false); // waiting wins, Rule 2 stands
  assert.equal(percentile([10, 20, 30, 40], 95), 40);
});

// ---------------------------------------------------------- modal select

// ------------------------------------------------------- Batch 179: per-mode T_stuck

function modeTrackerWith(label, n, ms) {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < n; i++) t.observeMode(label, ms);
  return t;
}

test('Batch 179: per-mode T_stuck uses each mode\'s own p95/p99 and n floors', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 985; i++) t.observeMode('fast', 50);
  for (let i = 0; i < 15; i++) t.observeMode('fast', 5000);
  t.freezeModeBaseline('fast'); // explicit freeze captures the full 1000-sample set (auto-freeze at 100 would hold only the first 100)
  assert.equal(t.stuckThresholdMsForMode('fast'), 5000); // n=1000: max(2x50, p99 5000)
  const t2 = modeTrackerWith('slow', 800, 5000);
  t2.freezeModeBaseline('slow');
  assert.equal(t2.stuckThresholdMsForMode('slow'), 10000); // 100<=n<1000: 2x p95 only
  assert.equal(t2.modeBaselineTuple('slow').label, 'slow');
  assert.equal(t2.modeBaselineTuple('slow').frozenN, 800);
});

test('Batch 179: per-mode n floor — n_mode < 100 has no T_stuck; 800 vs 40 asymmetry is correct', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 800; i++) t.observeMode('cached', 50);
  for (let i = 0; i < 40; i++) t.observeMode('uncached', 5000);
  t.freezeModeBaseline('cached'); // full 800-sample set; uncached stays unfrozen at n=40
  assert.equal(t.stuckThresholdMsForMode('cached'), 100);
  assert.equal(t.stuckThresholdMsForMode('uncached'), null); // waits, does not rescue
  const cachedRescue = t.evaluateStuckRescueForMode('cached', { readOnly: true, idempotent: true, progressMade: false, abortAvailable: true, abortProven: true, attemptsUsed: 0, remainingBudgetMs: 1000 });
  assert.equal(cachedRescue.rescue, true);
  assert.equal(cachedRescue.thresholdMs, 100);
  assert.equal(t.evaluateStuckRescueForMode('uncached', { readOnly: true, idempotent: true, progressMade: false, abortAvailable: true, abortProven: true }).rescue, false);
});

test('Batch 179: circular-label ban — post-hoc mode classification is refused, never silently accepted', () => {
  const t = new ToolLatencyTracker('tool');
  assert.throws(() => t.observeMode('slow', 1500, { afterCompletion: true }), /circular-label ban/);
  assert.throws(() => t.observeMode('slow', 1500, { dispatchObservable: false }), /circular-label ban/);
  assert.throws(() => postHocModeLabel(), /circular-label ban/);
  // Dispatch-observable labelling works: cache key present/absent at dispatch.
  const label = modeLabelAtDispatch({ cacheKey: null }, (inputs) => (inputs.cacheKey ? 'hit' : 'miss'));
  assert.equal(label, 'miss');
  t.observeMode(label, 5000);
  assert.equal(t.modes.get('miss').observations.length, 1);
});

test('Batch 179: unobservable-mode tool keeps one pooled baseline biased toward fewer rescues', () => {
  const t = new ToolLatencyTracker('tool', { unobservableModes: true });
  for (let i = 0; i < 985; i++) t.observe(50);
  for (let i = 0; i < 15; i++) t.observe(5000);
  t.freezeBaseline();
  // Pooled form: max(2 x pooled p95, pooled p99) even though the pooled
  // p99 here rests on the slow tail — the bias is toward fewer rescues.
  assert.equal(t.pooledStuckThresholdForUnobservableModes(), 5000);
  assert.equal(t.stuckThresholdMs(), 5000); // pooled Batch 177 form agrees at n=1000
  // Rescue-rate trip on an unobservable tool: investigation, NOT a 3x raise.
  for (let i = 0; i < 100; i++) t.observe(50);
  t.recordRescue(); t.recordRescue();
  const r = t.recordRescue();
  assert.equal(r.action, 'mode-split-investigation');
  assert.equal(t.stuckMultiplier, 2); // never blindly raised to 3x pooled p95
  assert.equal(t.degradingLog.filter((e) => e.kind === 'mode-split-investigation').length, 1);
  assert.equal(t.unobservableRescueRateResponse().action, 'mode-split-investigation');
});

test('Batch 179: mode-share shift >20% is a drift signal on its own and never re-freezes the pooled baseline', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 90; i++) t.observeMode('hit', 50);
  for (let i = 0; i < 10; i++) t.observeMode('hit', 50); // hit reaches 100, auto-freezes
  for (let i = 0; i < 100; i++) t.observeMode('miss', 5000);
  t.freezeAllModeBaselines();
  const hitShare = t.modeBaselineTuple('hit').frozenShare; // 0.5
  assert.equal(hitShare, 0.5);
  assert.equal(MODE_SHARE_DRIFT_THRESHOLD, 0.20);
  // Neither mode's p95 moved; only the share moved (hit 0.5 -> 0.2).
  const before = t.frozenP95; // pooled baseline untouched by mode freezes (null here)
  const r = t.checkModeShareDrift({ hit: 0.2, miss: 0.8 });
  assert.equal(r.refrozen, false);
  assert.equal(r.driftSignals.length, 2); // both modes shifted 30 points
  assert.equal(r.driftSignals[0].kind, 'mode-share-drift');
  assert.equal(t.modeShareDriftLog.length, 2);
  assert.equal(t.frozenP95, before); // sleep job logged, did not absorb the shift
  // Within-20% shift is not a signal.
  assert.equal(t.checkModeShareDrift({ hit: 0.45, miss: 0.55 }).driftSignals.length, 0);
});

test('Batch 179: frozen baseline tuple gains mode label + mode share', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 100; i++) t.observeMode('hit', 10);
  for (let i = 0; i < 100; i++) t.observeMode('miss', 1000);
  t.freezeAllModeBaselines(); // shares recomputed on one denominator (100/200 each)
  const tuple = t.frozenBaselineTuple();
  assert.equal(tuple.modes.length, 2);
  const hit = tuple.modes.find((m) => m.label === 'hit');
  assert.equal(hit.frozenP95, 10);
  assert.equal(hit.frozenShare, 0.5);
  assert.equal(tuple.modes.find((m) => m.label === 'miss').frozenP95, 1000);
});

// ------------------------------------------------------- Batch 179: bimodality detectors

test('Batch 179: bimodality detector (a) — dispatch input separating clusters by >=10x median triggers a split investigation', () => {
  const samples = [];
  for (let i = 0; i < 20; i++) samples.push({ latencyMs: 50, dispatchValue: 'hit' });
  for (let i = 0; i < 20; i++) samples.push({ latencyMs: 5000, dispatchValue: 'miss' });
  const d = bimodalityByDispatchInput(samples);
  assert.equal(d.trigger, true);
  assert.equal(d.medianRatio, 100);
  assert.match(d.reason, /mode-split investigation/);
  // Same-median clusters do not trigger.
  const flat = [];
  for (let i = 0; i < 20; i++) flat.push({ latencyMs: 50, dispatchValue: 'a' });
  for (let i = 0; i < 20; i++) flat.push({ latencyMs: 60, dispatchValue: 'b' });
  assert.equal(bimodalityByDispatchInput(flat).trigger, false);
});

test('Batch 179: bimodality detector (b) — pooled p95/p50 >10x with a visible gap triggers; neither alone suffices', () => {
  const latencies = [];
  for (let i = 0; i < 90; i++) latencies.push(50);
  for (let i = 0; i < 10; i++) latencies.push(5000);
  const d = bimodalityByPooledRatio(latencies);
  assert.equal(d.trigger, true);
  assert.ok(d.ratio > 10);
  assert.ok(d.maxGapRatio >= 2);
  // A smooth tail (no visible gap, ratio below 10x) does not trigger.
  const smooth = [];
  for (let i = 0; i < 100; i++) smooth.push(50 + i * 5); // 50..545
  const s = bimodalityByPooledRatio(smooth);
  assert.equal(s.trigger, false); // consecutive-value gap ratio here is < 2x throughout
  // Ratio at/below 10x does not trigger even with a gap.
  const mild = [];
  for (let i = 0; i < 90; i++) mild.push(50);
  for (let i = 0; i < 10; i++) mild.push(200);
  assert.equal(bimodalityByPooledRatio(mild).trigger, false);
});

// ------------------------------------------------------- Batch 179: abort audit

test('Batch 179: abort audit three-state — UNKNOWN/DECLARED rescue unavailable, PROVEN available', () => {
  const a = new AbortAudit('tool');
  assert.equal(a.state, 'UNKNOWN');
  assert.equal(a.rescueAvailable({ readOnly: true }).available, false);
  assert.equal(a.declare('AbortSignal', 'COOPERATIVE').state, 'DECLARED');
  assert.equal(a.rescueAvailable({ readOnly: true }).available, false); // declared still unavailable
  // A declaration is not proof: proof without a real source is refused.
  assert.equal(a.recordPositiveProof({ attributableToSignal: true }).ok, false);
  assert.equal(a.state, 'DECLARED');
  const proven = a.recordPositiveProof({ attributableToSignal: true, source: 'real-user-cancel' });
  assert.equal(proven.ok, true);
  assert.equal(a.state, 'PROVEN');
  assert.equal(a.rescueAvailable({ readOnly: true }).available, true);
  assert.deepEqual(a.toRecord().proof, { kind: 'positive', source: 'real-user-cancel', attributableToSignal: true });
});

test('Batch 179: disproof is sticky — re-declaration alone never restores rescue; re-declare AND re-prove does', () => {
  const a = new AbortAudit('tool');
  a.declare('process kill', 'HARD');
  a.recordPositiveProof({ source: 'real-stuck-rescue' });
  assert.equal(a.state, 'PROVEN');
  a.recordDisproof({ observation: 'abort issued and work observably continued' });
  assert.equal(a.state, 'DISPROVEN');
  assert.equal(a.rescueAvailable({ readOnly: true }).available, false);
  // Re-declaration alone: still disproven.
  const redecl = a.declare('process kill', 'HARD');
  assert.equal(redecl.state, 'DISPROVEN');
  assert.equal(redecl.reDeclared, true);
  assert.equal(a.rescueAvailable({ readOnly: true }).available, false);
  // Proof without re-declaration would also fail; with it, restoration works.
  const b = new AbortAudit('tool2');
  b.declare('process kill', 'HARD');
  b.recordPositiveProof({ source: 'real-stuck-rescue' });
  b.recordDisproof({});
  assert.equal(b.recordPositiveProof({ source: 'real-user-cancel' }).ok, false); // no re-declare yet
  b.declare('process kill', 'HARD');
  assert.equal(b.recordPositiveProof({ source: 'real-user-cancel' }).ok, true);
  assert.equal(a.recordPositiveProof({ source: 'real-user-cancel' }).ok, true);
  assert.equal(a.state, 'PROVEN');
});

test('Batch 179: provability classes — HARD survives versions, COOPERATIVE re-proves per version, PROTOCOL is negative-only and read-only-only', () => {
  const hard = new AbortAudit('killer');
  hard.declare('process kill', 'HARD');
  hard.recordPositiveProof({ source: 'sacrificial-probe' });
  assert.equal(hard.noteVersion('2.0').state, 'PROVEN'); // hard stays proven across versions
  assert.equal(hard.noteMechanismChange('thread cancel').state, 'DECLARED'); // mechanism change re-opens
  const coop = new AbortAudit('token-tool', { version: '1.0' });
  coop.declare('AbortSignal', 'COOPERATIVE');
  assert.equal(coop.recordPositiveProof({ attributableToSignal: false, source: 'real-user-cancel' }).ok, false); // unattributed early end is not proof
  assert.equal(coop.recordPositiveProof({ attributableToSignal: true, source: 'real-user-cancel' }).ok, true);
  assert.equal(coop.noteVersion('2.0').state, 'DECLARED'); // version-sensitive: re-prove
  assert.equal(coop.rescueAvailable({ readOnly: true }).available, false);
  const proto = new AbortAudit('mcp-tool');
  proto.declare('notifications/cancelled', 'PROTOCOL');
  assert.equal(proto.recordPositiveProof({ source: 'real-user-cancel' }).ok, false); // negative only
  assert.equal(proto.recordNegativeProof({ windowMs: 5000, nObservations: 12, source: 'real-user-cancel' }).ok, true);
  assert.equal(proto.toRecord().proof.kind, 'negative');
  assert.equal(proto.rescueAvailable({ readOnly: true }).available, true); // read-only: sufficient
  assert.equal(proto.rescueAvailable({ readOnly: false }).available, false); // non-read-only: never sufficient
  assert.equal(abortAuditRescueAvailable(proto.toRecord(), false).available, false); // plain snapshot behaves the same
});

test('Batch 179: sacrificial probe legitimate only for HARD, never for cooperative on a stateful tool', () => {
  const hard = new AbortAudit('killer');
  hard.declare('process kill', 'HARD');
  assert.equal(hard.sacrificialProbeLegitimate().legitimate, true);
  const coop = new AbortAudit('token-tool');
  coop.declare('AbortSignal', 'COOPERATIVE');
  assert.equal(coop.sacrificialProbeLegitimate().legitimate, false);
  assert.equal(coop.recordPositiveProof({ attributableToSignal: true, source: 'sacrificial-probe', stateful: true }).ok, false);
  const proto = new AbortAudit('mcp-tool');
  proto.declare('notifications/cancelled', 'PROTOCOL');
  assert.equal(proto.sacrificialProbeLegitimate().legitimate, false);
});

test('Batch 179: rescue gate 3 restated — abortable = PROVEN in the audit, class-appropriate proof; other gates unchanged', () => {
  const t = trackerWith(100, 100);
  const base = { readOnly: true, idempotent: true, progressMade: false, attemptsUsed: 0, remainingBudgetMs: 1000 };
  const declared = new AbortAudit('tool');
  declared.declare('AbortSignal', 'COOPERATIVE');
  assert.equal(t.evaluateStuckRescue({ ...base, abortAudit: declared }).rescue, false);
  const proven = new AbortAudit('tool');
  proven.declare('AbortSignal', 'COOPERATIVE');
  proven.recordPositiveProof({ attributableToSignal: true, source: 'real-stuck-rescue' });
  const ok = t.evaluateStuckRescue({ ...base, abortAudit: proven });
  assert.equal(ok.rescue, true);
  assert.equal(ok.mode, 'abort-and-restart');
  // Other gates still bite with a proven audit: progress, single re-issue, budget.
  assert.equal(t.evaluateStuckRescue({ ...base, abortAudit: proven, progressMade: true }).rescue, false);
  assert.equal(t.evaluateStuckRescue({ ...base, abortAudit: proven, attemptsUsed: 1 }).rescue, false);
  assert.equal(t.evaluateStuckRescue({ ...base, abortAudit: proven, remainingBudgetMs: 150 }).rescue, false);
  // Protocol negative proof + non-read-only: gate 3 fails even though gate 1's
  // readOnly flag is what the audit checks — here readOnly false fails gate 1
  // first, so check the audit directly for the protocol rule (covered above).
  const proto = new AbortAudit('mcp');
  proto.declare('notifications/cancelled', 'PROTOCOL');
  proto.recordNegativeProof({ windowMs: 5000, nObservations: 3, source: 'real-user-cancel' });
  assert.equal(abortAuditRescueAvailable(proto, false).available, false);
  assert.equal(abortAuditRescueAvailable(proto, true).available, true);
});

test('Batch 179: per-mode rescue uses the mode threshold, not the pooled one (fast mode rescues where pooled would wait)', () => {
  const t = new ToolLatencyTracker('tool');
  for (let i = 0; i < 100; i++) t.observeMode('fast', 50);
  for (let i = 0; i < 100; i++) t.observeMode('slow', 5000);
  // Pooled p95 would sit in the slow mode; the fast mode's own T_stuck is 100ms.
  assert.equal(t.stuckThresholdMsForMode('fast'), 100);
  assert.equal(t.stuckThresholdMsForMode('slow'), 10000);
  const fastRescue = t.evaluateStuckRescueForMode('fast', { readOnly: true, idempotent: true, progressMade: false, abortAvailable: true, abortProven: true, attemptsUsed: 0, remainingBudgetMs: 1000 });
  assert.equal(fastRescue.rescue, true);
  assert.equal(fastRescue.thresholdMs, 100);
  assert.equal(fastRescue.label, 'fast');
  // Mode rescue-rate trip moves only that mode's multiplier.
  for (let i = 0; i < 100; i++) t.observeMode('fast', 50);
  t.recordModeRescue('fast'); t.recordModeRescue('fast');
  const tripped = t.recordModeRescue('fast');
  assert.equal(tripped.tripped, true);
  assert.equal(t.stuckThresholdMsForMode('fast'), 150);
  assert.equal(t.stuckThresholdMsForMode('slow'), 10000); // slow mode untouched
});

test('modal selection picks the largest normalized-AST equivalence class, with the mode-collapse warning', () => {
  const norm = (c) => `${c.tool}|${String(c.args.q).toLowerCase()}`;
  const out = modalSelect([
    { id: 'c1', tool: 'search', args: { q: 'Cats' } },
    { id: 'c2', tool: 'search', args: { q: 'cats' } },
    { id: 'c3', tool: 'search', args: { q: 'cats' } },
    { id: 'c4', tool: 'fetch', args: { q: 'cats' } },
  ], norm);
  assert.equal(out.selected.id, 'c1'); // centroid = first member of the modal class
  assert.deepEqual(out.clusterIds, ['c1', 'c2', 'c3']);
  assert.equal(out.clusterSize, 3);
  assert.ok(out.warning.includes('NEVER replaces'));
  assert.equal(out.warning, MODAL_SELECTION_GUARDRAIL);
});

// ------------------------------------------- Batch 192: prefix pruning
// HONEST-LIMITS HEADER FOR THIS WHOLE SECTION: every falsifier test
// below runs on SYNTHETIC fixtures. They prove the HARNESS (agreement /
// regret / token-saved computation, the monotone check, the regret≈0
// gate, the per-hop and minority-cluster guards) — NOT the design.
// No real logged disputed hops exist yet, so no number below is a
// finding about real tool calls. Token counts are proxy counts, not
// model-tokenizer counts.

test('Batch 192: partial parser closes strings/brackets for parsing only, never for execution', () => {
  const p = parsePartialToolCall('{"tool":"search","args":{"q":"cats');
  assert.equal(p.tool, 'search');
  assert.equal(p.toolClosed, true);
  assert.deepEqual(p.paramNames, ['q']);
  assert.equal(p.paramValues.q, PARTIAL_UNKNOWN); // unclosed value is UNKNOWN, not zero
  assert.equal(p.argsClosed, false);
  assert.equal(p.rootClosed, false);
  const full = parsePartialToolCall('{"tool":"search","args":{"q":"cats","limit":5}}');
  assert.equal(full.toolClosed, true);
  assert.equal(full.argsClosed, true);
  assert.equal(full.rootClosed, true);
  assert.equal(full.paramValues.limit, 5);
  assert.throws(() => parsePartialToolCall(42), /string/);
});

test('Batch 192: parsed adjacency avoids the lexical false split (mid-name tool is UNKNOWN singleton)', () => {
  // Same multi-token tool name, one candidate mid-name: lexical Jaccard
  // would split them into different-looking prefixes. Parsed, the
  // mid-name candidate has no closed tool, so it is a singleton that
  // can neither merge nor be pruned — never a false split cluster.
  const closed = { id: 'a', prefixText: '{"tool":"search_all"' };
  const mid = { id: 'b', prefixText: '{"tool":"search_a' };
  assert.equal(prefixClusterKey(parsePartialToolCall(closed.prefixText), 'C0'), 'tool:search_all');
  assert.equal(prefixClusterKey(parsePartialToolCall(mid.prefixText), 'C0'), null);
  const out = prefixPrune([closed, mid], 'C0');
  assert.deepEqual(out.kept.sort(), ['a', 'b']);
  assert.deepEqual(out.pruned, []);
});

test('Batch 192: parsed adjacency avoids the lexical false merge (same tool + first param, differing later params)', () => {
  // Lexical prefix n-grams would call these near-identical. Parsed at
  // C1, their parameter-name sets differ, so they are separate clusters
  // and neither is pruned.
  const a = { id: 'a', prefixText: '{"tool":"search","args":{"q":"cats","limit":' };
  const b = { id: 'b', prefixText: '{"tool":"search","args":{"q":"cats"' };
  assert.notEqual(
    prefixClusterKey(parsePartialToolCall(a.prefixText), 'C1'),
    prefixClusterKey(parsePartialToolCall(b.prefixText), 'C1'));
  const out = prefixPrune([a, b], 'C1');
  assert.deepEqual(out.kept.sort(), ['a', 'b']);
  assert.deepEqual(out.pruned, []);
});

test('Batch 192: minority tool cluster is NEVER pruned on modal grounds at C0', () => {
  const cands = candidatesAtCheckpoint([
    { id: 'a1', hopId: 'h', tool: 'search', args: { q: 'cats' } },
    { id: 'a2', hopId: 'h', tool: 'search', args: { q: 'cats' } },
    { id: 'a3', hopId: 'h', tool: 'search', args: { q: 'cats' } },
    { id: 'm1', hopId: 'h', tool: 'refund', args: { id: 'x' } },
  ], 'C0');
  const out = prefixPrune(cands, 'C0');
  // Modal tool collapses to one survivor; the minority tool survives
  // untouched — pruning is within-cluster only, never across clusters.
  assert.deepEqual(out.kept.sort(), ['a1', 'm1']);
  assert.deepEqual(out.pruned.sort(), ['a2', 'a3']);
  assert.ok(out.guardrail.includes('NEVER across clusters'));
  assert.ok(out.guardrail.includes('IRREVERSIBLE'));
});

test('Batch 192: C1 keeps same-tool candidates that differ in closed values (not duplicates)', () => {
  // Multi-param case: the C1 prefix ends after the LAST param name's
  // colon, so an EARLIER param's value is already closed in the prefix
  // and splits the cluster. (A single-param value has NOT streamed at
  // C1, so it cannot split — that is the checkpoint's information limit,
  // and the falsifier prices it via regret.)
  const cands = candidatesAtCheckpoint([
    { id: 'a', hopId: 'h', tool: 'search', args: { q: 'cats', limit: 5 } },
    { id: 'b', hopId: 'h', tool: 'search', args: { q: 'cats', limit: 9 } },
    { id: 'c', hopId: 'h', tool: 'search', args: { q: 'cats', limit: 5 } },
  ], 'C1');
  const out = prefixPrune(cands, 'C1');
  assert.deepEqual(out.kept.sort(), ['a', 'b']); // c duplicates a; b differs in a closed value
  assert.deepEqual(out.pruned, ['c']);
});

test('Batch 192: GAP siblings are refused, not clustered (invariant a)', () => {
  const cands = [
    { id: 'a', hopId: 'hop-1', prefixText: '{"tool":"search"' },
    { id: 'b', hopId: 'hop-2', prefixText: '{"tool":"search"' },
  ];
  assert.throws(() => prefixPrune(cands, 'C0'), /GAP siblings/);
});

test('Batch 192: C2 key treats an unclosed free-text value as name-only UNKNOWN', () => {
  const a = parsePartialToolCall('{"tool":"note","args":{"body":"hello world');
  const b = parsePartialToolCall('{"tool":"note","args":{"body":"hello there');
  // Both have the same closed structure and one unclosed field: they
  // merge at C2 on (tool, body:UNKNOWN). The falsifier prices this
  // merge via prune regret; the parser does not pretend to know the tail.
  assert.equal(
    prefixClusterKey(a, 'C2'),
    prefixClusterKey(b, 'C2'));
  assert.equal(a.paramValues.body, PARTIAL_UNKNOWN);
});

test('Batch 192: checkpoint prefixes slice at tool closure, last param name, completion', () => {
  const full = canonicalToolCallJson({ tool: 'search', args: { q: 'cats', limit: 5 } });
  assert.equal(checkpointPrefix(full, 'C0'), '{"tool":"search"');
  // Canonical order sorts args keys: limit, then q — C1 ends after q's colon.
  assert.equal(checkpointPrefix(full, 'C1'), '{"tool":"search","args":{"limit":5,"q":');
  assert.equal(checkpointPrefix(full, 'C2'), full);
  assert.deepEqual(PREFIX_CHECKPOINTS, ['C0', 'C1', 'C2']);
});

test('Batch 192: falsifier harness — agreement rises monotonically, regret 0, cost curve holds (FIXTURE, not a finding)', () => {
  // Hop 1: C0 modal tie broken toward the wrong tool (first encountered),
  // C1 splits by parameter set and recovers the final modal cluster.
  // Hop 2: clean modal agreement at every checkpoint.
  // Accepted call = final centroid in both hops, so regret must be 0.
  const hops = [
    {
      hopId: 'h1', disputed: true,
      candidates: [
        { id: 'a1', tool: 'search', args: { q: 'cats' } },
        { id: 'a2', tool: 'search', args: { q: 'cats', limit: 5 } },
        { id: 'b1', tool: 'fetch', args: { q: 'cats' }, accepted: true },
        { id: 'b2', tool: 'fetch', args: { q: 'cats' } },
      ],
    },
    {
      hopId: 'h2', disputed: true,
      candidates: [
        { id: 'c1', tool: 'search', args: { q: 'dogs' }, accepted: true },
        { id: 'c2', tool: 'search', args: { q: 'dogs' } },
        { id: 'd1', tool: 'fetch', args: { q: 'dogs' } },
      ],
    },
  ];
  const out = falsifierReplay(hops);
  // Hop 1: final modal = fetch (b1,b2); C0 tie 2v2 -> first = search -> miss;
  // C1: fetch/{q} size 2 is modal -> hit; C2: full args -> hit.
  assert.equal(out.hops[0].checkpoints.C0.agreement, false);
  assert.equal(out.hops[0].checkpoints.C1.agreement, true);
  assert.equal(out.hops[0].checkpoints.C2.agreement, true);
  assert.equal(out.summary.C0.agreementRate, 0.5);
  assert.equal(out.summary.C1.agreementRate, 1);
  assert.equal(out.summary.C2.agreementRate, 1);
  assert.equal(out.monotoneAgreement, true);
  assert.equal(out.totalRegret, 0);
  assert.equal(out.adoptable.C0, true); // regret 0 + monotone chain holds
  assert.equal(out.adoptable.C1, true);
  // Cost curve: earlier checkpoint saves at least as much per hop.
  assert.ok(out.summary.C0.tokensSavedPerHopProxy >= out.summary.C1.tokensSavedPerHopProxy);
  assert.ok(out.summary.C1.tokensSavedPerHopProxy >= out.summary.C2.tokensSavedPerHopProxy);
  assert.equal(out.summary.C2.tokensSavedPerHopProxy, 0); // completion saves nothing
  assert.ok(out.gateNote.includes('Batch 5'));
  assert.ok(out.provenanceNote.includes('prove the harness mechanics only'));
});

test('Batch 192: falsifier harness — prune regret condemns a checkpoint when the accepted call would be pruned (FIXTURE)', () => {
  // The person-accepted call is the SECOND duplicate: the rule keeps the
  // first (centroid-side) member and prunes the accepted one. Regret > 0
  // must block adoption at every checkpoint that prunes it.
  const hops = [{
    hopId: 'h', disputed: true,
    candidates: [
      { id: 'x1', tool: 'search', args: { q: 'cats' } },
      { id: 'x2', tool: 'search', args: { q: 'cats' }, accepted: true },
    ],
  }];
  const out = falsifierReplay(hops);
  assert.ok(out.summary.C0.regretCount > 0);
  assert.equal(out.adoptable.C0, false);
  assert.equal(out.adoptable.C1, false);
  assert.equal(out.adoptable.C2, false);
  assert.ok(out.hops[0].checkpoints.C0.regretIds.includes('x2'));
});

test('Batch 192: falsifier harness — token-length distribution is reported, not assumed (FIXTURE)', () => {
  const hops = [{
    hopId: 'h', disputed: true,
    candidates: [
      { id: 's', tool: 'search', args: { q: 'cats' } },
      { id: 'l', tool: 'note', args: { body: 'a fairly long free text value for the note body field' } },
    ],
  }];
  const out = falsifierReplay(hops);
  const d = out.tokenLengthDistributionProxy;
  assert.equal(d.n, 2);
  assert.ok(d.min > 0 && d.max >= d.min);
  assert.ok(d.p50 >= d.min && d.p50 <= d.max);
  // Both fixture calls finish far below 100 proxy tokens: on THESE
  // fixtures a T=100 interval would fire zero times. That is a fixture
  // property, not a product measurement — the product distribution is
  // still unmeasured and the harness exists to measure it.
  assert.equal(d.fracUnder100, 1);
  assert.ok(proxyTokens('{"tool":"search"') > 0);
});

// ------------------------------------------- Batch 194: Chen advisory-only Select

test('Batch 194: forced-prefix Select is rejected — no forced-prefix path exists', () => {
  assert.throws(() => assertAdvisoryOnlySelect({ forcedPrefix: 'search(' }), /advisory-only/);
  assert.throws(() => assertAdvisoryOnlySelect({ teacherForcedName: true }), /advisory-only/);
  assert.throws(() => assertAdvisoryOnlySelect({ constrainedRescoring: true }), /advisory-only/);
  assert.throws(() => assertAdvisoryOnlySelect({ constrainedSelection: true }), /advisory-only/);
  assert.throws(() => assertAdvisoryOnlySelect({ forceToolName: true }), /advisory-only/);
  assert.throws(() => advisoryHint('search', { forcedPrefix: 'search(' }), /forced prefix refused/);
  assert.throws(() => advisoryHint('search', { teacherForcedName: true }), /refused/);
  assert.throws(() => selectAdvisory([{ id: 'a' }], 'search', { forcedPrefix: 'search(' }), /advisory-only/);
});

test('Batch 194: advisory path is the only Select behavior — hint advises, never selects or deletes', () => {
  const out = selectAdvisory(
    [{ id: 'a', tool: 'search' }, { id: 'b', tool: 'note' }],
    'search',
  );
  assert.equal(out.kind, 'select-advisory');
  assert.equal(out.hint.kind, 'advisory-hint');
  assert.equal(out.hint.freeGeneration, true);
  assert.equal(out.hint.forcedPrefix, null);
  assert.deepEqual(out.candidateIds, ['a', 'b']); // hint deletes no candidate
  assert.equal(out.deletesNoCandidate, true);
  assert.equal(assertAdvisoryOnlySelect({}).advisoryOnly, true);
  assert.match(SELECT_ADVISORY_ONLY_GUARDRAIL, /advisory/);
});

test('Batch 194: +1.8 AST is recorded as within-noise, never as a claimed gain', () => {
  assert.equal(CHEN_194_FINDINGS.astLevel.advisoryHintPooled, 1.8);
  assert.equal(CHEN_194_FINDINGS.astLevel.advisoryHintMcNemarP, 0.06);
  assert.equal(CHEN_194_FINDINGS.astLevel.advisoryHintSignificant, false);
  assert.match(CHEN_194_FINDINGS.astLevel.advisoryHintReading, /at-worst-neutral/);
  assert.match(advisoryHint('search').astNote, /not significant/);
  // The negative side is recorded alongside, so the +1.8 can never be
  // quoted without its context: hard forcing loses even with gold.
  assert.equal(CHEN_194_FINDINGS.astLevel.constrainedRescoringVsFreeGenerationPooled, -19.1);
  assert.deepEqual(CHEN_194_FINDINGS.astLevel.goldForcedPerModel, [0.24, 0.44, 0.55]);
  assert.deepEqual(CHEN_194_FINDINGS.astLevel.freeGenerationPerModel, [0.28, 0.67, 0.77]);
});

test('Batch 194: single-hop scope — multi-turn use of the attention-segment selector is refused', () => {
  assert.deepEqual(assertSingleHopScope({}).scope, 'single-hop-only');
  assert.deepEqual(assertSingleHopScope({ turns: 1 }).allowed, true);
  assert.throws(() => assertSingleHopScope({ multiTurn: true }), /SINGLE-HOP ONLY/);
  assert.throws(() => assertSingleHopScope({ turns: 2 }), /SINGLE-HOP ONLY/);
  assert.throws(() => assertSingleHopScope({ loop: 'multi-turn' }), /SINGLE-HOP ONLY/);
  assert.equal(CHEN_194_FINDINGS.multiTurnNonTransfer.tauBenchProbe, -27);
  assert.deepEqual(CHEN_194_FINDINGS.multiTurnNonTransfer.gateSignalAuroc, [0.48, 0.73]);
});

test('Batch 194: +11.9/+14.9 recorded as name-only single-call gains — quoting them as end-to-end gain is a misquote', () => {
  assert.equal(CHEN_194_FINDINGS.selectorNameOnlySingleCall.bfcl, 11.9);
  assert.equal(CHEN_194_FINDINGS.selectorNameOnlySingleCall.sealTools, 14.9);
  assert.match(CHEN_194_FINDINGS.selectorNameOnlySingleCall.scope, /name-only, single-call/);
  assert.match(CHEN_194_FINDINGS.selectorNameOnlySingleCall.misquoteWarning, /misquote/);
  assert.equal(CHEN_194_FINDINGS.selectorNameOnlySingleCall.rawUngatedOn3B, -4.7);
});

test('Batch 194: eager-attention deployment constraint — vLLM forgoes signals, eager serves a slow path', () => {
  const vllm = selectorServingPath({ servingPath: 'vllm' });
  assert.equal(vllm.serve, 'forgo-attention-signals');
  assert.equal(vllm.attentionWeights, false);
  assert.match(vllm.costBasis, /must NOT be quoted/);
  const eager = selectorServingPath({ servingPath: 'eager', outputAttentions: true });
  assert.equal(eager.serve, 'eager-slow-path');
  assert.equal(eager.attentionWeights, true);
  assert.match(eager.costBasis, /eager baseline/);
  assert.equal(selectorServingPath({}).serve, 'forgo-attention-signals'); // unproven path never assumed
  assert.match(EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT, /vLLM cannot expose attention weights/);
  assert.equal(CHEN_194_FINDINGS.costAndServing.selectorCostVsEagerBaseline, '1.2x');
});

test('Batch 194: selector and ModeX are alternatives, not votes — no vote/ensemble path exists', () => {
  assert.equal(chooseDisputedHopTier({ tier: 'attention-segment' }).tier, 'attention-segment');
  assert.equal(chooseDisputedHopTier({ tier: 'modex' }).alternativesNotVotes, true);
  assert.throws(() => chooseDisputedHopTier({ tiers: ['attention-segment', 'modex'] }), /alternatives, not votes/);
  assert.throws(() => chooseDisputedHopTier({ tier: 'modex', ensemble: true }), /no vote\/ensemble/);
  assert.throws(() => chooseDisputedHopTier({ tier: 'attention-segment', panelVote: true }), /no vote\/ensemble/);
  assert.throws(() => chooseDisputedHopTier({}), /exactly one/);
  assert.equal(CHEN_194_FINDINGS.selectorNameOnlySingleCall.panelVoteVariant, -32);
});

test('Batch 194: core finding — failure at the readout, not the harness', () => {
  const core = CHEN_194_FINDINGS.coreFinding;
  assert.equal(core.failuresExamined, 198);
  assert.equal(core.attentionArgmaxPointsToGold, 0.80);
  assert.deepEqual(core.perModel, [0.71, 0.86, 0.80]);
  assert.equal(core.chance, 0.21);
  assert.equal(core.goldLiterallyUnderAttended, 0.10);
  assert.match(core.reading, /readout, not the harness/);
});

test('Batch 194: wrong-tool budget — harness reorder/duplicate refused, readout-side funded', () => {
  assert.equal(wrongToolBudgetAllows('harness-reorder').allowed, false);
  assert.equal(wrongToolBudgetAllows('harness-duplicate').allowed, false);
  assert.equal(wrongToolBudgetAllows('advisory-hint').allowed, true);
  assert.equal(wrongToolBudgetAllows('calibrated-steering').allowed, true);
  assert.equal(wrongToolBudgetAllows('retraining').allowed, true);
  assert.equal(wrongToolBudgetAllows('counterfactual-trace').allowed, true);
  assert.equal(CHEN_194_FINDINGS.inputSideRepairs.reorderGoldFirst, 0.182);
  assert.equal(CHEN_194_FINDINGS.inputSideRepairs.duplicateGold, 0.167);
  assert.equal(CHEN_194_FINDINGS.inputSideRepairs.summaryBound, '<=0.23');
});

test('Batch 194: steering fixes WHICH function is named, never its arguments', () => {
  const s = CHEN_194_FINDINGS.steeringScope;
  assert.match(s.fixes, /never its arguments/);
  assert.equal(s.calibratedDelta2FreeGeneration.nameRecovery, 0.67);
  assert.equal(s.calibratedDelta2FreeGeneration.argumentRecovery, 0.13);
  assert.equal(s.calibratedDelta2FreeGeneration.argumentDamage, 0.13);
  assert.equal(s.constrainedDelta8UnderFreeGeneration.nameAccuracyFrom, 0.929);
  assert.equal(s.constrainedDelta8UnderFreeGeneration.nameAccuracyTo, 0.20);
});

test('Batch 194: advisory hint composes with the round-4 prefix tier without replacing it', () => {
  // Prefix tier still prunes duplicates within a cluster (round 4 stands).
  const atC0 = candidatesAtCheckpoint([
    { id: 'd1', tool: 'search', args: { q: 'a' } },
    { id: 'd2', tool: 'search', args: { q: 'b' } },
    { id: 'd3', tool: 'note', args: { body: 'x' } },
  ], 'C0');
  const pruned = prefixPrune(atC0, 'C0');
  assert.ok(pruned.kept.includes('d3')); // minority tool cluster never pruned
  // The advisory hint then advises over the survivors without deleting any.
  const advised = selectAdvisory(atC0.filter((c) => pruned.kept.includes(c.id)), 'note');
  assert.deepEqual(advised.candidateIds.sort(), pruned.kept.sort());
  assert.equal(advised.hint.freeGeneration, true);
});

test('Batch 194: findings carry the harness-vs-product distinction — paper numbers, not pool numbers', () => {
  assert.match(CHEN_194_FINDINGS.scopeNote, /NOT on the north-star tool pool/);
  assert.match(CHEN_194_FINDINGS.scopeNote, /No live model run, no attention measured/);
  assert.match(CHEN_194_FINDINGS.paper, /2606.16364/);
});

test('Batch 197: three arms, same task, same model — gold ceiling arm is new, Chen has none', () => {
  assert.deepEqual(ADVISORY_TEST_ARMS, ['free', 'advisory-rec', 'advisory-gold']);
  const spec = advisoryArmSpec('advisory-gold', {
    recommendationSource: 'plan-top1',
    hintString: advisoryHintText('search'),
    hintedTool: 'search',
    goldTool: 'search',
  });
  assert.equal(spec.goldTool, 'search');
  assert.throws(() => advisoryArmSpec('advisory-fourth', {}), /arms are free, advisory-rec, advisory-gold/);
});

test('Batch 197: hint wording is fixed and verbatim — Chen publishes none, so ours must be quoted', () => {
  assert.equal(advisoryHintText('search'), 'Suggested tool for this step: search — use it only if it fits the request; otherwise choose freely.');
  assert.match(ADVISORY_HINT_TEMPLATE, /otherwise choose freely/);
  assert.ok(!ADVISORY_HINT_TEMPLATE.includes('arguments')); // arguments NEVER included
  assert.deepEqual(assertVerbatimHint(advisoryHintText('note'), 'note').verbatim, true);
  assert.throws(() => assertVerbatimHint('Consider note instead', 'note'), /verbatim/);
  assert.throws(() => advisoryHintText(''), /non-empty string/);
});

test('Batch 197: recommendation source decided before any AST run — Plan-top1 primary, S2 lab-only eager', () => {
  assert.equal(assertRecommendationSource('plan-top1').deployable, true);
  assert.equal(assertRecommendationSource('attention-segment-s2', { servingPath: 'eager' }).labOnly, true);
  assert.throws(() => assertRecommendationSource('attention-segment-s2', { servingPath: 'vllm' }), /lab arm only/);
  assert.throws(() => assertRecommendationSource('attention-segment-s2', {}), /lab arm only/);
  assert.throws(() => assertRecommendationSource('mystery-selector'), /unknown recommendation source/);
  assert.equal(RECOMMENDATION_SOURCES.primary, 'plan-top1');
});

test('Batch 197: tiered sample-size honesty — small tests cannot claim what they cannot measure', () => {
  assert.equal(tierForN(25), 'falsifier');
  assert.equal(tierForN(100), 'pilot');
  assert.equal(tierForN(300), 'chenScale');
  assert.equal(tierForN(50), 'unregistered');
  assert.throws(() => checkClaim('falsifier', 'it works'), /never "works"/);
  assert.throws(() => checkClaim('falsifier', 'shows benefit'), /never "works"/);
  assert.throws(() => checkClaim('pilot', 'confirms +1.8'), /CANNOT confirm/);
  assert.throws(() => checkClaim('pilot', 'replicates Chen'), /CANNOT confirm/);
  assert.throws(() => checkClaim('chenScale', 'replicates Chen'), /does NOT replicate Chen/);
  assert.equal(checkClaim('falsifier', 'not falsified').ceiling, SAMPLE_TIERS.falsifier.ceiling);
  assert.equal(checkClaim('pilot', 'consistent with noise').tier, 'pilot');
});

test('Batch 197: McNemar uses discordant pairs only — exact below 25, asymptotic otherwise', () => {
  const small = mcnemarReport(9, 6);
  assert.equal(small.discordant, 15);
  assert.equal(small.exact, true);
  assert.equal(small.method, 'exact-binomial');
  const big = mcnemarReport(20, 10);
  assert.equal(big.exact, false);
  assert.throws(() => mcnemarReport(-1, 5), /non-negative integers/);
});

test('Batch 197: AST scoring is name AND arguments, order-independent, never name-only', () => {
  const gold = { tool: 'search', args: { q: 'cats', limit: 5 } };
  assert.deepEqual(scoreCall(gold, { tool: 'search', args: { limit: 5, q: 'cats' } }), { ast: 1, nameCorrect: 1, argsCorrect: 1, schemaValid: 1 });
  assert.equal(scoreCall(gold, { tool: 'search', args: { q: 'dogs', limit: 5 } }).ast, 0);
  assert.equal(scoreCall(gold, { tool: 'search', args: { q: 'dogs', limit: 5 } }).argsCorrect, 0);
  const wrongName = scoreCall(gold, { tool: 'note', args: { q: 'cats', limit: 5 } });
  assert.equal(wrongName.ast, 0);
  assert.equal(wrongName.argsConditional, null); // argument accuracy is conditional on correct name
  assert.equal(scoreCall(gold, null).schemaValid, 0);
  // Accepted set: gold value given as a set counts a member as a match.
  assert.equal(scoreCall({ tool: 't', args: { k: ['a', 'b'] } }, { tool: 't', args: { k: 'b' } }).ast, 1);
});

test('Batch 197: scoreArms requires all three arms and catches name-up/args-flat', () => {
  const mk = (tool, args) => ({ gold: { tool: 'search', args: { q: 'x' } }, call: { tool, args }, hintedTool: 'search' });
  const free = [mk('search', { q: 'x' }), mk('note', { body: 'y' }), mk('search', { q: 'z' })];
  // Advisory arm: name right everywhere, arguments wrong on the two it "fixed" — name up, AST flat.
  const rec = [mk('search', { q: 'x' }), mk('search', { q: 'wrong' }), mk('search', { q: 'also-wrong' })];
  const goldArm = [mk('search', { q: 'x' }), mk('search', { q: 'x' }), mk('search', { q: 'x' })];
  const out = scoreArms({ free, 'advisory-rec': rec, 'advisory-gold': goldArm });
  assert.ok(out.arms['advisory-rec'].nameAccuracy > out.arms.free.nameAccuracy);
  assert.equal(out.arms['advisory-rec'].ast, out.arms.free.ast);
  assert.equal(out.decomposition, 'name-only, do not claim call improvement');
  assert.throws(() => scoreArms({ free, 'advisory-rec': rec }), /all three arms/);
});

test('Batch 197: task set guard — frozen gold, one-third confusable, three routines, never circular', () => {
  const good = [];
  for (let i = 0; i < 9; i++) {
    good.push({ goldFrozen: true, derivedFromHintArm: false, confusable: i < 3, routine: ['a', 'b', 'c'][i % 3] });
  }
  assert.equal(assertTaskSet(good).confusableShare, 1 / 3);
  assert.throws(() => assertTaskSet(good.map((t) => ({ ...t, confusable: false }))), /one-third confusable/);
  assert.throws(() => assertTaskSet(good.map((t) => ({ ...t, routine: 'a' }))), /three routines/);
  assert.throws(() => assertTaskSet(good.map((t) => ({ ...t, goldFrozen: false }))), /frozen before the test/);
  assert.throws(() => assertTaskSet(good.map((t) => ({ ...t, derivedFromHintArm: true }))), /circular/);
});

test('Batch 197: pairing controls — all six required, otherwise arms are not comparable', () => {
  const full = { frozenMemory: true, frozenAdapter: true, frozenToolPool: true, fixedOrder: true, freshContextPerArm: true, auditRowPerCall: true };
  assert.deepEqual(assertPairingControls(full).pairingControlled, true);
  assert.throws(() => assertPairingControls({ ...full, frozenMemory: false }), /frozenMemory/);
});

test('Batch 197: abort rules — harm stops the hint, gold-without-rec re-examines the recommendation', () => {
  const base = { free: { ast: 0.60, schemaValidAt1: 0.95, execRate: 0.90 }, advisoryRec: { ast: 0.60, schemaValidAt1: 0.95, execRate: 0.90 } };
  assert.equal(abortCheck(base).stop, false);
  const harm = { free: base.free, advisoryRec: { ast: 0.55, schemaValidAt1: 0.92, execRate: 0.90 } };
  assert.match(abortCheck(harm).reason, /do not ship the hint/);
  const recBottleneck = { free: base.free, advisoryRec: { ast: 0.60, schemaValidAt1: 0.95, execRate: 0.90 }, advisoryGold: { ast: 0.70, schemaValidAt1: 0.95, execRate: 0.90 } };
  assert.match(abortCheck(recBottleneck).reason, /RECOMMENDATION, not the delivery/);
  assert.throws(() => assertPilotPassed(harm), /do not ship the hint/);
  assert.deepEqual(assertPilotPassed(base).pilotPassed, true);
});

test('Batch 197: multi-turn ordering — pilot first, M1 before M2, wording never merged into the pilot', () => {
  assert.throws(() => assertMultiTurnOrder({ phase: 'M1', pilotPassed: false }), /pilot to pass/);
  assert.throws(() => assertMultiTurnOrder({ phase: 'M2', pilotPassed: true, m1Passed: false }), /M1 to pass first/);
  assert.throws(() => assertMultiTurnOrder({ phase: 'M2', pilotPassed: false, m1Passed: false }), /pilot to pass/);
  assert.deepEqual(assertMultiTurnOrder({ phase: 'M2', pilotPassed: true, m1Passed: true }).orderOk, true);
  assert.throws(() => assertMultiTurnOrder({ wordingSensitivityMergedIntoPilot: true }), /NOT be merged into the pilot/);
  assert.throws(() => advisoryArmSpec('advisory-rec', { recommendationSource: 'plan-top1', hintString: advisoryHintText('search'), hintedTool: 'search', wordingSensitivity: true, mergedIntoPilot: true }), /NOT be merged into the pilot/);
});

test('Batch 197: Chen last-token-margin gate is banned in multi-turn', () => {
  assert.throws(() => assertMultiTurnGate('chen-last-token-margin'), /BANNED in multi-turn/);
  assert.deepEqual(assertMultiTurnGate('plan-margin').gateOk, true);
});

test('Batch 197: multi-turn verdict rule — win turn 1, lose the episode, FAIL for loop use', () => {
  const fail = multiTurnVerdict({ turn1Delta: 0.05, finalStateDelta: 0 });
  assert.equal(fail.verdict, 'FAIL');
  assert.equal(fail.scope, 'loop-use');
  const neg = multiTurnVerdict({ turn1Delta: 0.05, finalStateDelta: -0.02 });
  assert.equal(neg.verdict, 'FAIL');
  const ok = multiTurnVerdict({ turn1Delta: 0.05, finalStateDelta: 0.03 });
  assert.equal(ok.verdict, 'pass-pending');
  assert.throws(() => multiTurnVerdict({ turn1Delta: 0.05 }), /turn1Delta and finalStateDelta/);
});

test('Batch 197: harness composes with round-5 advisory-only Select without weakening it', () => {
  // Round 5 still refuses any forced-prefix Select spec.
  assert.throws(() => selectAdvisory([{ id: 'c1' }], 'search', { forcedPrefix: 'search' }), /advisory-only/);
  // The Batch 197 hint text is advisory delivery, not a forced prefix.
  const hint = advisoryHintText('search');
  assert.ok(hint.includes('otherwise choose freely'));
  const advised = selectAdvisory([{ id: 'c1' }, { id: 'c2' }], 'search');
  assert.equal(advised.deletesNoCandidate, true);
});
