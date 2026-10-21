// door-portal-manager.js — GENESIS INTERIORS: street door ⇄ private interior portal
// =================================================================================
// Doors are the diegetic boundary between the public city and private apartments.
// This manager stores logical portals, enforces PropertyLedger entry rules, and
// preserves the exact street return position for exit.
(function () {
  var VERSION = 1;

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.DoorPortalManager) return;

    var doors = new Map();
    var activeByActor = new Map();
    var seq = 0;

    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function enabled() { try { return (typeof window === 'undefined') || window.__GENESIS_INTERIORS === true; } catch (_) { return true; } }
    function emit(type, payload) {
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload || {}); } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:' + type, { detail: payload || {} }));
        }
      } catch (_) {}
    }
    function vec(v, fallback) {
      fallback = fallback || { x: 0, y: 0, z: 0 };
      if (!v) return clone(fallback);
      if (Array.isArray(v)) return { x: Number(v[0] || 0), y: Number(v[1] || 0), z: Number(v[2] || 0) };
      return { x: Number(v.x || 0), y: Number(v.y || 0), z: Number(v.z || 0) };
    }
    function normalize(spec) {
      spec = spec || {};
      var id = spec.id || ('door_' + (++seq));
      return {
        id: id,
        label: spec.label || spec.name || ('Door ' + id),
        buildingId: spec.buildingId || null,
        propertyId: spec.propertyId || null,
        interiorId: spec.interiorId || null,
        locked: !!spec.locked,
        pos: vec(spec.pos, { x: 0, y: 0, z: 0 }),
        exitPos: vec(spec.exitPos || spec.returnTo || spec.pos, { x: 0, y: 0, z: 2 }),
        tags: Array.isArray(spec.tags) ? spec.tags.slice() : ['door', 'portal', 'apartment'],
        createdAt: spec.createdAt || now(),
        updatedAt: spec.updatedAt || now(),
        meta: Object.assign({}, spec.meta || {})
      };
    }
    function publicDoor(d) { return d ? clone(d) : null; }
    function raw(id) { return doors.get(id) || null; }
    function defineDoor(spec) {
      if (!enabled()) return null;
      var d = normalize(spec);
      if (doors.has(d.id)) d = Object.assign(doors.get(d.id), d, { updatedAt: now() });
      else doors.set(d.id, d);
      try {
        if (Genesis.EntityRegistry && Genesis.EntityRegistry.register && !Genesis.EntityRegistry.has(d.id)) {
          Genesis.EntityRegistry.register(spec && spec.obj ? spec.obj : null, {
            id: d.id,
            kind: 'door',
            owner: 'world',
            tags: d.tags,
            meta: { label: d.label, buildingId: d.buildingId, propertyId: d.propertyId, interiorId: d.interiorId, locked: d.locked, pos: d.pos }
          });
        }
      } catch (_) {}
      try { if (Genesis.PropertyLedger && d.propertyId) Genesis.PropertyLedger.setLinks(d.propertyId, { doorId: d.id, interiorId: d.interiorId, buildingId: d.buildingId }); } catch (_) {}
      emit('door:defined', { doorId: d.id, propertyId: d.propertyId, interiorId: d.interiorId });
      return publicDoor(d);
    }
    function get(id) { return publicDoor(doors.get(id)); }
    function list(filter) {
      filter = filter || {};
      var out = [];
      doors.forEach(function (d) {
        if (filter.propertyId && d.propertyId !== filter.propertyId) return;
        if (filter.interiorId && d.interiorId !== filter.interiorId) return;
        if (filter.buildingId && d.buildingId !== filter.buildingId) return;
        out.push(publicDoor(d));
      });
      return out;
    }
    function canEnter(actor, d) {
      if (!d || d.locked) return false;
      if (!d.propertyId || !Genesis.PropertyLedger || !Genesis.PropertyLedger.canEnter) return true;
      return Genesis.PropertyLedger.canEnter(actor || 'guest', d.propertyId);
    }
    function enter(actor, doorId, opts) {
      opts = opts || {};
      actor = actor || 'guest';
      var d = doors.get(doorId);
      if (!enabled()) return { ok: false, error: 'interiors-disabled' };
      if (!d) return { ok: false, error: 'door-not-found' };
      if (!canEnter(actor, d)) {
        emit('door:denied', { actor: actor, doorId: d.id, propertyId: d.propertyId, reason: d.locked ? 'locked' : 'permission' });
        return { ok: false, error: d.locked ? 'locked' : 'permission-denied' };
      }
      if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.ensure && d.interiorId) {
        Genesis.InteriorInstanceManager.ensure(d.interiorId, { id: d.interiorId, propertyId: d.propertyId, doorId: d.id, template: d.meta && d.meta.template });
      }
      var returnTo = vec(opts.from || opts.returnTo || d.exitPos || d.pos, d.exitPos);
      var result = { ok: true, actor: actor, doorId: d.id, propertyId: d.propertyId, interiorId: d.interiorId, returnTo: returnTo };
      if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.enter && d.interiorId) {
        var e = Genesis.InteriorInstanceManager.enter(actor, d.interiorId, { via: d.id, returnTo: returnTo });
        if (!e || !e.ok) return e || { ok: false, error: 'interior-enter-failed' };
        result.interior = e.interior;
      }
      activeByActor.set(actor, result);
      emit('door:entered', result);
      return clone(result);
    }
    function exit(actor, interiorId) {
      actor = actor || 'guest';
      var active = activeByActor.get(actor) || null;
      var targetInterior = interiorId || (active && active.interiorId);
      if (!targetInterior) return { ok: false, error: 'no-active-interior' };
      var door = active ? doors.get(active.doorId) : null;
      var ret = active ? active.returnTo : (door ? door.exitPos : null);
      if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.exit) {
        var e = Genesis.InteriorInstanceManager.exit(actor, targetInterior);
        if (e && e.returnTo) ret = e.returnTo;
      }
      activeByActor.delete(actor);
      var out = { ok: true, actor: actor, interiorId: targetInterior, doorId: door ? door.id : (active && active.doorId) || null, returnTo: ret || { x: 0, y: 0, z: 0 } };
      emit('door:exited', out);
      return clone(out);
    }
    function current(actor) { return clone(activeByActor.get(actor || 'guest') || null); }
    function setLocked(doorId, locked) {
      var d = doors.get(doorId);
      if (!d) return { ok: false, error: 'door-not-found' };
      d.locked = !!locked;
      d.updatedAt = now();
      emit('door:lock', { doorId: d.id, locked: d.locked });
      return { ok: true, door: publicDoor(d) };
    }
    function linkApartment(spec) {
      spec = spec || {};
      var propertyId = spec.propertyId;
      if (!propertyId && Genesis.PropertyLedger && Genesis.PropertyLedger.registerProperty) {
        var p = Genesis.PropertyLedger.registerProperty({ name: spec.name, price: spec.price, access: spec.access || 'preview', preview: spec.preview !== false, interiorId: spec.interiorId, buildingId: spec.buildingId });
        propertyId = p && p.id;
      }
      var interiorId = spec.interiorId || (propertyId ? (propertyId + ':interior') : null);
      if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.ensure && interiorId) {
        Genesis.InteriorInstanceManager.ensure(interiorId, { id: interiorId, propertyId: propertyId, template: spec.template || 'studio', name: spec.name });
      }
      return defineDoor(Object.assign({}, spec, { propertyId: propertyId, interiorId: interiorId }));
    }
    function snapshot() { return { version: VERSION, doors: list(), active: Array.from(activeByActor.entries()).map(function (e) { return { actor: e[0], location: e[1] }; }) }; }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      var items = Array.isArray(state) ? state : state.doors;
      if (!Array.isArray(items)) return false;
      doors.clear(); activeByActor.clear(); seq = 0;
      items.forEach(function (d) {
        if (d && d.id) {
          doors.set(d.id, normalize(d));
          var m = /^door_(\d+)$/.exec(d.id);
          if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0);
        }
      });
      if (Array.isArray(state.active)) state.active.forEach(function (a) { if (a && a.actor && a.location) activeByActor.set(a.actor, a.location); });
      emit('door:loaded-state', { count: doors.size });
      return true;
    }
    function clear() { doors.clear(); activeByActor.clear(); seq = 0; }
    function summary() { return { enabled: enabled(), count: doors.size, active: activeByActor.size }; }

    var API = { VERSION: VERSION, defineDoor: defineDoor, linkApartment: linkApartment, get: get, list: list, enter: enter, exit: exit, current: current, canEnter: function (actor, doorId) { return canEnter(actor, doors.get(doorId)); }, setLocked: setLocked, snapshot: snapshot, load: load, clear: clear, summary: summary, _raw: raw };
    Genesis.DoorPortalManager = API;

    try {
      if (Genesis.AffordanceModel && Genesis.AffordanceModel.define) {
        Genesis.AffordanceModel.define('door', [{ id: 'enter', verb: 'enter', score: 0.9 }, { id: 'knock', verb: 'knock', score: 0.45 }, { id: 'buy-apartment', verb: 'buy', score: 0.5 }]);
        Genesis.AffordanceModel.define('property', [{ id: 'buy-apartment', verb: 'buy', score: 0.75 }, { id: 'inspect', verb: 'inspect', score: 0.45 }]);
      }
    } catch (_) {}
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') Genesis.Immortality.registerSystem('door-portal-manager', { snapshot: snapshot, load: load, summary: summary });
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('door-portal-manager', { status: 'validated', path: './src/genesis/door-portal-manager.js', gun: 'DOOR' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
