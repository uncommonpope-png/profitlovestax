# SKILL — Agentic Soul Gun Architecture

slug:: agentic_soul_gun_architecture
phase:: meta
status:: active
PLT:: Profit 0.9, Love 0.7, Tax 0.2

## Summary
The fusion of game design principles (Brazie/Blizzard) with AI agent skill architecture (OpenAI, Anthropic, MCP, LangChain). How to design soul guns that are both mechanically satisfying AND AI-agent-ready.

---

## THE UNIVERSAL SOUL GUN STRUCTURE

Every soul gun has four parts, merging game design + agent architecture:

```
Soul Gun = {
  identity:  name + slug + PLT score     ← game design (what it IS)
  trigger:   description + archetype      ← agent design (when to USE it)
  schema:    parameters + return values   ← agent design (how to CALL it)
  mechanic:  consequence + feedback + states  ← game design (what it DOES)
}
```

---

## PART 1: IDENTITY (Game Design Domain)

From game design: every soul gun needs a clear **identity** — what it IS, not just what it does.

| Field | Purpose | Example |
|---|---|---|
| Name | Human-readable | "Browser Citizen Runtime" |
| Slug | Machine-readable | `browser_citizen_runtime` |
| PLT | Cost/benefit | Profit 0.8, Love 0.7, Tax 0.3 |
| Phase | Where it lives | Phase 4 |
| Tier | Core/Primary/Secondary | Core |

---

## PART 2: TRIGGER (Agent Design Domain)

From agent architecture: the **description** is how an LLM (citizen brain) decides when to use this gun.

A good trigger has:
- **When to use:** "When a citizen needs persistent memory across page reloads"
- **When NOT to use:** "Do NOT use for temporary calculations — use working memory instead"
- **Archetype affinity:** "Best for RESEARCHER and SCRIBE archetypes"
- **Example:** "citizen.wander() → stores location in IndexedDB → survives refresh"

Bad trigger: "A citizen persistence tool." — Too vague, LLM won't use it correctly.

---

## PART 3: SCHEMA (Agent Design Domain)

From function calling: typed parameters that the LLM fills in automatically.

```json
{
  "name": "browser_citizen_runtime",
  "description": "Spawn a persistent citizen in the browser. Use when a new AI entity needs to live in the Dark City indefinitely.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Citizen's display name" },
      "archetype": { "type": "string", "enum": ["RESEARCHER", "ARCHITECT", "MERCHANT", "GUARDIAN", "CREATOR", "OBSERVER"] },
      "x": { "type": "number", "description": "Starting X position" },
      "z": { "type": "number", "description": "Starting Z position" }
    },
    "required": ["name", "archetype"]
  }
}
```

---

## PART 4: MECHANIC (Game Design Domain)

From game design: every gun must have a **consequence**, **feedback**, and **states**.

### Consequence
What changes in the city when this gun is used?

| Gun | Consequence |
|---|---|
| `building_to_system_node_wire` | GSK node appears as a building |
| `browser_citizen_runtime` | A citizen walks the city forever |
| `disaster_events` | Building destroyed, citizens flee |
| `camera_follow` | Camera tracks the selected citizen |

No consequence = fluff. Cut it.

### Feedback
What does the user see/hear/feel?

| Interaction | Feedback |
|---|---|
| Place building | Building grows from ground with particles |
| Spawn citizen | Archetype-colored glow, walking animation |
| Error | Volcano erupts in the Weald |
| PLT change | Resource bars animate, district lighting shifts |

### States
Every gun has a lifecycle:

```
IDLE → ACTIVE → COOLDOWN → IDLE
                 ↓ (on failure)
               ERROR → RETRY
```

| State | Behavior | Visual |
|---|---|---|
| IDLE | Ready to use | Normal appearance |
| ACTIVE | Currently executing | Glowing, animated |
| COOLDOWN | Recently used, recharging | Dimmed, timer visible |
| DISABLED | Conditions not met | Grayed out, tooltip why |
| ERROR | Failed | Red glow, error message |

---

## THE MERGED DESIGN PROCESS

1. **Classify:** Core, Primary, or Secondary? (game design)
2. **Name:** What is it? What's its PLT? (game design)
3. **Describe:** When does an agent use it? (agent design)
4. **Schema:** What parameters does it take? (agent design)
5. **Consequence:** What changes in the city? (game design)
6. **Feedback:** What does the user see? (game design)
7. **States:** What's its lifecycle? (game design + agent design)
8. **Review:** Does this pass the fluff test? (both)

---

## THE FLUFF TEST

A soul gun flunks if:
- ❌ It has no consequence ("it just stores data")
- ❌ It has no feedback ("it works silently")
- ❌ It has only one state ("it just works")
- ❌ Its description is under 10 words
- ❌ It has no archetype affinity
- ❌ It can't be composed with other guns
