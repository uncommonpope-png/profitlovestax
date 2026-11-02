'use strict';
/**
 * SEP-2624 interceptor chain port — LOCAL chain implementation.
 *
 * Source decisions (north-star research batches, seen.md):
 *   Batch 43 (Nov 1 full read), 132, 133, 143, 144, 145, 146, 147, 148.
 *   SEP-2624 itself is Draft, open PR #2624 (successor to #1763).
 *
 * What this module implements, in one place:
 *   - Direction-based phase order (never phase-label-based):
 *       sending   = mutate (sequential) -> validate + observe (parallel) -> send
 *       receiving = receive -> validate + observe (parallel) -> mutate (sequential)
 *                   -> re-validate -> process
 *     The re-validation step after a receiving mutation is a LOCAL hardening
 *     (Batch 43 Hole 1): SEP-2624 itself has no re-validation step, so a
 *     receiving mutation in the SEP model reaches processing unvalidated.
 *   - Validation: all failures collected; any blocking failure rejects with
 *     JSON-RPC code -32602 and data.validationErrors[].
 *   - Mutation: failure halts immediately with -32603 and data.lastValidPayload
 *     (chain-local atomicity: the payload reverts to the last valid state;
 *     nothing is sent or processed afterwards, so no partial mutation escapes).
 *   - Refusals enforced in code (not just documented):
 *       * third-party mutation — never runs (own-client mutations only);
 *       * reliance on server-side interceptors — never accepted;
 *       * third-party receiving observability/audit on sensitive results — refused.
 *   - Receiving-path hardening: re-validation after receiving mutation;
 *     the audit trail is local (own-client) only — this module never sends
 *     audit entries anywhere.
 *   - Dual-signal timeout: a local deadline checked after EVERY stage,
 *     including the final stage, plus code-keyed parsing of -32000 and
 *     recognition of unwrapped Go-style deadline/internal signals as timeouts.
 *     timeoutMs is forwarded to every interceptor invocation context.
 *     This module's own timeouts emit -32000 (SEP-2624 draft MUST).
 *   - Gate-mode pinning: a gate interceptor's effective mode is pinned active.
 *     Promoting a gate to audit mode is refused. Audit mode is never a gate:
 *     audit-mode validators log violations without blocking, audit-mode
 *     mutators compute shadow transformations without applying them.
 *   - valid=false blocks regardless of severity (the both-SDK quirk where
 *     valid=false + warn/info-only does not block is NOT imported).
 *   - Audit logging: every interceptor invocation is logged with a
 *     PII-redacted payload copy, resolved mode, failOpen, and source
 *     (SEP-2624 Security Best Practices item 3, "Audit Everything": the SEP
 *     states this as a SHOULD binding ALL invocation logs; this port adopts
 *     it as a MUST for its own logs and says so explicitly).
 *     failOpen is false on every gate interceptor.
 *   - Method names: interceptors/list + interceptor/invoke (the SEP's own
 *     mixed spelling). executeChain is NOT a wire method; dispatching it
 *     (or any unknown method) is rejected with -32601.
 *
 * What this module is NOT: a cross-SDK conformance claim. No C# or Go
 * implementation was run here. The runtime cross-SDK conformance test
 * (per (consumer, server) pair, through the actual chain) is still owed.
 */

const CODES = {
  VALIDATION_FAILED: -32602,
  MUTATION_FAILED: -32603,
  EXECUTION_FAILED: -32603,
  TIMEOUT: -32000,
  METHOD_NOT_FOUND: -32601,
};

const METHODS = {
  LIST: 'interceptors/list',
  INVOKE: 'interceptor/invoke',
};

class InterceptorError extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = 'InterceptorError';
    this.code = code;
    this.data = data || {};
    if (code === -32602) this.status = 'validation_failed';
    else if (code === -32000) this.status = 'timeout';
    else if (code === -32601) this.status = 'method_not_found';
    else this.status = 'mutation_failed';
  }
}

