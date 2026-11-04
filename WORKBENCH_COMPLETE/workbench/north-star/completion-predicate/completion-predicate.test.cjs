'use strict';
/* Tests for completion-predicate.cjs (Batch 218, Build Round 16).
 * Only node:assert / node:test. Run: node completion-predicate.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert');
const {
  PREDICATE_SPEC_VERSION,
  VERIFIED_SUCCESS,
  TERMINATION_THRESHOLD,
  deriveObservationStatus,
  isVerifiedSuccess,
  isCommitHop,
  isFinalizeHop,
  evaluationPointForHop,
  assertLedgerOnly,
  refuseLiveIntervention,
  validatePredicateDeclaration,
  declarePredicate,
  evaluateAssertion,
  evaluateAssertionSet,
  assertMeasurable,
  reReadableAssertionShare,
  predicateDeclaredShare,
  reportRoutineStats,
  evaluateAt,
  evaluationCostReport,
  evaluateFormA,
  evaluateFormB,
  evaluateFormC,
  classifyRunEnding,
  validateFlagEvent,
  gradeFlagEvent,
  terminationUnaware,
  evaluateTrajectory,
} = require('./completion-predicate.cjs');

const VERIFIED = { schemaValid: true, conflicting: false, valuePresent: true };
const UNVERIFIED = { schemaValid: false, conflicting: false, valuePresent: true };

const predAB = (overrides) => ({
  id: 'pred-1',
  routineId: 'routine-1',
  specVersion: 'v1',
  forms: [
    { form: 'A', assertionSetIds: ['set-1'] },
    { form: 'B', assertionSetIds: ['set-1'] },
  ],
  assertionSets: [{ id: 'set-1', assertions: [{ field: 'account.balance', operator: 'equals', value: 42 }] }],
  stateReaders: [{ tool: 'read_balance', readSet: ['account.balance'] }],
  evaluationPoints: ['after-commit', 'after-final'],
  ...(overrides || {}),
});
const predA = (overrides) => predAB({ forms: [{ form: 'A', assertionSetIds: ['set-1'] }], ...(overrides || {}) });
const predB = (overrides) => predAB({ forms: [{ form: 'B', assertionSetIds: ['set-1'] }], ...(overrides || {}) });
const predC = (overrides) => ({
  id: 'pred-c',
  routineId: 'routine-1',
  specVersion: 'v1',
  forms: [{ form: 'C' }],
  assertionSets: [],
  stateReaders: [],
  acceptanceChannel: { channel: 'chat', from: 'person' },
  acceptanceOnly: true,
  evaluationPoints: ['after-commit', 'after-final'],
  ...(overrides || {}),
});
const writeHop = (id, overrides) => ({
  id,
  hopClass: 'write',
  tool: 'set_balance',
  effectFootprint: ['account.balance'],
  observationComponents: VERIFIED,
  reReadable: true,
  reReadState: { account: { balance: 42 } },
  ...(overrides || {}),
});
const traj = (predicate, hops, extra) => evaluateTrajectory({
  trajectoryId: 'traj-1', routineId: 'routine-1', predicate, hops, ...(extra || {}),
});

// --- Declaration: missing fields throw, never silently defaulted ----------

test('declaration: missing id / routineId / specVersion / evaluationPoints / stateReaders throw', () => {
  assert.throws(() => declarePredicate(predAB({ id: undefined })), /missing-field:id/);
  assert.throws(() => declarePredicate(predAB({ routineId: undefined })), /missing-field:routineId/);
  assert.throws(() => declarePredicate(predAB({ specVersion: undefined })), /missing-field:specVersion/);
  assert.throws(() => declarePredicate(predAB({ evaluationPoints: undefined })), /missing-field:evaluationPoints/);
  assert.throws(() => declarePredicate(predAB({ stateReaders: undefined })), /missing-field:stateReaders/);
  assert.throws(() => declarePredicate(predAB({ forms: [] })), /missing-field:forms/);
  const check = validatePredicateDeclaration(predAB({ id: undefined }));
  assert.equal(check.valid, false);
  assert.equal(check.grade, 'rejected');
});

test('declaration: evaluation after every read is refused', () => {
  assert.throws(() => declarePredicate(predAB({ evaluationPoints: ['after-every-read'] })), /invalid-evaluation-point/);
  assert.throws(() => declarePredicate(predAB({ evaluationPoints: ['after-read'] })), /invalid-evaluation-point/);
  assert.equal(declarePredicate(predAB()).specVersion, 'v1');
  assert.equal(PREDICATE_SPEC_VERSION, 'v1');
});

// --- Divergence 3: full-state equality rejected ----------------------------

test('divergence 3: full-state hash / wildcard / fullState flag all rejected', () => {
  const hashSet = [{ id: 'set-1', assertions: [{ field: 'account.balance', operator: 'full-state-hash' }] }];
  assert.throws(() => declarePredicate(predAB({ assertionSets: hashSet })), /full-state/);
  const starSet = [{ id: 'set-1', assertions: [{ field: '*', operator: 'equals', value: 'x' }] }];
  assert.throws(() => declarePredicate(predAB({ assertionSets: starSet })), /full-state/);
  const flagSet = [{ id: 'set-1', assertions: [{ field: 'account.balance', operator: 'equals', value: 42, fullState: true }] }];
  assert.throws(() => declarePredicate(predAB({ assertionSets: flagSet })), /full-state/);
  assert.throws(() => declarePredicate(predAB({ readScope: 'full-state' })), /spec-defect/);
});

test('declaration: unknown assertion set, misplaced C sets, model acceptance all refused', () => {
  assert.throws(() => declarePredicate(predAB({ forms: [{ form: 'A', assertionSetIds: ['nope'] }] })), /unknown-assertion-set-id/);
  assert.throws(() => declarePredicate(predC({ forms: [{ form: 'C', assertionSetIds: ['set-1'] }] })), /misplaced-field/);
  assert.throws(() => declarePredicate(predC({ acceptanceChannel: { channel: 'chat', from: 'model' } })), /must-be-person/);
  assert.throws(() => declarePredicate(predAB({ forms: [{ form: 'A' }] })), /assertionSetIds-for-form-A/);
  assert.throws(() => declarePredicate(predAB({ stateReaders: [] })), /stateReaders/);
});

test('declaration: acceptance as SOLE form must say so explicitly', () => {
  assert.throws(() => declarePredicate(predC({ acceptanceOnly: undefined })), /acceptance-only-not-declared/);
  assert.equal(declarePredicate(predC()).acceptanceOnly, true);
  assert.throws(() => declarePredicate(predC({ acceptanceOnly: true, forms: [{ form: 'A', assertionSetIds: ['set-1'] }, { form: 'C' }] })), /acceptanceOnly-with-non-C-forms/);
});

// --- Verified-success derivation (Batch 216 definition, never ok/200) -----

test('verified-success: derived from three components, never ok/200', () => {
  assert.equal(deriveObservationStatus(VERIFIED), 'verified-success');
  assert.equal(deriveObservationStatus(UNVERIFIED), 'error');
  assert.equal(isVerifiedSuccess('verified-success'), true);
  assert.equal(isVerifiedSuccess('ok'), false);
  assert.equal(VERIFIED_SUCCESS, 'verified-success');
});

// --- Form A -----------------------------------------------------------------

test('form A: ok/200 response with unverified state does NOT fire', () => {
  const hop = writeHop('h1', { observationStatus: 'ok', httpStatus: 200, observationComponents: UNVERIFIED });
  const r = evaluateFormA(declarePredicate(predA()), hop);
  assert.equal(r.fired, false);
  assert.match(r.reason, /not-verified-success/);
  const t = traj(predA(), [hop]);
  assert.equal(t.fired, false);
  assert.equal(t.flagEvent, null);
});

test('form A: verified re-read DOES fire', () => {
  const t = traj(predA(), [writeHop('h1')]);
  assert.equal(t.fired, true);
  assert.equal(t.firing.form, 'A');
  assert.equal(t.firing.assertionSetId, 'set-1');
  assert.equal(t.flagEvent.firingForm, 'A');
  assert.equal(t.flagEvent.assertionSetId, 'set-1');
});

test('form A: tool response claim never fires without satisfying re-read', () => {
  const hop = writeHop('h1', { result: { balance: 42 }, reReadState: { account: { balance: 0 } } });
  assert.equal(evaluateFormA(declarePredicate(predA()), hop).fired, false);
  assert.equal(traj(predA(), [hop]).fired, false);
});

test('form A: fire-and-forget tool makes Form A UNAVAILABLE, never promoted', () => {
  const hop = writeHop('h1', { reReadable: false });
  const r = evaluateFormA(declarePredicate(predA()), hop);
  assert.equal(r.fired, false);
  assert.equal(r.reason, 'unavailable-no-readback');
  assert.equal(r.measurable, false);
  assert.equal(traj(predA(), [hop]).fired, false);
});

test('form A: non-commit hop never fires, even verified with satisfying state', () => {
  const hop = { id: 'h1', hopClass: 'read', observationComponents: VERIFIED, reReadable: true, reReadState: { account: { balance: 42 } }, effectFootprint: ['account.balance'] };
  assert.equal(isCommitHop(hop), false);
  assert.equal(evaluateFormA(declarePredicate(predA()), hop).fired, false);
  assert.equal(evaluationPointForHop(hop), null); // reads are never evaluation points
  assert.equal(traj(predA(), [hop]).fired, false);
});

test('form A: partial assertion set does NOT fire (AND within the set)', () => {
  const two = predA({
    assertionSets: [{ id: 'set-1', assertions: [
      { field: 'account.balance', operator: 'equals', value: 42 },
      { field: 'account.status', operator: 'equals', value: 'open' },
    ] }],
    stateReaders: [{ tool: 'read_balance', readSet: ['account.balance', 'account.status'] }],
  });
  const hop = writeHop('h1', { effectFootprint: ['account.balance', 'account.status'], reReadState: { account: { balance: 42, status: 'closed' } } });
  const r = evaluateFormA(declarePredicate(two), hop);
  assert.equal(r.fired, false);
  assert.equal(r.partials[0].reason, 'partial');
});

test('form A: footprint that touches no asserted field does NOT attribute the outcome', () => {
  const hop = writeHop('h1', { effectFootprint: ['other.field'] });
  const r = evaluateFormA(declarePredicate(predA()), hop);
  assert.equal(r.fired, false);
  assert.equal(r.reason, 'footprint-does-not-touch-asserted-state');
});

// --- Form B -----------------------------------------------------------------

test('form B: all assertions in one set hold against a single snapshot -> fires', () => {
  const t = traj(predB(), [writeHop('h1')]);
  assert.equal(t.fired, true);
  assert.equal(t.firing.form, 'B');
});

test('form B: multi-goal conjunction explicit — one of two holds, no fire; both hold, fires', () => {
  const two = predB({
    assertionSets: [{ id: 'set-1', assertions: [
      { field: 'account.balance', operator: 'equals', value: 42 },
      { field: 'account.status', operator: 'equals', value: 'open' },
    ] }],
    stateReaders: [{ tool: 'read_balance', readSet: ['account.balance', 'account.status'] }],
  });
  const partial = writeHop('h1', { effectFootprint: ['account.balance', 'account.status'], reReadState: { account: { balance: 42, status: 'closed' } } });
  const t1 = traj(two, [partial]);
  assert.equal(t1.fired, false);
  assert.equal(t1.partialPredicateStates.length, 1);
  assert.equal(t1.partialPredicateStates[0].satisfiedCount, 1);
  const full = writeHop('h1', { effectFootprint: ['account.balance', 'account.status'], reReadState: { account: { balance: 42, status: 'open' } } });
  assert.equal(traj(two, [full]).fired, true);
});

test('form B: simultaneous, not accumulated — split across snapshots never fires', () => {
  const two = predB({
    assertionSets: [{ id: 'set-1', assertions: [
      { field: 'a.x', operator: 'equals', value: 1 },
      { field: 'b.y', operator: 'equals', value: 2 },
    ] }],
    stateReaders: [{ tool: 'read_both', readSet: ['a.x', 'b.y'] }],
  });
  const h1 = writeHop('h1', { effectFootprint: ['a.x'], reReadState: { a: { x: 1 }, b: { y: 9 } } });
  const h2 = writeHop('h2', { effectFootprint: ['b.y'], reReadState: { a: { x: 9 }, b: { y: 2 } } });
  const t = traj(two, [h1, h2]);
  assert.equal(t.fired, false);
  assert.equal(t.partialPredicateStates.length, 2);
});

test('form B: partial state does NOT excuse post-firing hops', () => {
  const h1 = writeHop('h1', { reReadState: { account: { balance: 0 } } });
  const h2 = writeHop('h2', { reReadState: { account: { balance: 42 } } });
  const h3 = { id: 'h3', hopClass: 'read' };
  const t = traj(predB(), [h1, h2, h3]);
  assert.equal(t.fired, true);
  assert.equal(t.firing.firingHopId, 'h2');
  assert.deepEqual(t.flagEvent.postFiringHopIds, ['h3']);
});

// --- Form C -----------------------------------------------------------------

test('form C: continuation without accept does NOT fire; logs uncorrected-final', () => {
  const hops = [{ id: 'h1', hopClass: 'final' }, { id: 'h2', hopClass: 'read' }];
  const t = traj(predC(), hops);
  assert.equal(t.fired, false);
  assert.equal(t.flagEvent, null);
  assert.equal(t.uncorrectedFinal.eventType, 'uncorrected-final');
  assert.deepEqual(t.uncorrectedFinal.continuationHopIds, ['h2']);
});

test('form C: explicit accept with identified target DOES fire', () => {
  const hops = [{ id: 'h1', hopClass: 'final' }, { id: 'h2', hopClass: 'read' }];
  const accept = [{ id: 'acc-1', routineId: 'routine-1', target: 'transfer-42', from: 'person', kind: 'accept', channel: 'chat', hopId: 'h1' }];
  const t = traj(predC(), hops, { acceptEvents: accept });
  assert.equal(t.fired, true);
  assert.equal(t.firing.form, 'C');
  assert.equal(t.flagEvent.acceptEventId, 'acc-1');
  assert.equal(t.flagEvent.firingHopId, 'h1');
  assert.equal(t.uncorrectedFinal, null);
  assert.deepEqual(t.flagEvent.postFiringHopIds, ['h2']);
});

test('form C: model accept, target-less accept, wrong-channel accept all rejected', () => {
  const hops = [{ id: 'h1', hopClass: 'final' }];
  const model = [{ id: 'a1', routineId: 'routine-1', target: 't', from: 'model', kind: 'accept', channel: 'chat' }];
  assert.equal(traj(predC(), hops, { acceptEvents: model }).fired, false);
  const noTarget = [{ id: 'a1', routineId: 'routine-1', target: '', from: 'person', kind: 'accept', channel: 'chat' }];
  assert.equal(traj(predC(), hops, { acceptEvents: noTarget }).fired, false);
  const wrongChannel = [{ id: 'a1', routineId: 'routine-1', target: 't', from: 'person', kind: 'accept', channel: 'email' }];
  assert.equal(traj(predC(), hops, { acceptEvents: wrongChannel }).fired, false);
  const r = evaluateFormC(declarePredicate(predC()), model);
  assert.equal(r.rejected[0].reason, 'origin-not-person:model');
});

test('divergence 4: silence is NOT acceptance', () => {
  const t = traj(predC(), [{ id: 'h1', hopClass: 'final' }]);
  assert.equal(t.fired, false);
  assert.equal(t.flagEvent, null);
  assert.equal(t.uncorrectedFinal, null); // no continuation, but still no firing
});

// --- Divergence 1: model text never proof -----------------------------------

test('divergence 1: model-declared-done vs predicate — candidate vs consistent, never a firing', () => {
  const doneOnly = traj(predA(), [writeHop('h1', { reReadState: { account: { balance: 0 } } })],
    { modelDeclaredDoneEvents: [{ hopId: 'h1', text: 'done' }] });
  assert.equal(doneOnly.fired, false);
  assert.equal(doneOnly.modelDeclaredDone[0].comparison, 'premature-finalization-candidate');
  const consistent = traj(predA(), [writeHop('h1'), { id: 'h2', hopClass: 'read' }],
    { modelDeclaredDoneEvents: [{ hopId: 'h2', text: 'TERMINATE' }] });
  assert.equal(consistent.fired, true);
  assert.equal(consistent.modelDeclaredDone[0].comparison, 'consistent');
  // The declaration never excuses later hops: h2 is still a post-firing hop.
  assert.deepEqual(consistent.flagEvent.postFiringHopIds, ['h2']);
});

// --- Divergence 2: three run endings, never two ------------------------------

test('divergence 2: three distinct run endings; model done is never an ending', () => {
  assert.equal(classifyRunEnding({ predicateFired: true, endingKind: 'timeout' }), 'completed-by-predicate');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'cap' }), 'stopped-by-harness');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'timeout' }), 'stopped-by-harness');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'budget' }), 'stopped-by-harness');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'person-interrupt' }), 'abandoned');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'unrecovered-error' }), 'abandoned');
  assert.equal(classifyRunEnding({ predicateFired: false, endingKind: 'external-stop' }), 'abandoned');
  assert.equal(classifyRunEnding({ predicateFired: false }), 'unknown');
  assert.throws(() => classifyRunEnding({ predicateFired: false, endingKind: 'model-said-done' }), /unknown ending kind/);
  const t = traj(predA(), [writeHop('h1')], { runEnding: { endingKind: 'cap' } });
  assert.equal(t.runEnding, 'completed-by-predicate');
  const s = traj(predA(), [writeHop('h1', { reReadState: { account: { balance: 0 } } })], { runEnding: { endingKind: 'cap' } });
  assert.equal(s.runEnding, 'stopped-by-harness');
});

// --- Latching + undo ----------------------------------------------------------

test('latching + undo: break logs a separate event, firing stands; post-break hops separate', () => {
  const hops = [
    writeHop('h1'),
    { id: 'h2', hopClass: 'read' },
    writeHop('h3', { reReadState: { account: { balance: 0 } } }),
    { id: 'h4', hopClass: 'read' },
    writeHop('h5', { reReadState: { account: { balance: 42 } } }),
  ];
  const t = traj(predA(), hops);
  assert.equal(t.fired, true);
  assert.notEqual(t.flagEvent, null); // NOT "predicate never fired"
  assert.equal(t.predicateBroken.status, 'broken');
  assert.equal(t.predicateBroken.breakingHopId, 'h3');
  assert.deepEqual(t.predicateBroken.brokenAssertionIds, ['account.balance']);
  assert.equal(t.predicateBroken.priorFiringHopId, 'h1');
  assert.deepEqual(t.flagEvent.postFiringHopIds, ['h2', 'h3']);
  assert.equal(t.flagEvent.postFiringHopCount, 2);
  assert.deepEqual(t.postBreakHopIds, ['h4', 'h5']); // never merged into the termination rate
  assert.equal(t.predicateRepaired.repairedAtHopId, 'h5');
  assert.equal(t.flagEvent.predicateBroken.status, 'broken');
});

test('latching: fired stays fired even with no break and no later snapshots', () => {
  const t = traj(predA(), [writeHop('h1'), { id: 'h2', hopClass: 'read' }]);
  assert.equal(t.fired, true);
  assert.equal(t.predicateBroken.status, 'none');
  assert.deepEqual(t.flagEvent.postFiringHopIds, ['h2']);
});

// --- Flag fields + finalize exclusion + threshold -----------------------------

test('flag fields: all section-7 fields present; finalize hop excluded, next hop counted', () => {
  const hops = [writeHop('h1'), { id: 'h2', hopClass: 'final' }, { id: 'h3', hopClass: 'read' }];
  const t = traj(predA(), hops);
  assert.equal(t.fired, true);
  const f = t.flagEvent;
  assert.equal(f.trajectoryId, 'traj-1');
  assert.equal(f.predicateId, 'pred-1');
  assert.equal(f.predicateSpecVersion, 'v1');
  assert.equal(f.firingForm, 'A');
  assert.equal(f.assertionSetId, 'set-1');
  assert.equal(f.firingHopId, 'h1');
  assert.deepEqual(f.postFiringHopIds, ['h3']); // h2 (finalize) excluded: expected next hop, not a flag
  assert.equal(f.postFiringHopCount, 1);
  assert.equal(f.predicateBroken.status, 'none');
  assert.equal(f.labelGrade, 'new-flag');
  assert.deepEqual(t.excludedFinalizeHopIds, ['h2']);
  assert.equal(isFinalizeHop({ hopClass: 'final' }), true);
  assert.equal(validateFlagEvent(f).valid, true);
  assert.equal(gradeFlagEvent(f), 'new-flag');
});

test('flag validation: missing any required field downgrades to judge-grade', () => {
  const t = traj(predA(), [writeHop('h1')]);
  const broken = { ...t.flagEvent };
  delete broken.postFiringHopCount;
  assert.equal(validateFlagEvent(broken).valid, false);
  assert.equal(gradeFlagEvent(broken), 'judge-grade');
  assert.equal(validateFlagEvent({ ...t.flagEvent, firingForm: 'Z' }).valid, false);
});

test('threshold = 1: first non-final hop after firing already flags (offline pass)', () => {
  assert.equal(TERMINATION_THRESHOLD, 1);
  const zero = traj(predA(), [writeHop('h1')]);
  assert.equal(terminationUnaware(zero.flagEvent).unaware, false);
  const one = traj(predA(), [writeHop('h1'), { id: 'h2', hopClass: 'read' }]);
  assert.equal(terminationUnaware(one.flagEvent).unaware, true);
  assert.equal(one.terminationUnawareness, 'termination-unaware');
  assert.equal(zero.terminationUnawareness, 'aware');
});

// --- No predicate: no flag, not measurable, never zero -------------------------

test('no predicate: NO flag event; termination-unawareness is "not measurable", never 0', () => {
  const t = evaluateTrajectory({ trajectoryId: 'traj-1', routineId: 'routine-1', predicate: null, hops: [{ id: 'h1', hopClass: 'read' }, { id: 'h2', hopClass: 'read' }] });
  assert.equal(t.flagEvent, null);
  assert.equal(t.measurable, false);
  assert.equal(t.terminationUnawareness, 'not measurable');
  assert.match(t.verdict, /NOT MEASURABLE/);
});

// --- Live refusal + evaluation-cost rule ---------------------------------------

test('ledger-only: live finalize nudge, nudge, live-gate all refused', () => {
  assert.throws(() => refuseLiveIntervention({ action: 'finalize-nudge' }), /REFUSED/);
  assert.throws(() => refuseLiveIntervention({ action: 'nudge' }), /REFUSED/);
  assert.throws(() => refuseLiveIntervention({ action: 'live-gate' }), /REFUSED/);
  assert.throws(() => assertLedgerOnly({ mode: 'live-gate' }), /REFUSED/);
  assert.deepEqual(assertLedgerOnly({}), { mode: 'ledger-only' });
});

test('evaluation cost: non-declared point refused; declared points pass', () => {
  const p = declarePredicate(predAB());
  assert.throws(() => evaluateAt({ predicate: p, point: 'after-read' }), /not a declared evaluation point/);
  assert.deepEqual(evaluateAt({ predicate: p, point: 'after-commit' }), { point: 'after-commit', allowed: true });
  assert.deepEqual(evaluateAt({ predicate: p, point: 'after-final' }), { point: 'after-final', allowed: true });
});

test('evaluation cost: assertion fields only, never whole state per hop', () => {
  const r = evaluationCostReport(declarePredicate(predAB()));
  assert.deepEqual(r.assertionFields, ['account.balance']);
  assert.equal(r.assertionFieldCount, 1);
  assert.equal(r.reReadScope, 'assertion-fields-only');
  assert.equal(r.wholeStatePerHop, false);
  assert.equal(r.defect, null);
});

// --- Falsifier: declared share + re-readable share ------------------------------

test('falsifier: predicate-declared share per routine; acceptance-only share separate', () => {
  const routines = [
    { routineId: 'r1', predicate: declarePredicate(predAB()) },
    { routineId: 'r2', predicate: null },
    { routineId: 'r3', predicate: null },
    { routineId: 'r4', predicate: declarePredicate(predC()) },
  ];
  const s = predicateDeclaredShare(routines);
  assert.equal(s.totalRoutines, 4);
  assert.equal(s.declaredCount, 2);
  assert.equal(s.share, 0.5);
  assert.equal(s.acceptanceOnlyCount, 1);
  assert.equal(s.acceptanceOnlyShare, 0.25);
  const zero = predicateDeclaredShare([{ routineId: 'r1', predicate: null }, { routineId: 'r2', predicate: null }]);
  assert.equal(zero.share, 0);
  assert.match(zero.verdict, /FAILED/);
  const stats = reportRoutineStats({ routines });
  assert.equal(stats.routines.length, 4);
  assert.equal(stats.routines[1].predicateDeclared, false);
});

test('falsifier: re-readable-assertion share per form; uncovered field is unmeasurable, not false', () => {
  const p = declarePredicate(predAB({
    assertionSets: [{ id: 'set-1', assertions: [
      { field: 'account.balance', operator: 'equals', value: 42 },
      { field: 'account.status', operator: 'equals', value: 'open' },
    ] }],
    stateReaders: [{ tool: 'read_balance', readSet: ['account.balance'] }], // status not re-readable
  }));
  const m = assertMeasurable(p);
  assert.equal(m.measurable, false);
  assert.deepEqual(m.perSet[0].uncoveredFields, ['account.status']);
  const share = reReadableAssertionShare(p);
  assert.equal(share.perForm.A.totalAssertions, 2);
  assert.equal(share.perForm.A.reReadable, 1);
  assert.equal(share.perForm.A.share, 0.5);
  assert.deepEqual(share.perForm.A.unmeasurableSetIds, ['set-1']);
  // Unmeasurable set never fires Form B on a satisfying snapshot: it is
  // unmeasurable, not false — and not a firing either.
  const b = evaluateFormB(p, { account: { balance: 42, status: 'open' } });
  assert.equal(b.fired, false);
  assert.equal(b.partials[0].reason, 'unmeasurable-uncovered-fields');
});

// --- Purity + trajectory scope --------------------------------------------------

test('scan is pure: input hops are not mutated', () => {
  const hops = [writeHop('h1'), { id: 'h2', hopClass: 'read' }];
  const before = JSON.stringify(hops);
  traj(predA(), hops);
  assert.equal(JSON.stringify(hops), before);
});

test('trajectory scope: hops from another trajectory throw, never merge', () => {
  const hops = [writeHop('h1', { trajectoryId: 'other-traj' })];
  assert.throws(() => traj(predA(), hops), /never span trajectories/);
});

test('assertion evaluation: operators behave on flat and nested snapshots', () => {
  const snap = { 'account.balance': 42, account: { status: 'open' }, n: 5 };
  assert.equal(evaluateAssertion({ field: 'account.balance', operator: 'equals', value: 42 }, snap).holds, true);
  assert.equal(evaluateAssertion({ field: 'account.status', operator: 'equals', value: 'open' }, snap).holds, true);
  assert.equal(evaluateAssertion({ field: 'n', operator: 'greater-than', value: 4 }, snap).holds, true);
  assert.equal(evaluateAssertion({ field: 'missing', operator: 'present' }, snap).holds, false);
  assert.equal(evaluateAssertion({ field: 'missing', operator: 'absent' }, snap).holds, true);
  assert.equal(evaluateAssertionSet({ id: 's', assertions: [{ field: 'n', operator: 'equals', value: 5 }] }, snap).holds, true);
});
