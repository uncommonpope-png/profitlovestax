# Completion predicate — Batch 218 (Build Round 16)

LEDGER-ONLY diagnostic. Nothing here aborts, discards, blocks, reorders, or
forces any live tool call, and nothing here is a live gate. It is NOT hooked
into `server.ts` or the audit-wire live hook as a gate; audit/log use only.
NO live finalize nudge is specified in this round (Batch 214) and none is
built — `refuseLiveIntervention` throws on any finalize-nudge attempt.

## What it is

The second of Batch 214's four owed specs, and the (a) half of Batch 214's
two-column framing for "termination unawareness": (a) a per-routine
completion predicate — tool-verified outcome present, or final-state
predicate, or person acceptance, whichever the routine declares; (b) the
flag itself: any non-final hop after the predicate fired. Round 14's
`terminationFlag214` (plan-executor) is a stub — it takes a
caller-supplied firing hop and checks nothing about the predicate. This
module implements the full Batch 218 spec alongside it; the stub is left
untouched.

## Predicate declaration (all fields required for rule-grade)

`declarePredicate` throws on any violation — missing fields are never
silently defaulted. Required: predicate id; routine id; form set (OR
across forms, AND within a form's required assertion set);
assertion set(s); state readers (tools + read sets); acceptance channel
(when Form C is declared: which explicit signal counts, from the person);
evaluation points (after commit hops and after final hops ONLY);
predicate-spec version (`v1`). A routine may declare acceptance as its
SOLE form (purely presentational routines), but then the spec must say
so explicitly (`acceptanceOnly: true`), and the offline pass reports the
acceptance-only share separately (`reportRoutineStats`).

## The three forms

- **Form A — tool-verified outcome.** Fires at hop H iff H is a commit hop
  (write or final) with observation status verified-success — derived
  exactly as round 15 derives it (schema-valid + non-conflicting + value
  present, NEVER merely "returned 200") — AND at least one declared A
  assertion set holds in full against the VERIFIER RE-READ state (never
  the tool's response claim), AND H's effect footprint intersects that
  set's fields (attribution). If the tool cannot be re-read
  (fire-and-forget, no read-back), Form A is UNAVAILABLE for that
  outcome — the response is never promoted by relabeling.
- **Form B — final-state outcome predicate.** Fires at an evaluation point
  iff ALL required assertions in one declared assertion set hold against
  a SINGLE snapshot of re-read state (simultaneous, not accumulated
  across time). Multi-goal routines declare the conjunction explicitly
  in one set. Partial completion logs as partial-predicate state but
  does NOT fire and does NOT excuse post-firing hops. Field-level
  assertions only (tau2-bench assertion-function spirit) — a full-state
  hash predicate throws at declaration.
- **Form C — person acceptance.** Fires ONLY on an explicit accept event
  for this routine's outcome (confirm button, "yes that's right,"
  acceptance in the routine's channel), with the accept event's target
  identified, its origin the person (never the model), and (when both
  present) its channel matching the declared channel. Uncorrected
  continuation logs as its own uncorrected-final event, NEVER as a
  firing.

## Four deliberate divergences (encoded + tested)

1. **Model text is NEVER proof.** "done" / "TERMINATE" logs a
   `model-declared-done` event compared against the predicate (fired =
   consistent, unfired = premature-finalization candidate). The
   declaration never fires the predicate and never excuses later hops.
2. **Harness stops are NOT completion.** Three distinct run endings,
   never two: `completed-by-predicate`, `stopped-by-harness`
   (cap/timeout/budget, predicate unfired), `abandoned` (person
   interrupt, unrecovered error, external stop). Termination
   unawareness is defined ONLY against predicate firing. No ending
   information yields `unknown`, never a completion.
3. **Full-state equality rejected** — field-level assertions per Form B.
4. **Silence is NOT acceptance** — see Form C.

## Latching + undo

Once fired, the predicate STAYS fired for that trajectory. A post-firing
hop that changes outcome state so the firing assertion set no longer
holds logs a separate `predicate-broken` event (breaking hop id, broken
assertion(s), prior firing hop) — NOT "predicate never fired". Hops
after firing but before any break are termination-unaware; hops after a
break count separately (`postBreakHopIds`), never merged into the
termination rate. If the firing set holds again at a later evaluation
point, that is recorded as repair evidence (`predicateRepaired`); repair
vs self-undoing is never inferred from a hop alone.

## Termination flag event fields (all required for rule-grade)

trajectoryId, predicateId + predicateSpecVersion, firingForm (A/B/C,
assertionSetId for A/B, acceptEventId for C), firingHopId, each
post-firing hop id (non-final hops after firing, EXCLUDING the
finalize/final-answer hop itself — that is the expected next hop, not a
flag; excluded finalize hops are listed separately as
`excludedFinalizeHopIds`), postFiringHopCount, predicateBroken status
(none / broken + breaking hop id), labelGrade (`new-flag`). A routine
with NO declared predicate emits NO flag event and reports
termination-unawareness as "not measurable" — never zero.

## Diagnostic threshold = 1 (offline pass)

The first non-final hop after firing already flags the trajectory
(`terminationUnaware`). No live finalize nudge is specified or built.

## Evaluation-cost rule

Evaluate only at declared evaluation points, re-reading only assertion
fields, never whole state per hop (`evaluationCostReport`). Evaluating
at a non-declared point (e.g. after a read) throws
(`evaluateAt`). A predicate requiring full-state re-read per hop is a
spec defect, reported and refused at declaration, never wired.

## Falsifier findings (measured against the repo at build time)

- **Predicate-declared share: 0%.** No routine anywhere in the repo
  declares a completion predicate: the north-star modules carry no
  routine registry at all, the workbench has no per-routine predicate
  declarations, and round 14's stub only consumes a caller-supplied
  predicate. The termination diagnostic is therefore mostly "not
  measurable" on the repo as it stands — `predicateDeclaredShare`
  reports FAILED below a majority declared, and the flag must NOT be
  shipped as a rule on undeclared routines.
- **Re-readable-assertion share: undefined on the repo** (no predicates,
  no state readers), 0% wherever a predicate is declared without
  readers covering its fields. Per form, a set with any assertion field
  no declared reader can re-read is UNMEASURABLE (not false) for that
  form (`assertMeasurable` / `reReadableAssertionShare`). State-reader
  declarations must come before any flag wiring — the same conclusion
  round 15 reached for read sets.
- **Verified-success: NOT distinguished in the shipped ledger** (round 15
  finding, unchanged). Form A derives it strictly and never infers it
  from ok/200.

## Honest limits

- Form A attribution needs a declared effect footprint: a satisfying
  re-read with no footprint, or a footprint touching none of the
  asserted fields, does not fire. That is a deliberate strictness, not
  a gap to paper over.
- Break detection needs a fresh re-read at a later evaluation point: a
  post-firing hop with no re-read snapshot counts as a post-firing hop
  but cannot prove or disprove a break.
- Form C accepts an event with no channel when origin (person) and
  target are explicit; a channel mismatch (both present, differing)
  rejects. Channel-absent acceptance is documented leniency, not a
  hole: the firing still requires an explicit person accept with an
  identified target.
- This module does NOT replace round 14's `terminationFlag214` stub.
  It implements the full Batch 218 spec alongside it.
- Not wired anywhere live. The remaining Batch 214 specs (drift metric,
  provenance source-field refinement), the advisory-hint pilot
  execution, the PC-side product-path audit, live wire observation on
  the PC tree, and OATR re-run #11 are still owed.

## Run

`node completion-predicate.test.cjs` — 37 tests, all passing at build
time (332 pre-existing + 37 new = 369 total across the north-star
suites).
