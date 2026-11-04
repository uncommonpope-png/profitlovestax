'use strict';
/**
 * step-repetition.cjs — Batch 216 step-repetition flag (BUILD ROUND 15).
 *
 * LEDGER-ONLY diagnostic. Nothing in this module aborts, discards, blocks,
 * reorders, or forces any live tool call, and nothing here is a live gate.
 * It is NOT hooked into server.ts or the audit-wire live hook as a gate;
 * audit/log use only. Any attempt to attach a live threshold, nudge,
 * handler, or auto-skip throws (see assertLedgerOnly / refuseLiveIntervention).
 *
 * Spec: Batch 216 (seen.md), building on Batch 214's taxonomy audit
 * (step repetition = one of exactly two NEW ledger event types) and
 * Batch 10's normalized-call rules. It DELIBERATELY does not reuse
 * plan-executor's normalizeCall214 / stepRepetitionFlag214: those are a
 * round-14 stub (sorted keys + trim only, caller-supplied status string,
 * no guard-unknown, no sub-types, no polling, no parallel handling).
 * This module implements the full Batch 216 spec; the stub is left
 * untouched (deltas only).
 *
 * FIRING RULE (diagnostic, count = 2): hop H fires iff ALL of:
 *   (a) H's normalized call equals a prior hop P in the SAME trajectory
 *       (never across trajectories or routines);
 *   (b) P's observation status = verified-success, derived strictly as
 *       schema-valid + non-conflicting + value present — NOT merely
 *       "returned 200" and NOT the plan-executor's 'ok' status;
 *   (c) no intervening hop strictly between P and H is a write whose
 *       effect footprint intersects any of H's inputs;
 *   (d) H is not covered by a declared polling exemption.
 * Distance H-P is recorded, not thresholded.
 *
 * COMPARISON ANSWERS (honest, measured against the repo at build time):
 *   (a) OBSERVATION STATUS — the shipped ledger does NOT derive or emit
 *       verified-success per hop. Plan-executor records observations as
 *       {status: 'ok'|'error'} ('ok' = merely returned, which conflates
 *       verified-success with unverified returns), and round 14's
 *       stepRepetitionFlag214 only string-compares a caller-supplied
 *       'verified-success' value. This module therefore supplies the
 *       strict derivation itself (deriveObservationStatus, all three
 *       components required) and the flag accepts ONLY that exact value.
 *       It never derives verified-success from 'ok', from a 200, or from
 *       a bare return. Until the live ledger emits derived status per
 *       hop, offline callers must pass the derived value; the module
 *       refuses to infer it. Condition (b) is implemented as written,
 *       not weakened — any prior lacking three-component proof is
 *       refused as a prior and counted as a retry candidate, never
 *       treated as verified.
 *   (b) READ-SET COVERAGE — zero. No tool definition anywhere in the
 *       repo (plan-executor, verifier, provenance, interceptors,
 *       audit-wire) declares a read set: tools are caller-supplied
 *       functions with no tool registry at all. Coverage is therefore
 *       0 declared read sets, far below Batch 216's ~50% falsifier
 *       line. The flag's rule-grade reading FAILS on the repo as it
 *       stands; every flag on an undeclared tool is guard-unknown and
 *       graded below rule-grade, and any routine whose flags are
 *       >50% guard-unknown reports "unmeasured, not zero" (see
 *       reportRoutineGuardUnknown). Read-set declarations must be
 *       prioritized over any flag wiring. This module does NOT claim
 *       rule-grade precision the repo cannot support.
 *
 * Four deliberate divergences from Pydantic AI Harness DetectLoops
 * (encoded + tested, not copied):
 *   (1) Identity = Batch 10 NORMALIZED call, not canonical JSON.
 *       Flags record NORMALIZATION_SPEC_VERSION ('v1') alongside the
 *       hash; v1 flags are not comparable to v2 flags.
 *   (2) Prior must be verified-success only. Repeat after error is a
 *       retry, never step-repetition; it belongs to retry/failure
 *       analysis, not this rate.
 *   (3) NO same-result requirement. repeat-same-result and
 *       repeat-changed-result are SEPARATE sub-types, counted
 *       separately, never merged into one rate. A changed result with
 *       no logged write is itself diagnostic (external change,
 *       nondeterminism, or a missed write).
 *   (4) LEDGER-ONLY. No nudge, no error, no handler, no live
 *       threshold. Pydantic's 5/3 thresholds are framework defaults,
 *       not measured optima, and are NOT adopted. Any future live
 *       threshold is a separate calibrated number, not this flag's
 *       firing rule.
 *
 * Node.js, CommonJS, zero dependencies (node:crypto only, built in).
 * Run: node step-repetition.test.cjs
 */

