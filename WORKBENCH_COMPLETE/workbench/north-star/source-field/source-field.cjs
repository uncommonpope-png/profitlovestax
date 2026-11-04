'use strict';
/**
 * source-field.cjs — Batch 221 provenance source-field refinement
 * (BUILD ROUND 18), the LAST of Batch 214's four owed specs (after
 * Batch 216 step repetition, round 15; Batch 218 completion predicate,
 * round 16; Batch 220 drift metric, round 17).
 *
 * LEDGER-ONLY diagnostic. Nothing in this module aborts, discards, blocks,
 * reorders, or forces any live tool call, and nothing here is a live gate.
 * It is NOT hooked into server.ts or the audit-wire live hook as a gate;
 * audit/log use only. Any future LIVE use (e.g. a pre-execution
 * provenance block on untraceable commit arguments) is a SEPARATE
 * calibrated intervention under Batch 13's rule and is NOT built here:
 * refuseLiveIntervention throws on any live-gate / pre-execution-block /
 * block / abort / reorder / force-call attempt.
 *
 * Spec: Batch 221 (seen.md), compared against W3C PROV (entity-level
 * provenance) and OpenTelemetry GenAI semantic conventions
 * (whole-payload spans). FIVE DIVERGENCES, all encoded and tested:
 *   1. LEAF GRANULARITY, not entity-level: one record per LEAF of the
 *      argument tree (PROV would attach provenance to the whole
 *      entity / tool call). A parameter is never "grounded" while one
 *      leaf is untraceable.
 *   2. SNAPSHOT POINTERS, not content copies: a value reference is the
 *      HASH of the normalized leaf value, and a source_ref points into
 *      already-logged trajectory content (turn, fact snapshot, prior
 *      result snapshot). Blobs / long text are spans (resource id +
 *      version + byte/line range + hash), never content.
 *   3. EXPLICIT TRANSFORMS, re-run in code: a derived value is graded
 *      by RE-RUNNING the documented transform on the named source
 *      field(s) and comparing, never by asserting the claim. A
 *      transform not in the per-routine/per-tool registry is not a
 *      transform for grading: derived-unverified, registry gap logged.
 *   4. AMBIGUITY AS A GRADE, not a failure or a pass: candidate_set
 *      size > 1 passes the hallucination check (the value exists in a
 *      real source field) and FAILS as misinterpretation proof (report
 *      as ambiguous, never a verdict either way).
 *   5. MODEL-CLAIMED PROVENANCE REJECTED: a model_generation record
 *      carrying a source_ref, a forward/cross-trajectory tool_result
 *      ref, and a non-derived kind carrying a transform are spec
 *      violations COUNTED in the result, never grounded values and
 *      never repaired by inference. (OTel GenAI records whole payloads
 *      and takes the model's account at face value; this module does
 *      the opposite at leaf level.)
 *
 * GRADING LADDER (weakest to strongest; parameter grade = weakest leaf,
 * weakest leaf path always named):
 *   untraceable < derived-unverified < similar/judge < ambiguous <
 *   derived-verified < field-grade
 * Only field-grade supports a RULE-grade claim for either check.
 * Kind-only refs (incomplete ref shape) downgrade to judge-grade
 * (similar/judge), never rule-grade, never repaired by inference.
 * Invalidated-source is a FLAG, not a grade: a field-grade record
 * whose source snapshot was later invalidated keeps its original
 * grade and is reported alongside, never overwritten.
 *
 * TWO-CHECK SPLIT (category 7 hallucination, argument half; category 8
 * misinterpretation):
 *   field-grade       -> hallucination pass, misinterpretation proof-available
 *   ambiguous         -> hallucination pass, misinterpretation ambiguous (no verdict)
 *   derived-verified  -> hallucination pass; misinterpretation proof-available
 *                        ONLY if transform semantics match the argument's
 *                        declared unit/type, else misinterpretation-candidate
 *                        (the 5 vs 0.05 error: percent-to-decimal into a
 *                        percent-expecting argument)
 *   similar/judge     -> hallucination judge, misinterpretation judge
 *   derived-unverified-> hallucination judge, misinterpretation judge
 *   untraceable       -> hallucination fail, misinterpretation no-proof
 *                        (Batch 17 rule: <UNK> = Class 2 clarify if the
 *                        domain is enumerable, Class 3 verify-before-commit
 *                        otherwise, provenance failure logged as reason)
 *
 * MATCHING RUNS OVER LOGGED SOURCES ONLY (request turns, retrieved
 * memory facts, prior tool results in the trajectory), never the whole
 * memory store. A value needing full-store search is unretrieved:
 * say so (grade untraceable, reason 'unretrieved-full-store-search'),
 * never silently grounded. A source_ref must never point outside the
 * trajectory's logged sources.
 *
 * Node.js, CommonJS, zero dependencies. Run: node source-field.test.cjs
 */

const crypto = require('crypto');

const NORMALIZATION_SPEC_VERSION = 'batch10-v1';
const SOURCE_KINDS = Object.freeze([
  'request', 'memory', 'tool_result', 'documented_default',
  'model_generation', 'memory_similar', 'derived',
]);
const MATCH_KINDS = Object.freeze(['exact', 'normalized', 'similar', 'transformed']);
const LEAF_GRADES = Object.freeze([
  'field-grade', 'ambiguous', 'similar/judge', 'derived-verified',
  'derived-unverified', 'untraceable',
]);
// Strength rank: higher = stronger. Parameter grade = weakest leaf.
const GRADE_RANK = Object.freeze({
  'untraceable': 0,
  'derived-unverified': 1,
  'similar/judge': 2,
  'ambiguous': 3,
  'derived-verified': 4,
  'field-grade': 5,
});
const LIVE_ACTIONS = Object.freeze([
  'live-gate', 'liveGate', 'pre-execution-block', 'preExecutionBlock',
  'provenance-block', 'block', 'abort', 'reorder', 'force-call',
  'forceCall', 'skip', 'auto-skip', 'autoSkip', 'nudge', 'threshold',
  'live-threshold', 'liveThreshold',
]);
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function _isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

function _isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function _escapePointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function _isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

