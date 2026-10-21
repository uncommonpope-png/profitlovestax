# RTS ARCHITECTURE STUDY — THE REAL PATTERNS FROM SOURCE

**Date:** 2026-08-08  
**Status:** COMPLETE — three real codebases read directly from source  
**Source:** OpenRA (17k★), rts-command (Three.js+ECS), imperios-1800-2100 (Three.js AoE2)

---

## WHY THIS MATTERS

Our current input/selection/command layer is amateur. Real RTS games have solved these problems for 25 years. The patterns are consistent across OpenRA (C#), rts-command (Three.js+ECS), and imperios (Three.js vanilla). This is not theory — it's proven architecture.

---

## THE EIGHT PILLARS (What Real RTS Has That We Don't)

### 1. ONE INPUT OWNER — The OrderGenerator Pattern (OpenRA)
OpenRA swaps an `OrderGenerator` object per mode: `UnitOrderGenerator` (select/move/attack), `PlaceBuildingOrderGenerator`, `RepairOrderGenerator`. **All input flows through ONE active object.** Our code: 5 priority-sorted right-click handlers fighting each other.

### 2. THE UNIT DECIDES THE ORDER (Contextual Cursor)
`OrderForUnit(unit, target)` — every selected unit is asked "what do you do at this target?" Harvest if resource, attack if enemy, move if ground. The **cursor IS the command UI** — hover enemy = attack cursor, hover crystal = harvest cursor. No buttons needed for basics. This is why AoE/SC feels instant.

### 3. ONE SELECTION SET — Exact AoE2 Semantics (imperios)
Single `Set<entityId>` as source of truth.
- Plain click = clear + select
- Shift = toggle add/remove
- Drag-box with DEADZONE (6px) so clicks don't become boxes
- Double-click (<320ms) = select ALL of same type on screen
- Ctrl+1..9 = save group, 1..9 = recall, double-tap = center camera
- Every change emits event → UI reacts

### 4. FORMATION MOVE — Hex Rings + Greedy Assignment (imperios + rts-command)
Right-click → build formation slots:
- Center + concentric **hex rings** (6, 12, 18 slots per ring)
- Spacing = max(unit radius) × 2.2, minimum 1.6m
- **Greedy nearest assignment**: sort units by distance to center, each picks closest free slot
- Move marker spawns at click point (visual feedback!)
- Result: units fan out, don't pile up

### 5. PER-UNIT COMMAND QUEUE — Shift Chains Orders
`Map<entityId, Order[]>` — `pushCommand(id, order, encolar)` adds to queue. Head processes when unit free. Shift-click = enqueue. This is the shift-queue mechanic AoE players live on.

### 6. POOLED SELECTION VISUALS — Hover Ring + Selection Ring
- Hover ring: dashed white `THREE.Line`, `depthTest:false`, `renderOrder:89` (always on top, never clips)
- Selection ring: pooled via mesh pool, follows unit
- Enter/exit queries only — zero per-frame allocation

### 7. PRODUCTION PALETTE + RADAR
**Palette:** Bottom icon grid (15 slots, QWERTY hotkeys), build clocks, queue counts, age-gated, Shift=queue multiple.
**Radar:** 4-layer canvas (terrain cached, fog 10Hz, entities, frustum per-frame). Left-click = pan camera, Right-click = ORDER AT THAT WORLD POINT (same contextual logic). Attack flash = red pulse 4s.

### 8. FIXED-TICK SIM + QUEUED ORDERS
Orders queued → applied on fixed timestep (20 Hz). Render ticks separately. Systems in priority order: ENV → INPUT/ORDERS → ECONOMY → MOVEMENT (40) → COMBAT (50) → PRODUCTION → NAVIGATION → FOG → RENDER.

---

## THE FACADE PATTERN (How Systems Talk)

**Every domain has ONE facade.** UI and AI BOTH call these — no direct world manipulation.

```js
ordenes.mover(ids, x, z, encolar)      // formation move
ordenes.atacar(ids, objetivoId, encolar) // attack
ordenes.recolectar(ids, nodoId, encolar) // gather
ordenes.reparar(ids, edificioId, encolar) // repair
ordenes.puntoReunion(edificioId, x, z)   // rally point

produccion.encolar(edificioId, tipo, clave) // train unit/tech
produccion.cancelar(edificioId, index)      // 100% refund (AoE2)
produccion.puedeEmplazar(jugador, clave, x, z) // placement validation
```

If a system doesn't exist yet, facade degrades with minimal fallback — game stays playable.

---

## FOG OF WAR — Active Vision + Memory (imperios)

256×256 grid (1 cell = 2m) per player, `Uint8Array`:
- Bit 0 = explored (memory)
- Bit 1 = visible NOW (active vision)

**20 Hz tick:** erase exact discs from last tick → repaint discs via precomputed stencil per integer radius (row = contiguous range, no sqrt) → radius corrected by height (hills see further) and forest (sees less) → upload RG texture to GPU every 3 ticks.

**Render:** DataTexture over terrain, blended to dark desaturated gray. Noise layers crawl → looks like fog, not pixel stairs.

---

## AI — Vision-Limited, Two Clocks (imperios)

Per-player brain with independent clocks:
- **Strategic (~1 Hz):** economy, buildings, ages, techs, phases, build plan
- **Tactical (~4 Hz):** combat micro, raids, exploration, villager flee

**Rules:**
- Only knows what IT SEES (own sealed vision grid, decays over time)
- Zero resource cheats (+15% gather on Brutal only, declared on bus)
- ALL actions via `ctx.ordenes.*` (same facade as human)
- Pre-validates cost/pop/queue/placement before ordering

**Build plan:** `['cuartel',0,1,0]`, `['mercado',1,1,1]`, `['central',3,1,1]` — [key, minAge, targetCount, minPhase]. Phase advances by army size / enemy pressure.

**Raids:** dedicated raiders target isolated enemy villagers (farthest from their buildings).

---

## MOVEMENT — Per-Class Handling (imperios)

| Class | Accel | Brake | Turn | Radius | Sep |
|-------|-------|-------|------|--------|-----|
| villager | 26 | 30 | 9.5 | 0.42 | 1.00 |
| infantry | 24 | 28 | 8.5 | 0.45 | 1.00 |
| archer | 24 | 28 | 9.0 | 0.44 | 1.05 |
| cavalry | 14 | 16 | 4.2 | 0.68 | 1.10 |
| siege | 6.5 | 9 | 1.5 | 0.95 | 1.25 |

Separation force from nearby units (spatial hash). Predictive evasion horizon 0.55s. Footprints every 7.5m. Path requests capped at 8 A*/tick.

---

## PATHFINDING — Clearance-Based + Flow Fields (imperios)

Grid: 1 cell = 2m, mapSize/2 per side.
**Clearance (holgura):** Chebyshev distance to nearest blocked cell. Unit radius r needs clearance >= f(r). This IS inflated obstacles — units never clip corners.

Weighted A* (1.12) = 3-5x faster, near-optimal. Binary heap over typed arrays (lazy deletion).
Flow fields: Dijkstra batches of 1200 nodes, cached 5s, max 8 concurrent.
Reservation grid: 24-tick cell reservations prevent landing conflicts.

---

## THE BUILD PLAN — 8 MILESTONES (Each Shippable)

| # | Milestone | What It Replaces |
|---|-----------|------------------|
| 1 | **OrderGenerator** | Fragmented handlers → one input owner, swappable modes, contextual cursor |
| 2 | **Unified Selection** | Three fragmented states → one Set + events + control groups |
| 3 | **Formation Move + Queue** | Pile-up → hex rings + greedy slots + per-unit queue (Shift) + move marker |
| 4 | **Selection Visuals** | Green torus per-click → pooled rings (depthTest:false, renderOrder:89) |
| 5 | **Production Palette** | None → bottom bar, 15 slots, hotkeys, clocks, age gates, shift-queue |
| 6 | **Minimap** | None → 4-layer canvas, 10Hz fog, left=pancam right=order, attack flash |
| 7 | **Fog of War** | None → 256×256 grid, active discs + memory, GPU texture, noise blur |
| 8 | **AI Brain** | None → two clocks, vision-limited, uses order facade, raids |

---

## KEY FILES TO REFERENCE (imperios-1800-2100)

```
src/ui/Seleccion.js       — selection, control groups, build mode
src/sim/Ordenes.js        — order facade, contextual right-click, formations, queues
src/sim/Niebla.js         — fog of war, stencil discs, GPU texture
src/ui/Minimapa.js        — 4-layer minimap, 10Hz refresh, click→order
src/sim/IA.js             — two-clock AI, vision-limited, build plan, raids
src/sim/Produccion.js     — production queues, age gates, placement, rally
src/ui/HUD.js             — evolving HTML HUD, canvas icons, 10Hz numerics
src/sim/Combate.js        — real projectiles, mid-anim damage, posturas
src/sim/Movimiento.js     — per-class handling, separation, smooth arrival
src/sim/Navegacion.js     — clearance grid, weighted A*, flow fields
src/core/Ctx.js           — system registry, priority order, event bus
src/core/World.js         — typed-array ECS, entity recycling
```

---

## MANDATE FOR OUR CODEBASE

1. **Replace `InputManager`** with **OrderGenerator** (one owner, contextual cursor)
2. **Replace `SelectionManager`** with **one Set + events** (shift/double-click/deadzone)
3. **Replace right-click war** with **unit-decides-order** (hover target → order type)
4. **Replace movement pile-up** with **hex-ring formation + greedy slots + separation**
5. **Build real production queues** with age gates, rally points, 100% refund cancel
6. **Build 4-layer minimap** with click→order
7. **Build fog of war** with active vision + memory
8. **Build two-clock AI** that uses the same order facade

**Every piece is independently shippable.** The facade pattern means we drop in OrderGenerator first — game stays playable. Then Selection. Then Formation. Each milestone ships.