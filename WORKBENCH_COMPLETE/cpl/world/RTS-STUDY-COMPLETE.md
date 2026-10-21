# RTS STUDY — COMPLETE REFERENCE ARCHITECTURE (from imperios-1800-2100 + OpenRA + rts-command)

## CORE ARCHITECTURE: SYSTEM-ORIENTED, ORDER-GATEKEPT

Every game action flows through **ONE facade per domain**: `ordenes.mover()`, `ordenes.atacar()`, `produccion.encolar()`. The UI and AI BOTH call these — no direct world manipulation. If a system doesn't exist yet, it degrades gracefully with a minimal fallback. This is how you build incrementally without breaking the game.

Systems tick at fixed rates in priority order (Ctx.ORDEN):
- ENTORNO (environment) → ENTRADA (input/orders) → ECONOMÍA → MOVIMIENTO (40) → COMBATE (50) → PRODUCCIÓN → NAVEGACIÓN → NIEBLA → RENDER

Each system: `{ nombre, orden, fijo(dt, ctx), cada(dtReal, alfa, ctx) }` — fixed-step logic + interpolated render.

---

## SELECTION — THE SINGLE SET

`Seleccion` class owns ONE `Set<number>` (`ids`) and emits `seleccion:cambio` on every change. No rings, no visuals — that's `VistaEntidades`'s job.

**Exact AoE2 semantics:**
- Left click: clear + select single (or drag-box if >6px)
- Shift click: add/remove from selection (toggle)
- Double-click (<320ms, same pixel): select ALL of same type on screen
- Ctrl+1..9: save control group | 1..9: recall | double-tap: center camera
- `.` / `,`: cycle idle villagers | `H`: center on TC | `Del`: delete
- Build mode: ghost snapped to 2m grid, green/red validity, R/wheel rotates, Shift queues, Escape cancels

**Selection cap:** 60 units max (TOPE). Stable order (`lista`) for HUD — no dancing between frames.

---

## ORDERS — THE CONTEXTUAL RIGHT-CLICK (unit decides, not UI)

`Ordenes` is THE facade. It writes INTENT into world arrays (destinoX/Z, tieneDestino, objetivo, estado) and watches for completion. Other systems take over from there.

**Right-click logic (exact):**
```
hover resource node + selected workers → recolectar
hover enemy unit/building → atacar
hover own building + selected workers → reparar
hover own transport → embarcar
hover ground → mover (with formation _repartir)
hover own producer building → puntoDeReunion
```

**Formation `_repartir` (HEX RINGS + GREEDY ASSIGNMENT):**
- Center + concentric hex rings (6, 12, 18... slots per ring)
- Spacing = max(unit radius) * 2.2, min 1.6m
- Assign slots by GREEDY NEAREST: sort units by distance to center, each picks closest free slot
- Single unit = center point
- Result: `this._slots = [x0,z0, x1,z1, ...]` in selection order

**Command queue per unit (Shift = encolar):**
`this.colas = Map<entityId, Order[]>` — `this._empujar(id, order, encolar)` pushes to queue, `_pasoCola()` processes head when unit free.

---

## FOG OF WAR — ACTIVE VISION + MEMORY

256×256 grid (1 cell = 2m) per player, `Uint8Array`:
- Bit 0 (1) = explored (memory)
- Bit 1 (2) = visible NOW (active vision)

**Tick (20 Hz):**
1. ERASE only the exact discs painted last tick (no full sweep)
2. REPAINT a disc per entity using precomputed stencil per integer radius (row = contiguous range, no sqrt per cell)
3. Radius corrected by height (hills see further) and dense forest (sees less)
4. Upload RG texture to GPU every 3 ticks (R=explored, G=visible)

**Render:** DataTexture mapped over terrain mesh, blended to dark desaturated gray. Noise layers crawl slowly → looks like fog, not pixel stairs.

**API:** `visible(jugador,x,z)`, `explorado()`, `recuerdos()` → ghost buildings, `mascara()` → minimap reads this.

