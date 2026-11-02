'use strict';
/**
 * Trust verifier core — traceability rules V-T01..V-T17.
 *
 * Product-candidate module (NOT the wired product verifier). It ports the
 * logic of the batch119–126 Python spec harnesses into one coherent
 * Node.js (CommonJS, zero-dependency) implementation. Rule text in
 * batch128-traceability-v2/verifier-traceability-v2.yaml is authoritative;
 * where any harness and the rule text disagree, the rule text wins.
 *
 * No SEP-2484 conformance is claimed: per batch 117, host trust judgments
 * are not protocol-observable. No product gate path has been checked
 * against this module and no MCP extension has been negotiated on the wire
 * (that audit is still owed).
 *
 * Keying, everywhere: the full tuple (identifier, protocol revision,
 * revision string). An absent revision string (null, or undefined at
 * construction) means the INITIAL revision — its own tuple, never a
 * wildcard. Lookup by identifier alone is rejected, not defaulted.
 *
 * Composition (kept as separate classes, as in the harnesses):
 *   TupleKey / TrustStore  — per-tuple trust records + calibrations
 *   KnownSetRecord / Verifier — out-of-band known set, opt-in, T04–T06 calls
 *   ABSENT / fieldState / union — tri-state annotations (T08–T10)
 *   ValidationLog / validate / ValidatedAnnotation — T11 gate input
 *   StageStore / decide / isStale / StageAudit — T13/T14
 *   TaintSegment / Session / validateSegmentRecord — T15–T17
 *   LogEvent / auditPrompts — T07 (SHOULD: warnings, never failures)
 */

// ---------------------------------------------------------------------------
// TupleKey (V-T01)
// ---------------------------------------------------------------------------

function _nonEmptyString(value, what) {
  if (typeof value !== 'string' || value === '') {
    throw new TypeError(`${what} must be a non-empty string, got ${JSON.stringify(value)}`);
  }
  return value;
}

class TupleKey {
  /**
   * @param {string} identifier
   * @param {string} protocolRevision — negotiated protocol revision
   * @param {string|null|undefined} revisionString — null/undefined = initial revision
   */
  constructor(identifier, protocolRevision, revisionString = null) {
    this.identifier = _nonEmptyString(identifier, 'identifier');
    this.protocolRevision = _nonEmptyString(protocolRevision, 'protocol revision');
    if (revisionString === undefined) revisionString = null;
    if (revisionString !== null) {
      revisionString = _nonEmptyString(revisionString, 'revision string');
    }
    this.revisionString = revisionString;
    Object.freeze(this);
  }

  get isInitialRevision() {
    return this.revisionString === null;
  }

  /** Canonical key string; equality is string equality on this. */
  key() {
    return JSON.stringify([this.identifier, this.protocolRevision, this.revisionString]);
  }

  equals(other) {
    return other instanceof TupleKey && this.key() === other.key();
  }

  asObject() {
    return {
      identifier: this.identifier,
      protocolRevision: this.protocolRevision,
      revisionString: this.revisionString,
    };
  }

  static fromPlain(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new TypeError(`tuple must be an object, got ${JSON.stringify(obj)}`);
    }
    return new TupleKey(obj.identifier, obj.protocolRevision, obj.revisionString);
  }
}

// ---------------------------------------------------------------------------
// ABSENT + tri-state annotations (V-T09, V-T10)
// ---------------------------------------------------------------------------

const ABSENT_BRAND = Symbol('verifier.ABSENT');

/**
 * ABSENT: the singleton for "no claim made". It is distinct from false,
 * null, and undefined, and it must never be coerced to a boolean.
 *
 * Honest JS limit: the language gives objects no hook for `if (x)` /
 * Boolean(x) — ToBoolean on any object is true and cannot throw. So the
 * throwing equivalent of Python's bool(ABSENT) is toBoolean() below, and
 * every gate helper in this module routes through it / through fieldState
 * instead of ever testing an annotation state directly. A caller that
 * writes `if (state)` on a raw tri-state value has bypassed the API;
 * the module cannot intercept that, which is why gate consumption is
 * restricted to ValidatedAnnotation objects (V-T11).
 */
const ABSENT = Object.freeze({
  [ABSENT_BRAND]: true,
  toString() { return 'ABSENT'; },
});

function isAbsent(value) {
  return value === ABSENT;
}

/** The bool() equivalent: throws on ABSENT, passes booleans through. */
function toBoolean(state) {
  if (state === ABSENT) {
    throw new TypeError('ABSENT must never be coerced to a boolean');
  }
  if (typeof state !== 'boolean') {
    throw new TypeError(`annotation state must be a boolean or ABSENT, got ${JSON.stringify(state)}`);
  }
  return state;
}

const ANNOTATION_FIELDS = Object.freeze(['sensitive', 'untrusted']);

/**
 * Per-field state: true / false / ABSENT. A missing key, an explicit
 * null/undefined, or a null/undefined annotations object is ABSENT —
 * never false. A non-boolean value fails loud instead of coercing.
 */
