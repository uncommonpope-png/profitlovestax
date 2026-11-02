# SEP-2624 interceptor port decisions — local chain implementation

Node.js, CommonJS, zero dependencies. Runs with plain `node`.

- `interceptors.cjs` — the chain implementation.
- `interceptors.test.cjs` — tests (Node built-ins only). Run: `node interceptors.test.cjs`

## What it implements

A local, client-side interceptor chain. Direction — never a phase label —
decides the order (the phase-label trap from Batches 143–144: C# Receiving =
Phase.Response, Go Receiving = PhaseRequest, so bare "request/response"
labels cannot be trusted):

- **Sending:** mutate (sequential, sorted by priorityHint only) →
  validate + observe (parallel) → send.
- **Receiving:** receive → validate + observe (parallel) → mutate
  (sequential, priorityHint-sorted) → **re-validate** → process.
  The re-validation step is local hardening, not SEP text: SEP-2624 has no
  re-validation after receiving mutation, so a receiving mutation in the
  SEP model reaches processing unvalidated.

Other rules enforced in code, not just documented:

- **Validation:** all failures collected; any blocking failure rejects with
  `-32602` and `data.validationErrors[]`. Validation failures never
  partially apply — nothing is sent or processed afterwards.
- **Mutation:** failure halts immediately with `-32603` and
  `data.lastValidPayload` (chain-local atomicity: the payload reverts to
  the last valid state; it does not undo an already-executed tool call,
  because mutations run before send/process).
- **Refusals:** third-party mutation is refused (own-client mutations
  only); reliance on server-side interceptors is refused (constructor
  option, run option, or server-side descriptor); third-party receiving
  observability/audit on sensitive results is refused (own-client audit
  trail only on that path; the audit log is local and is never sent
  anywhere).
- **Gate pinning:** a gate interceptor's effective mode is pinned active.
  Promoting a gate to audit mode — at registration, via `setMode`, or via
  a run override — is refused. Audit mode is never a gate: audit
  validators log violations without blocking; audit mutators compute a
  shadow transformation without applying it. `failOpen` is false on every
  gate interceptor (gate `failOpen: true` is refused; an override saying
  otherwise is forced to false).
- **valid=false blocks regardless of severity.** The both-SDK quirk where
  valid=false with warn/info-only messages does not block is NOT imported.
