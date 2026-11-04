'use strict';
/* Tests for audit-wire.cjs (Wire Round 1, audit mode only). Only node:assert / node:test. Run: node audit-wire.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert');
const {
  auditToolResult,
  getAuditLog,
  clearAuditLog,
  isAuditWireEnabled,
  PROVENANCE_KEY,
} = require('./audit-wire.cjs');

function deepFreeze(value, seen) {
  if (value === null || typeof value !== 'object' || (seen && seen.has(value))) return value;
  const s = seen || new Set();
  s.add(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], s);
  return Object.freeze(value);
}

// --- Smoke: one synthetic tool call flows through, honestly labelled --------
test('smoke: synthetic tool call records verifier-skip, namespaced provenance, advisory plan level', () => {
  clearAuditLog();
  const before = getAuditLog().length;
  const rec = auditToolResult({
    tool: 'read_file',
    args: { path: 'notes/example.md' },
    output: 'hello from the file',
  });
  assert.equal(rec.ok, true);
  assert.equal(rec.mode, 'audit-only');
  assert.match(rec.action, /no abort/);
  assert.equal(rec.tool, 'read_file');
  // Verifier honestly skipped: local calls carry no trust tuple.
  assert.deepEqual(rec.verifier, { skipped: 'no trust tuple supplied; local tool calls carry none' });
  // Provenance emitted under exactly the one namespaced key, inside the record.
  assert.deepEqual(Object.keys(rec.provenance), [PROVENANCE_KEY]);
  assert.equal(rec.provenance[PROVENANCE_KEY].version, 1);
  assert.equal(rec.provenance[PROVENANCE_KEY].local.tool, 'read_file');
  assert.equal(typeof rec.provenance[PROVENANCE_KEY].local.sourceClass, 'string');
  // Classification recorded alongside (unknown local tool defaults to stranger).
  assert.equal(rec.classification.sourceClass, 'stranger');
  // Plan-executor advisory: a one-node plan sits at level 0, labelled advisory.
  assert.equal(rec.planExecutor.advisory, true);
  assert.deepEqual(rec.planExecutor.levels, [['call']]);
  assert.deepEqual(rec.planExecutor.levelOf, { call: 0 });
  // Audit log contains exactly that record.
  const log = getAuditLog();
  assert.equal(log.length, before + 1);
  assert.equal(log[log.length - 1], rec);
});

// --- No-behavior-change: live output identical, input untouched --------------
test('no-behavior-change: wire on vs off leaves the live string identical and the input deep-equal', () => {
  clearAuditLog();
  // The server seam formats `[name args]\n<output>` and DISCARDS the audit
  // return value. Simulate both sides: with the audit call, and without.
  const formatLive = (tName, tArgs, out) => `[${tName} ${JSON.stringify(tArgs).slice(0, 200)}]\n${String(out).slice(0, 4000)}`;
  const input = { tool: 'read_file', args: { path: 'notes/a.md', nested: { n: 1 } }, output: 'file contents here' };
  const snapshotBefore = JSON.parse(JSON.stringify(input));
  const withWire = formatLive(input.tool, input.args, input.output);
  auditToolResult(input);
  const withoutWire = formatLive(input.tool, input.args, input.output);
  assert.equal(withWire, withoutWire);
  assert.deepEqual(input, snapshotBefore);
});

test('no-behavior-change: deep-frozen input does not throw and is not mutated', () => {
  clearAuditLog();
  const input = deepFreeze({ tool: 'list_files', args: { path: '.', nested: { x: [1, 2] } }, output: 'a.md\nb.md' });
  let rec;
  assert.doesNotThrow(() => { rec = auditToolResult(input); });
  assert.equal(rec.ok, true);
  assert.equal(rec.tool, 'list_files');
  assert.deepEqual(input.args.nested.x, [1, 2]);
  assert.equal(Object.isFrozen(input), true);
});

// --- Fail-open: hostile input never throws, failure is recorded -------------
test('fail-open: null/undefined output, circular args, missing tool name never throw', () => {
  clearAuditLog();
  const circular = { path: '.' };
  circular.self = circular;
  const cases = [
    { tool: 'read_file', args: { path: 'x' }, output: null },
    { tool: 'read_file', args: { path: 'x' }, output: undefined },
    { tool: 'read_file', args: circular, output: 'ok' },
    { args: { path: 'x' }, output: 'ok' },
    { tool: '', args: {}, output: 'ok' },
  ];
  for (const c of cases) {
    let rec;
    assert.doesNotThrow(() => { rec = auditToolResult(c); });
    assert.equal(typeof rec, 'object');
    assert.equal(rec.mode, 'audit-only');
    assert.match(rec.action, /no abort/);
  }
  // Circular args are snapshotted with a marker, not thrown on.
  const circRec = getAuditLog()[2];
  assert.equal(circRec.argsSnapshot.self, '[circular]');
  // Missing tool name is recorded as null, not invented.
  assert.equal(getAuditLog()[3].tool, null);
  assert.equal(getAuditLog()[4].tool, null);
});

test('fail-open: bare hostile calls (null, number, no args) record failure instead of throwing', () => {
  clearAuditLog();
  let r1, r2, r3;
  assert.doesNotThrow(() => { r1 = auditToolResult(null); });
  assert.doesNotThrow(() => { r2 = auditToolResult(42); });
  assert.doesNotThrow(() => { r3 = auditToolResult(); });
  for (const r of [r1, r2, r3]) {
    assert.equal(r.ok, false);
    assert.equal(typeof r.error, 'string');
    assert.match(r.action, /no abort/);
  }
  assert.equal(getAuditLog().length, 3);
});

// --- Provenance namespacing --------------------------------------------------
test('provenance namespacing: exactly one namespaced key, no bare keys, on a copy only', () => {
  clearAuditLog();
  const input = { tool: 'web_fetch', args: { url: 'https://example.com' }, output: 'page text' };
  const rec = auditToolResult(input);
  assert.deepEqual(Object.keys(rec.provenance), [PROVENANCE_KEY]);
  assert.equal('obsidianBaseUrlHost' in rec.provenance, false);
  assert.equal('obsidianBaseUrlSource' in rec.provenance, false);
  // The live input carries no _meta: provenance lives in the record copy only.
  assert.equal('_meta' in input, false);
  assert.equal(rec.provenance[PROVENANCE_KEY].local.sourceClass, rec.classification.sourceClass);
});

// --- Verifier: runs only with a caller-supplied tuple, never invents one -----
test('verifier: supplied trust tuple validates shape only; no trust verdict is made', () => {
  clearAuditLog();
  const rec = auditToolResult({
    tool: 'read_file',
    args: { path: 'x' },
    output: 'ok',
    trustTuple: { identifier: 'example-server', protocolRevision: '2026-01-01', revisionString: 'r1' },
  });
  assert.equal(rec.verifier.run, true);
  assert.deepEqual(rec.verifier.tuple, { identifier: 'example-server', protocolRevision: '2026-01-01', revisionString: 'r1' });
  assert.equal(typeof rec.verifier.tupleKey, 'string');
  assert.match(rec.verifier.trustJudgment, /no trust verdict is made/);
  assert.equal('trusted' in rec.verifier, false);
  assert.equal('trustworthy' in rec.verifier, false);
});

test('verifier: malformed tuple is recorded as a verifier failure, not thrown', () => {
  clearAuditLog();
  let rec;
  assert.doesNotThrow(() => {
    rec = auditToolResult({ tool: 'read_file', args: {}, output: 'ok', trustTuple: { protocolRevision: '2026-01-01' } });
  });
  assert.equal(rec.verifier.ok, false);
  assert.equal(typeof rec.verifier.error, 'string');
});

// --- Env gating ---------------------------------------------------------------
test('env gating: enabled only when NORTHSTAR_AUDIT_WIRE is exactly "1"', () => {
  const saved = process.env.NORTHSTAR_AUDIT_WIRE;
  try {
    delete process.env.NORTHSTAR_AUDIT_WIRE;
    assert.equal(isAuditWireEnabled(), false);
    process.env.NORTHSTAR_AUDIT_WIRE = '1';
    assert.equal(isAuditWireEnabled(), true);
    process.env.NORTHSTAR_AUDIT_WIRE = '0';
    assert.equal(isAuditWireEnabled(), false);
    process.env.NORTHSTAR_AUDIT_WIRE = '';
    assert.equal(isAuditWireEnabled(), false);
    process.env.NORTHSTAR_AUDIT_WIRE = 'true';
    assert.equal(isAuditWireEnabled(), false);
  } finally {
    if (saved === undefined) delete process.env.NORTHSTAR_AUDIT_WIRE;
    else process.env.NORTHSTAR_AUDIT_WIRE = saved;
  }
});

// --- Audit log: append-only in memory, copy-on-read ---------------------------
test('audit log: append-only, clearable, and getAuditLog returns a copy', () => {
  clearAuditLog();
  auditToolResult({ tool: 'read_file', args: {}, output: 'one' });
  auditToolResult({ tool: 'read_file', args: {}, output: 'two' });
  assert.equal(getAuditLog().length, 2);
  const copy = getAuditLog();
  copy.push({ fake: true });
  assert.equal(getAuditLog().length, 2);
  clearAuditLog();
  assert.equal(getAuditLog().length, 0);
});

// --- Positional form (the server seam's call shape) ---------------------------
test('positional form: auditToolResult(tool, args, output) matches the object form', () => {
  clearAuditLog();
  const rec = auditToolResult('read_file', { path: 'notes/a.md' }, 'contents');
  assert.equal(rec.ok, true);
  assert.equal(rec.tool, 'read_file');
  assert.deepEqual(rec.verifier, { skipped: 'no trust tuple supplied; local tool calls carry none' });
  assert.deepEqual(Object.keys(rec.provenance), [PROVENANCE_KEY]);
  assert.equal(rec.planExecutor.advisory, true);
});