function fieldState(annotations, name) {
  if (annotations === null || annotations === undefined) return ABSENT;
  if (typeof annotations !== 'object' || Array.isArray(annotations)) {
    throw new TypeError(`annotations must be an object, got ${JSON.stringify(annotations)}`);
  }
  if (!(name in annotations)) return ABSENT;
  const value = annotations[name];
  if (value === null || value === undefined) return ABSENT;
  if (typeof value !== 'boolean') {
    throw new TypeError(`annotation field ${name} is not boolean: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Normalise a caller-supplied flag value to true / false / ABSENT. */
function _normaliseFlag(value, field) {
  if (value === ABSENT || value === null || value === undefined) return ABSENT;
  if (typeof value === 'boolean') return value;
  throw new TypeError(`${field} must be True, False, or absent, got ${JSON.stringify(value)}`);
}

/** Tri-state union: True wins, then False, then absent (neutral). Non-tri-state inputs fail loud. */
function unionState(a, b) {
  for (const v of [a, b]) {
    if (v !== true && v !== false && v !== ABSENT) {
      throw new TypeError(`union operand must be True, False, or ABSENT, got ${JSON.stringify(v)}`);
    }
  }
  if (a === true || b === true) return true;
  if (a === false || b === false) return false;
  return ABSENT;
}

/** Per-block effective flags: result UNION this block, per field. Inputs untouched. */
function effectiveBlockFlags(resultFlags, blockFlags) {
  const out = {};
  for (const field of ANNOTATION_FIELDS) {
    const r = _normaliseFlag(resultFlags ? resultFlags[field] : undefined, field);
    const b = _normaliseFlag(blockFlags ? blockFlags[field] : undefined, field);
    out[field] = unionState(r, b);
  }
  return out;
}

/** Whole-result gate flag: result UNION every block, per field. */
function wholeResultFlags(resultFlags, blocks) {
  const out = {};
  for (const field of ANNOTATION_FIELDS) {
    out[field] = _normaliseFlag(resultFlags ? resultFlags[field] : undefined, field);
  }
  for (const block of blocks || []) {
    for (const field of ANNOTATION_FIELDS) {
      out[field] = unionState(out[field], _normaliseFlag(block ? block[field] : undefined, field));
    }
  }
  return out;
}

/** Gate helpers on raw annotation dicts (pre-validation routing only). */
function mayTreatAsNotSensitive(annotations) {
  return fieldState(annotations, 'sensitive') === false;
}
function mayTreatAsTrustedRaw(annotations) {
  return fieldState(annotations, 'untrusted') === false;
}

// ---------------------------------------------------------------------------
// TrustStore: one separate record per tuple + calibrations (V-T01..T03, T15)
// ---------------------------------------------------------------------------

function _canonicalSnapshot(tupleKey, trustState, lineage) {
  const sortedState = {};
  for (const k of Object.keys(trustState).sort()) sortedState[k] = trustState[k];
  return JSON.stringify({
    tuple: tupleKey.asObject(),
    trustState: sortedState,
    lineage: lineage ? lineage.asObject() : null,
  });
}

class TrustRecord {
  constructor(tupleKey, lineage = null) {
    this.tupleKey = tupleKey;
    this.trustState = {};
    // Lineage pointer to the predecessor tuple (same identifier only).
    // There is deliberately NO history/successor field: no merged
    // revision history lives inside a single record (V-T02).
    this.lineage = lineage;
  }

  snapshot() {
    return _canonicalSnapshot(this.tupleKey, this.trustState, this.lineage);
  }
}

const CALIBRATION_KINDS = Object.freeze(['threshold', 'probe', 'adapter', 'other']);

class TrustStore {
  constructor() {
    this.records = new Map(); // tuple key string -> TrustRecord
    this.calibrations = new Map(); // artifact id -> { kind, artifactId, boundTuple }
  }

  create(tupleKey, lineage = null) {
    if (!(tupleKey instanceof TupleKey)) {
      throw new TypeError('create() requires a full TupleKey');
    }
    const k = tupleKey.key();
    if (this.records.has(k)) {
      throw new Error(`record already exists for tuple ${k}`);
    }
    if (lineage !== null) {
      if (!(lineage instanceof TupleKey)) {
        throw new TypeError('lineage must be a TupleKey or null');
      }
      if (lineage.identifier !== tupleKey.identifier) {
        throw new Error(
          `lineage across identifiers is forbidden: ${lineage.identifier} is not a version of ${tupleKey.identifier}`,
        );
      }
      if (!this.records.has(lineage.key())) {
        throw new Error(`lineage predecessor ${lineage.key()} has no record (dangling pointer)`);
      }
    }
    // Creating a new tuple's record touches nothing else: the
    // predecessor record is never mutated by this call (V-T02).
    const record = new TrustRecord(tupleKey, lineage);
    this.records.set(k, record);
    return record;
  }

  get(tupleKey) {
    if (!(tupleKey instanceof TupleKey)) {
      throw new TypeError('get() requires a full TupleKey');
    }
    return this.records.get(tupleKey.key());
  }

  /** Identifier-alone lookup: rejected, not resolved to a default (V-T01). */
  getByIdentifier(identifier) {
    throw new Error(
      `identifier-alone lookup rejected for ${JSON.stringify(identifier)}: records are keyed on the full tuple`,
    );
  }

  setTrust(tupleKey, key, value) {
    const record = this.records.get(tupleKey.key());
    if (!record) throw new Error(`no record for tuple ${tupleKey.key()}`);
    record.trustState[key] = value;
  }

  /** Version history for ONE identifier only; coexisting identifiers never appear (V-T15). */
  history(identifier) {
    return [...this.records.values()].filter((r) => r.tupleKey.identifier === identifier);
  }

  delete(tupleKey) {
    this.records.delete(tupleKey.key());
  }

  attachCalibration(tupleKey, kind, artifactId) {
    if (!this.records.has(tupleKey.key())) {
      throw new Error(`no record for tuple ${tupleKey.key()}`);
    }
    if (!CALIBRATION_KINDS.includes(kind)) {
      throw new TypeError(`unknown calibration kind ${JSON.stringify(kind)}; expected one of ${CALIBRATION_KINDS.join(', ')}`);
    }
    if (typeof artifactId !== 'string' || artifactId === '') {
      throw new TypeError('calibration artifact id must be a non-empty string');
    }
    const existing = this.calibrations.get(artifactId);
    if (existing) {
      if (!existing.boundTuple.equals(tupleKey)) {
        throw new Error(
          `calibration ${JSON.stringify(artifactId)} already bound to ${existing.boundTuple.key()}, cannot re-bind to ${tupleKey.key()}`,
        );
      }
      return existing; // idempotent re-attach to the same tuple
    }
    const calibration = { kind, artifactId, boundTuple: tupleKey };
    this.calibrations.set(artifactId, calibration);
    return calibration;
  }

  /** Loading under any other tuple is refused, not silently applied (V-T03). */
  loadCalibration(tupleKey, artifactId) {
    const calibration = this.calibrations.get(artifactId);
    if (!calibration) throw new Error(`unknown calibration artifact ${JSON.stringify(artifactId)}`);
    if (!calibration.boundTuple.equals(tupleKey)) {
      throw new Error(
        `calibration ${JSON.stringify(artifactId)} bound to ${calibration.boundTuple.key()}, refused under ${tupleKey.key()}`,
      );
    }
    return calibration;
  }
}

// ---------------------------------------------------------------------------
// Known set, out of band only (batch 120, auxiliary to V-T04)
// ---------------------------------------------------------------------------

const STAGES = Object.freeze(['Experimental', 'Beta', 'Stable']);

class KnownSetRecord {
  /**
   * @param {object} opts — { source, sourceDate, stage, tuples }
   * source/sourceDate: provenance of this out-of-band capture.
   * stage: extension stage at capture time (never read from the wire).
   * tuples: iterable of TupleKey.
   */
  constructor({ source, sourceDate, stage, tuples }) {
    this.source = _nonEmptyString(source, 'known-set source');
    this.sourceDate = _nonEmptyString(sourceDate, 'known-set source date');
    if (!STAGES.includes(stage)) {
      throw new TypeError(`unknown stage ${JSON.stringify(stage)}; expected one of ${STAGES.join(', ')}`);
    }
    this.stage = stage;
    this.tuples = new Set();
    for (const t of tuples || []) {
      if (!(t instanceof TupleKey)) throw new TypeError('known-set tuples must be TupleKey instances');
      this.tuples.add(t);
    }
    Object.freeze(this.tuples);
    Object.freeze(this);
  }

  has(tupleKey) {
    for (const t of this.tuples) if (t.equals(tupleKey)) return true;
    return false;
  }

  toJSON() {
    return {
      source: this.source,
      sourceDate: this.sourceDate,
      stage: this.stage,
      tuples: [...this.tuples].map((t) => t.asObject()),
    };
  }
}

// ---------------------------------------------------------------------------
// Verifier: negotiation, opt-in, T04/T05/T06 call handling
// ---------------------------------------------------------------------------

class Verifier {
  /**
   * @param {KnownSetRecord} known — the out-of-band known set. The wire
   * never supplies or mutates it; only refresh() replaces it.
   */
  constructor(known) {
    if (!(known instanceof KnownSetRecord)) {
      throw new TypeError('Verifier requires a KnownSetRecord (out-of-band known set)');
    }
    this.known = known;
    this.enabled = new Map(); // tuple key string -> TupleKey
    this.optIns = new Map(); // tuple key string -> TupleKey
    this.mismatchLog = []; // V-T04 entries, each carrying the full received tuple
    this.audit = []; // per-call / per-negotiation audit entries
    this.refreshLog = [];
    this.optInLog = [];
  }

  _provenance() {
    return {
      knownSetSource: this.known.source,
      knownSetSourceDate: this.known.sourceDate,
      knownSetStage: this.known.stage,
    };
  }

  _tupleDict(tup) {
    return {
      receivedIdentifier: tup.identifier,
      receivedProtocolRevision: tup.protocolRevision,
      receivedRevisionString: tup.revisionString,
    };
  }

  /**
   * Negotiate one tuple. Returns true iff the extension is enabled for
   * it: known (out-of-band) AND explicitly opted in (per tuple).
   * An unknown revision ends disabled with a mismatch log entry
   * carrying the full received tuple (V-T04). A known-but-unopted
   * tuple stays disabled with no mismatch entry — absence of support
   * is compliant behaviour, not an error (V-T12).
   */
  negotiate(received) {
    if (!(received instanceof TupleKey)) {
      throw new TypeError('negotiate() requires a full TupleKey');
    }
    if (!this.known.has(received)) {
      this.mismatchLog.push({
        ...this._tupleDict(received),
        reason: 'unknown-revision',
        ...this._provenance(),
      });
      this.enabled.delete(received.key());
      this.audit.push({ ...this._tupleDict(received), outcome: 'disabled', reason: 'unknown-revision', ...this._provenance() });
      return false;
    }
    if (!this.optIns.has(received.key())) {
      this.enabled.delete(received.key());
      this.audit.push({ ...this._tupleDict(received), outcome: 'disabled', reason: 'not-opted-in', ...this._provenance() });
      return false;
    }
    this.enabled.set(received.key(), received);
    return true;
  }

  isEnabled(tup) {
    return this.enabled.has(tup.key());
  }

  /** Explicit opt-in per tuple (V-T12). Never bypasses validation. */
  optIn(tup) {
    if (!(tup instanceof TupleKey)) {
      throw new TypeError('optIn() requires a full TupleKey');
    }
    this.optIns.set(tup.key(), tup);
    this.optInLog.push(tup);
  }

  /**
   * Explicit out-of-band refresh (batch 120). Never called from
   * negotiate(): the wire cannot teach the known set. Refresh clears
   * prior enablement, so a removed tuple must re-negotiate and fails
   * closed; an added tuple enables only on re-negotiation.
   */
  refresh(newRecord) {
    if (!(newRecord instanceof KnownSetRecord)) {
      throw new TypeError('refresh() requires a KnownSetRecord');
    }
    this.refreshLog.push({
      oldSource: this.known.source,
      oldSourceDate: this.known.sourceDate,
      newSource: newRecord.source,
      newSourceDate: newRecord.sourceDate,
      newStage: newRecord.stage,
    });
    this.known = newRecord;
    this.enabled.clear();
  }

  /**
   * Run one tool call through V-T05 / V-T06.
   * mandatory must be an explicit boolean — defaulting it would
   * silently pick degrade over reject or vice versa.
   * effect: zero-arg callable performing the tool's real effect;
   *   invoked ONLY when the call proceeds (enabled, or non-mandatory
   *   unknown under T05 degradation).
   * Returns a result dict. A T06 rejection never invokes effect
   * (fail-before-effect, not invoke-and-rollback) and carries no content.
   */
  handleCall(tup, { mandatory, effect, content = 'tool output' } = {}) {
    if (typeof mandatory !== 'boolean') {
      throw new TypeError('mandatory must be an explicit bool, not a default');
    }
    if (typeof effect !== 'function') {
      throw new TypeError('handleCall() requires an effect function');
    }
    const known = this.known.has(tup);
    const optedIn = this.optIns.has(tup.key());
    if (known && optedIn) {
      this.enabled.set(tup.key(), tup);
      effect();
      this.audit.push({ ...this._tupleDict(tup), outcome: 'proceed', route: 'graded', ...this._provenance() });
      return { outcome: 'proceed', route: 'graded', content };
    }
    if (!known) {
      // Unknown revision: T05 degrade / T06 reject, with full tuple + provenance.
      this.mismatchLog.push({ ...this._tupleDict(tup), reason: 'unknown-revision', ...this._provenance() });
      this.enabled.delete(tup.key());
      if (mandatory) {
        this.audit.push({ ...this._tupleDict(tup), outcome: 'rejected', reason: 'revision-mismatch', ...this._provenance() });
        return { outcome: 'rejected', reason: 'revision-mismatch', content: null };
      }
      effect();
      this.audit.push({ ...this._tupleDict(tup), outcome: 'degraded', route: 'ungraded', marker: 'ungraded', ...this._provenance() });
      return { outcome: 'degraded', route: 'ungraded', marker: 'ungraded', content };
    }
    // Known but not opted in: support is disabled by default (V-T12).
    this.enabled.delete(tup.key());
    if (mandatory) {
      this.audit.push({ ...this._tupleDict(tup), outcome: 'rejected', reason: 'not-opted-in', ...this._provenance() });
      return { outcome: 'rejected', reason: 'not-opted-in', content: null };
    }
    effect();
    this.audit.push({ ...this._tupleDict(tup), outcome: 'degraded', route: 'ungraded', marker: 'ungraded', reason: 'not-opted-in', ...this._provenance() });
    return { outcome: 'degraded', route: 'ungraded', marker: 'ungraded', reason: 'not-opted-in', content };
  }

  /**
   * CHECK-T12 audit (SHOULD -> warnings, never a hard failure).
   * A violation is an enabled tuple with no opt-in record. Mere
   * absence of support (nothing enabled) is clean.
   * Accepts optional explicit sets so the violation shape is testable
   * without a backdoor that forges enablement.
   */
  auditOptIn(enabled = this.enabled, optIns = this.optIns) {
    const enabledList = enabled instanceof Map ? [...enabled.values()] : [...enabled];
    const optInKeys = new Set(
      (optIns instanceof Map ? [...optIns.keys()] : [...optIns].map((t) => (t instanceof TupleKey ? t.key() : t))),
    );
    const violations = enabledList
      .filter((t) => !optInKeys.has(t instanceof TupleKey ? t.key() : t))
      .map((t) => ({
        tuple: t instanceof TupleKey ? t.asObject() : t,
        reason: 'enabled without an explicit opt-in record',
      }));
    return { enabled: enabledList.length, violations, clean: violations.length === 0 };
  }
}

// ---------------------------------------------------------------------------
// T08 routing (unannotated = ungraded, never clean)
// ---------------------------------------------------------------------------

/**
 * Presence-based routing for a plain tool result { content, annotations }.
 * annotations null/undefined/{} (no annotation fields) -> 'ungraded'.
 * This routes; it does not trust — a 'graded' route still needs V-T11
 * validation before any gate consumes it.
 */
function routeResult(result) {
  if (result && result.annotations && Object.keys(result.annotations).length > 0) return 'graded';
  return 'ungraded';
}

/** No gate branch treats any route as clean: 'clean' is not a verdict this gate emits. */
function gateTreatsAsClean(_route) {
  return false;
}

/**
 * T05 negative, tri-state: a degraded (ungraded) result's annotation is
 * NEVER consumable as trusted, whatever its fields claim (false). A
 * graded result is NOT decided here — validation (V-T11) is the step
 * that can make a unit consumable — so it returns null (undecided),
 * never true.
 */
function annotationConsumableAsTrusted(result) {
  if (result && result.route === 'ungraded') return false;
  return null;
}

// ---------------------------------------------------------------------------
// T11 validation: only validated objects are gate-consumable
// ---------------------------------------------------------------------------

class ValidationLog {
  constructor() {
    this.entries = [];
  }

  log(tup, unit, reason) {
    this.entries.push({
      tuple: tup instanceof TupleKey ? tup.asObject() : String(tup),
      unit,
      reason,
    });
  }
}

function _validTuple(tup) {
  return tup instanceof TupleKey; // construction already enforces shape
}

function _validateUnit(raw, unitLabel, tup, log) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    log.log(tup, unitLabel, 'annotation unit is not an object');
    return { flags: null, valid: false };
  }
  for (const key of Object.keys(raw)) {
    if (!ANNOTATION_FIELDS.includes(key)) {
      log.log(tup, unitLabel, `unknown annotation field ${JSON.stringify(key)}`);
      return { flags: null, valid: false };
    }
  }
  const flags = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) continue; // explicit null = absent
    if (typeof value !== 'boolean') {
      log.log(tup, unitLabel, `annotation field ${key} is not boolean: ${JSON.stringify(value)}`);
      return { flags: null, valid: false };
    }
    flags[key] = value;
  }
  return { flags, valid: true };
}

const VALIDATED_BRAND = Symbol('verifier.ValidatedAnnotation');

class ValidatedAnnotation {
  constructor({ tup, resultFlags, blockFlags, resultValid, blockValid, degraded = false }) {
    this.tup = tup;
    this.resultFlags = resultFlags; // null = result-level unit failed/ungraded
    this.blockFlags = blockFlags; // per-block flags or null, in block order
    this.resultValid = resultValid;
    this.blockValid = blockValid;
    this.degraded = degraded; // T05: a degraded unit never yields trust
    this[VALIDATED_BRAND] = true;
    Object.freeze(this.blockFlags);
    Object.freeze(this.blockValid);
    Object.freeze(this);
  }
}

/**
 * CHECK-T11 entry point. rawResult: object with optional 'annotations'
 * (object) and optional 'blocks' (list of objects with optional
 * 'annotations'). Validation is per unit: a block failure drops only
 * that block; other units are unaffected. A failed unit never feeds a
 * gate decision in any direction — not even an invented fail-closed value.
 * A malformed tuple fails every unit. Mere absence of annotation fields
 * is unannotated (V-T08: ungraded), not a validation failure.
 */
function validate(rawResult, tup, log = new ValidationLog()) {
  if (!_validTuple(tup)) {
    log.log(tup, 'tuple', 'malformed tuple key');
    const rawBlocks = rawResult && typeof rawResult === 'object' && Array.isArray(rawResult.blocks) ? rawResult.blocks : [];
    return new ValidatedAnnotation({
      tup: null,
      resultFlags: null,
      blockFlags: rawBlocks.map(() => null),
      resultValid: false,
      blockValid: rawBlocks.map(() => false),
    });
  }
  if (rawResult === null || typeof rawResult !== 'object' || Array.isArray(rawResult)) {
    log.log(tup, 'result', 'result is not an object');
    return new ValidatedAnnotation({ tup, resultFlags: null, blockFlags: [], resultValid: false, blockValid: [] });
  }
  const ann = rawResult.annotations === null || rawResult.annotations === undefined ? {} : rawResult.annotations;
  const { flags: resultFlags, valid: resultValid } = _validateUnit(ann, 'result', tup, log);
  const rawBlocks = rawResult.blocks === undefined ? [] : rawResult.blocks;
  if (!Array.isArray(rawBlocks)) {
    log.log(tup, 'result', 'blocks is not a list');
    return new ValidatedAnnotation({ tup, resultFlags, blockFlags: [], resultValid, blockValid: [] });
  }
  const blockFlags = [];
  const blockValid = [];
  rawBlocks.forEach((block, i) => {
    if (block === null || typeof block !== 'object' || Array.isArray(block)) {
      log.log(tup, `block[${i}]`, 'block is not an object');
      blockFlags.push(null);
      blockValid.push(false);
      return;
    }
    const bann = block.annotations === null || block.annotations === undefined ? {} : block.annotations;
    const { flags, valid } = _validateUnit(bann, `block[${i}]`, tup, log);
    blockFlags.push(flags);
    blockValid.push(valid);
  });
  return new ValidatedAnnotation({ tup, resultFlags, blockFlags, resultValid, blockValid });
}

/** Mark a validated annotation as degraded (V-T05): it then never yields trust. */
function markDegraded(validated) {
  _requireValidated(validated);
  return new ValidatedAnnotation({
    tup: validated.tup,
    resultFlags: validated.resultFlags,
    blockFlags: [...validated.blockFlags],
    resultValid: validated.resultValid,
    blockValid: [...validated.blockValid],
    degraded: true,
  });
}

function _requireValidated(obj) {
  if (!obj || obj[VALIDATED_BRAND] !== true) {
    throw new TypeError(
      `gate consumes only ValidatedAnnotation (from validate()); got ${obj === null ? 'null' : typeof obj} — raw wire data must not reach a gate`,
    );
  }
}

/** 'graded' only if the result-level unit validated AND carried a field; otherwise 'ungraded'. Never 'clean'. */
function gateRoute(validated) {
  _requireValidated(validated);
  if (validated.degraded) return 'ungraded';
  if (validated.resultValid && validated.resultFlags && Object.keys(validated.resultFlags).length > 0) return 'graded';
  return 'ungraded';
}

/** Trusted handling only for a VALIDATED, non-degraded unit with an explicit False untrusted flag. */
function mayTreatAsTrusted(validated) {
  _requireValidated(validated);
  if (validated.degraded || !validated.resultValid || validated.resultFlags === null) return false;
  return validated.resultFlags.untrusted === false;
}

function mayTreatAsNotSensitiveValidated(validated) {
  _requireValidated(validated);
  if (validated.degraded || !validated.resultValid || validated.resultFlags === null) return false;
  return validated.resultFlags.sensitive === false;
}

/** Per-block analogue: a failed (or degraded) block never yields trust. */
function blockMayTreatAsTrusted(validated, index) {
  _requireValidated(validated);
  if (validated.degraded) return false;
  if (index >= validated.blockValid.length || !validated.blockValid[index]) return false;
  const flags = validated.blockFlags[index];
  if (flags === null) return false;
  return flags.untrusted === false;
}

// ---------------------------------------------------------------------------
// Stage handling (V-T13, V-T14)
// ---------------------------------------------------------------------------

// Payload keys that must NEVER be read as stage. decide() ignores them by
// construction — it never looks at a payload beyond identifier / protocol
// revision / revision string — but tests exercise each carrying a
// conflicting value to prove the ignorance.
const STAGE_PAYLOAD_KEYS = Object.freeze(['stage', 'lifecycle', 'maturity', 'extension_stage']);

class StageRecord {
  constructor(identifier, stage, source, sourceDate) {
    this.identifier = identifier;
    this.stage = stage;
    this.source = source;
    this.sourceDate = sourceDate;
    Object.freeze(this);
  }
}

class StageStore {
  constructor() {
    this.records = new Map(); // identifier -> StageRecord
  }

  refresh(identifier, stage, source, sourceDate) {
    if (typeof identifier !== 'string' || identifier === '') {
      throw new TypeError(`stage record needs a non-empty identifier: ${JSON.stringify(identifier)}`);
    }
    if (!STAGES.includes(stage)) {
      throw new TypeError(`unknown stage ${JSON.stringify(stage)}; expected one of ${STAGES.join(', ')}`);
    }
    if (typeof source !== 'string' || source === '') {
      throw new TypeError('stage record needs a non-empty source');
    }
    if (typeof sourceDate !== 'string' || sourceDate === '') {
      throw new TypeError('stage record needs a non-empty source date');
    }
    const record = new StageRecord(identifier, stage, source, sourceDate);
    this.records.set(identifier, record);
    return record;
  }

  remove(identifier) {
    this.records.delete(identifier);
  }

  get(identifier) {
    return this.records.get(identifier);
  }
}

class StageDecision {
  constructor({ identifier, stage, source, reliedSourceDate, stageUnknown, pin = null }) {
    this.identifier = identifier;
    this.stage = stage; // null = no stage record (stage-unknown, never a default stage)
    this.source = source;
    this.reliedSourceDate = reliedSourceDate;
    this.stageUnknown = stageUnknown;
    this.pin = pin; // Experimental pin carried on the decision, if any
    Object.freeze(this);
  }
}

/**
 * CHECK-T13 entry point. Reads identifier, protocol revision, and
 * revision string from the payload (kept for tuple keying) and NOTHING
 * stage-related — not top-level stage keys, and no walk for nested
 * stage information. Stage comes only from the store's record.
 */
function decide(store, negotiationPayload, pin = null) {
  if (negotiationPayload === null || typeof negotiationPayload !== 'object' || Array.isArray(negotiationPayload)) {
    throw new TypeError('negotiation payload must be an object');
  }
  const identifier = negotiationPayload.identifier;
  if (typeof identifier !== 'string' || identifier === '') {
    throw new TypeError('negotiation payload needs a non-empty identifier');
  }
  const record = store.get(identifier);
  if (!record) {
    return new StageDecision({ identifier, stage: null, source: null, reliedSourceDate: null, stageUnknown: true, pin: null });
  }
  return new StageDecision({
    identifier,
    stage: record.stage,
    source: record.source,
    reliedSourceDate: record.sourceDate,
    stageUnknown: false,
    pin,
  });
}

/**
 * CHECK-T13 staleness against the CURRENT store: true iff the decision's
 * record was removed, its stage changed, its source date moved newer, or
 * the decision relied on no record while one now exists. "Stale" means
 * "re-run the decision against the refreshed record", not "the decision
 * was wrong".
 */
function isStale(decision, store) {
  const record = store.get(decision.identifier);
  if (!record) return true;
  if (record.stage !== decision.stage) return true;
  if (decision.reliedSourceDate === null) return true;
  return record.sourceDate > decision.reliedSourceDate; // ISO YYYY-MM-DD compares lexicographically
}

/** CHECK-T14 audit accumulator (SHOULD -> warnings; never blocks, never throws on violation). */
class StageAudit {
  constructor() {
    this.experimentalPins = new Map(); // id -> pin or null
    this.betaBreaking = new Map(); // id -> [{ changelogEntry, announced }]
    this.stableBehaviour = new Map(); // "id\0revision" -> first hash
    this.stableWarnings = [];
  }

  recordExperimental(identifier, pin) {
    this.experimentalPins.set(identifier, pin);
  }

  recordBetaBreaking(identifier, changelogEntry, announced) {
    if (!this.betaBreaking.has(identifier)) this.betaBreaking.set(identifier, []);
    this.betaBreaking.get(identifier).push({ changelogEntry: Boolean(changelogEntry), announced: Boolean(announced) });
  }

  /** Non-breaking Beta changes carry no T14 obligation; the call exists so tests can show the audit ignores them. */
  recordBetaNonBreaking(_identifier) {
    return null;
  }

  recordStableBehaviour(identifier, protocolRevision, behaviourHash) {
    const key = `${identifier}\0${protocolRevision}`;
    const previous = this.stableBehaviour.get(key);
    if (previous === undefined) {
      this.stableBehaviour.set(key, behaviourHash);
      return { midRevisionChange: false };
    }
    if (previous !== behaviourHash) {
      this.stableWarnings.push({
        identifier,
        rule: 'V-T14',
        reason: `Stable behaviour changed within protocol revision ${JSON.stringify(protocolRevision)} (first hash ${JSON.stringify(previous)}, now ${JSON.stringify(behaviourHash)})`,
      });
      return { midRevisionChange: true };
    }
    return { midRevisionChange: false };
  }

  audit() {
    const warnings = [];
    for (const [identifier, pin] of [...this.experimentalPins.entries()].sort()) {
      if (!pin) {
        warnings.push({ identifier, rule: 'V-T14', reason: 'Experimental handling without a pin (tag/commit)' });
      }
    }
    for (const [identifier, changes] of [...this.betaBreaking.entries()].sort()) {
      changes.forEach((change, i) => {
        if (!change.changelogEntry) {
          warnings.push({ identifier, rule: 'V-T14', reason: `Beta breaking change #${i} without a changelog entry` });
        }
        if (!change.announced) {
          warnings.push({ identifier, rule: 'V-T14', reason: `Beta breaking change #${i} without an announcement` });
        }
      });
    }
    warnings.push(...this.stableWarnings);
    return { warnings, clean: warnings.length === 0 };
  }
}

