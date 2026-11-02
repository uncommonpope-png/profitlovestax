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
