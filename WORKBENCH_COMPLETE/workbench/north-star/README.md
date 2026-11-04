# North-star spec build — UNWIRED modules (branch: north-star-spec-build)

Built from the north-star research log (`goals/gsk-continuous-growth-seshat-cycles/
hidden_files/north-star-watch/seen.md`, batches 1–177+), on Craig's order to turn
the research into real code pushed to GitHub.

**Status: UNWIRED, except Wire Round 1 (audit mode only — see below).** The
spec modules are not imported by `server.ts`, not called by the launcher, and
not activated anywhere, EXCEPT the audit-only wire described in the next
section, which observes and logs but gates nothing. They are product-candidate
code: the spec harnesses they port were spec executables, not the product
verifier, and that distinction is kept throughout (Batch 119/129 lesson).
Nothing here claims SEP-2484 conformance — host trust judgments are not
protocol-observable (Batch 117).

## Wire Round 1 — audit-wire (branch: north-star-wire-1) — AUDIT MODE ONLY

`north-star/audit-wire.cjs` (+ `audit-wire.test.cjs`) is the first, narrow
wire of the spec modules into the workbench, and it changes NO live behavior:

- **Env-gated, default OFF.** `server.ts` loads `north-star/audit-wire.cjs`
  only when `NORTHSTAR_AUDIT_WIRE === '1'` (fail-open lazy load in
  `answerZeroKeyBaseline`, same style as the soul-preamble load). When the
  flag is off, no audit code loads at all.
- **Log-only hook.** In the local tool path's `runOne` (the one inside
  `answerZeroKeyBaseline`), AFTER `out` is computed and BEFORE it is
  formatted into `toolOutputs`, the seam calls `auditToolResult(tName,
  tArgs, out)` inside its own try/catch, DISCARDS the return value, and
  never touches `out` or `toolOutputs`. The returned string is identical
  with the wire on or off (tested, including deep-frozen input).
- **Honest module use.** Provenance ALWAYS runs (classification + the
  `_meta` object that WOULD be emitted under the single namespaced key
  `io.github.uncommonpope-png/provenance`, on a copy inside the audit
  record only, never on the live result). The verifier runs ONLY with a
  caller-supplied trust tuple — local calls carry none, so it is honestly
  skipped, never invented; a supplied tuple gets shape validation only, no
  trust verdict. The plan-executor runs ADVISORY only (one-node plan level
  computation, labelled advisory). `auditToolResult` never throws and
  never mutates its input; the audit log is in-memory only (no file
  writes, no network).
- **Deliberately NOT wired:** the live gate (nothing here aborts, discards,
  blocks, reorders, or forces any tool call, and no live-gate intervention
  has been measured), the seat, the launcher, and all Phase 1 files. The
  second `runOne` elsewhere in `server.ts` is a different path and was NOT
  wired. The honest limits below still stand: UNWIRED live gate, PC-side
  observations still owed.

**Test totals re-run from the assembled branch location (plain `node`):**
verifier 47/47, plan-executor 184/184, provenance 19/19, interceptors 45/45,
audit-wire 11/11 — **306 pass, 0 fail** (295 existing preserved + 11 new).

**How to run the tests** (Node, zero dependencies, plain `node`):
- `node WORKBENCH_COMPLETE/workbench/north-star/verifier/verifier.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/plan-executor/plan-executor.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/provenance/provenance.test.cjs`
- `node WORKBENCH_COMPLETE/workbench/north-star/interceptors/interceptors.test.cjs`

Test totals, each re-run by the coordinator from the assembled branch location:
verifier 47/47, plan-executor 59/59, provenance 19/19, interceptors 45/45 —
**170 pass, 0 fail** (round 1: 109; round 2 adds 33: plan-executor +14,
interceptors +19; round 3 adds 5: interceptors +5; round 4 adds 11:
plan-executor +11; round 5 adds 12: plan-executor +12).

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

### plan-executor/ — level-wise plan executor (Batches 169, 171, 173, 175, 177, 179, 192, 194)
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

## Round 5 (Batch 194) — delta only, round-1/2/3/4 code extended not rewritten