// ---------------------------------------------------------------------------
// Session taint segments (V-T16, V-T17)
// ---------------------------------------------------------------------------

/**
 * V-T16 store-integrity check for a raw segment record (dict form, as a
 * store row would arrive). A segment with revisionString null DOES carry
 * its full tuple (null = initial revision); a segment with NO tuple, an
 * empty identifier / protocol revision, or a missing revision_string
 * key is a store-integrity error.
 */
function validateSegmentRecord(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('segment record must be an object');
  }
  const tup = record.tuple;
  if (tup === null || tup === undefined) {
    throw new Error('segment record without a tuple is a store-integrity error');
  }
  if (typeof tup !== 'object' || Array.isArray(tup)) {
    throw new Error('segment tuple must be an object');
  }
  if (!tup.identifier) {
    throw new Error('segment tuple needs a non-empty identifier');
  }
  if (!tup.protocolRevision) {
    throw new Error('segment tuple needs a non-empty protocol revision');
  }
  if (!('revisionString' in tup)) {
    throw new Error('segment tuple must carry revisionString (null = initial)');
  }
  return new TupleKey(tup.identifier, tup.protocolRevision, tup.revisionString);
}

class TaintSegment {
  constructor(tupleKey, segmentId) {
    if (tupleKey === null || tupleKey === undefined) {
      throw new Error('taint segment without a tuple is a store-integrity error');
    }
    if (!(tupleKey instanceof TupleKey)) {
      throw new TypeError('taint segment tuple must be a TupleKey');
    }
    this.id = segmentId;
    this.tupleKey = tupleKey;
    this._attributions = [];
    this.closed = false;
    this.closedReason = null;
    this.breakBefore = false;
  }

