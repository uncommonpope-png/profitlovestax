(function() {
  'use strict';

  const ARRIVE_DIST = 1.5;     // move order completion radius
  const REPAIR_RANGE = 2.5;    // repair engagement range
  const REPAIR_RATE = 20;      // hp per second
  const DEPOSIT_REGRAB = true; // harvester re-grabs node after deposit (AoE loop)

  class RTSOrderExecutor {
    constructor(ctx) {
      this.ctx = ctx;
      this.entities = (ctx && ctx.entities) || window.RTSEngineCore?.ENTITIES || new Map();
    }

    tick(dt) {
      if (dt <= 0) return;
      for (const ent of this.entities.values()) {
        if (ent.type !== 'unit' || ent.isDead || !ent.orders || ent.orders.length === 0) continue;
        let guard = 0;
        while (ent.orders.length > 0 && guard++ < 8) {
          const before = ent.orders.length;
          this._processHead(ent, dt);
          if (ent.orders.length === before) break; // head in progress
        }
      }
    }

    _processHead(ent, dt) {
      const order = ent.orders[0];
      switch (order.type) {
        case 'move':    this._move(ent, order); break;
        case 'attack':  this._attack(ent, order); break;
        case 'harvest': this._harvest(ent, order); break;
        case 'repair':  this._repair(ent, order, dt); break;
        case 'hold':    this._hold(ent, order); break;
        case 'patrol':  this._patrol(ent, order); break;
        default: this._done(ent);
      }
    }

    _done(ent) {
      ent.orders.shift();
      ent._noAggro = false;
      ent.state = 'idle';
      ent.targetId = null;
      ent.targetPos = null;
    }

    _move(ent, order) {
      if (!order._started) {
        order._started = true;
        ent.state = 'moving';
        ent.targetPos = order.destination.clone();
        ent._navTarget = null;
      }
      const d = ent.mesh.position.distanceTo(order.destination);
      if (d <= ARRIVE_DIST) this._done(ent);
    }

    _attack(ent, order) {
      const target = this.entities.get(order.targetId);
      if (!target || target.isDead) { this._done(ent); return; }
      ent.targetId = order.targetId;
      ent._noAggro = true;
    }

    _harvest(ent, order) {
      // If a deposit just occurred and DEPOSIT_REGRAB is false, finish the harvest order
      if (ent._justDeposited) {
        ent._justDeposited = false;
        if (!DEPOSIT_REGRAB) {
          this._done(ent);
          return;
        }
        // otherwise re-acquire node below
      }

      const node = this.entities.get(order.targetId);
      if (!node || node.isDead) { this._done(ent); return; }
      // If the entity has no explicit target assigned, pick it
      if (!ent.targetId) {
        ent.targetId = order.targetId;
        if (ent.state !== 'returning') ent.state = 'moving';
      }
      ent._noAggro = true;
    }

    _repair(ent, order, dt) {
      const b = this.entities.get(order.targetId);
      if (!b || b.isDead || b.hp >= b.maxHp) { this._done(ent); return; }
      ent._noAggro = true;
      const d = ent.mesh.position.distanceTo(b.mesh.position);
      if (d <= REPAIR_RANGE) {
        ent.state = 'repairing';
        ent.targetId = null;
        ent.targetPos = null;
        b.hp = Math.min(b.maxHp, b.hp + REPAIR_RATE * dt);
        if (b.hp >= b.maxHp) this._done(ent);
      } else {
        ent.state = 'moving';
        ent.targetPos = b.mesh.position.clone();
        ent._navTarget = null;
      }
    }

    _hold(ent, order) {
      ent._noAggro = true;
      ent.targetId = null;
      ent.targetPos = null;
      ent.state = 'idle';
    }

    _patrol(ent, order) {
      if (order._origin === undefined) {
        order._origin = ent.mesh.position.clone();
        order._goingBack = false;
      }
      ent._noAggro = true;
      const d = ent.mesh.position.distanceTo(order._goingBack ? order._origin : order.patrolStart);
      if (d <= ARRIVE_DIST) order._goingBack = !order._goingBack;
      const target = order._goingBack ? order._origin : order.patrolStart;
      ent.state = 'moving';
      ent.targetPos = target.clone();
    }

    /**
     * Draft an army at a city: spawn `count` unit entities near the city center
     * (or the nearest town hall). This closes the dangling DRAFT_ARMY hook in
     * index.html — window.rtsOrderExecutor.draftArmy(cityId, count) was
     * referenced by the world/daemon commands but never implemented.
     */
    draftArmy(cityId, count) {
      const countN = Math.max(1, Math.min(40, Number(count) || 5));
      const core = window.RTSEngineCore;
      const THREE = window.THREE;
      if (!core || !THREE) return { ok: false, error: 'RTSEngineCore/THREE not ready' };

      // Resolve the target city entity: by explicit id, or nearest town hall.
      let cityEnt = null;
      if (cityId != null) {
        const direct = this.entities.get(String(cityId));
        if (direct && (direct.type === 'building' || direct.type === 'city')) cityEnt = direct;
      }
      if (!cityEnt) {
        for (const ent of this.entities.values()) {
          if (ent.isTownHall || ent.type === 'city') { cityEnt = ent; break; }
        }
      }
      if (!cityEnt) return { ok: false, error: 'No city/town-hall found' };

      const pos = (cityEnt.obj && cityEnt.obj.position) || (cityEnt.mesh && cityEnt.mesh.position) || cityEnt.position;
      if (!pos) return { ok: false, error: 'City has no position' };

      const faction = cityEnt.faction || 'neutral';
      const spawned = [];
      for (let i = 0; i < countN; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.5, 1.1),
          new THREE.MeshBasicMaterial({ color: 0xffaa44 })
        );
        const angle = (i / Math.max(1, countN)) * Math.PI * 2;
        const rad = 12 + (i % 3) * 5;
        mesh.position.set(pos.x + Math.cos(angle) * rad, 0.75, pos.z + Math.sin(angle) * rad);
        mesh.name = 'drafted-' + (cityId || 'city') + '-' + i;
        if (window.Genesis && Genesis.scene) Genesis.scene.add(mesh);
        const ent = core.registerEntity(mesh, 'unit', faction, 120, 1.0);
        if (ent) {
          ent.speed = 2.4;
          ent.attackDamage = 8;
          ent.attackRange = 12;
          ent.draftedAt = Date.now();
          spawned.push(ent);
        }
      }
      if (window.Genesis && Genesis.EventBridge && Genesis.EventBridge.emit) {
        Genesis.EventBridge.emit('rts:drafted', { city: cityId, count: spawned.length });
      }
      return { ok: true, city: cityId, spawned: spawned.length };
    }
  }

  function installNoAggroGuard() {
    const core = window.RTSEngineCore;
    if (!core || core._noAggroGuardInstalled) return;
    core._noAggroGuardInstalled = true;
  }

  window.RTSOrderExecutor = RTSOrderExecutor;
  window.__RTS_ORDER_ARRIVE = ARRIVE_DIST;
})();
