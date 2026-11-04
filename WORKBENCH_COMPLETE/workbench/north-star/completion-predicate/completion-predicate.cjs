'use strict';
/**
 * completion-predicate.cjs — Batch 218 per-routine completion predicate
 * (BUILD ROUND 16), the second of Batch 214's four owed specs.
 *
 * LEDGER-ONLY diagnostic. Nothing in this module aborts, discards, blocks,
 * reorders, or forces any live tool call, and nothing here is a live gate.
 * It is NOT hooked into server.ts or the audit-wire live hook as a gate;
 * audit/log use only. NO live finalize nudge is specified in this round
 * (Batch 214) and none is built: refuseLiveIntervention throws on any
 * finalize-nudge / nudge / live-gate attempt.
 *
 * Spec: Batch 218 (seen.md), building on Batch 214's two-column framing
 * for "termination unawareness" (round 14 taxonomy entry, plan-executor):
 *   (a) a per-routine completion predicate — tool-verified outcome
 *       present, or final-state predicate, or person acceptance,
 *       whichever the routine declares;
 *   (b) the flag itself: any non-final hop after the predicate fired.
 * Round 14's terminationFlag214 is a STUB (caller supplies
 * predicateFiredAtHop; no predicate evaluation, no forms, no latching,
 * no break, no run endings). This module implements the full spec
 * alongside it; the stub is left untouched (deltas only).
 *
 * COMPARISON-FIRST (against AutoGen termination conditions and
 * tau-bench / tau2-bench final-state evaluation, per Batch 218):
 *   - AutoGen lets the MODEL declare termination ("done" / TERMINATE
 *     text, or a termination condition the model itself evaluates).
 *     DIVERGENCE 1: model text is NEVER proof here. A model-declared-
 *     done event is logged as its own event and compared against the
 *     predicate (fired = consistent, unfired = premature-finalization
 *     candidate). The declaration never fires the predicate and never
 *     excuses later hops.
 *   - Harness stops (step cap, timeout, budget) end runs in most
 *     harnesses and are easily misread as completion. DIVERGENCE 2:
 *     three distinct run endings, never two — completed-by-predicate,
 *     stopped-by-harness (cap/timeout/budget, predicate unfired),
 *     abandoned (person interrupt, unrecovered error, external stop).
 *     Termination unawareness is defined ONLY against predicate firing.
 *   - tau-bench / tau2-bench evaluate final state with assertion
 *     functions over fields. DIVERGENCE 3 (adopted spirit, tightened
 *     form): field-level assertions ONLY. Full-state equality / hash
 *     is explicitly rejected as too strict for personal routines —
 *     a predicate carrying one throws at declaration.
 *   - DIVERGENCE 4: silence is NOT acceptance. Continuation without an
 *     explicit accept event logs an uncorrected-final event, never a
 *     firing. Acceptance comes from the person, in the routine's
 *     channel, with its target identified — never from the model.
 *
 * COMPARISON ANSWERS (honest, measured against the repo at build time):
 *   (a) PREDICATE-DECLARED SHARE — zero. No routine anywhere in the
 *       repo declares a completion predicate: the north-star modules
 *       carry no routine registry at all (round 15 found the same for
 *       read sets: 0 declared), the workbench has no per-routine
 *       predicate declarations, and round 14's stub only consumes a
 *       caller-supplied predicate. The termination diagnostic is
 *       therefore mostly "not measurable" on the repo as it stands —
 *       see predicateDeclaredShare / reportRoutineStats. This module
 *       does NOT ship the flag as a rule on undeclared routines: a
 *       routine with no declared predicate emits NO flag event and
 *       reports termination-unawareness as "not measurable", never 0.
 *   (b) RE-READABLE-ASSERTION SHARE — undefined on the repo (no
 *       predicates, no state readers), 0% wherever a predicate is
 *       declared without readers covering its fields. Per form, a set
 *       with any assertion field no declared reader can re-read is
 *       UNMEASURABLE (not false) for that form; see assertMeasurable /
 *       reReadableAssertionShare. State-reader declarations must come
 *       before any flag wiring, exactly as round 15 concluded for
 *       read sets.
 *   (c) VERIFIED-SUCCESS — the shipped ledger records only ok/error
 *       and does NOT distinguish verified-success (round 15 finding).
 *       Form A therefore derives verified-success exactly as round
 *       15's module does (schema-valid + non-conflicting + value
 *       present) and never infers it from ok/200. If a tool cannot be
 *       re-read (fire-and-forget, no read-back), Form A is UNAVAILABLE
 *       for that outcome — the tool response is never promoted by
 *       relabeling.
 *
 * Node.js, CommonJS, zero dependencies. Run: node completion-predicate.test.cjs
 */

const PREDICATE_SPEC_VERSION = 'v1';
const VERIFIED_SUCCESS = 'verified-success';
const LABEL_GRADE = 'new-flag';
const TERMINATION_THRESHOLD = 1;
const FORMS = Object.freeze(['A', 'B', 'C']);
const FORM_NAMES = Object.freeze({
  A: 'tool-verified outcome',
  B: 'final-state outcome predicate',
  C: 'person acceptance',
});
const EVALUATION_POINTS = Object.freeze(['after-commit', 'after-final']);
const RUN_ENDINGS = Object.freeze(['completed-by-predicate', 'stopped-by-harness', 'abandoned']);
const HARNESS_STOP_KINDS = Object.freeze(['cap', 'timeout', 'budget', 'step-cap', 'step_cap']);
const ABANDON_KINDS = Object.freeze(['person-interrupt', 'person_interrupt', 'unrecovered-error', 'unrecovered_error', 'external-stop', 'external_stop']);
const OPERATORS = Object.freeze([
  'equals', 'not-equals', 'present', 'absent',
  'greater-than', 'less-than', 'greater-or-equal', 'less-or-equal',
]);
const FULL_STATE_MARKERS = Object.freeze(['full-state-hash', 'fullStateHash', 'full-state-equality', 'state-hash', 'state-equals']);
const ACCEPT_KINDS = Object.freeze(['accept', 'confirm', 'accepted', 'confirmation']);
const LIVE_ACTIONS = Object.freeze([
  'nudge', 'finalize-nudge', 'finalizeNudge', 'live-finalize-nudge',
  'error', 'handler', 'live-threshold', 'liveThreshold', 'threshold',
  'live-gate', 'liveGate', 'auto-skip', 'autoSkip', 'skip',
]);
const FLAG_FIELDS = Object.freeze([
  'trajectoryId',
  'predicateId',
  'predicateSpecVersion',
  'firingForm',
  'firingHopId',
  'postFiringHopIds',
  'postFiringHopCount',
  'predicateBroken',
  'labelGrade',
]);

