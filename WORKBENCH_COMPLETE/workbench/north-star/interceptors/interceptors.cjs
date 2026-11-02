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
 *
 * EXTENSION (Batches 181, 184, 186, 188): the cancellation / abort-audit
 * section at the end of this file. It classifies abort observations and
 * decides what proof they carry; it starts no server and measures no
 * latency. Round-1 chain behaviour is untouched.
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

/* =====================================================================
 * Cancellation / abort-audit rules (Batches 181, 184, 186, 188).
 *
 * This section is a RECORD + CLASSIFIER for abort observations, not a
 * live abort mechanism: it starts no server, opens no socket, and
 * measures no latency. Observations are data handed in; the functions
 * below normalize them, classify them, and decide what proof (if any)
 * they carry. Anything the batches left unverified stays unverified
 * here — it is labelled, never filled in.
 *
 * Grep note (Batch 184 item F): round 1's code contained NO SSE-vs-JSON
 * signal-form split to remove (verified by grep: no signal-form field
 * existed at all). The unified single-valued field below is new, not a
 * repair of a split.
 * =================================================================== */

// --- A. Cancellation triple, verified against spec text (Batch 181) ---
// PRECISION, enforced by the shape of this constant: the cancellation
// page itself says SHOULD-not-send-a-response, NOT MUST. The MUST comes
// from the base notification rule and from the transport page's
// "MUST NOT send any further messages". Never quote the cancellation
// page as saying MUST-not-respond; quote the transport page for that.
const CANCELLATION_TRIPLE = Object.freeze({
  serverStopProcessing: 'SHOULD',
  serverFreeResources: 'SHOULD',
  // Cancellation page wording (2026-07-28, Behavior Requirements).
  serverNotSendResponse: 'SHOULD (cancellation page)',
  // The MUST lives here, not on the cancellation page.
  mustNotRespondSource: 'transport page: MUST NOT send any further messages; plus base notification rule: MUST NOT send a response',
  mayIgnoreCases: Object.freeze(['request unknown', 'processing already completed', 'request cannot be cancelled']),
  clientLateResponse: 'SHOULD ignore',
  raceClause: 'cancellation may arrive after processing completed or after a response was sent; both parties MUST handle races gracefully',
});

// The cancellation page does NOT say MUST-not-respond. Any caller that
// needs the MUST cites the transport page (see CANCELLATION_TRIPLE).
function cancellationPageSaysMustNotRespond() {
  return false;
}

// --- B. Stateless revision reconciliation (Batch 181) ---
// Server-sent notifications/cancelled is narrowed to subscription
// teardown ONLY on 2026. On 2025 it was fire-and-forget (no ack
// required). Either way, absence of a server cancelled message is NEVER
// a failed abort — especially never for a tool call.
function serverCancelledExpected({ era, purpose }) {
  if (era === '2026') return purpose === 'subscription-teardown';
  return false; // 2025: fire-and-forget, no acknowledgement required.
}

function serverCancelledAbsenceVerdict() {
  return 'not-a-failure';
}

// Session channels are GONE on 2026: closing a session, a standalone
// GET stream, or DELETE cancels nothing. A modern-only server answers
// GET/DELETE with 405 and ignores Mcp-Session-Id entirely. Cancellation
// is per-request only; "session closed, therefore all requests
// cancelled" is invalid on 2026.
function sessionCloseCancels({ era }) {
  return era !== '2026';
}

function modernOnlyLegacyResponse(method) {
  if (method === 'GET' || method === 'DELETE') return 405;
  return null;
}

function sessionClosedImpliesAllCancelled({ era }) {
  return era !== '2026';
}

// The 2025 non-cancellability rule for initialize is moot on 2026:
// initialize no longer exists (per-request _meta carries version /
// capabilities instead). It was not repealed by the cancellation page;
// it died with initialize itself.
const INITIALIZE_NON_CANCELLABILITY_2026 = 'moot (initialize no longer exists)';

