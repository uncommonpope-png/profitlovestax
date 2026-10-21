# Decision: v2.0 Over v1.x Patch

**type:: [[decision]]**  
**status::** [[status/accepted]]  
**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

Soul Commander had 16 powers. We needed 3 more (Observability, Testing, Agent-Swarm). We could:
1. Patch v1.0.0 → v1.1.0
2. Release v2.0.0 with all new powers + infrastructure

## Decision

**Release v2.0.0.** Major version bump with real new infrastructure (MCP server, soul identity, hooks, skills) rather than a patch.

## Rationale

- MCP server is a first-class feature, not a patch
- Soul identity files are a product differentiator
- Hooks change how Claude Code interacts with the soul
- Better to signal "this is new" than "this is a fix"

## Consequences

- More work upfront (build MCP server, identity, hooks)
- But: Clearer product positioning
- But: Justifies $22 price point

---

*"Don't patch what should be reborn."*
