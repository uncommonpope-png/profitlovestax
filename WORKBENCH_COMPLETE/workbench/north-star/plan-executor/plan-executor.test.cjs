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