// Stdio cancellation is UNCHANGED in mechanism (notification, no
// per-request stream), so stdio proof observations are era-independent
// and may pool across eras. HTTP observations must NOT pool across eras.
function canPoolObservations(a, b) {
  if (!a || !b) return false;
  if (a.tool !== b.tool || a.mode !== b.mode || a.transport !== b.transport) return false;
  if (a.transport === 'stdio') return true;
  return a.era === b.era;
}

function proofSetKey(obs) {
  return [obs.tool, obs.mode, obs.transport, obs.era].join('|');
}

// --- C. Audit tuple (Batch 181) ---
// Every audit entry must carry all six fields or the proof is not
// comparable across observations.
const AUDIT_TUPLE_FIELDS = Object.freeze([
  'era', 'transport', 'signalForm', 'mode', 'wFormula', 'frozenBaselineVersion',
]);

function validateAuditTuple(entry) {
  const missing = AUDIT_TUPLE_FIELDS.filter((f) => entry === null || entry === undefined
    || entry[f] === undefined || entry[f] === null || entry[f] === '');
  return { valid: missing.length === 0, missing };
}

// Builds a validated abort-audit entry. Throws on an incomplete tuple
// rather than recording an incomparable observation.
function makeAbortAuditEntry(entry) {
  const check = validateAuditTuple(entry);
  if (!check.valid) {
    throw new Error(`Incomplete abort-audit tuple; missing: ${check.missing.join(', ')}`);
  }
  return {
    era: entry.era,
    transport: entry.transport,
    signalForm: normalizeSignalForm(entry).signalForm,
    mode: entry.mode,
    wFormula: entry.wFormula,
    frozenBaselineVersion: entry.frozenBaselineVersion,
    tool: entry.tool || null,
    purpose: entry.purpose || 'tool-call',
  };
}

// --- F. Signal-form field, UNIFIED (Batch 184) ---
// For 2026 HTTP observations the signal form is single-valued
// "POST abort": the response form is unknowable at cancel time (the
// client sends one POST accepting both JSON and SSE; the server chooses
// per request), so splitting it invents data. A pre-response cancel has
// no eventual form. The one exception: a post-response SSE close that
// tears down an existing subscription stream keeps "stream-close" —
// that stream did exist. The original label is preserved in
// relabeledFrom so a mislabel is auditable, not silently rewritten.
function normalizeSignalForm({ era, transport, signalForm, purpose }) {
  if (era === '2026' && transport === 'http' && purpose !== 'subscription-teardown') {
    const relabeledFrom = signalForm && signalForm !== 'POST abort' ? signalForm : null;
    return { signalForm: 'POST abort', relabeledFrom };
  }
  if (purpose === 'subscription-teardown' && signalForm === 'stream-close') {
    return { signalForm: 'stream-close', relabeledFrom: null };
  }
  return { signalForm: signalForm || null, relabeledFrom: null };
}

// --- D. Stdio W rule + proof set (Batch 181) ---
// W_tool(mode) = frozen p99(mode) when n_mode >= 1000, else
// 2 x frozen p95(mode), measured from cancel dispatch.
function computeW({ nMode, frozenP99, frozenP95 }) {
  if (!Number.isFinite(nMode) || !Number.isFinite(frozenP99) || !Number.isFinite(frozenP95)) {
    throw new Error('computeW requires finite nMode, frozenP99, frozenP95');
  }
  if (frozenP99 <= 0 || frozenP95 <= 0) throw new Error('computeW requires positive frozen baselines');
  return nMode >= 1000 ? frozenP99 : 2 * frozenP95;
}