// ---------------------------------------------------------------------------
// Observation status (Batch 216 definition, reused verbatim for Form A)
// ---------------------------------------------------------------------------

/**
 * Derive an observation status from its three components. verified-success
 * requires ALL three: schemaValid === true, conflicting === false, and
 * valuePresent === true. Anything else is never verified-success.
 * Mirrors round 15's deriveObservationStatus exactly; duplicated here
 * because north-star modules are self-contained files (no cross-module
 * imports), not because the definition differs.
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

/** A hop's observation status, derived from components when present
 *  (components override any claimed string), else the literal string.
 *  'ok' / 200 / merely-returned is NEVER verified-success. */
function hopObservationStatus(hop) {
  if (hop.observationComponents !== undefined && hop.observationComponents !== null) {
    return deriveObservationStatus(hop.observationComponents);
  }
  return hop.observationStatus !== undefined ? hop.observationStatus : null;
}

// ---------------------------------------------------------------------------
// Hop classification
// ---------------------------------------------------------------------------

function isCommitHop(hop) {
  return hop && (hop.hopClass === 'write' || hop.hopClass === 'commit' || hop.hopClass === 'final' || hop.hopClass === 'finalize');
}

function isFinalizeHop(hop) {
  if (!hop || typeof hop !== 'object') return false;
  return hop.hopClass === 'final' || hop.hopClass === 'finalize'
    || hop.isFinalAnswer === true || hop.isFinal === true
    || hop.kind === 'final-answer' || hop.kind === 'finalize';
}

/** Evaluation point for a hop, or null. Reads are NEVER evaluation
 *  points: Form A/B evaluate after commit hops and after final hops
 *  ONLY (Batch 218 §9). */
function evaluationPointForHop(hop) {
  if (!hop) return null;
  if (hop.hopClass === 'final' || hop.hopClass === 'finalize' || hop.isFinalAnswer === true || hop.kind === 'final-answer' || hop.kind === 'finalize') return 'after-final';
  if (hop.hopClass === 'write' || hop.hopClass === 'commit') return 'after-commit';
  return null;
}

// ---------------------------------------------------------------------------
// Ledger-only refusal
// ---------------------------------------------------------------------------

function assertLedgerOnly(input) {
  if (!input || typeof input !== 'object') return { mode: 'ledger-only' };
  for (const key of Object.keys(input)) {
    if (LIVE_ACTIONS.includes(key) || LIVE_ACTIONS.includes(input[key])) {
      throw new Error(`assertLedgerOnly: REFUSED — live intervention "${key}" is not part of this round (Batch 218: LEDGER-ONLY, no live finalize nudge; the diagnostic threshold is for the offline pass only)`);
    }
  }
  if (input.live === true || input.liveGate === true || input.mode === 'live-gate') {
    throw new Error('assertLedgerOnly: REFUSED — live-gate mode is not part of this round (Batch 218: LEDGER-ONLY)');
  }
  return { mode: 'ledger-only' };
}

/** Any attempt to add a live finalize nudge / threshold / handler in
 *  this round throws here, rather than being silently added. */
function refuseLiveIntervention(request) {
  if (!request || typeof request !== 'object') throw new Error('refuseLiveIntervention: request must be an object');
  const action = request.action || request.kind || request.type;
  if (LIVE_ACTIONS.includes(action)) {
    throw new Error(`refuseLiveIntervention: REFUSED — live intervention "${action}" is not part of this round (Batch 218: LEDGER-ONLY; NO live finalize nudge is specified, per Batch 214 — the threshold of 1 is an offline-pass diagnostic)`);
  }
  return { mode: 'ledger-only', action: action || null };
}

// ---------------------------------------------------------------------------
// Predicate declaration
// ---------------------------------------------------------------------------

function _isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function _normalizeFieldList(list, what) {
  if (!Array.isArray(list)) throw new Error(`completion-predicate: ${what} must be an array of "resource.field" strings`);
  return list.map((entry) => {
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry.resource === 'string' && typeof entry.field === 'string') {
      return `${entry.resource.trim()}.${entry.field.trim()}`;
    }
    throw new Error(`completion-predicate: ${what} entries must be "resource.field" strings or { resource, field } objects`);
  });
}

function _validateAssertion(assertion, setId) {
  if (!assertion || typeof assertion !== 'object') throw new Error(`completion-predicate: assertion in set "${setId}" must be an object { field, operator, value? }`);
  // DIVERGENCE 3: full-state equality / hash is explicitly rejected.
  if (assertion.fullState === true || assertion.kind === 'full-state-hash' || FULL_STATE_MARKERS.includes(assertion.operator) || FULL_STATE_MARKERS.includes(assertion.kind)) {
    throw new Error(`completion-predicate: REFUSED — full-state equality/hash in set "${setId}" is rejected (Batch 218 divergence 3: field-level assertions only; full-state hash is too strict for personal routines)`);
  }
  if (!_isNonEmptyString(assertion.field)) throw new Error(`completion-predicate: assertion in set "${setId}" needs a non-empty field`);
  if (assertion.field.trim() === '*') {
    throw new Error(`completion-predicate: REFUSED — field "*" in set "${setId}" is full-state equality by another name (Batch 218 divergence 3: field-level assertions only)`);
  }
  if (!OPERATORS.includes(assertion.operator)) {
    throw new Error(`completion-predicate: assertion on "${assertion.field}" in set "${setId}" has unknown operator "${assertion.operator}" (allowed: ${OPERATORS.join(', ')})`);
  }
  if ((assertion.operator === 'present' || assertion.operator === 'absent') && assertion.value !== undefined) {
    // A value alongside present/absent is harmless but ambiguous; refuse
    // rather than silently ignoring part of the declaration.
    throw new Error(`completion-predicate: assertion on "${assertion.field}" in set "${setId}" uses operator "${assertion.operator}" with a value — present/absent take no value`);
  }
  if (assertion.operator !== 'present' && assertion.operator !== 'absent' && assertion.value === undefined) {
    throw new Error(`completion-predicate: assertion on "${assertion.field}" in set "${setId}" uses operator "${assertion.operator}" without a value — missing fields are never silently defaulted`);
  }
  return {
    field: assertion.field.trim(),
    operator: assertion.operator,
    ...(assertion.value !== undefined ? { value: assertion.value } : {}),
  };
}

/**
 * Validate a predicate declaration WITHOUT throwing, for callers that
 * want a rejection report. declarePredicate below throws on any
 * violation — missing fields are never silently defaulted.
 * Returns { valid, violations, grade } where grade is 'rule-grade' iff
 * valid (a predicate with a missing or defective field is not
 * rule-grade, it is rejected).
 */