---

## MINIMAP — 4 LAYERS, 10 Hz REFRESH

Canvas 256×256 (matches fog grid 1:1), layers composited:
1. **TERRAIN** — painted ONCE to offscreen canvas with hillshading from heightfield
2. **FOG** — 10 Hz blit from `niebla.pintura` (RG data)
3. **POINTS** — own units always, enemies only if visible NOW + remembered buildings (ghosts)
4. **FRUSTUM** — camera trapezoid drawn every frame over cached composite (cheap blit)

**Input:** Left-drag pans camera, right-click issues ORDER AT THAT WORLD POINT (same contextual logic). Attack flashes red pulse for 4s.

---

## AI — VISION-LIMITED, NO CHEATS, TWO CLOCKS

Per-player brain with TWO independent clocks:
- **Strategic (~1 Hz):** economy, buildings, ages, techs, phases, production plan
- **Tactical (~4 Hz):** combat micro, raids, exploration, villager flee

**Rules:**
- Only knows what IT SEES (own sealed vision grid, decays over time)
- Zero resource cheats (only +15% gather on Brutal, declared on bus)
- ALL actions via `ctx.ordenes.*` (same facade as human)
- Pre-validates cost/pop/queue/placement before ordering — no error spam

**Build plan (PLAN array):** `[clave, edadMin, cantidadObjetivo, faseMin]` — e.g., `['cuartel',0,1,0]`, `['mercado',1,1,1]`, `['central',3,1,1]`. Phase advances by army size / enemy pressure.

**Raids:** dedicated `rol=1` raiders target isolated enemy villagers (farthest from their buildings).

---

## PRODUCTION — QUEUES + AGE GATES + RALLY

`Produccion` owns `mundo.meta.get(edificioId).cola` = array of `{ tipo, clave, restante, total, defId }`. Only HEAD consumes time.

**Cancel = 100% refund** (AoE2).

**Placement validation (`puedeEmplazar`):** age gate, resource check, slope <0.32, height delta <2.4m, no water (unless costero), no overlap with entities, clearance for walls (line drag).

**Rally points:** stored per building, applied to new units on spawn.

---

## HUD — EVOLVING UI, CANVAS ICONS, 10 Hz NUMERICS

HTML overlay on canvas. Frame evolves with age (CSS `body[data-edad]`). Portraits/icons drawn to canvas procedurally and CACHED. DOM recycled — nothing recreated per frame.

**Work split:**
- Per frame: minimap blit, internal clock
- 10 Hz: resources, pop, health, queues, progress
- On event: selection panel, action grid (15 slots, QWERTY-ASDFG-ZXCVB), notifications

**Action grid:** 15 slots, hotkeys shown. Build mode shows ghost preview + validity. Shift = queue multiple.

---

## COMBAT — REAL PROJECTILES, ANIMATION-SYNCED

Damage resolves at **mid-animation**, not on button press — hand and impact sync.

**Projectile types (real physics):**
| type | vel | grav | guide | accel | ttl | notes |
|------|-----|------|-------|-------|-----|-------|
| bala | 115 | 2.6  | 0     | 0     | 2.2 | instant-ish hitscan feel |
| obus | 0   | 26   | 0     | 0     | 7.0 | ballistic arc (catapult) |
| misil | 22  | 0    | 3.0   | 40    | 7.0 | guided, thrust |
| cohete | 26 | 1.4 | 1.1  | 30    | 4.5 | ballistic + slight guide |
| enjambre | 18 | 0  | 2.6  | 26    | 6.0 | splits into 5 submunitions |
| riel | 0   | 0    | 0     | 0     | 0   | hitscan beam |

**Posturas:** agresiva / defensiva / quieta / no_atacar — player ORDER always overrides posture.

---

## MOVEMENT — PER-CLASS HANDLING, SEPARATION, SMOOTH ARRIVAL

