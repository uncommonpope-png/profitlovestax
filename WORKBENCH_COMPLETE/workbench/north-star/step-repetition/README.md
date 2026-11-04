# Step-repetition flag — Batch 216 (Build Round 15)

LEDGER-ONLY diagnostic. Nothing here aborts, discards, blocks, reorders, or
forces any live tool call, and nothing here is a live gate. It is NOT hooked
into `server.ts` or the audit-wire live hook as a gate; audit/log use only.

## Firing rule (diagnostic, count = 2)

Hop H fires iff ALL of: (a) H's Batch 10 normalized call equals a prior hop P
in the SAME trajectory; (b) P's observation status = verified-success
(schema-valid + non-conflicting + value present, derived by
`deriveObservationStatus` — never "returned 200", never plan-executor `ok`);
(c) no intervening hop strictly between P and H is a write whose effect
footprint intersects any of H's inputs; (d) H is not covered by a declared
polling exemption. Distance H−P is recorded, not thresholded.

## Comparison answers (measured against the repo at build time)

- **Observation status — NOT distinguished in the shipped ledger.** The
  ledger records observations as `{status: 'ok'|'error'}` (`ok` = merely
  returned) and round 14's `stepRepetitionFlag214` only string-compares a
  caller-supplied `'verified-success'`. This module supplies the strict
  three-component derivation and accepts only that exact value; it never
  infers verified-success from a bare return. Until the live ledger emits
  derived status per hop, offline callers must pass the derived value.
  Condition (b) is implemented as written, not weakened.
- **Read-set coverage — 0%.** No tool definition in the repo declares a
  read set (no tool registry exists at all), far below Batch 216's ~50%
  falsifier line. The flag's rule-grade reading therefore FAILS on the repo
  as it stands: every flag on an undeclared tool is guard-unknown, graded
  below rule-grade, and any routine >50% guard-unknown reports
  "unmeasured, not zero" (`reportRoutineGuardUnknown`). Read-set
  declarations must be prioritized over any flag wiring; this module does
  NOT claim rule-grade precision the repo cannot support.

## Four divergences from Pydantic AI Harness DetectLoops

1. Identity = Batch 10 normalized call (casefold / number tolerance / date
   parse / enum alias / documented default / ignored-only-if-effect-free,
   permutation-invariant, multiset for parallel calls, ReWOO variables
   resolved before comparison), NOT canonical JSON. Flags record
   normalization-spec version `v1` alongside the hash; v1 vs v2 flags are
   not comparable (`flagsComparable`).
2. Prior must be verified-success only. Repeat after error is a retry
   (`retryCandidates`), never step-repetition.
3. NO same-result requirement. `repeat-same-result` and
   `repeat-changed-result` are separate sub-types, counted separately,
   never merged. A changed result with no logged write is itself
   diagnostic (external change, nondeterminism, or missed write).
4. LEDGER-ONLY. No nudge, error, handler, or live threshold; Pydantic's
   5/3 thresholds are NOT adopted. `refuseLiveIntervention` throws on any
   such attempt, including auto-skipping a repeated write (destructive).

## Sub-types and exclusions

- `write-repeat`: H itself a write equal to a verified-success prior write.
  The prior write is NOT an intervening write. No auto-skip is specified.
- Parallel duplicates in the SAME response are NOT this flag (no verified
  prior yet) — separate `duplicate-in-batch` anomaly with its own count.
- Alternating A-B-A-B = two flags (A repeats, B repeats), unless a write
  intersects inputs. No separate alternating pattern for the ledger.
- Polling exemption is DECLARED-ONLY (tool marked pollable, or a routine
  declaration with a bounded budget: max polls + backoff). Inferred intent
  is never an exemption. An exempt poll exceeding its budget fires a
  separate `poll-budget-exceeded` event, not this flag.

## Guard honesty clause

H's inputs = the tool's declared read set. No declared read set → guard =
`unknown-undeclared`, not "no write". The flag is still emitted but graded
below rule-grade; offline reporting must carry guard-unknown share.

## Flag event fields (all required for rule-grade)

trajectoryId, hopId, priorHopId, normalizedCallHash,
normalizationSpecVersion, priorObservationStatus (must be verified-success
— counting any other value is a spec violation, see
`countSpecViolations`), guardResult (`none` / `unrelated-write` /
`intersecting-write-exempt` / `unknown-undeclared` — the exempt value
appears on `guardExemptCandidates`, never on an emitted flag),
subType, distance, pollExemptionStatus, labelGrade (`new-flag`).
Missing any field downgrades the event to judge-grade (`gradeFlagEvent` /
`validateFlagEvent`).

## Honest limits

- Free-text args with no declared rule are compared exact-trimmed:
  synonyms do NOT merge. No embedding/NLI fallback is implemented here
  (that would need a model); the limit is exact comparison, never silent
  merging.
- Number tolerance is quantized into buckets for hashing; values
  straddling a bucket edge do not merge. Tolerance is a quantization, not
  exact interval equality.
- Result comparison for non-write hops needs both results present; an
  absent result is recorded as `resultComparison: 'unknown'` and must be
  counted separately by the offline pass, not read as changed-result
  evidence.
- This module does NOT replace round 14's `normalizeCall214` /
  `stepRepetitionFlag214` (sorted-keys + trim stub, left untouched).
  It implements the full Batch 216 spec alongside it.
- Not wired anywhere live. The remaining Batch 214 specs (completion
  predicate, drift metric, provenance source-field refinement), the
  advisory-hint pilot execution, the PC-side product-path audit, live wire
  observation on the PC tree, and OATR re-run #11 are still owed.

## Run

`node step-repetition.test.cjs` — 26 tests, all passing at build time
(306 pre-existing + 26 new = 332 total across the north-star suites).