// ---------------------------------------------------------------------------
// Leaf paths: one record per leaf of the argument tree.
// Parameter path = JSON Pointer (RFC 6901) from the argument name:
// scalar = name alone; nested field = name/field; array element =
// name/index, recursively. Objects/arrays themselves are not leaves;
// null, booleans, numbers, strings, and spans are.
// ---------------------------------------------------------------------------

/**
 * Walk an argument object { name: value, ... } and return one entry per
 * leaf: { path, value }. Throws on a non-object argument root or on a
 * missing/empty argument name, because a leaf path without a name is
 * not a path (spec violation, fail loud — house style).
 */
function leafPaths(args) {
  if (!_isPlainObject(args)) {
    throw new Error('leafPaths: args must be an object of named arguments (Batch 221: one record per leaf)');
  }
  const out = [];
  function walk(value, path) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // An empty array has no leaves; record the path itself as an
        // empty-leaf so the diagnostic covers it (value = []).
        out.push({ path, value: [] });
        return;
      }
      value.forEach((el, i) => walk(el, path + '/' + i));
      return;
    }
    if (_isPlainObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        out.push({ path, value: {} });
        return;
      }
      // A span object (resourceId + hash) is a LEAF, not a subtree:
      // blobs/long text are referenced, never expanded into content.
      if (_isNonEmptyString(value.resourceId) && _isNonEmptyString(value.hash)) {
        out.push({ path, value });
        return;
      }
      keys.forEach((k) => walk(value[k], path + '/' + _escapePointerSegment(k)));
      return;
    }
    out.push({ path, value });
  }
  Object.keys(args).forEach((name) => {
    if (!_isNonEmptyString(name)) {
      throw new Error('leafPaths: argument names must be non-empty strings');
    }
    walk(args[name], name);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Batch 10 normalization + value references (hashes, never copies)
// ---------------------------------------------------------------------------

/**
 * Canonical form of a value under Batch 10 rules: casefold (lowercase,
 * trim, collapse whitespace) for strings, number tolerance handled by
 * normalizedEqual (not by canonicalization), date parse to ISO for
 * date-like strings, enum alias lookup, documented-default equality
 * left to the caller (a value equal to a documented default for its
 * field normalizes to that default when opts.documentedDefault is
 * supplied). Object keys sorted; arrays order-preserving.
 * opts: { caseSensitive, parseDates, enumAliases, documentedDefault }
 */
function normalizeValue(value, opts) {
  const o = opts || {};
  if (typeof value === 'string') {
    let s = value;
    if (!o.caseSensitive) s = s.toLowerCase().trim().replace(/\s+/g, ' ');
    if (o.enumAliases && Object.prototype.hasOwnProperty.call(o.enumAliases, s)) {
      return o.enumAliases[s];
    }
    if (o.parseDates !== false && DATE_LIKE.test(value.trim())) {
      const t = Date.parse(value.trim());
      if (!Number.isNaN(t)) return new Date(t).toISOString();
    }
    return s;
  }
  if (Array.isArray(value)) return value.map((v) => normalizeValue(v, o));
  if (_isPlainObject(value)) {
    const out = {};
    Object.keys(value).sort().forEach((k) => { out[k] = normalizeValue(value[k], o); });
    return out;
  }
  return value;
}

function _deepEqualTol(a, b, tol) {
  if (_isFiniteNumber(a) && _isFiniteNumber(b)) {
    if (a === b) return true;
    const t = typeof tol === 'number' ? tol : 1e-9;
    return Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => _deepEqualTol(v, b[i], tol));
  }
  if (_isPlainObject(a) && _isPlainObject(b)) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && _deepEqualTol(a[k], b[k], tol));
  }
  return a === b;
}

/** Equal under Batch 10 rules (casefold / number tolerance / date parse /
 *  enum alias / documented default). Byte-identical equality is exact(),
 *  not this function. */
function normalizedEqual(a, b, opts) {
  const o = opts || {};
  if (o.documentedDefault !== undefined && _deepEqualTol(normalizeValue(a, o), o.documentedDefault, o.numberTolerance)) return true;
  if (o.documentedDefault !== undefined && _deepEqualTol(normalizeValue(b, o), o.documentedDefault, o.numberTolerance)) return true;
  return _deepEqualTol(normalizeValue(a, o), normalizeValue(b, o), o.numberTolerance);
}

/** Byte-identical equality: no transformation of any kind. */
function exactEqual(a, b) {
  return _deepEqualTol(a, b, 0) && JSON.stringify(a) === JSON.stringify(b);
}

/** Match kind between a leaf value and a source field value: 'exact',
 *  'normalized', or null (no match under either rule). Similarity is
 *  never inferred here — a similar-only match is a separate grade. */
function matchKindFor(leafValue, sourceValue, opts) {
  if (exactEqual(leafValue, sourceValue)) return 'exact';
  if (normalizedEqual(leafValue, sourceValue, opts)) return 'normalized';
  return null;
}

/** Value reference = SHA-256 hash of the normalized leaf value plus the
 *  normalization-spec version. NOT a second copy of the value. */
function hashValue(value, opts) {
  const o = opts || {};
  const version = o.normalizationSpecVersion || NORMALIZATION_SPEC_VERSION;
  const canonical = JSON.stringify(normalizeValue(value, o));
  const hash = crypto.createHash('sha256').update(version + '\n' + canonical).digest('hex');
  return { kind: 'hash', algorithm: 'sha256', normalizationSpecVersion: version, hash };
}

/** Blob / long-text span: resource id + version + byte and/or line range
 *  + hash. Content is never carried. Throws when resourceId, hash, or
 *  every range is missing — a span without an anchor is not a reference. */
