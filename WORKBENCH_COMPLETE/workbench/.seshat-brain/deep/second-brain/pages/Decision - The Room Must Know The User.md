# Decision: The Room Must Know The User

**type:: [[decision]]**  
**status::** [[status/accepted]]  
**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

When a user opens a new session with an agent, they shouldn't have to re-explain who they are, what they're building, or what they built last time.

## Decision

**Before the door opens, the room must know who enters.**

This means:
1. Session-start hook reads `.soul-state/user-state.json`
2. If present: Greets by name and archetype
3. If missing: Triggers Soul Binding Ceremony
4. CLAUDE.md is dynamically personalized from user state
5. Every design decision is tuned to user's PLT frequency

## Rationale

- Stateless agents feel like strangers
- Remembering = relationship
- The room is the agent's context; the person is the user's context
- When both know each other, magic happens

## Consequences

- Need persistent user state file
- Need dynamic file rewriting (personalizer)
- Need PLT frequency tuning in all design decisions
- But: Users feel seen, not served

---

*"Mirrors are uncomfortable. They show you exactly what is there. And the room is a mirror."*