  attribute(item) {
    if (this.closed) {
      throw new Error(`segment ${this.id} is closed (frozen); attributions go to the current segment`);
    }
    this._attributions.push(item);
  }

  get attributions() {
    return Object.freeze([...this._attributions]);
  }

  close(reason) {
    this.closed = true;
    this.closedReason = reason;
  }

  audit() {
    return {
      segmentId: this.id,
      tuple: {
        identifier: this.tupleKey.identifier,
        protocolRevision: this.tupleKey.protocolRevision,
        revisionString: this.tupleKey.revisionString,
        isInitialRevision: this.tupleKey.isInitialRevision,
      },
      attributions: [...this._attributions],
      closed: this.closed,
      closedReason: this.closedReason,
      breakBefore: this.breakBefore,
    };
  }
}

class Session {
  constructor() {
    this.segments = [];
    this.breaks = [];
    this.current = null;
    this._nextId = 1;
  }

  open(tupleKey) {
    if (this.current !== null) {
      throw new Error('session already has an open segment; use changeTuple()');
    }
    const segment = new TaintSegment(tupleKey, this._nextId++);
    this.segments.push(segment);
    this.current = segment;
    return segment;
  }

  attribute(item) {
    if (this.current === null) throw new Error('no open segment to attribute to');
    this.current.attribute(item);
  }

