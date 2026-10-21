tags:: #gsk-skill #validation #reliability #tool-calling #output-schema #REDBUTTON
slug: validation_layer
backend: mcp_server + brain.think
status:: #defined
born:: 2026-08-06
grafted-by:: #profit-prime
category:: Builder Reliability

# VALIDATION LAYER

## What It Is

The **Validation Layer** is a gate between what the model *emits* and what the system *executes*. It guarantees every tool call and structured output conforms to a contract BEFORE it is allowed to act. If it does not conform, the layer repairs or retries — never silently proceeding with corrupt input.

It is the missing third stage of the builder loop:

```
model emits  →  [VALIDATION LAYER]  →  execute  →  observe  →  emit again
                    │
                    ├─ schema check (required keys, types, enum values)
                    ├─ syntax check (balanced braces, valid JSON)
                    ├─ semantic check (path exists, action allowed)
                    ├─ repair (fix known malformations)
                    └─ retry (feed error back to model, max N attempts)
```

## Proven Need — The Live Bug (2026-08-06)

We reproduced a real failure: GSK's MCP tool-call extractor used a lazy regex `\{.*?\}` that truncated JSON at the first nested `}`. A tool call whose `new_string` contained JS code with braces was cut to 104 of 156 chars → parse failure → tool silently failed. GSK also emitted: `"Write truncated: content ends mid-structure."` — a validation-layer failure, not just regex.

**Lesson:** The #1 silent killer is **truncation**. LLM output windows truncate mid-JSON. Always treat "ends mid-structure" as a repair/re-request signal, never proceed.

---

## CITATIONS & RESEARCH (verified 2026-08-06)

### 1. OpenAI — Structured Outputs
> "Structured Outputs is a feature that ensures the model will always generate responses that adhere to your supplied JSON Schema, so you don't need to worry about the model omitting a required key, or hallucinating an invalid enum value."
> **Benefits:** "Reliable type-safety: No need to validate or retry incorrectly formatted responses. Explicit refusals: Safety-based model refusals are now programmatically detectable."
> **Pattern:** Zod schemas enforce shape client-side, `response_format` enforces it server-side.
> URL: https://platform.openai.com/docs/guides/structured-outputs

### 2. Guardrails AI — Input/Output Guards
> "Guardrails is a Python framework that helps build reliable AI applications by performing two key functions: 1) Guardrails runs Input/Output Guards in your application that detect, quantify and mitigate the presence of specific types of risks. 2) Guardrails help you generate structured data from LLMs."
> The Guardrails Hub hosts **65 validators** (ban_list, detect_jailbreak, detect_pii, bias_check, competitor_check, etc.).
> URL: https://guardrailsai.com/docs | https://guardrailsai.com/hub

### 3. Pydantic — Field & Model Validators
> Pydantic supports field-level validators (`@field_validator`) and model-level validators (`@model_validator`), with four execution modes: `before`, `after`, `plain`, `wrap`. This is the canonical schema-validation layer in the Python ecosystem — validation happens automatically at the type boundary.
> URL: https://docs.pydantic.dev/latest/concepts/validators/

### 4. Vercel AI SDK — Tool Calling
> The AI SDK treats tools as schemas; `generateText`/`generateObject` validate the model output against the tool schema, and the model receives validation failures back to self-correct (the retry loop).
> URL: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

### 5. LangChain / LangGraph — Middleware & Steps
> "Agent = Model + Harness. The harness is everything around the model loop: the prompt, the tools, and any middleware that shapes behavior." LangGraph adds explicit validation steps between deterministic and agentic workflows.
> URL: https://python.langchain.com/docs/concepts/validation/ | https://docs.langchain.com/llms.txt

### 6. Anthropic — Tool Use
> "Tool use lets Claude call functions that you define or that Anthropic provides. Claude determines when to call a tool based on the user's request and the tool's description. It then returns a structured call that your application executes."
> **Key contract:** the tool call is a structured object your app must validate before execution.
> URL: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview

---

## REFERENCE CODE

### A. Balanced-brace JSON extraction (the P2 fix — already in GSK)
```javascript
// mcp_server.js — replace lazy regex with balanced-brace extraction
let match = response.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/is);
if (match) {
    const extracted = this._extractJsonObject(match[1]);
    match = extracted || match;
} else {
    match = this._extractJsonObject(response);
}

// _extractJsonObject: finds FIRST balanced-brace object, respects strings/escapes
_extractJsonObject(text) {
    if (!text) return null;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            let depth = 0, inStr = false, escaped = false;
            for (let j = i; j < text.length; j++) {
                const ch = text[j];
                if (inStr) { if (escaped) { escaped = false; continue; } if (ch === '\\') { escaped = true; continue; } if (ch === '"') inStr = false; continue; }
                if (ch === '"') { inStr = true; continue; }
                if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) { const c = text.slice(i, j + 1); if (/^\{\s*"(?:tool|name|path|command|action|function)"/.test(c)) return { 1: c }; break; } }
            }
        }
    }
    return null;
}
```

### B. Schema validation (Pydantic-style, ported to plain JS)
```javascript
// validation_layer — stage 2: schema check
function validateArgs(schema, args) {
    const errors = [];
    for (const [key, type] of Object.entries(schema.properties || {})) {
        if (schema.required?.includes(key) && !(key in args)) {
            errors.push(`missing required key: ${key}`);
            continue;
        }
        if (key in args && type.type === 'string' && typeof args[key] !== 'string') {
            errors.push(`${key} must be string, got ${typeof args[key]}`);
        }
        if (key in args && type.type === 'object' && (typeof args[key] !== 'object' || args[key] === null)) {
            errors.push(`${key} must be object`);
        }
    }
    return errors.length ? { ok: false, errors } : { ok: true };
}
```