function makeSpan(input) {
  if (!_isPlainObject(input)) throw new Error('makeSpan: input must be an object');
  if (!_isNonEmptyString(input.resourceId)) throw new Error('makeSpan: resourceId is required (Batch 221: span, not content)');
  if (!_isNonEmptyString(input.hash)) throw new Error('makeSpan: hash is required (Batch 221: span, not content)');
  const hasByte = _isFiniteNumber(input.startByte) && _isFiniteNumber(input.endByte);
  const hasLine = _isFiniteNumber(input.startLine) && _isFiniteNumber(input.endLine);
  if (!hasByte && !hasLine) {
    throw new Error('makeSpan: a byte range and/or line range is required (Batch 221: span, not content)');
  }
  const span = { resourceId: input.resourceId, hash: input.hash };
  if (input.version !== undefined) span.version = input.version;
  if (hasByte) { span.startByte = input.startByte; span.endByte = input.endByte; }
  if (hasLine) { span.startLine = input.startLine; span.endLine = input.endLine; }
  return span;
}

// ---------------------------------------------------------------------------
// Source-ref shapes: complete vs kind-only (downgrade, never repaired)
// ---------------------------------------------------------------------------

/**
 * Validate one source_ref shape for its kind. Returns
 * { shape: 'complete' | 'kind-only', reasons: [] }.
 * kind-only means: the kind is named but a required ref component is
 * missing — the record is downgraded to judge-grade, never repaired by
 * inference, never silently completed from another source.
 * Trajectory violations (forward / cross-trajectory tool_result refs)
 * are NOT shape problems: they are spec violations, returned separately
 * by validateToolResultTrajectory and counted by gradeLeaf.
 * Throws on an unknown SOURCE_KIND (spec violation, fail loud).
 */
function validateSourceRef(kind, ref) {
  if (!SOURCE_KINDS.includes(kind)) {
    throw new Error('validateSourceRef: unknown SOURCE_KIND ' + JSON.stringify(kind) + ' (Batch 221: ' + SOURCE_KINDS.join(', ') + ')');
  }
  const r = ref || {};
  const missing = [];
  switch (kind) {
    case 'request': {
      // (turn/message id, span start/end offsets) for free text, OR
      // (turn id, field path) for structured request/form. Bare
      // "request" with no turn/span = kind-only.
      if (!_isNonEmptyString(r.turnId) && !_isNonEmptyString(r.messageId)) missing.push('turn/message id');
      const hasSpan = _isFiniteNumber(r.spanStart) && _isFiniteNumber(r.spanEnd);
      const hasField = _isNonEmptyString(r.fieldPath);
      if (!hasSpan && !hasField) missing.push('span offsets or field path');
      break;
    }
    case 'memory': {
      // (fact id, fact snapshot/version id at hop time, field path).
      // Fact id without version = kind-only.
      if (!_isNonEmptyString(r.factId)) missing.push('fact id');
      if (!_isNonEmptyString(r.snapshotId) && !_isNonEmptyString(r.versionId)) missing.push('fact snapshot/version id');
      if (!_isNonEmptyString(r.fieldPath)) missing.push('field path');
      break;
    }
    case 'tool_result': {
      // (source hop id, result snapshot/version id, JSON Pointer).
      if (!_isNonEmptyString(r.hopId)) missing.push('source hop id');
      if (!_isNonEmptyString(r.snapshotId) && !_isNonEmptyString(r.versionId)) missing.push('result snapshot/version id');
      if (!_isNonEmptyString(r.resultPointer)) missing.push('JSON Pointer into result');
      break;
    }
    case 'documented_default': {
      // (default id, default-spec version). No default id at all is
      // not kind-only: gradeLeaf reclassifies it as model_generation
      // (an ad-hoc "usual value" with no default id IS model_generation).
      if (!_isNonEmptyString(r.defaultId)) missing.push('default id');
      if (!_isNonEmptyString(r.defaultSpecVersion)) missing.push('default-spec version');
      break;
    }
    case 'model_generation': {
      // Carries NO source_ref. Any non-empty ref is a violation, not a
      // shape problem: gradeLeaf counts it; here a present ref is
      // reported as a reason so callers see it in one place.
      if (ref !== undefined && ref !== null && !(_isPlainObject(ref) && Object.keys(ref).length === 0)) {
        return { shape: 'violation', reasons: ['model_generation must carry no source_ref'] };
      }
      return { shape: 'complete', reasons: [] };
    }
    case 'memory_similar': {
      // (candidate fact id + snapshot id, field path, similarity score,
      // similarity-threshold id). Weaker grade by construction.
      if (!_isNonEmptyString(r.candidateFactId) && !_isNonEmptyString(r.factId)) missing.push('candidate fact id');
      if (!_isNonEmptyString(r.snapshotId) && !_isNonEmptyString(r.versionId)) missing.push('candidate snapshot id');
      if (!_isNonEmptyString(r.fieldPath)) missing.push('field path');
      if (!_isFiniteNumber(r.similarityScore)) missing.push('similarity score');
      if (!_isNonEmptyString(r.similarityThresholdId)) missing.push('similarity-threshold id');
      break;
    }
    case 'derived': {
      // (source_ref LIST of one or more above ref shapes + transform id
      // + transform-spec version). Shape here covers the envelope; the
      // per-source shapes are validated by validateDerivedSources.
      if (!Array.isArray(r.sources) || r.sources.length === 0) missing.push('source_ref list (one or more)');
      if (!_isNonEmptyString(r.transformId)) missing.push('transform id');
      if (!_isNonEmptyString(r.transformSpecVersion)) missing.push('transform-spec version');
      break;
    }
    default:
      break;
  }
  if (missing.length > 0) return { shape: 'kind-only', reasons: missing.map((m) => 'missing ' + m) };
  return { shape: 'complete', reasons: [] };
}

/** Validate each entry of a derived record's source list. Returns
 *  { shape, reasons, malformed } — malformed is true when the derived
 *  record has a single source and no transform, or a transform with no
 *  sources (Batch 221), or any source entry with an unknown kind. */