  /**
   * CHECK-T17 entry point. An equal tuple is a no-op (no break, no new
   * segment). Any component differing — identifier, protocol revision,
   * or revision string, including null -> "2" (initial -> numbered) —
   * closes the current segment (frozen) and opens a new one, with a
   * break marker linking them. New attributions route only to the
   * current segment, so the old segment's audit is exactly what it
   * was at close time.
   */
  changeTuple(newTuple) {
    if (this.current === null) throw new Error('no open segment to change');
    if (!(newTuple instanceof TupleKey)) throw new TypeError('changeTuple() requires a TupleKey');
    if (newTuple.equals(this.current.tupleKey)) return this.current;
    const old = this.current;
    old.close('tuple_change');
    const next = new TaintSegment(newTuple, this._nextId++);
    next.breakBefore = true;
    this.segments.push(next);
    this.breaks.push({ fromSegment: old.id, toSegment: next.id, reason: 'tuple_change' });
    this.current = next;
    return next;
  }

  audit() {
    for (const segment of this.segments) {
      if (!segment.tupleKey) throw new Error('segment without a tuple is a store-integrity error');
    }
    return {
      segments: this.segments.map((s) => s.audit()),
      breaks: [...this.breaks],
    };
  }
}

// ---------------------------------------------------------------------------
// Prompt-boundary audit (V-T07, SHOULD -> warnings)
// ---------------------------------------------------------------------------

