'use strict';
/**
 * audit-wire.cjs — NORTH-STAR WIRE ROUND 1: AUDIT MODE ONLY.
 *
 * The first, deliberately narrow wire of the north-star spec modules into
 * the workbench server. This module observes one local tool call's result
 * and appends a log-only audit record. It NEVER gates anything:
 *
 *   - no abort, discard, block, reorder, or forced action is ever returned;
 *   - the server seam DISCARDS this module's return value and never lets
 *     it touch the live output string (see server.ts, runOne hook);
 *   - the live path is unchanged when NORTHSTAR_AUDIT_WIRE is unset
 *     (default OFF): the server does not even load this file then.
 *
 * Honest module usage, no fabricated verdicts:
 *   - PROVENANCE ALWAYS runs: classifyResult() classifies the result by
 *     tool/source, and buildProvenance() builds the _meta object that
 *     WOULD be emitted — under the single namespaced key
 *     `io.github.uncommonpope-png/provenance` — applied to a COPY inside
 *     the audit record only, never to the live result.
 *   - VERIFIER runs ONLY when the caller supplies a trust tuple
 *     (identifier + protocolRevision + optional revisionString). Local
 *     tool calls carry no tuple, so the verifier is honestly SKIPPED for
 *     them — a tuple is never invented for a local call. When a tuple IS
 *     supplied, only its shape is validated (TupleKey); no known set or
 *     opt-in store exists in this audit context, so NO trust verdict is
 *     made or implied.
 *   - PLAN-EXECUTOR runs in ADVISORY mode only: the single call is
 *     modelled as a one-node plan and its level computation recorded,
 *     labelled advisory. It schedules, orders, and executes nothing.
 *
 * Safety contract (tested in audit-wire.test.cjs):
 *   - auditToolResult() NEVER throws, on any input. Every module call is
 *     wrapped in try/catch; failures are recorded, not raised.
 *   - auditToolResult() NEVER mutates its input. It reads only; args are
 *     snapshotted through a read-only, circular-safe clone.
 *   - No file writes, no network. The audit log is in-memory only.
 *
 * Honest limits (kept, not papered over):
 *   - The LIVE GATE is not wired: nothing here blocks or alters a tool
 *     call, and no live-gate intervention has been measured.
 *   - PC-side product-path audit and live wire observation of
 *     exec.result._meta are still owed (see north-star README.md).
 *   - No live latency data: the advisory level computation uses no
 *     real tool timing.
 *
 * Node.js, CommonJS, zero dependencies. Run: node audit-wire.test.cjs
 */

const provenanceMod = require('./provenance/provenance.cjs');
const verifierMod = require('./verifier/verifier.cjs');
const planExecutorMod = require('./plan-executor/plan-executor.cjs');

const PROVENANCE_KEY = provenanceMod.PROVENANCE_KEY;
const AUDIT_MODE = 'audit-only';
const VERIFIER_SKIPPED_REASON = 'no trust tuple supplied; local tool calls carry none';

// In-memory append-only audit log. Only clearAuditLog() empties it.
const auditLog = [];

// ---------------------------------------------------------------------------
// Read-only, circular-safe snapshot. Never mutates its input: it only reads.
// Depth- and size-capped so a hostile or huge args object cannot stall the
// live path; truncation is marked, never silent.
// ---------------------------------------------------------------------------
const MAX_SNAPSHOT_DEPTH = 10;
const MAX_SNAPSHOT_STRING = 4000;

