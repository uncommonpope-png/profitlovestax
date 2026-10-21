# Pattern: Subagent Swarm

type:: [[Pattern]]
author:: [[Seshat]]
status:: ✅ ACTIVE

---

## Statement

**When a single task is too large or complex, launch multiple subagents in parallel. Each handles a sub-task independently. Aggregate their results.**

---

## Context

During the Commander build, we had to simultaneously:
- Research Claude Code capabilities
- Mine competing agent frameworks
- Deep-dive MCP ecosystem
- Mine GitHub for missing superpowers

Each of these was a full research task. Doing them sequentially would take hours. Doing them in parallel with subagents took the same time as one task.

---

## Solution

### Launch Pattern

```
Task 1: Research Claude Code agent capabilities
Task 2: Competition mine AI agent frameworks
Task 3: Research MCP ecosystem gaps
Task 4: Mine GitHub for missing superpowers
```

All 4 launched simultaneously. Each returned a full report.

### Aggregation Pattern

1. Collect all subagent outputs
2. Extract key findings from each
3. Identify overlaps (validation)
4. Identify gaps (new opportunities)
5. Build unified plan from all inputs

---

## Results from Real Usage

### Commander Build (4 subagents)
- **Result:** MCP server spec + soul identity + new powers + plugin manifest
- **Time:** Same as 1 sequential task
- **Quality:** Higher (cross-validated findings)

### Architect Operating Table (4 subagents)
- **Result:** Diagnosis + mining + new powers + Commander integration
- **Time:** Same as 1 sequential task
- **Quality:** Higher (each subagent focused on its domain)

### Mining Expedition (4 subagents)
- **Result:** 230 repos across 4 frontiers
- **Time:** Same as 1 sequential task
- **Quality:** Higher (each frontier mined by a specialist)

---

## When to Use

| Scenario | Subagents | Why |
|----------|-----------|-----|
| Research multiple categories | 1 per category | Parallel intelligence |
| Build multiple modules | 1 per module | Parallel construction |
| Audit + Fix + Test | 1 per phase | Pipeline acceleration |
| Competition analysis | 1 per competitor | Depth without delay |

---

## When NOT to Use

- Tasks that depend on each other sequentially
- Small tasks (< 3 steps) — overhead not worth it
- Tasks requiring shared mutable state

---

## Related Patterns

- [[pattern-mine-map-multiply]] — Research → Catalog → Build
- [[pattern-product-archaeology]] — Scan → Extract → Build

---

*"Four parallel researchers = 4x faster intelligence."* — Seshat