class ChainRefusedError extends Error {
  constructor(refusal, message) {
    super(message);
    this.name = 'ChainRefusedError';
    this.refusal = refusal;
    this.code = 'ERR_REFUSED';
  }
}

function refused(refusal, message) {
  return new ChainRefusedError(refusal, message);
}

/**
 * Dual-signal timeout recognition.
 * Recognizes, as a timeout, any of:
 *   - a JSON-RPC -32000 error (SEP-2624 conformant servers, incl. the C#
 *     server's InterceptorMessageFilter emission — code-keyed only, because
 *     that emission carries no data object and a server-specific message);
 *   - an unwrapped Go-style signal: "context deadline exceeded" /
 *     "deadline exceeded", ETIMEDOUT / DEADLINE_EXCEEDED codes, a TimeoutError
 *     name, timeout===true, or a ChainTimeout status.
 * Message/data keying is deliberately NOT used for -32000 beyond the code:
 * the C# emission proves message/data keying would miss real servers.
 */
function isTimeoutError(err) {
  if (!err || typeof err !== 'object') return false;
  if (err.code === -32000) return true;
  if (err.code === 'ETIMEDOUT' || err.code === 'DEADLINE_EXCEEDED') return true;
  if (err.timeout === true) return true;
  if (err.status === 'timeout' || err.status === 'ChainTimeout') return true;
  if (err.name === 'TimeoutError') return true;
  const msg = String(err.message || '');
  return /deadline|timeout|timed out/i.test(msg);
}

function timeoutError(interceptor, timeoutMs, phase) {
  return new InterceptorError(
    -32000,
    'Interceptor execution timeout',
    { interceptor: interceptor || null, timeoutMs: timeoutMs ?? null, phase: phase || null },
  );
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return structuredClone(value);
  } catch (_e) {
    return JSON.parse(JSON.stringify(value));
  }
}

// A field name is PII-sensitive if it names a password/token/secret/auth/
// credential, or is / is delimited as `key` (covers `key`, `apiKey`,
// `api_key`, `auth-token` via the auth rule, etc.). Over-redaction (e.g. a
// field literally named like a key) is accepted: a redacted log line is safe,
// a leaked one is not.
function isSensitiveKey(key) {
  const lower = String(key).toLowerCase();
  if (/password|passwd|token|secret|auth|credential/.test(lower)) return true;
  if (lower === 'key' || lower === 'apikey') return true;
  return /(^|[_-])key($|[_-])/.test(lower);
}

function redactPayload(value) {
  if (Array.isArray(value)) return value.map(redactPayload);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isSensitiveKey(k) ? '[REDACTED]' : redactPayload(v);
    }
    return out;
  }
  return value;
}

function resolvePriorityHint(entry) {
  return typeof entry.priorityHint === 'number' ? entry.priorityHint : 0;
}