- **Dual-signal timeout:** a local deadline is checked after EVERY stage,
  including the final stage (the post-final-stage gap found in Go's chain),
  and each invocation is also raced against its timeout. Invoke errors
  are parsed code-keyed: `-32000` is a timeout, and unwrapped Go-style
  signals (`context deadline exceeded`, `deadline exceeded`,
  `ETIMEDOUT`/`DEADLINE_EXCEEDED`, `TimeoutError`) are timeouts too.
  `timeoutMs` is forwarded into every interceptor invocation context, so
  the chain actually solicits the server signal it claims to recognize.
  This module's own timeouts emit `-32000` (SEP-2624 draft MUST).
- **Audit logging:** every interceptor invocation is logged with a
  PII-redacted payload copy (fields named like password/token/secret/
  key/auth/credential are replaced with `[REDACTED]`), resolved mode,
  `failOpen`, and source. SEP-2624 states this as a SHOULD binding ALL
  invocation logs (Security Best Practices item 3, "Audit Everything");
  this port adopts it as a MUST for its own logs and names that
  strengthening explicitly. Redaction applies to log output only — it
  does not change the payload delivered to an interceptor, so an auditor
  ordered before a redactor on receiving still sees the pre-redaction
  payload by design (Hole 2, live in both SDKs).
- **Method names:** `interceptors/list` + `interceptor/invoke` (the SEP's
  own mixed spelling). `executeChain` is NOT a wire method in SEP-2624;
  dispatching it (or any unknown method) is rejected with `-32601`.
  Chains are orchestrated client-side via list + invoke.
- **Not gated here:** `llm/completion` is an OpenAI-shaped borrowed event,
  not an MCP-native method — it does not gate a local resident model,
  and this module does not implement it as one.

## Cancellation / abort audit (Batches 181, 184, 186, 188)

A record + classifier for abort observations, appended to
`interceptors.cjs` without touching round-1 chain behaviour. It starts
no server and measures no latency: observations are data handed in,
and the functions normalize them, classify them, and decide what proof
(if any) they carry.

- **Cancellation triple (181, verified against spec text).** Servers
  receiving cancellation SHOULD stop processing, free resources, and
  not send a response; MAY ignore it if the request is unknown,
  processing already completed, or the request cannot be cancelled;
  the client SHOULD ignore any late response. PRECISION: the
  cancellation page itself says SHOULD-not-send-a-response, NOT MUST —
  the MUST comes from the base notification rule and the transport
  page's MUST NOT send further messages. Never quote the cancellation
  page as saying MUST-not-respond; quote the transport page for that.
- **Stateless revision (181).** Server-sent `notifications/cancelled`
  is narrowed to subscription teardown ONLY (servers MUST NOT send it
  for any other purpose) — so "no server cancelled message" for a tool
  call is never a failed abort, on either era. Session channels are
  GONE: closing a session, a standalone GET stream, or DELETE no
  longer cancels anything; modern-only servers answer GET/DELETE with
  405 and ignore `Mcp-Session-Id` entirely; cancellation is
  per-request only, and "session closed, therefore all requests
  cancelled" is invalid on 2026. No initialize to protect (the 2025
  non-cancellability rule is moot). Stdio cancellation is UNCHANGED
  in mechanism, so stdio observations are era-independent and may
  pool across eras; HTTP observations must NOT pool across eras.
- **Audit tuple (181).** Every audit entry must carry (era,
  transport, signal form, mode, W formula + frozen baseline version)
  or the proof is not comparable across observations.
  `makeAbortAuditEntry` throws on an incomplete tuple rather than
  recording an incomparable observation.
- **Stdio W rule (181).** `W_tool(mode)` = frozen p99(mode) when
  n_mode >= 1000, else 2 × frozen p95(mode), measured from cancel
  dispatch. CAP: if the level timeout remaining at cancel is less
  than W, the observation is TRUNCATED and recorded as inconclusive
  — W is NEVER shortened to fit inside the remaining budget.
  PROOF THRESHOLD: PROVEN-negatively requires >= 3 silent windows
  (three independent cancels, same tool + mode + transport + era),
  not one. PROGRESS after cancel breaks silence for that window
  (race/inconclusive, not a counted silence, not a disproof on its
  own) and does NOT extend W. A LATE RESPONSE after W but before
  the level timeout does NOT retroactively disprove the abort, but
  DOES demote that observation (removed from the counted proof set;
  the set must regain three silences). PATTERN RULE: late responses
  on >= 2 observations within a proof set revert the tool to
  DECLARED and require a fresh proof set. POSITIVE DISPROOF
  (separate, sticky): an observed side effect after cancel on a tool
  claimed read-only, or a message attributable to work that started
  after cancel — attribution separates disproof from race, and a
  bare late response never carries it.
- **2026 HTTP replacement (181).** The window W uses the same
  duration formula, but the observation is "no SIDE EFFECT observed
  within W", NOT "no message". For a read-only tool that observation
  is vacuous, so HTTP read-only abortability is recorded as the
  distinct qualifier PROVEN-client-abandonment, NOT
  PROVEN-server-stopped (residual risk is server load, not
  correctness). For non-read-only HTTP tools the question does not
  arise: rescue is already barred by never-hedge-commits, so no HTTP
  write tool ever needs a protocol-abort proof for rescue.
  Server-side stopping on HTTP must NOT be claimed from message
  silence (it is transport-guaranteed, hence circular).
