# Trust verifier core — traceability rules V-T01..V-T17

Node.js (CommonJS, zero dependencies, plain `node`). A product-candidate
module porting the batch119–126 Python spec harnesses into one coherent
implementation. Rule text in
`goals/gsk-continuous-growth-seshat-cycles/hidden_files/north-star-watch/batch128-traceability-v2/verifier-traceability-v2.yaml`
is authoritative; where any harness and the rule text disagree, the rule
text wins.

## Run

```sh
node verifier.test.cjs
```

## What it implements

- **Tuple keying, always full.** Every record, calibration, opt-in,
  known-set entry, stage decision, and taint segment is keyed on
  `(identifier, protocol revision, revision string)`. An absent revision
  string (`null`) is the initial revision — its own tuple, never a
  wildcard. Lookup by identifier alone throws instead of resolving to a
  default.
- **One separate trust record per tuple**, with a same-identifier lineage
  pointer to the predecessor. Creating a successor never mutates the
  predecessor (its canonical snapshot is byte-identical before/after).
  No merged history field exists on any record.
- **Calibrations bound to their tuple** (`threshold` / `probe` / `adapter`
  / `other`). Loading under any other tuple — different identifier,
  protocol revision, or revision string — is refused, and bindings are
  immutable (re-attach to the same tuple is idempotent).
- **Unknown revisions fail closed.** The extension is not enabled and the
  mismatch log carries the full received tuple plus known-set provenance.
  Non-mandatory calls degrade to ungraded (marker carried end to end,
  annotation never consumable as trusted); mandatory calls reject with
  `revision-mismatch` and no tool effect (fail-before-effect). The
  `mandatory` flag must be an explicit boolean.
- **Known set out of band only.** Negotiation never mutates it; only an
  explicit `refresh()` replaces it, clearing prior enablement. A refresh
  that adds a tuple enables it on re-negotiation; one that removes a
  tuple fails closed. New tuples under a stale set fail closed.
- **Tri-state annotations.** `true` / `false` / `ABSENT` are three distinct
  states. `ABSENT` is a singleton; `toBoolean(ABSENT)` throws, and gate
  helpers permit trusted / not-sensitive handling only on an explicit
  `false`. Unannotated results route to ungraded, never "clean" — the
  gate emits no clean verdict at all.
- **Within-result union only.** A result-level `true` stays `true` after
  any block annotation; a block `true` makes that block `true`; absent
  is neutral. No cross-result propagation, no write-back into the
  result-level flag.
- **Validation gate (V-T11).** Gates accept only `ValidatedAnnotation`
  objects from `validate()`; raw dicts throw `TypeError`. Unknown fields
  fail the whole unit, non-boolean values (including `1`) fail, a
  malformed tuple fails every unit, and validation is per unit (a block
  failure drops only that block). A failed unit never feeds a gate
  decision in any direction.
- **Per-tuple opt-in, disabled by default.** Enablement requires known
  AND opted-in. Opt-in never bypasses validation. `auditOptIn()` reports
  enabled-without-opt-in as a warning, never an exception.
- **Stage kept separately from negotiation.** `decide()` reads only
  identifier / protocol revision / revision string from a payload — never
  `stage`, `lifecycle`, `maturity`, `extension_stage`, and never nested
  stage-looking data. No record means stage-unknown, never a default
  stage. `isStale()` flags a decision whose record was removed, changed
  stage, or moved to a newer source date.
- **Stage semantics audit (SHOULD → warnings).** Experimental handling
  without a pin warns; Beta breaking changes without a changelog entry
  or announcement warn; Stable behaviour changing within one protocol
  revision warns (and the warning is never overwritten away).
- **Coexisting identifiers are distinct extensions.** Independent trust
  state, per-identifier history only, cross-identifier lineage rejected,
  no shared calibrations.
- **Session taint segments keyed on the full tuple.** A mid-session tuple
  change closes the segment (frozen — later attributions to it throw)
  and opens a new one with a break marker; the new segment starts empty.
  An equal tuple is a no-op. A segment record without a complete tuple
  is a store-integrity error.