// Classifies one cancel observation window. Precedence (documented, so
// a combined window classifies one way only):
//   positive-disproof > truncated > progress-race > late-response-demoted > silence.
// - TRUNCATED: level timeout remaining at cancel < W. The observation is
//   inconclusive; W is NEVER shortened to fit inside the budget.
// - PROGRESS after cancel breaks silence for that window (race /
//   inconclusive, not a counted silence, not a disproof on its own) and
//   does NOT extend W (maximum timeout regardless of progress).
// - LATE RESPONSE after W but before the level timeout does NOT
//   retroactively disprove the abort, but DEMOTES that observation
//   (removed from the counted proof set).
// - POSITIVE DISPROOF (separate, sticky): a side effect after cancel on
//   a tool claimed read-only, or a message attributable to work that
//   started after cancel. Attribution separates disproof from race; a
//   bare late response never carries it.
// obs: { levelTimeoutRemainingMs, wMs, eventsAfterCancel: [
//   { type: 'progress' } | { type: 'late-response', afterW: true }
//   | { type: 'side-effect', toolReadOnly: true }
//   | { type: 'post-cancel-work-message', attributable: true } ] }
function classifyCancelObservation(obs) {
  const wMs = obs.wMs;
  const events = obs.eventsAfterCancel || [];
  const disproof = events.some((e) => (e.type === 'side-effect' && e.toolReadOnly === true)
    || (e.type === 'post-cancel-work-message' && e.attributable === true));
  if (disproof) {
    return { classification: 'positive-disproof', wMs, countsAsSilence: false, isDisproof: true, wExtended: false };
  }
  if (obs.levelTimeoutRemainingMs < wMs) {
    return { classification: 'truncated-inconclusive', wMs, countsAsSilence: false, isDisproof: false, wExtended: false };
  }
  if (events.some((e) => e.type === 'progress')
    || events.some((e) => e.type === 'late-response' && e.afterW !== true)
    || events.some((e) => e.type === 'post-cancel-work-message' && e.attributable !== true)) {
    // An unattributed post-cancel message breaks silence but is not a
    // disproof: attribution is what separates disproof from race.
    return { classification: 'race-inconclusive', wMs, countsAsSilence: false, isDisproof: false, wExtended: false };
  }
  if (events.some((e) => e.type === 'late-response' && e.afterW === true)) {
    return { classification: 'demoted', wMs, countsAsSilence: false, isDisproof: false, wExtended: false };
  }
  return { classification: 'silence', wMs, countsAsSilence: true, isDisproof: false, wExtended: false };
}

// PROOF THRESHOLD: PROVEN-negatively requires >= 3 silent windows
// (three independent cancels, same tool + mode + transport + era).
// PATTERN RULE: late responses on >= 2 observations within a proof set
// revert the tool to DECLARED and require a fresh proof set.
// A demoted observation removes a previously counted silence: the set
// must regain three silences (modelled by amendObservation).
class AbortProofSet {
  constructor({ tool, mode, transport, era }) {
    this.key = { tool, mode, transport, era };
    this.observations = new Map();
    this.nextId = 1;
    this.disproved = false;
  }

  add(rawObs) {
    if (proofSetKey(rawObs) !== proofSetKey(this.key)) {
      throw new Error('Observation does not match this proof set (tool + mode + transport + era)');
    }
    const id = this.nextId++;
    this.observations.set(id, { raw: rawObs, result: classifyCancelObservation(rawObs) });
    if (this.observations.get(id).result.isDisproof) this.disproved = true;
    return id;
  }

  // Reclassify a window when a late event lands after it was first
  // counted (e.g. a late response after W demotes a counted silence).
  amend(id, rawObs) {
    if (!this.observations.has(id)) throw new Error(`Unknown observation id: ${id}`);
    if (proofSetKey(rawObs) !== proofSetKey(this.key)) {
      throw new Error('Amended observation does not match this proof set (tool + mode + transport + era)');
    }
    this.observations.set(id, { raw: rawObs, result: classifyCancelObservation(rawObs) });
    if (this.observations.get(id).result.isDisproof) this.disproved = true;
    return this.observations.get(id).result;
  }

