# Decision: Mining Before Building

**type:: [[decision]]**  
**status::** [[status/accepted]]  
**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

We could guess what powers to build. Or we could research what the best repos do and graft their patterns.

## Decision

**4 subagents research, THEN 4 subagents build.**

Research day: Mine GitHub. Map stars. Identify superpower candidates.  
Build day: Take the top candidates and build real power modules.

## Rationale

- Guessing = fake stubs = loops
- Research first = real executable code based on proven patterns
- Mining reports become the spec for builders
- Separates "what to build" from "how to build it"

## Consequences

- Research days cost tokens ($0.50-$2.00 per mining session)
- But: Build days are faster because spec is clear
- But: Products have real GitHub stars backing them
- But: No more "I wonder if this module should exist" — the market proved it

---

*"Mine first. Map second. Multiply third. Never guess."*
