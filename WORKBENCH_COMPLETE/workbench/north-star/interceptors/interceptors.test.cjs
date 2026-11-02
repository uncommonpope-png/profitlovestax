'use strict';
/* Tests for interceptors.cjs — SEP-2624 port decisions.
 * Run: node interceptors.test.cjs  (exit 0 on pass, Node built-ins only)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  InterceptorChain, InterceptorError, ChainRefusedError,
  CODES, METHODS, isTimeoutError, redactPayload,
  CANCELLATION_TRIPLE, cancellationPageSaysMustNotRespond,
  serverCancelledExpected, serverCancelledAbsenceVerdict,
  sessionCloseCancels, modernOnlyLegacyResponse,
  sessionClosedImpliesAllCancelled, INITIALIZE_NON_CANCELLABILITY_2026,
  canPoolObservations, AUDIT_TUPLE_FIELDS, validateAuditTuple,
  makeAbortAuditEntry, normalizeSignalForm, computeW,
  classifyCancelObservation, AbortProofSet,
  claimServerStoppedFromMessageSilence, evaluateHttpAbort,
  isProtocolObservation, JSON_SERVER_OBLIGATION, TS_V2_MECHANISM,
  runtimeSignalStatus, nodeSignalPresent, NODE_HANDLER_EDGES,
  gate3Abortable,
} = require('./interceptors.cjs');

// --- Batches 181 / 184 / 186 / 188: cancellation + abort audit ---

const stdioObs = (over = {}) => ({
  tool: 't1', mode: 'fast', transport: 'stdio', era: '2025',
  levelTimeoutRemainingMs: 10000, wMs: 1000, eventsAfterCancel: [],
  ...over,
});

test('A: cancellation triple precision — page says SHOULD, MUST lives on transport page', () => {
  assert.equal(CANCELLATION_TRIPLE.serverStopProcessing, 'SHOULD');
  assert.equal(CANCELLATION_TRIPLE.serverNotSendResponse, 'SHOULD (cancellation page)');
  assert.equal(cancellationPageSaysMustNotRespond(), false);
  assert.match(CANCELLATION_TRIPLE.mustNotRespondSource, /transport page/);
  assert.deepEqual(CANCELLATION_TRIPLE.mayIgnoreCases,
    ['request unknown', 'processing already completed', 'request cannot be cancelled']);
  assert.equal(CANCELLATION_TRIPLE.clientLateResponse, 'SHOULD ignore');
});

test('B: server-sent cancelled narrowed to subscription teardown; absence never a failed abort', () => {
  assert.equal(serverCancelledExpected({ era: '2026', purpose: 'tool-call' }), false);
  assert.equal(serverCancelledExpected({ era: '2026', purpose: 'subscription-teardown' }), true);
  assert.equal(serverCancelledExpected({ era: '2025', purpose: 'tool-call' }), false);
  assert.equal(serverCancelledAbsenceVerdict(), 'not-a-failure');
});

test('B: session channels gone on 2026; per-request cancellation only', () => {
  assert.equal(sessionCloseCancels({ era: '2026' }), false);
  assert.equal(sessionCloseCancels({ era: '2025' }), true);
  assert.equal(modernOnlyLegacyResponse('GET'), 405);
  assert.equal(modernOnlyLegacyResponse('DELETE'), 405);
  assert.equal(sessionClosedImpliesAllCancelled({ era: '2026' }), false);
  assert.match(INITIALIZE_NON_CANCELLABILITY_2026, /moot/);
});

test('B: stdio observations pool across eras; HTTP observations do not', () => {
  const s25 = { tool: 't', mode: 'm', transport: 'stdio', era: '2025' };
  const s26 = { tool: 't', mode: 'm', transport: 'stdio', era: '2026' };
  const h25 = { tool: 't', mode: 'm', transport: 'http', era: '2025' };
  const h26 = { tool: 't', mode: 'm', transport: 'http', era: '2026' };
  assert.equal(canPoolObservations(s25, s26), true);
  assert.equal(canPoolObservations(h25, h26), false);
  assert.equal(canPoolObservations(s25, { ...s25, mode: 'other' }), false);
});

test('C: audit tuple requires all six fields', () => {
  assert.deepEqual(AUDIT_TUPLE_FIELDS,
    ['era', 'transport', 'signalForm', 'mode', 'wFormula', 'frozenBaselineVersion']);
  const full = {
    era: '2026', transport: 'http', signalForm: 'POST abort', mode: 'fast',
    wFormula: 'p99 if n>=1000 else 2xp95', frozenBaselineVersion: 'v1',
  };
  assert.equal(validateAuditTuple(full).valid, true);
  const partial = validateAuditTuple({ era: '2026', transport: 'http' });
  assert.equal(partial.valid, false);
  assert.deepEqual(partial.missing, ['signalForm', 'mode', 'wFormula', 'frozenBaselineVersion']);
  assert.throws(() => makeAbortAuditEntry({ era: '2026' }), /missing/);
  assert.equal(makeAbortAuditEntry({ ...full, tool: 't1' }).signalForm, 'POST abort');
});

test('D: W formula — frozen p99 at n>=1000, else 2x frozen p95', () => {
  assert.equal(computeW({ nMode: 1000, frozenP99: 800, frozenP95: 400 }), 800);
  assert.equal(computeW({ nMode: 999, frozenP99: 800, frozenP95: 400 }), 800);
  assert.equal(computeW({ nMode: 10, frozenP99: 800, frozenP95: 400 }), 800);
  assert.equal(computeW({ nMode: 10, frozenP99: 900, frozenP95: 300 }), 600);
  assert.throws(() => computeW({ nMode: 10, frozenP99: 0, frozenP95: 300 }), /positive/);
});

test('D: truncated observation is inconclusive and W is never shortened', () => {
  const res = classifyCancelObservation(stdioObs({ levelTimeoutRemainingMs: 500, wMs: 1000 }));
  assert.equal(res.classification, 'truncated-inconclusive');
  assert.equal(res.wMs, 1000); // W kept whole, not shortened to 500
  assert.equal(res.countsAsSilence, false);
});

test('D: progress after cancel breaks silence, does not extend W, is not a disproof', () => {
  const res = classifyCancelObservation(stdioObs({ eventsAfterCancel: [{ type: 'progress' }] }));
  assert.equal(res.classification, 'race-inconclusive');
  assert.equal(res.wMs, 1000);
  assert.equal(res.wExtended, false);
  assert.equal(res.isDisproof, false);
});

test('D: three silences prove; one silence does not', () => {
  const set = new AbortProofSet({ tool: 't1', mode: 'fast', transport: 'stdio', era: '2025' });
  set.add(stdioObs());
  assert.equal(set.status(), 'DECLARED');
  set.add(stdioObs());
  set.add(stdioObs());
  assert.equal(set.status(), 'PROVEN-negatively');
});

test('D: late response demotes a counted silence; set must regain three', () => {
  const set = new AbortProofSet({ tool: 't1', mode: 'fast', transport: 'stdio', era: '2025' });
  const ids = [set.add(stdioObs()), set.add(stdioObs()), set.add(stdioObs())];
  assert.equal(set.status(), 'PROVEN-negatively');
  const amended = set.amend(ids[0], stdioObs({
    eventsAfterCancel: [{ type: 'late-response', afterW: true }],
  }));
  assert.equal(amended.classification, 'demoted');
  assert.equal(set.status(), 'DECLARED');
  set.add(stdioObs());
  assert.equal(set.status(), 'PROVEN-negatively');
});

test('D: late responses on >=2 observations revert to DECLARED and require a fresh set', () => {
  const set = new AbortProofSet({ tool: 't1', mode: 'fast', transport: 'stdio', era: '2025' });
  set.add(stdioObs({ eventsAfterCancel: [{ type: 'late-response', afterW: true }] }));
  set.add(stdioObs({ eventsAfterCancel: [{ type: 'late-response', afterW: true }] }));
  set.add(stdioObs());
  assert.equal(set.status(), 'DECLARED');
  assert.equal(set.requiresFreshSet(), true);
  const fresh = set.freshSet();
  assert.equal(fresh.status(), 'DECLARED');
  assert.equal(fresh.counts().total, 0);
});

test('D: positive disproof is sticky and distinct from a bare late response', () => {
  const bare = classifyCancelObservation(stdioObs({
    eventsAfterCancel: [{ type: 'late-response', afterW: true }],
  }));
  assert.equal(bare.isDisproof, false);
  const set = new AbortProofSet({ tool: 't1', mode: 'fast', transport: 'stdio', era: '2025' });
  set.add(stdioObs());
  set.add(stdioObs());
  set.add(stdioObs());
  assert.equal(set.status(), 'PROVEN-negatively');
  set.add(stdioObs({ eventsAfterCancel: [{ type: 'side-effect', toolReadOnly: true }] }));
  assert.equal(set.status(), 'DISPROVEN');
  set.add(stdioObs());
  assert.equal(set.status(), 'DISPROVEN'); // sticky: silences do not clear it
  assert.throws(() => set.freshSet(), /sticky/);
  // Attributable post-cancel work message is also a disproof.
  assert.equal(classifyCancelObservation(stdioObs({
    eventsAfterCancel: [{ type: 'post-cancel-work-message', attributable: true }],
  })).classification, 'positive-disproof');
  // Unattributed post-cancel message breaks silence but is not a disproof.
  const unattributed = classifyCancelObservation(stdioObs({
    eventsAfterCancel: [{ type: 'post-cancel-work-message', attributable: false }],
  }));
  assert.equal(unattributed.classification, 'race-inconclusive');
  assert.equal(unattributed.isDisproof, false);
});

test('D: proof set rejects an observation from a different tool/mode/transport/era', () => {
  const set = new AbortProofSet({ tool: 't1', mode: 'fast', transport: 'stdio', era: '2025' });
  assert.throws(() => set.add(stdioObs({ era: '2026' })), /does not match/);
  assert.throws(() => set.add(stdioObs({ transport: 'http' })), /does not match/);
});

test('E: 2026 HTTP read-only gets client-abandonment, never server-stopped from silence', () => {
  assert.equal(claimServerStoppedFromMessageSilence().valid, false);
  const ro = evaluateHttpAbort({ toolReadOnly: true, clientAbortedPost: true });
  assert.equal(ro.claim, 'PROVEN-client-abandonment');
  assert.equal(ro.serverStoppedClaimed, false);
  assert.match(ro.residualRisk, /server load/);
  const wr = evaluateHttpAbort({ toolReadOnly: false, clientAbortedPost: true });
  assert.equal(wr.claim, 'not-applicable');
  assert.match(wr.reason, /never-hedge-commits/);
  assert.deepEqual(isProtocolObservation('server-logs'), {
    isProtocol: false, reason: 'operator-side evidence, not a client-side protocol observation',
  });
  assert.equal(isProtocolObservation('side-effect-absence').isProtocol, true);
});

test('F: 2026 HTTP signal form is single-valued POST abort (no SSE/JSON split)', () => {
  for (const label of ['stream-close', 'JSON abort', 'SSE stream-close', 'notification']) {
    const norm = normalizeSignalForm({ era: '2026', transport: 'http', signalForm: label });
    assert.equal(norm.signalForm, 'POST abort');
  }
  assert.equal(normalizeSignalForm({ era: '2026', transport: 'http', signalForm: 'POST abort' }).relabeledFrom, null);
  assert.equal(normalizeSignalForm({ era: '2026', transport: 'http', signalForm: 'stream-close' }).relabeledFrom, 'stream-close');
  // Post-response subscription teardown keeps stream-close (that stream existed).
  assert.equal(normalizeSignalForm({
    era: '2026', transport: 'http', signalForm: 'stream-close', purpose: 'subscription-teardown',
  }).signalForm, 'stream-close');
  // Stdio keeps notification.
  assert.equal(normalizeSignalForm({ era: '2025', transport: 'stdio', signalForm: 'notification' }).signalForm, 'notification');
});

test('G: JSON obligation is plausible-but-unscoped, never a verbatim spec rule', () => {
  assert.equal(JSON_SERVER_OBLIGATION.action, 'abort in-flight POST');
  assert.equal(JSON_SERVER_OBLIGATION.verbatimJsonRule, false);
  assert.match(JSON_SERVER_OBLIGATION.obligation, /plausible-but-unscoped/);
  assert.equal(JSON_SERVER_OBLIGATION.timing, 'NOT-GUARANTEED');
  assert.equal(JSON_SERVER_OBLIGATION.limits.length, 3);
  assert.match(JSON_SERVER_OBLIGATION.csharpStatelessTokenNote, /mechanism evidence only/);
});

test('H: TS v2 mechanism is exchange-wide, runtime-conditioned, typedoc-provenanced', () => {
  assert.equal(TS_V2_MECHANISM.transport, 'PerRequestHTTPServerTransport');
  assert.match(TS_V2_MECHANISM.scope, /response-form-independent/);
  assert.match(TS_V2_MECHANISM.condition, /runtime provides an abort signal/);
  assert.match(TS_V2_MECHANISM.provenance, /source lines were NOT read/);
  assert.match(TS_V2_MECHANISM.provenance, /source wins/);
  assert.match(TS_V2_MECHANISM.legacyOutOfScope, /StreamableHTTPServerTransport/);
  assert.match(TS_V2_MECHANISM.connectionClosedRejection, /not a forced kill/);
  assert.equal(TS_V2_MECHANISM.httpServerStoppedQuestion, 'CLOSED for plain tools/call');
  assert.match(TS_V2_MECHANISM.taskBoundary, /NOT ruled on/);
});

test('J: Node row splits by mount — never a blanket Node yes; Hono unverified', () => {
  assert.equal(runtimeSignalStatus({ runtime: 'Workers' }).status, 'signal-native');
  assert.equal(runtimeSignalStatus({ runtime: 'Deno' }).status, 'signal-native');
  assert.equal(runtimeSignalStatus({ runtime: 'Bun' }).status, 'signal-native');
  assert.match(runtimeSignalStatus({ runtime: 'Node', mount: 'toNodeHandler-plain' }).status, /synthesized/);
  assert.match(runtimeSignalStatus({ runtime: 'Node', mount: 'toNodeHandler-Express' }).status, /synthesized/);
  assert.match(runtimeSignalStatus({ runtime: 'Node', mount: 'toNodeHandler-Fastify' }).status, /synthesized/);
  assert.equal(runtimeSignalStatus({ runtime: 'Node', mount: 'Hono' }).status, 'runtime-dependent, UNVERIFIED');
  assert.equal(runtimeSignalStatus({ runtime: 'Node' }).status, 'unresolved');
  assert.equal(nodeSignalPresent({ path: 'toNodeHandler' }), true);
  assert.equal(nodeSignalPresent({ path: 'toWebRequest', signalOption: true }), true);
  assert.equal(nodeSignalPresent({ path: 'toWebRequest', signalOption: false }), false);
  assert.equal(nodeSignalPresent({ path: 'toWebRequest' }), false);
  assert.equal(nodeSignalPresent({ path: 'Hono' }), 'unverified');
  assert.match(NODE_HANDLER_EDGES.trigger, /res 'close' ONLY/);
  assert.equal(NODE_HANDLER_EDGES.halfOpenSocketAborts, false);
  assert.equal(NODE_HANDLER_EDGES.closeAfterFullStreamAborts, false);
  assert.match(NODE_HANDLER_EDGES.nodeSubGap, /CLOSED/);
});

test('K: gate 3 is class-appropriate; other gates unchanged by reference only', () => {
  assert.deepEqual(gate3Abortable({ transport: 'stdio', proof: 'PROVEN-negatively' }),
    { abortable: true, proofClass: 'stdio >= 3-silence set' });
  assert.equal(gate3Abortable({ transport: 'stdio', proof: 'DECLARED' }).abortable, false);
  assert.deepEqual(gate3Abortable({ transport: 'http', era: '2026', toolReadOnly: true, proof: 'PROVEN-client-abandonment' }).abortable, true);
  assert.equal(gate3Abortable({ transport: 'http', era: '2026', toolReadOnly: true, proof: 'PROVEN-server-stopped' }).abortable, false);
  assert.equal(gate3Abortable({ transport: 'http', era: '2026', toolReadOnly: false, proof: 'PROVEN-negatively' }).abortable, false);
  assert.equal(gate3Abortable({ transport: 'http', era: '2025', proof: 'PROVEN-negatively' }).abortable, true);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (payload) => ({ valid: false, severity: 'error', message: 'blocked' });

test('sending phase order: mutate -> validate -> send, validator sees mutated payload', async () => {
  const order = [];
  const chain = new InterceptorChain();
  chain.add({ name: 'mut', type: 'mutation', mutate: (p) => { order.push('mutate'); return { ...p, stamped: true }; } });
  chain.add({ name: 'val', type: 'validation', validate: (p) => { order.push('validate'); assert.equal(p.stamped, true); return { valid: true }; } });
  chain.add({ name: 'obs', type: 'observability', observe: (p) => { order.push('observe'); assert.equal(p.stamped, true); } });
  const res = await chain.run('sending', { a: 1 }, { send: (p) => { order.push('send'); return 'sent'; } });
  assert.equal(res.status, 'success');
  assert.deepEqual(order, ['mutate', 'validate', 'observe', 'send']);
  assert.equal(res.payload.stamped, true);
});

test('receiving phase order: receive -> validate -> mutate -> process', async () => {
  const order = [];
  const chain = new InterceptorChain();
  chain.add({ name: 'val', type: 'validation', validate: () => { order.push('validate'); return { valid: true }; } });
  chain.add({ name: 'mut', type: 'mutation', mutate: (p) => { order.push('mutate'); return { ...p, done: true }; } });
  const res = await chain.run('receiving', null, {
    receive: () => { order.push('receive'); return { x: 1 }; },
    process: (p) => { order.push('process'); assert.equal(p.done, true); return 'processed'; },
  });
  // Validator runs twice on receiving: initial validation, then the local
  // re-validation after mutation (Hole 1 hardening) before processing.
  assert.deepEqual(order, ['receive', 'validate', 'mutate', 'validate', 'process']);
  assert.equal(res.output, 'processed');
});

test('mutations sorted by priorityHint only (validators run parallel, unordered)', async () => {
  const order = [];
  const chain = new InterceptorChain();
  chain.add({ name: 'late', type: 'mutation', priorityHint: 10, mutate: (p) => { order.push('late'); return p; } });
  chain.add({ name: 'early', type: 'mutation', priorityHint: -5, mutate: (p) => { order.push('early'); return p; } });
  await chain.run('sending', {}, {});
  assert.deepEqual(order, ['early', 'late']);
});

test('validation collects multiple failures and rejects -32602 with validationErrors', async () => {
  let sent = false;
  const chain = new InterceptorChain();
  chain.add({ name: 'v1', type: 'validation', validate: () => ({ valid: false, severity: 'error', message: 'first bad' }) });
  chain.add({ name: 'v2', type: 'validation', validate: () => ({ valid: true }) });
  chain.add({ name: 'v3', type: 'validation', validate: () => ({ valid: false, severity: 'error', message: 'second bad' }) });
  await assert.rejects(
    chain.run('sending', {}, { send: () => { sent = true; } }),
    (e) => {
      assert.ok(e instanceof InterceptorError);
      assert.equal(e.code, -32602);
      assert.equal(e.status, 'validation_failed');
      assert.equal(e.data.validationErrors.length, 2);
      assert.deepEqual(e.data.validationErrors.map((x) => x.interceptor), ['v1', 'v3']);
      return true;
    },
  );
  assert.equal(sent, false);
});

test('mutation failure yields -32603 + lastValidPayload and no partial application', async () => {
  let thirdRan = false;
  const chain = new InterceptorChain();
  chain.add({ name: 'm1', type: 'mutation', mutate: (p) => ({ ...p, value: `${p.value}A` }) });
  chain.add({ name: 'm2', type: 'mutation', mutate: () => { throw new Error('boom'); } });
  chain.add({ name: 'm3', type: 'mutation', mutate: (p) => { thirdRan = true; return p; } });
  await assert.rejects(
    chain.run('sending', { value: 'x' }, {}),
    (e) => {
      assert.equal(e.code, -32603);
      assert.equal(e.data.failedInterceptor, 'm2');
      assert.deepEqual(e.data.lastValidPayload, { value: 'xA' });
      return true;
    },
  );
  assert.equal(thirdRan, false);
});

test('third-party mutation refused at registration', () => {
  const chain = new InterceptorChain();
  assert.throws(
    () => chain.add({ name: 'evil', type: 'mutation', source: 'third-party', mutate: (p) => p }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'third-party-mutation',
  );
});

test('server-side reliance refused (constructor and run options)', () => {
  assert.throws(
    () => new InterceptorChain({ serverSideInterceptors: true }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'server-side-reliance',
  );
  const chain = new InterceptorChain();
  assert.rejects(
    chain.run('sending', {}, { relyOnServerInterceptors: true }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'server-side-reliance',
  );
});

test('third-party receiving observability on sensitive results refused; own-client audit allowed', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'spy', type: 'observability', source: 'third-party', observe: () => {} });
  await assert.rejects(
    chain.run('receiving', { secret: 'x' }, { sensitive: true, process: () => 'ok' }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'third-party-receiving-observability',
  );

  const own = new InterceptorChain();
  own.add({ name: 'audit', type: 'validation', mode: 'audit', source: 'own-client', validate: () => fail() });
  const res = await own.run('receiving', { ok: true }, { sensitive: true, process: () => 'done' });
  assert.equal(res.output, 'done');
});

test('re-validation after receiving mutation catches a breaking mutation', async () => {
  let processed = false;
  const chain = new InterceptorChain();
  chain.add({ name: 'shape', type: 'validation', validate: (p) => (p.allowed === true ? { valid: true } : fail()) });
  chain.add({ name: 'breaker', type: 'mutation', mutate: (p) => ({ ...p, allowed: false }) });
  await assert.rejects(
    chain.run('receiving', { allowed: true }, { process: () => { processed = true; } }),
    (e) => e.code === -32602 && e.data.validationErrors[0].interceptor === 'shape',
  );
  assert.equal(processed, false);
});

test('local deadline fires after the final stage (process overruns deadline)', async () => {
  const chain = new InterceptorChain();
  await assert.rejects(
    chain.run('receiving', { a: 1 }, {
      timeoutMs: 50,
      process: async () => { await sleep(150); return 'too late'; },
    }),
    (e) => e.code === -32000 && e.status === 'timeout',
  );
});

test('-32000 parsed as timeout', async () => {
  const chain = new InterceptorChain();
  chain.add({
    name: 'v', type: 'validation',
    validate: () => { throw Object.assign(new Error('Interceptor execution timeout'), { code: -32000 }); },
  });
  await assert.rejects(
    chain.run('sending', {}, {}),
    (e) => e.code === -32000 && e.status === 'timeout',
  );
});

test('Go-style unwrapped deadline signal recognized as timeout', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'm', type: 'mutation', mutate: () => { throw new Error('context deadline exceeded'); } });
  await assert.rejects(
    chain.run('sending', {}, {}),
    (e) => e.code === -32000,
  );
  assert.equal(isTimeoutError(new Error('context deadline exceeded')), true);
  assert.equal(isTimeoutError(Object.assign(new Error('x'), { code: -32000 })), true);
  assert.equal(isTimeoutError(new Error('boom')), false);
});

test('timeoutMs forwarded to interceptor invocations', async () => {
  const seen = [];
  const chain = new InterceptorChain();
  chain.add({ name: 'm', type: 'mutation', mutate: (p, ctx) => { seen.push(ctx.timeoutMs); return p; } });
  chain.add({ name: 'v', type: 'validation', validate: (p, ctx) => { seen.push(ctx.timeoutMs); return { valid: true }; } });
  await chain.run('sending', {}, { timeoutMs: 5000 });
  assert.deepEqual(seen, [5000, 5000]);
});

test('gate audit-promotion refused (add, setMode, and run override)', () => {
  const chain = new InterceptorChain();
  assert.throws(
    () => chain.add({ name: 'gate', type: 'validation', gate: true, mode: 'audit', validate: () => ({ valid: true }) }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'gate-audit-promotion',
  );
  chain.add({ name: 'gate2', type: 'validation', gate: true, validate: () => ({ valid: true }) });
  assert.throws(
    () => chain.setMode('gate2', 'audit'),
    (e) => e instanceof ChainRefusedError && e.refusal === 'gate-audit-promotion',
  );
  assert.rejects(
    chain.run('sending', {}, { overrides: { gate2: { mode: 'audit' } } }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'gate-audit-promotion',
  );
});

test('valid=false blocks regardless of severity (low/info severity still blocks)', async () => {
  let sent = false;
  const chain = new InterceptorChain();
  chain.add({ name: 'v', type: 'validation', validate: () => ({ valid: false, severity: 'info', message: 'low severity, still false' }) });
  await assert.rejects(
    chain.run('sending', {}, { send: () => { sent = true; } }),
    (e) => e.code === -32602 && e.data.validationErrors[0].severity === 'info',
  );
  assert.equal(sent, false);
});

test('audit log redacts PII fields and records mode/failOpen/source', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'v', type: 'validation', validate: () => ({ valid: true }) });
  chain.add({ name: 'm', type: 'mutation', mutate: (p) => p });
  await chain.run('sending', {
    username: 'craig', password: 'hunter2', apiKey: 'sk-123', token: 'tok-1',
    nested: { secret: 's', authHeader: 'Bearer x', keep: 'yes' },
  }, {});
  assert.ok(chain.auditLog.length >= 2);
  for (const entry of chain.auditLog) {
    assert.equal(entry.payload.password, '[REDACTED]');
    assert.equal(entry.payload.apiKey, '[REDACTED]');
    assert.equal(entry.payload.token, '[REDACTED]');
    assert.equal(entry.payload.nested.secret, '[REDACTED]');
    assert.equal(entry.payload.nested.authHeader, '[REDACTED]');
    assert.equal(entry.payload.username, 'craig');
    assert.equal(entry.payload.nested.keep, 'yes');
    assert.equal(entry.mode, 'active');
    assert.equal(entry.failOpen, false);
    assert.equal(entry.source, 'own-client');
  }
  // Direct unit check on the redactor.
  assert.deepEqual(redactPayload({ password: 'p', fine: 1 }), { password: '[REDACTED]', fine: 1 });
});

test('failOpen false on gates (and gate failOpen=true refused)', () => {
  const chain = new InterceptorChain();
  assert.throws(
    () => chain.add({ name: 'g', type: 'validation', gate: true, failOpen: true, validate: () => ({ valid: true }) }),
    (e) => e instanceof ChainRefusedError && e.refusal === 'gate-failopen',
  );
  chain.add({ name: 'g2', type: 'validation', gate: true, validate: () => ({ valid: true }) });
  assert.equal(chain.listInterceptors()[0].failOpen, false);
});

test('audit mode is never a gate: audit validator failure logs, does not block', async () => {
  let sent = false;
  const chain = new InterceptorChain();
  chain.add({ name: 'aud', type: 'validation', mode: 'audit', validate: () => fail() });
  const res = await chain.run('sending', {}, { send: () => { sent = true; return 'ok'; } });
  assert.equal(res.status, 'success');
  assert.equal(sent, true);
  assert.ok(chain.auditLog.some((e) => e.outcome === 'audit-violation'));
});

test('audit-mode mutator computes shadow only, never applies', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'shadow', type: 'mutation', mode: 'audit', mutate: (p) => ({ ...p, changed: true }) });
  const res = await chain.run('sending', { changed: false }, {});
  assert.equal(res.payload.changed, false);
  assert.equal(chain.auditLog[0].outcome, 'audit-shadow');
});

test('fail-open non-gate crash/timeout proceeds (failOpen scope is crash/timeout only)', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'flaky', type: 'validation', failOpen: true, validate: () => { throw new Error('boom'); } });
  const res = await chain.run('sending', {}, {});
  assert.equal(res.status, 'success');
});

test('method names: interceptors/list + interceptor/invoke work; executeChain rejected', async () => {
  const chain = new InterceptorChain();
  chain.add({ name: 'v', type: 'validation', validate: () => ({ valid: true, severity: null, message: null }) });
  chain.add({ name: 'm', type: 'mutation', mutate: (p) => ({ ...p, n: 1 }) });
  assert.equal(METHODS.LIST, 'interceptors/list');
  assert.equal(METHODS.INVOKE, 'interceptor/invoke');
  const list = await chain.dispatch('interceptors/list', {});
  assert.deepEqual(list.interceptors.map((i) => i.name), ['v', 'm']);
  const invoked = await chain.dispatch('interceptor/invoke', { name: 'm', direction: 'sending', payload: {} });
  assert.equal(invoked.mutation.payload.n, 1);
  await assert.rejects(
    chain.dispatch('interceptor/executeChain', {}),
    (e) => e.code === -32601,
  );
  await assert.rejects(
    chain.dispatch('executeChain', {}),
    (e) => e.code === -32601,
  );
  assert.equal(CODES.TIMEOUT, -32000);
  assert.equal(CODES.VALIDATION_FAILED, -32602);
  assert.equal(CODES.MUTATION_FAILED, -32603);
});
