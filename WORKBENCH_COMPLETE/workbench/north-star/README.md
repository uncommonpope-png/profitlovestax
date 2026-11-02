# North-star spec build — UNWIRED modules (branch: north-star-spec-build)

Built from the north-star research log (`goals/gsk-continuous-growth-seshat-cycles/
hidden_files/north-star-watch/seen.md`, batches 1–177+), on Craig's order to turn
the research into real code pushed to GitHub.

**Status: UNWIRED.** These modules are not imported by `server.ts`, not called by
the launcher, and not activated anywhere. They are product-candidate code: the
spec harnesses they port were spec executables, not the product verifier, and
that distinction is kept throughout (Batch 119/129 lesson). Nothing here claims
SEP-2484 conformance — host trust judgments are not protocol-observable
(Batch 117).

**How to run the tests** (Node, zero dependencies, plain `node`):
- `node WORKBENCH_COMPLETE/workbench/north-star/verifier/verifier.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/plan-executor/plan-executor.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/provenance/provenance.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/interceptors/interceptors.test.cjs`

Test totals, each re-run by the coordinator from the assembled branch location:
verifier 47/47, plan-executor 22/22, provenance 19/19, interceptors 21/21 —
**109 pass, 0 fail.**

## What each piece implements (mapped to batches)

### verifier/ — trust verifier core (traceability v2, Batches 118–126)
Trust records keyed ONLY on the full tuple (identifier, protocol revision,
revision string); absent revision string = initial revision, its own tuple, never
a wildcard; identifier-alone lookup rejected. One separate record per tuple with
a lineage pointer; predecessor byte-identical after successor creation.
Per-tuple calibration bindings refused under any other tuple. Known set comes
out of band only, never from the wire; refresh add enables, refresh removal
clears enablement. Unknown revision: extension NOT enabled, mismatch log with
full tuple; non-mandatory degrades to ungraded (marker end to end);
mandatory rejects with the mismatch reason and no effect. Tri-state
annotations (true / false / ABSENT); ABSENT refuses boolean coercion via
`toBoolean()` (JS has no `bool()` hook on objects — see verifier README).
Within-result union only, no cross-result propagation. Validation gate: only
`ValidatedAnnotation` objects consumable; failures drop to ungraded with a log.
Per-tuple opt-in, disabled by default, never bypassing validation. Stage
records separate from negotiation (source + source date; stale flagged).
Coexisting identifiers independent. Session taint segments keyed on the full
tuple; mid-session change closes with a break marker, old attributions frozen.

### plan-executor/ — level-wise plan executor (Batches 169, 171, 173, 175, 177)
DAG level computation (longest-path depth, siblings parallel). Level-wise
prefix accumulation: each level sees only completed levels' joint observation.
Replan ONLY at level/iteration boundaries on completed joint observation;
mid-level replan refused explicitly; committed state is a precondition;
emergency abort is a separate path that halts without replanning. RULE 6
read-only early-exit as a third path. Hedged reads for multi-path reads
only: 100 observations to enable, 400 for stable p95, 10% breaker only over
≥100 calls against a FROZEN baseline; never hedge commits/writes. Singleton
stuck-call rescue = abort-and-restart, never a parallel duplicate; threshold
max(2× frozen p95, p99 if n≥1000); gates (read-only+idempotent, zero
progress, true abort, single re-issue, budget fit); rescue-rate >2% trips
threshold to 3× p95. Baseline recalibration: weekly check, ≥100 new calls,
re-freeze only on 20% drift holding 2 windows or CUSUM alarm; downward
automatic, upward never while breaker tripped. ModeX modal selection with
the mode-collapse guardrail (exact-adjacency reduction, not full spectral
ModeX — see plan-executor README). Neither GAP nor ModeX classifies
uncertainty sources.

### provenance/ — provenance emission + classification (Batches 134–142, 149)
One namespaced `_meta` key `io.github.uncommonpope-png/provenance`,
versioned object with per-emitter sub-objects; bare keys rejected.
`attachProvenance` preserves `_meta` on isError results; thrown errors yield
an explicit host-unknown sidecar (they cannot carry `_meta` by SDK
construction). Per-result-source classification: own-box / own-account /
stranger / system, decided by the per-tool ultimate-source table and
Obsidian host-at-call-time (loopback = own-box, non-loopback = own-account,
unknown = "host unknown, default loopback assumed", flagged); tool name is a
routing hint only; unknown tools default to stranger; provenance captured
before slicing; redirect-to-localhost records the final URL.

### interceptors/ — SEP-2624 interceptor port (Batches 43, 132–133, 143–148)
Direction-based chain: sending = mutate (sequential, priorityHint-sorted) →
validate+observe (parallel) → send; receiving = receive → validate+observe →
mutate → process. Validation collects failures → -32602 + validationErrors[];
mutation failure halts → -32603 + lastValidPayload (chain-local atomicity).
Refusals enforced: third-party mutation ever, reliance on server-side
interceptors, third-party receiving observability on sensitive results.
Re-validate after receiving mutation; own-client audit trail only. Dual-signal
timeout: local deadline after every stage including final + code-keyed -32000
parsing (Go-style unwrapped deadline signals recognized too); timeoutMs
forwarded; timeout emits -32000. Gate-mode pinned active (audit promotion
refused; audit never a gate). valid=false blocks regardless of severity.
Audit logging of every invocation with PII redaction (by field name),
resolved mode, failOpen, source; failOpen false on gates. Methods
`interceptors/list` + `interceptor/invoke` (SEP's mixed spelling);
`executeChain` is NOT a method and is rejected.

## Out of scope (watch/citation-only — NOT built, correctly)
Fork PR watch (Degiorgio#3 / upstream #2624 two-step trigger), OATR
registry post-expiry checks, WAG/SEP watch items, SEP-1913 successor watch,
grammar/backend-sampling probes (Batches 82–108, 100–108), TTS/Anthropic
route traces (Batches 95–98) — these are observations and watch triggers,
not code, and no code was built for them.

## Honest limits — what remains owed
- **Main merge awaits Craig's word alone.** This branch is NOT merged.
- **PC-side product-path audit** (Batch 129/134): no product gate path has
  been checked against these modules on the PC tree.
- **Live wire observation of `exec.result._meta` on the PC tree** (Batches
  142/149): the emission/read functions exist here, but the PC path is
  unproven. Do not claim it works.
- **Runtime cross-SDK conformance test** (per (consumer, server) pair
  through the actual chain): not run; no C# or Go implementation tested.
- **Datamark prototype** (Batch 32, first in the rendering queue): not built.
- **Known-set refresh UX, trust-table specification, brokered-handle
  verification design, grammar-build prototype measurements, abstention-branch
  design, small-model retry experiment**: specified in the log, not built here.
- **No live latency data**: plan-executor audit fields are recorded, but no
  real tool timing has been collected; no model/tool integration.
- **No wiring**: nothing here is imported by the workbench, launcher, or any
  server. Activation is a separate decision.
- Test fixtures in `interceptors.test.cjs` use obvious dummy placeholders
  (`'hunter2'`, `'sk-123'`) as redaction fixtures only — no real secrets.
