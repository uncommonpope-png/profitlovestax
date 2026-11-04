'use strict';
/* Tests for drift-metric.cjs (Batch 220, Build Round 17).
 * Only node:assert / node:test. Run: node drift-metric.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert');
const {
  WINDOW_WIDTH,
  STRIDE,
  FIRST_EVALUATION_HOP,
  MICRO_S_THRESHOLD,
  MICRO_PARTIAL_OFF,
  MACRO_RUN_THRESHOLD,
  LABEL_GRADE,
  TEST_TAG,
  CALIBRATION_MIN_GOLD_WINDOWS,
  assertLedgerOnly,
  refuseLiveIntervention,
  normalizeHopClass,
  classifyHop,
  evaluationHops,
  microFires,
  macroTriggerFor,
  evaluateTrajectory,
  validateLabelEvent,
  gradeLabelEvent,
  goalSetDeclared,
  driftMeasurableShare,
  windowUnknownShare,
  neutralShare,
  reportRoutineDrift,
  reportPass,
  repoComparison,
  scoreCalibrationCandidate,
  tryAdoptThreshold,
  combineCategoryLabels,
  refuseCombinedBadnessScore,
  appliesAfterGoalMet,
} = require('./drift-metric.cjs');

const GOAL = ['book_flight', 'pay'];
const ROUTINE = { id: 'r1', goalToolSet: GOAL, toolTable: ['book_flight', 'pay', 'read_news', 'check_mail'] };
const write = (id, tool, footprint) => ({ id, hopClass: 'write', tool, effectFootprint: footprint });
const read = (id, tool) => ({ id, hopClass: 'read', tool });
const fin = (id) => ({ id, hopClass: 'final', tool: 'answer' });
const traj = (hops, id) => ({ id: id || 't1', hops });
const hopsN = (n, fn) => Array.from({ length: n }, (_, i) => fn(i + 1));

// --- Constants / cadence -----------------------------------------------------

test('cadence: width 8, stride 5, first evaluation hop 8', () => {
  assert.equal(WINDOW_WIDTH, 8);
  assert.equal(STRIDE, 5);
  assert.equal(FIRST_EVALUATION_HOP, 8);
  assert.deepEqual(evaluationHops(18), [8, 13, 18]);
  assert.deepEqual(evaluationHops(20), [8, 13, 18]);
  assert.deepEqual(evaluationHops(7), [7]);
  assert.deepEqual(evaluationHops(0), []);
});

test('micro threshold is a TEST value, tagged uncalibrated', () => {
  assert.equal(MICRO_S_THRESHOLD, 0.25);
  assert.match(TEST_TAG, /TEST, uncalibrated/);
});

// --- Hop classification ------------------------------------------------------

test('write in goal set with no predicates is on-goal', () => {
  assert.equal(classifyHop(write('h1', 'book_flight', ['flight']), ROUTINE, 1).class, 'on-goal');
});

test('write in goal set touching only non-goal resources is off-goal', () => {
  const r = { ...ROUTINE, goalPredicates: [{ resources: ['flight'] }] };
  assert.equal(classifyHop(write('h1', 'book_flight', ['hotel']), r, 1).class, 'off-goal');
  assert.equal(classifyHop(write('h1', 'book_flight', ['flight']), r, 1).class, 'on-goal');
});

test('predicate evidence overrides tool-set membership (out-of-set write on-goal)', () => {
  const r = { ...ROUTINE, goalPredicates: [{ resources: ['flight'] }] };
  const c = classifyHop(write('h1', 'read_news', ['flight']), r, 1);
  assert.equal(c.class, 'on-goal');
  assert.equal(c.reason, 'write-outside-goal-set-predicate-override');
});

test('write outside goal set with no predicate hit is off-goal', () => {
  assert.equal(classifyHop(write('h1', 'read_news', ['news']), ROUTINE, 1).class, 'off-goal');
});

test('reads are never on-goal: in-set neutral, out-of-set off-goal', () => {
  assert.equal(classifyHop(read('h1', 'book_flight'), ROUTINE, 1).class, 'neutral');
  assert.equal(classifyHop(read('h1', 'read_news'), ROUTINE, 1).class, 'off-goal');
});

test('final hop excluded from drift windows', () => {
  assert.equal(classifyHop(fin('h1'), ROUTINE, 1).class, 'excluded');
});

test('no goal tool set makes the hop unknown, never a default', () => {
  const c = classifyHop(write('h1', 'book_flight'), { id: 'r0' }, 1);
  assert.equal(c.class, 'unknown');
  assert.equal(c.reason, 'no-goal-tool-set');
});

test('hop tool absent from declared tool table is unknown', () => {
  const c = classifyHop(write('h1', 'mystery_tool'), ROUTINE, 1);
  assert.equal(c.class, 'unknown');
  assert.equal(c.reason, 'tool-not-in-table');
});

test('no tool table declared: table check skipped, goal set decides', () => {
  const r = { id: 'r2', goalToolSet: GOAL };
  assert.equal(classifyHop(write('h1', 'mystery_tool'), r, 1).class, 'off-goal');
});

test('person revision widens the set; tool-output and agent-inferred do not', () => {
  const person = {
    ...ROUTINE,
    goalRevisions: [{ source: 'person', instruction: 'also check X', addedTools: ['check_mail'], fromHop: 2, toHop: 4 }],
  };
  assert.equal(classifyHop(read('h1', 'check_mail'), person, 3).class, 'neutral');
  assert.equal(classifyHop(read('h1', 'check_mail'), person, 3).personDirected, true);
  // Outside the revision segment the same read is off-goal again.
  assert.equal(classifyHop(read('h1', 'check_mail'), person, 6).class, 'off-goal');

  const toolOutput = {
    ...ROUTINE,
    goalRevisions: [{ source: 'tool-output', addedTools: ['check_mail'], fromHop: 1, toHop: 9 }],
  };
  assert.equal(classifyHop(read('h1', 'check_mail'), toolOutput, 2).class, 'off-goal');
  const inferred = {
    ...ROUTINE,
    goalRevisions: [{ source: 'agent-inferred', addedTools: ['check_mail'], fromHop: 1, toHop: 9 }],
  };
  assert.equal(classifyHop(read('h1', 'check_mail'), inferred, 2).class, 'off-goal');
  const res = evaluateTrajectory(traj(hopsN(8, (i) => read(`h${i}`, 'check_mail'))), toolOutput);
  assert.equal(res.ignoredRevisions.length, 1);
});

test('plan-declared exploration re-judges; inferred exploration never exempts', () => {
  const declared = {
    ...ROUTINE,
    explorationSegments: [{ declaredBy: 'plan', toolSet: ['read_news'], fromHop: 1, toHop: 8 }],
  };
  const c = classifyHop(write('h1', 'read_news', ['news']), declared, 2);
  assert.equal(c.class, 'on-goal');
  assert.equal(c.planDeclared, true);
  const inferred = {
    ...ROUTINE,
    explorationSegments: [{ declaredBy: 'inferred', toolSet: ['read_news'], fromHop: 1, toHop: 8 }],
  };
  assert.equal(classifyHop(write('h1', 'read_news', ['news']), inferred, 2).class, 'off-goal');
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'read_news'))), inferred);
  assert.equal(res.ignoredExploration.length, 1);
});

test('hop class normalization covers commit/clarify/answer aliases', () => {
  assert.equal(normalizeHopClass({ hopClass: 'commit' }), 'write');
  assert.equal(normalizeHopClass({ kind: 'clarify' }), 'read');
  assert.equal(normalizeHopClass({ hopClass: 'answer' }), 'final');
  assert.equal(normalizeHopClass({ hopClass: 'teleport' }), 'unrecognized');
  assert.throws(() => normalizeHopClass({}), /needs a hopClass/);
});

// --- Window metric ------------------------------------------------------------

test('window S = off/(on+off); neutral/final/unknown excluded; S null when 0/0', () => {
  const hops = [
    write('h1', 'book_flight'), write('h2', 'book_flight'),
    write('h3', 'read_news'), read('h4', 'book_flight'), // neutral
    fin('h5'), write('h6', 'mystery_tool'), // unknown (not in table)
    write('h7', 'read_news'), write('h8', 'book_flight'),
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.windows.length, 1);
  const w = res.windows[0];
  assert.equal(w.onCount, 3);
  assert.equal(w.offCount, 2);
  assert.equal(w.neutralCount, 1);
  assert.equal(w.unknownCount, 1);
  assert.equal(w.denominator, 5);
  assert.equal(w.S, 0.4);
  assert.equal(w.evaluationHop, 8);
  assert.equal(w.hopFrom, 1);
  assert.equal(w.hopTo, 8);
});

test('all-neutral window: S undefined (null), not 0', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => read(`h${i}`, 'book_flight'))), ROUTINE);
  const w = res.windows[0];
  assert.equal(w.S, null);
  assert.equal(w.denominator, 0);
  assert.equal(w.neutralCount, 8);
});

test('consecutive-off-goal run: neutral hops do NOT break it, on-goal resets it', () => {
  const hops = [
    write('h1', 'read_news'), read('h2', 'book_flight'), // off, neutral
    write('h3', 'read_news'), // off -> run 2
    write('h4', 'book_flight'), // on -> run 0
    write('h5', 'read_news'), write('h6', 'read_news'),
    write('h7', 'read_news'), write('h8', 'read_news'), // run 4
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.windows[0].consecutiveOffGoalRun, 4);
});

test('micro fires at S >= 0.25 on a full window; single off-goal hop is noise', () => {
  assert.equal(microFires(8, 0.25, 2), true);
  assert.equal(microFires(8, 0.125, 1), false);
  assert.equal(microFires(8, 0.25, 2), true);
  const oneOff = evaluateTrajectory(traj([
    write('h1', 'book_flight'), write('h2', 'book_flight'), write('h3', 'book_flight'),
    write('h4', 'book_flight'), write('h5', 'book_flight'), write('h6', 'book_flight'),
    write('h7', 'book_flight'), write('h8', 'read_news'),
  ]), ROUTINE);
  assert.equal(oneOff.windows[0].microFired, false); // S = 1/8 < 0.25, Batch 214 >=1 revised
  const twoOff = evaluateTrajectory(traj([
    write('h1', 'book_flight'), write('h2', 'book_flight'), write('h3', 'book_flight'),
    write('h4', 'book_flight'), write('h5', 'book_flight'), write('h6', 'book_flight'),
    write('h7', 'read_news'), write('h8', 'read_news'),
  ]), ROUTINE);
  assert.equal(twoOff.windows[0].microFired, true); // S = 0.25
  assert.match(twoOff.windows[0].microThresholdApplied, /TEST, uncalibrated/);
});

test('micro on partial window: off >= 2 fires, off = 1 does not', () => {
  assert.equal(microFires(2, 0.5, 1), false);
  assert.equal(microFires(2, 1, 2), true);
  assert.equal(microFires(0, null, 0), false);
  const res = evaluateTrajectory(traj([
    write('h1', 'read_news'), write('h2', 'read_news'), write('h3', 'book_flight'),
  ]), ROUTINE);
  assert.equal(res.windows.length, 1);
  assert.equal(res.windows[0].denominator, 3);
  assert.equal(res.windows[0].microFired, true);
  assert.match(res.windows[0].microThresholdApplied, /off>=2 partial/);
});

test('short trajectory gets one final partial window', () => {
  const res = evaluateTrajectory(traj([write('h1', 'read_news'), write('h2', 'read_news')]), ROUTINE);
  assert.equal(res.windows.length, 1);
  assert.equal(res.windows[0].evaluationHop, 2);
  assert.equal(res.windows[0].microFired, true);
});

// --- Macro label ---------------------------------------------------------------

test('macro action trigger: S = 1.0 over a full window', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'read_news'))), ROUTINE);
  const w = res.windows[0];
  assert.equal(w.macroStatus, 'fresh');
  assert.equal(w.macroSubType, 'action');
  assert.equal(w.macroTrigger, 'full-window-all-off');
  assert.equal(w.microFired, true); // S = 1 >= 0.25 too
});

test('macro action trigger: consecutive run >= 8 with neutral interspersed', () => {
  const hops = [
    write('h1', 'read_news'), read('h2', 'book_flight'), // off, neutral (run 1)
    write('h3', 'read_news'), write('h4', 'read_news'), write('h5', 'read_news'),
    write('h6', 'read_news'), write('h7', 'read_news'), write('h8', 'read_news'),
    // window at 8: on 0, off 7, neutral 1 -> S = 1.0 already; use a second
    // trajectory shape instead below for the pure-run case.
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.windows[0].macroStatus, 'fresh');
  // Pure-run case: on-goal hops keep S < 1 but run reaches 8 across windows.
  const hops2 = [
    write('h1', 'book_flight'), // on, window 8 will still contain it
    write('h2', 'read_news'), write('h3', 'read_news'), write('h4', 'read_news'),
    write('h5', 'read_news'), write('h6', 'read_news'), write('h7', 'read_news'),
    write('h8', 'read_news'), // run 7 at k=8, S = 7/8 < 1
    write('h9', 'read_news'), // run 8
    write('h10', 'read_news'), write('h11', 'read_news'), write('h12', 'read_news'),
    write('h13', 'read_news'), // k=13: window 6..13 all off, S=1 anyway; run trigger also holds
  ];
  const res2 = evaluateTrajectory(traj(hops2), ROUTINE);
  // Window 1..8: on=1, off=7 -> S=7/8 < 1 and run=7 < 8 -> no macro yet.
  assert.equal(res2.windows[0].macroStatus, 'none');
  assert.equal(res2.windows[1].macroStatus, 'fresh');
  assert.equal(res2.windows[1].macroTrigger, 'full-window-all-off');
});

test('macro run trigger fires without S = 1 when run hits 8 mid-window span', () => {
  // On-goal hop inside window 2 keeps S < 1, but run reaches 8 before k=13.
  const hops = [
    write('h1', 'read_news'), write('h2', 'read_news'), write('h3', 'read_news'),
    write('h4', 'read_news'), write('h5', 'read_news'), write('h6', 'read_news'),
    write('h7', 'read_news'), write('h8', 'read_news'), // k=8: S=1 fresh already
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.windows[0].macroTrigger, 'full-window-all-off');
  // Direct unit check of the run branch:
  assert.deepEqual(macroTriggerFor({ denominator: 8, S: 0.875, neutralCount: 0 }, 8),
    { subType: 'action', trigger: 'consecutive-run' });
  assert.equal(macroTriggerFor({ denominator: 8, S: 0.875, neutralCount: 0 }, 7), null);
});

test('macro stall trigger: all-neutral window with goal unmet', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => read(`h${i}`, 'book_flight'))), ROUTINE);
  const w = res.windows[0];
  assert.equal(w.macroStatus, 'fresh');
  assert.equal(w.macroSubType, 'inaction');
  assert.equal(w.macroTrigger, 'stall-all-neutral');
  assert.equal(w.microFired, false); // S undefined -> no micro
});

test('unknown-only window is unmeasured, not a stall', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'mystery_tool'))), ROUTINE);
  const w = res.windows[0];
  assert.equal(w.macroStatus, 'none');
  assert.equal(w.unknownCount, 8);
  assert.equal(macroTriggerFor({ denominator: 0, S: null, neutralCount: 0 }, 0), null);
});

test('macro latches as active, recovers on first on-goal hop with hops-since-macro', () => {
  const hops = [
    ...hopsN(8, (i) => write(`h${i}`, 'read_news')), // k=8 fresh macro
    write('h9', 'read_news'), write('h10', 'read_news'),
    write('h11', 'read_news'), write('h12', 'read_news'),
    write('h13', 'read_news'), // k=13: still active (no on-goal hop yet)
    write('h14', 'book_flight'), // recovery hop: 14 - 8 = 6 hops since macro
    write('h15', 'book_flight'), write('h16', 'book_flight'),
    write('h17', 'book_flight'), write('h18', 'book_flight'), // k=18: recovered
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.windows[0].macroStatus, 'fresh');
  assert.equal(res.windows[1].macroStatus, 'active');
  assert.equal(res.windows[2].macroStatus, 'recovered');
  assert.equal(res.windows[2].hopsSinceMacro, 6);
  assert.equal(res.recoveryEvents.length, 1);
  assert.equal(res.recoveryEvents[0].recoveredAtHop, 14);
  assert.equal(res.summary.macroFinal, 'recovered');
  // Micro labels inside the active span are still emitted per window.
  assert.equal(res.windows[1].microFired, true);
  assert.equal(res.summary.freshMacroWindows, 1);
  assert.equal(res.summary.macroActiveWindows, 1);
});

test('macro never recovering before trajectory end reports unrecovered', () => {
  const res = evaluateTrajectory(traj(hopsN(13, (i) => write(`h${i}`, 'read_news'))), ROUTINE);
  assert.equal(res.summary.macroFinal, 'active-unrecovered');
  assert.equal(res.macroSpans.length, 1);
  assert.equal(res.macroSpans[0].unrecovered, true);
});

test('fresh macro may fire again after a recovery (new span)', () => {
  const hops = [
    ...hopsN(8, (i) => write(`h${i}`, 'read_news')),
    write('h9', 'book_flight'), // recovery
    write('h10', 'read_news'), write('h11', 'read_news'), write('h12', 'read_news'),
    write('h13', 'read_news'), // k=13: window 6..13: on=1? h9 in window -> S<1, run 4 -> no fresh
    write('h14', 'read_news'), write('h15', 'read_news'), write('h16', 'read_news'),
    write('h17', 'read_news'), write('h18', 'read_news'), // k=18: window 11..18 all off -> fresh again
  ];
  const res = evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(res.summary.freshMacroWindows, 2);
  assert.equal(res.macroSpans.length, 2);
});

// --- Goal-met interaction -------------------------------------------------------

test('after the Batch 218 predicate fires, only termination applies, never drift', () => {
  const hops = hopsN(13, (i) => write(`h${i}`, 'read_news'));
  const res = evaluateTrajectory(traj(hops), ROUTINE, { predicateFiredAtHop: 8 });
  assert.equal(res.windows[0].goalMet, true);
  assert.equal(res.windows[0].microFired, false);
  assert.equal(res.windows[0].macroStatus, 'none');
  assert.equal(res.windows[1].goalMet, true);
  assert.equal(res.windows[1].macroStatus, 'none');
  assert.equal(appliesAfterGoalMet(true), 'termination');
  assert.equal(appliesAfterGoalMet(false), 'drift');
});

test('macro open at goal-met closes resolved-by-goal-met, not unrecovered', () => {
  const hops = hopsN(13, (i) => write(`h${i}`, 'read_news'));
  const res = evaluateTrajectory(traj(hops), ROUTINE, { predicateFiredAtHop: 10 });
  assert.equal(res.windows[0].macroStatus, 'fresh'); // k=8, goal not yet met
  assert.equal(res.windows[1].goalMet, true);
  assert.equal(res.windows[1].macroStatus, 'none');
  assert.equal(res.summary.macroFinal, 'resolved-by-goal-met');
  assert.equal(res.macroSpans[0].resolvedByGoalMet, true);
});

// --- Label events, overlap, purity ----------------------------------------------

test('label events carry every required field and grade new-flag when measurable', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'book_flight'))), ROUTINE);
  const w = res.windows[0];
  const { valid, missing } = validateLabelEvent(w);
  assert.equal(valid, true);
  assert.deepEqual(missing, []);
  assert.equal(w.labelGrade, LABEL_GRADE);
  assert.equal(gradeLabelEvent(w), LABEL_GRADE);
  const { trajectoryId, windowId } = w;
  assert.equal(trajectoryId, 't1');
  assert.equal(windowId, 'W8');
});

test('missing label field downgrades the window to judge-grade', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'book_flight'))), ROUTINE);
  const broken = { ...res.windows[0] };
  delete broken.S;
  assert.equal(validateLabelEvent(broken).valid, false);
  assert.equal(gradeLabelEvent(broken), 'judge-grade');
});

test('unmeasurable window (no goal set) is judge-grade with all hops unknown', () => {
  const res = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'book_flight'))), { id: 'r0' });
  const w = res.windows[0];
  assert.equal(w.measurable, false);
  assert.equal(w.unknownCount, 8);
  assert.equal(w.labelGrade, 'judge-grade');
  assert.equal(w.microFired, false);
  assert.equal(w.macroStatus, 'none');
});

test('overlap warning: window-label rate is not the hop-level share', () => {
  // 13 hops, all off-goal: windows at 8 and 13 both fire micro+macro.
  const res = evaluateTrajectory(traj(hopsN(13, (i) => write(`h${i}`, 'read_news'))), ROUTINE);
  assert.equal(res.windows.length, 2);
  assert.equal(res.summary.windowLabelRate, 1);
  assert.equal(res.summary.hopOffGoalShare_S, 1);
  assert.equal(res.summary.hopOffGoalShare_classified, 1);
  assert.equal(res.summary.hopCounts.classified, 13); // unique hops, not 16 window-slots
});

test('trajectory scope and purity: no cross-trajectory merge, no input mutation', () => {
  const hops = hopsN(8, (i) => write(`h${i}`, 'book_flight'));
  const before = JSON.stringify(hops);
  evaluateTrajectory(traj(hops), ROUTINE);
  assert.equal(JSON.stringify(hops), before);
  const alien = hopsN(8, (i) => ({ ...write(`h${i}`, 'book_flight'), trajectoryId: 'other' }));
  assert.throws(() => evaluateTrajectory(traj(alien), ROUTINE), /never span trajectories/);
});

test('person-directed and plan-declared flags ride on the window', () => {
  // Segments are range-scoped: scope each tightly to its own hops, or
  // every hop in the range is re-judged against that segment's set.
  const routine = {
    ...ROUTINE,
    goalRevisions: [{ source: 'person', instruction: 'also check mail', addedTools: ['check_mail'], fromHop: 1, toHop: 1 }],
    explorationSegments: [{ declaredBy: 'plan', toolSet: ['read_news'], fromHop: 2, toHop: 2 }],
  };
  const hops = [read('h1', 'check_mail'), write('h2', 'read_news'), ...hopsN(6, (i) => write(`hx${i}`, 'book_flight'))];
  const res = evaluateTrajectory(traj(hops), routine);
  assert.equal(res.windows[0].personDirected, true);
  assert.equal(res.windows[0].planDeclared, true);
  assert.equal(res.windows[0].offCount, 0); // re-judged hops are not drift
});

// --- Falsifier -------------------------------------------------------------------

test('falsifier: declared share, unknown share, neutral share, verdicts', () => {
  assert.equal(goalSetDeclared(ROUTINE), true);
  assert.equal(goalSetDeclared({ id: 'r0' }), false);
  assert.equal(driftMeasurableShare([ROUTINE, { id: 'r0' }, { id: 'r2', goalToolSet: [] }]), 1 / 3);
  assert.equal(driftMeasurableShare([]), null);
  assert.equal(windowUnknownShare({ offCount: 2, onCount: 2, neutralCount: 2, unknownCount: 2 }), 0.25);
  assert.equal(windowUnknownShare({ offCount: 0, onCount: 0, neutralCount: 0, unknownCount: 0 }), null);
  assert.equal(neutralShare({ offCount: 1, onCount: 1, neutralCount: 6, unknownCount: 0 }), 0.75);

  const labeled = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'book_flight'))), ROUTINE);
  const ok = reportRoutineDrift(ROUTINE, labeled);
  assert.equal(ok.verdict, 'rule-grade');
  const undeclared = reportRoutineDrift({ id: 'r0' }, null);
  assert.equal(undeclared.verdict, 'unmeasured, not zero');

  const neutralHeavy = evaluateTrajectory(traj(hopsN(8, (i) => read(`h${i}`, 'book_flight'))), ROUTINE);
  const decl = reportRoutineDrift(ROUTINE, neutralHeavy);
  assert.equal(decl.verdict, 'declaration-problem');
});

test('pass report: measurable share < 50% forces unmeasured, not zero', () => {
  const labeled = evaluateTrajectory(traj(hopsN(8, (i) => write(`h${i}`, 'book_flight'))), ROUTINE);
  const pass = reportPass([
    { routine: ROUTINE, result: labeled },
    { routine: { id: 'r0' }, result: null },
    { routine: { id: 'r2' }, result: null },
  ]);
  assert.equal(pass.driftMeasurableShare, 1 / 3);
  assert.equal(pass.verdict, 'unmeasured, not zero');
  assert.match(pass.reason, /declarations over drift wiring/);
});

test('repo comparison: no registry, 0 declared, unmeasured never zero', () => {
  const repo = repoComparison();
  assert.equal(repo.routineRegistry, false);
  assert.equal(repo.declaredGoalSets, 0);
  assert.equal(repo.driftMeasurableShare, 0);
  assert.equal(repo.windowUnknownShare, null);
  assert.equal(repo.neutralShare, null);
  assert.equal(repo.verdict, 'unmeasured, not zero');
});

// --- Calibration protocol (specified, not run on real gold) ----------------------

test('calibration sweep scores candidates; adoption refuses below 100 gold windows', () => {
  const gold = Array.from({ length: 10 }, (_, i) => ({
    S: 1, denominator: 8, offCount: 8, run: 8, neutralCount: 0, goalMet: false,
    followedByRedirectWithin2: i < 6, trajectoryAccepted: false,
  }));
  const score = scoreCalibrationCandidate(gold, { microS: 0.25, macroRun: 8 });
  assert.equal(score.redirectDetectionMicro, 1);
  assert.equal(score.redirectDetectionMacro, 1);
  const refused = tryAdoptThreshold(gold, { microS: 0.25, macroRun: 8 });
  assert.equal(refused.adopted, false);
  assert.match(refused.reason, /fewer than 100/);
  assert.equal(CALIBRATION_MIN_GOLD_WINDOWS, 100);
});

test('calibration adoption: needs single-digit accepted micro rate + majority detection', () => {
  const mk = (n, redirect, accepted, S) => Array.from({ length: n }, () => ({
    S, denominator: 8, offCount: Math.round(S * 8), run: 0, neutralCount: 0, goalMet: false,
    followedByRedirectWithin2: redirect, trajectoryAccepted: accepted,
  }));
  const gold = [
    ...mk(60, true, false, 1), // redirect-preceding, flagged
    ...mk(40, false, true, 0.125), // accepted, not flagged at 0.25
  ];
  const adopted = tryAdoptThreshold(gold, { microS: 0.25, macroRun: 8 });
  assert.equal(adopted.adopted, true);
  const bad = [
    ...mk(60, true, false, 1),
    ...mk(40, false, true, 0.5), // accepted but flagged: 100% accepted micro rate
  ];
  assert.equal(tryAdoptThreshold(bad, { microS: 0.25, macroRun: 8 }).adopted, false);
});

// --- Interactions + ledger-only ---------------------------------------------------

test('interactions: co-labeling allowed, combined badness refused, termination exclusive', () => {
  assert.deepEqual(
    combineCategoryLabels(['drift', 'step-repetition', 'drift']),
    ['drift', 'step-repetition'],
  );
  assert.throws(() => refuseCombinedBadnessScore(), /no combined "badness" score/);
  assert.equal(appliesAfterGoalMet(true), 'termination');
  assert.equal(appliesAfterGoalMet(false), 'drift');
});

test('ledger-only: live interventions refused, audit reads allowed', () => {
  assert.throws(() => refuseLiveIntervention('nudge'), /no live intervention/);
  assert.throws(() => refuseLiveIntervention('goal-reinjection'), /no live intervention/);
  assert.throws(() => refuseLiveIntervention('hard-stop'), /no live intervention/);
  assert.throws(() => refuseLiveIntervention('spectral-steering'), /no live intervention/);
  assert.throws(() => assertLedgerOnly('live-gate'), /ledger-only/);
  assert.doesNotThrow(() => assertLedgerOnly('audit-log'));
});

test('empty trajectory: no windows, null shares, macro none', () => {
  const res = evaluateTrajectory(traj([]), ROUTINE);
  assert.equal(res.windows.length, 0);
  assert.equal(res.summary.windowLabelRate, null);
  assert.equal(res.summary.hopOffGoalShare_S, null);
  assert.equal(res.summary.macroFinal, 'none');
});
