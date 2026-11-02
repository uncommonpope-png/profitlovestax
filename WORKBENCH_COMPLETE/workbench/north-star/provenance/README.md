# Provenance emission + per-result-source render classification

Node.js, CommonJS, zero dependencies. Runs with plain `node`.

- `provenance.cjs` — the implementation.
- `provenance.test.cjs` — tests, only `node:assert` / `node:test`.
  Run: `node provenance.test.cjs` (exit 0 on pass; 19/19 at delivery).

## What it implements

**Emission.** `buildProvenance(emitter, fields)` builds the `_meta` value:
one namespaced key, `io.github.uncommonpope-png/provenance`, holding a
versioned object with one sub-object per emitter, e.g.
`{ "io.github.uncommonpope-png/provenance": { version: 1, obsidian: { baseUrlHost, baseUrlSource } } }`.
Bare top-level `_meta` keys (`obsidianBaseUrlHost`, `obsidianBaseUrlSource`)
are rejected with a thrown error, never emitted. `attachProvenance(result,
provenance)` returns a new result carrying `_meta`, preserving `content`
and `isError` — a returned `isError: true` result keeps its `_meta`.
`readProvenanceFromResult(result)` is the bridge-side read
(`exec.result._meta` alongside the existing content read).

**Thrown errors.** `provenanceFromThrown(error, { toolName })` returns an
explicit sidecar record with `_meta: null`, `hostUnknown: true`, and the
reason: a thrown error is rebuilt by the SDK handler without `_meta`, so
no host can be carried. The wrapper must instead RETURN the error with
`_meta` attached, in both the catch branch and the scope-denied branch.
The sidecar is stored beside the result, never inside `result._meta` —
attaching it via `attachProvenance` is rejected, by design.

**Classification.** `classifyResult({ toolName, sourceUrl, finalUrl,
hostAtCallTime, denied, errorText, confirmation, ... })` returns
`{ sourceClass, recordedUrl, hostUnknown, assumption, redirectToLocalhost,
unknownTool, malformedProvenance, reason }`. Classes: `own-box`,
`own-account`, `stranger`, `system`. The tool name is only a routing
hint; the per-tool ultimate-source table decides for known tools, and
unknown tools default to `stranger` (flagged). `renderClass(classified)`
returns the render label so a renderer styles by source, not tool name.
The unknown-host assumed case renders as `own-box (assumed, host unknown)`
— a distinct label, never a silent own-box mark.

**Classify before slicing.** `classifyThenSlice(options, maxChars)`
classifies the full result, then slices the text, carrying the pre-slice
classification unchanged. Never classify a slice: the runOne label already
truncates the provenance argument to 200 chars, and parsing provenance
back out of joined result text is lossy and spoofable.

## Rule-to-batch mapping