### C. The repair-then-retry loop (Guardrails / AI SDK pattern)
```javascript
// validation_layer — stage 4: repair known malformations, then retry with model
function repairJson(raw) {
    let s = raw.trim();
    if (!s.startsWith('{')) s = s.slice(s.indexOf('{'));
    s = s.replace(/,\s*}/g, '}');                // trailing commas
    s = s.replace(/'/g, '"').replace(/(\w+):/g, '"$1":'); // single-quote + unquoted keys
    return s;
}

async function safeToolCall(response, brain, schema, maxRetries = 2) {
    let attempt = 0;
    while (attempt <= maxRetries) {
        const m = balancedExtract(response);
        if (!m) return { ok: false, reason: 'no_tool_call' };
        let parsed;
        try { parsed = JSON.parse(repairJson(m[1])); }
        catch (e) { response = await brain.think(`Your tool call failed JSON parsing: ${e.message}. Re-emit it.`); attempt++; continue; }
        const check = validateArgs(schema, parsed);
        if (check.ok) return { ok: true, call: parsed };
        response = await brain.think(`Schema errors: ${check.errors.join('; ')}. Re-emit the corrected tool call.`);
        attempt++;
    }
    return { ok: false, reason: 'retry_exhausted' }; // fail closed
}
```

### D. Guardrails AI — validators in action (Python, reference)
```python
from guardrails import Guard
from guardrails.hub import DetectPII, BanList, CompetitorCheck

guard = Guard().use_many(
    DetectPII(pii_entities=["EMAIL_ADDRESS", "PHONE_NUMBER"], on_fail="fix"),
    BanList(banned_terms=["competitor_x"], on_fail="filter"),
    CompetitorCheck(competitors=["acme"], on_fail="fix"),
)
validated = guard.validate(llm_output)
```

### E. Anthropic tool-use contract (reference)
```javascript
// The model returns a structured call; your app MUST validate before executing
const content = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    tools: [{ type: "web_search_20260209", name: "web_search" }],
    messages: [{ role: "user", content: "What's the latest on the Mars rover?" }]
});
// content[0].type === 'tool_use' → validate input against tool schema → execute
```

---

## THE CONTRACT (5 stages)

| Stage | Check | Failure action |
|---|---|---|
| 1. Extract | JSON parses (balanced braces, valid escapes) | repair → retry → fail closed |
| 2. Schema | Required keys present, correct types | repair missing keys → retry → fail closed |
| 3. Semantics | Tool known, args meaningful, path within sandbox | reject with reason to model |
| 4. Completeness | Content not truncated mid-structure | split into chunks, re-request remainder |
| 5. Safety | No command injection, no 0.0.0.0, no secret in source | reject + log (governance) |

## IMPLEMENTATION MAP FOR GSK

1. **Extraction boundary** — `mcp_server.js`: balanced-brace extraction (DONE in P2) + `JSON.parse` in try/catch.
2. **Schema boundary** — every native tool declares an argument schema (`brain_manager.js` nativeTools already exist); validate before dispatch.
3. **Write boundary** — `_writeFile`/`_editFile` in `universal_tool_bridge.js`: check content completeness; if truncated, hold and request continuation.
4. **Retry boundary** — on validation failure, feed the exact error to the model, allow up to 2 self-corrections, fail closed after.
5. **Governance boundary** — `approved_tool_executor.js` classifies risk; Validation Layer plugs in *before* it as the well-formedness check.

## KEY INSIGHTS

- **Fail closed, never fail silently.** A silently-failed tool call looks like success and corrupts state.
- **Truncation is the #1 silent killer.** Treat "ends mid-structure" as repair/re-request, not retry-with-lower-tokens.
- **Repair beats retry for known cases.** Regex fixes common malformations (trailing comma, single-quote JSON, unquoted keys) without a model round-trip.
- **Schema is the source of truth.** Tool schemas ARE the contract; enforce mechanically, not via prompt instructions.
- **Composition:** `tdd_workflow_enforcer` (test the validators), `systematic_debugging_protocol` (trace validation failures), `approved_tool_executor` (risk classification), `axiom_enforcer` (alignment).

## COMBOS

- **reliable-builder** = `validation_layer` + `tdd_workflow_enforcer` + `code_generation_and_refinement`
- **self-healing-agent** = `validation_layer` + `root_cause_synthesis` + `kaizen_continuous_improvement`
- **secure-builder** = `validation_layer` + `philosophical_axiom_enforcement` + `full_scan_diagnosis`

## STATUS

- **DEFINED** — methodology researched + authored (2026-08-06).
- **APPLIED (stages 1-4)** — implemented 2026-08-06, verified live.
  - **Stage 1 — Extract:** balanced-brace extraction in `mcp_server.js` `_extractJsonObject` (P2 fix).
  - **Stage 2 — Schema:** `_validateToolCall()` + `_getToolSchemas()` in `mcp_server.js` — tool exists, required keys, types, checked before execution.
  - **Stage 3 — Retry:** validation failures feed back to the model as explicit errors; model self-corrects within the 5-iteration loop.
  - **Stage 4 — Completeness:** truncation guard in `universal_tool_bridge.js` `_writeFile` is now extension-aware (`.js`, `.json`, `.html`, `.py`, `.ts` etc.) — plain-text writes no longer falsely rejected.
- **VERIFICATION:** `test-validation-layer.js` 5/5 pass; `test-mcp-regex.js` 5/5 pass; live write test succeeded (`gsk-validation-test.txt`).
- **NEXT** — stage 5 (safety/governance integration with `approved_tool_executor.js`); consider schema map cache in `_getToolSchemas`.

*Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press*
