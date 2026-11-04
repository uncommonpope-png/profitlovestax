'use strict';
/* Tests for step-repetition.cjs (Batch 216, Build Round 15).
 * Only node:assert / node:test. Run: node step-repetition.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert');
const {
  NORMALIZATION_SPEC_VERSION,
  deriveObservationStatus,
  isVerifiedSuccess,
  normalizeCall,
  normalizeParallelCalls,
  flagsComparable,
  assertLedgerOnly,
  refuseLiveIntervention,
  validateFlagEvent,
  gradeFlagEvent,
  countSpecViolations,
  reportRoutineGuardUnknown,
  readSetCoverage,
  detectStepRepetition,
} = require('./step-repetition.cjs');

const CASEFOLD = { city: { kind: 'casefold' } };
const readHop = (id, overrides) => ({
  id,
  tool: 'read_balance',
  args: { account: 'acct-1' },
  hopClass: 'read',
  observationStatus: 'verified-success',
  result: { balance: 42 },
  readSet: ['account.balance'],
  ...(overrides || {}),
});
const scan = (hops, extra) => detectStepRepetition({
  trajectoryId: 'traj-1', hops, argRulesByTool: { read_balance: CASEFOLD, get_city: CASEFOLD }, ...(extra || {}),
});

// --- Observation status derivation (Batch 216 condition (b)) ---------------

test('deriveObservationStatus: verified-success needs all three components', () => {
  assert.equal(deriveObservationStatus({ schemaValid: true, conflicting: false, valuePresent: true }), 'verified-success');
  assert.equal(deriveObservationStatus({ schemaValid: false, conflicting: false, valuePresent: true }), 'error');
  assert.equal(deriveObservationStatus({ schemaValid: true, conflicting: false, valuePresent: false }), 'error');
  assert.equal(deriveObservationStatus({ schemaValid: true, conflicting: true, valuePresent: true }), 'conflicting');
  assert.equal(isVerifiedSuccess('verified-success'), true);
  assert.equal(isVerifiedSuccess('ok'), false); // 'ok' is merely returned, never verified
  assert.throws(() => deriveObservationStatus(null), /schemaValid/);
});

// --- Divergence 1: Batch 10 normalized identity, NOT canonical JSON --------

test('divergence 1: normalized identity merges what canonical JSON splits', () => {
  const a = { tool: 'get_city', args: { city: 'Paris' } };
  const b = { tool: 'get_city', args: { city: 'paris' } };
  assert.notEqual(JSON.stringify(a), JSON.stringify(b)); // canonical JSON splits them
  assert.equal(normalizeCall(a, { argRules: CASEFOLD }).hash, normalizeCall(b, { argRules: CASEFOLD }).hash);
  assert.equal(normalizeCall(a, { argRules: CASEFOLD }).specVersion, 'v1');
});

test('normalization: number tolerance, date parse, enum alias, default, permutation', () => {
  assert.equal(
    normalizeCall({ tool: 't', args: { price: 19.99 } }, { argRules: { price: { kind: 'number', tolerance: 0.02 } } }).hash,
    normalizeCall({ tool: 't', args: { price: 20.0 } }, { argRules: { price: { kind: 'number', tolerance: 0.02 } } }).hash);
  assert.equal(
    normalizeCall({ tool: 't', args: { d: '21 Oct 2026' } }, { argRules: { d: { kind: 'date' } } }).hash,
    normalizeCall({ tool: 't', args: { d: '2026-10-21' } }, { argRules: { d: { kind: 'date' } } }).hash);
  assert.equal(
    normalizeCall({ tool: 't', args: { s: 'NYC' } }, { argRules: { s: { kind: 'enum-alias', aliases: { nyc: 'new-york' } } } }).hash,
    normalizeCall({ tool: 't', args: { s: 'new-york' } }, { argRules: { s: { kind: 'enum-alias', aliases: { nyc: 'new-york' } } } }).hash);
  assert.equal(
    normalizeCall({ tool: 't', args: {} }, { argRules: { limit: { kind: 'default', defaultValue: 10 } } }).hash,
    normalizeCall({ tool: 't', args: { limit: 10 } }, { argRules: { limit: { kind: 'default', defaultValue: 10 } } }).hash);
  assert.equal(
    normalizeCall({ tool: 't', args: { b: 2, a: 1 } }).hash,
    normalizeCall({ tool: 't', args: { a: 1, b: 2 } }).hash);
});

test('normalization: exact args stay exact; ignored needs effectFree; ReWOO resolved first', () => {
  assert.notEqual(
    normalizeCall({ tool: 't', args: { path: 'Notes/ABC' } }).hash,
    normalizeCall({ tool: 't', args: { path: 'notes/abc' } }).hash);
  assert.throws(() => normalizeCall({ tool: 't', args: { note: 'x' } }, { argRules: { note: { kind: 'ignored' } } }), /effectFree/);
  assert.equal(
    normalizeCall({ tool: 't', args: { note: 'x' } }, { argRules: { note: { kind: 'ignored', effectFree: true } } }).hash,
    normalizeCall({ tool: 't', args: {} }, { argRules: { note: { kind: 'ignored', effectFree: true } } }).hash);
  assert.equal(
    normalizeCall({ tool: 't', args: { id: '#E1' }, variables: { '#E1': 'acct-9' } }).hash,
    normalizeCall({ tool: 't', args: { id: 'acct-9' } }).hash);
});

test('normalization: parallel calls are a multiset (order-invariant, counts kept)', () => {
  const a = [{ tool: 't', args: { x: 1 } }, { tool: 't', args: { x: 2 } }, { tool: 't', args: { x: 1 } }];
  const b = [{ tool: 't', args: { x: 1 } }, { tool: 't', args: { x: 1 } }, { tool: 't', args: { x: 2 } }];
  const c = [{ tool: 't', args: { x: 1 } }, { tool: 't', args: { x: 2 } }];
  assert.equal(normalizeParallelCalls(a).canonical, normalizeParallelCalls(b).canonical);
  assert.notEqual(normalizeParallelCalls(a).canonical, normalizeParallelCalls(c).canonical);
});

test('spec version recorded; v1 flags not comparable to v2 flags', () => {
  const f1 = { normalizationSpecVersion: 'v1' };
  assert.equal(flagsComparable(f1, { normalizationSpecVersion: 'v1' }), true);
  assert.equal(flagsComparable(f1, { normalizationSpecVersion: 'v2' }), false);
  assert.equal(NORMALIZATION_SPEC_VERSION, 'v1');
});

// --- Firing rule: all four conditions, each failure blocking --------------

test('firing: all four conditions met fires with full fields, distance, same-result', () => {
  const out = scan([readHop('h1'), readHop('h2')]);
  assert.equal(out.flags.length, 1);
  const f = out.flags[0];
  assert.equal(f.trajectoryId, 'traj-1');
  assert.equal(f.hopId, 'h2');
  assert.equal(f.priorHopId, 'h1');
  assert.equal(f.priorObservationStatus, 'verified-success');
  assert.equal(f.guardResult, 'none');
  assert.equal(f.subType, 'repeat-same-result');
  assert.equal(f.distance, 1);
  assert.deepEqual(f.pollExemptionStatus, { exempt: false, declarationId: null });
  assert.equal(f.labelGrade, 'new-flag');
  assert.equal(f.normalizationSpecVersion, 'v1');
  assert.equal(gradeFlagEvent(f), 'rule-grade');
  assert.equal(out.specViolations.length, 0);
});

test('firing blocked: (a) different normalized call', () => {
  const out = scan([readHop('h1'), readHop('h2', { args: { account: 'acct-2' } })]);
  assert.equal(out.flags.length, 0);
});

test('firing blocked: (b) prior not verified-success is a retry, not a flag', () => {
  const out = scan([readHop('h1', { observationStatus: 'error' }), readHop('h2')]);
  assert.equal(out.flags.length, 0);
  assert.equal(out.retryCandidates.length, 1);
  const out2 = scan([readHop('h1', { observationStatus: 'conflicting' }), readHop('h2')]);
  assert.equal(out2.flags.length, 0);
  assert.equal(out2.retryCandidates.length, 1);
});

test('firing blocked: (c) intervening intersecting write is a fresh read', () => {
  const out = scan([
    readHop('h1'),
    { id: 'w1', tool: 'write_balance', args: { account: 'acct-1' }, hopClass: 'write', observationStatus: 'verified-success', result: 'ok', effectFootprint: ['account.balance'] },
    readHop('h2'),
  ]);
  assert.equal(out.flags.length, 0);
  assert.equal(out.guardExemptCandidates.length, 1);
  assert.equal(out.guardExemptCandidates[0].guardResult, 'intersecting-write-exempt');
});

test('firing survives: (c) unrelated intervening write does not block', () => {
  const out = scan([
    readHop('h1'),
    { id: 'w1', tool: 'write_note', args: { note: 'hi' }, hopClass: 'write', observationStatus: 'verified-success', result: 'ok', effectFootprint: ['notes.body'] },
    readHop('h2'),
  ]);
  assert.equal(out.flags.length, 1);
  assert.equal(out.flags[0].guardResult, 'unrelated-write');
});

test('firing blocked: (d) declared poll exemption; inferred intent never exempts', () => {
  const decl = [{ id: 'wait-1', maxPolls: 5, backoff: '1s' }];
  const out = scan([readHop('h1'), readHop('h2', { pollDeclarationId: 'wait-1' })], { pollDeclarations: decl });
  assert.equal(out.flags.length, 0);
  const out2 = scan([readHop('h1'), readHop('h2', { tool: 'read_balance', looksLikePolling: true })]);
  assert.equal(out2.flags.length, 1); // inferred intent is never an exemption
  const out3 = scan([readHop('h1'), readHop('h2')], { pollableTools: ['read_balance'] });
  assert.equal(out3.flags.length, 0); // tool marked pollable IS a declaration
  assert.throws(() => scan([readHop('h1'), readHop('h2', { pollDeclarationId: 'nope' })]),
    /unknown poll declaration/);
  assert.throws(() => scan([readHop('h1')], { pollDeclarations: [{ id: 'bad', backoff: '1s' }] }),
    /bounded poll budget/);
});

test('distance recorded, not thresholded: repeat 40 hops later still fires', () => {
  const hops = [readHop('h1')];
  for (let i = 0; i < 39; i += 1) hops.push(readHop(`f${i}`, { tool: `other_${i}`, args: { account: `x${i}` }, readSet: [] }));
  hops.push(readHop('h2'));
  const out = scan(hops);
  assert.equal(out.flags.length, 1);
  assert.equal(out.flags[0].distance, 40);
});

// --- Divergence 2/3: verified-only, sub-type separation --------------------

test('divergence 3: same-result and changed-result counted separately, never merged', () => {
  const out = scan([
    readHop('h1'), readHop('h2'),
    readHop('h3', { result: { balance: 99 } }),
  ]);
  // h2 repeats h1 (same); h3 repeats h2's call with a changed result
  assert.equal(out.flags.length, 2);
  assert.equal(out.countsBySubType['repeat-same-result'], 1);
  assert.equal(out.countsBySubType['repeat-changed-result'], 1);
  assert.equal(out.flags[1].subType, 'repeat-changed-result');
});

// --- Guard honesty clause ---------------------------------------------------

test('guard-unknown: no declared read set emits a below-rule-grade flag, not "no write"', () => {
  const out = scan([readHop('h1', { readSet: undefined }), readHop('h2', { readSet: undefined })]);
  assert.equal(out.flags.length, 1);
  assert.equal(out.flags[0].guardResult, 'unknown-undeclared');
  assert.equal(gradeFlagEvent(out.flags[0]), 'guard-unknown');
});

test('guard-unknown reporting: >50% means unmeasured, not zero', () => {
  const flags = [
    { guardResult: 'unknown-undeclared' }, { guardResult: 'unknown-undeclared' }, { guardResult: 'none' },
  ];
  const r = reportRoutineGuardUnknown({ routineId: 'r1', flags });
  assert.equal(r.guardUnknownShare, 2 / 3);
  assert.equal(r.rateVerdict, 'unmeasured, not zero');
  const r2 = reportRoutineGuardUnknown({ routineId: 'r2', flags: [{ guardResult: 'unknown-undeclared' }, { guardResult: 'none' }] });
  assert.equal(r2.rateVerdict, 'measured');
  const r3 = reportRoutineGuardUnknown({ routineId: 'r3', flags: [] });
  assert.equal(r3.rateVerdict, 'unmeasured, not zero');
});

test('read-set coverage: below ~50% fails the rule-grade reading', () => {
  assert.match(readSetCoverage([{ tool: 'a', readSet: ['x.y'] }, { tool: 'b' }, { tool: 'c' }]).ruleGradeReading, /FAILED/);
  assert.equal(readSetCoverage([]).coverage, null);
  assert.match(readSetCoverage([]).ruleGradeReading, /unmeasured/);
});

// --- Write-repeat, parallel duplicates, alternating ------------------------

test('write-repeat: prior write is NOT an intervening write; no auto-skip', () => {
  const w = (id) => ({ id, tool: 'set_flag', args: { flag: 'on' }, hopClass: 'write', observationStatus: 'verified-success', result: 'ok', readSet: ['flags.on'], effectFootprint: ['flags.on'] });
  const out = scan([w('w1'), w('w2')]);
  assert.equal(out.flags.length, 1);
  assert.equal(out.flags[0].subType, 'write-repeat');
  assert.equal(out.countsBySubType['write-repeat'], 1);
  assert.throws(() => refuseLiveIntervention({ action: 'auto-skip' }), /REFUSED/);
  assert.throws(() => detectStepRepetition({ trajectoryId: 't', hops: [], autoSkip: true }), /REFUSED/);
});

test('parallel duplicates in the SAME response are a separate anomaly, not this flag', () => {
  const out = scan([
    readHop('h1', { batchId: 'resp-1' }),
    readHop('h2', { batchId: 'resp-1' }),
  ]);
  assert.equal(out.flags.length, 0);
  assert.equal(out.duplicateInBatch.length, 1);
  assert.equal(out.duplicateInBatch[0].eventType, 'duplicate-in-batch');
  assert.deepEqual(out.duplicateInBatch[0].hopIds, ['h1', 'h2']);
  // Same calls in DIFFERENT responses: the second has a verified prior.
  const out2 = scan([
    readHop('h1', { batchId: 'resp-1' }),
    readHop('h2', { batchId: 'resp-2' }),
  ]);
  assert.equal(out2.flags.length, 1);
  assert.equal(out2.duplicateInBatch.length, 0);
});

test('alternating A-B-A-B is two flags, unless a write intersects inputs', () => {
  const a = (id) => readHop(id, { tool: 'read_a', args: { k: 'a' }, readSet: ['res.a'], result: 'A' });
  const b = (id) => readHop(id, { tool: 'read_b', args: { k: 'b' }, readSet: ['res.b'], result: 'B' });
  const out = detectStepRepetition({ trajectoryId: 't', hops: [a('a1'), b('b1'), a('a2'), b('b2')] });
  assert.equal(out.flags.length, 2);
  assert.deepEqual(out.flags.map((f) => f.hopId), ['a2', 'b2']);
});

// --- Polling budget, field downgrade, spec violations, ledger-only ----------

test('poll budget exceeded fires a separate budget event, not this flag', () => {
  const decl = [{ id: 'wait-1', maxPolls: 2, backoff: '1s' }];
  const hops = [readHop('h1'), readHop('p1', { pollDeclarationId: 'wait-1' }), readHop('p2', { pollDeclarationId: 'wait-1' }), readHop('p3', { pollDeclarationId: 'wait-1' })];
  const out = scan(hops, { pollDeclarations: decl });
  assert.equal(out.flags.length, 0);
  assert.equal(out.budgetEvents.length, 1);
  assert.equal(out.budgetEvents[0].eventType, 'poll-budget-exceeded');
  assert.equal(out.budgetEvents[0].pollCount, 3);
  assert.equal(out.budgetEvents[0].maxPolls, 2);
});

test('field-completeness downgrade: missing any required field is judge-grade', () => {
  const out = scan([readHop('h1'), readHop('h2')]);
  const complete = out.flags[0];
  assert.equal(gradeFlagEvent(complete), 'rule-grade');
  const missing = { ...complete };
  delete missing.distance;
  assert.equal(gradeFlagEvent(missing), 'judge-grade');
  assert.equal(validateFlagEvent(missing).valid, false);
});

test('spec-violation counting: a flag counted on a non-verified prior is a violation', () => {
  const fake = { hopId: 'h9', priorObservationStatus: 'error', guardResult: 'none' };
  assert.equal(countSpecViolations([fake]).count, 1);
  assert.deepEqual(countSpecViolations([fake]).violatingHopIds, ['h9']);
  const out = scan([readHop('h1'), readHop('h2')]);
  assert.equal(countSpecViolations(out.flags).count, 0);
});

test('divergence 4 ledger-only: live threshold, nudge, handler all refused', () => {
  assert.throws(() => refuseLiveIntervention({ action: 'nudge' }), /REFUSED/);
  assert.throws(() => refuseLiveIntervention({ action: 'handler' }), /REFUSED/);
  assert.throws(() => refuseLiveIntervention({ action: 'live-threshold' }), /REFUSED/);
  assert.throws(() => detectStepRepetition({ trajectoryId: 't', hops: [], liveThreshold: 5 }), /REFUSED/);
  assert.throws(() => detectStepRepetition({ trajectoryId: 't', hops: [], nudge: 'advance' }), /REFUSED/);
  assert.deepEqual(assertLedgerOnly({}), { mode: 'ledger-only' });
});

test('trajectory scope: hops from another trajectory throw, never merge', () => {
  assert.throws(() => detectStepRepetition({
    trajectoryId: 't1',
    hops: [readHop('h1'), readHop('h2', { trajectoryId: 't2' })],
  }), /never spans trajectories/);
});

test('scan is pure: input hops are not mutated', () => {
  const hops = [readHop('h1'), readHop('h2')];
  const frozen = JSON.parse(JSON.stringify(hops));
  scan(hops);
  assert.deepEqual(JSON.parse(JSON.stringify(hops)), frozen);
});