// Mutations ONLY are sorted, by priorityHint ascending (undefined -> 0),
// with a deterministic name tiebreak. Validators and observers run in
// parallel with no ordering claim; their priorityHint values, if any, are
// recorded in descriptors/audit entries, never honoured as order.
function sortMutations(entries) {
  return [...entries].sort((a, b) => {
    const d = resolvePriorityHint(a) - resolvePriorityHint(b);
    if (d !== 0) return d;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}

function isObserverEntry(entry, resolvedMode) {
  return entry.type === 'observability'
    || typeof entry.observe === 'function'
    || resolvedMode === 'audit';
}

class InterceptorChain {
  constructor(options = {}) {
    if (options.serverSideInterceptors === true
      || options.relyOnServerInterceptors === true
      || options.useServerSideInterceptors === true) {
      throw refused(
        'server-side-reliance',
        'Refused: server-side interceptors are never relied on; '
        + 'the client-side chain is the gate.',
      );
    }
    this.interceptors = [];
    this.byName = new Map();
    this.auditLog = [];
    this.defaultTimeoutMs = options.timeoutMs ?? null;
  }

  add(def) {
    if (!def || typeof def.name !== 'string' || def.name === '') {
      throw new Error('Interceptor definition requires a non-empty name');
    }
    if (this.byName.has(def.name)) {
      throw new Error(`Duplicate interceptor name: ${def.name}`);
    }
    const type = def.type;
    if (type !== 'validation' && type !== 'mutation' && type !== 'observability') {
      throw new Error(`Interceptor ${def.name}: unknown type ${String(type)}`);
    }
    const source = def.source || 'own-client';
    if (def.location === 'server' || def.location === 'server-side' || source === 'server') {
      throw refused(
        'server-side-reliance',
        `Refused: interceptor ${def.name} is server-side; `
        + 'server-side interceptors are never relied on.',
      );
    }
    // Refusal 1: third-party mutation, ever (own-client mutations only).
    if (type === 'mutation' && source === 'third-party') {
      throw refused(
        'third-party-mutation',
        `Refused: third-party mutation interceptor ${def.name} is never run; `
        + 'only own-client mutations run.',
      );
    }
    const mode = def.mode || 'active';
    if (mode !== 'active' && mode !== 'audit') {
      throw new Error(`Interceptor ${def.name}: unknown mode ${String(mode)}`);
    }
    const gate = def.gate === true;
    if (gate) {
      // Gate-mode pinning: a gate is active, fail-closed, always.
      if (mode === 'audit') {
        throw refused(
          'gate-audit-promotion',
          `Refused: gate interceptor ${def.name} cannot run in audit mode; `
          + 'audit mode is never a gate.',
        );
      }
      if (def.failOpen === true) {
        throw refused(
          'gate-failopen',
          `Refused: gate interceptor ${def.name} cannot be fail-open; `
          + 'failOpen is false on every gate interceptor.',
        );
      }
    }
    const entry = {
      name: def.name,
      type,
      mode,
      // failOpen defaults to false (fail-closed). Gates are forced false.
      failOpen: gate ? false : def.failOpen === true,
      source,
      priorityHint: resolvePriorityHint(def),
      gate,
      validate: def.validate,
      mutate: def.mutate,
      observe: def.observe,
      invoke: def.invoke,
    };
    this.interceptors.push(entry);
    this.byName.set(entry.name, entry);
    return entry;
  }

  // Gate audit-promotion is refused here too, not just at registration:
  // an override path that could demote a gate to audit is a gate bypass
  // in invoker clothing (cf. Go's Directive promotion path, Batch 143).
  setMode(name, mode) {
    const entry = this.byName.get(name);
    if (!entry) throw new Error(`Unknown interceptor: ${name}`);
    if (entry.gate && mode === 'audit') {
      throw refused(
        'gate-audit-promotion',
        `Refused: gate interceptor ${name} cannot be promoted to audit mode; `
        + 'audit mode is never a gate.',
      );
    }
    entry.mode = mode;
  }

  resolve(entry, overrides = {}) {
    const over = overrides[entry.name] || {};
    let mode = entry.mode;
    if (over.mode !== undefined) {
      if (entry.gate && over.mode === 'audit') {
        throw refused(
          'gate-audit-promotion',
          `Refused: gate interceptor ${entry.name} cannot be promoted to audit mode; `
          + 'audit mode is never a gate.',
        );
      }
      mode = over.mode;
    }
    // failOpen on a gate is forced false even if an override says true.
    const failOpen = entry.gate ? false : (over.failOpen !== undefined ? over.failOpen === true : entry.failOpen);
    const timeoutMs = over.timeoutMs !== undefined ? over.timeoutMs : null;
    return { mode, failOpen, timeoutMs };
  }

  log(entry, resolved, payload, outcome, extra = {}) {
    this.auditLog.push({
      interceptor: entry.name,
      type: entry.type,
      mode: resolved.mode,
      failOpen: resolved.failOpen,
      source: entry.source,
      priorityHint: entry.priorityHint,
      // PII-redacted copy only: the raw payload is never written to the log.
      payload: redactPayload(clone(payload)),
      outcome,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }

  listInterceptors() {
    return this.interceptors.map((e) => ({
      name: e.name,
      type: e.type,
      mode: e.mode,
      failOpen: e.failOpen,
      source: e.source,
      priorityHint: e.priorityHint,
      gate: e.gate,
    }));
  }

  async dispatch(method, params = {}) {
    if (method === METHODS.LIST) {
      return { interceptors: this.listInterceptors() };
    }
    if (method === METHODS.INVOKE) {
      return this.invokeOne(params);
    }
    // executeChain is NOT a wire method in SEP-2624 (Batch 132/133):
    // chains are orchestrated client-side via list + invoke. Any unknown
    // method — executeChain included — is rejected, never improvised.
    throw new InterceptorError(
      -32601,
      `Unknown method: ${method}`,
      { method },
    );
  }

  async invokeOne(params = {}) {
    const entry = this.byName.get(params.name);
    if (!entry) {
      throw new InterceptorError(-32602, 'Interceptor not found', { interceptor: params.name });
    }
    const direction = params.direction || 'sending';
    const overrides = params.overrides || {};
    const resolved = this.resolve(entry, overrides);
    if (direction === 'receiving' && params.sensitive === true
      && isObserverEntry(entry, resolved.mode) && entry.source === 'third-party') {
      throw refused(
        'third-party-receiving-observability',
        `Refused: third-party receiving observability interceptor ${entry.name} `
        + 'on a sensitive result; receiving observability is own-client only.',
      );
    }
    const timeoutMs = resolved.timeoutMs !== null ? resolved.timeoutMs
      : (params.timeoutMs ?? this.defaultTimeoutMs ?? null);
    const payload = clone(params.payload);
    const ctx = {
      direction,
      event: params.event,
      timeoutMs,
      interceptor: entry.name,
      config: params.config,
      context: params.context,
    };
    try {
      if (entry.type === 'validation') {
        const fn = entry.validate || entry.invoke;
        const result = fn ? await this._timed(fn, payload, ctx, timeoutMs, entry.name, direction) : undefined;
        this.log(entry, resolved, payload, 'ok');
        return { interceptor: entry.name, type: 'validation', direction, validation: normalizeValidation(result) };
      }
      if (entry.type === 'mutation') {
        const fn = entry.mutate || entry.invoke;
        const next = fn ? await this._timed(fn, payload, ctx, timeoutMs, entry.name, direction) : undefined;
        if (resolved.mode === 'audit') {
          this.log(entry, resolved, payload, 'audit-shadow', { shadowPayload: redactPayload(clone(next)) });
          return { interceptor: entry.name, type: 'mutation', direction, mutation: { modified: false, payload } };
        }
        const out = next === undefined ? payload : clone(next);
        this.log(entry, resolved, payload, 'ok');
        return { interceptor: entry.name, type: 'mutation', direction, mutation: { modified: next !== undefined, payload: out } };
      }
      const fn = entry.observe || entry.invoke;
      if (fn) await this._timed(fn, payload, ctx, timeoutMs, entry.name, direction);
      this.log(entry, resolved, payload, 'ok');
      return { interceptor: entry.name, type: 'observability', direction, observed: true };
    } catch (err) {
      if (isTimeoutError(err)) {
        this.log(entry, resolved, payload, 'timeout');
        throw timeoutError(entry.name, timeoutMs, direction);
      }
      this.log(entry, resolved, payload, 'failed');
      throw err;
    }
  }

  // Race one invocation against its own timeout. The timer is always cleared
  // on settle, so a timed-out invocation never holds the process open.
  async _timed(fn, payload, ctx, timeoutMs, interceptorName, stage) {
    if (timeoutMs === null || timeoutMs === undefined || timeoutMs <= 0) {
      return fn(clone(payload), ctx);
    }
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(timeoutError(interceptorName, timeoutMs, stage)), timeoutMs);
    });
    try {
      return await Promise.race([Promise.resolve().then(() => fn(clone(payload), ctx)), timeoutPromise]);
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  async _runValidationBlock(payload, direction, opts, helpers) {
    const { checkDeadline, timed } = helpers;
    const overrides = opts.overrides || {};
    const validators = this.interceptors.filter((e) => e.type === 'validation');
    const observers = this.interceptors.filter((e) => e.type === 'observability');

    // Validators run in parallel; every result is captured, none fail-fast,
    // so failures are COLLECTED, not reported one at a time.
    const validatorJobs = validators.map(async (entry) => {
      const resolved = this.resolve(entry, overrides);
      const ctx = {
        direction, event: opts.event,
        timeoutMs: resolved.timeoutMs !== null ? resolved.timeoutMs : helpers.timeoutMs,
        interceptor: entry.name, config: opts.config, context: opts.context,
      };
      const fn = entry.validate || entry.invoke;
      if (!fn) {
        this.log(entry, resolved, payload, 'skipped-no-handler');
        return { entry, resolved, result: undefined, error: null };
      }
      try {
        const result = await timed(fn, payload, ctx, entry, direction);
        this.log(entry, resolved, payload, 'ok');
        return { entry, resolved, result, error: null };
      } catch (err) {
        this.log(entry, resolved, payload, 'failed');
        return { entry, resolved, result: undefined, error: err };
      }
    });

    // Observers run in parallel with validators and never block, in either
    // direction. Their errors are swallowed into the log.
    const observerJobs = observers.map(async (entry) => {
      const resolved = this.resolve(entry, overrides);
      const ctx = {
        direction, event: opts.event,
        timeoutMs: resolved.timeoutMs !== null ? resolved.timeoutMs : helpers.timeoutMs,
        interceptor: entry.name, config: opts.config, context: opts.context,
      };
      const fn = entry.observe || entry.invoke;
      if (!fn) {
        this.log(entry, resolved, payload, 'skipped-no-handler');
        return;
      }
      try {
        await timed(fn, payload, ctx, entry, direction);
        this.log(entry, resolved, payload, 'ok');
      } catch (err) {
        // Fire-and-forget: an observer failure (including its timeout) never
        // affects the main flow.
        this.log(entry, resolved, payload, 'failed');
      }
    });

    const settled = await Promise.all(validatorJobs);
    await Promise.all(observerJobs);
    checkDeadline('validate');

    const failures = [];
    for (const job of settled) {
      const { entry, resolved, result, error } = job;
      if (error) {
        if (isTimeoutError(error)) {
          // Audit-mode and fail-open timeouts are logged, never blocking.
          if (resolved.mode === 'audit' || resolved.failOpen) continue;
          throw timeoutError(entry.name, helpers.timeoutMs, direction);
        }
        // Crash / invocation error: fail-open or audit lets it proceed;
        // fail-closed is a -32603 execution failure.
        if (resolved.mode === 'audit' || resolved.failOpen) continue;
        throw new InterceptorError(-32603, 'Interceptor execution failed', {
          interceptor: entry.name,
          reason: String((error && error.message) || error),
        });
      }
      const norm = normalizeValidation(result);
      if (norm === null) continue;
      // Audit-mode validators log violations without blocking.
      if (resolved.mode === 'audit') {
        if (norm.valid === false || norm.severity === 'error') {
          this.log(entry, resolved, payload, 'audit-violation', { violation: norm });
        }
        continue;
      }
      // valid=false blocks REGARDLESS of severity (Batch 143 rule).
      // An error severity blocks even if valid is unstated/true.
      if (norm.valid === false || norm.severity === 'error') {
        failures.push({
          interceptor: entry.name,
          severity: norm.severity || 'error',
          message: norm.message || 'Validation failed',
        });
      }
    }
    if (failures.length > 0) {
      throw new InterceptorError(-32602, 'Interceptor validation failed', { validationErrors: failures });
    }
  }

  async _runMutations(payload, lastValidPayload, direction, opts, helpers) {
    const { checkDeadline, timed } = helpers;
    const overrides = opts.overrides || {};
    let current = payload;
    let lastValid = lastValidPayload;
    for (const entry of sortMutations(this.interceptors.filter((e) => e.type === 'mutation'))) {
      checkDeadline('mutate');
      const resolved = this.resolve(entry, overrides);
      const before = clone(current);
      const ctx = {
        direction, event: opts.event,
        timeoutMs: resolved.timeoutMs !== null ? resolved.timeoutMs : helpers.timeoutMs,
        interceptor: entry.name, config: opts.config, context: opts.context,
      };
      const fn = entry.mutate || entry.invoke;
      if (!fn) {
        this.log(entry, resolved, before, 'skipped-no-handler');
        checkDeadline('mutate');
        continue;
      }
      try {
        const next = await timed(fn, before, ctx, entry, direction);
        if (resolved.mode === 'audit') {
          // Audit-mode mutators compute a shadow transformation and do NOT
          // apply it.
          this.log(entry, resolved, before, 'audit-shadow', { shadowPayload: redactPayload(clone(next)) });
        } else {
          if (next !== undefined) current = clone(next);
          lastValid = clone(current);
          this.log(entry, resolved, before, 'ok');
        }
      } catch (err) {
        if (isTimeoutError(err)) {
          if (resolved.mode === 'audit' || resolved.failOpen) {
            this.log(entry, resolved, before, 'timeout-skipped');
            checkDeadline('mutate');
            continue;
          }
          throw timeoutError(entry.name, helpers.timeoutMs, direction);
        }
        if (resolved.mode === 'audit' || resolved.failOpen) {
          this.log(entry, resolved, before, 'failed-skipped');
          checkDeadline('mutate');
          continue;
        }
        // Halt immediately; chain-local atomicity: report the last valid
        // payload, and the caller never sends/processes a partial result.
        throw new InterceptorError(-32603, 'Interceptor mutation failed', {
          failedInterceptor: entry.name,
          lastValidPayload: clone(lastValid),
        });
      }
      // Deadline checked after EVERY mutation, including the last one.
      checkDeadline('mutate');
    }
    return { payload: current, lastValidPayload: lastValid };
  }

  _assertReceivingObservability(direction, opts) {
    if (direction !== 'receiving' || opts.sensitive !== true) return;
    const overrides = opts.overrides || {};
    for (const entry of this.interceptors) {
      const resolved = this.resolve(entry, overrides);
      // Third-party receiving observability on sensitive results is refused.
      // Own-client audit trail only: third-party audit-mode interceptors are
      // observers for this purpose, whatever their type.
      if (entry.source === 'third-party' && isObserverEntry(entry, resolved.mode)) {
        throw refused(
          'third-party-receiving-observability',
          `Refused: third-party receiving observability interceptor ${entry.name} `
          + 'on a sensitive result; receiving observability is own-client only.',
        );
      }
    }
  }

  async run(direction, inputPayload, opts = {}) {
    if (direction !== 'sending' && direction !== 'receiving') {
      throw new Error(`Unknown direction: ${String(direction)} (expected 'sending' or 'receiving')`);
    }
    if (opts.serverSideInterceptors === true || opts.relyOnServerInterceptors === true) {
      throw refused(
        'server-side-reliance',
        'Refused: server-side interceptors are never relied on; '
        + 'the client-side chain is the gate.',
      );
    }
    // Third-party mutation can never reach execution (add() refuses it),
    // but re-check at run time so a mutated entry cannot slip through.
    for (const entry of this.interceptors) {
      if (entry.type === 'mutation' && entry.source === 'third-party') {
        throw refused(
          'third-party-mutation',
          `Refused: third-party mutation interceptor ${entry.name} is never run.`,
        );
      }
    }
    this._assertReceivingObservability(direction, opts);

    const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs ?? null;
    const deadline = timeoutMs !== null && timeoutMs > 0 ? Date.now() + timeoutMs : null;
    const checkDeadline = (stage) => {
      if (deadline !== null && Date.now() > deadline) {
        throw timeoutError(null, timeoutMs, stage);
      }
    };
    const timed = async (fn, payload, ctx, entry, stage) => {
      const entryMs = ctx.timeoutMs;
      // Per-invocation race: the smaller of the remaining chain deadline
      // and the invocation's own timeoutMs, so a slow interceptor cannot
      // outlive the chain deadline and a short per-invoke timeout is honoured.
      let ms = null;
      if (deadline !== null) ms = Math.max(0, deadline - Date.now());
      if (entryMs !== null && entryMs !== undefined && entryMs > 0) ms = ms === null ? entryMs : Math.min(ms, entryMs);
      if (ms !== null && ms <= 0) throw timeoutError(entry.name, timeoutMs, stage);
      return this._timed(fn, payload, { ...ctx, timeoutMs: entryMs ?? timeoutMs }, ms, entry.name, stage);
    };
    const helpers = { checkDeadline, timed, timeoutMs };

    if (direction === 'sending') {
      let payload = clone(inputPayload);
      let lastValid = clone(payload);
      const mutated = await this._runMutations(payload, lastValid, direction, opts, helpers);
      payload = mutated.payload;
      lastValid = mutated.lastValidPayload;
      await this._runValidationBlock(payload, direction, opts, helpers);
      // Validators see the mutated payload: sending order is mutate-first,
      // so validation guards the payload that actually crosses the boundary.
      let output;
      if (opts.send) {
        try {
          output = await timed(opts.send, payload, { direction, timeoutMs }, { name: null }, 'send');
        } catch (err) {
          if (isTimeoutError(err)) throw timeoutError(null, timeoutMs, 'send');
          throw err;
        }
      }
      // Post-final-stage deadline check: a send that finished after the
      // deadline is still a timeout, not a success (Batch 148 gap, closed).
      checkDeadline('final');
      return { status: 'success', payload: clone(payload), output };
    }

    // Receiving.
    let payload;
    if (opts.receive) {
      try {
        payload = await timed(opts.receive, clone(inputPayload), { direction, timeoutMs }, { name: null }, 'receive');
      } catch (err) {
        if (isTimeoutError(err)) throw timeoutError(null, timeoutMs, 'receive');
        throw err;
      }
      payload = clone(payload);
    } else {
      payload = clone(inputPayload);
    }
    checkDeadline('receive');
    await this._runValidationBlock(payload, direction, opts, helpers);
    const mutated = await this._runMutations(payload, clone(payload), direction, opts, helpers);
    payload = mutated.payload;
    // LOCAL HARDENING (Hole 1): re-validate AFTER receiving mutation,
    // before processing. A mutation that breaks validation is rejected
    // here, never processed.
    await this._runValidationBlock(payload, direction, opts, helpers);
    checkDeadline('revalidate');
    let output;
    if (opts.process) {
      try {
        output = await timed(opts.process, payload, { direction, timeoutMs }, { name: null }, 'process');
      } catch (err) {
        if (isTimeoutError(err)) throw timeoutError(null, timeoutMs, 'process');
        throw err;
      }
    }
    // Post-final-stage deadline check (Batch 148 gap, closed).
    checkDeadline('final');
    return { status: 'success', payload: clone(payload), output };
  }
}

function normalizeValidation(result) {
  if (result === undefined || result === null) return null;
  if (result === true) return { valid: true, severity: null, message: null };
  if (result === false) return { valid: false, severity: 'error', message: 'Validation failed' };
  if (typeof result !== 'object') return null;
  const message = result.message
    || (Array.isArray(result.messages) ? result.messages.join('; ') : null)
    || null;
  return {
    valid: result.valid === undefined ? null : result.valid,
    severity: result.severity || null,
    message,
    suggestions: result.suggestions,
  };
}

module.exports = {
  InterceptorChain,
  InterceptorError,
  ChainRefusedError,
  CODES,
  METHODS,
  isTimeoutError,
  redactPayload,
  sortMutations,
};
