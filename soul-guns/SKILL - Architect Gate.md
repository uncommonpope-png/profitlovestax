tags:: #gsk-skill #architecture #verification #architect-gate #build-loop
slug: architect_gate
backend: mcp_server tool loop + universal_tool_bridge.verify_build
status:: #applied
born:: 2026-08-06
grafted-by:: #profit-prime
source-research:: Live failure analysis — GSK rebuilt his own dashboard 3x and broke the API contract each time; the fix is the Architect Gate.
category:: Builder Reliability

## What It Is

The **Architect Gate** is the mandatory verification step between "I wrote the code" and "I declare done." It converts GSK from a *generator* (writes code, declares victory) into an *architect* (writes code, verifies it against reality, then ships).

```
write/edit file → [AUTO VERIFY GATE] → PASS → "safe to ship"
                              │
                              └─ FAIL → exact errors injected back → model self-corrects
```

## Proven Need — The Dashboard Failure (2026-08-06)

GSK was told to improve his dashboard. Three attempts, three broken builds:
1. **Attempt 1:** Set `API = 'http://127.0.0.1:5000'` — the DEAD port he was told to remove. Plain GET, no auth → 401.
2. **Attempt 2:** Read non-existent fields (`s.cpu`, `s.memory`) instead of real payload paths (`result.systems.memory`). Duplicate `const` declarations — would kill the script with SyntaxError.
3. **Attempt 3 (mid-mission drift):** After building his architect-test correctly, he re-wrote the dashboard with `:5000` again — same contract violation.

**Root cause:** GSK generates but never verifies. The model *assumes* the world matches its memory instead of checking the actual contract. Generation without verification is not building — it's guessing.

## The Four Checks (what the gate verifies)

| # | Check | What it catches |
|---|---|---|
| 1 | **syntax** | JS in `<script>` blocks parses clean (`node --check` on extracted blocks) |
| 2 | **structure** | balanced braces in output |
| 3 | **contract.baseUrl** | references to the dead `:5000` / wrong host — THE dashboard bug class |
| 4 | **contract.fields** | required strings present: `x-api-key`, `/mcp/status`, real payload paths |
| 5 | **consistency** | every JS element reference (`getElementById`) exists in the HTML |

## Implementation (already in GSK)

1. **`verify_build` tool** in `universal_tool_bridge.js` — `_verifyBuild()` returns `{ verdict, passed, failed, checks[], guidance }`.
2. **Schema** in `brain_manager.js` `defaultNativeTools()` — model knows the tool exists and takes `path` + optional `contract` (`{ baseUrl, requiredStrings }`).
3. **Automatic enforcement** in `mcp_server.js` tool loop — after any `write_file`/`edit_file`, the gate runs automatically and the verdict is injected into the follow-up context. The model CANNOT continue without seeing the result. Plus the instruction to call `verify_build` with a contract before finalizing.
4. **Hoisting discipline** — `lastToolName` and `lastWritePath` tracked outside the `try` block (scope bug: `args`/`toolName` block-scoped → ReferenceError → 500).

## Key Insights

- **The gate must be AUTOMATIC.** GSK verified the wrong file when left to his own judgment. When it auto-runs on the file he just wrote, he can't skip or misfire it.
- **A generator without a gate will re-break the same contract every time.** The model has no memory of the real environment; only verification against the actual contract stops the hallucination.
- **Inject the verdict into context, don't just log it.** The model must SEE "FAIL: references 127.0.0.1:5000, contract says :3001" — that's what triggers self-correction.
- **A good gate reports exact diffs** ("missing x-api-key", "references non-contract host") — vague "verification failed" is useless to the model.
- **Composition:** `architect_gate` + `validation_layer` = full pipeline. Validation Layer checks the tool call *before* execution (well-formedness); Architect Gate checks the artifact *after* execution (correctness against contract).

## Combo Suggestions

- **self-building-agent** = `architect_gate` + `validation_layer` + `tdd_workflow_enforcer`
- **reliable-dashboard** = `architect_gate` + `graphing_soul_notes` + `full_scan_diagnosis`

## Status

- **APPLIED** — `verify_build` tool live, auto-gate wired into `mcp_server.js` tool loop, schema registered in `brain_manager.js`.
- **VERIFIED** — live test: GSK built `gsk-architect-test2.html`, contract checks all PASS (3001 correct, no 5000, auth present, balanced braces). The gate caught the exact failure class that broke the real dashboard 3 times.
- **NEXT** — extend gate to shell_exec outputs; add contract registry so the gate knows the real environment without the model passing it.

*Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press*