| Rule | Batch |
|---|---|
| Per-result classifier spec; provenance record captured BEFORE slicing; tool name demoted to routing hint; unknown defaults to stranger | 134 |
| Own-box path set = repo root (resolved at runtime) + two Desktop roots, read from the gate at runtime, never hardcoded here (caller supplies `ownBoxRoots`); local-loop shell allowlist own-box by construction, arsenal shell stranger by origin; localhost rule: local-loop LAN deny renders localhost content as denied system messages, redirect-to-localhost bypass noted — provenance records the FINAL url; system-message class for DENIED/ERROR/confirmation strings; provenance shape: parallel-array v1 (this module's classification record travels alongside the result), struct deferred | 135 |
| Per-tool ultimate-source table — own-box: `obsidian_*`, `local_corpus_*`, `omniroute_memory_search`; stranger: `web_search`; system/config: `oneproxy_fetch` tools. Per-server provenance does NOT cover MCP tools that fetch loopback URLs — per-tool table required | 136 |
| Obsidian baseUrl host rule — classify by host AT CALL TIME (global DB value or per-API-key override; default loopback `127.0.0.1:27123`); loopback host = own-box, non-loopback host = own-account (not stranger/own-box); sync tools loopback by construction at `:27781` | 137 |
| The bridge CANNOT capture effective baseUrl host without an MCP-server change (no `_meta`/`structuredContent` channel; bridge-side DB re-read is TOCTOU-prone). Minimal change pinned: server-side emission in the Obsidian registration wrapper for the 18 non-sync tools + a small bridge read. Interim rendering stands: "host unknown, default loopback assumed" | 138 |
| CallToolResult `_meta` passes through MCP TS SDK v1.29.0 `McpServer` verbatim (no reconstruction; validates only `structuredContent` when an `outputSchema` exists; Obsidian tools have none). Change shape: widen `TextToolResult` to carry `_meta`, attach `_meta` with host + source layer in the Obsidian wrapper, read `exec.result._meta` in the bridge | 139 |
| A returned `{ content, isError: true, _meta }` KEEPS its `_meta` (isError results exempt from output-schema validation); a THROWN error loses it entirely — wrapper must return the error WITH `_meta` in both catch and scope-denied branches; thrown errors are host-unknown by SDK construction. Transports (stdio, SSE, Streamable HTTP) serialize the whole message verbatim; SDK-client parsing preserves declared `_meta` | 141–142 |
| Emission = ONE namespaced `_meta` key `io.github.uncommonpope-png/provenance`, versioned object with per-emitter sub-objects. Bare keys (`obsidianBaseUrlHost` / `obsidianBaseUrlSource`) are REJECTED — adopted, not overruled | 149 |

## Interpretation notes (where the spec left a choice, this is the choice made)

- **Redirect-to-localhost class:** the batches pin that provenance records
  the final URL and that URL host alone never decides the class (the
  serving process does). So a public→loopback redirect records the final
  URL, stays `stranger`, and is flagged `redirectToLocalhost: true` — it
  is not upgraded to own-box on host alone.
- **Loopback fetch with no serving-process evidence:** `stranger`, not
  own-box and not system — unless the caller passes `denied: true` (the
  local-loop LAN-deny outcome), which yields `system` via the system rule.
  A caller that knows the serving process is the person's own app passes
  `servingProcess: 'own-app'` for own-box.
- **Present-but-hostless emission:** malformed, treated as unknown host
  (flagged `malformedProvenance`), per the Batch 149 tail note.
- **Loopback set:** `127.0.0.0/8`, `::1`, `localhost`. `0.0.0.0`,
  private-LAN addresses, and `.local` names are NOT loopback.
- **Own-box file reads:** the gate check here is lexical (prefix), matching
  the loop gate — so "own-box" means "passed the loop's prefix gate", not
  "provably on-box", until the gate's symlink gap closes (Batch 135).
- **Own-box roots are caller-supplied, never hardcoded:** the Desktop
  paths and repo root resolve per machine; hardcoding this VM's values
  would misclassify on the PC.

## Honest limits — what is NOT done

- **The LIVE WIRE OBSERVATION of `exec.result._meta` on the PC tree is
  still owed and has NOT been done.** The server-side emission change
  (Obsidian wrapper) and the bridge read are specified here as the
  attach/read functions, but this module does not prove the PC path
  works, and the VM copy cannot prove it. Do not claim the PC path works.
- **No server was started, no MCP call was issued, nothing was pushed,
  published, or spent.** The SDK-passthrough claims rest on the batches'
  source reads (MCP TS SDK v1.29.0), not on a live observation here.
- **Not implemented (left out, listed as owed):** the datamark prototype
  (Batch 32, step 0 of the rendering sequence); the actual Obsidian
  wrapper change in the product tree and the actual bridge read in
  `workbench/server.ts` (this module is standalone code only, by task
  order); re-derivation of the per-tool table and own-account census
  against the PC's OmniRoute registry; and the PC's actual Obsidian
  baseUrl (global + per-key) values.
- **No secrets or credentials anywhere in this directory.**
