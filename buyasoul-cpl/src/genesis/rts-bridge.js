/**
 * rts-bridge.js
 * BUYASOUL CPL / GODFORGE — RTS Bridge (wires RTS-1 + RTS-2 into engine)
 *
 * Connects:
 *   - RTSOrderGenerator (RTS-1) → RTSInputRouter (existing) + RTSEngineCore (existing)
 *   - RTSSelection (RTS-2) → RTSUICore (existing) + RTS subsystems
 *
 * Usage:
 *   window.RTSBridge.install({ scene, camera, entities, audio, production, navGrid });
 *   // Then in your render loop: RTSBridge.tick(dt);
 *
 * This bridge REPLACES the fragmented handler registration in rts-war-command.js
 * and rts-subsystem.js. It registers with RTSInputRouter for pointer events
 * and delegates to the new unified systems.
 */

(function() {
  'use strict';

  let selection = null;
  let orderGen = null;
  let orderExecutor = null;
  let ctx = null;
  let _lastClickTime = 0;
  let _lastClickEntityId = -1;
  let _lastClickX = 0;
  let _lastClickY = 0;
  let _installed = false;

  /** Control groups: Map<number, Set<entityId>> — mirrors selection.groups */
  let _groups = null;

  /**
   * Build the context object that RTS-1 and RTS-2 need.
   * Reads from existing globals: RTSEngineCore.ENTITIES, scene, camera.
   */
  function buildContext(opts) {
    return {
      scene: opts.scene || null,
      camera: opts.camera || null,
      entities: window.RTSEngineCore?.ENTITIES || new Map(),
      selection: null, // Will be set after RTSSelection created
      audio: opts.audio || null,
      production: opts.production || null,
      navGrid: opts.navGrid || window.RTSNavGrid || null,
      onSelectionChange: null, // Wired later
    };
  }

  /**
   * Install the bridge. Creates RTSSelection + RTSOrderGenerator,
   * registers with RTSInputRouter, and wires up event forwarding.
   */
  function install(opts) {
    if (_installed) return;
    _installed = true;

    ctx = buildContext(opts);

    // Create selection system
    selection = new window.RTSSelection(ctx);
    ctx.selection = selection;

    // Initialize control groups (mirrors selection.groups)
    _groups = selection.groups;

    // Create order generator
    orderGen = new window.RTSOrderGenerator(ctx);

    // Create order executor (RTS-3) — consumes unit.orders[], drives engine-core
    if (window.RTSOrderExecutor) {
      orderExecutor = new window.RTSOrderExecutor(ctx);
      // Expose the live instance so world/daemon hooks (SPAWN_AGENT_AVATAR,
      // DRAFT_ARMY) can drive it. Previously only the class was global and the
      // instance was module-scoped — the DRAFT_ARMY hook in index.html referenced
      // window.rtsOrderExecutor?.draftArmy, which was always undefined.
      window.rtsOrderExecutor = orderExecutor;
    }

    // Wire selection → RTSUICore (legacy compatibility)
    if (window.RTSUICore && window.RTSUICore.setSelection) {
      selection.on('change', (data) => {
        window.RTSUICore.setSelection(data.ids);
      });
    }

    // Wire selection → RTSInputRouter (for hotkeys)
    if (window.RTSInputRouter && window.RTSInputRouter.registerKeyHandler) {
      window.RTSInputRouter.registerKeyHandler(0, handleKey);
    }

    // Register left-click handler (priority 10 — runs early)
    if (window.RTSInputRouter && window.RTSInputRouter.registerLeftClick) {
      window.RTSInputRouter.registerLeftClick(10, handleLeftClick);
    }

    // Register right-click handler (priority 10 — runs early)
    if (window.RTSInputRouter && window.RTSInputRouter.registerRightClick) {
      window.RTSInputRouter.registerRightClick(10, handleRightClick);
    }

    // Register box-select handler
    if (window.RTSInputRouter && window.RTSInputRouter.registerBoxSelector) {
      window.RTSInputRouter.registerBoxSelector(handleBoxSelect);
    }

    console.log('[RTSBridge] RTS-1 (OrderGenerator) + RTS-2 (Unified Selection) installed.');
    console.log('[RTSBridge] Selection: single Set, AoE2 semantics. OrderGenerator: contextual cursor.');
  }

  /**
   * Handle left-click from RTSInputRouter.
   * Delegates to RTSSelection for the click/double-click logic.
   */
  function handleLeftClick(data) {
    const { point, hits, shiftKey } = data;

    // Find first unit hit
    const unitHit = findUnitHit(hits);

    if (unitHit) {
      const entity = unitHit.entity;
      const entityId = entity.id;

      // Check for double-click → select all of same type
      const now = performance.now();
      if (_lastClickEntityId === entityId && (now - _lastClickTime) < 320) {
        selection.selectAllOfType(entityId);
        _lastClickTime = 0;
        _lastClickEntityId = -1;
        return true;
      }
      _lastClickTime = now;
      _lastClickEntityId = entityId;

      // Single click → select (shift = toggle)
      selection.select(entityId, shiftKey);
      return true;
    }

    // Click on ground with no unit hit
    // Don't clear if shift held (additive)
    if (!shiftKey) {
      selection.clear();
    }
    return false;
  }

  /**
   * Handle right-click from RTSInputRouter.
   * Delegates to RTSOrderGenerator for contextual order logic.
   */
  function handleRightClick(data) {
    const { point, hits, shiftKey } = data;

    // If nothing selected, nothing to command
    if (selection.ids.size === 0) return false;

    // Determine the command target
    const targetHit = findTargetHit(hits, selection);

    if (targetHit) {
      // Contextual order: unit decides what to do
      const target = targetHit.entity;
      const orderType = orderGen._decideOrder(target, selection);
      return issueOrder(orderType, target, point, shiftKey);
    }

    // Click on ground → move order
    if (point) {
      return issueOrder('move', null, point, shiftKey);
    }

    return false;
  }

  /**
   * Handle box-select from RTSInputRouter.
   */
  function handleBoxSelect(data) {
    const { rect, shiftKey } = data;
    selection.boxSelect(rect, shiftKey);
    return true;
  }

  /**
   * Issue a command to selected units via the Order Generator.
   */
  function issueOrder(orderType, target, point, shiftKey) {
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return false;

    const selected = selection.list;
    const movable = selected
      .map(id => entities.get(id))
      .filter(e => e && !e.isDead && e.type === 'unit' && e.speed > 0);

    if (movable.length === 0) return false;

    switch (orderType) {
      case 'attack':
        if (target) {
          for (const unit of movable) {
            if (unit.attackDamage <= 0) continue;
            unit.orders = shiftKey ? (unit.orders || []) : [];
            unit.orders.push({ type: 'attack', targetId: target.id });
            unit.targetId = target.id;
            unit.state = 'moving';
          }
          spawnMoveMarker(target.mesh?.position || point);
          return true;
        }
        break;

      case 'harvest':
        if (target) {
          const workers = movable.filter(u => u.maxCarry > 0);
          for (const unit of workers) {
            unit.orders = shiftKey ? (unit.orders || []) : [];
            unit.orders.push({ type: 'harvest', targetId: target.id });
            unit.targetId = target.id;
            unit.state = 'moving';
          }
          return true;
        }
        break;

      case 'repair':
        if (target) {
          const repairers = movable.filter(u => u.canRepair);
          for (const unit of repairers) {
            unit.orders = shiftKey ? (unit.orders || []) : [];
            unit.orders.push({ type: 'repair', targetId: target.id });
            unit.targetId = target.id;
            unit.state = 'moving';
          }
          return true;
        }
        break;

      case 'move':
      default:
        if (point) {
          // Formation move: hex rings + greedy assignment
          const slots = calculateFormationSlots(movable, point);
          for (let i = 0; i < movable.length; i++) {
            const unit = movable[i];
            const slot = slots[i];
            unit.orders = shiftKey ? (unit.orders || []) : [];
            unit.orders.push({ type: 'move', destination: slot });
            unit.targetPos = slot;
            unit.state = 'moving';
            // Request A* path
            if (window.RTSNavGrid) {
              unit._navTarget = slot.clone();
              unit._navWaypoints = window.RTSNavGrid.findPath(
                unit.mesh.position.x, unit.mesh.position.z,
                slot.x, slot.z
              );
              unit._navWPIndex = 0;
            }
          }
          spawnMoveMarker(point);
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Formation: hex rings + greedy nearest assignment (imperios pattern).
   */
  function calculateFormationSlots(units, targetPos) {
    const n = units.length;
    const slots = [];
    if (n === 1) { slots.push(targetPos.clone()); return slots; }

    let maxR = 0.5;
    for (const u of units) {
      if (u.radius) maxR = Math.max(maxR, u.radius);
    }
    const spacing = Math.max(1.6, maxR * 2.2);

    // Generate candidate slots: center + hex rings
    const candidates = [{ x: targetPos.x, z: targetPos.z }];
    for (let ring = 1; candidates.length < n * 2; ring++) {
      const count = ring * 6;
      const r = ring * spacing;
      for (let i = 0; i < count && candidates.length < n * 2; i++) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.37;
        candidates.push({
          x: targetPos.x + Math.cos(angle) * r,
          z: targetPos.z + Math.sin(angle) * r,
        });
      }
    }

    // Greedy assignment: sort units by distance to center
    const unitOrder = units.map((u, i) => ({
      i,
      u,
      dist: Math.hypot(u.mesh.position.x - targetPos.x, u.mesh.position.z - targetPos.z),
    }));
    unitOrder.sort((a, b) => a.dist - b.dist);

    const used = new Uint8Array(candidates.length);
    const T = window.THREE;
    for (const { i, u } of unitOrder) {
      let bestIdx = -1, bestD = Infinity;
      for (let c = 0; c < candidates.length; c++) {
        if (used[c]) continue;
        const dx = candidates[c].x - u.mesh.position.x;
        const dz = candidates[c].z - u.mesh.position.z;
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; bestIdx = c; }
      }
      if (bestIdx < 0) bestIdx = 0;
      used[bestIdx] = 1;
      slots[i] = new T.Vector3(candidates[bestIdx].x, 0, candidates[bestIdx].z);
    }

    while (slots.length < n) slots.push(targetPos.clone());
    return slots;
  }

  /**
   * Spawn a move/attack marker ring on the ground (visual feedback).
   */
  function spawnMoveMarker(pos) {
    if (!ctx.scene || !pos) return;
    const T = window.THREE;
    const marker = new T.Mesh(
      new T.RingGeometry(1, 1.5, 16),
      new T.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8, side: T.DoubleSide })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.copy(pos);
    marker.position.y = 0.2;
    marker.userData.life = 1.5;
    ctx.scene.add(marker);

    const fade = () => {
      marker.userData.life -= 0.016;
      marker.material.opacity = Math.max(0, marker.userData.life / 1.5);
      if (marker.userData.life <= 0) {
        if (marker.parent) marker.parent.remove(marker);
      } else {
        requestAnimationFrame(fade);
      }
    };
    requestAnimationFrame(fade);
  }

  /**
   * Find the first unit in a raycast hit list.
   */
  function findUnitHit(hits) {
    if (!hits || !hits.length) return null;
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return null;

    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData?.entityId) {
          const ent = entities.get(obj.userData.entityId);
          if (ent && ent.type === 'unit' && !ent.isDead) {
            return { entity: ent, hit };
          }
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  /**
   * Find a valid target hit (enemy unit/building, resource, damaged friendly building).
   */
  function findTargetHit(hits, selection) {
    if (!hits || !hits.length) return null;
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return null;

    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData?.entityId) {
          const ent = entities.get(obj.userData.entityId);
          if (ent && !ent.isDead) {
            return { entity: ent, hit };
          }
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  /**
   * Handle keyboard commands (A=attack-move, S=stop, H=hold, P=patrol).
   * Ctrl+1-9: save selection as group. 1-9: recall group. Shift+1-9: add group.
   */
  function handleKey(key, e, ctx) {
    if (ctx.focus !== 'world') return false;

    // ── Control group keys: 1-9 ──
    const num = parseInt(key, 10);
    if (num >= 1 && num <= 9) {
      if (e.ctrlKey) {
        // Ctrl+number → save current selection to group
        selection.saveGroup(num);
        return true;
      }
      if (e.shiftKey) {
        // Shift+number → add group to current selection
        selection.addGroup(num);
        // Flash feedback so player sees units were added
        if (selection.flashGroupRings) selection.flashGroupRings(200);
        return true;
      }
      // Plain number → recall group
      selection.recallGroup(num);
      // Flash selection rings for visual feedback
      if (selection.flashGroupRings) selection.flashGroupRings(300);
      return true;
    }

    switch (key) {
      case 'a': // Attack move — enters attack-move mode
        return true;
      case 's': // Stop
        stopSelected();
        return true;
      case 'h': // Hold position
        holdSelected();
        return true;
      case 'p': // Patrol
        patrolSelected();
        return true;
      case 'delete': // Delete selected units
        deleteSelected();
        return true;
    }
    return false;
  }

  function stopSelected() {
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return;
    for (const id of selection.list) {
      const ent = entities.get(id);
      if (ent && !ent.isDead) {
        ent.orders = [];
        ent.targetId = null;
        ent.targetPos = null;
        ent.state = 'idle';
        ent._noAggro = false;
      }
    }
  }

  function holdSelected() {
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return;
    for (const id of selection.list) {
      const ent = entities.get(id);
      if (ent && !ent.isDead) {
        ent.orders = [{ type: 'hold' }];
        ent.state = 'idle';
      }
    }
  }

  function patrolSelected() {
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return;
    for (const id of selection.list) {
      const ent = entities.get(id);
      if (ent && !ent.isDead && ent.mesh) {
        ent.orders = [{ type: 'patrol', patrolStart: ent.mesh.position.clone() }];
        ent.state = 'idle';
      }
    }
  }

  function deleteSelected() {
    const entities = window.RTSEngineCore?.ENTITIES;
    if (!entities) return;
    for (const id of selection.list) {
      const ent = entities.get(id);
      if (ent && !ent.isDead) ent.die();
    }
    selection.clear();
  }

  /**
   * Per-frame tick: run order executor (RTS-3), then update selection rings,
   * cull dead entities.
   */
  function tick(dt) {
    if (!selection || !orderGen) return;
    const entities = window.RTSEngineCore?.ENTITIES;
    if (entities) {
      // Runs BEFORE engine-core tick (see void-population ordering) so orders
      // take effect the same frame.
      if (orderExecutor) orderExecutor.tick(dt);
      selection.cullDead(entities);
      selection.updateRings(entities);
    }
  }

  // ─── EXPORT ──────────────────────────────────────────────────────────
  window.RTSBridge = {
    install,
    tick,
    get selection() { return selection; },
    get orderGen() { return orderGen; },
    get orderExecutor() { return orderExecutor; },
    get groups() { return _groups; },
  };
})();