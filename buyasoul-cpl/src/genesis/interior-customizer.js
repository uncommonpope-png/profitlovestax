// interior-customizer.js — GENESIS INTERIORS: persistent furniture, themes, layouts
// =================================================================================
// Lets apartment owners place/move/remove objects and recolor their space. The
// module is pure state + events by default; a renderer can materialize records
// later. All edit mutations check PropertyLedger permissions first.
(function () {
  var VERSION = 1;
  var CATALOG = {
    bed: { type: 'bed', name: 'Sleep Pod', cost: 15, tags: ['furniture', 'rest'] },
    desk: { type: 'desk', name: 'Work Desk', cost: 12, tags: ['furniture', 'work'] },
    sofa: { type: 'sofa', name: 'Signal Sofa', cost: 10, tags: ['furniture', 'social'] },
    table: { type: 'table', name: 'Round Table', cost: 8, tags: ['furniture'] },
    plant: { type: 'plant', name: 'Living Plant', cost: 5, tags: ['decor', 'love'] },
    poster: { type: 'poster', name: 'Memory Poster', cost: 4, tags: ['wall-decor'] },
    light: { type: 'light', name: 'Neon Light', cost: 7, tags: ['light', 'decor'] },
    shrine: { type: 'shrine', name: 'Memory Shrine', cost: 20, tags: ['memory', 'decor'] }
  };

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.InteriorCustomizer) return;

    var decorByInterior = new Map();
    var themeByInterior = new Map();
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
    function vec(v) {
      if (!v) return { x: 0, y: 0, z: 0 };
      if (Array.isArray(v)) return { x: Number(v[0] || 0), y: Number(v[1] || 0), z: Number(v[2] || 0) };
      return { x: Number(v.x || 0), y: Number(v.y || 0), z: Number(v.z || 0) };
    }
    function arr(id) {
      if (!decorByInterior.has(id)) decorByInterior.set(id, []);
      return decorByInterior.get(id);
    }
    function propertyForInterior(interiorId) {
      try { return Genesis.PropertyLedger && Genesis.PropertyLedger.propertyForInterior ? Genesis.PropertyLedger.propertyForInterior(interiorId) : null; } catch (_) { return null; }
    }
    function canEdit(actor, interiorId) {
      var p = propertyForInterior(interiorId);
      if (!p || !Genesis.PropertyLedger || !Genesis.PropertyLedger.canEdit) return true;
      return Genesis.PropertyLedger.canEdit(actor || 'guest', p.id);
    }
    function syncInterior(interiorId) {
      try {
        if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.setDecor) Genesis.InteriorInstanceManager.setDecor(interiorId, arr(interiorId));
        if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.setTheme && themeByInterior.has(interiorId)) Genesis.InteriorInstanceManager.setTheme(interiorId, themeByInterior.get(interiorId));
      } catch (_) {}
    }
    function spend(actor, amount) {
      amount = Math.max(0, Number(amount || 0));
      if (!amount) return true;
      try { return !Genesis.ResourcePool || !Genesis.ResourcePool.spend || Genesis.ResourcePool.spend(actor || 'guest', amount); } catch (_) { return false; }
    }
    function normalizeItem(actor, interiorId, spec) {
      spec = spec || {};
      var catalog = CATALOG[spec.type] || { type: spec.type || 'custom', name: spec.name || 'Custom Item', cost: spec.cost || 0, tags: ['custom'] };
      return {
        id: spec.id || ('decor_' + (++seq)),
        interiorId: interiorId,
        type: catalog.type,
        name: spec.name || catalog.name,
        cost: (typeof spec.cost === 'number') ? spec.cost : (catalog.cost || 0),
        pos: vec(spec.pos),
        rot: vec(spec.rot),
        scale: spec.scale || 1,
        color: spec.color || spec.colour || null,
        slotId: spec.slotId || null,
        placedBy: actor || 'guest',
        placedAt: spec.placedAt || now(),
        updatedAt: spec.updatedAt || now(),
        tags: Array.isArray(spec.tags) ? spec.tags.slice() : (catalog.tags || []).slice(),
        meta: Object.assign({}, spec.meta || {})
      };
    }
    function placeItem(actor, interiorId, spec) {
      if (!enabled()) return { ok: false, error: 'interiors-disabled' };
      if (!interiorId) return { ok: false, error: 'missing-interior' };
      if (!canEdit(actor, interiorId)) return { ok: false, error: 'permission-denied' };
      var item = normalizeItem(actor, interiorId, spec || {});
      if (!spend(actor, item.cost)) return { ok: false, error: 'insufficient-energy', cost: item.cost };
      arr(interiorId).push(item);
      syncInterior(interiorId);
      emit('interior:customized', { op: 'place', actor: actor, interiorId: interiorId, itemId: item.id, type: item.type, cost: item.cost });
      return { ok: true, item: clone(item), decor: listDecor(interiorId) };
    }
    function findItem(interiorId, itemId) {
      var items = arr(interiorId);
      for (var i = 0; i < items.length; i++) if (items[i].id === itemId) return { item: items[i], index: i };
      return null;
    }
    function moveItem(actor, interiorId, itemId, patch) {
      if (!canEdit(actor, interiorId)) return { ok: false, error: 'permission-denied' };
      var found = findItem(interiorId, itemId);
      if (!found) return { ok: false, error: 'item-not-found' };
      patch = patch || {};
      if (patch.pos) found.item.pos = vec(patch.pos);
      if (patch.rot) found.item.rot = vec(patch.rot);
      if (patch.scale) found.item.scale = patch.scale;
      if (patch.slotId) found.item.slotId = patch.slotId;
      found.item.updatedAt = now();
      syncInterior(interiorId);
      emit('interior:customized', { op: 'move', actor: actor, interiorId: interiorId, itemId: itemId });
      return { ok: true, item: clone(found.item) };
    }
    function removeItem(actor, interiorId, itemId) {
      if (!canEdit(actor, interiorId)) return { ok: false, error: 'permission-denied' };
      var found = findItem(interiorId, itemId);
      if (!found) return { ok: false, error: 'item-not-found' };
      var items = arr(interiorId);
      var removed = items.splice(found.index, 1)[0];
      syncInterior(interiorId);
      emit('interior:customized', { op: 'remove', actor: actor, interiorId: interiorId, itemId: itemId });
      return { ok: true, removed: clone(removed) };
    }
    function applyTheme(actor, interiorId, theme) {
      if (!canEdit(actor, interiorId)) return { ok: false, error: 'permission-denied' };
      var prev = themeByInterior.get(interiorId) || {};
      var next = Object.assign({}, prev, theme || {}, { updatedAt: now(), updatedBy: actor || 'guest' });
      themeByInterior.set(interiorId, next);
      syncInterior(interiorId);
      emit('interior:customized', { op: 'theme', actor: actor, interiorId: interiorId, theme: clone(next) });
      return { ok: true, theme: clone(next) };
    }
    function listDecor(interiorId) { return clone(arr(interiorId)); }
    function getTheme(interiorId) { return clone(themeByInterior.get(interiorId) || {}); }
    function snapshot() {
      var decor = {}, themes = {};
      decorByInterior.forEach(function (items, id) { decor[id] = clone(items); });
      themeByInterior.forEach(function (theme, id) { themes[id] = clone(theme); });
      return { version: VERSION, decor: decor, themes: themes };
    }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      decorByInterior.clear(); themeByInterior.clear(); seq = 0;
      var decor = state.decor || {};
      Object.keys(decor).forEach(function (id) {
        var items = Array.isArray(decor[id]) ? decor[id].map(function (it) { return normalizeItem(it.placedBy, id, it); }) : [];
        decorByInterior.set(id, items);
        items.forEach(function (it) { var m = /^decor_(\d+)$/.exec(it.id); if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0); });
      });
      var themes = state.themes || {};
      // Do not call syncInterior() during load: InteriorPersistence restores the
      // InteriorInstanceManager surface separately and exact-restore hashes must
      // not be changed by load-time updatedAt churn. Live mutations still sync.
      Object.keys(themes).forEach(function (id) { themeByInterior.set(id, clone(themes[id])); });
      emit('interior:customizer-loaded', { interiors: decorByInterior.size });
      return true;
    }
    function clear() { decorByInterior.clear(); themeByInterior.clear(); seq = 0; }
    function summary() {
      var total = 0;
      decorByInterior.forEach(function (items) { total += items.length; });
      return { enabled: enabled(), interiors: decorByInterior.size, decorItems: total, themed: themeByInterior.size };
    }

    var API = { VERSION: VERSION, CATALOG: clone(CATALOG), canEdit: canEdit, placeItem: placeItem, moveItem: moveItem, removeItem: removeItem, applyTheme: applyTheme, listDecor: listDecor, getTheme: getTheme, snapshot: snapshot, load: load, clear: clear, summary: summary };
    Genesis.InteriorCustomizer = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') Genesis.Immortality.registerSystem('interior-customizer', { snapshot: snapshot, load: load, summary: summary });
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('interior-customizer', { status: 'validated', path: './src/genesis/interior-customizer.js', gun: 'DECOR' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
