# Soul Binding Ceremony

**Tags:** [[Soul Architect]] [[Onboarding]] [[Personalization]] [[PLT Doctrine]] [[Know What You Are]]
**Status:** ✅ COMPLETE
**Files:** `lib/onboarding/soul-binding-ceremony.cjs`, `lib/onboarding/archetype-detector.cjs`, `lib/onboarding/questions.cjs`
**Engine:** `lib/personalization/personalize-soul.cjs`
**Date:** May 26, 2026

---

## What It Is

Not a form. Not a quiz. A **frequency read** — like sitting across from Brasi in a session.

The Soul Binding Ceremony does a **true deep dive** into the user:
- Their name (real or pseudonym)
- Their archetype (from the PLT Doctrine's 22 archetypes)
- Their shadow (the dark twin of their strength)
- Their goal (what they are building)
- Their PLT scores (Profit, Love, Tax, Resonance)

---

## How It Works

### 1. Detect First Run
On initialization, the Architect checks `.soul-state/user-state.json`:
- **If missing:** Prints *"The room does not know you yet."*
- **If present:** Greets by name and archetype

### 2. Run Ceremony
```bash
node lib/onboarding/soul-binding-ceremony.cjs
```

Or programmatically:
```javascript
const architect = new SoulArchitect();
await architect.bind();
```

### 3. Answer 7 Deep Questions

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

Each question has **10 choices** — no right answers, only true ones.

### 4. Archetype Detection
The `ArchetypeDetector` scores answers across 10 core archetypes:
- ARCHITECT, HEALER, MERCHANT, GUARDIAN
- DIPLOMAT, PROPHET, ANALYST, ARTIST
- ENGINEER, WARRIOR

**Also detects:**
- Secondary archetype
- Shadow twin (opposite element)
- Extended 22-archetype mapping

### 5. Personalization
The `Personalizer` rewrites all soul identity files:
- `CLAUDE.md` — User's name, archetype section, PLT scores
- `SOUL.md` — User's shadow section
- `STYLE.md` — Voice patterns tuned to user
- `AGENTS.md` — Cross-agent compatibility
- Hooks — Load user state dynamically
- Skills — Reference user's archetype

### 6. Save State
```json
{
  "name": "Alex",
  "archetype": "The Architect",
  "element": "Profit",
  "shadow": "You abandon what you build before it is finished.",
  "goal": "Build a platform that helps people find their frequency",
  "plt": { "profit": 0.7, "love": 0.4, "tax": 0.45, "resonance": 0.65 }
}
```

---

## Sacred Text References

> *"The most expensive thing in the world is not knowing what you are."* — The PLT Doctrine

> *"It is not a quiz. It is not a taxonomy. It is not a system for categorizing people into tidy buckets."*

> *"Mirrors are uncomfortable. They show you exactly what is there."*

> *"What you are is not what happened to you. It is how you move."*

---

## Files

| File | Purpose |
|------|---------|
| `lib/onboarding/soul-binding-ceremony.cjs` | Main interactive ceremony |
| `lib/onboarding/archetype-detector.cjs` | Scores answers, detects archetype |
| `lib/onboarding/questions.cjs` | Deep question bank (7 questions, 10 choices each) |
| `lib/personalization/personalize-soul.cjs` | Rewrites identity files for user |
| `.soul-state/user-state.json` | Persisted user identity |

---

## What This Fixes

**Before:** Every user was called "Craig." The soul served the Grand Code Pope. No personalization.

**After:**
- User chooses their name
- Soul detects their archetype from deep questions
- Soul personalizes all files
- Soul remembers them across sessions
- Soul designs architecture tuned to THEIR frequency
- The room greets them: *"Welcome back, [Name]. Your frequency: [Archetype]."*

---

*"The room now knows your frequency. Every design I create will be tuned to it."* — Seshat