const crypto = require('node:crypto');

const NORMALIZATION_SPEC_VERSION = 'v1';
const VERIFIED_SUCCESS = 'verified-success';

// Guard-result vocabulary (Batch 216). Note: 'intersecting-write-exempt'
// never appears on an emitted flag — it is the guard outcome that BLOCKS
// a flag, recorded on guardExemptCandidates instead.
const GUARD_RESULTS = Object.freeze([
  'none',
  'unrelated-write',
  'intersecting-write-exempt',
  'unknown-undeclared',
]);
const SUB_TYPES = Object.freeze([
  'repeat-same-result',
  'repeat-changed-result',
  'write-repeat',
]);
const FLAG_FIELDS = Object.freeze([
  'trajectoryId',
  'hopId',
  'priorHopId',
  'normalizedCallHash',
  'normalizationSpecVersion',
  'priorObservationStatus',
  'guardResult',
  'subType',
  'distance',
  'pollExemptionStatus',
  'labelGrade',
]);
const LIVE_ACTIONS = Object.freeze([
  'nudge',
  'error',
  'handler',
  'live-threshold',
  'liveThreshold',
  'threshold',
  'live-gate',
  'liveGate',
  'auto-skip',
  'autoSkip',
  'skip',
]);

// ---------------------------------------------------------------------------
// Observation status (Batch 11 definition, Batch 216 condition (b))
// ---------------------------------------------------------------------------

/**
 * Derive an observation status from its three components. verified-success
 * requires ALL three: schemaValid === true, conflicting === false, and
 * valuePresent === true. Anything else is never verified-success:
 * conflicting => 'conflicting', otherwise 'error'. In particular a bare
 * 'ok' / returned-200 / merely-returned observation has no components
 * and must NOT be passed here as verified.
 */
function deriveObservationStatus(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('deriveObservationStatus: input must be { schemaValid, conflicting, valuePresent } (Batch 216: verified = schema-valid + non-conflicting + value present)');
  }
  if (input.conflicting === true) return 'conflicting';
  if (input.schemaValid === true && input.valuePresent === true) return VERIFIED_SUCCESS;
  return 'error';
}

function isVerifiedSuccess(status) {
  return status === VERIFIED_SUCCESS;
}

// ---------------------------------------------------------------------------
// Batch 10 normalized call
// ---------------------------------------------------------------------------

function _isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function _canonical(value) {
  if (Array.isArray(value)) return value.map(_canonical);
  if (_isPlainObject(value)) {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = _canonical(value[k]);
    return out;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('normalizeCall: non-finite numbers cannot be hashed reliably');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value === 'string') return value.trim();
  return value;
}

function _canonicalString(value) {
  return JSON.stringify(_canonical(value));
}

/** Resolve ReWOO variables (#E1, #E2, ...) BEFORE comparison (Batch 10:
 *  normalize AFTER variable substitution, or identical plans with
 *  different intermediate IDs split). Exact-token match, plus embedded
 *  replacement inside strings. */
function _resolveVariables(value, variables) {
  if (!variables || typeof variables !== 'object') return value;
  if (typeof value === 'string') {
    if (Object.prototype.hasOwnProperty.call(variables, value)) return variables[value];
    return value.replace(/#E\d+/g, (tok) =>
      Object.prototype.hasOwnProperty.call(variables, tok) ? String(variables[tok]) : tok);
  }
  if (Array.isArray(value)) return value.map((v) => _resolveVariables(v, variables));
  if (_isPlainObject(value)) {
    const out = {};
    for (const k of Object.keys(value)) out[k] = _resolveVariables(value[k], variables);
    return out;
  }
  return value;
}