### plan-executor/ — Batch 194: Chen advisory-only Select constraint
CORRECTION 1, the main constraint: Batch 3's Select step must NOT be
constrained rescoring / teacher-forced name selection. At AST level
that protocol loses −19.1 pts pooled to free generation, and even
forcing the GOLD name scores below free generation per model
(0.24/0.44/0.55 vs 0.28/0.67/0.77). The only Select behavior is a soft
advisory hint into a FREE generation of the whole call (pooled AST
+1.8, McNemar p=0.06, n.s. — at-worst-neutral, never a deployment
win), or a gated dispute-tier re-check that re-generates freely with
the hint; any forced-prefix spec throws. CORRECTION 2: on 198 real
BFCL live_multiple failures, per-candidate attention argmax points to
the gold tool on 80% (per-model 0.71/0.86/0.80) vs 21% chance —
failure at the readout, not the harness — so the wrong-tool budget
goes to readout-side mechanisms and counterfactual-trace logging for
the sleep job, never to harness reordering (18.2%) or duplication
(16.7%, bound ≤23%). The attention-segment selector is SINGLE-HOP
ONLY: its +11.9 BFCL / +14.9 Seal-Tools gains are name-only,
single-call results (quoting them as end-to-end call-accuracy gain is
a misquote) and it loses −27 pts multi-turn on the τ-bench probe
(gate AUROC 0.48/0.73), so multi-turn use is refused until
re-validated in a real loop. Eager-attention deployment constraint:
HAA needs HuggingFace eager attention with output_attentions on;
vLLM cannot expose attention weights, so the bundled runner must
serve a disputed hop in eager mode (a separate slow path) or forgo
attention-segment signals entirely, and the 1.2× selector cost is
against an eager baseline, never against a FlashAttention/vLLM path.
Selector and ModeX are alternatives for a disputed hop, not votes —
the panel-vote variant loses 32 points, and no vote/ensemble path
exists. Steering fixes WHICH function is named, never its arguments.
Round 4's C0/C1/C2 diversity-preserving prefix tier STANDS untouched;
the advisory hint never deletes a tool identity, so prune → hint →
free generation compose. HONEST LIMIT: every Chen figure is the
paper's on its benchmarks (main text only — appendix tables were not
re-read, so no appendix-only number is quoted), NOT on the
north-star tool pool or the bundled base; no live model run, no
attention measured, no product gate verified.

## Round 6 (Batch 197) — delta only, round-1/2/3/4/5 code extended not rewritten

### plan-executor/ — Batch 197: advisory-hint test design, pre-registered

The disputed-hop tier now has a testable entry gate, not just a
mechanism: no advisory ships on a 20-task falsifier, no AST claim
ships on a 100-task pilot, and no loop claim ships without M2's
final-state delta. Three arms, same task, same model, greedy:
(F) free generation, (A-rec) advisory with the Batch 3 Plan-top1
recommendation (one model, two prompts, BM25 K=15, logprob-margin
gated — no attention, vLLM-compatible, the deployable path),
(A-gold) advisory with the GOLD tool name — the ceiling arm Chen
lacks, and the diagnostic that makes the test interpretable: if
A-gold AST ≤ free AST, the DELIVERY is neutral/harmful and
recommendation work is moot; if A-gold helps but A-rec does not,
the RECOMMENDATION is the bottleneck. Chen's S2 attention selector
is a secondary LAB arm only (eager HF, cost vs an eager baseline),
and every verdict line must name which arm was run. Gold is frozen
before the test from the Batch 4 audit trail (schema-valid,
executed, person-accepted or uncorrected), never derived from a
hint-arm output; at least one-third confusable tasks and three
routines, or the test has no headroom and its thresholds do not
transfer. Scoring is AST-first with decomposition (name accuracy,
argument accuracy conditional on correct name, valid@1, ExecRate,
hint-follow and hint-override rates): name up with AST flat IS
Chen's scope result reproduced, verdict "name-only," never
"partial win." Hint wording is fixed verbatim (Chen publishes
none) and arguments are never included. Multi-turn: M1 embedded
single-hop, M2 full dependent episodes, final-state verdict rule —
turn-1 positive but final-state ≤ 0 FAILS for loop use even if
single-hop passes; Chen's last-token-margin gate is banned in
multi-turn. HONEST LIMIT: pre-registered design only — nothing
executed, no personal-task AST number exists; the pilot-first
ordering (pilot, then M1/M2) is part of the spec. Round 5's
advisory-only Select constraint STANDS untouched.

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
  server, except Wire Round 1's audit-only import (env-gated, gates nothing
  — see the Wire Round 1 section above). Activation of any live gate is a
  separate decision.
- **Round-5 validations owed**: advisory-hint test design on the person's own
  repeated tasks (hint vs free generation, AST-scored, not name-scored);
  eager-mode disputed-hop affordability on the target machine; attention-segment
  selector re-validation in a real multi-turn loop (single-hop only until then);
  falsifier execution on real logged disputed hops (none exist yet).
- Test fixtures in `interceptors.test.cjs` use obvious dummy placeholders
  (`'hunter2'`, `'sk-123'`) as redaction fixtures only — no real secrets.
