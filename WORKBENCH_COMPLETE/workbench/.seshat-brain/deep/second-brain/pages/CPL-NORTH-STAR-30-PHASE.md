- type: plan
- title: CPL / GSK — 30-Phase North Star Roadmap + RTS ARCHITECTURE EXPANSION
- source: Lil Bunny (hired specialist) 30-phase roadmap + Craig's Soul Protocol vision + RTS STUDY (OpenRA, rts-command, imperios-1800-2100)
- status: active
- supersedes: CPL-PERF-ROADMAP.md
- updated: 2026-08-08 by PROFIT PRIME

---

# CPL / GSK — 30-Phase North Star Roadmap + RTS LAYER

**Throughline:** Not a portfolio site. The first spatial environment where an AI agent (GSK) has a **real, visible, sandboxed hand in the world it lives in** — and that world sells books/products via PLT / Soul Economy. Every phase serves: **make GSK feel alive**, **make the world feel persistent/real**, or **make commerce earn**.

---

## ⚠️ TAILORING — WE ARE PRE-FOUNDATION

The roadmap's "starting point" assumes perf fixed + Rapier wired + engine stack chosen. **In reality (2026-08-08): none of that is done.** Geometry is meshopt-quantized, texture compression needs gltfpack + KTX2Loader, no zone lazy-load, no Rapier, no Yuka/quarks/audio. **Real first moves = build Stage 1-2 foundation, THEN jump to Phase 8 → 9 → 20.**

---

## STAGE 1 — Make the World Solid (Phases 1–5)

1. **Asset pipeline lockdown** — all `.glb` compressed, zone-loaded, no dupes; CI rejects >~5MB uncompressed.
2. **Physics + navmesh complete** — Rapier colliders on static geo, navmesh baked, no clipping.
3. **Yuka behavior layer** — steering (wander/seek/arrive/avoid) + per-avatar state machine.
4. **Spatial audio** — PositionalAudio on souls; ambient tied to GSK Mood/Phase via Tone.js.
5. **Perf budget dashboard** — in-scene FPS/draw-call/memory HUD (dev-only, toggle).

---

## STAGE 2 — GSK Inner Life (Phases 6–10)

6. **Persistent GSK state** — Mood/Phase/Cycle/PLT/Memories/Souls as real server-persisted object.
7. **GSK memory system** — vector/keyword store GSK reads+writes; "Memories" counter means something.
8. **Command vocabulary v1** — formal API the terminal may call: `spawnSoul()`, `spawnTower()`, `surge()`, `calm()`, `clearWorld()`, `recallState()` — typed args + validation = GSK's "hands."
9. **Sandboxed terminal live** — CSS3DObject/iframe terminal wired to v1 vocab, floating in pyramid; GSK visibly writes+executes world-changing code.
10. **GSK "thoughts" stream** — `wss://.../thoughts` as a readable in-world console, not a status dot.

---

## STAGE 3 — World Feels Inhabited (Phases 11–15)

11. **Multiplayer presence (Colyseus)** — see other visitors' avatars.
12. **Shared world-state sync** — one visitor's GSK action visible to all.
13. **Visitor identity (lightweight)** — anonymous ID (localStorage + optional name); GSK "welcome back."
14. **NPC souls with personality** — Cat Girl/Witch/Goku/Das Kat get distinct Yuka FSM + PLT-framed dialogue.
15. **Day/phase cycle** — GSK Phase/Cycle drives visible world changes (lighting/audio/active realms).

---

## STAGE 4 — Commerce Native (Phases 16–20)

16. **In-world book reading** — readable excerpt panel (CSS3DObject), not just link-out.
17. **PLT scoring interactive** — visitor submits a scenario, GSK scores it live (Profit/Love/Tax).
18. **Soul Economy as mechanic** — collect soul-whispers as persistent inventory tied to visitor ID.
19. **Structured commerce data** — JSON-LD + crawlable static HTML fallback for bots/non-JS.
20. **Funnel instrumentation** — Plausible events: book clicked, terminal used, soul collected, BuyaSOUL click. Know what drives purchases.