class LogEvent {
  /**
   * kind: 'prompt' | 'action' | 'note'.
   * For actions: destructive / openWorld describe the action;
   * reliedOnDegraded says it previously relied on the degraded
   * extension's annotations (caller-supplied — see README limit: the
   * auditor trusts this flag and cannot verify reliance from the log
   * alone).
   */
  constructor(kind, { destructive = false, openWorld = false, reliedOnDegraded = false, label = '' } = {}) {
    if (!['prompt', 'action', 'note'].includes(kind)) {
      throw new TypeError(`unknown log event kind ${JSON.stringify(kind)}`);
    }
    this.kind = kind;
    this.destructive = Boolean(destructive);
    this.openWorld = Boolean(openWorld);
    this.reliedOnDegraded = Boolean(reliedOnDegraded);
    this.label = label;
  }

  isQualifyingAction() {
    return this.kind === 'action' && (this.destructive || this.openWorld) && this.reliedOnDegraded;
  }
}

/**
 * CHECK-T07 over a session log. Returns { prompts, violations, clean },
 * never throws for a prompt-placement violation: SHOULD violations are
 * warnings. A prompt is clean iff the next non-note event after it is a
 * qualifying action. Notes do not break immediacy; another prompt or a
 * non-qualifying action does. T07 forbids prompts; it does NOT mandate
 * them — an unprompted destructive degraded action is not a violation,
 * and a degraded marker shown without asking is not a prompt.
 */