function validateDerivedSources(ref) {
  const r = ref || {};
  const reasons = [];
  let malformed = false;
  if (!Array.isArray(r.sources) || r.sources.length === 0) {
    malformed = true;
    reasons.push('derived with a transform but no sources is malformed');
  }
  if (!_isNonEmptyString(r.transformId)) {
    malformed = true;
    reasons.push('derived with source(s) but no transform is malformed');
  }
  if (Array.isArray(r.sources)) {
    r.sources.forEach((s, i) => {
      if (!_isPlainObject(s) || !SOURCE_KINDS.includes(s.kind) || s.kind === 'derived') {
        malformed = true;
        reasons.push('derived source ' + i + ' has an unknown or nested-derived kind');
        return;
      }
      const v = validateSourceRef(s.kind, s.ref);
      if (v.shape !== 'complete') reasons.push('derived source ' + i + ' is ' + v.shape + ': ' + v.reasons.join('; '));
    });
  }
  return { shape: malformed ? 'malformed' : 'complete', reasons, malformed };
}

/**
 * Trajectory rule for tool_result refs: the source hop must precede the
 * current hop IN THE SAME trajectory. Returns null when satisfied, else
 * a violation string: 'forward-reference' (source hop at/after current)
 * or 'cross-trajectory' (source hop id absent from this trajectory).
 * A violation is COUNTED by gradeLeaf, not thrown and not repaired.
 */
function validateToolResultTrajectory(ref, ctx) {
  const c = ctx || {};
  if (!Array.isArray(c.hops) || c.hops.length === 0) return null; // no trajectory supplied: unchecked, not a violation
  const idx = c.hops.indexOf(ref && ref.hopId);
  if (idx === -1) return 'cross-trajectory';
  const current = typeof c.currentHopIndex === 'number' ? c.currentHopIndex : c.hops.length;
  if (idx >= current) return 'forward-reference';
  return null;
}

// ---------------------------------------------------------------------------
// Transform registry + re-run (re-running, not asserting)
// ---------------------------------------------------------------------------

const BUILTIN_TRANSFORM_OPS = Object.freeze([
  'percent-to-decimal', 'decimal-to-percent', 'casefold', 'trim',
  'parse-number', 'parse-date', 'concat', 'add', 'subtract',
  'multiply', 'divide',
]);

/** Declarative transform ops. `run` entries (caller functions) are also
 *  supported: a registry entry is { id, specVersion, run } or
 *  { id, specVersion, op, separator?, outputUnit? }. Throws on a
 *  registry entry with no id or neither run nor a known op — a registry
 *  that cannot re-run is a spec violation, fail loud at declaration. */
function declareTransform(entry) {
  if (!_isPlainObject(entry) || !_isNonEmptyString(entry.id)) {
    throw new Error('declareTransform: registry entry requires an id');
  }
  if (typeof entry.run === 'function') {
    return { id: entry.id, specVersion: entry.specVersion || null, run: entry.run, outputUnit: entry.outputUnit || null };
  }
  if (_isNonEmptyString(entry.op) && BUILTIN_TRANSFORM_OPS.includes(entry.op)) {
    return {
      id: entry.id, specVersion: entry.specVersion || null, op: entry.op,
      separator: entry.separator !== undefined ? entry.separator : '',
      outputUnit: entry.outputUnit || null,
    };
  }
  throw new Error('declareTransform: entry ' + entry.id + ' needs a run function or a known op (' + BUILTIN_TRANSFORM_OPS.join(', ') + ')');
}

function _runBuiltin(op, values, entry) {
  const first = values[0];
  switch (op) {
    case 'percent-to-decimal': return Number(first) / 100;
    case 'decimal-to-percent': return Number(first) * 100;
    case 'casefold': return String(first).toLowerCase().trim().replace(/\s+/g, ' ');
    case 'trim': return String(first).trim().replace(/\s+/g, ' ');
    case 'parse-number': return Number(String(first).replace(/,/g, '').trim());
    case 'parse-date': {
      const t = Date.parse(String(first));
      if (Number.isNaN(t)) throw new Error('parse-date: unparseable date ' + JSON.stringify(first));
      return new Date(t).toISOString();
    }
    case 'concat': return values.map((v) => String(v)).join(entry.separator || '');
    case 'add': return values.reduce((a, v) => Number(a) + Number(v), 0);
    case 'subtract': return values.slice(1).reduce((a, v) => Number(a) - Number(v), Number(values[0]));
    case 'multiply': return values.reduce((a, v) => Number(a) * Number(v), 1);
    case 'divide': return values.slice(1).reduce((a, v) => Number(a) / Number(v), Number(values[0]));
    default: throw new Error('unknown builtin op ' + op);
  }
}

/**
 * Re-run a transform on source values and compare to the leaf value
 * under normalized equality. Returns { reran, matches, result, error }.
 * reran=false when the transform threw or produced a non-finite number
 * (a transform that does not re-run to the value is derived-unverified,
 * not an exception in the caller). A transform not in the registry is
 * never run: callers check lookup first and log the registry gap.
 */
function rerunTransform(transform, sourceValues, leafValue, opts) {
  try {
    const values = Array.isArray(sourceValues) ? sourceValues : [sourceValues];
    let result;
    if (typeof transform.run === 'function') result = transform.run(values);
    else if (transform.op) result = _runBuiltin(transform.op, values, transform);
    else return { reran: false, matches: false, result: null, error: 'transform has neither run nor op' };
    if (typeof result === 'number' && !Number.isFinite(result)) {
      return { reran: false, matches: false, result: null, error: 'transform produced a non-finite number' };
    }
    return { reran: true, matches: normalizedEqual(result, leafValue, opts), result, error: null };
  } catch (e) {
    return { reran: false, matches: false, result: null, error: e.message };
  }
}

/** Semantics check for the misinterpretation half: the transform's
 *  output unit must match the argument's declared unit/type. When
 *  either side declares no unit, semantics are unspecified and the
 *  check passes as 'unspecified' (never invented). A mismatch is a
 *  misinterpretation CANDIDATE, not a verdict by itself. */
function transformSemanticsMatch(transform, declaredUnit) {
  const out = (transform && transform.outputUnit) || null;
  if (!out || !declaredUnit) return { match: true, specified: false };
  return { match: out === declaredUnit, specified: true, transformOutputUnit: out, declaredUnit };
}

// ---------------------------------------------------------------------------
// Candidate set: ALL logged source fields whose normalized value matches
// ---------------------------------------------------------------------------