Per-class profiles (accel, brake, turn rate, radius, separation):
```
aldeano:    acel=26 freno=30 giro=9.5  radio=0.42 sep=1.00
infanteria: acel=24 freno=28 giro=8.5  radio=0.45 sep=1.00
tirador:    acel=24 freno=28 giro=9.0  radio=0.44 sep=1.05
apoyo:      acel=22 freno=26 giro=8.0  radio=0.45 sep=1.00
caballeria: acel=14 freno=16 giro=4.2  radio=0.68 sep=1.10
asedio:     acel=6.5 freno=9  giro=1.5  radio=0.95 sep=1.25
nave:       acel=3.5 freno=2.6 giro=0.85 radio=1.70 sep=1.35
aereo:      acel=13 freno=11 giro=2.6  radio=0.90 sep=1.15
```

**Separation force** computed per tick from nearby units (spatial hash). Predictive evasion horizon 0.55s.

**Footprints** painted every 7.5m traveled (MAX_DECALS_TICK=6).

**Path requests capped:** 8 A* solves per tick (MAX_CAMINOS_TICK) — prevents spikes.

---

## PATHFINDING — CLEARANCE-BASED, WEIGHTED A*, FLOW FIELDS

Grid: 1 cell = 2m, size = mapSize/2 (512m → 256×256).
Two layers: terrestrial + naval.

**Clearance (holgura):** Chebyshev distance to nearest blocked cell. Unit with radius r needs clearance >= f(r). This IS inflated obstacles — units never clip corners.

**Binary heap** over typed arrays (lazy deletion, no decrease-key). Weighted A* (PESO_H=1.12) = 3-5x faster, near-optimal.

**Flow fields:** Dijkstra batches of 1200 nodes, cached 5s, max 8 concurrent. Used for groups moving to same target.

**Reservation grid:** 24-tick (~1.2s) cell reservations prevent landing conflicts.

**Cost per biome:** pradera=8, playa=9, desierto=9, bosque=11, montaña=18, agua=8.

---

## THE BUILD PLAN — 8 MILESTONES (EACH SHIPPABLE)

1. **OrderGenerator** — one input owner, swappable modes (select/move, build, repair), contextual cursor from unit-decides-order
2. **Unified Selection** — single Set, shift/double-click/deadzone/control-groups, emits change event
3. **Formation Move + Command Queue** — hex rings + greedy nearest, per-unit queue (Shift), move marker feedback
4. **Selection Visuals** — pooled hover/selection rings (depthTest:false, renderOrder:89)
5. **Production Palette** — bottom bar, 15 slots, QWERTY hotkeys, build clocks, queue counts, age-gated
6. **Minimap** — 4 layers (terrain cached, fog 10Hz, entities, frustum per-frame), left=pancam right=order
7. **Fog of War** — 256×256 grid, active vision discs + memory, GPU texture upload, noise-blurred edges
8. **AI Brain** — two clocks (strategic 1Hz, tactical 4Hz), vision-limited, builds via order facade, raids

---

## KEY FILES TO STUDY (all in imperios-1800-2100)

```
src/ui/Seleccion.js       — selection input, control groups, build mode
src/sim/Ordenes.js        — order facade, contextual right-click, formations, queues
src/sim/Niebla.js         — fog of war grid, stencil discs, GPU texture
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

## WHAT THIS MEANS FOR OUR CODEBASE

Our current `InputManager` = fragmented handlers. Replace with **one OrderGenerator** that owns all input.

Our `SelectionManager` = three fragmented states. Replace with **one Set** + events.

Our right-click = 5-way priority war. Replace with **contextual cursor** from unit-decides-order (hover target → order type).

Our movement = pile-up. Replace with **hex-ring formation + greedy slots + separation forces**.

Our production = stub. Build **real queues with age gates, rally points, 100% refund cancel**.

Our minimap = none. Build **4-layer canvas minimap with click→order**.

Our AI = none. Build **two-clock vision-limited brain that uses the same order facade**.

**Every piece is independently shippable.** The facade pattern means we can drop in OrderGenerator first, then Selection, then Formation, etc. — the game stays playable at every step.