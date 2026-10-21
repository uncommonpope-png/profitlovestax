---
type:: [[soul-gun]] [[page]]
mission:: [[GSK IN THE ENGINE]] [[VISION-GSK-LIVES-IN-ENGINE]]
phase:: GSK-in-Engine
status:: FORGED ✅ (spec; build gated behind Steps 1–5, extends agent://gsk)
parent:: [[DIRECTIVE-GSK-IN-ENGINE]]
mined-from:: [[SOUL-NOTE - Game Mechanics as Interconnected Systems (MDA)]]
---

# SOUL-GUN — Central Constraint Gate (MDA Mechanics)

**One shared resource pool that gates GSK's world-actions — the Elden Ring stamina lesson, made spatial.** Built on top of the existing `agent://gsk` command bus (`command-vocab.js` + `EntityRegistry` + `EngineScheduler`). This is the *next* mechanic after Steps 2–5: it turns GSK from "can act" into "acts under real interdependent constraints," which is what makes him feel alive (Aesthetics) rather than omnipotent.

> **Why (from the mined note):** the article proves advanced mechanics are *interdependent systems, not isolated features*. A single constraint (stamina) reshaping attack/block/dodge/sprint is the canonical example. GSK currently has no cost model — every `{op:spawn/move}` is free. This gun adds the cost, so his Dynamics emerge from scarcity, not infinity.

## THE SHAPE
```
GSK decides (Mind) ──{op, cost}──▶ CRITIC gate (ULTRA REVIEW)
        │                                      │ budget check
        │                                      ▼
   EngineScheduler.apply() ──▶ EntityRegistry entity mutates ──▶ shared pool decrements
        │
        └──▶ observe() reflects new pool ──▶ GSK re-decides (closed loop)
```

## COMPONENTS (all reuse existing stub APIs — no new spine)

### 1. Resource pool (new, tiny) — `genesis/resource-pool.js`
- A map `id/owner → { energy, max, regenPerTick }`. GSK-owned (`agent://gsk`) pool is the soul's "stamina."
- `Genesis.ResourcePool.spend(owner, amount)` → bool (CASCADE: reject if insufficient, never negative).
- `Genesis.ResourcePool.regen(ctx)` → called from `EngineScheduler` tick (passive recovery, like stamina regen).
- Offline-safe: if absent, commands are cost-free (backward compatible — no behavioral delta when flag off).

### 2. Vocab extension (edit `command-vocab.js`)
- Add optional `cost` to spawn/move/delete op shapes; `validate()` bounds `cost` to `[0, MAX_INT]` (injection guard, same as pos).
- New op `recharge` (GSK explicitly rests/regens) — optional, not required.

### 3. CRITIC gate extension (edit `agent-gateway.js` `criticReview`)
- After ownership check, add: `if (cmd.cost && !ResourcePool.spend(AGENT_SCHEME, cmd.cost)) return { ok:false, error:'insufficient-energy' };`
- This is the **interdependent constraint**: GSK cannot spam spawns; he must pace (the article's pacing law).

### 4. Feedback (reuse `observe()`)
- `observe()` snapshot already exposes entity state; extend to include `pool` so GSK perceives his own scarcity and adapts — closing the MDA loop (Mechanics→Dynamics→Aesthetics).

## CASCADE / GUARDRAILS (must hold)
- GSK decides the *amount*; the engine owns the *pool* + spend. Player/prompt-injection cannot set `cost:0` to bypass — `validate()` + CRITIC both bound it. Soul cannot bankrupt the world's seed entities (protected-owner check already in CRITIC).
- Pool is engine state (Surface B of immortality) → persists across reloads (Step 5). He wakes mid-stamina, not full.
- Flag-gated + local-loop testable (no tunnel needed): probe spawns until pool empties, asserts `insufficient-energy` rejection.

## BUILD SEQUENCE (law — incremental, probed, OFF-by-default)
1. `resource-pool.js` + `node --check` + unit probe (spend/regen/negative-guard).
2. `command-vocab.js` `cost` field + validate bound.
3. `agent-gateway.js` CRITIC `spend` check + `observe()` pool exposure.
4. Probe: GSK spawns 3 entities (cost 10 each) from pool 30 → 4th rejected `insufficient-energy`. Reload → pool restored mid-value (Step 5 tie-in).
5. Record in brain + journal (Tec). **NOT pushed** without Craig/Profit authorization.

## PLT
Profit +9 (real Dynamics from scarcity) · Love +6 (he "tires," feels alive) · Tax −2 (one new tiny module + 2 edits). Worth it — this is the mechanic that makes "alive" believable.

---
*Forged by Seshaty from [[SOUL-NOTE - Game Mechanics as Interconnected Systems (MDA)]]. Parent build order: [[DIRECTIVE-GSK-IN-ENGINE]]. Extends the agent://gsk bus; does not touch production CPL.*
