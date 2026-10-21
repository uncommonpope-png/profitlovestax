# SKILL — Soul Gun Design Principles

slug:: soul_gun_design_principles
phase:: meta
status:: active
source:: Alexander Brazie (Blizzard/Riot, 25+ years), Jesse Schell, game design best practices
PLT:: Profit 0.9, Love 0.7, Tax 0.2

## Summary
How to design a good soul gun. Principles extracted from professional game design — Blizzard, Riot, and Nintendo patterns applied to our Spatial OS.

---

## PRINCIPLE 1: Core / Primary / Secondary Hierarchy

Every soul gun must be classified.

| Tier | Role | Example | How Many |
|---|---|---|---|
| **Core** | The reason the city exists | `building_to_system_node_wire` | 1-3 |
| **Primary** | Supports the core | `browser_citizen_runtime` | 5-10 |
| **Secondary** | Adds depth, variety, surprise | `disaster_events` | As many as needed |

A gun that doesn't support the core or add meaningful variety is fluff. Cut it.

---

## PRINCIPLE 2: Mechanics Create Consequences

A flaming arrow that burns vines → mechanic.
A flaming arrow that just looks cool → fluff.

Every soul gun must answer: **what changes in the city when this gun is used?**

| Good Soul Gun | Consequence |
|---|---|
| `building_to_system_node_wire` | A GSK node appears in the city |
| `browser_citizen_runtime` | A living citizen walks the city forever |
| `disaster_events` | A building is destroyed, citizens react |
| `camera_first_person` | The user sees the city from street level |

If the answer is "nothing changes" — the gun is fluff. Redesign or cut it.

---

## PRINCIPLE 3: Throughput is NOT a Mechanic

Two weapons that both deal damage but at different rates → same mechanic, different numbers.
Two weapons where one stuns and one burns → different mechanics.

A soul gun is not defined by its PLT values. It's defined by what it DOES differently.

| Wrong (Throughput) | Right (Mechanic) |
|---|---|
| `spawn_building` (costs 100P) | `spawn_building` also claims territory for the citizen's group |
| `citizen_chat` (uses GPT) | `citizen_chat` remembers past conversations, changes relationship |
| `city_terminal` (runs commands) | `city_terminal` output changes building colors based on success/failure |

---

## PRINCIPLE 4: Context Makes Mechanics Meaningful

A mechanic is only as good as the number of situations where it matters.

Hookshot in Zelda → useful everywhere → great mechanic.
Cane of Somaria → useful in 3 situations → forgettable.

Design questions for every gun:
- **Enemies:** What opposes this gun? (PLT imbalance, citizen conflict, GSK errors)
- **Friends:** What does this gun enable for other guns? (combo potential)
- **Environment:** Where in the city does this gun matter? (which district)

---

## PRINCIPLE 5: Feedback is Sacred

Every soul gun usage must produce visible feedback.

| Gun | Feedback |
|---|---|
| Place building | Building grows from ground with particles |
| Spawn citizen | Citizen appears with archetype-colored glow |
| Error occurs | Volcano erupts in the Weald |
| PLT changes | Resource bars animate, district lighting shifts |
| Chat with citizen | Thought bubble appears, citizen faces you |

---

## PRINCIPLE 6: States Matter

Every interactive element has states: idle, active, cooldown, disabled, error.

A soul gun that always works the same way is boring. Guns should have:
- **Active state:** Gun is ready to use
- **Cooldown:** Gun was just used, needs time to recharge
- **Disabled:** Conditions aren't met (not enough PLT, wrong district)
- **Upgrade:** Gun has been improved through use

---

## APPLICATION TO OUR CATALOG

With these principles, review every soul gun in the catalog:
1. Is it core, primary, or secondary? — If unclassifiable, reconsider.
2. What consequence does it create? — If none, it's fluff.
3. Does it have a unique behavior or just different numbers? — If just numbers, redesign.
4. How many situations does it work in? — If 1-2, expand or cut.
5. What feedback does it give? — If nothing visible, add it.
6. Does it have states? — If always the same, add cooldown/disabled/upgrade.
