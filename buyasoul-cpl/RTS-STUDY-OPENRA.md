# RTS STUDY — OPENRA (from direct source reading)

Studied: UnitOrderGenerator.cs, WorldInteractionControllerWidget.cs, Selection.cs,
ProductionPaletteWidget.cs, RadarWidget.cs, ProductionQueue.cs, Game.cs, Order.cs

## THE 6 PATTERNS THAT MATTER

### 1. ORDER GENERATOR (UI mode = first-class object)
The current interaction mode IS a swapable object. UnitOrderGenerator = select/move/attack.
PlaceBuildingOrderGenerator = build placement. RepairOrderGenerator = repair mode.
- Each has: HandleInput, GetCursor, Tick, Render, SelectionChanged
- Input routes: WorldInteractionControllerWidget → world.OrderGenerator.HandleInput
- THIS replaces our scattered right-click priority hacks. One mode object owns all input.

### 2. THE UNIT DECIDES THE ORDER, NOT THE UI (critical insight)
`OrderForUnit(a, target)` — each SELECTED unit is asked "what do you do at this target?"
- Harvest crystal → harvest order. Enemy → attack order. Ground → move. Ally → select.
- Cursor = highest-priority order from the selection (enemy under cursor + units selected = attack cursor)
- Shift = QUEUE orders (shift-click chains move/attack orders)
- Result: contextual commands for FREE. No command bar needed for move/attack — the cursor IS the command UI.

### 3. SELECTION SEMANTICS (the exact rules)
- Selection = a Set of actors, ONE source of truth (World.Selection)
- Combine(newSelection, isShift, isClick):
  - plain click: clear + select
  - shift: toggle (UnionWith / SymmetricExceptWith)
  - drag-box: box select (with deadzone so clicks don't become boxes)
  - double-click: select ALL of same class on screen
- Every change → OrderGenerator.SelectionChanged (UI reacts)

### 4. FIXED-TICK SIMULATION vs RENDERING (decoupled)
- world.Tick() runs simulation at fixed timestep (GameSpeed.Timestep)
- world.TickRender() renders separately
- UI ticks on its own schedule (Ui.Tick)
- Orders are queued (OrderManager) and applied to the world, not executed inline

### 5. PRODUCTION PALETTE (the command bar)
- Icon grid, bottom bar: icons for buildable units
- Click icon → enqueue to ProductionQueue; clock animation on progress; queue count badge
- Right-click = hold/cancel; hotkeys 01-09; tooltips with cost + time
- Queue: list of ProductionItem with remaining time, cost, duplicate icons

### 6. RADAR (minimap)
- Terrain sprite + actor blips (2 sprites composited, cached)
- Click = center viewport; drag = move viewport
- Right-click on radar = ISSUE ORDER THROUGH THE SAME OrderGenerator (command from minimap!)
- Radar pings: expanding circles at event positions (attack warnings)

## WHAT THIS MEANS FOR US
Our engine (rts-engine-core) is roughly right. What we built wrong:
1. **No OrderGenerator** — we have priority-sorted right-click handler lists = fragile, no cursor feedback
2. **No unit-decides-order** — commands are hardcoded, no contextual cursor
3. **Selection is fragmented** — 3 separate selection states instead of 1
4. **No shift-queue, no double-click-select-all, no deadzone**
5. **No production palette** — build UI doesn't exist as a coherent bar
6. **No radar** — no way to see the war
7. **No fixed tick** — engine ticks on render frame (dt-based), fine for now, but orders should be queued

---

## ADDENDUM — rts-command (Three.js + bitECS, modern ECS RTS)

### FORMATION MOVE (right-click command)
- `issueCommand()`: collect selected movable units (skip buildings/dead), then:
  - Click on enemy → AttackTarget + MoveTarget to enemy pos (ALL units)
  - Click on resource → workers set state=1, targetNode, MoveTarget
  - Click on ground → FORMATION: cols=ceil(sqrt(count)), rows, spacing=maxR*2.8
    - generate slots ring-by-ring, walkability + reachability checked per slot
- Move marker spawns at click point (visual feedback!)

### SELECTION VISUALS (the rings)
- Hover ring: dashed white Line ring, depthTest:false, renderOrder 89 (always on top)
- Selected units: ring via meshPools (pooled, no per-frame allocation)
- Selected ring follows unit; query enter/exit only (enterQuery)

### INPUT RULES
- Starcraft mode: right-click = command; Warcraft mode: right-click = deselect
- Build mode: right-click cancels; left-click places
- Attack-move: separate UnitMode (MODE_ATTACK_MOVE), click target
- Sounds: per-unit-type selection sfx (marine/tank/jeep...)
- Command QUEUE per unit (pushCommand/clearQueue) — shift = queue!

### ECS SYSTEMS (what ticks every frame)
aiSystem, combatSystem, commandQueueSystem, deathSystem, movementSystem,
pathfindingSystem, productionSystem, projectileSystem, renderSystem,
resourceSystem, selectionVisualSystem, supplySystem — each focused, decoupled.

## THE SYNTHESIS FOR OUR BUILD
Real RTS = these 8 things, in priority order:
1. ONE selection state (Set), shift-add/ctrl-toggle/double-click-all
2. Contextual cursor: unit decides order at target (enemy=attack, node=harvest, ground=move)
3. Formation move with spacing + move marker feedback
4. Command queue per unit (shift chains orders)
5. Hover ring + selection ring (pooled, depthTest:false, renderOrder 89)
6. Production palette: icon grid + clock + queue + hotkeys (bottom bar)
7. Radar: terrain sprite + unit blips, click=move viewport, right-click=order
8. Fixed-tick sim separate from render (orders queued, not inline)