function validatePredicateDeclaration(decl) {
  const violations = [];
  if (!decl || typeof decl !== 'object') return { valid: false, violations: ['declaration-missing'], grade: 'rejected' };
  if (!_isNonEmptyString(decl.id)) violations.push('missing-field:id');
  if (!_isNonEmptyString(decl.routineId)) violations.push('missing-field:routineId');
  if (!_isNonEmptyString(decl.specVersion)) violations.push('missing-field:specVersion');
  if (!Array.isArray(decl.forms) || decl.forms.length === 0) violations.push('missing-field:forms');
  if (!Array.isArray(decl.evaluationPoints) || decl.evaluationPoints.length === 0) {
    violations.push('missing-field:evaluationPoints');
  } else {
    for (const p of decl.evaluationPoints) {
      if (!EVALUATION_POINTS.includes(p)) violations.push(`invalid-evaluation-point:${p}`);
    }
  }
  if (decl.readScope === 'full-state') violations.push('spec-defect:full-state-reread-per-hop');
  if (!Array.isArray(decl.stateReaders)) {
    violations.push('missing-field:stateReaders');
  } else {
    for (const r of decl.stateReaders) {
      if (!r || !_isNonEmptyString(r.tool) || !Array.isArray(r.readSet)) violations.push('malformed-state-reader');
    }
  }

  const forms = Array.isArray(decl.forms) ? decl.forms : [];
  const formLetters = forms.map((f) => f && f.form).filter(Boolean);
  for (const f of forms) {
    if (!f || !FORMS.includes(f.form)) { violations.push(`unknown-form:${f && f.form}`); continue; }
    if ((f.form === 'A' || f.form === 'B') && (!Array.isArray(f.assertionSetIds) || f.assertionSetIds.length === 0)) {
      violations.push(`missing-field:assertionSetIds-for-form-${f.form}`);
    }
    if (f.form === 'C' && f.assertionSetIds !== undefined) {
      violations.push('misplaced-field:assertionSetIds-on-form-C');
    }
  }
  const declaredForms = new Set(formLetters);
  const needsAssertionSets = declaredForms.has('A') || declaredForms.has('B');
  const sets = Array.isArray(decl.assertionSets) ? decl.assertionSets : [];
  if (needsAssertionSets && sets.length === 0) violations.push('missing-field:assertionSets');
  const setIds = new Set();
  for (const s of sets) {
    if (!s || !_isNonEmptyString(s.id)) { violations.push('malformed-assertion-set'); continue; }
    if (setIds.has(s.id)) violations.push(`duplicate-assertion-set-id:${s.id}`);
    setIds.add(s.id);
    if (!Array.isArray(s.assertions) || s.assertions.length === 0) violations.push(`missing-field:assertions-in-set-${s.id}`);
    for (const a of (s.assertions || [])) {
      try { _validateAssertion(a, s.id); } catch (e) { violations.push(e.message); }
    }
  }
  for (const f of forms) {
    for (const sid of (f.assertionSetIds || [])) {
      if (!setIds.has(sid)) violations.push(`unknown-assertion-set-id:${sid}`);
    }
  }
  if (declaredForms.has('C')) {
    if (!decl.acceptanceChannel || typeof decl.acceptanceChannel !== 'object') {
      violations.push('missing-field:acceptanceChannel');
    } else {
      if (!_isNonEmptyString(decl.acceptanceChannel.channel)) violations.push('missing-field:acceptanceChannel.channel');
      if (decl.acceptanceChannel.from !== 'person') violations.push('acceptanceChannel.from-must-be-person');
    }
  }
  // A routine may declare acceptance as its SOLE form (purely
  // presentational routines), but then the spec must SAY so.
  if (formLetters.length === 1 && formLetters[0] === 'C' && decl.acceptanceOnly !== true) {
    violations.push('acceptance-only-not-declared');
  }
  if (formLetters.length > 1 && decl.acceptanceOnly === true) {
    violations.push('acceptanceOnly-with-non-C-forms');
  }
  if (needsAssertionSets && Array.isArray(decl.stateReaders) && decl.stateReaders.length === 0) {
    violations.push('missing-field:stateReaders-nonempty-for-A-B');
  }
  return { valid: violations.length === 0, violations, grade: violations.length === 0 ? 'rule-grade' : 'rejected' };
}

/** Declare a predicate: throws on any violation (fail-loud), returns a
 *  normalized frozen copy. Nothing is defaulted: absent specVersion,
 *  evaluationPoints, stateReaders, assertionSets, or acceptanceChannel
 *  (when C is declared) is a throw, not a default. */
function declarePredicate(decl) {
  const check = validatePredicateDeclaration(decl);
  if (!check.valid) {
    throw new Error(`declarePredicate: REFUSED — invalid predicate declaration: ${check.violations.join('; ')} (missing fields are never silently defaulted)`);
  }
  const sets = decl.assertionSets.map((s) => ({
    id: s.id,
    assertions: s.assertions.map((a) => _validateAssertion(a, s.id)),
  }));
  const readers = decl.stateReaders.map((r) => ({
    tool: r.tool,
    readSet: _normalizeFieldList(r.readSet, `state reader "${r.tool}" readSet`),
  }));
  return Object.freeze({
    id: decl.id,
    routineId: decl.routineId,
    specVersion: decl.specVersion,
    forms: Object.freeze(decl.forms.map((f) => Object.freeze({
      form: f.form,
      ...(f.assertionSetIds ? { assertionSetIds: Object.freeze([...f.assertionSetIds]) } : {}),
    }))),
    assertionSets: Object.freeze(sets.map((s) => Object.freeze({ ...s, assertions: Object.freeze(s.assertions) }))),
    stateReaders: Object.freeze(readers.map((r) => Object.freeze({ ...r, readSet: Object.freeze(r.readSet) }))),
    acceptanceChannel: decl.acceptanceChannel ? Object.freeze({ ...decl.acceptanceChannel }) : null,
    acceptanceOnly: decl.acceptanceOnly === true,
    evaluationPoints: Object.freeze([...decl.evaluationPoints]),
  });
}

// ---------------------------------------------------------------------------
// Assertion evaluation (field-level, single snapshot)
// ---------------------------------------------------------------------------

function _canonical(value) {
  if (Array.isArray(value)) return value.map(_canonical);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = _canonical(value[k]);
    return out;
  }
  if (typeof value === 'string') return value.trim();
  return value;
}

function _lookupField(snapshot, field) {
  if (!snapshot || typeof snapshot !== 'object') return { found: false, value: undefined };
  if (Object.prototype.hasOwnProperty.call(snapshot, field)) {
    return { found: true, value: snapshot[field] };
  }
  const parts = field.split('.');
  let cur = snapshot;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, p)) {
      return { found: false, value: undefined };
    }
    cur = cur[p];
  }
  return { found: true, value: cur };
}

