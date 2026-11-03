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
verifier 47/47, plan-executor 47/47, provenance 19/19, interceptors 45/45 —
**158 pass, 0 fail** (round 1: 109; round 2 adds 33: plan-executor +14,
interceptors +19; round 3 adds 5: interceptors +5; round 4 adds 11:
plan-executor +11).

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

### plan-executor/ — level-wise plan executor (Batches 169, 171, 173, 175, 177, 179, 192)
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

## Round 2 (Batches 179, 181, 184, 186, 188) — deltas only, round-1 code extended not rewritten

### plan-executor/ — Batch 179: per-mode T_stuck + abort-provability audit
Per-mode T_stuck for dispatch-observable modes only (own frozen p95/p99/
version per mode; n floors per mode: <100 = no threshold, 100–999 = 2×p95
only, ≥1000 = max(2×p95, p99)); post-hoc mode labels refused; unobservable-
mode tools keep one pooled baseline at max(2×pooled p95, pooled p99) with a
mode-split investigation (never a blind raise) on a rescue-rate trip;
mode-share shifts >20% are drift signals that never re-freeze a baseline to
absorb them. Abortable three-state field (UNKNOWN → DECLARED → PROVEN /
DISPROVEN, disproof sticky) with hard / cooperative / protocol provability
classes; protocol proof is negative-only and suffices for read-only tools
alone; gate 3 now reads "abortable = PROVEN, class-appropriate proof".

### interceptors/ — Batches 181, 184, 186, 188: cancellation audit chapter
Cancellation triple verified against spec text (SHOULD stop/free/not-respond,
MAY ignore unknown/completed/uncancellable, SHOULD ignore late responses;
MUST-not-respond quoted only from the transport page). Stateless revision:
server-sent cancellation is subscription-teardown only; session channels
gone; per-request cancel only; stdio pools across eras, HTTP does not.
Audit entries carry (era, transport, signal form, mode, W formula, baseline
version). Stdio W = frozen p99 (n≥1000) else 2× frozen p95; truncated
observations stay inconclusive, never shortened; negative proof needs ≥3
silences; late-after-W demotes without disproving; ≥2 late responses in a
proof set revert to DECLARED; positive disproof only via attributed side
effect. 2026 HTTP: observation is "no side effect within W"; read-only =
PROVEN-client-abandonment, never server-stopped. Signal form unified to
single-valued "POST abort" (response form unknowable at cancel time). JSON
server-obligation is plausible-but-unscoped MUST-treat-disconnect, NOT a
verbatim rule; TS SDK v2 exchange-cancel is mechanism-documented
(runtime-conditioned, typedoc not source lines); Node row resolved via
toNodeHandler res-close synthesis (plain/Express/Fastify) with Hono
runtime-dependent and unverified; hand-wired toWebRequest callers must be
audited for a missing signal. JSON thread CLOSED except spec wording;
timing still NOT-GUARANTEED.

## Round 3 (Batch 190) — delta only, round-1/2 code extended not rewritten

### interceptors/ — Batch 190: Hono row resolved, modern-leg table complete
Hono on Node via `@hono/node-server` serve(): signal present but LAZY —
the serve path hands routes a pseudo-Request (`Object.create
(requestPrototype)`, no controller at construction) and `.signal` is a
lazy prototype getter (first access creates the controller; a reason
recorded before first access immediately aborts it). Disconnect wiring
is on the RESPONSE, not the request: ServerResponse `close` on
premature close only (incoming error → abort with the error string;
`!writableFinished` → 'Client connection prematurely closed.'; HTTP/2
`incoming.aborted` branch; normally finished → no abort). The
separate real-Request builder in `src/request.ts` is a different claim
and must not be conflated with the serve path. Convergence named:
BOTH Node adapters examined (MCP SDK `toNodeHandler`, Batch 188; Hono
node-server, Batch 190) fire off response close — res-close is the
de-facto Node disconnect observable, future adapter audits check
response-close first; shapes differ (eager vs lazy), trigger does not.
An MCP handler mounted under Hono registers teardown on
`Request.signal`, and that access creates the controller, so wiring
works. Hono sub-question CLOSED (re-open only on a new
`@hono/node-server` version changing listener/request wiring).
Honest limits kept in code and interceptors README: main-branch source
(version 2.1.6 as read Nov 2, 2026), NOT a pinned published release;
no live disconnect measured; half-open socket edge unmeasured (same
as Batch 188).

## Round 4 (Batch 192) — delta only, round-1/2/3 code extended not rewritten

### plan-executor/ — Batch 192: ModeX-Lite transfer correction, disputed-hop prefix tier
Token intervals do NOT transfer: ModeX-Lite's T=100 interval fires zero
times on a schema-guided tool call finishing before 100 tokens, §5.1
robustness covers T in {100..500} on long trajectories only, and
Lite-vs-full is mixed by model/task — a Lite tier must be measured on
the bundled base, never assumed. Interval unit replaced by structural
checkpoints C0 (tool-name closure), C1 (parameter-name-set closure),
C2 (value-prefix / complete call), with parsed-prefix adjacency
(partial-JSON parser, parse-only, never execution; unclosed fields
UNKNOWN, not zero) instead of lexical Jaccard. Diversity-preserving
prune rule: prune ONLY WITHIN a cluster, NEVER across clusters; a
minority tool cluster is never pruned on modal grounds; cross-cluster
modal selection happens ONLY at completion via Batch 169's
`modalSelect()`; ModeX §7 mode-collapse under early pruning is
irreversible deletion. Two invariants enforced: GAP siblings refused
(`hopId` mismatch throws — pruning runs per hop, independently per
hop), and pruning does NOT repeal Batch 5's sampling-tax gate
(disputed/high-stakes hops only). Calibration split: full-call vs
prefix conductance thresholds are separate, never merged; no prefix
threshold constant is set. Falsifier harness (`falsifierReplay()`)
reports agreement rate, prune regret, and tokens saved per hop per
checkpoint, plus the tool-call token-length distribution (proxy
tokens); adoption requires regret ≈ 0 AND monotone agreement
C0→C1→C2. HONEST LIMIT: the harness is proven on synthetic fixtures
only — NOT the design. No real logged disputed hops exist yet, no
fixture number is a finding, parser cost is unmeasured, and the
Chen / Sun / Hong leads were not read in full and are not cited or
built on. Full-call `modalSelect()` untouched.

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