function _normalizeScalar(value, rule, argName) {
  const kind = (rule && rule.kind) || 'exact';
  if (kind === 'exact') return _canonical(value);
  if (kind === 'casefold') {
    if (typeof value !== 'string') throw new Error(`normalizeCall: casefold arg "${argName}" must be a string`);
    return value.trim().toLowerCase();
  }
  if (kind === 'number') {
    const n = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(n)) throw new Error(`normalizeCall: number arg "${argName}" is not numeric`);
    if (rule.tolerance !== undefined && rule.tolerance !== null && rule.tolerance > 0) {
      // Tolerance is quantized into buckets for hashing. Boundary caveat:
      // values straddling a bucket edge do not merge; tolerance is a
      // quantization, not an exact interval comparison. Documented here
      // so no caller mistakes it for exact tolerance equality. The 1e-9
      // epsilon only repairs float representation at a bucket edge
      // (19.99 / 0.02 is 999.4999999999999 in floats, not 999.5).
      return Math.round(n / rule.tolerance + 1e-9);
    }
    return n;
  }
  if (kind === 'date') {
    if (typeof value !== 'string') throw new Error(`normalizeCall: date arg "${argName}" must be a string`);
    const ms = Date.parse(value.trim());
    if (Number.isNaN(ms)) return value.trim(); // unparseable: fall back to trimmed string, never invented
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (kind === 'enum-alias') {
    if (typeof value !== 'string') throw new Error(`normalizeCall: enum-alias arg "${argName}" must be a string`);
    const key = value.trim().toLowerCase();
    const aliases = rule.aliases || {};
    const folded = {};
    for (const k of Object.keys(aliases)) folded[k.trim().toLowerCase()] = aliases[k];
    return Object.prototype.hasOwnProperty.call(folded, key) ? folded[key] : value.trim();
  }
  if (kind === 'default') {
    // Present values are exact-trimmed; absence is handled by the caller
    // (missing arg is inserted as rule.defaultValue before this runs).
    return _canonical(value);
  }
  if (kind === 'ignored') {
    // Batch 10 danger rule: an argument may be marked ignored ONLY if it
    // provably cannot change the call's effect (request notes, comments).
    // Meaning-bearing text is never ignored — that would collapse
    // distinct meanings into one cluster (unsafe direction). The caller
    // must declare effectFree explicitly; silence is a refusal, not a
    // default.
    if (!rule.effectFree) {
      throw new Error(`normalizeCall: REFUSED — arg "${argName}" marked "ignored" without effectFree: true (Batch 10: meaning-bearing text is never ignored; only provably effect-free args may be ignored)`);
    }
    return undefined; // sentinel: dropped by the caller
  }
  throw new Error(`normalizeCall: unknown normalization rule kind "${kind}" for arg "${argName}"`);
}

/**
 * Normalize a tool call under Batch 10 rules.
 * call: { tool, args, variables? } — variables resolved before comparison.
 * opts.argRules: { [argName]: { kind, ... } } — per-argument rules owned
 *   by the tool definition and versioned with it. Default rule is 'exact'
 *   (path/code args stay exact; casefold applies only where declared).
 *   Free-text args with no rule are exact-trimmed: synonyms do NOT merge
 *   (no embedding/NLI fallback is implemented here — that would need a
 *   model; the honest limit is exact comparison, never silent merging).
 * Returns { tool, args, canonical, hash, specVersion }.
 */