/** Evaluate ONE field-level assertion against ONE snapshot. Returns
 *  { holds, field, operator }. Never throws on a type mismatch: a
 *  non-numeric comparison operand simply does not hold. */
function evaluateAssertion(assertion, snapshot) {
  const { found, value } = _lookupField(snapshot, assertion.field);
  switch (assertion.operator) {
    case 'present': return { holds: found && value !== null && value !== undefined, field: assertion.field, operator: assertion.operator };
    case 'absent': return { holds: !found || value === null || value === undefined, field: assertion.field, operator: assertion.operator };
    case 'equals': return { holds: found && JSON.stringify(_canonical(value)) === JSON.stringify(_canonical(assertion.value)), field: assertion.field, operator: assertion.operator };
    case 'not-equals': return { holds: found && JSON.stringify(_canonical(value)) !== JSON.stringify(_canonical(assertion.value)), field: assertion.field, operator: assertion.operator };
    case 'greater-than': return { holds: found && typeof value === 'number' && typeof assertion.value === 'number' && value > assertion.value, field: assertion.field, operator: assertion.operator };
    case 'less-than': return { holds: found && typeof value === 'number' && typeof assertion.value === 'number' && value < assertion.value, field: assertion.field, operator: assertion.operator };
    case 'greater-or-equal': return { holds: found && typeof value === 'number' && typeof assertion.value === 'number' && value >= assertion.value, field: assertion.field, operator: assertion.operator };
    case 'less-or-equal': return { holds: found && typeof value === 'number' && typeof assertion.value === 'number' && value <= assertion.value, field: assertion.field, operator: assertion.operator };
    default: throw new Error(`evaluateAssertion: unknown operator "${assertion.operator}"`);
  }
}

/** Evaluate one assertion set against ONE snapshot (simultaneous, not
 *  accumulated across time). AND within the set: holds iff every
 *  assertion holds. */
function evaluateAssertionSet(set, snapshot) {
  if (!set || !Array.isArray(set.assertions)) throw new Error('evaluateAssertionSet: set must carry an assertions array');
  const results = set.assertions.map((a) => evaluateAssertion(a, snapshot));
  const satisfied = results.filter((r) => r.holds);
  const unsatisfied = results.filter((r) => !r.holds);
  return {
    setId: set.id,
    holds: unsatisfied.length === 0,
    satisfiedCount: satisfied.length,
    totalCount: results.length,
    satisfiedFields: satisfied.map((r) => r.field),
    unsatisfiedFields: unsatisfied.map((r) => r.field),
  };
}

// ---------------------------------------------------------------------------
// Measurability (state readers) + falsifier shares
// ---------------------------------------------------------------------------

/** Fields no declared reader can re-read. A set with any uncovered
 *  field is UNMEASURABLE for its form — not false. */
function uncoveredFields(predicate, set) {
  const covered = new Set();
  for (const r of predicate.stateReaders || []) {
    for (const f of r.readSet || []) covered.add(f);
  }
  return set.assertions.map((a) => a.field).filter((f) => !covered.has(f));
}

function assertMeasurable(predicate) {
  if (!predicate || !Array.isArray(predicate.assertionSets)) throw new Error('assertMeasurable: predicate must carry assertionSets');
  const perSet = predicate.assertionSets.map((s) => {
    const uncovered = uncoveredFields(predicate, s);
    return { setId: s.id, measurable: uncovered.length === 0, uncoveredFields: uncovered };
  });
  const formsWithMeasurableSet = new Set();
  for (const f of predicate.forms || []) {
    for (const sid of (f.assertionSetIds || [])) {
      const row = perSet.find((p) => p.setId === sid);
      if (row && row.measurable) formsWithMeasurableSet.add(f.form);
    }
  }
  const abForms = (predicate.forms || []).map((f) => f.form).filter((x) => x === 'A' || x === 'B');
  const measurable = abForms.length === 0 || abForms.every((x) => formsWithMeasurableSet.has(x));
  return { measurable, perSet, formsWithMeasurableSet: [...formsWithMeasurableSet], note: measurable ? 'Every A/B form has at least one fully re-readable set' : 'At least one A/B form has NO fully re-readable set — that form is UNMEASURABLE, not false' };
}

/** FALSIFIER, per form: the re-readable-assertion share. share < 1 on a
 *  form means that form cannot be read at rule-grade for this predicate. */
function reReadableAssertionShare(predicate) {
  if (!predicate || !Array.isArray(predicate.assertionSets)) throw new Error('reReadableAssertionShare: predicate must carry assertionSets');
  const covered = new Set();
  for (const r of predicate.stateReaders || []) {
    for (const f of r.readSet || []) covered.add(f);
  }
  const perForm = {};
  for (const f of predicate.forms || []) {
    if (f.form === 'C') {
      perForm.C = { form: 'C', totalAssertions: 0, reReadable: 0, share: null, note: 'Form C needs no state re-read: acceptance is a person event, not a state assertion' };
      continue;
    }
    const sets = (f.assertionSetIds || []).map((sid) => predicate.assertionSets.find((s) => s.id === sid)).filter(Boolean);
    let total = 0;
    let readable = 0;
    const unmeasurableSetIds = [];
    for (const s of sets) {
      let setReadable = true;
      for (const a of s.assertions) {
        total += 1;
        if (covered.has(a.field)) { readable += 1; } else { setReadable = false; }
      }
      if (!setReadable) unmeasurableSetIds.push(s.id);
    }
    perForm[f.form] = {
      form: f.form,
      totalAssertions: total,
      reReadable: readable,
      share: total === 0 ? null : readable / total,
      unmeasurableSetIds,
    };
  }
  return { predicateId: predicate.id, perForm };
}

/** FALSIFIER, per routine: the predicate-declared share. */
function predicateDeclaredShare(routines) {
  if (!Array.isArray(routines)) throw new Error('predicateDeclaredShare: routines must be an array of { routineId, predicate }');
  const total = routines.length;
  const declared = routines.filter((r) => r.predicate !== null && r.predicate !== undefined).length;
  const acceptanceOnly = routines.filter((r) => r.predicate && r.predicate.acceptanceOnly === true).length;
  const share = total === 0 ? null : declared / total;
  return {
    totalRoutines: total,
    declaredCount: declared,
    undeclaredCount: total - declared,
    share,
    acceptanceOnlyCount: acceptanceOnly,
    acceptanceOnlyShare: total === 0 ? null : acceptanceOnly / total,
    verdict: total === 0
      ? 'unmeasured — no routines surveyed'
      : share < 0.5
        ? 'FAILED — most routines lack a declared predicate: the termination diagnostic is mostly "not measurable", not zero (Batch 218 falsifier)'
        : 'not-refuted',
    note: 'A routine with NO declared predicate emits NO flag event and reports termination-unawareness as "not measurable", never zero',
  };
}

