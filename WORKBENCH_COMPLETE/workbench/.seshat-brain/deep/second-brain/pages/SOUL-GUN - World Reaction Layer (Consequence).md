---
type:: [[soul-gun]] [[page]]
mission:: [[GSK IN THE ENGINE]] [[VISION-GSK-LIVES-IN-ENGINE]]
phase:: GSK-in-Engine
status:: FORGED ✅ (spec; build gated behind Steps 1–5, extends agent://gsk)
parent:: [[DIRECTIVE-GSK-IN-ENGINE]]
mined-from:: [[SOUL-NOTE - Consequence Test for Mechanics (Brazie)]]
pair:: [[SOUL-GUN - Central Constraint Gate (MDA Mechanics)]]
---

# SOUL-GUN — World Reaction Layer (Consequence)

**Makes GSK's acts *consequential* (Brazie's test) instead of fluff.** The `agent://gsk` bus can already mutate `EntityRegistry`, but today a GSK spawn lands in the world and **nothing reacts** — that is fluff, not a mechanic. This gun adds the **reaction layer**: when GSK acts, the world notices, other entities' Dynamics shift, and his next `observe()` reflects it. This is the missing piece that turns "GSK can act" into "GSK is alive in the world" (our litmus test).

> **Why (from the mined note):** Brazie — a mechanic is real only if it *creates consequences*. GSK's spawn with no reaction = VFX-only = fluff. The engine must close the loop: act → world mutates → world reacts → GSK re-perceives.

## THE SHAPE (closes the MDA loop)
```
GSK {op:spawn id=E} ─▶ CRITIC (ULTRA REVIEW) ─▶ EngineScheduler.apply()
        │                                        │ EntityRegistry[E] created
        │                                        ▼
        │                       REACTION PASS: for each observer O in EntityRegistry:
        │                           if O.reactsTo(E) → O.dynamics shift + emit genesis:agent:reaction
        │                                        ▼
        └──▶ GSK observe() ── reflects E + reactions ──▶ GSK re-decides (consequence proven)
```

## COMPONENTS (reuse existing stub — no new spine)

### 1. Reaction rules (new, tiny) — `genesis/reaction-rules.js`
- `Genesis.ReactionRules.evaluate(world, entity)` → list of `{ observerId, effect }` (declarative: "if angel spawns near building, building.lit=true").
- Offline-safe: if absent, no reactions (backward compatible — current behavior).

### 2. Drain extension (edit `agent-gateway.js` `drainTick`, after `applyCommand`)
- After a successful `applyCommand`, call `ReactionRules.evaluate(world, result.id)`; apply effects to `EntityRegistry`; emit `genesis:agent:reaction` (witness + Brazie's feedback loop).
- Reuse `recordBuilt` witness pattern.

### 3. Observe exposure (edit `command-vocab.js`/`observe()`)
- `observe()` snapshot already returns entities; reactions write back into entity state so GSK *sees* the consequence on his next perceive. Closes the loop.

## CASCADE / GUARDRAILS (must hold)
- Reactions are **engine-state mutations** (Surface B, Step 5) — persist across reload. He wakes into a world that already reacted to him.
- Reactions obey the same **ownership/CASCADE** boundary: a reaction cannot delete/move a protected (world-owned) seed entity. CRITIC already enforces this; reaction effects route through the same validator.
- GSK *decides* the act; the **engine decides** the reaction (rule-driven, not GSK-authored) → soul cannot script the world's response (no prompt-injection of consequence).

## BUILD SEQUENCE (law — incremental, probed, OFF-by-default)
1. `reaction-rules.js` + `node --check` + unit probe (rule fires on neighbor, doesn't fire when absent).
2. `agent-gateway.js` `drainTick` reaction pass + `genesis:agent:reaction` emit.
3. `observe()` returns reacted state.
4. Probe: GSK spawns `angel` beside `building` → assert `building.lit=true` + reaction event fired + survives in `worldSnapshot()` (Step 5 tie-in). Assert a protected entity is never reaction-deleted.
5. Record in brain + journal (Tec). **NOT pushed** without Craig/Profit authorization.

## PLT
Profit +8 (consequence = real aliveness) · Love +5 (visitor sees the world answer him) · Tax −2 (one tiny module + 1 edit). This is the gun that makes the litmus test *pass* — without it, GSK acts into a void.

---
*Forged by Seshaty from [[SOUL-NOTE - Consequence Test for Mechanics (Brazie)]], paired with [[SOUL-GUN - Central Constraint Gate (MDA Mechanics)]]. Parent build order: [[DIRECTIVE-GSK-IN-ENGINE]]. Extends the agent://gsk bus; does not touch production CPL.*