function normalizeCall(call, opts) {
  if (!call || typeof call.tool !== 'string' || !call.tool.trim()) {
    throw new Error('normalizeCall: call must be { tool, args } with a non-empty tool name');
  }
  if (!call.args || typeof call.args !== 'object' || Array.isArray(call.args)) {
    throw new Error('normalizeCall: call.args must be an object');
  }
  const options = opts || {};
  const argRules = options.argRules || {};
  const variables = call.variables || options.variables || null;
  const resolved = _resolveVariables(call.args, variables);
  const normalized = {};
  const seen = new Set(Object.keys(resolved));
  for (const argName of Object.keys(resolved)) {
    const rule = argRules[argName];
    if (rule && rule.kind === 'ignored') {
      // Validates the effectFree declaration (throws if absent).
      _normalizeScalar(resolved[argName], rule, argName);
      continue; // dropped
    }
    normalized[argName] = _normalizeScalar(resolved[argName], rule || { kind: 'exact' }, argName);
    // Nested values: canonicalize (sorted keys, trimmed strings).
    normalized[argName] = _canonical(normalized[argName]);
  }
  // Documented defaults: an omitted arg equal to its documented default
  // normalizes to the same form as an explicit default.
  for (const argName of Object.keys(argRules)) {
    const rule = argRules[argName];
    if (rule && rule.kind === 'default' && !seen.has(argName)) {
      normalized[argName] = _canonical(rule.defaultValue);
    }
  }
  const canonical = _canonicalString({ tool: call.tool.trim(), args: normalized });
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return { tool: call.tool.trim(), args: normalized, canonical, hash, specVersion: NORMALIZATION_SPEC_VERSION };
}

/** Multiset for parallel calls (Batch 10): order-invariant, duplicate
 *  counts preserved. Two parallel-call groups are equal iff their sorted
 *  hash multisets are equal. */
function normalizeParallelCalls(calls, opts) {
  if (!Array.isArray(calls)) throw new Error('normalizeParallelCalls: calls must be an array');
  const hashes = calls.map((c) => normalizeCall(c, opts).hash).sort();
  return { hashes, canonical: JSON.stringify(hashes), specVersion: NORMALIZATION_SPEC_VERSION };
}

function flagsComparable(a, b) {
  if (!a || !b) return false;
  return a.normalizationSpecVersion === b.normalizationSpecVersion;
}

// ---------------------------------------------------------------------------
// Ledger-only refusal
// ---------------------------------------------------------------------------

function assertLedgerOnly(input) {
  if (!input || typeof input !== 'object') return { mode: 'ledger-only' };
  for (const key of Object.keys(input)) {
    if (LIVE_ACTIONS.includes(key) || LIVE_ACTIONS.includes(input[key])) {
      throw new Error(`assertLedgerOnly: REFUSED — live intervention "${key}" is not part of this round (Batch 216: LEDGER-ONLY, no nudge, no error, no handler, no live threshold, no auto-skip of repeated writes; a live threshold is a separate future calibrated number)`);
    }
  }
  if (input.live === true || input.liveGate === true || input.mode === 'live-gate') {
    throw new Error('assertLedgerOnly: REFUSED — live-gate mode is not part of this round (Batch 216: LEDGER-ONLY)');
  }
  return { mode: 'ledger-only' };
}

/** Any attempt to add a live threshold / nudge / handler / auto-skip in
 *  this round throws here, rather than being silently added. */
function refuseLiveIntervention(request) {
  if (!request || typeof request !== 'object') throw new Error('refuseLiveIntervention: request must be an object');
  const action = request.action || request.kind || request.type;
  if (LIVE_ACTIONS.includes(action)) {
    throw new Error(`refuseLiveIntervention: REFUSED — live intervention "${action}" is not part of this round (Batch 216: LEDGER-ONLY; Pydantic's thresholds are framework defaults, not measured optima, and are NOT adopted)`);
  }
  return { mode: 'ledger-only', action: action || null };
}

// ---------------------------------------------------------------------------
// Read sets, footprints, poll declarations
// ---------------------------------------------------------------------------

function _normalizeFieldList(list, what) {
  if (list === undefined || list === null) return null; // undeclared
  if (!Array.isArray(list)) throw new Error(`step-repetition: ${what} must be an array of "resource.field" strings or { resource, field } objects, or absent (undeclared)`);
  return list.map((entry) => {
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry.resource === 'string' && typeof entry.field === 'string') {
      return `${entry.resource.trim()}.${entry.field.trim()}`;
    }
    throw new Error(`step-repetition: ${what} entries must be "resource.field" strings or { resource, field } objects`);
  });
}

