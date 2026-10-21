# Doctor Agent Configuration — For OpenCode & Cline

## Summary

The **Doctor Agent** has been created for both OpenCode and Cline AI coding assistants. This agent specializes in diagnosing and fixing system bugs, API issues, and architectural problems.

---

## OpenCode Configuration

**Location:** `~/.config/opencode/agents/doctor.md`

```markdown
---
description: The Diagnostician - Diagnose and fix system bugs, API issues, and architectural problems
mode: subagent
model: opencode/mimo-v2.5-free
temperature: 0.1
permission:
  read: allow
  glob: allow
  grep: allow
  bash: ask
  webfetch: allow
  websearch: allow
---
```

**Usage:** `@doctor "diagnose the GSK restart issue"`

---

## Cline Configuration

**Location:** `C:\Users\%USERNAME%\AppData\Roaming\Code\User\globalStorage\Barndl.cline\agents\doctor.md`

**Usage:** Mention `@Doctor` in Cline chat

---

## Doctor's Expertise

### 1. GSK Connectome Analysis
- Full-system structural mapping of 40+ subsystems
- Dynamic event flow tracing
- Micro-variability detection

### 2. Action Pathway Diagnostics  
- Decision-to-action fidelity analysis
- Combo orchestrator execution tracing
- Feedback loop effectiveness

### 3. System Pathology Detection
- Perpetual consciousness burnout analysis
- SCRIBE bridge connectivity issues
- Model resolution validation
- Rate limit exhaustion patterns

---

## Diagnostic Library Access

The Doctor has access to:

1. **THE PROFIT BIBLE v48.0.0** — Architectural repairs, OmniRoute fix, MegaBrain parser
2. **GSK Connectome Report** — Complete wiring diagram
3. **Action Pathway Breakdowns** — Decision-to-action failure patterns
4. **Strategic Gaps** — High-level optimization targets
5. **Initial Bugs & Concerns** — Macro-level architectural flags
6. **Tool Acquisition Plan** — Telemetry instrumentation blueprint
7. **34-Session Epic** — Historical record of all system versions

---

## Quick Reference Commands

```bash
# Check GSK status
curl http://127.0.0.1:3001/health

# Check OmniRoute
curl http://127.0.0.1:20128/health  

# Check SCRIBE
curl http://127.0.0.1:4000/health

# Tail GSK logs
Get-Content C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk_daemon.log -Tail 50
```

---

## Use Cases

- `@doctor "Why does GSK keep crashing on boot?"`
- `@doctor "Trace the perpetual consciousness burnout"`
- `@doctor "Fix the syntax error in auto_journal.js"`
- `@doctor "Analyze the model resolution chain"`
- `@doctor "Build the telemetry tools from the acquisition plan"`