  counts() {
    let silences = 0;
    let lateResponses = 0;
    for (const { result } of this.observations.values()) {
      if (result.countsAsSilence) silences += 1;
      // Pattern rule counts late responses AFTER W only (demoted
      // windows). A response inside W is a race window, not a late one.
      if (result.classification === 'demoted') lateResponses += 1;
    }
    return { silences, lateResponses, total: this.observations.size };
  }

  status() {
    if (this.disproved) return 'DISPROVEN';
    const { silences, lateResponses } = this.counts();
    if (lateResponses >= 2) return 'DECLARED';
    if (silences >= 3) return 'PROVEN-negatively';
    return 'DECLARED';
  }

  requiresFreshSet() {
    return !this.disproved && this.counts().lateResponses >= 2;
  }

  freshSet() {
    if (this.disproved) throw new Error('Positive disproof is sticky; a fresh set does not clear it');
    return new AbortProofSet(this.key);
  }
}

// --- E. 2026 HTTP replacement proof (Batch 181) ---
// On 2026 HTTP the observation is "no SIDE EFFECT observed within W",
// NOT "no message": after a stream close the server has no stream on
// which to send a late response, and MUST NOT send further messages, so
// message silence is transport-guaranteed, not server-behavior evidence.
// Server-side stopping on HTTP must NOT be claimed from message silence.
function claimServerStoppedFromMessageSilence() {
  return {
    valid: false,
    reason: 'message silence after a 2026 HTTP disconnect is transport-guaranteed (server MUST NOT send further messages), not server-behavior evidence; counting it as proof of stopping is circular',
  };
}

function evaluateHttpAbort({ toolReadOnly, clientAbortedPost }) {
  if (!clientAbortedPost) {
    return { claim: 'no-abort-observed', serverStoppedClaimed: false, residualRisk: null };
  }
  if (toolReadOnly === true) {
    return {
      claim: 'PROVEN-client-abandonment',
      serverStoppedClaimed: false,
      residualRisk: 'server load, not client correctness (read-only + client ignores late results per spec)',
    };
  }
  return {
    claim: 'not-applicable',
    serverStoppedClaimed: false,
    reason: 'rescue is already barred by never-hedge-commits, so no HTTP write tool ever needs a protocol-abort proof for rescue',
  };
}

// Operator-side evidence is real for the operator but is NOT a protocol
// observation and must not be recorded as one.
function isProtocolObservation(evidenceKind) {
  const operatorOnly = ['server-logs', 'server-metrics', 'subsequent-request-latency', 'resource-contention'];
  if (operatorOnly.includes(evidenceKind)) {
    return { isProtocol: false, reason: 'operator-side evidence, not a client-side protocol observation' };
  }
  return { isProtocol: true, reason: null };
}

// --- G. JSON server-obligation (Batch 184) ---
// Recorded as a plausible-but-unscoped MUST-treat-disconnect reading
// with its stated limits — explicitly NOT a verbatim spec rule.
// The C# stateless-token sentence is mechanism evidence only, NOT
// client-observable proof. Timing remains NOT-GUARANTEED.
const JSON_SERVER_OBLIGATION = Object.freeze({
  action: 'abort in-flight POST',
  actionBasis: 'PROVEN-by-elimination: the only possible client signal (notification excluded by spec on 2026 HTTP; response form unknowable at cancel time)',
  obligation: 'plausible-but-unscoped MUST-treat-disconnect reading',
  verbatimJsonRule: false,
  timing: 'NOT-GUARANTEED',
  limits: Object.freeze([
    'the "unambiguous" rationale rests on "each request has its own response stream", which does not exist yet for a pre-response JSON request',
    'neither spec page read writes "JSON", "single JSON object", or "abort the POST" in a cancellation sentence',
    'detection timing is framework-dependent and unstated: a server computing a JSON response with no writes in flight may not observe the disconnect until it attempts to write the completed response',
  ]),
  csharpStatelessTokenNote: 'mechanism evidence only, NOT client-observable proof; do not quote the C# page as saying 2026 HTTP clients send notifications/cancelled — they do not',
  handlerNeverChecksSignal: 'still runs to completion (SHOULD-stop-as-soon-as-practical limit)',
});