- **Signal form unified (184).** For 2026 HTTP observations the
  signal form is single-valued "POST abort". Round 1's code contained
  no SSE-vs-JSON signal-form split (verified by grep), so there was
  nothing to remove — the unified field is new. The response form is
  unknowable at cancel time, and splitting it invents data. The one
  exception: a post-response SSE close tearing down an existing
  subscription stream keeps "stream-close" (that stream existed).
  The original label is preserved as `relabeledFrom` so a mislabel
  stays auditable.
- **JSON server-obligation (184).** Recorded as a
  plausible-but-unscoped MUST-treat-disconnect reading with its
  stated limits — explicitly NOT a verbatim spec rule. The C#
  stateless-token sentence is mechanism evidence only, NOT
  client-observable proof; do not quote the C# page as saying 2026
  HTTP clients send `notifications/cancelled` — they do not. Timing
  remains NOT-GUARANTEED (a handler that never checks its signal
  still runs to completion; SHOULD-stop-as-soon-as-practical limit).
- **TS SDK v2 mechanism (186).** `PerRequestHTTPServerTransport`
  cancels the WHOLE EXCHANGE on client disconnect,
  response-form-independent, CONDITIONED on the runtime providing an
  abort signal ("when the runtime provides an abort signal on it").
  Runtime-condition table: Workers/Deno/Bun = signal-native; Node =
  adapter-dependent (resolved by 188). Legacy sessionful
  `StreamableHTTPServerTransport` is OUT OF SCOPE (modern leg only).
  The transport's connection-closed rejection is about the
  exchange's promise, not a forced kill of handler code. The HTTP
  server-stopped question is CLOSED for plain tools/call: record
  "client-abandonment" as the proven claim and stop carrying "is
  there a client-observable channel?" as an open question; re-open
  only on a new protocol channel (a spec sentence or SDK client-side
  signal). Boundary: task-shaped invocations are NOT ruled on.
  Operator-side evidence (server logs/metrics, latency, contention)
  is real for the operator but is NOT a protocol observation and
  must not be recorded as one.
- **JSON case status (186) — provenance, read honestly.** Mechanism
  SDK-documented (TS v2 per-request transport, runtime-conditioned),
  spec wording STILL unverified. The `perRequestTransport.ts` source
  lines were NOT read in that batch (GitHub fetch failed; typedoc
  docs used instead) — if source later contradicts the docs, source
  wins. The Node row below, by contrast, IS adapter-source-backed
  (Batch 188).
- **Node row resolved (188).** `toNodeHandler` synthesizes a
  per-request web AbortSignal via res `close` ONLY (not req close,
  not aborted, not response finish), with a finished guard (close
  after full stream does not abort — correct, nothing left to
  cancel). Plain/Express/Fastify mounts = signal synthesized (same
  underlying Node req/res objects). Hono = runtime-dependent,
  UNVERIFIED (Hono does not use `toNodeHandler`; `@hono/node-server`
  unexamined) — the Node row must read exactly that split, never a
  blanket "Node: yes". Hand-wired `toWebRequest` audit rule: signal
  present IFF the request came through `toNodeHandler` OR an
  explicit signal option — a direct `toWebRequest` caller that omits
  the option gets a signal-less Request, and the audit must check
  the path, not assume. Half-open socket edge: a disconnect that
  leaves the response object un-closed does not abort. JSON thread
  is CLOSED end to end except spec wording (still unverified);
  timing still NOT-GUARANTEED. Do NOT re-open the Node sub-gap
  without a new adapter version.
- **Gate 3 restated (181).** "abortable = PROVEN in the audit, with a
  class-appropriate proof" — where for 2026 HTTP read-only tools
  PROVEN means the client-abandonment qualifier, and for stdio tools
  PROVEN means the >= 3-silence set (2025-era HTTP keeps its
  negative message-silence proof, since the stream/session remains
  open). Other gates unchanged: multi-path hedging,
  never-hedge-commits, level-boundary wait, RULE 6, breaker, drift
  rules, and the companion gates (read-only + idempotent, zero
  progress, single re-issue, budget fit, separate rescue-rate
  metric). Per-mode T_stuck is the plan-executor worker's area and
  is referenced here only via the gate-3 wording, not duplicated.

