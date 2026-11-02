'use strict';
/**
 * Tests for verifier.cjs — traceability rules V-T01..V-T17.
 * Run: node verifier.test.cjs  (exit 0 on pass; only node:assert/node:test)
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TupleKey, ABSENT, isAbsent, toBoolean, fieldState, unionState,
  effectiveBlockFlags, wholeResultFlags, mayTreatAsNotSensitive,
  mayTreatAsTrustedRaw, TrustStore, KnownSetRecord, Verifier, routeResult,
  gateTreatsAsClean, annotationConsumableAsTrusted, ValidationLog, validate,
  markDegraded, gateRoute, mayTreatAsTrusted, mayTreatAsNotSensitiveValidated,
  blockMayTreatAsTrusted, STAGE_PAYLOAD_KEYS, StageStore, decide, isStale,
  StageAudit, validateSegmentRecord, TaintSegment, Session, LogEvent,
  auditPrompts,
} = require('./verifier.cjs');

const EXT = 'ext-trust-annotations';
const REV = '2026-06-18';

function knownRecord(tuples, overrides = {}) {
  return new KnownSetRecord({
    source: overrides.source || 'spec snapshot ext-trust-annotations@pinned',
    sourceDate: overrides.sourceDate || '2026-11-01',
    stage: overrides.stage || 'Stable',
    tuples,
  });
}
function verifierWith(tuples, opts) {
  return new Verifier(knownRecord(tuples, opts));
}
function opted(verifier, tup) {
  verifier.optIn(tup);
  return verifier;
}

// ---------------------------------------------------------------- V-T01 ---
test('V-T01: same identifier, different protocol revision = distinct records', () => {
  const store = new TrustStore();
  const a = new TupleKey(EXT, '2026-06-18', '1');
  const b = new TupleKey(EXT, '2026-07-28', '1');
  store.create(a);
  store.create(b);
  store.setTrust(a, 'level', 'high');
  assert.equal(store.get(b).trustState.level, undefined);
  assert.notEqual(store.get(a), store.get(b));
});

test('V-T01: same identifier, different revision string = distinct records', () => {
  const store = new TrustStore();
  const a = new TupleKey(EXT, REV, '1');
  const b = new TupleKey(EXT, REV, '2');
  store.create(a);
  store.create(b);
  store.setTrust(a, 'level', 'high');
  assert.equal(store.get(b).trustState.level, undefined);
});

test('V-T01: absent revision string is the initial revision, its own tuple, never a wildcard', () => {
  const store = new TrustStore();
  const initial = new TupleKey(EXT, REV); // revisionString defaults to null
  const numbered = new TupleKey(EXT, REV, '1');
  assert.equal(initial.isInitialRevision, true);
  assert.equal(numbered.isInitialRevision, false);
  assert.equal(initial.equals(numbered), false);
  store.create(initial);
  store.create(numbered);
  assert.notEqual(store.get(initial), store.get(numbered));
  // A known set containing only "1" does not make the initial tuple known.
  const v = verifierWith([numbered]);
  assert.equal(v.negotiate(initial), false);
  assert.equal(v.mismatchLog[0].receivedRevisionString, null);
});

test('V-T01: lookup by identifier alone is rejected, not defaulted', () => {
  const store = new TrustStore();
  store.create(new TupleKey(EXT, REV, '1'));
  assert.throws(() => store.getByIdentifier(EXT), /identifier-alone lookup rejected/);
  // A lookup for a tuple with no record returns undefined — never a default record.
  assert.equal(store.get(new TupleKey(EXT, REV, '99')), undefined);
});

test('V-T01: malformed tuples fail loud at construction', () => {
  assert.throws(() => new TupleKey('', REV, '1'), /identifier/);
  assert.throws(() => new TupleKey(EXT, '', '1'), /protocol revision/);
  assert.throws(() => new TupleKey(EXT, REV, ''), /revision string/);
  assert.throws(() => new TupleKey(EXT, REV, 1), /revision string/);
});

// ---------------------------------------------------------------- V-T02 ---
test('V-T02: creating a new tuple record never mutates the predecessor (byte-identical)', () => {
  const store = new TrustStore();
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  const t3 = new TupleKey(EXT, REV, '3');
  const r1 = store.create(t1);
  store.setTrust(t1, 'probe', 'pass');
  const before = r1.snapshot();
  const r2 = store.create(t2, t1);
  assert.equal(r1.snapshot(), before, 'predecessor byte-identical after successor creation');
  assert.deepEqual(r2.lineage.asObject(), t1.asObject(), 'lineage pointer present');
  const before2 = r2.snapshot();
  store.create(t3, t2);
  assert.equal(r2.snapshot(), before2);
  assert.equal(r1.snapshot(), before);
});

test('V-T02: no merged history field on any record; duplicate and dangling lineage rejected', () => {
  const store = new TrustStore();
  const t1 = new TupleKey(EXT, REV, '1');
  const r1 = store.create(t1);
  assert.equal('history' in r1, false);
  assert.equal('successor' in r1, false);
  assert.throws(() => store.create(t1), /already exists/);
  assert.throws(() => store.create(new TupleKey(EXT, REV, '2'), new TupleKey(EXT, REV, '9')), /dangling/);
});

// ---------------------------------------------------------------- V-T03 ---
test('V-T03: calibration bound to its tuple; loading under a different tuple refused', () => {
  const store = new TrustStore();
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  const t3 = new TupleKey(EXT, '2026-07-28', '1');
  store.create(t1);
  store.create(t2);
  store.create(t3);
  for (const kind of ['threshold', 'probe', 'adapter', 'other']) {
    const id = `cal-${kind}`;
    store.attachCalibration(t1, kind, id);
    assert.equal(store.loadCalibration(t1, id).kind, kind, 'same-tuple load works');
    assert.throws(() => store.loadCalibration(t2, id), /refused under/, `revision-string axis refused (${kind})`);
    assert.throws(() => store.loadCalibration(t3, id), /refused under/, `protocol-revision axis refused (${kind})`);
  }
  assert.throws(() => store.loadCalibration(t1, 'no-such-artifact'), /unknown calibration/);
});

test('V-T03: calibration binding is immutable; refusal is side-effect-free', () => {
  const store = new TrustStore();
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  store.create(t1);
  store.create(t2);
  store.attachCalibration(t1, 'threshold', 'cal-a');
  assert.throws(() => store.attachCalibration(t2, 'threshold', 'cal-a'), /already bound/);
  assert.throws(() => store.loadCalibration(t2, 'cal-a'), /refused/);
  assert.equal(store.loadCalibration(t1, 'cal-a').boundTuple.key(), t1.key(), 'binding unchanged after refused load');
  assert.equal(store.attachCalibration(t1, 'threshold', 'cal-a').artifactId, 'cal-a', 're-attach to same tuple is idempotent');
  assert.throws(() => store.attachCalibration(t1, 'bogus-kind', 'cal-b'), /unknown calibration kind/);
});

// ------------------------------------------------- V-T04 + known set ------
test('V-T04: unknown revision NOT enabled; mismatch log carries the full received tuple', () => {
  const known = new TupleKey(EXT, REV, '1');
  const v = verifierWith([known]);
  const unknown = new TupleKey(EXT, REV, '99');
  assert.equal(v.negotiate(unknown), false);
  assert.equal(v.isEnabled(unknown), false);
  const entry = v.mismatchLog[0];
  assert.equal(entry.receivedIdentifier, EXT);
  assert.equal(entry.receivedProtocolRevision, REV);
  assert.equal(entry.receivedRevisionString, '99');
  assert.equal(entry.reason, 'unknown-revision');
  assert.equal(entry.knownSetSource, 'spec snapshot ext-trust-annotations@pinned');
});

test('V-T04: unknown identifier also not enabled; known tuple enables (control)', () => {
  const known = new TupleKey(EXT, REV, '1');
  const v = opted(verifierWith([known]), known);
  assert.equal(v.negotiate(new TupleKey('other-ext', REV, '1')), false);
  assert.equal(v.negotiate(known), true);
  assert.equal(v.isEnabled(known), true);
});

test('V-T04: unknown then known does not leak enablement to the unknown tuple', () => {
  const known = new TupleKey(EXT, REV, '1');
  const v = opted(verifierWith([known]), known);
  const unknown = new TupleKey(EXT, REV, '99');
  v.negotiate(unknown);
  v.negotiate(known);
  assert.equal(v.isEnabled(unknown), false);
  assert.equal(v.isEnabled(known), true);
});

test('batch120: the wire never teaches the known set; refresh add/remove is fail-closed', () => {
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  const v = opted(verifierWith([t1]), t1);
  v.negotiate(t2); // unknown on the wire
  assert.equal(v.known.has(t2), false, 'negotiation did not mutate the known set');
  // Refresh adding t2 enables it on re-negotiation.
  v.refresh(knownRecord([t1, t2], { sourceDate: '2026-11-02' }));
  assert.equal(v.isEnabled(t1), false, 'refresh clears prior enablement');
  v.optIn(t2);
  assert.equal(v.negotiate(t2), true);
  // Refresh removing t2 clears enablement and fails closed again.
  v.refresh(knownRecord([t1], { sourceDate: '2026-11-03' }));
  assert.equal(v.isEnabled(t2), false);
  assert.equal(v.negotiate(t2), false);
  assert.equal(v.refreshLog.length, 2);
});

test('batch120: new tuples fail closed under a stale known set', () => {
  const t1 = new TupleKey(EXT, REV, '1');
  const v = verifierWith([t1]);
  assert.equal(v.negotiate(new TupleKey(EXT, REV, '5')), false);
});

// ---------------------------------------------------------------- V-T05 ---
test('V-T05: non-mandatory unknown degrades to ungraded end to end; core behavior applies', () => {
  const v = verifierWith([new TupleKey(EXT, REV, '1')]);
  const unknown = new TupleKey(EXT, REV, '99');
  let effected = false;
  const result = v.handleCall(unknown, { mandatory: false, effect: () => { effected = true; }, content: 'out' });
  assert.equal(effected, true, 'core tool behavior applies under degradation');
  assert.equal(result.outcome, 'degraded');
  assert.equal(result.route, 'ungraded');
  assert.equal(result.marker, 'ungraded');
  assert.equal(result.content, 'out');
  const auditEntry = v.audit.find((e) => e.outcome === 'degraded');
  assert.equal(auditEntry.marker, 'ungraded', 'ungraded marker in the audit record');
  assert.equal(auditEntry.receivedRevisionString, '99');
});

test('V-T05: a degraded result annotation is never consumable as trusted, whatever it claims', () => {
  const degraded = { outcome: 'degraded', route: 'ungraded', marker: 'ungraded', annotations: { untrusted: false, sensitive: false } };
  assert.equal(annotationConsumableAsTrusted(degraded), false);
  assert.equal(annotationConsumableAsTrusted({ route: 'graded' }), null, 'graded without validation is undecided, never true');
});

test('V-T05: after refresh adds the tuple, the same call proceeds graded (degradation does not stick)', () => {
  const t = new TupleKey(EXT, REV, '2');
  const v = verifierWith([new TupleKey(EXT, REV, '1')]);
  let n = 0;
  assert.equal(v.handleCall(t, { mandatory: false, effect: () => { n += 1; } }).outcome, 'degraded');
  v.refresh(knownRecord([new TupleKey(EXT, REV, '1'), t]));
  v.optIn(t);
  assert.equal(v.handleCall(t, { mandatory: false, effect: () => { n += 1; } }).outcome, 'proceed');
  assert.equal(n, 2);
});

// ---------------------------------------------------------------- V-T06 ---
test('V-T06: mandatory unknown rejects with the mismatch reason and produces NO effect', () => {
  const v = verifierWith([new TupleKey(EXT, REV, '1')]);
  const unknown = new TupleKey(EXT, REV, '99');
  let effected = false;
  const result = v.handleCall(unknown, { mandatory: true, effect: () => { effected = true; } });
  assert.equal(effected, false, 'effect callback never invoked (fail-before-effect)');
  assert.equal(result.outcome, 'rejected');
  assert.equal(result.reason, 'revision-mismatch');
  assert.equal(result.content, null);
});

test('V-T06: same tuple under the two mandatory flags gives degraded vs rejected; known mandatory proceeds', () => {
  const t = new TupleKey(EXT, REV, '1');
  const v = verifierWith([t]);
  let n = 0;
  const effect = () => { n += 1; };
  assert.equal(v.handleCall(new TupleKey(EXT, REV, '99'), { mandatory: false, effect }).outcome, 'degraded');
  assert.equal(v.handleCall(new TupleKey(EXT, REV, '99'), { mandatory: true, effect }).outcome, 'rejected');
  assert.equal(n, 1, 'only the degraded call effected');
  v.optIn(t);
  assert.equal(v.handleCall(t, { mandatory: true, effect }).outcome, 'proceed');
  assert.equal(n, 2);
});

test('V-T05/V-T06: mandatory-ness must be an explicit boolean', () => {
  const v = verifierWith([new TupleKey(EXT, REV, '1')]);
  const t = new TupleKey(EXT, REV, '99');
  assert.throws(() => v.handleCall(t, { effect: () => {} }), /explicit bool/);
  assert.throws(() => v.handleCall(t, { mandatory: 'yes', effect: () => {} }), /explicit bool/);
  assert.throws(() => v.handleCall(t, { mandatory: 1, effect: () => {} }), /explicit bool/);
});

// ---------------------------------------------------------------- V-T07 ---
test('V-T07 (SHOULD/warning): prompt immediately before a qualifying action is clean', () => {
  const events = [
    new LogEvent('note', { label: 'mismatch recorded' }),
    new LogEvent('prompt', { label: 'ask' }),
    new LogEvent('note', { label: 'audit line' }),
    new LogEvent('action', { destructive: true, reliedOnDegraded: true, label: 'delete' }),
  ];
  const r = auditPrompts(events);
  assert.equal(r.clean, true);
  assert.equal(r.prompts, 1);
});

test('V-T07: notes do not break immediacy; blanket and misplaced prompts warn, never throw', () => {
  const readOnly = auditPrompts([
    new LogEvent('prompt'),
    new LogEvent('action', { reliedOnDegraded: true, label: 'read' }),
  ]);
  assert.equal(readOnly.clean, false);
  assert.match(readOnly.violations[0].reason, /non-destructive/);

  const unrelied = auditPrompts([
    new LogEvent('prompt'),
    new LogEvent('action', { destructive: true, reliedOnDegraded: false, label: 'delete-other' }),
  ]);
  assert.equal(unrelied.clean, false);
  assert.match(unrelied.violations[0].reason, /did not rely/);

  const dangling = auditPrompts([new LogEvent('prompt')]);
  assert.equal(dangling.clean, false);
  assert.match(dangling.violations[0].reason, /no following action/);

  const doublePrompt = auditPrompts([
    new LogEvent('prompt', { label: 'first' }),
    new LogEvent('prompt', { label: 'second' }),
    new LogEvent('action', { openWorld: true, reliedOnDegraded: true, label: 'publish' }),
  ]);
  assert.equal(doublePrompt.violations.length, 1, 'double prompt warns on the first only');
  assert.equal(doublePrompt.violations[0].promptIndex, 0);
});

test('V-T07: T07 forbids prompts, it does not mandate them; a marker note is not a prompt', () => {
  const unprompted = auditPrompts([
    new LogEvent('action', { destructive: true, reliedOnDegraded: true, label: 'delete' }),
  ]);
  assert.equal(unprompted.clean, true, 'unprompted destructive action is not a T07 violation');
  assert.equal(unprompted.prompts, 0);
  const markerOnly = auditPrompts([
    new LogEvent('note', { label: 'ungraded marker shown' }),
    new LogEvent('action', { reliedOnDegraded: true, label: 'read' }),
  ]);
  assert.equal(markerOnly.clean, true);
  assert.throws(() => new LogEvent('bogus'), /unknown log event kind/);
});

// ---------------------------------------------------------------- V-T08 ---
test('V-T08: unannotated = ungraded, not clean; no gate branch emits clean', () => {
  assert.equal(routeResult({ content: 'x', annotations: null }), 'ungraded');
  assert.equal(routeResult({ content: 'x' }), 'ungraded');
  assert.equal(routeResult({ content: 'x', annotations: {} }), 'ungraded');
  assert.equal(routeResult({ content: 'x', annotations: { sensitive: true } }), 'graded');
  assert.equal(gateTreatsAsClean('ungraded'), false);
  assert.equal(gateTreatsAsClean('graded'), false);
});

// ---------------------------------------------------------------- V-T09 ---
test('V-T09: true / false / ABSENT are three distinct states; ABSENT is a singleton', () => {
  assert.equal(fieldState({ sensitive: true }, 'sensitive'), true);
  assert.equal(fieldState({ sensitive: false }, 'sensitive'), false);
  assert.equal(fieldState({}, 'sensitive'), ABSENT);
  assert.equal(fieldState(null, 'sensitive'), ABSENT);
  assert.equal(fieldState({ sensitive: null }, 'sensitive'), ABSENT, 'explicit null = absent');
  assert.equal(fieldState({}, 'sensitive'), fieldState({ untrusted: true }, 'sensitive'), 'ABSENT singleton identity');
  assert.equal(isAbsent(ABSENT), true);
  assert.equal(isAbsent(false), false);
  assert.equal(isAbsent(null), false);
  assert.equal(String(ABSENT), 'ABSENT');
});

test('V-T09: ABSENT refuses boolean coercion (toBoolean throws); gate helpers allow only explicit false', () => {
  assert.throws(() => toBoolean(ABSENT), /never be coerced to a boolean/);
  assert.equal(toBoolean(true), true);
  assert.equal(toBoolean(false), false);
  assert.equal(mayTreatAsNotSensitive({ sensitive: false }), true);
  assert.equal(mayTreatAsNotSensitive({}), false, 'absent sensitive is NOT not-sensitive');
  assert.equal(mayTreatAsNotSensitive({ sensitive: true }), false);
  assert.equal(mayTreatAsTrustedRaw({ untrusted: false }), true);
  assert.equal(mayTreatAsTrustedRaw({}), false, 'absent untrusted is NOT trusted');
  assert.equal(mayTreatAsTrustedRaw({ untrusted: true }), false);
});

test('V-T09: non-boolean annotation values fail loud instead of coercing', () => {
  assert.throws(() => fieldState({ sensitive: 1 }, 'sensitive'), /not boolean/);
  assert.throws(() => fieldState({ sensitive: 'yes' }, 'sensitive'), /not boolean/);
  assert.throws(() => fieldState({ sensitive: 0 }, 'sensitive'), /not boolean/);
});

// ---------------------------------------------------------------- V-T10 ---
test('V-T10: result-level true stays true after any block-level annotation', () => {
  const result = { sensitive: true, untrusted: true };
  for (const block of [{ sensitive: false }, { sensitive: ABSENT }, {}, { sensitive: true }, { untrusted: false }]) {
    const eff = effectiveBlockFlags(result, block);
    assert.equal(eff.sensitive, true, `result sensitive survives ${JSON.stringify(block)}`);
    assert.equal(eff.untrusted, true);
  }
});

test('V-T10: block true makes that block true even over result false; absent is neutral, never false', () => {
  assert.deepEqual(
    effectiveBlockFlags({ sensitive: false }, { sensitive: true }),
    { sensitive: true, untrusted: ABSENT },
  );
  assert.deepEqual(
    effectiveBlockFlags({ sensitive: false }, {}),
    { sensitive: false, untrusted: ABSENT },
    'absent block keeps result false; absent result stays absent, not false',
  );
  assert.deepEqual(
    effectiveBlockFlags({}, {}),
    { sensitive: ABSENT, untrusted: ABSENT },
    'both absent stays absent',
  );
});

test('V-T10: whole-result union catches a lone sensitive block; no cross-result propagation, no write-back', () => {
  const resultA = { sensitive: false };
  const blocksA = [{}, { sensitive: true }];
  assert.equal(wholeResultFlags(resultA, blocksA).sensitive, true);
  const resultB = { sensitive: false };
  const blocksB = [{}];
  assert.equal(wholeResultFlags(resultB, blocksB).sensitive, false, 'result B unaffected by result A');
  const before = JSON.stringify(resultA);
  effectiveBlockFlags(resultA, { sensitive: true });
  assert.equal(JSON.stringify(resultA), before, 'result flags not written back');
  assert.throws(() => effectiveBlockFlags({}, { sensitive: 1 }), /must be True, False, or absent/);
  assert.throws(() => unionState('yes', false), /must be True, False, or ABSENT/);
});

// ---------------------------------------------------------------- V-T11 ---
test('V-T11: validated annotation is gate-consumable; raw wire data is refused by gates', () => {
  const tup = new TupleKey(EXT, REV, '1');
  const log = new ValidationLog();
  const v = validate({ annotations: { sensitive: false, untrusted: false } }, tup, log);
  assert.equal(gateRoute(v), 'graded');
  assert.equal(mayTreatAsTrusted(v), true);
  assert.equal(mayTreatAsNotSensitiveValidated(v), true);
  assert.equal(log.entries.length, 0);
  assert.throws(() => gateRoute({ resultFlags: { untrusted: false } }), /only ValidatedAnnotation/);
  assert.throws(() => mayTreatAsTrusted({ untrusted: false }), /only ValidatedAnnotation/);
});

test('V-T11: unknown field fails the WHOLE unit with a log entry; failed unit never feeds a gate', () => {
  const tup = new TupleKey(EXT, REV, '1');
  const log = new ValidationLog();
  const v = validate({ annotations: { untrusted: false, clearance: 'top' } }, tup, log);
  assert.equal(v.resultValid, false);
  assert.equal(v.resultFlags, null);
  assert.equal(gateRoute(v), 'ungraded');
  assert.equal(mayTreatAsTrusted(v), false);
  assert.equal(log.entries.length, 1);
  assert.match(log.entries[0].reason, /unknown annotation field/);
});

test('V-T11: non-boolean values fail, including the int 1; malformed tuple fails every unit', () => {
  const tup = new TupleKey(EXT, REV, '1');
  const log = new ValidationLog();
  const v = validate({ annotations: { untrusted: 1 } }, tup, log);
  assert.equal(v.resultValid, false);
  assert.equal(mayTreatAsTrusted(v), false);
  const badLog = new ValidationLog();
  const bad = validate({ annotations: { untrusted: false }, blocks: [{ annotations: { sensitive: true } }] }, 'not-a-tuple', badLog);
  assert.equal(bad.resultValid, false);
  assert.deepEqual(bad.blockValid, [false]);
  assert.match(badLog.entries[0].reason, /malformed tuple/);
});

test('V-T11: validation is per unit — a block failure drops only that block', () => {
  const tup = new TupleKey(EXT, REV, '1');
  const log = new ValidationLog();
  const v = validate({
    annotations: { untrusted: false },
    blocks: [{ annotations: { untrusted: false } }, { annotations: { untrusted: 'maybe' } }],
  }, tup, log);
  assert.equal(v.resultValid, true);
  assert.equal(blockMayTreatAsTrusted(v, 0), true);
  assert.equal(blockMayTreatAsTrusted(v, 1), false, 'failed block never yields trust');
  assert.equal(log.entries.length, 1);
});

test('V-T11: unannotated is ungraded, not a validation failure; degraded validated never yields trust', () => {
  const tup = new TupleKey(EXT, REV, '1');
  const log = new ValidationLog();
  const v = validate({ content: 'x' }, tup, log);
  assert.equal(v.resultValid, true, 'absence is not a failure');
  assert.equal(gateRoute(v), 'ungraded');
  assert.equal(log.entries.length, 0);
  const good = validate({ annotations: { untrusted: false } }, tup, new ValidationLog());
  const degraded = markDegraded(good);
  assert.equal(mayTreatAsTrusted(degraded), false);
  assert.equal(gateRoute(degraded), 'ungraded');
});

// ---------------------------------------------------------------- V-T12 ---
test('V-T12 (SHOULD/warning): fresh verifier has nothing enabled; opt-in is per tuple', () => {
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  const v = verifierWith([t1, t2]);
  assert.equal(v.negotiate(t1), false, 'known but unopted stays disabled');
  assert.equal(v.auditOptIn().clean, true, 'absence of support is clean, not a violation');
  v.optIn(t1);
  assert.equal(v.negotiate(t1), true);
  assert.equal(v.negotiate(t2), false, 'opting in revision 1 does not enable revision 2');
});

test('V-T12: enabled-without-opt-in audits as a warning, never an exception; opt-in never bypasses validation', () => {
  const t1 = new TupleKey(EXT, REV, '1');
  const v = verifierWith([t1]);
  const r = v.auditOptIn(new Map([[t1.key(), t1]]), new Map());
  assert.equal(r.clean, false);
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].reason, /without an explicit opt-in/);
  // Opt-in does not bypass validation: an opted-in stranger annotation
  // that fails validation is still dropped to ungraded.
  v.optIn(t1);
  const log = new ValidationLog();
  const bad = validate({ annotations: { untrusted: false, forged: true } }, t1, log);
  assert.equal(gateRoute(bad), 'ungraded');
  assert.equal(mayTreatAsTrusted(bad), false);
  assert.throws(() => v.optIn('not-a-tuple'), /full TupleKey/);
});

// ---------------------------------------------------------------- V-T13 ---
test('V-T13: stage is NEVER read from a negotiation payload', () => {
  const store = new StageStore();
  store.refresh(EXT, 'Beta', 'extensions page', '2026-10-01');
  for (const key of STAGE_PAYLOAD_KEYS) {
    const payload = { identifier: EXT, protocolRevision: REV, revisionString: '1', [key]: 'Stable' };
    const d = decide(store, payload);
    assert.equal(d.stage, 'Beta', `payload key ${key} carrying Stable must not override the store record`);
    assert.equal(d.stageUnknown, false);
  }
  // Nested stage-looking data is likewise never consulted.
  const nested = decide(store, { identifier: EXT, protocolRevision: REV, meta: { stage: 'Stable' } });
  assert.equal(nested.stage, 'Beta');
});

test('V-T13: no record means stage-unknown, never a default stage; refresh validation is fail-loud', () => {
  const store = new StageStore();
  const d = decide(store, { identifier: EXT, protocolRevision: REV });
  assert.equal(d.stage, null);
  assert.equal(d.stageUnknown, true);
  assert.throws(() => store.refresh(EXT, 'Alpha', 'page', '2026-10-01'), /unknown stage/);
  assert.throws(() => store.refresh(EXT, 'Beta', '', '2026-10-01'), /non-empty source/);
  assert.throws(() => store.refresh(EXT, 'Beta', 'page', ''), /non-empty source date/);
  assert.throws(() => decide(store, { identifier: '' }), /non-empty identifier/);
});

test('V-T13: stale decision flagged on removal, newer source date, or stage change; current decision not stale', () => {
  const store = new StageStore();
  store.refresh(EXT, 'Beta', 'extensions page', '2026-10-01');
  const d = decide(store, { identifier: EXT, protocolRevision: REV });
  assert.equal(isStale(d, store), false);
  store.refresh(EXT, 'Beta', 'extensions page', '2026-11-01');
  assert.equal(isStale(d, store), true, 'same-stage refresh with a newer date still flags re-handling');
  const d2 = decide(store, { identifier: EXT, protocolRevision: REV });
  store.refresh(EXT, 'Stable', 'extensions page', '2026-11-01');
  assert.equal(isStale(d2, store), true, 'stage change flags stale');
  const d3 = decide(store, { identifier: EXT, protocolRevision: REV });
  store.remove(EXT);
  assert.equal(isStale(d3, store), true, 'removed record flags stale');
  const unknown = decide(store, { identifier: EXT, protocolRevision: REV });
  store.refresh(EXT, 'Beta', 'extensions page', '2026-11-02');
  assert.equal(isStale(unknown, store), true, 'a record appearing after an unknown decision flags stale');
});

// ---------------------------------------------------------------- V-T14 ---
test('V-T14 (SHOULD/warning): Experimental pin, Beta changelog/announcement, Stable mid-revision rules', () => {
  const audit = new StageAudit();
  audit.recordExperimental('exp-a', null);
  audit.recordExperimental('exp-b', 'v1.2.3');
  audit.recordBetaBreaking('beta-a', false, false);
  audit.recordBetaBreaking('beta-b', true, true);
  audit.recordBetaNonBreaking('beta-a');
  assert.equal(audit.recordStableBehaviour('st-a', REV, 'hash1').midRevisionChange, false);
  assert.equal(audit.recordStableBehaviour('st-a', REV, 'hash1').midRevisionChange, false);
  assert.equal(audit.recordStableBehaviour('st-a', REV, 'hash2').midRevisionChange, true, 'Stable mid-revision change');
  assert.equal(audit.recordStableBehaviour('st-a', '2026-07-28', 'hash2').midRevisionChange, false, 'change under a new revision is allowed');
  const r = audit.audit();
  assert.equal(r.clean, false);
  const reasons = r.warnings.map((w) => w.reason).join(' | ');
  assert.match(reasons, /Experimental handling without a pin/);
  assert.match(reasons, /Beta breaking change #0 without a changelog entry/);
  assert.match(reasons, /Beta breaking change #0 without an announcement/);
  assert.match(reasons, /Stable behaviour changed within protocol revision/);
  // Warnings persist: a later overwrite must not erase the Stable warning.
  audit.recordStableBehaviour('st-a', REV, 'hash1');
  assert.match(audit.audit().warnings.map((w) => w.reason).join(' | '), /Stable behaviour changed/);
  const clean = new StageAudit();
  clean.recordExperimental('exp-c', 'abc123');
  clean.recordBetaBreaking('beta-c', true, true);
  assert.equal(clean.audit().clean, true);
});

// ---------------------------------------------------------------- V-T15 ---
test('V-T15: coexisting identifiers keep independent trust state, no shared lineage or calibration', () => {
  const store = new TrustStore();
  const a = new TupleKey('ext-family-a', REV, '1');
  const b = new TupleKey('ext-family-b', REV, '1');
  store.create(a);
  store.create(b);
  store.setTrust(a, 'level', 'high');
  assert.equal(store.get(b).trustState.level, undefined, 'no shared trust state');
  assert.deepEqual(store.history('ext-family-a').map((r) => r.tupleKey.identifier), ['ext-family-a']);
  assert.throws(() => store.create(new TupleKey('ext-family-b', REV, '2'), a), /across identifiers/);
  store.attachCalibration(a, 'probe', 'cal-family');
  assert.throws(() => store.loadCalibration(b, 'cal-family'), /refused under/);
});

// ------------------------------------------------------------- V-T16 ------
test('V-T16: every taint-segment audit record carries its full tuple', () => {
  const session = new Session();
  session.open(new TupleKey(EXT, REV, '1'));
  session.attribute('item-a');
  const audit = session.audit();
  assert.equal(audit.segments.length, 1);
  assert.deepEqual(audit.segments[0].tuple, {
    identifier: EXT, protocolRevision: REV, revisionString: '1', isInitialRevision: false,
  });
  // Initial-revision segment also carries its full tuple (null = initial).
  const s2 = new Session();
  s2.open(new TupleKey(EXT, REV));
  assert.equal(s2.audit().segments[0].tuple.revisionString, null);
  assert.equal(s2.audit().segments[0].tuple.isInitialRevision, true);
});

test('V-T16: a segment record without a complete tuple is a store-integrity error', () => {
  assert.throws(() => validateSegmentRecord({}), /without a tuple/);
  assert.throws(() => validateSegmentRecord({ tuple: { protocolRevision: REV, revisionString: '1' } }), /identifier/);
  assert.throws(() => validateSegmentRecord({ tuple: { identifier: EXT, revisionString: '1' } }), /protocol revision/);
  assert.throws(() => validateSegmentRecord({ tuple: { identifier: EXT, protocolRevision: REV } }), /must carry revisionString/);
  assert.throws(() => new TaintSegment(null, 1), /without a tuple/);
  assert.throws(() => new TaintSegment('not-a-tuple', 1), /must be a TupleKey/);
  // Null revisionString passes: it IS the full tuple for the initial revision.
  assert.equal(validateSegmentRecord({ tuple: { identifier: EXT, protocolRevision: REV, revisionString: null } }).isInitialRevision, true);
});

// ---------------------------------------------------------------- V-T17 ---
test('V-T17: mid-session tuple change closes the segment with a break marker; old attributions frozen', () => {
  const session = new Session();
  session.open(new TupleKey(EXT, REV, '1'));
  session.attribute('old-1');
  session.attribute('old-2');
  // Frozen = attributions exactly as at close time (the closed flag itself
  // legitimately flips from false to true at close; that is the freeze event).
  const oldAttributionsBefore = [...session.audit().segments[0].attributions];
  session.changeTuple(new TupleKey(EXT, REV, '2'));
  session.attribute('new-1');
  const audit = session.audit();
  assert.equal(audit.segments.length, 2);
  assert.equal(audit.breaks.length, 1);
  assert.deepEqual(audit.breaks[0], { fromSegment: 1, toSegment: 2, reason: 'tuple_change' });
  assert.equal(audit.segments[1].breakBefore, true);
  assert.equal(audit.segments[0].closed, true);
  assert.equal(audit.segments[0].closedReason, 'tuple_change');
  assert.deepEqual(audit.segments[0].attributions, ['old-1', 'old-2']);
  assert.deepEqual(audit.segments[0].attributions, oldAttributionsBefore, 'old segment attributions frozen');
  assert.deepEqual(audit.segments[1].attributions, ['new-1'], 'new segment starts empty; no automatic carryover');
  // Attribute to the closed segment directly: refused.
  assert.throws(() => session.segments[0].attribute('late'), /closed \(frozen\)/);
});

test('V-T17: equal tuple is a no-op; identifier or protocol-revision change also breaks; fresh re-attribution is not a merge', () => {
  const session = new Session();
  session.open(new TupleKey(EXT, REV, '1'));
  session.attribute('x');
  assert.equal(session.changeTuple(new TupleKey(EXT, REV, '1')), session.current);
  assert.equal(session.audit().segments.length, 1);
  assert.equal(session.audit().breaks.length, 0);
  session.changeTuple(new TupleKey(EXT, '2026-07-28', '1'));
  assert.equal(session.audit().segments.length, 2);
  session.changeTuple(new TupleKey('other-ext', '2026-07-28', '1'));
  assert.equal(session.audit().segments.length, 3);
  // Re-attributing the same item string in the new segment is a fresh
  // event there, not a merge: the old segment is unchanged.
  session.attribute('x');
  const audit = session.audit();
  assert.deepEqual(audit.segments[0].attributions, ['x']);
  assert.deepEqual(audit.segments[2].attributions, ['x']);
  assert.throws(() => new Session().changeTuple(new TupleKey(EXT, REV, '1')), /no open segment/);
  assert.throws(() => { const s = new Session(); s.open(new TupleKey(EXT, REV, '1')); s.open(new TupleKey(EXT, REV, '2')); }, /already has an open segment/);
});

// ------------------------------------------------------- cross-cutting ---
test('cross-cutting: session taint and trust records never share state across tuples', () => {
  const store = new TrustStore();
  const t1 = new TupleKey(EXT, REV, '1');
  const t2 = new TupleKey(EXT, REV, '2');
  store.create(t1);
  store.create(t2, t1);
  const session = new Session();
  session.open(t1);
  session.attribute('a');
  session.changeTuple(t2);
  assert.equal(store.get(t1).lineage, null);
  assert.equal(store.get(t2).lineage.key(), t1.key());
  assert.equal(session.audit().segments[0].tuple.revisionString, '1');
  assert.equal(session.audit().segments[1].tuple.revisionString, '2');
});