// --- H. TS SDK v2 mechanism (Batch 186) ---
// PerRequestHTTPServerTransport cancels the WHOLE EXCHANGE on client
// disconnect, response-form-independent, CONDITIONED on the runtime
// providing an abort signal ("when the runtime provides an abort signal
// on it"). Legacy sessionful StreamableHTTPServerTransport is OUT OF
// SCOPE (modern leg only). The transport's connection-closed rejection
// is about the exchange's promise, not a forced kill of handler code.
const TS_V2_MECHANISM = Object.freeze({
  transport: 'PerRequestHTTPServerTransport',
  scope: 'whole exchange, response-form-independent (responseMode auto/sse/json only shapes terminal framing)',
  condition: 'when the runtime provides an abort signal on it',
  provenance: 'typedoc API docs (ts.sdk.modelcontextprotocol.io/v2); perRequestTransport.ts source lines were NOT read in Batch 186 (GitHub fetch failed) — if source later contradicts the docs, source wins',
  legacyOutOfScope: 'StreamableHTTPServerTransport (sessionful) — modern leg only',
  connectionClosedRejection: 'about the exchange promise, not a forced kill of handler code',
  timing: 'NOT-GUARANTEED',
  httpServerStoppedQuestion: 'CLOSED for plain tools/call',
  httpServerStoppedReopenCondition: 'a new protocol channel only (a spec sentence or SDK client-side signal)',
  taskBoundary: 'task-shaped invocations NOT ruled on',
  provenClaimHttpReadOnly: 'client-abandonment',
});

// --- J. Node row, RESOLVED (Batch 188) ---
// toNodeHandler synthesizes a per-request web AbortSignal via res
// 'close' ONLY (not req close, not aborted, not response finish), with
// a finished guard (close after full stream does not abort — correct,
// nothing left to cancel). Plain/Express/Fastify mounts = signal
// synthesized (same underlying Node req/res objects). Hono =
// runtime-dependent, UNVERIFIED (Hono does not use toNodeHandler;
// @hono/node-server unexamined). The Node row must read exactly that
// split, never a blanket "Node: yes".
const RUNTIME_SIGNAL_TABLE = Object.freeze([
  Object.freeze({ runtime: 'Workers', mount: null, status: 'signal-native' }),
  Object.freeze({ runtime: 'Deno', mount: null, status: 'signal-native' }),
  Object.freeze({ runtime: 'Bun', mount: null, status: 'signal-native' }),
  Object.freeze({ runtime: 'Node', mount: 'toNodeHandler-plain', status: 'signal-synthesized (res close only)' }),
  Object.freeze({ runtime: 'Node', mount: 'toNodeHandler-Express', status: 'signal-synthesized (res close only)' }),
  Object.freeze({ runtime: 'Node', mount: 'toNodeHandler-Fastify', status: 'signal-synthesized (res close only)' }),
  Object.freeze({ runtime: 'Node', mount: 'Hono', status: 'runtime-dependent, UNVERIFIED' }),
  Object.freeze({ runtime: 'legacy-sessionful', mount: null, status: 'out of scope (modern leg only)' }),
]);

function runtimeSignalStatus({ runtime, mount }) {
  if (runtime === 'Node' && !mount) {
    return {
      status: 'unresolved',
      reason: 'Node row splits by mount (toNodeHandler plain/Express/Fastify = synthesized; Hono = runtime-dependent, unverified); never a blanket "Node: yes"',
    };
  }
  const row = RUNTIME_SIGNAL_TABLE.find((r) => r.runtime === runtime
    && (r.mount === null ? mount === null || mount === undefined : r.mount === mount));
  if (row) return { status: row.status, reason: null };
  return { status: 'unknown', reason: 'no runtime-condition row recorded for this runtime/mount' };
}