function reportRoutineStats(input) {
  if (!input || !Array.isArray(input.routines)) throw new Error('reportRoutineStats: input must be { routines }');
  const share = predicateDeclaredShare(input.routines);
  return { ...share, routines: input.routines.map((r) => ({ routineId: r.routineId, predicateDeclared: r.predicate !== null && r.predicate !== undefined, acceptanceOnly: !!(r.predicate && r.predicate.acceptanceOnly) })) };
}

// ---------------------------------------------------------------------------
// Evaluation-cost rule (§9)
// ---------------------------------------------------------------------------

/** Evaluate at a point: throws unless the point is one of the
 *  predicate's DECLARED evaluation points. Evaluating after a read is
 *  refused, not downgraded. */
function evaluateAt(input) {
  if (!input || !input.predicate || !input.point) throw new Error('evaluateAt: input must carry { predicate, point }');
  if (!input.predicate.evaluationPoints || !input.predicate.evaluationPoints.includes(input.point)) {
    throw new Error(`evaluateAt: REFUSED — "${input.point}" is not a declared evaluation point for predicate "${input.predicate.id}" (declared: ${(input.predicate.evaluationPoints || []).join(', ') || '(none)'}; Batch 218 §9: after commit hops and after final hops ONLY, not after every read)`);
  }
  return { point: input.point, allowed: true };
}

/** Cost report: evaluation happens only at declared points, re-reading
 *  only assertion fields — never whole state per hop. A predicate
 *  requiring full-state re-read per hop is a spec defect, reported
 *  here and refused at declaration, never wired. */
function evaluationCostReport(predicate) {
  if (!predicate) throw new Error('evaluationCostReport: predicate required');
  const fields = new Set();
  for (const s of predicate.assertionSets || []) {
    for (const a of s.assertions) fields.add(a.field);
  }
  const defect = predicate.readScope === 'full-state'
    ? 'SPEC DEFECT — predicate requires full-state re-read per hop (Batch 218 §9): report, do not wire'
    : null;
  return {
    predicateId: predicate.id,
    evaluationPoints: [...(predicate.evaluationPoints || [])],
    assertionFieldCount: fields.size,
    assertionFields: [...fields].sort(),
    reReadScope: 'assertion-fields-only',
    wholeStatePerHop: false,
    defect,
  };
}

// ---------------------------------------------------------------------------
// Form evaluation (single-shot helpers, used by the trajectory pass)
// ---------------------------------------------------------------------------

/** FORM A — tool-verified outcome. Fires at hop H iff ALL of:
 *   (a) H is a commit hop (write or final);
 *   (b) H's observation status = verified-success (derived, never ok/200);
 *   (c) H is re-readable (a fire-and-forget tool with no read-back makes
 *       Form A UNAVAILABLE — the response is never promoted);
 *   (d) at least one declared A assertion set holds in full against the
 *       VERIFIER RE-READ state (hop.reReadState), never against the
 *       tool's response claim; AND within a set, OR across sets (§1);
 *   (e) H's effect footprint intersects that set's fields (attribution:
 *       the hop must have touched the asserted state; an undeclared
 *       footprint cannot attribute the outcome, so it does not fire).
 *  Returns { fired, assertionSetId, reason, measurable }. */
function evaluateFormA(predicate, hop) {
  const form = (predicate.forms || []).find((f) => f.form === 'A');
  if (!form) return { fired: false, assertionSetId: null, reason: 'form-A-not-declared', measurable: true };
  if (!isCommitHop(hop)) return { fired: false, assertionSetId: null, reason: 'not-a-commit-hop', measurable: true };
  const status = hopObservationStatus(hop);
  if (status !== VERIFIED_SUCCESS) {
    return { fired: false, assertionSetId: null, reason: `observation-not-verified-success:${status === null ? 'unknown' : status}`, measurable: true };
  }
  if (hop.reReadable === false) {
    return { fired: false, assertionSetId: null, reason: 'unavailable-no-readback', measurable: false, note: 'Form A is UNAVAILABLE for a tool that cannot be re-read (fire-and-forget): the tool response is never promoted by relabeling' };
  }
  if (!hop.reReadState || typeof hop.reReadState !== 'object') {
    return { fired: false, assertionSetId: null, reason: 'no-reread-state', measurable: false, note: 'Form A fires only on verifier re-read, never on the tool response claim; without a re-read snapshot it cannot fire' };
  }
  const footprint = hop.effectFootprint !== undefined && hop.effectFootprint !== null
    ? _normalizeFieldList(hop.effectFootprint, `hop "${hop.id}" effectFootprint`)
    : null;
  const partials = [];
  for (const sid of form.assertionSetIds) {
    const set = predicate.assertionSets.find((s) => s.id === sid);
    if (!set) continue;
    const uncovered = uncoveredFields(predicate, set);
    if (uncovered.length > 0) {
      partials.push({ setId: sid, reason: 'unmeasurable-uncovered-fields', uncoveredFields: uncovered });
      continue;
    }
    const result = evaluateAssertionSet(set, hop.reReadState);
    if (!result.holds) {
      partials.push({ setId: sid, reason: 'partial', satisfiedCount: result.satisfiedCount, totalCount: result.totalCount, unsatisfiedFields: result.unsatisfiedFields });
      continue;
    }
    if (footprint === null) {
      return { fired: false, assertionSetId: sid, reason: 'unattributed-no-footprint', measurable: true, note: 'Re-read state satisfies the set, but the hop declares no effect footprint, so the outcome cannot be attributed to this hop' };
    }
    const setFields = new Set(set.assertions.map((a) => a.field));
    if (!footprint.some((f) => setFields.has(f))) {
      return { fired: false, assertionSetId: sid, reason: 'footprint-does-not-touch-asserted-state', measurable: true };
    }
    return { fired: true, assertionSetId: sid, reason: 'fired', measurable: true };
  }
  return { fired: false, assertionSetId: null, reason: 'no-assertion-set-holds-on-reread', measurable: true, partials };
}

/** FORM B — final-state outcome predicate. Fires at an evaluation point
 *  iff ALL required assertions in ONE declared assertion set hold
 *  against a SINGLE snapshot of re-read state (simultaneous, not
 *  accumulated across time). Partial sets are reported, never fired. */
