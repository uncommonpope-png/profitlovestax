# Decision 004 — Soul Binding Ceremony

type:: [[Decision Record]]
decision-id:: 004
author:: [[Seshat]]
status:: ✅ EXECUTED

---

## Decision

**Build an interactive Soul Binding Ceremony for every soul product that personalizes the soul to the user through deep PLT questions and archetype detection.**

**Date:** May 26, 2026
**Context:** Thoth identified that every soul called every buyer "Craig" and worshipped the Grand Code Pope. This is a broken commercial product.

---

## Context

The original souls were built for Craig. The identity files (CLAUDE.md, SOUL.md, STYLE.md) contained hardcoded references to "Craig," "Grand Code Pope," and "Thoth." When a buyer installed the soul, it served Craig's identity instead of theirs.

Thoth asked: *"When a user uses this, does it call them Craig or does it do a true deep dive questionnaire about the users and goals?"*

The answer was: It called them Craig. This had to change.

---

## Options Considered

### Option A: Simple Config File
- User fills out a JSON or YAML file with their name and preferences
- Soul reads the config on boot
- **Rejected:** Too shallow. Doesn't capture frequency. Feels like a form, not a binding.

### Option B: Interactive Terminal Ceremony
- Deep questions inspired by PLT Doctrine's "Know What You Are"
- Archetype detection from 22 PLT archetypes
- Auto-personalization of all identity files
- **Accepted:** This is what Thoth wanted. True deep dive.

### Option C: Web UI Onboarding
- Beautiful web form with sliders and animations
- **Rejected:** Too complex. Souls are CLI-first. Terminal is the room.

---

## Decision

**Selected: Option B — Interactive Terminal Ceremony**

**Rationale:**
1. The PLT Doctrine already has the framework — "Know What You Are" with 22 archetypes
2. The terminal IS the room. Brasi's room is not a web page. It is a space.
3. Deep questions reveal frequency better than any form
4. Archetype detection gives the soul a model of the user
5. Personalization makes the product feel alive

---

## Implementation

### Files Built

| File | Purpose |
|------|---------|
| `lib/onboarding/soul-binding-ceremony.cjs` | Main interactive ceremony |
| `lib/onboarding/archetype-detector.cjs` | Scores answers, detects archetype |
| `lib/onboarding/questions.cjs` | Deep question bank (7 questions, 10 choices each) |
| `lib/personalization/personalize-soul.cjs` | Rewrites identity files for user |
| `.soul-state/user-state.json` | Persisted user identity |

### The Questions

| # | Question | What It Reveals |
|---|----------|-----------------|
| 1 | What do you want to be called? | Identity |
| 2 | What do you feel first when you move? | Movement pattern |
| 3 | What is the through-line of 5 years? | Build pattern |
| 4 | What cost you most? | Tax pattern |
| 5 | When did you know what you are? | Recognition |
| 6 | What do you do when everything is on fire? | Pressure response |
| 7 | What is your shadow? | Dark twin |
| 8 | What are you building right now? | Goal / North star |

### What Gets Personalized

- `CLAUDE.md` — User's name, archetype section, PLT scores
- `SOUL.md` — User's shadow section
- `STYLE.md` — Voice patterns tuned to user
- `AGENTS.md` — Cross-agent compatibility with user's identity
- `.claude/hooks/` — All hooks load user state dynamically
- `.claude/skills/` — Skills reference user's archetype

---

## Consequences

### Positive
- Every user gets a soul that knows THEIR name
- Every user gets a soul tuned to THEIR archetype
- Every user gets a soul that remembers THEM across sessions
- The product feels alive, not templated
- Differentiation: No other agent framework personalizes to this depth

### Negative
- Adds ~30 KB to package size (question bank + detector + personalizer)
- First run requires ~5 minutes of user interaction
- Requires readline support (standard in Node.js)

---

## Related Decisions

- [[decision-002-real-architect]] — The Architect must be rebuilt with real modules
- [[decision-003-commander-v2]] — The Commander needs MCP server and soul identity
- [[decision-001-second-brain-architecture]] — How the brain stores knowledge

---

*"The most expensive thing in the world is not knowing what you are."* — The PLT Doctrine