- **Prompt audit (SHOULD → warnings).** A prompt is clean only if the
  next non-note event is a destructive/open-world action that relied on
  the degraded extension. Blanket, misplaced, and dangling prompts warn;
  unprompted actions and non-prompt markers are not violations.

## Rule-to-batch mapping

| Rule | Level | Spec harness batch |
| ---- | ----- | ------------------ |
| V-T01 tuple keying | MUST | 126 (CHECK-T01; identifier-alone rejection re-asserted from 125) |
| V-T02 separate record + lineage | MUST | 126 (CHECK-T02) |
| V-T03 calibrations bound to tuple | MUST | 126 (CHECK-T03) |
| V-T04 unknown revision not enabled | MUST | 119 (CHECK-T04); known-set refresh rules auxiliary, batch 120 |
| V-T05 degrade to ungraded | MUST | 121 (CHECK-T05) |
| V-T06 mandatory reject, no effect | MUST | 121 (CHECK-T06) |
| V-T07 prompt only at destructive/open-world boundary | SHOULD (warnings) | 122 (CHECK-T07) |
| V-T08 unannotated = ungraded | MUST | 119 (CHECK-T08) |
| V-T09 absence = no claim, never false | MUST | 119 (CHECK-T09) |
| V-T10 within-result union | MUST | 122 (CHECK-T10) |
| V-T11 validate before any gate consumes | MUST | 123 (CHECK-T11) |
| V-T12 disabled by default, opt-in per tuple | SHOULD (warnings) | 123 (CHECK-T12) |
| V-T13 stage never from negotiation | MUST | 124 (CHECK-T13) |
| V-T14 stage semantics | SHOULD (warnings) | 124 (CHECK-T14) |
| V-T15 coexisting identifiers distinct | MUST | 125 (CHECK-T15) |
| V-T16 taint segments carry the tuple | MUST | 125 (CHECK-T16) |
| V-T17 mid-session change closes segment | MUST | 125 (CHECK-T17) |

## Design decisions (not rule text, labelled as such in code)

- Enablement requires known AND opted-in (the harnesses checked each gate
  separately; the product needs both, and either failing keeps the
  annotation out of gate decisions).
- `Verifier` and `TrustStore` stay separate classes, as in the harnesses:
  negotiation/enablement/calls vs. per-tuple records/calibrations.
- Calibration binding immutability, duplicate-tuple rejection, and
  dangling-lineage rejection follow batch 126's stated design decisions.
- `auditOptIn()` accepts explicit sets so the violation shape is testable
  without a backdoor that forges enablement.

## Honest limits — what this is NOT

- **This is a product-candidate module, NOT the wired product verifier.**
  No product gate path has been checked against it and no MCP extension
  has been negotiated on the wire. That product-path audit is still owed.
- **No SEP-2484 conformance is claimed.** Per batch 117, host trust
  judgments are not protocol-observable, so they can never be
  SEP-conformance-tested.
- **JS cannot make `if (ABSENT)` throw.** Python's `bool(ABSENT)` raises
  via `__bool__`; JavaScript's `ToBoolean` on any object is `true` with
  no hook. The throwing equivalent here is `toBoolean()` and the gate
  helpers, and gate consumption is restricted to `ValidatedAnnotation`
  objects — but a caller that tests a raw tri-state value with `if`
  directly has bypassed the API, and the module cannot intercept that.
- **The T07 auditor trusts the caller's `reliedOnDegraded` flag**, and
  the T12 audit trusts the verifier's own opt-in record — a gate that
  mislabels either would evade the check. Both are product-path audit
  questions, not things this module closes.
- **Validation checks shape, not truth.** A stranger server can send a
  well-formed lie; that is what a trust table, footprint verifier, and
  audit trail are for, not V-T11.
- **Beta/Experimental revision-increment gap (batch 120, spec gap).** A
  peer that breaks behaviour without incrementing `revision` is
  indistinguishable on the wire from the old revision. No known-set rule
  fixes that; only Tier-3 observation mitigates it, and it is not
  implemented here.