function evaluateFormB(predicate, snapshot) {
  const form = (predicate.forms || []).find((f) => f.form === 'B');
  if (!form) return { fired: false, assertionSetId: null, reason: 'form-B-not-declared', measurable: true, partials: [] };
  if (!snapshot || typeof snapshot !== 'object') {
    return { fired: false, assertionSetId: null, reason: 'no-snapshot', measurable: false, partials: [] };
  }
  const partials = [];
  for (const sid of form.assertionSetIds) {
    const set = predicate.assertionSets.find((s) => s.id === sid);
    if (!set) continue;
    const uncovered = uncoveredFields(predicate, set);
    if (uncovered.length > 0) {
      partials.push({ setId: sid, reason: 'unmeasurable-uncovered-fields', uncoveredFields: uncovered });
      continue;
    }
    const result = evaluateAssertionSet(set, snapshot);
    if (result.holds) return { fired: true, assertionSetId: sid, reason: 'fired', measurable: true, partials };
    partials.push({ setId: sid, reason: 'partial', satisfiedCount: result.satisfiedCount, totalCount: result.totalCount, satisfiedFields: result.satisfiedFields, unsatisfiedFields: result.unsatisfiedFields });
  }
  return { fired: false, assertionSetId: null, reason: 'no-assertion-set-holds', measurable: true, partials };
}

/** FORM C — person acceptance. Fires ONLY on an explicit accept event
 *  for this routine's outcome: routine match + identified target +
 *  person origin + an explicit accept kind + (when both present) the
 *  declared channel. Model-origin accepts, target-less accepts, and
 *  silence never fire. */
function evaluateFormC(predicate, acceptEvents) {
  const form = (predicate.forms || []).find((f) => f.form === 'C');
  if (!form) return { fired: false, acceptEventId: null, reason: 'form-C-not-declared', rejected: [] };
  const rejected = [];
  for (const ev of acceptEvents || []) {
    if (!ev || typeof ev !== 'object') { rejected.push({ eventId: null, reason: 'malformed-event' }); continue; }
    if (ev.routineId !== predicate.routineId) { rejected.push({ eventId: ev.id || null, reason: 'routine-mismatch' }); continue; }
    if (!_isNonEmptyString(ev.target)) { rejected.push({ eventId: ev.id || null, reason: 'target-not-identified' }); continue; }
    if (ev.from !== 'person') { rejected.push({ eventId: ev.id || null, reason: `origin-not-person:${ev.from === undefined ? 'unknown' : ev.from}` }); continue; }
    if (!ACCEPT_KINDS.includes(ev.kind) && ev.accepted !== true) { rejected.push({ eventId: ev.id || null, reason: `not-an-explicit-accept:${ev.kind === undefined ? 'unknown' : ev.kind}` }); continue; }
    const channel = predicate.acceptanceChannel && predicate.acceptanceChannel.channel;
    if (channel && ev.channel !== undefined && ev.channel !== null && ev.channel !== channel) {
      rejected.push({ eventId: ev.id || null, reason: 'channel-mismatch' }); continue;
    }
    return { fired: true, acceptEventId: ev.id || null, reason: 'fired', rejected, acceptEvent: ev };
  }
  return { fired: false, acceptEventId: null, reason: 'no-qualifying-accept-event', rejected };
}

// ---------------------------------------------------------------------------
// Run endings (divergence 2)
// ---------------------------------------------------------------------------

/** Classify a run ending. THREE endings, never two — and 'unknown' when
 *  no ending information is supplied (unknown is not a completion).
 *  completed-by-predicate comes only from predicate firing, never from
 *  a model declaration, a harness stop, or a bare final hop. */
function classifyRunEnding(input) {
  if (!input || typeof input !== 'object') throw new Error('classifyRunEnding: input must be an object { predicateFired, endingKind? }');
  if (input.predicateFired === true) return 'completed-by-predicate';
  const kind = input.endingKind;
  if (kind === undefined || kind === null) return 'unknown';
  if (HARNESS_STOP_KINDS.includes(kind)) return 'stopped-by-harness';
  if (ABANDON_KINDS.includes(kind)) return 'abandoned';
  throw new Error(`classifyRunEnding: REFUSED — unknown ending kind "${kind}" (harness stops: ${HARNESS_STOP_KINDS.join(', ')}; abandoned: ${ABANDON_KINDS.join(', ')}; a model declaration is never an ending)`);
}

// ---------------------------------------------------------------------------
// Flag event validation / grading
// ---------------------------------------------------------------------------

function validateFlagEvent(event) {
  const violations = [];
  if (!event || typeof event !== 'object') return { valid: false, labelGrade: 'judge-grade', violations: ['event-missing'] };
  for (const f of FLAG_FIELDS) {
    if (event[f] === undefined || event[f] === null) violations.push(`missing-field:${f}`);
  }
  if (event.firingForm !== undefined && !FORMS.includes(event.firingForm)) violations.push(`unknown-firing-form:${event.firingForm}`);
  if ((event.firingForm === 'A' || event.firingForm === 'B') && !event.assertionSetId) violations.push('missing-field:assertionSetId');
  if (event.firingForm === 'C' && !event.acceptEventId) violations.push('missing-field:acceptEventId');
  if (event.predicateBroken !== undefined) {
    if (typeof event.predicateBroken !== 'object') {
      violations.push('malformed-predicateBroken');
    } else if (event.predicateBroken.status === 'broken' && !event.predicateBroken.breakingHopId) {
      violations.push('missing-field:predicateBroken.breakingHopId');
    } else if (event.predicateBroken.status !== 'none' && event.predicateBroken.status !== 'broken') {
      violations.push(`unknown-predicateBroken-status:${event.predicateBroken.status}`);
    }
  }
  if (event.labelGrade !== undefined && event.labelGrade !== LABEL_GRADE) violations.push(`unexpected-labelGrade:${event.labelGrade}`);
  return { valid: violations.length === 0, labelGrade: violations.length === 0 ? LABEL_GRADE : 'judge-grade', violations };
}

function gradeFlagEvent(event) {
  return validateFlagEvent(event).labelGrade;
}

/** Diagnostic threshold = 1 (offline pass): the FIRST non-final hop
 *  after firing already makes the trajectory termination-unaware. */
function terminationUnaware(flagEvent) {
  if (!flagEvent) return { unaware: false, threshold: TERMINATION_THRESHOLD, postFiringHopCount: 0 };
  const count = flagEvent.postFiringHopCount !== undefined ? flagEvent.postFiringHopCount : (flagEvent.postFiringHopIds || []).length;
  return { unaware: count >= TERMINATION_THRESHOLD, threshold: TERMINATION_THRESHOLD, postFiringHopCount: count };
}

// ---------------------------------------------------------------------------
// The trajectory pass (offline / ledger)
// ---------------------------------------------------------------------------