// Hand-wired toWebRequest audit rule: signal present IFF the request
// came through toNodeHandler OR an explicit signal option. A direct
// toWebRequest caller that omits the option gets a signal-less Request;
// the audit must check the path, not assume.
function nodeSignalPresent({ path, signalOption }) {
  if (path === 'toNodeHandler') return true;
  if (path === 'toWebRequest') return signalOption === true;
  if (path === 'Hono') return 'unverified';
  return false;
}

const NODE_HANDLER_EDGES = Object.freeze({
  trigger: "res 'close' ONLY (not req close, not aborted, not response finish)",
  halfOpenSocketAborts: false,
  halfOpenSocketNote: 'a disconnect that leaves the response object un-closed does not abort',
  closeAfterFullStreamAborts: false,
  finishedGuardNote: 'close after full stream does not abort — correct, nothing left to cancel; the signal is a live-exchange signal only',
  nodeSubGap: 'CLOSED (Batch 188, adapter source); do NOT re-open without a new adapter version',
  jsonThread: 'CLOSED end to end except spec wording (still unverified)',
  honoSubQuestion: 'separate, new item (@hono/node-server request construction), not a reopening of the closed Node sub-gap',
});

// --- K. Gate 3 restated (Batch 181) ---
// "abortable = PROVEN in the audit, with a class-appropriate proof":
// for 2026 HTTP read-only tools PROVEN means the client-abandonment
// qualifier; for stdio tools PROVEN means the >= 3-silence set; for
// 2025-era HTTP (notification sent, stream/session remains open) the
// negative message-silence proof survives like stdio. Other gates are
// unchanged and are NOT re-implemented here (per-mode T_stuck is the
// other worker's area; referenced only).
const GATE3_UNCHANGED_COMPANIONS = Object.freeze([
  'read-only + idempotent', 'zero progress', 'single re-issue', 'budget fit',
  'separate rescue-rate metric', 'multi-path hedging', 'never-hedge-commits',
  'level-boundary wait', 'RULE 6', 'breaker', 'drift rules',
]);

function gate3Abortable({ transport, era, toolReadOnly, proof }) {
  if (transport === 'stdio') {
    return { abortable: proof === 'PROVEN-negatively', proofClass: 'stdio >= 3-silence set' };
  }
  if (transport === 'http' && era === '2026') {
    if (toolReadOnly === true) {
      return { abortable: proof === 'PROVEN-client-abandonment', proofClass: '2026 HTTP read-only client-abandonment qualifier' };
    }
    return { abortable: false, proofClass: 'not-applicable (never-hedge-commits bars HTTP write rescue)' };
  }
  if (transport === 'http' && era === '2025') {
    return { abortable: proof === 'PROVEN-negatively', proofClass: '2025 HTTP negative message-silence proof (stream/session remains open)' };
  }
  return { abortable: false, proofClass: 'unknown transport/era combination' };
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
  // Cancellation / abort audit (Batches 181, 184, 186, 188).
  CANCELLATION_TRIPLE,
  cancellationPageSaysMustNotRespond,
  serverCancelledExpected,
  serverCancelledAbsenceVerdict,
  sessionCloseCancels,
  modernOnlyLegacyResponse,
  sessionClosedImpliesAllCancelled,
  INITIALIZE_NON_CANCELLABILITY_2026,
  canPoolObservations,
  proofSetKey,
  AUDIT_TUPLE_FIELDS,
  validateAuditTuple,
  makeAbortAuditEntry,
  normalizeSignalForm,
  computeW,
  classifyCancelObservation,
  AbortProofSet,
  claimServerStoppedFromMessageSilence,
  evaluateHttpAbort,
  isProtocolObservation,
  JSON_SERVER_OBLIGATION,
  TS_V2_MECHANISM,
  RUNTIME_SIGNAL_TABLE,
  runtimeSignalStatus,
  nodeSignalPresent,
  NODE_HANDLER_EDGES,
  GATE3_UNCHANGED_COMPANIONS,
  gate3Abortable,
};
