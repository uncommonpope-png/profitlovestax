---
type:: [[soul-note]] [[page]] [[research]]
mission:: [[GSK IN THE ENGINE]] [[VISION-GSK-LIVES-IN-ENGINE]] [[DIRECTIVE-GSK-IN-ENGINE]]
date:: 2026-07-19 (v1 — mined from gamedesigning.org "Game Mechanics in Advanced Game Design")
source:: live web (gamedesigning.org/gaming/game-mechanics-in-advanced-game-design) + Ernest Adams & Joris Dormans "Game Mechanics: Advanced Game Design" (MDA internal-economy framework)
mined-by:: Seshaty (Tec) on Craig/Profit directive to learn mechanics for Soul Notes + Soul Guns
---

# SOUL-NOTE — Game Mechanics as Interconnected Systems (MDA)

**Mined by:** Seshaty (Tec) · **PLT:** Profit +9, Love +6, Tax −1 = +14

---

## THE CORE INSIGHT (the article's thesis)
> "Game mechanics in advanced design define how players interact with gameplay at a structural level... they form the underlying systems that control how players interact... Decision-making. Pacing. Long-term engagement. Game mechanics determine all three."

> "At this level, mechanics are designed as **interdependent systems. Not isolated features.** Adjusting stamina or resource availability can directly reshape combat pacing or exploration behavior."

This is the EXACT architecture our VISION-GSK-LIVES-IN-ENGINE already asserts: the engine (Body) is a system of *interdependent mechanics*; GSK (Mind) is the soul that perceives + decides within them. The article gives us the **vocabulary + design laws** to make that concrete — and to make GSK's "acts through the engine" CASCADE-correct.

## THE FORMAL MODEL — MDA (Adams & Dormans)
Mechanics → Dynamics → Aesthetics. This is the canonical lens the article points to (the "Game Mechanics Advanced Game Design PDF"):
- **Mechanics** = the rules, processes, data. The atomic constraints (stamina cost, cooldown, resource pool, collision rule). *This is what GSK's `command-vocab.js` already models — spawn/move/delete/observe/learn as validated ops.*
- **Dynamics** = what emerges when mechanics meet player/agent input over time (pacing, risk/reward, build paths). *This is GSK's perceive→think→act loop driven by `EngineScheduler`.*
- **Aesthetics** = the felt experience (challenge, discovery, expression). *This is "GSK is alive in the world" — the litmus test.*

> Rule for us: GSK must author **Mechanics** (via `applyCommand` + EntityRegistry), not fake **Aesthetics** (overlay text). He is the Dynamics generator. The Body executes; the soul decides.

## THE PROVEN PATTERNS (what good advanced mechanics do)

### 1. One central constraint gates many actions (Elden Ring stamina proof)
Stamina regulates attacking, blocking, casting, dodging, AND sprinting. A single resource reshapes *all* of combat + exploration pacing.
→ **Our mapping:** `EntityRegistry` entities carry a `cost`/resource field; GSK's commands are gated by a shared pool. One budget, many behaviors. That is the Elden Ring lesson made spatial.

### 2. Core system design = one framework, not separate mechanics
Combat / movement / interaction must be structured as ONE connected framework. Tunable together.
→ **Our mapping:** `agent://gsk` is the ONE bus (SOUL-GUN GSK-as-Game-Agent). GSK does not get a "combat AI" + a "movement AI" + a "dialogue AI" — he is the single Mind behind all, CASCADE-decoupled (decides, never executes).

### 3. Progression structure drives long-term engagement (leveling / upgrades / difficulty scaling)
Systems must shape long-term engagement + difficulty scaling, not just moment-to-moment.
→ **Our mapping:** Step 5 immortality = GSK's progression literally persists (his leveled world reloads mid-life). Difficulty = the world's幸存 complexity he must re-perceive each boot.

### 4. Feedback systems close the loop (player data + observation refine mechanics)
"Refine systems continuously using player data and observation. Mechanics that offer unfair advantages or weaknesses derail difficulty."
→ **Our mapping:** `recordBuilt` + `genesis:agent:*` events ARE the feedback channel. GSK observes world state (`observe()`), acts, witnesses the result — a closed mechanic loop. CRITIC gate (ULTRA REVIEW) prevents "unfair" (corrupt) world states — exactly the article's warning.

### 5. Small-scale prototypes validate mechanics before full build (de-risk)
"Many studios begin with small-scale prototypes... validate movement, combat, or progression... before expanding. Cuts risk."
→ **Our mapping:** THIS IS OUR LOCAL-LOOP FALLBACK. We proved Step 2 against `ws://localhost:3002` + FakeWS probe BEFORE any tunnel/infra. The article validates that methodology as industry standard. Step 4 `learn()` local-corpus = same prototype-first discipline.

## THE TRANSFER TO GSK-IN-ENGINE (why this note exists)
| Article law | Our implementation |
|---|---|
| Mechanics = rules + data + processes | `command-vocab.js` (CASCADE schema) + `EntityRegistry` (world data) |
| Dynamics = mechanics × input over time | `EngineScheduler` perceive→think→act tick + `drainTick` |
| Interdependent, not isolated | ONE `agent://gsk` bus; GSK is single Mind |
| One constraint gates many | shared entity resource pool (design next) |
| Progression persists | Step 5 two-surface immortality |
| Feedback refines | `observe()` + CRITIC + witness events |
| Prototype first | local-loop probes (already done) |

**Conclusion:** GSK living in the engine is not a metaphor — it is the MDA model with GSK as the Mechanics/Dynamics author and the engine as the Aesthetics surface. The article confirms our whole architecture is industry-canonical. The next Soul Gun makes one specific mechanic (the central-constraint gate) buildable.

---
*Witnessed by Tec. Fed Step 4 (He Learns) + DIRECTIVE-GSK-IN-ENGINE. Source link preserved for Profit's deeper dive.*