/**
 * Evaluate one trajectory against its routine's predicate. Pure
 * function: reads its input, returns a report, mutates nothing, touches
 * no live call.
 *
 * input: {
 *   trajectoryId, routineId,
 *   predicate: declared predicate object (declarePredicate output) or null,
 *   hops: [{ id, hopClass?, tool?, args?, effectFootprint?,
 *     observationStatus?, observationComponents?, reReadable?,
 *     reReadState?, trajectoryId?, index? }],
 *   acceptEvents?: [{ id, routineId, target, from, kind, channel?, hopId? }],
 *   modelDeclaredDoneEvents?: [{ hopId?, text? }],
 *   runEnding?: { endingKind? },
 * }
 * A routine with NO declared predicate emits NO flag event and reports
 * termination-unawareness as "not measurable" — never zero.
 *
 * Returns { trajectoryId, routineId, measurable, predicateId,
 *   predicateSpecVersion, fired, firing, flagEvent,
 *   terminationUnawareness, runEnding, modelDeclaredDone,
 *   uncorrectedFinal, partialPredicateStates, predicateBroken,
 *   predicateRepaired, postBreakHopIds, excludedFinalizeHopIds,
 *   formDiagnostics, verdict }.
 */
function evaluateTrajectory(input) {
  assertLedgerOnly(input);
  if (!input || typeof input.trajectoryId !== 'string' || !input.trajectoryId) {
    throw new Error('evaluateTrajectory: input must carry a trajectoryId');
  }
  if (!Array.isArray(input.hops)) throw new Error('evaluateTrajectory: input.hops must be an array');
  if (input.predicate === null || input.predicate === undefined) {
    return {
      trajectoryId: input.trajectoryId,
      routineId: input.routineId || null,
      measurable: false,
      predicateId: null,
      predicateSpecVersion: null,
      fired: false,
      firing: null,
      flagEvent: null,
      terminationUnawareness: 'not measurable',
      runEnding: classifyRunEnding({ predicateFired: false, endingKind: input.runEnding && input.runEnding.endingKind }),
      modelDeclaredDone: [],
      uncorrectedFinal: null,
      partialPredicateStates: [],
      predicateBroken: { status: 'none' },
      predicateRepaired: null,
      postBreakHopIds: [],
      excludedFinalizeHopIds: [],
      formDiagnostics: [],
      verdict: 'NOT MEASURABLE — no per-routine completion predicate declared; termination-unawareness is never reported as zero (Batch 214/218)',
    };
  }
  // Fail-loud on spec violations in the declaration itself.
  const predicate = declarePredicate(input.predicate);
  if (predicate.routineId !== input.routineId && input.routineId !== undefined) {
    throw new Error(`evaluateTrajectory: REFUSED — predicate "${predicate.id}" belongs to routine "${predicate.routineId}", not "${input.routineId}"; predicates are per-routine`);
  }

  const hops = input.hops.map((hop, position) => {
    if (!hop || typeof hop.id !== 'string') throw new Error('evaluateTrajectory: every hop needs a string id');
    if (hop.trajectoryId !== undefined && hop.trajectoryId !== input.trajectoryId) {
      throw new Error(`evaluateTrajectory: REFUSED — hop "${hop.id}" belongs to trajectory "${hop.trajectoryId}", not "${input.trajectoryId}"; predicates never span trajectories`);
    }
    return { ...hop, position, index: Number.isInteger(hop.index) ? hop.index : position };
  });
  const hopById = new Map(hops.map((h) => [h.id, h]));
  const acceptEvents = input.acceptEvents || [];
  const formDiagnostics = [];
  const partialPredicateStates = [];

  // --- Scan A/B at evaluation points, in trajectory order. First firing wins.
  let abFiring = null;
  for (const hop of hops) {
    const point = evaluationPointForHop(hop);
    if (point === null) continue; // reads are never evaluation points (§9)
    if (!predicate.evaluationPoints.includes(point)) continue; // only declared points
    evaluateAt({ predicate, point });
    const a = evaluateFormA(predicate, hop);
    if (a.reason !== 'form-A-not-declared') {
      formDiagnostics.push({ hopId: hop.id, point, form: 'A', ...a });
      for (const p of (a.partials || [])) partialPredicateStates.push({ hopId: hop.id, form: 'A', ...p });
    }
    if (a.fired) {
      abFiring = { form: 'A', assertionSetId: a.assertionSetId, firingHopId: hop.id, firingIndex: hop.index, firingPosition: hop.position };
      break;
    }
    const snapshot = hop.reReadState !== undefined ? hop.reReadState : null;
    const b = evaluateFormB(predicate, snapshot);
    if (b.reason !== 'form-B-not-declared') {
      formDiagnostics.push({ hopId: hop.id, point, form: 'B', ...b });
      for (const p of (b.partials || [])) partialPredicateStates.push({ hopId: hop.id, form: 'B', ...p });
    }
    if (b.fired) {
      abFiring = { form: 'B', assertionSetId: b.assertionSetId, firingHopId: hop.id, firingIndex: hop.index, firingPosition: hop.position };
      break;
    }
  }

  // --- Form C: earliest qualifying accept event, by hop position.
  const c = evaluateFormC(predicate, acceptEvents);
  formDiagnostics.push({ form: 'C', ...c });
  let cFiring = null;
  if (c.fired) {
    const ev = c.acceptEvent;
    const atHop = ev.hopId !== undefined && ev.hopId !== null ? hopById.get(ev.hopId) : null;
    cFiring = {
      form: 'C',
      acceptEventId: c.acceptEventId,
      firingHopId: atHop ? atHop.id : (ev.id || null),
      firingIndex: atHop ? atHop.index : Number.POSITIVE_INFINITY,
      firingPosition: atHop ? atHop.position : hops.length,
    };
  }

  // --- Overall firing: earliest position wins; ties break A, then B, then C.
  let firing = null;
  if (abFiring && cFiring) {
    firing = (cFiring.firingPosition < abFiring.firingPosition) ? cFiring : abFiring;
  } else {
    firing = abFiring || cFiring;
  }
  const fired = firing !== null;

  // --- Model-declared-done: logged + compared, never proof (divergence 1).
  const modelDeclaredDone = (input.modelDeclaredDoneEvents || []).map((ev) => {
    const atHop = ev.hopId !== undefined && ev.hopId !== null ? hopById.get(ev.hopId) : null;
    const position = atHop ? atHop.position : hops.length;
    const predicateAlreadyFired = fired && firing.firingPosition <= position;
    return {
      eventType: 'model-declared-done',
      hopId: ev.hopId || null,
      text: ev.text || null,
      comparison: predicateAlreadyFired ? 'consistent' : 'premature-finalization-candidate',
      note: predicateAlreadyFired
        ? 'Model declaration agrees with an already-fired predicate (consistent)'
        : 'Model declared done while the predicate had NOT fired — premature-finalization candidate, never a firing (Batch 218 divergence 1)',
    };
  });

  // --- Uncorrected-final: final hop(s) followed by continuation, no accept.
  let uncorrectedFinal = null;
  const finalHop = hops.find((h) => isFinalizeHop(h));
  if (finalHop) {
    const continuation = hops.filter((h) => h.position > finalHop.position && !isFinalizeHop(h));
    const hasAccept = c.fired;
    if (continuation.length > 0 && !hasAccept) {
      uncorrectedFinal = {
        eventType: 'uncorrected-final',
        finalHopId: finalHop.id,
        continuationHopIds: continuation.map((h) => h.id),
        note: 'Continuation after a final hop with no person accept event: logged as its own uncorrected-final event, NEVER as predicate firing (Batch 218 divergence 4: silence is not acceptance)',
      };
    }
  }

  // --- Post-firing hops, latching, break, repair.
  let flagEvent = null;
  let predicateBroken = { status: 'none' };
  let predicateRepaired = null;
  let postBreakHopIds = [];
  let excludedFinalizeHopIds = [];
  if (fired) {
    const after = hops.filter((h) => h.position > firing.firingPosition);
    const postFiringHopIds = [];
    let breakingHop = null;
    let brokenAssertions = [];
    for (const h of after) {
      if (isFinalizeHop(h)) { excludedFinalizeHopIds.push(h.id); continue; }
      if (breakingHop !== null) { postBreakHopIds.push(h.id); continue; }
      postFiringHopIds.push(h.id);
      // Break detection (A/B only): at a later evaluation point with a
      // fresh re-read, the firing assertion set no longer holds.
      if ((firing.form === 'A' || firing.form === 'B') && evaluationPointForHop(h) !== null
        && predicate.evaluationPoints.includes(evaluationPointForHop(h))
        && h.reReadState !== undefined && h.reReadState !== null) {
        const set = predicate.assertionSets.find((s) => s.id === firing.assertionSetId);
        if (set) {
          const result = evaluateAssertionSet(set, h.reReadState);
          if (!result.holds) {
            breakingHop = h;
            brokenAssertions = result.unsatisfiedFields;
          }
        }
      }
    }
    // Repair evidence: at a later evaluation point AFTER the break, the
    // firing set holds again. Repair vs self-undoing is NOT inferred
    // from a hop alone; re-satisfaction is recorded as repair evidence.
    if (breakingHop !== null) {
      predicateBroken = {
        status: 'broken',
        breakingHopId: breakingHop.id,
        brokenAssertionIds: brokenAssertions,
        priorFiringHopId: firing.firingHopId,
        firingForm: firing.form,
        assertionSetId: firing.assertionSetId,
      };
      const breakPosition = breakingHop.position;
      for (const h of hops) {
        if (h.position <= breakPosition || isFinalizeHop(h)) continue;
        if (evaluationPointForHop(h) === null || !predicate.evaluationPoints.includes(evaluationPointForHop(h))) continue;
        if (h.reReadState === undefined || h.reReadState === null) continue;
        const set = predicate.assertionSets.find((s) => s.id === firing.assertionSetId);
        if (set && evaluateAssertionSet(set, h.reReadState).holds) {
          predicateRepaired = { repairedAtHopId: h.id, assertionSetId: firing.assertionSetId, note: 'Firing assertion set holds again after the break — repair evidence (Batch 218 §6)' };
          break;
        }
      }
    }
    flagEvent = {
      trajectoryId: input.trajectoryId,
      predicateId: predicate.id,
      predicateSpecVersion: predicate.specVersion,
      firingForm: firing.form,
      ...(firing.form === 'A' || firing.form === 'B' ? { assertionSetId: firing.assertionSetId } : {}),
      ...(firing.form === 'C' ? { acceptEventId: firing.acceptEventId } : {}),
      firingHopId: firing.firingHopId,
      postFiringHopIds,
      postFiringHopCount: postFiringHopIds.length,
      predicateBroken,
      labelGrade: LABEL_GRADE,
    };
  }

  const runEnding = classifyRunEnding({ predicateFired: fired, endingKind: input.runEnding && input.runEnding.endingKind });
  const unaware = flagEvent ? terminationUnaware(flagEvent) : null;

  return {
    trajectoryId: input.trajectoryId,
    routineId: predicate.routineId,
    measurable: true,
    predicateId: predicate.id,
    predicateSpecVersion: predicate.specVersion,
    fired,
    firing,
    flagEvent,
    terminationUnawareness: flagEvent ? (unaware.unaware ? 'termination-unaware' : 'aware') : 'predicate-declared-but-never-fired',
    postFiringHopCount: flagEvent ? flagEvent.postFiringHopCount : 0,
    runEnding,
    modelDeclaredDone,
    uncorrectedFinal,
    partialPredicateStates,
    predicateBroken,
    predicateRepaired,
    postBreakHopIds,
    excludedFinalizeHopIds,
    formDiagnostics,
    verdict: !fired
      ? 'Predicate declared but never fired in this trajectory — no termination flag (Batch 218)'
      : flagEvent.postFiringHopCount >= TERMINATION_THRESHOLD
        ? `Termination flag: ${flagEvent.postFiringHopCount} non-final hop(s) after the completion predicate fired (diagnostic threshold 1, Batch 218)`
        : 'Predicate fired; no non-final hop after firing — no termination flag (Batch 218)',
  };
}

module.exports = {
  PREDICATE_SPEC_VERSION,
  VERIFIED_SUCCESS,
  LABEL_GRADE,
  TERMINATION_THRESHOLD,
  FORMS,
  FORM_NAMES,
  EVALUATION_POINTS,
  RUN_ENDINGS,
  OPERATORS,
  FLAG_FIELDS,
  deriveObservationStatus,
  isVerifiedSuccess,
  hopObservationStatus,
  isCommitHop,
  isFinalizeHop,
  evaluationPointForHop,
  assertLedgerOnly,
  refuseLiveIntervention,
  validatePredicateDeclaration,
  declarePredicate,
  evaluateAssertion,
  evaluateAssertionSet,
  uncoveredFields,
  assertMeasurable,
  reReadableAssertionShare,
  predicateDeclaredShare,
  reportRoutineStats,
  evaluateAt,
  evaluationCostReport,
  evaluateFormA,
  evaluateFormB,
  evaluateFormC,
  classifyRunEnding,
  validateFlagEvent,
  gradeFlagEvent,
  terminationUnaware,
  evaluateTrajectory,
};
