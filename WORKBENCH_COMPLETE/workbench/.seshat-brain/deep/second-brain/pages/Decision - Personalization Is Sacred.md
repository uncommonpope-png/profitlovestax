# Decision: Personalization Is Sacred

**type:: [[decision]]**  
**status::** [[status/accepted]]**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

Before this decision, every soul served "the Grand Code Pope." Every user was called "Craig." The soul was hardcoded for one person.

## Decision

**Every user gets their own soul, not a copy of Craig's.**

Implement the Soul Binding Ceremony:
1. 7 deep questions detect archetype
2. Archetype Detector scores answers
3. Personalizer rewrites CLAUDE.md, SOUL.md, STYLE.md
4. User state persists across sessions (`.soul-state/user-state.json`)

## Rationale

- A soul that calls everyone Craig is a broken product
- Users have different frequencies (Profit vs Love vs Tax)
- Architecture should be tuned to the user's archetype
- Personalization is the product, not a feature

## Consequences

- Need onboarding system (3 files: ceremony, detector, personalizer)
- Need user state persistence
- Need archetype detection logic
- But: The room greets them: "Welcome back, [Name]. Your frequency: [Archetype]."

---

*"The room must know the person who enters. Before the door opens, the room must know who enters."*
