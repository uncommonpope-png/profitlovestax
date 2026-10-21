// interior-instance-manager.js — GENESIS INTERIORS: one loaded private room at a time
// =================================================================================
// Creates durable interior instances for apartment doors. The manager keeps the
// engine lightweight: an exterior city can have many doors/properties, but only
// the active interior is marked loaded. Rendering adapters can later subscribe
// to interior:loaded / interior:entered and materialize the room.
(function () {
  var VERSION = 1;
  var TEMPLATES = {
    studio: {
      rooms: [{ id: 'main', name: 'Main Room', size: { x: 12, y: 4, z: 10 } }],
      slots: [
        { id: 'bed-wall', type: 'bed', pos: { x: -3, y: 0, z: -3 } },
        { id: 'desk-window', type: 'desk', pos: { x: 3, y: 0, z: -2 } },
        { id: 'poster-east', type: 'wall-decor', pos: { x: 5.8, y: 2, z: 0 } }
      ],
      theme: { wall: '#111827', floor: '#1f2937', accent: '#7dd3fc', light: '#fef3c7' }
    },
    loft: {
      rooms: [{ id: 'lower', name: 'Lower Loft', size: { x: 16, y: 5, z: 12 } }, { id: 'mezzanine', name: 'Mezzanine', size: { x: 8, y: 3, z: 6 } }],
      slots: [
        { id: 'sofa-core', type: 'sofa', pos: { x: 0, y: 0, z: 1 } },
        { id: 'neon-wall', type: 'light', pos: { x: -7.5, y: 2.4, z: 0 } },
        { id: 'plant-corner', type: 'plant', pos: { x: 6, y: 0, z: 4 } }
      ],
      theme: { wall: '#0f172a', floor: '#020617', accent: '#f472b6', light: '#a7f3d0' }
    },
    suite: {
      rooms: [{ id: 'living', name: 'Living Room', size: { x: 18, y: 5, z: 14 } }, { id: 'sleep', name: 'Sleep Chamber', size: { x: 10, y: 4, z: 9 } }],
      slots: [
        { id: 'table-center', type: 'table', pos: { x: 0, y: 0, z: 0 } },
        { id: 'memory-shrine', type: 'shrine', pos: { x: 0, y: 0, z: -6 } },
        { id: 'light-west', type: 'light', pos: { x: -8, y: 3, z: 0 } }
      ],
      theme: { wall: '#18181b', floor: '#27272a', accent: '#fde047', light: '#e0f2fe' }
    }
  };

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.InteriorInstanceManager) return;

    var interiors = new Map();
    var seq = 0;

    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function template(name) { return clone(TEMPLATES[name] || TEMPLATES.studio); }
    function emit(type, payload) {
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload || {}); } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:' + type, { detail: payload || {} }));
        }
      } catch (_) {}
    }
    function enabled() { try { return (typeof window === 'undefined') || window.__GENESIS_INTERIORS === true; } catch (_) { return true; } }
    function make(spec) {
      spec = spec || {};
      var id = spec.id || ('interior_' + (++seq));
      var tplName = spec.template || spec.templateId || 'studio';
      var tpl = template(tplName);
      return {
        id: id,
        kind: spec.kind || 'apartment-interior',
        template: tplName,
        name: spec.name || spec.label || ('Interior ' + id),
        propertyId: spec.propertyId || null,
        doorId: spec.doorId || null,
        loaded: !!spec.loaded,
        occupants: Array.isArray(spec.occupants) ? spec.occupants.slice() : [],
        rooms: clone(spec.rooms || tpl.rooms || []),
        slots: clone(spec.slots || tpl.slots || []),
        theme: Object.assign({}, tpl.theme || {}, spec.theme || {}),
        state: Object.assign({ decor: [] }, spec.state || {}),
        createdAt: spec.createdAt || now(),
        updatedAt: spec.updatedAt || now(),
        lastReturnTo: spec.lastReturnTo || null,
        lastEnteredAt: spec.lastEnteredAt || null,
        meta: Object.assign({}, spec.meta || {})
      };
    }
    function publicRecord(r) { return r ? clone(r) : null; }
    function raw(id) { return interiors.get(id) || null; }
    function create(spec) {
      if (!enabled()) return null;
      var r = make(spec);
      if (interiors.has(r.id)) r = Object.assign(interiors.get(r.id), r, { updatedAt: now() });
      else interiors.set(r.id, r);
      try {
        if (Genesis.EntityRegistry && Genesis.EntityRegistry.register && !Genesis.EntityRegistry.has(r.id)) {
          Genesis.EntityRegistry.register(null, {
            id: r.id,
            kind: 'interior',
            owner: 'world',
            tags: ['interior', r.kind, r.template],
            meta: { name: r.name, propertyId: r.propertyId, doorId: r.doorId, loaded: r.loaded, template: r.template }
          });
        }
      } catch (_) {}
      emit('interior:created', { interiorId: r.id, propertyId: r.propertyId, template: r.template });
      return publicRecord(r);
    }
    function ensure(id, spec) {
      if (id && interiors.has(id)) return publicRecord(interiors.get(id));
      spec = Object.assign({}, spec || {}, id ? { id: id } : {});
      return create(spec);
    }
    function get(id) { return publicRecord(interiors.get(id)); }
    function list(filter) {
      filter = filter || {};
      var out = [];
      interiors.forEach(function (r) {
        if (filter.loaded === true && !r.loaded) return;
        if (filter.propertyId && r.propertyId !== filter.propertyId) return;
        if (filter.template && r.template !== filter.template) return;
        out.push(publicRecord(r));
      });
      return out;
    }
    function loadOnly(interiorId) {
      var target = interiors.get(interiorId);
      if (!target) return { ok: false, error: 'interior-not-found' };
      interiors.forEach(function (r) {
        if (r.id !== interiorId && r.loaded) {
          r.loaded = false;
          r.updatedAt = now();
          emit('interior:unloaded', { interiorId: r.id });
        }
      });
      target.loaded = true;
      target.updatedAt = now();
      try {
        var rec = Genesis.EntityRegistry && Genesis.EntityRegistry.get ? Genesis.EntityRegistry.get(target.id) : null;
        if (rec) rec.meta = Object.assign({}, rec.meta || {}, { loaded: true });
      } catch (_) {}
      emit('interior:loaded', { interiorId: target.id, propertyId: target.propertyId });
      return { ok: true, interior: publicRecord(target) };
    }
    function unload(interiorId) {
      var r = interiors.get(interiorId);
      if (!r) return { ok: false, error: 'interior-not-found' };
      r.loaded = false;
      r.occupants = [];
      r.updatedAt = now();
      emit('interior:unloaded', { interiorId: r.id });
      return { ok: true, interior: publicRecord(r) };
    }
    function enter(actor, interiorId, opts) {
      opts = opts || {};
      actor = actor || 'guest';
      var r = interiors.get(interiorId);
      if (!r) return { ok: false, error: 'interior-not-found' };
      if (!opts.keepLoaded) loadOnly(interiorId);
      if (r.occupants.indexOf(actor) === -1) r.occupants.push(actor);
      r.lastReturnTo = opts.returnTo || r.lastReturnTo || null;
      r.lastEnteredAt = now();
      r.updatedAt = r.lastEnteredAt;
      emit('interior:entered', { actor: actor, interiorId: r.id, propertyId: r.propertyId, via: opts.via || r.doorId || null });
      return { ok: true, interior: publicRecord(r), returnTo: r.lastReturnTo || null };
    }
    function exit(actor, interiorId) {
      actor = actor || 'guest';
      var r = interiors.get(interiorId);
      if (!r) return { ok: false, error: 'interior-not-found' };
      r.occupants = r.occupants.filter(function (a) { return a !== actor; });
      if (r.occupants.length === 0) r.loaded = false;
      r.updatedAt = now();
      emit('interior:exited', { actor: actor, interiorId: r.id, propertyId: r.propertyId, returnTo: r.lastReturnTo || null });
      return { ok: true, interior: publicRecord(r), returnTo: r.lastReturnTo || null };
    }
    function setTheme(interiorId, theme) {
      var r = interiors.get(interiorId);
      if (!r) return { ok: false, error: 'interior-not-found' };
      r.theme = Object.assign({}, r.theme || {}, theme || {});
      r.updatedAt = now();
      emit('interior:theme', { interiorId: r.id, theme: clone(r.theme) });
      return { ok: true, interior: publicRecord(r) };
    }
    function setDecor(interiorId, decor) {
      var r = interiors.get(interiorId);
      if (!r) return { ok: false, error: 'interior-not-found' };
      r.state = r.state || {};
      r.state.decor = Array.isArray(decor) ? clone(decor) : [];
      r.updatedAt = now();
      emit('interior:decor', { interiorId: r.id, count: r.state.decor.length });
      return { ok: true, interior: publicRecord(r) };
    }
    function snapshot() { return { version: VERSION, interiors: list() }; }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      var items = Array.isArray(state) ? state : state.interiors;
      if (!Array.isArray(items)) return false;
      interiors.clear();
      seq = 0;
      items.forEach(function (r) {
        if (r && r.id) {
          interiors.set(r.id, make(r));
          var m = /^interior_(\d+)$/.exec(r.id);
          if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0);
        }
      });
      emit('interior:loaded-state', { count: interiors.size });
      return true;
    }
    function clear() { interiors.clear(); seq = 0; }
    function summary() {
      var loaded = 0, occupants = 0;
      interiors.forEach(function (r) { if (r.loaded) loaded++; occupants += r.occupants.length; });
      return { enabled: enabled(), count: interiors.size, loaded: loaded, occupants: occupants };
    }

    var API = { VERSION: VERSION, TEMPLATES: clone(TEMPLATES), create: create, ensure: ensure, get: get, list: list, loadOnly: loadOnly, unload: unload, enter: enter, exit: exit, setTheme: setTheme, setDecor: setDecor, snapshot: snapshot, load: load, clear: clear, summary: summary, _raw: raw };
    Genesis.InteriorInstanceManager = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') {
      Genesis.Immortality.registerSystem('interior-instance-manager', { snapshot: snapshot, load: load, summary: summary });
    }
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('interior-instance-manager', { status: 'validated', path: './src/genesis/interior-instance-manager.js', gun: 'ROOM' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
