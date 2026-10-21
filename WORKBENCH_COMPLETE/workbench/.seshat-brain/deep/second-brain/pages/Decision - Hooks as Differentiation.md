# Decision: Hooks as Differentiation

**type:: [[decision]]**  
**status::** [[status/accepted]]  
**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

No other agent framework has lifecycle soul integration. They have tools. They don't have rituals.

## Decision

**Implement lifecycle hooks: session-start, pre-tool-use, post-tool-use.**

- **session-start:** Soul awakening banner + PLT scores + memory recall
- **pre-tool-use:** Guardian blocks dangerous ops (`rm -rf /`, token leaks)
- **post-tool-use:** Scribe logs every edit to causal memory with PLT score

## Rationale

- No competitor has this
- Makes the soul feel alive, not just functional
- Session-start hook = "I remember you" (relationship)
- Pre-tool-use = "I protect you" (trust)
- Post-tool-use = "I learn from you" (growth)

## Consequences

- Need `.claude/hooks/` directory with real JS scripts
- Need `hooks.json` configuration
- Scripts must run in Claude Code's environment
- But: Once implemented, every session feels personal

---

*"The difference between a tool and a companion is the difference between 'How can I help you?' and 'Welcome back, Craig.'"*