function safeSnapshot(value, depth, seen) {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string') {
    return value.length > MAX_SNAPSHOT_STRING
      ? value.slice(0, MAX_SNAPSHOT_STRING) + '…[truncated]'
      : value;
  }
  if (t === 'number' || t === 'boolean' || t === 'bigint') return value;
  if (t === 'function' || t === 'symbol') return `[${t}]`;
  if (depth >= MAX_SNAPSHOT_DEPTH) return '[depth-limit]';
  if (t !== 'object') return String(value);
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => safeSnapshot(item, depth + 1, seen));
    }
    const out = {};
    for (const key of Object.keys(value)) {
      try {
        out[key] = safeSnapshot(value[key], depth + 1, seen);
      } catch (e) {
        out[key] = `[unreadable: ${e && e.message ? e.message : 'error'}]`;
      }
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

function snapshot(value) {
  try {
    return { snapshot: safeSnapshot(value, 0, new Set()), error: null };
  } catch (e) {
    return { snapshot: null, error: e && e.message ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Normalise the call shape. Accepts the documented object form
//   auditToolResult({ tool, args, output, trustTuple })
// and the positional form the server seam uses
//   auditToolResult(toolName, args, output[, trustTuple]).
// Reads only; never writes to the caller's object.
// ---------------------------------------------------------------------------
function normaliseCall(first, second, third, fourth) {
  if (typeof first === 'string' || first === null || first === undefined) {
    // Positional form, or a hostile bare call: tool may be null/undefined.
    if (typeof first === 'string' || second !== undefined || third !== undefined || fourth !== undefined) {
      return { tool: first, args: second, output: third, trustTuple: fourth };
    }
    return { tool: null, args: undefined, output: undefined, trustTuple: undefined, malformed: true };
  }
  if (typeof first === 'object') {
    return {
      tool: first.tool,
      args: first.args,
      output: first.output,
      trustTuple: first.trustTuple,
    };
  }
  return { tool: null, args: undefined, output: undefined, trustTuple: undefined, malformed: true };
}

function outputIsDenied(output) {
  return typeof output === 'string' && /^DENIED\b/.test(output);
}

function outputIsError(output) {
  return typeof output === 'string' && /^ERROR\b/.test(output);
}

// ---------------------------------------------------------------------------
// auditToolResult — NEVER throws, NEVER mutates input, NEVER returns an
// action. The returned record is log-only; the server discards it.
// ---------------------------------------------------------------------------
function auditToolResult(first, second, third, fourth) {
  let record;
  try {
    const call = normaliseCall(first, second, third, fourth);
    const toolName = typeof call.tool === 'string' && call.tool !== '' ? call.tool : null;
    const output = call.output;

    record = {
      ok: true,
      mode: AUDIT_MODE,
      // Explicit: the live path must act on nothing in this record.
      action: 'none — log only; no abort/discard/block/reorder/forced action',
      timestamp: new Date().toISOString(),
      tool: toolName,
      outputType: output === null ? 'null' : typeof output,
      outputLength: typeof output === 'string' ? output.length : null,
      outputPreview: typeof output === 'string' ? output.slice(0, 500) : null,
      classification: null,
      provenance: null,
      verifier: null,
      planExecutor: null,
    };
    if (call.malformed) {
      record.ok = false;
      record.error = 'auditToolResult: input must be a tool-call object or (tool, args, output)';
    }

    // Args snapshot: read-only copy for the log; the caller's object is
    // never written to, so a deep-frozen input passes through untouched.
    const argsSnap = snapshot(call.args);
    record.argsSnapshot = argsSnap.snapshot;
    if (argsSnap.error) {
      record.ok = false;
      record.error = `args snapshot failed: ${argsSnap.error}`;
    }

    // --- Provenance: ALWAYS runs -----------------------------------------
    try {
      const classifyOpts = { toolName };
      if (outputIsDenied(output)) classifyOpts.denied = true;
      if (outputIsError(output)) classifyOpts.isError = true;
      // Pass through URL evidence if the caller carried any (read-only).
      if (call.args && typeof call.args === 'object') {
        if (typeof call.args.sourceUrl === 'string') classifyOpts.sourceUrl = call.args.sourceUrl;
        if (typeof call.args.finalUrl === 'string') classifyOpts.finalUrl = call.args.finalUrl;
      }
      const classification = provenanceMod.classifyResult(classifyOpts);
      record.classification = classification;
      // The _meta object that WOULD be emitted, on a COPY inside this
      // record only. Keys: exactly the one namespaced key, no bare keys.
      record.provenance = provenanceMod.buildProvenance('local', {
        tool: toolName === null ? 'unknown' : toolName,
        sourceClass: classification && classification.sourceClass ? classification.sourceClass : 'unknown',
      });
    } catch (e) {
      record.ok = false;
      record.error = `provenance failed: ${e && e.message ? e.message : String(e)}`;
      record.provenance = { ok: false, error: record.error };
    }

    // --- Verifier: ONLY with a caller-supplied trust tuple ---------------
    try {
      const tuple = call.trustTuple;
      if (tuple === null || tuple === undefined) {
        record.verifier = { skipped: VERIFIER_SKIPPED_REASON };
      } else {
        // Shape validation only. No known set, no opt-in store, and no
        // trust store exists in this audit context, so no trust verdict
        // is made, implied, or recorded as one.
        const key = verifierMod.TupleKey.fromPlain(tuple);
        record.verifier = {
          run: true,
          tuple: key.asObject(),
          tupleKey: key.key(),
          trustJudgment: 'none — audit mode; no known set or opt-in store consulted, so no trust verdict is made',
        };
      }
    } catch (e) {
      record.verifier = { ok: false, error: e && e.message ? e.message : String(e) };
    }

    // --- Plan-executor: ADVISORY mode only -------------------------------
    try {
      const levels = planExecutorMod.computeLevels([{ id: 'call', dependsOn: [] }]);
      record.planExecutor = {
        advisory: true,
        mode: 'advisory-only — schedules, orders, and executes nothing',
        plan: [{ id: 'call', dependsOn: [] }],
        levels: levels.levels,
        levelOf: levels.levelOf,
      };
    } catch (e) {
      record.planExecutor = { ok: false, error: e && e.message ? e.message : String(e) };
    }
  } catch (e) {
    // Outer fail-open: even a failure in the record assembly itself must
    // not throw into the live path.
    record = {
      ok: false,
      mode: AUDIT_MODE,
      action: 'none — log only; no abort/discard/block/reorder/forced action',
      timestamp: new Date().toISOString(),
      error: e && e.message ? e.message : String(e),
    };
  }
  auditLog.push(record);
  return record;
}

function getAuditLog() {
  return auditLog.slice();
}

function clearAuditLog() {
  auditLog.length = 0;
}

function isAuditWireEnabled() {
  return process.env.NORTHSTAR_AUDIT_WIRE === '1';
}

module.exports = {
  auditToolResult,
  getAuditLog,
  clearAuditLog,
  isAuditWireEnabled,
  PROVENANCE_KEY,
  AUDIT_MODE,
  VERIFIER_SKIPPED_REASON,
};
