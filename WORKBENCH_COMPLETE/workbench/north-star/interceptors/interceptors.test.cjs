'use strict';
/* Tests for interceptors.cjs — SEP-2624 port decisions.
 * Run: node interceptors.test.cjs  (exit 0 on pass, Node built-ins only)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  InterceptorChain, InterceptorError, ChainRefusedError,
  CODES, METHODS, isTimeoutError, redactPayload,
} = require('./interceptors.cjs');

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