/**
 * Build the candidate set for one leaf from LOGGED sources only:
 * sources = [{ kind, ref, value, snapshotId, invalidated? }] drawn from
 * request turns, retrieved memory facts, and prior tool results in the
 * trajectory. NEVER the whole memory store: a caller that cannot supply
 * logged sources passes [] and the leaf grades untraceable with reason
 * 'unretrieved-full-store-search' when it flags needsFullStoreSearch.
 * Each candidate carries its ref shape and match kind (exact/normalized).
 */
function buildCandidateSet(leafValue, loggedSources, opts) {
  const sources = Array.isArray(loggedSources) ? loggedSources : [];
  const out = [];
  sources.forEach((s) => {
    if (!_isPlainObject(s) || !SOURCE_KINDS.includes(s.kind)) return;
    const mk = matchKindFor(leafValue, s.value, opts);
    if (mk === null) return;
    out.push({
      kind: s.kind,
      ref: s.ref || null,
      snapshotId: s.snapshotId || s.versionId || null,
      invalidated: s.invalidated === true,
      matchKind: mk,
      valueHash: hashValue(s.value, opts).hash,
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Leaf grading: the two-check split
// ---------------------------------------------------------------------------

/**
 * Classify an untraceable leaf under the Batch 17 rule: <UNK> = Class 2
 * clarify when the domain is enumerable, Class 3 verify-before-commit
 * otherwise. The provenance failure itself is logged as the reason —
 * never a silent <UNK>.
 */
function classifyUntraceable(input) {
  const i = input || {};
  return {
    unkClass: i.domainEnumerable === true ? 2 : 3,
    unkLabel: i.domainEnumerable === true ? 'clarify' : 'verify-before-commit',
    reason: 'provenance-failure',
  };
}

/**
 * Grade ONE leaf record. Inputs:
 *   leafPath, leafValue, record: { kind, matchKind?, ref?, declaredUnit? }
 *   candidateSet (from buildCandidateSet, may be []),
 *   ctx: { currentHopIndex, hops, documentedDefaults (Map/Set/array of
 *     {id, specVersion} or ids), transformRegistry (array, declared via
 *     declareTransform or raw entries), invalidatedSnapshots (array of
 *     snapshot ids), sourceValues (aligned values for a derived re-run),
 *     needsFullStoreSearch, domainEnumerable, normalization opts }
 * Returns a full grade object (see header ladder). Violations are
 * COUNTED in `violations` and reflected in the grade — never thrown,
 * never repaired. Structural spec violations (unknown kind, unknown
 * matchKind) DO throw, house style.
 */
function gradeLeaf(input) {
  if (!_isPlainObject(input) || !_isPlainObject(input.record)) {
    throw new Error('gradeLeaf: input must be { leafPath, leafValue, record, ... }');
  }
  const record = input.record;
  const kind = record.kind;
  if (!SOURCE_KINDS.includes(kind)) {
    throw new Error('gradeLeaf: unknown SOURCE_KIND ' + JSON.stringify(kind));
  }
  if (record.matchKind !== undefined && record.matchKind !== null && !MATCH_KINDS.includes(record.matchKind)) {
    throw new Error('gradeLeaf: unknown MATCH_KIND ' + JSON.stringify(record.matchKind));
  }
  const candidateSet = Array.isArray(input.candidateSet) ? input.candidateSet : [];
  const ctx = input.ctx || {};
  const violations = [];
  const reasons = [];
  let effectiveKind = kind;
  let registryGap = false;
  let rerun = null;

  // --- Violation 1: model_generation carrying a source_ref. Counted,
  // never a grounded value. (Bare model_generation with no ref is the
  // normal untraceable case, not a violation.)
  const hasRef = record.ref !== undefined && record.ref !== null &&
    !(_isPlainObject(record.ref) && Object.keys(record.ref).length === 0);
  if (kind === 'model_generation' && hasRef) {
    violations.push('model-generation-with-source-ref');
    reasons.push('model_generation must carry no source_ref; the ref is rejected, not a grounding');
  }
  // --- Violation 2: non-derived kinds carrying a transform. "Derived"
  // is the ONLY kind that may carry a transform id; other copy kinds
  // must carry transform = none.
  const carriesTransform = _isNonEmptyString(record.transformId) && record.transformId !== 'none';
  if (kind !== 'derived' && carriesTransform) {
    violations.push('non-derived-carries-transform');
    reasons.push('only derived may carry a transform id; other copy kinds must carry transform = none');
  }
  // --- Violation 3: forward / cross-trajectory tool_result ref.
  if (kind === 'tool_result') {
    const traj = validateToolResultTrajectory(record.ref, ctx);
    if (traj !== null) {
      violations.push(traj === 'forward-reference' ? 'forward-reference' : 'cross-trajectory-reference');
      reasons.push('tool_result source hop must precede the current hop in the same trajectory');
    }
  }

  // --- Documented-default existence + ad-hoc reclassification.
  let defaultExistence = null; // 'found' | 'not-found' | 'unchecked' | null
  if (kind === 'documented_default') {
    if (!_isNonEmptyString(record.ref && record.ref.defaultId)) {
      // Ad-hoc "usual value" with no default id = model_generation.
      effectiveKind = 'model_generation';
      reasons.push('ad-hoc usual value with no default id reclassified as model_generation');
    } else if (ctx.documentedDefaults !== undefined && ctx.documentedDefaults !== null) {
      const list = ctx.documentedDefaults;
      const ids = list instanceof Set ? Array.from(list) :
        (list instanceof Map ? Array.from(list.keys()) :
          (Array.isArray(list) ? list.map((d) => (typeof d === 'string' ? d : d.id)) : []));
      defaultExistence = ids.includes(record.ref.defaultId) ? 'found' : 'not-found';
      if (defaultExistence === 'not-found') reasons.push('default id not in the routine/tool documented defaults at hop time');
    } else {
      defaultExistence = 'unchecked';
      reasons.push('documented-default existence unchecked: no defaults registry supplied');
    }
  }

  // --- Ref shape (derived envelope + per-source shapes handled below).
  let shape = null;
  if (kind === 'derived') {
    const dv = validateDerivedSources(record.ref);
    shape = dv;
    if (dv.malformed) reasons.push.apply(reasons, dv.reasons);
    else reasons.push.apply(reasons, dv.reasons);
  } else if (kind !== 'model_generation') {
    const v = validateSourceRef(kind, record.ref);
    shape = v;
    if (v.shape === 'kind-only') reasons.push('ref shape kind-only: ' + v.reasons.join('; '));
  }

  // --- Snapshot invalidation flag (never overwrites the grade).
  const recordSnapshot = (record.ref && (record.ref.snapshotId || record.ref.versionId)) || null;
  const invalidatedSnapshots = Array.isArray(ctx.invalidatedSnapshots) ? ctx.invalidatedSnapshots : [];
  const snapshotInvalidated = recordSnapshot !== null && invalidatedSnapshots.includes(recordSnapshot);

  // --- Derived path: registry lookup, re-run, semantics.
  let semantics = null;
  if (kind === 'derived') {
    if (shape && shape.malformed) {
      return _gradeResult(input, 'derived-unverified', {
        effectiveKind, violations, reasons, registryGap, rerun, semantics,
        invalidatedSource: false, candidateSet, snapshotInvalidated,
      });
    }
    const registry = Array.isArray(ctx.transformRegistry) ? ctx.transformRegistry : [];
    const transform = registry.find((t) => t && t.id === (record.ref && record.ref.transformId));
    if (!transform) {
      registryGap = true;
      reasons.push('transform not in the per-routine/per-tool registry: not a transform for grading (registry gap logged)');
      return _gradeResult(input, 'derived-unverified', {
        effectiveKind, violations, reasons, registryGap, rerun, semantics,
        invalidatedSource: false, candidateSet, snapshotInvalidated,
      });
    }
    const declared = transform.op ? declareTransform(transform) : transform;
    const sourceValues = ctx.sourceValues !== undefined ? ctx.sourceValues :
      (Array.isArray(record.ref.sources) ? record.ref.sources.map((s) => s.value) : []);
    rerun = rerunTransform(declared, sourceValues, input.leafValue, ctx);
    if (!rerun.reran || !rerun.matches) {
      reasons.push(rerun.reran ? 'transform re-ran but did not reproduce the leaf value' : 'transform did not re-run: ' + (rerun.error || 'unknown'));
      return _gradeResult(input, 'derived-unverified', {
        effectiveKind, violations, reasons, registryGap, rerun, semantics,
        invalidatedSource: false, candidateSet, snapshotInvalidated,
      });
    }
    // Re-run verified. Unique source set required for rule-grade.
    const sourceCount = Array.isArray(record.ref.sources) ? record.ref.sources.length : 0;
    semantics = transformSemanticsMatch(declared, record.declaredUnit);
    if (!semantics.match) {
      reasons.push('transform semantics mismatch: ' + declared.op + ' produces ' + semantics.transformOutputUnit + ' but the argument declares ' + semantics.declaredUnit + ' (5 vs 0.05 class)');
    }
    if (sourceCount < 1) {
      reasons.push('derived-verified requires a non-empty source set');
      return _gradeResult(input, 'derived-unverified', {
        effectiveKind, violations, reasons, registryGap, rerun, semantics,
        invalidatedSource: false, candidateSet, snapshotInvalidated,
      });
    }
    return _gradeResult(input, 'derived-verified', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }

  // --- Violations on copy kinds: counted, never grounded.
  if (violations.length > 0) {
    return _gradeResult(input, 'untraceable', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
      untraceable: classifyUntraceable(ctx),
    });
  }

  // --- model_generation / reclassified ad-hoc: untraceable by definition.
  if (effectiveKind === 'model_generation') {
    reasons.push('model_generation: no source field grounds the value');
    return _gradeResult(input, 'untraceable', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
      untraceable: classifyUntraceable(ctx),
    });
  }

  // --- documented_default not found in the registry: not a documented
  // default at hop time, so not field-grade; the value is untraceable
  // as a default (it may still be a copy, but this record proves none).
  if (kind === 'documented_default' && defaultExistence === 'not-found') {
    return _gradeResult(input, 'untraceable', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
      untraceable: classifyUntraceable(ctx),
    });
  }
  if (kind === 'documented_default' && defaultExistence === 'unchecked') {
    // Existence unverified: judge-grade, never rule-grade.
    return _gradeResult(input, 'similar/judge', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }

  // --- memory_similar / similar-only: judge-grade, never rule-grade.
  if (kind === 'memory_similar' || record.matchKind === 'similar') {
    if (shape && shape.shape === 'kind-only') reasons.push('memory_similar ref incomplete: threshold id or score missing');
    reasons.push('similarity match is judge-grade: flagged for the disputed-hop judge, never silently grounded');
    return _gradeResult(input, 'similar/judge', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }

  // --- Kind-only ref shape: downgraded to judge-grade.
  if (shape && shape.shape === 'kind-only') {
    return _gradeResult(input, 'similar/judge', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }

  // --- Candidate-set logic for copy kinds with a complete ref.
  if (candidateSet.length === 0) {
    if (ctx.needsFullStoreSearch === true) {
      reasons.push('value needs full-store search: unretrieved, not grounded (matching runs over logged sources only)');
    } else {
      reasons.push('no candidate source field in the logged sources matches the leaf');
    }
    return _gradeResult(input, 'untraceable', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
      untraceable: classifyUntraceable(ctx),
    });
  }
  if (candidateSet.length > 1) {
    reasons.push('candidate_set size ' + candidateSet.length + ': ambiguous — passes hallucination, fails as misinterpretation proof');
    return _gradeResult(input, 'ambiguous', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }
  // candidate_set size 1, match verified (exact/normalized/transformed),
  // ref complete, snapshot not invalidated at grading time.
  if (record.matchKind === 'transformed' && kind !== 'derived') {
    reasons.push('transformed match on a non-derived kind is incoherent: judge-grade');
    return _gradeResult(input, 'similar/judge', {
      effectiveKind, violations, reasons, registryGap, rerun, semantics,
      invalidatedSource: false, candidateSet, snapshotInvalidated,
    });
  }
  const candidate = candidateSet[0];
  const invalidatedSource = snapshotInvalidated || candidate.invalidated === true;
  if (invalidatedSource) reasons.push('source snapshot later invalidated: flag reported alongside, original grade kept');
  return _gradeResult(input, 'field-grade', {
    effectiveKind, violations, reasons, registryGap, rerun, semantics,
    invalidatedSource, candidateSet, snapshotInvalidated: invalidatedSource,
  });
}

function _gradeResult(input, grade, extra) {
  const hallucination = grade === 'field-grade' || grade === 'ambiguous' || grade === 'derived-verified'
    ? 'pass'
    : (grade === 'untraceable' ? 'fail' : 'judge');
  let misinterpretation;
  if (grade === 'field-grade') misinterpretation = 'proof-available';
  else if (grade === 'ambiguous') misinterpretation = 'ambiguous';
  else if (grade === 'derived-verified') {
    misinterpretation = (extra.semantics && extra.semantics.match === false)
      ? 'misinterpretation-candidate' : 'proof-available';
  } else if (grade === 'untraceable') misinterpretation = 'no-proof';
  else misinterpretation = 'judge';
  return {
    leafPath: input.leafPath !== undefined ? input.leafPath : null,
    grade,
    effectiveKind: extra.effectiveKind,
    hallucination,
    misinterpretation,
    candidateSetSize: extra.candidateSet.length,
    candidateSet: extra.candidateSet,
    violations: extra.violations,
    reasons: extra.reasons,
    registryGap: extra.registryGap,
    rerun: extra.rerun,
    semantics: extra.semantics,
    invalidatedSource: extra.invalidatedSource,
    untraceable: grade === 'untraceable' ? extra.untraceable : null,
  };
}

// ---------------------------------------------------------------------------
// Parameter rollup: weakest leaf, weakest leaf path always named
// ---------------------------------------------------------------------------

/**
 * Roll up leaf grades to one parameter grade: the WEAKEST leaf grade
 * (ladder order above), with weakestLeafPath named. Never "grounded"
 * while hiding one untraceable element. Also rolls up the two checks:
 * hallucination is 'fail' if any leaf fails, 'judge' if any leaf is
 * judge and none fail, else 'pass'; misinterpretation is
 * 'proof-available' only when every leaf is proof-available, 'ambiguous'
 * when any leaf is ambiguous and none is worse, 'misinterpretation-
 * candidate' when any leaf is one, else the weakest non-proof state.
 */
function gradeParameter(input) {
  if (!_isPlainObject(input) || !Array.isArray(input.leafGrades) || input.leafGrades.length === 0) {
    throw new Error('gradeParameter: input must be { parameterName?, leafGrades: [...] } with at least one leaf grade');
  }
  let weakest = null;
  input.leafGrades.forEach((g) => {
    if (!g || !Object.prototype.hasOwnProperty.call(GRADE_RANK, g.grade)) {
      throw new Error('gradeParameter: every leaf grade must carry a known grade');
    }
    if (weakest === null || GRADE_RANK[g.grade] < GRADE_RANK[weakest.grade]) weakest = g;
  });
  const anyFail = input.leafGrades.some((g) => g.hallucination === 'fail');
  const anyJudge = input.leafGrades.some((g) => g.hallucination === 'judge');
  const hallucination = anyFail ? 'fail' : (anyJudge ? 'judge' : 'pass');
  let misinterpretation;
  if (input.leafGrades.some((g) => g.misinterpretation === 'misinterpretation-candidate')) misinterpretation = 'misinterpretation-candidate';
  else if (input.leafGrades.some((g) => g.misinterpretation === 'no-proof')) misinterpretation = 'no-proof';
  else if (input.leafGrades.some((g) => g.misinterpretation === 'judge')) misinterpretation = 'judge';
  else if (input.leafGrades.some((g) => g.misinterpretation === 'ambiguous')) misinterpretation = 'ambiguous';
  else misinterpretation = 'proof-available';
  return {
    parameterName: input.parameterName !== undefined ? input.parameterName : null,
    grade: weakest.grade,
    weakestLeafPath: weakest.leafPath,
    weakestLeafGrade: weakest.grade,
    hallucination,
    misinterpretation,
    leafCount: input.leafGrades.length,
    invalidatedSourceCount: input.leafGrades.filter((g) => g.invalidatedSource === true).length,
    violationCount: input.leafGrades.reduce((n, g) => n + (Array.isArray(g.violations) ? g.violations.length : 0), 0),
  };
}

// ---------------------------------------------------------------------------
// Observation-claim reuse (category-7 fabricated-observation sub-case)
// ---------------------------------------------------------------------------

/**
 * The identical record with "parameter" replaced by claimed observation
 * field: claimed { tool, hopId, field, value } vs logged (that hop's
 * result field). Mismatch = 'fabricated-observation', counted separately
 * from argument hallucination. A claim about a hop/field with no logged
 * result is 'unlogged-observation' (not fabricated: nothing to compare).
 * Match is normalized equality; span claims compare by hash.
 */
function gradeObservationClaim(input) {
  if (!_isPlainObject(input) || !_isPlainObject(input.claimed)) {
    throw new Error('gradeObservationClaim: input must be { claimed: { tool, hopId, field, value }, loggedResults }');
  }
  const claimed = input.claimed;
  const logged = Array.isArray(input.loggedResults) ? input.loggedResults : [];
  const hop = logged.find((r) => r && r.hopId === claimed.hopId);
  if (!hop) {
    return { label: 'unlogged-observation', claimed, reason: 'no logged result for hop ' + claimed.hopId };
  }
  if (!_isPlainObject(hop.result) || !Object.prototype.hasOwnProperty.call(hop.result, claimed.field)) {
    return { label: 'unlogged-observation', claimed, reason: 'no logged result field ' + claimed.field + ' for hop ' + claimed.hopId };
  }
  const loggedValue = hop.result[claimed.field];
  const claimedValue = claimed.value;
  let matches;
  if (_isPlainObject(claimedValue) && _isNonEmptyString(claimedValue.hash) &&
      _isPlainObject(loggedValue) && _isNonEmptyString(loggedValue.hash)) {
    matches = claimedValue.hash === loggedValue.hash;
  } else {
    matches = normalizedEqual(claimedValue, loggedValue, input.ctx || {});
  }
  if (matches) {
    return { label: 'grounded-observation', claimed, reason: 'claimed value matches the logged result field' };
  }
  return {
    label: 'fabricated-observation',
    claimed,
    loggedValue,
    reason: 'claimed observation value does not match the logged result field for that hop',
  };
}

// ---------------------------------------------------------------------------
// Routine report + falsifier
// ---------------------------------------------------------------------------

function _share(count, total) {
  if (total === 0) return null;
  return count / total;
}

/**
 * Offline per-routine pass report. leafGrades = gradeLeaf outputs for
 * every leaf of the routine's labeled arguments (diagnostic = EVERY
 * leaf gets a record — no sampling, no minimum-confidence cutoff).
 * Shares: field-grade, ambiguous, similar/judge, derived-verified,
 * derived-unverified, untraceable, invalidated-source, plus
 * transform-registry coverage (share of derived leaves whose transform
 * is documented — i.e. derived leaves NOT flagged registryGap).
 * FALSIFIER: field-grade share below half, OR ambiguous share above
 * half, on a routine's labeled leaves KILLS the rule-grade reading of
 * categories 7/8 for that routine. With zero labeled leaves every share
 * is null and the reading is 'unmeasured', never 0.
 */
function reportRoutineStats(input) {
  if (!_isPlainObject(input) || !Array.isArray(input.leafGrades)) {
    throw new Error('reportRoutineStats: input must be { routineId?, leafGrades: [...] }');
  }
  const grades = input.leafGrades;
  const total = grades.length;
  const count = (g) => grades.filter((x) => x.grade === g).length;
  const derived = grades.filter((x) => x.effectiveKind === 'derived');
  const derivedDocumented = derived.filter((x) => x.registryGap !== true).length;
  const fieldShare = _share(count('field-grade'), total);
  const ambShare = _share(count('ambiguous'), total);
  const falsifierFires = total > 0 && ((fieldShare !== null && fieldShare < 0.5) || (ambShare !== null && ambShare > 0.5));
  return {
    routineId: input.routineId !== undefined ? input.routineId : null,
    leafCount: total,
    counts: {
      'field-grade': count('field-grade'),
      'ambiguous': count('ambiguous'),
      'similar/judge': count('similar/judge'),
      'derived-verified': count('derived-verified'),
      'derived-unverified': count('derived-unverified'),
      'untraceable': count('untraceable'),
    },
    shares: {
      fieldGrade: fieldShare,
      ambiguous: ambShare,
      similarJudge: _share(count('similar/judge'), total),
      derivedVerified: _share(count('derived-verified'), total),
      derivedUnverified: _share(count('derived-unverified'), total),
      untraceable: _share(count('untraceable'), total),
      invalidatedSource: _share(grades.filter((x) => x.invalidatedSource === true).length, total),
    },
    transformRegistryCoverage: derived.length === 0 ? null : derivedDocumented / derived.length,
    derivedLeafCount: derived.length,
    violationCount: grades.reduce((n, g) => n + (Array.isArray(g.violations) ? g.violations.length : 0), 0),
    falsifierFires,
    ruleGradeReading: total === 0 ? 'unmeasured'
      : (falsifierFires ? 'killed' : 'standing'),
  };
}

/** Kind-vs-field repo check helper: given a ledger description, report
 *  whether leaf-level field grading is possible. The shipped ledger
 *  records source kinds at most (round-14 provenance classifies whole
 *  results, not leaves), so field-grade share is unmeasured, not 0. */
function repoFieldGradeFinding(input) {
  const i = input || {};
  const hasLeafRecords = i.hasLeafRecords === true;
  const hasRefShapes = i.hasRefShapes === true;
  const hasTransformRegistry = i.hasTransformRegistry === true;
  return {
    recordsSourceKindsOnly: !hasLeafRecords,
    fieldGradeShare: hasLeafRecords ? (i.fieldGradeShare !== undefined ? i.fieldGradeShare : null) : null,
    transformRegistryCoverage: hasTransformRegistry ? (i.transformRegistryCoverage !== undefined ? i.transformRegistryCoverage : null) : null,
    ruleGradeReading: hasLeafRecords ? 'measurable' : 'unmeasured',
    reason: hasLeafRecords
      ? 'leaf records exist; shares computed from them'
      : 'no leaf records in the shipped ledger: field-grade share is unmeasured, never zero; ref-shape and transform-registry declarations must come before any rule-grade use of categories 7/8',
  };
}

// ---------------------------------------------------------------------------
// Live-intervention refusal (ledger-only)
// ---------------------------------------------------------------------------

/** Any live-intervention attempt throws. This module never blocks,
 *  aborts, reorders, or forces a live tool call, and never live-gates. */
function refuseLiveIntervention(request) {
  const r = request || {};
  const action = r.action || r.type || r.kind || '';
  if (LIVE_ACTIONS.includes(action)) {
    throw new Error('refuseLiveIntervention: live intervention "' + action + '" is refused — source-field is a ledger-only diagnostic (Batch 221: live use is a separate calibrated intervention under Batch 13, not built here)');
  }
  throw new Error('refuseLiveIntervention: unknown request — ledger-only module refuses all live interventions; pass a LIVE_ACTIONS action to see the specific refusal');
}

module.exports = {
  NORMALIZATION_SPEC_VERSION,
  SOURCE_KINDS,
  MATCH_KINDS,
  LEAF_GRADES,
  GRADE_RANK,
  BUILTIN_TRANSFORM_OPS,
  leafPaths,
  normalizeValue,
  normalizedEqual,
  exactEqual,
  matchKindFor,
  hashValue,
  makeSpan,
  validateSourceRef,
  validateDerivedSources,
  validateToolResultTrajectory,
  declareTransform,
  rerunTransform,
  transformSemanticsMatch,
  buildCandidateSet,
  classifyUntraceable,
  gradeLeaf,
  gradeParameter,
  gradeObservationClaim,
  reportRoutineStats,
  repoFieldGradeFinding,
  refuseLiveIntervention,
};