function auditPrompts(events) {
  const seq = events.map((e, i) => [i, e]).filter(([, e]) => e.kind !== 'note');
  const violations = [];
  let promptCount = 0;
  seq.forEach(([idx, event], pos) => {
    if (event.kind !== 'prompt') return;
    promptCount += 1;
    const nxt = pos + 1 < seq.length ? seq[pos + 1][1] : null;
    if (nxt === null) {
      violations.push({ promptIndex: idx, reason: 'prompt with no following action' });
    } else if (nxt.kind !== 'action' || !nxt.isQualifyingAction()) {
      let reason;
      if (nxt.kind === 'prompt') {
        reason = 'prompt not immediately preceding a qualifying action: another prompt intervenes';
      } else if (!(nxt.destructive || nxt.openWorld)) {
        reason = 'prompt before a non-destructive, non-open-world action';
      } else {
        reason = 'prompt before a destructive/open-world action that did not rely on the degraded extension';
      }
      violations.push({ promptIndex: idx, reason, nextLabel: nxt.label });
    }
  });
  return { prompts: promptCount, violations, clean: violations.length === 0 };
}

module.exports = {
  // Tuple + tri-state
  TupleKey,
  ABSENT,
  isAbsent,
  toBoolean,
  ANNOTATION_FIELDS,
  fieldState,
  unionState,
  effectiveBlockFlags,
  wholeResultFlags,
  mayTreatAsNotSensitive,
  mayTreatAsTrustedRaw,
  // Trust records + calibrations
  TrustRecord,
  TrustStore,
  CALIBRATION_KINDS,
  // Known set + verifier
  STAGES,
  KnownSetRecord,
  Verifier,
  // T08 routing + T05 gate helper
  routeResult,
  gateTreatsAsClean,
  annotationConsumableAsTrusted,
  // T11 validation
  ValidationLog,
  ValidatedAnnotation,
  validate,
  markDegraded,
  gateRoute,
  mayTreatAsTrusted,
  mayTreatAsNotSensitiveValidated,
  blockMayTreatAsTrusted,
  // Stage
  STAGE_PAYLOAD_KEYS,
  StageRecord,
  StageStore,
  StageDecision,
  decide,
  isStale,
  StageAudit,
  // Taint
  validateSegmentRecord,
  TaintSegment,
  Session,
  // Prompts
  LogEvent,
  auditPrompts,
};