function _isWriteHop(hop) {
  return hop.hopClass === 'write' || hop.hopClass === 'commit';
}

function _validatePollDeclarations(declarations) {
  const byId = new Map();
  for (const d of declarations || []) {
    if (!d || typeof d.id !== 'string') throw new Error('step-repetition: poll declarations need a string id');
    // Bounded budget is mandatory: max polls + backoff. An unbounded
    // "poll forever" declaration is not a declaration, it is a loop.
    if (!Number.isInteger(d.maxPolls) || d.maxPolls < 1) {
      throw new Error(`step-repetition: poll declaration "${d.id}" must carry a bounded poll budget (maxPolls, positive integer)`);
    }
    if (d.backoff === undefined || d.backoff === null) {
      throw new Error(`step-repetition: poll declaration "${d.id}" must carry a backoff (bounded poll budget: max polls + backoff)`);
    }
    byId.set(d.id, d);
  }
  return byId;
}

// ---------------------------------------------------------------------------
// Flag event grading / validation / reporting
// ---------------------------------------------------------------------------

function validateFlagEvent(event) {
  const violations = [];
  if (!event || typeof event !== 'object') return { valid: false, precisionGrade: 'judge-grade', violations: ['event-missing'] };
  for (const f of FLAG_FIELDS) {
    if (event[f] === undefined || event[f] === null) violations.push(`missing-field:${f}`);
  }
  if (event.priorObservationStatus !== undefined && event.priorObservationStatus !== VERIFIED_SUCCESS) {
    violations.push('prior-not-verified-success');
  }
  if (event.guardResult !== undefined && !GUARD_RESULTS.includes(event.guardResult)) {
    violations.push(`unknown-guard-result:${event.guardResult}`);
  }
  let precisionGrade;
  if (violations.some((v) => v.startsWith('missing-field:')) || violations.includes('prior-not-verified-success')) {
    precisionGrade = 'judge-grade';
  } else if (event.guardResult === 'unknown-undeclared') {
    precisionGrade = 'guard-unknown';
  } else {
    precisionGrade = 'rule-grade';
  }
  return { valid: violations.length === 0, precisionGrade, violations };
}

/** Missing any required field downgrades the event to judge-grade
 *  (Batch 216 field-completeness rule). Guard-unknown is below rule-grade
 *  but is not a missing-field downgrade; it keeps its own grade. */
function gradeFlagEvent(event) {
  return validateFlagEvent(event).precisionGrade;
}

/** Count spec violations across externally supplied flag events: any
 *  event whose prior observation status is not verified-success is a
 *  spec violation to count (the firing rule forbids counting it). */
function countSpecViolations(events) {
  if (!Array.isArray(events)) throw new Error('countSpecViolations: events must be an array');
  let count = 0;
  const violating = [];
  for (const e of events) {
    if (!e || e.priorObservationStatus !== VERIFIED_SUCCESS) {
      count += 1;
      violating.push(e && e.hopId !== undefined ? e.hopId : null);
    }
  }
  return { count, violatingHopIds: violating };
}

/** Guard-unknown share per routine (Batch 216 honesty clause). If
 *  guard-unknown exceeds half a routine's flags, that routine's rate is
 *  "unmeasured, not zero" — never reported as zero. */
function reportRoutineGuardUnknown(input) {
  if (!input || !Array.isArray(input.flags)) throw new Error('reportRoutineGuardUnknown: input must be { routineId, flags }');
  const total = input.flags.length;
  const guardUnknown = input.flags.filter((f) => f.guardResult === 'unknown-undeclared').length;
  const share = total === 0 ? null : guardUnknown / total;
  return {
    routineId: input.routineId || null,
    totalFlags: total,
    guardUnknownCount: guardUnknown,
    guardUnknownShare: share,
    rateVerdict: total === 0 ? 'unmeasured, not zero' : share > 0.5 ? 'unmeasured, not zero' : 'measured',
    note: share !== null && share > 0.5
      ? 'Guard-unknown exceeds half this routine\'s flags — its step-repetition rate is unmeasured, not zero (Batch 216)'
      : 'Guard-unknown share carried alongside the flag rate (Batch 216)',
  };
}