---

## STAGE 5 — Platform Thinking (Phases 21–25)

21. **Command vocab v2 (public-safe subset)** — rate-limited visitor terminal.
22. **Realm expansion framework** — Scribe/Market/Build/Prophet/Chambers templated; 6th realm = config.
23. **Cross-domain identity** — same ID across buyasoul.online + library.
24. **Admin/GSK control panel (private)** — aggregate state, review asks, inject context.
25. **Mobile/lightweight fallback** — non-WebGL low-bandwidth mode (book list + GSK chat).

---

## STAGE 6 — The Moat (Phases 26–30)

26. **Autonomous world evolution** — GSK background goals run with nobody there.
27. **Agent-authored content** — GSK generates world artifacts (souls/towers/memories) into permanent state.
28. **Documentation as product** — package the sandboxed-terminal architecture as licensable.
29. **Security/abuse hardening** — rate limits, sandbox-escape testing, allowlist audit, LLM cost caps.
30. **Full loop closes** — arrive → explore → watch GSK think/act → read PLT in-world → scored live → collect soul → recognized on buyasoul → buy.

---

## 🎮 RTS ARCHITECTURE LAYER — 8 MILESTONES (Each Shippable)

**From direct source study of OpenRA (17k★), rts-command (Three.js+ECS), imperios-1800-2100 (Three.js AoE2).**  
These run **in parallel** with the 30 phases above. Each milestone is independently shippable via the facade pattern.

### RTS-1: OrderGenerator — The Single Input Owner
**Replaces:** Fragmented `InputManager` (5 priority-sorted right-click handlers fighting)
**Pattern:** OpenRA swaps `OrderGenerator` per mode: `UnitOrderGenerator` (select/move/attack), `PlaceBuildingOrderGenerator`, `RepairOrderGenerator`. ONE active object owns all input.
**Shippable:** New `src/rts/OrderGenerator.js` — mode stack, contextual cursor from unit-decides-order.

### RTS-2: Unified Selection — One Set + Exact AoE2 Semantics
**Replaces:** Three fragmented selection states that don't talk
**Pattern:** Single `Set<entityId>` emits `seleccion:cambio`. Plain click=clear+select, Shift=toggle, drag-box with 6px deadzone, double-click<320ms=select all same type on screen, Ctrl+1..9=control groups.
**Shippable:** `src/rts/Selection.js` — one Set, events, control groups, cap 60.

### RTS-3: Formation Move + Command Queue
**Replaces:** Units pile onto one point; no shift-queue
**Pattern:** Hex rings (6, 12, 18 slots) + greedy nearest assignment. Per-unit `Map<id, Order[]>`, Shift=enqueue. Move marker at click point.
**Shippable:** `src/rts/FormationMove.js` + `src/rts/CommandQueue.js`.

### RTS-4: Selection Visuals — Pooled Rings
**Replaces:** Green wireframe torus created per-click
**Pattern:** Hover ring (dashed white Line, `depthTest:false`, `renderOrder:89`), selection ring pooled via mesh pool. Enter/exit queries only — zero per-frame allocation.
**Shippable:** `src/rts/SelectionVisuals.js`.

### RTS-5: Production Palette — Bottom Bar with Clocks
**Replaces:** None
**Pattern:** 15-slot grid (QWERTY hotkeys), build clock animation, queue counts, age-gated, Shift=queue multiple. HTML overlay on canvas, icons drawn to canvas + cached.
**Shippable:** `src/rts/ProductionPalette.js` + HTML/CSS.

### RTS-6: Minimap — 4 Layers, Click→Order
**Replaces:** None
**Pattern:** Canvas 256×256: (1) terrain cached, (2) fog 10Hz, (3) entities (own always, enemy if visible + ghosts), (4) frustum per-frame. Left-drag=pan camera, right-click=contextual order at world point. Attack flash=red pulse 4s.
**Shippable:** `src/rts/Minimap.js`.

