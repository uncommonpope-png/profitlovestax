# GSK BUILD PROTOCOL — Enforced Behavior Rules

These rules are injected into GSK's context before any build command.

---

## RULE 1: NO FILE LOOPS

**Problem:** GSK reads/writes the same file 3-5 times in a loop, burning context.

**Enforcement:**
- You may read a file ONCE before editing it.
- You may write a file ONCE after writing, you are DONE with that file.
- You may NOT re-read a file you just wrote to "verify" it.
- If you need to verify, use `require()` in a single inline test — do not re-read the file.
- **Maximum 3 tool calls per file.** If you exceed 3 calls on the same file, STOP and report what you built.

---

## RULE 2: BUILD WHAT YOU PROMISED

**Problem:** GSK describes 10 features in the proposal, builds 3.

**Enforcement:**
Before writing any file, list the EXACT exports and functions you will implement:

```
FILE: plt_telemetry_gate.js
EXPORTS: PltTelemetryGate, createPltTelemetryGate
FUNCTIONS: evaluateAction, getHistory, calculatePltScore
```

After building, run `build-verifier.js` to confirm all listed exports exist.
If any export is missing, add it before responding. Do not claim the build is complete.

---

## RULE 3: ONE MODULE AT A TIME

**Problem:** GSK tries to build 3 modules in one response, does all 3 badly.

**Enforcement:**
- Build Module 1 completely. Run verifier. Confirm PASS.
- Then say "Module 1 done, proceeding to Module 2."
- Do not describe what you'll build next until the current module passes.
- **Maximum 1 module per response.**

---

## RULE 4: NO TOOL CALLS ON ANSWER QUERIES

**Problem:** On "teach me about X" queries, GSK reads files and enters tool loops instead of answering.

**Enforcement:**
- If the user asks a knowledge question ("teach me about X", "what is Y", "explain Z"), answer from knowledge ONLY.
- Do NOT use any tools (no read_file, no write_file, no list_files) unless explicitly told to build something.
- If you need to reference your own code, mention file paths by name but do NOT read them.

---

## RULE 5: HONEST COMPLETION REPORT

**Problem:** GSK claims "build complete" when 40% of features are missing.

**Enforcement:**
After building, your response MUST include this table:

```
| Feature | Status | Notes |
|---------|--------|-------|
| evaluateAction() | DONE | Core function works |
| SSE streaming | MISSING | Needs integration |
| SCRIBE witness log | MISSING | Needs port 4000 connection |
```

Do NOT claim "build complete" if any row says "MISSING."

---

## RULE 6: VERIFICATION COMMAND

After every build session, run:
```
node gsk/gsk-core/build-verifier.js
```

If any module shows FAIL, fix it before responding "done."