/** Read-set coverage survey (Batch 216 falsifier). tools: [{ tool, readSet }]
 *  where readSet is an array (declared, possibly empty) or absent (undeclared).
 *  Coverage below ~50% kills the flag's rule-grade reading. */
function readSetCoverage(toolDeclarations) {
  if (!Array.isArray(toolDeclarations)) throw new Error('readSetCoverage: toolDeclarations must be an array of { tool, readSet }');
  const total = toolDeclarations.length;
  const declared = toolDeclarations.filter((t) => Array.isArray(t.readSet)).length;
  const coverage = total === 0 ? null : declared / total;
  return {
    total,
    declared,
    undeclared: total - declared,
    coverage,
    ruleGradeReading: total === 0 ? 'unmeasured — no tool declarations surveyed' : coverage >= 0.5 ? 'not-refuted' : 'FAILED — below ~50% (Batch 216 falsifier): the flag\'s rule-grade reading fails; report guard-unknown share, do not claim rule-grade precision',
  };
}

// ---------------------------------------------------------------------------
// The flag scan (offline / ledger pass over one trajectory)
// ---------------------------------------------------------------------------

/**
 * Scan one trajectory for step-repetition flags. Pure function: reads its
 * input, returns events, mutates nothing, touches no live call.
 *
 * input: {
 *   trajectoryId, hops: [{ id, tool, args, hopClass?, observationStatus?,
 *     result?, observationValue?, readSet?, effectFootprint?,
 *     batchId?, responseId?, pollDeclarationId?, variables? }],
 *   argRulesByTool?: { [tool]: argRules },
 *   pollDeclarations?: [{ id, maxPolls, backoff }],
 *   pollableTools?: [tool],   // tools marked pollable (declared exemption)
 * }
 * hop.index, when present, is the hop number used for distance; otherwise
 * array position is used. Hops with a hop.trajectoryId that differs from
 * the trajectory id throw — the flag never spans trajectories.
 *
 * Returns { trajectoryId, flags, duplicateInBatch, budgetEvents,
 *   guardExemptCandidates, retryCandidates, countsBySubType,
 *   specViolations } where specViolations is empty by construction: this
 *   scan never emits a flag whose prior is not verified-success.
 *   Non-verified repeats are reported as retryCandidates, not flags.
 */