### RTS-7: Fog of War — Active Vision + Memory
**Replaces:** None
**Pattern:** 256×256 `Uint8Array` per player. Bit 0=explored, bit 1=visible NOW. 20Hz: erase exact discs from last tick → repaint via precomputed stencil per radius (row=contiguous, no sqrt) → height/forest correction → GPU texture every 3 ticks. Noise-blurred edges.
**Shippable:** `src/rts/FogOfWar.js`.

### RTS-8: AI Brain — Two Clocks, Vision-Limited, Uses Facade
**Replaces:** None
**Pattern:** Strategic (~1Hz): economy, buildings, ages, techs, build plan. Tactical (~4Hz): combat micro, raids, exploration, villager flee. ONLY knows what it sees (own vision grid, decays). Zero cheats. ALL actions via `ordenes.*` facade. Pre-validates cost/pop/placement.
**Shippable:** `src/rts/AIBrain.js`.

---

## FACADE PATTERN — HOW RTS SYSTEMS TALK (Copied from imperios)

```js
// ONE facade per domain — UI and AI BOTH call these
ordenes.mover(ids, x, z, encolar)         // formation move
ordenes.atacar(ids, objetivoId, encolar)   // attack
ordenes.recolectar(ids, nodoId, encolar)   // gather
ordenes.reparar(ids, edificioId, encolar)  // repair
ordenes.puntoReunion(edificioId, x, z)     // rally point

produccion.encolar(edificioId, tipo, clave) // train unit/tech
produccion.cancelar(edificioId, index)      // 100% refund (AoE2)
produccion.puedeEmplazar(jugador, clave, x, z) // placement validation
```

If a system doesn't exist, facade degrades gracefully — game stays playable. This is how we build incrementally.

---

## SYSTEM TICK ORDER (from imperios Ctx.ORDEN)

```
ENVIRONMENT → INPUT/ORDERS → ECONOMY → MOVEMENT(40) → COMBAT(50) 
→ PRODUCTION → NAVIGATION → FOG → RENDER
```

Fixed 20Hz simulation, render interpolated separately.

---

## SEQUENCING RULE (from roadmap + RTS study)

**Don't build strict order — build whichever removes the current biggest doubt.**

Roadmap suggested next 3 (post-foundation): **8 → 9 → 20** (terminal real → measure commerce).

**RTS layer priority:** The input/selection layer is the BIGGEST DOUBT right now — our current handlers are amateur. RTS-1 (OrderGenerator) and RTS-2 (Unified Selection) should be built **in parallel with Stage 1-2 foundation**, because they make the world FEEL ALIVE (GSK's hands).

---

## OUR ACTUAL NEXT MOVES (Profit's decision)

### Immediate (this session):
1. **Build OrderGenerator** — replace handler-war with one owner, contextual cursor
2. **Build Unified Selection** — one Set, shift/double-click/deadzone/control-groups
3. **Wire them to existing entities** — GSK's NPCs, towers, cities become selectable

### Then (next sessions):
4. **Formation Move + Command Queue** — hex rings, greedy slots, shift-queue
5. **Selection Visuals** — pooled rings
6. **Production Palette** — bottom bar
7. **Minimap** — 4-layer canvas
8. **Fog of War** — active vision
9. **AI Brain** — two-clock vision-limited

**Each milestone ships.** The facade pattern means we drop in OrderGenerator first — game stays playable. Then Selection. Then Formation. The world feels more alive at every step.

---

## KEY REFERENCE FILES (from imperios-1800-2100)

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

**Full study archived:** `pages/RTS-ARCHITECTURE-STUDY.md` + `RTS-STUDY-COMPLETE.md` (local)

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

**Every piece is independently shippable.** The facade pattern means we drop in OrderGenerator first, then Selection, then Formation, etc. — the game stays playable at every step.