## Rule-to-batch mapping

| Rule | Batches |
|---|---|
| Direction-based phase order; validation/mutation/observability split as verifier module interface; priorityHint sorts mutations only | 43 (Nov 1 full read) |
| Validation collected, `-32602` + `validationErrors[]`; mutation halts, `-32603` + `lastValidPayload`, chain-local atomicity; timeout `-32000` | 43 (Nov 1) |
| Three refusals: third-party mutation ever; reliance on server-side interceptors; third-party receiving observability on sensitive results | 43 (Nov 1) |
| Receiving re-validation (Hole 1); own-client audit trail only for receiving observability (Hole 2) | 43 (Nov 1); 133 (holes unfixed in successor) |
| `llm/completion` is borrowed OpenAI-shaped event, not a local-model gate | 43 (Nov 1) |
| #1763 closed-as-superseded; cite Draft SEP-2624, open PR #2624; `interceptors/list` + `interceptor/invoke` implemented in C#/Go on main (Experimental, no releases); `executeChain` is NOT a wire method | 132 |
| Observability type dropped for audit mode; capability renamed into extensions namespace; both receiving holes unfixed in successor; `failOpen` false on gates, audit mode never a gate; method-name plural/singular inconsistency | 133 |
| C#/Go diverge (phase order by label, result shape, sink, pagination, `_meta`, both-phase, timeout/config forwarding) — neither is a SEP-2624 reference; method names pinned to SEP mixed spelling; gate-mode pinned active (Go Directive promotion shut); valid=false blocks regardless of severity | 143 |
| `-32000` IS a draft MUST for timeouts (Go diverges, emits none); audit exposure PRE-redaction in both C# and Go receiving chains (Hole 2 live — audit interceptors must redact their own logs); phase order agrees once aligned by direction; phase labels alone are a trap | 144 |
| "Audit Everything" binds ALL interceptor-invocation logs, not only audit-mode ones; strength SHOULD, not MUST; redaction applies to log output only | 145 |
| C#-consumes-Go: 3 silent breaks (result shape, both-phase, timeout signal), 3 tolerated (sink, pagination, `_meta`); per-server wire-shape conformance test required | 146 |
| Go-consumes-C#: 2 silent breaks (sink, result-shape validation), 1 accidental pass (mutation via top-level payload), 3 tolerated; result shape is the common break; pinning per (consumer, server) pair | 147 |
| Go also misclassifies a C# server's `-32000` (fail-closed → ValidationFailed/MutationFailed; audit/failOpen skipped; never ChainTimeout); Go never forwards `timeoutMs` and lacks a post-final-stage local deadline check; dual-signal rule confirmed in both directions | 148 |

## Honest limits — read before relying on this

- **This is a local chain implementation of the SEP-2624 port decisions,
  NOT a cross-SDK conformance claim.** The runtime cross-SDK conformance
  test (per (consumer, server) pair, through the actual chain, with a
  known validation failure, a known mutation, and a forced timeout) is
  still owed and has NOT been run. **No C# or Go implementation was
  tested here.**
- SEP-2624 is **Draft** (open PR #2624, unmerged); the experimental
  implementations live on an Experimental repo's main branch with no
  releases. Nothing here treats any of that as a stable contract.
- The chain's audit log redacts by field name. A sensitive value under
  an innocuous field name will NOT be redacted — redaction is a log
  hygiene rule, not a data-classification guarantee.
- Per-(consumer, server) pinning (result shape, sink handling, both-phase
  wire form, timeout handling, pagination) is a record this module's
  descriptors can carry (`listInterceptors()`), but this module does not
  auto-detect a foreign server's wire shape — that is exactly what the
  owed conformance test is for.
- Nothing here was pushed to any git repo, no server was started, and no
  secrets or credentials appear anywhere in these files.