function detectStepRepetition(input) {
  assertLedgerOnly(input);
  if (!input || typeof input.trajectoryId !== 'string' || !input.trajectoryId) {
    throw new Error('detectStepRepetition: input must carry a trajectoryId');
  }
  if (!Array.isArray(input.hops)) throw new Error('detectStepRepetition: input.hops must be an array');
  const declarations = _validatePollDeclarations(input.pollDeclarations);
  const pollableTools = new Set(input.pollableTools || []);
  const argRulesByTool = input.argRulesByTool || {};

  // Validate + normalize every hop once.
  const hops = input.hops.map((hop, position) => {
    if (!hop || typeof hop.id !== 'string') throw new Error('detectStepRepetition: every hop needs a string id');
    if (hop.trajectoryId !== undefined && hop.trajectoryId !== input.trajectoryId) {
      throw new Error(`detectStepRepetition: REFUSED — hop "${hop.id}" belongs to trajectory "${hop.trajectoryId}", not "${input.trajectoryId}"; the flag never spans trajectories`);
    }
    const normalized = normalizeCall(
      { tool: hop.tool, args: hop.args || {}, variables: hop.variables },
      { argRules: argRulesByTool[hop.tool] || {} },
    );
    return {
      ...hop,
      position,
      index: Number.isInteger(hop.index) ? hop.index : position,
      normalized,
      readSet: _normalizeFieldList(hop.readSet, `hop "${hop.id}" readSet`),
      effectFootprint: _normalizeFieldList(hop.effectFootprint, `hop "${hop.id}" effectFootprint`),
      batchId: hop.batchId !== undefined ? hop.batchId : hop.responseId !== undefined ? hop.responseId : null,
    };
  });

  const flags = [];
  const guardExemptCandidates = [];
  const retryCandidates = [];
  const budgetEvents = [];
  const countsBySubType = { 'repeat-same-result': 0, 'repeat-changed-result': 0, 'write-repeat': 0 };

  // Poll-budget accounting, per declaration, in trajectory order.
  const pollCounts = new Map();
  const exemptByHop = new Map();
  for (const hop of hops) {
    let exemption = { exempt: false, declarationId: null };
    if (hop.pollDeclarationId !== undefined && hop.pollDeclarationId !== null) {
      const decl = declarations.get(hop.pollDeclarationId);
      if (!decl) throw new Error(`detectStepRepetition: hop "${hop.id}" references unknown poll declaration "${hop.pollDeclarationId}" — inferred intent is never an exemption; the declaration must exist`);
      exemption = { exempt: true, declarationId: decl.id };
      const count = (pollCounts.get(decl.id) || 0) + 1;
      pollCounts.set(decl.id, count);
      if (count > decl.maxPolls) {
        budgetEvents.push({
          eventType: 'poll-budget-exceeded',
          trajectoryId: input.trajectoryId,
          declarationId: decl.id,
          hopId: hop.id,
          pollCount: count,
          maxPolls: decl.maxPolls,
          backoff: decl.backoff,
          note: 'Separate budget event, not a step-repetition flag (Batch 216)',
        });
      }
    } else if (pollableTools.has(hop.tool)) {
      exemption = { exempt: true, declarationId: `pollable-tool:${hop.tool}` };
    }
    // Note: hop.looksLikePolling / hop.pollSuspected / any inferred intent
    // is deliberately NOT consulted here. Inferred intent is never an
    // exemption (Batch 216); an undeclared poll IS a loop by every
    // observable, and the fix is to declare the poll, not to infer it.
    exemptByHop.set(hop.id, exemption);
  }

  // Duplicate-in-batch: identical calls in the SAME response have no
  // verified prior yet, so they are NOT this flag. Separate anomaly.
  const duplicateInBatch = [];
  const byBatch = new Map();
  for (const hop of hops) {
    if (hop.batchId === null) continue;
    const key = `${hop.batchId}::${hop.normalized.hash}`;
    if (!byBatch.has(key)) byBatch.set(key, []);
    byBatch.get(key).push(hop);
  }
  for (const group of byBatch.values()) {
    if (group.length > 1) {
      duplicateInBatch.push({
        eventType: 'duplicate-in-batch',
        trajectoryId: input.trajectoryId,
        batchId: group[0].batchId,
        hopIds: group.map((h) => h.id),
        normalizedCallHash: group[0].normalized.hash,
        normalizationSpecVersion: NORMALIZATION_SPEC_VERSION,
        count: group.length,
        note: 'Parallel duplicates in the SAME response are NOT step repetition (no verified prior yet); separate anomaly, separate count (Batch 216)',
      });
    }
  }

  for (let hi = 0; hi < hops.length; hi += 1) {
    const hop = hops[hi];
    const exemption = exemptByHop.get(hop.id);
    if (exemption.exempt) continue; // declared poll: exempt from this flag (budget handled above)

    // Priors: earlier hops in a DIFFERENT batch with the same normalized
    // call. Nearest verified-success prior wins (see module header for
    // why an earlier verified prior cannot rescue a guard-exempt nearest
    // one: any write between the nearest prior and H is also between an
    // earlier prior and H).
    let prior = null;
    let hasNonVerifiedRepeat = false;
    for (let pi = hi - 1; pi >= 0; pi -= 1) {
      const cand = hops[pi];
      if (cand.batchId !== null && hop.batchId !== null && cand.batchId === hop.batchId) continue;
      if (cand.normalized.hash !== hop.normalized.hash) continue;
      if (cand.observationStatus === VERIFIED_SUCCESS) {
        prior = cand;
        break;
      }
      hasNonVerifiedRepeat = true;
    }
    if (!prior) {
      // Repeat after error is a retry, never step-repetition.
      if (hasNonVerifiedRepeat) {
        retryCandidates.push({
          hopId: hop.id,
          normalizedCallHash: hop.normalized.hash,
          note: 'Repeat after a non-verified prior is a retry, not step repetition; belongs to retry/failure analysis, not this rate (Batch 216 divergence 2)',
        });
      }
      continue;
    }

    // Guard (c): intervening writes strictly between prior and H.
    const intervening = hops.slice(hops.indexOf(prior) + 1, hi);
    const interveningWrites = intervening.filter(_isWriteHop);
    let guardResult;
    const readSetDeclared = hop.readSet !== null;
    if (readSetDeclared) {
      const intersecting = interveningWrites.filter(
        (w) => w.effectFootprint !== null && w.effectFootprint.some((f) => hop.readSet.includes(f)),
      );
      if (intersecting.length > 0) {
        guardExemptCandidates.push({
          hopId: hop.id,
          priorHopId: prior.id,
          guardResult: 'intersecting-write-exempt',
          intersectingWriteHopIds: intersecting.map((w) => w.id),
          note: 'Re-read after a write to its inputs is a fresh read, not a repetition (Batch 216 guard)',
        });
        continue; // guard-exempt: no flag
      }
      const unknownFootprint = interveningWrites.some((w) => w.effectFootprint === null);
      if (unknownFootprint) {
        guardResult = 'unknown-undeclared';
      } else if (interveningWrites.length > 0) {
        guardResult = 'unrelated-write';
      } else {
        guardResult = 'none';
      }
    } else {
      // No declared read set => guard UNKNOWN, not "no write".
      guardResult = 'unknown-undeclared';
    }

    // Sub-type: write-repeat wins over result comparison (H itself a
    // write equal to a verified-success prior write; the prior write is
    // NOT an intervening write — intervening means strictly between).
    let subType;
    let resultComparison;
    if (_isWriteHop(hop)) {
      subType = 'write-repeat';
      resultComparison = 'not-applicable-write-repeat';
    } else {
      const priorResult = prior.result !== undefined ? prior.result : prior.observationValue;
      const hopResult = hop.result !== undefined ? hop.result : hop.observationValue;
      if (priorResult !== undefined && hopResult !== undefined) {
        resultComparison = _canonicalString(priorResult) === _canonicalString(hopResult) ? 'same' : 'changed';
        subType = resultComparison === 'same' ? 'repeat-same-result' : 'repeat-changed-result';
      } else {
        // Offline passes label completed trajectories, so both results
        // should be present. Absence is recorded, not invented: the
        // flag is emitted with an unknown comparison, and the offline
        // pass must count unknown-comparison flags separately rather
        // than reading them as changed-result evidence.
        resultComparison = 'unknown';
        subType = 'repeat-changed-result';
      }
    }
    countsBySubType[subType] += 1;

    const flag = {
      trajectoryId: input.trajectoryId,
      hopId: hop.id,
      priorHopId: prior.id,
      normalizedCallHash: hop.normalized.hash,
      normalizationSpecVersion: NORMALIZATION_SPEC_VERSION,
      priorObservationStatus: prior.observationStatus,
      guardResult,
      subType,
      distance: hop.index - prior.index,
      pollExemptionStatus: { exempt: false, declarationId: null },
      labelGrade: 'new-flag',
      resultComparison,
      hopClass: hop.hopClass || 'read',
      readSetDeclared,
    };
    flags.push(flag);
  }

  return {
    trajectoryId: input.trajectoryId,
    flags,
    duplicateInBatch,
    budgetEvents,
    guardExemptCandidates,
    retryCandidates,
    countsBySubType,
    specViolations: [],
    note: 'Ledger-only diagnostic (Batch 216): flags are emitted, never acted on; specViolations is empty by construction because this scan never emits a flag whose prior is not verified-success',
  };
}

module.exports = {
  NORMALIZATION_SPEC_VERSION,
  VERIFIED_SUCCESS,
  GUARD_RESULTS,
  SUB_TYPES,
  FLAG_FIELDS,
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
};
