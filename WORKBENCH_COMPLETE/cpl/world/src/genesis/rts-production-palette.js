/**
 * rts-production-palette.js
 * BUYASOUL CPL / GODFORGE — Production Palette (RTS-5)
 *
 * Bottom bar with build/train icons. Selects a building → shows its
 * production options. Click icon → queue unit. Shift+click → queue
 * multiple. Hotkeys 1-8 for units, Q/W/E/R for techs.
 *
 * Pattern: imperios HUD.js (15 slots, QWERTY hotkeys, build clocks).
 * Layout: 15-slot grid at bottom-center, icons drawn to small canvases.
 */

(function() {
  'use strict';

  const SLOT_COUNT = 15;
  const SLOT_SIZE = 52;
  const HOTKEY_LABELS = [
    'Q','W','E','R','T','A','S','D','F','G','Z','X','C','V','B'
  ];

  // ─── PRODUCTION DEFINITIONS (unit/tech tree per building type) ────────
  const BUILD_OPTIONS = {
    barracks: [
      { id: 'soldier',   name: 'Soldier',   cost: { profit: 80 },  buildTime: 3, icon: '⚔' },
      { id: 'scout',     name: 'Scout',     cost: { profit: 50 },  buildTime: 2, icon: '👁' },
      { id: 'sniper',    name: 'Sniper',     cost: { profit: 120 }, buildTime: 5, icon: '🎯' },
      { id: 'medic',     name: 'Medic',      cost: { profit: 100 }, buildTime: 4, icon: '✚', canRepair: true },
    ],
    warfactory: [
      { id: 'tank',      name: 'Tank',       cost: { profit: 300 }, buildTime: 10, icon: '🔫' },
      { id: 'artillery', name: 'Artillery',   cost: { profit: 250 }, buildTime: 8, icon: '💣' },
    ],
    refinery: [
      { id: 'harvester', name: 'Harvester',  cost: { profit: 100 }, buildTime: 4, icon: '⛏' },
    ],
    commandcenter: [
      { id: 'hero',      name: 'Hero',       cost: { profit: 500, love: 100 }, buildTime: 20, icon: '★' },
    ],
  };

  // Unit stats per type (spawned by production)
  const UNIT_STATS = {
    soldier:   { hp: 100, speed: 4, damage: 10, range: 5, color: 0x44aaff, radius: 0.5 },
    scout:     { hp: 60,  speed: 7, damage: 5,  range: 3, color: 0x44ff44, radius: 0.4 },
    sniper:    { hp: 70,  speed: 3, damage: 20, range: 15, color: 0xff4444, radius: 0.5 },
    medic:     { hp: 80,  speed: 4, damage: 0,  range: 0, color: 0xffffff, radius: 0.5, canRepair: true },
    tank:      { hp: 400, speed: 2, damage: 30, range: 8, color: 0x666688, radius: 0.8 },
    artillery: { hp: 200, speed: 1.5, damage: 50, range: 20, color: 0x884400, radius: 0.9 },
    harvester: { hp: 150, speed: 3, damage: 0,  range: 0, color: 0xffcc44, radius: 0.7, maxCarry: 25 },
    hero:      { hp: 500, speed: 5, damage: 25, range: 8, color: 0xffdd00, radius: 0.6 },
  };

  class RTSProductionPalette {
    constructor(opts) {
      this._entities = opts.entities || window.RTSEngineCore?.ENTITIES || new Map();
      this._scene = opts.scene || null;
      this._economy = opts.economy || window.RTSEconomySystem || null;
      this._spawnOffset = opts.spawnOffset || 20; // distance from building to spawn

      this._slots = [];         // slot DOM elements
      this._selectedBuilding = null; // building whose options are shown
      this._queue = [];         // {def, elapsed, producing} per building
      this._barEl = null;
      this._infoEl = null;
      this._visible = false;
      this._container = opts.container || document.body;
    }

    // ─── LIFECYCLE ─────────────────────────────────────────────────────

    install() {
      this._createUI();
      console.log('[RTSProductionPalette] installed');
    }

    tick(dt) {
      this._tickQueue(dt);
      this._refreshSlots();
      this._refreshInfo();
    }

    /** Call when player selects a building — show its production options. */
    selectBuilding(building) {
      if (!building || building.type !== 'building' || building.isDead) {
        this._hide();
        return;
      }
      this._selectedBuilding = building;
      this._queue = building._prodQueue || [];
      building._prodQueue = this._queue;
      this._show(building);
    }

    /** Deselect — hide palette. */
    deselect() { this._hide(); this._selectedBuilding = null; }

    // ─── UI CREATION ───────────────────────────────────────────────────

    _createUI() {
      // Bottom bar
      this._barEl = document.createElement('div');
      this._barEl.id = 'rts-prod-bar';
      Object.assign(this._barEl.style, {
        position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
        display: 'none', zIndex: '105',
        background: 'rgba(6,10,20,0.88)',
        border: '1px solid rgba(0,255,204,0.3)',
        borderRadius: '10px', padding: '6px 10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(14px)',
        fontFamily: 'Outfit, sans-serif',
      });

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(15,' + SLOT_SIZE + 'px);gap:4px;';

      for (let i = 0; i < SLOT_COUNT; i++) {
        const slot = this._createSlot(i);
        grid.appendChild(slot);
        this._slots.push(slot);
      }
      this._barEl.appendChild(grid);
      this._container.appendChild(this._barEl);

      // Info bar (selected building name + queue)
      this._infoEl = document.createElement('div');
      this._infoEl.id = 'rts-prod-info';
      Object.assign(this._infoEl.style, {
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        display: 'none', zIndex: '105',
        color: '#00ffcc', fontSize: '13px', fontWeight: '700',
        letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif',
        textShadow: '0 0 10px rgba(0,255,204,0.4)',
      });
      this._container.appendChild(this._infoEl);
    }

    _createSlot(index) {
      const el = document.createElement('div');
      el.className = 'rts-prod-slot';
      el.style.cssText = `
        width:${SLOT_SIZE}px; height:${SLOT_SIZE}px;
        background:rgba(20,30,50,0.7); border:1px solid rgba(255,255,255,0.1);
        border-radius:6px; cursor:pointer; position:relative;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        font-size:22px; transition:all 0.15s;
      `;
      // Hotkey label
      const hk = document.createElement('span');
      hk.style.cssText = 'position:absolute;top:2px;left:4px;font-size:9px;color:rgba(255,255,255,0.4);font-family:monospace;';
      hk.textContent = HOTKEY_LABELS[index];
      el.appendChild(hk);

      // Icon
      const icon = document.createElement('span');
      icon.className = 'rts-prod-icon';
      icon.style.cssText = 'font-size:22px;line-height:1;';
      el.appendChild(icon);

      // Cost label
      const cost = document.createElement('span');
      cost.className = 'rts-prod-cost';
      cost.style.cssText = 'font-size:9px;color:#ffd700;font-weight:700;font-family:monospace;margin-top:2px;';
      el.appendChild(cost);

      // Queue count badge
      const badge = document.createElement('span');
      badge.className = 'rts-prod-badge';
      badge.style.cssText = 'position:absolute;top:2px;right:4px;font-size:9px;color:#fff;background:rgba(0,180,120,0.8);border-radius:8px;padding:0 4px;display:none;font-family:monospace;';
      el.appendChild(badge);

      // Clock overlay
      const clock = document.createElement('div');
      clock.className = 'rts-prod-clock';
      clock.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;background:#00ffcc;border-radius:0 0 5px 5px;width:0%;transition:width 0.3s;';
      el.appendChild(clock);

      el.addEventListener('click', () => this._onSlotClick(index));
      el.addEventListener('mouseenter', () => { el.style.borderColor = 'rgba(0,255,204,0.6)'; el.style.background = 'rgba(30,50,70,0.8)'; });
      el.addEventListener('mouseleave', () => { el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.background = 'rgba(20,30,50,0.7)'; });

      el._icon = icon;
      el._cost = cost;
      el._badge = badge;
      el._clock = clock;
      el._def = null;
      return el;
    }

    // ─── SHOW / HIDE ───────────────────────────────────────────────────

    _show(building) {
      this._visible = true;
      this._barEl.style.display = 'block';
      this._infoEl.style.display = 'block';
      // Fill slots from BUILD_OPTIONS matching building type
      const type = this._getBuildingType(building);
      const options = BUILD_OPTIONS[type] || [];
      for (let i = 0; i < SLOT_COUNT; i++) {
        const slot = this._slots[i];
        if (i < options.length) {
          slot._def = options[i];
          slot._icon.textContent = options[i].icon;
          slot._cost.textContent = this._formatCost(options[i].cost);
          slot.style.opacity = '1';
          slot.style.pointerEvents = 'auto';
        } else {
          slot._def = null;
          slot._icon.textContent = '';
          slot._cost.textContent = '';
          slot.style.opacity = '0.3';
          slot.style.pointerEvents = 'none';
        }
        slot._badge.style.display = 'none';
        slot._clock.style.width = '0%';
      }
    }

    _hide() {
      this._visible = false;
      this._barEl.style.display = 'none';
      this._infoEl.style.display = 'none';
    }

    // ─── SLOT CLICK → QUEUE ────────────────────────────────────────────

    _onSlotClick(index) {
      if (!this._selectedBuilding) return;
      const def = this._slots[index]._def;
      if (!def) return;
      const shiftHeld = window.event?.shiftKey;
      this._enqueue(def, shiftHeld ? 4 : 1);
    }

    _enqueue(def, count) {
      if (!this._selectedBuilding) return;
      // Check resources
      const eco = this._economy;
      if (eco && eco.RESOURCES) {
        for (const [res, amount] of Object.entries(def.cost)) {
          if ((eco.RESOURCES[res] || 0) < amount) return; // not enough
        }
        // Deduct
        for (const [res, amount] of Object.entries(def.cost)) {
          eco.addResource(res, -amount);
        }
      }
      // Add to queue
      this._queue.push({
        def,
        elapsed: 0,
        producing: this._queue.length === 0, // first item starts immediately
      });
    }

    // ─── QUEUE TICK ────────────────────────────────────────────────────

    _tickQueue(dt) {
      if (!this._visible || !this._selectedBuilding) return;
      // Only the HEAD item produces
      const head = this._queue.find(q => q.producing);
      if (!head) return;

      head.elapsed += dt;
      if (head.elapsed >= head.def.buildTime) {
        // Unit complete — spawn at building
        this._spawnUnit(head.def);
        // Remove from queue
        const idx = this._queue.indexOf(head);
        if (idx >= 0) this._queue.splice(idx, 1);
        // Start next
        if (this._queue.length > 0) this._queue[0].producing = true;
      }
    }

    _spawnUnit(def) {
      const T = window.THREE;
      const building = this._selectedBuilding;
      if (!T || !building || !building.mesh) return;

      const stats = UNIT_STATS[def.id] || UNIT_STATS.soldier;
      const mesh = new T.Mesh(
        new T.BoxGeometry(stats.radius * 2, 1.5, stats.radius * 2),
        new T.MeshBasicMaterial({ color: stats.color })
      );
      // Spawn offset from building
      const angle = Math.random() * Math.PI * 2;
      mesh.position.set(
        building.mesh.position.x + Math.cos(angle) * this._spawnOffset,
        0,
        building.mesh.position.z + Math.sin(angle) * this._spawnOffset
      );
      this._scene?.add(mesh);

      const ent = window.RTSEngineCore?.registerEntity?.(mesh, 'unit', building.faction, stats.hp, stats.radius);
      if (ent) {
        ent.speed = stats.speed;
        ent.attackDamage = stats.damage;
        ent.attackRange = stats.range;
        ent.maxCarry = stats.maxCarry || 0;
        ent.canRepair = stats.canRepair || false;
      }
    }

    // ─── REFRESH ───────────────────────────────────────────────────────

    _refreshSlots() {
      if (!this._visible) return;
      // Update badges (queue counts) and clock (build progress)
      const head = this._queue.find(q => q.producing);
      for (let i = 0; i < SLOT_COUNT; i++) {
        const slot = this._slots[i];
        if (!slot._def) continue;
        // Count how many of this def are in queue
        const count = this._queue.filter(q => q.def === slot._def).length;
        if (count > 1) { slot._badge.textContent = count; slot._badge.style.display = ''; }
        else { slot._badge.style.display = 'none'; }
        // Clock progress (only for head item)
        if (head && head.def === slot._def) {
          slot._clock.style.width = Math.min(100, (head.elapsed / head.def.buildTime) * 100) + '%';
        } else {
          slot._clock.style.width = '0%';
        }
      }
    }

    _refreshInfo() {
      if (!this._visible || !this._selectedBuilding) {
        this._infoEl.textContent = '';
        return;
      }
      const b = this._selectedBuilding;
      const typeName = (b._prodType || 'building').toUpperCase();
      const qLen = this._queue.length;
      this._infoEl.textContent = `${typeName} ${qLen > 0 ? '— ' + qLen + ' in queue' : '— no queue'}`;
    }

    _getBuildingType(building) {
      // Match building defId/name to BUILD_OPTIONS key
      const defId = building.defId || building.name || '';
      if (/bar/i.test(defId)) return 'barracks';
      if (/factory|armor|tank/i.test(defId)) return 'warfactory';
      if (/refin|collect|mine/i.test(defId)) return 'refinery';
      if (/command|hq|base|townhall|tower|grand/i.test(defId)) return 'commandcenter';
      // Default: try to match from building name
      if (building._prodType) return building._prodType;
      return 'barracks'; // fallback
    }

    _formatCost(cost) {
      if (!cost) return '';
      return Object.entries(cost).filter(([,v]) => v > 0).map(([k,v]) => v + '').join(' ');
    }
  }

  window.RTSProductionPalette = RTSProductionPalette;
})();
