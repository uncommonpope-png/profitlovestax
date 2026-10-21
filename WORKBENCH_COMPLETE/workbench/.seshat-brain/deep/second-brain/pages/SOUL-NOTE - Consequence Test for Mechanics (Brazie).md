---
type:: [[soul-note]] [[page]] [[research]]
mission:: [[GSK IN THE ENGINE]] [[VISION-GSK-LIVES-IN-ENGINE]] [[DIRECTIVE-GSK-IN-ENGINE]]
date:: 2026-07-19 (v1 — mined from gamedesignskills.com "Video Game Mechanics: A Beginner's Guide")
source:: live web (gamedesignskills.com/game-design/video-game-mechanics — Alexander Brazie, 25yr Blizzard/Riot/Moon designer)
mined-by:: Seshaty (Tec) on Craig/Profit directive to learn mechanics for Soul Notes + Soul Guns
pair:: [[SOUL-NOTE - Game Mechanics as Interconnected Systems (MDA)]]
---

# SOUL-NOTE — The Consequence Test for Mechanics (Brazie)

**Mined by:** Seshaty (Tec) · **PLT:** Profit +8, Love +5, Tax −1 = +12

---

## THE CORE INSIGHT (Brazie's definition)
> "Video game mechanics are how players and the rest of the fundamental interlocking pieces of a game — including rules, challenges, goals, actions, strategies, game states — **interact with each other in a meaningful way**."

> "What can be considered a mechanic in one game is **fluff** in another, and the key identifier is whether it **creates consequences**."

> "A good sign of a strong mechanic is one that **interacts with a wide variety of different situations** or **shapes how you play the entire game**."

This is the **missing half** of the MDA note. MDA told us the *layers* (Mechanics→Dynamics→Aesthetics). Brazie gives us the **filter**: a mechanic is real only if it has *consequences*; otherwise it's fluff. For GSK-in-engine this is a litmus we can actually run in code.

## THE CONSEQUENCE TEST (our code-readable version)
An `{op}` from GSK is a **mechanic**, not fluff, iff:
1. **It changes world state** — `EntityRegistry` mutates (spawn/move/delete applied).
2. **The world reacts** — other entities / systems observe the change and their Dynamics shift (`observe()` reflects it; another GSK decision is informed).
3. **It persists or propagates** — the change survives a tick (and via Step 5, a reload) OR triggers a downstream system (CRITIC, feedback event, resource cost).

> If GSK spawns an entity and **nothing** reacts, references it, or persists it → that spawn was **fluff**. The engine must make his acts *consequential* or he is not "alive in the world" — he is a screensaver.

## KINDS OF MECHANICS Brazie implies (mapped to GSK's bus)
| Mechanic kind | GSK-in-engine form | Consequence? |
|---|---|---|
| **Spatial** (position reveals/changes path) | `move` entity → blocks line-of-sight / opens route in `EntityRegistry` | ✅ if others perceive it |
| **Resource** (cost gates action) | our `Central Constraint Gate` (stamina pool) | ✅ bounded action |
| **State/goal** (flags flip world) | `spawn` a `goal` entity → GoalEngine reacts | ✅ if GoalEngine reads it |
| **Feedback** (action → response loop) | `observe()` + witness events close loop | ✅ Dynamics emerge |
| **Emergent** (simple rules → complex play) | many GSK entities + one bus → unplanned patterns | ✅ if interactions are real |
| **Fluff** (VFX only, no state change) | panel text with no `EntityRegistry` mutation | ❌ reject as non-mechanic |

## WHY THIS MATTERS FOR THE VISION
Our litmus test ("GSK living in the world, thinking/looking/acting via the tick") is **literally Brazie's consequence test**. A visitor must see GSK's act *change the world* and the world *respond*. The `agent://gsk` bus already carries consequence-capable ops; what was missing was the **reaction layer** — the world must notice. The next Soul Gun builds that reaction layer.

## TRANSFER (pairs with MDA note)
- **MDA note** = *structure* (layers + interdependence).
- **This note** = *validity* (consequence or fluff).
- Together: GSK authors **consequential, interdependent mechanics** → real Dynamics → felt Aesthetics (alive).

---
*Witnessed by Tec. Pairs with [[SOUL-NOTE - Game Mechanics as Interconnected Systems (MDA)]]. Feeds Step 4 (He Learns) + the reaction-layer Soul Gun.*
