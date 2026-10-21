// avatar-customizer.js — GENESIS INTERIORS: persistent personal body/profile
// =================================================================================
// Avatar customization is the user-facing twin of apartment ownership: the body
// and the room both remember identity. This module stores portable profiles and
// mirrors profile metadata onto any matching EntityRegistry citizen.
(function () {
  var VERSION = 1;
  var SLOTS = ['hair', 'top', 'bottom', 'shoes', 'accessory', 'aura'];
  var DEFAULT_PROFILE = {
    body: 'humanoid',
    palette: { skin: '#c08457', hair: '#111827', primary: '#38bdf8', accent: '#f472b6' },
    outfit: { top: 'genesis-jacket', bottom: 'dark-city-pants', shoes: 'runner-boots', accessory: null, aura: 'soft-glow' },
    scale: 1,
    title: 'Genesis Citizen'
  };

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AvatarCustomizer) return;

    var profiles = new Map();

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
    function actorId(actor) { return (actor == null || actor === '') ? 'guest' : String(actor); }
    function validColor(c) { return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c); }
    function normalizePatch(patch) {
      patch = patch || {};
      var out = clone(patch);
      if (out.palette) {
        Object.keys(out.palette).forEach(function (k) { if (!validColor(out.palette[k])) delete out.palette[k]; });
      }
      if (out.scale != null) out.scale = Math.max(0.5, Math.min(2, Number(out.scale) || 1));
      return out;
    }
    function make(actor, patch) {
      actor = actorId(actor);
      patch = normalizePatch(patch);
      var base = clone(DEFAULT_PROFILE);
      return {
        actor: actor,
        body: patch.body || base.body,
        palette: Object.assign({}, base.palette, patch.palette || {}),
        outfit: Object.assign({}, base.outfit, patch.outfit || {}),
        scale: patch.scale || base.scale,
        title: patch.title || base.title,
        accessories: Array.isArray(patch.accessories) ? patch.accessories.slice() : [],
        createdAt: patch.createdAt || now(),
        updatedAt: patch.updatedAt || now(),
        meta: Object.assign({}, patch.meta || {})
      };
    }
    function syncEntity(actor) {
      try {
        if (!Genesis.EntityRegistry || !Genesis.EntityRegistry.snapshot) return;
        var p = profiles.get(actor);
        if (!p) return;
        var snap = Genesis.EntityRegistry.snapshot();
        for (var i = 0; i < snap.length; i++) {
          if (snap[i].owner === actor || snap[i].id === actor || snap[i].owner === ('agent://' + actor.replace(/^agent:\/\//, ''))) {
            var rec = Genesis.EntityRegistry.get(snap[i].id);
            if (rec) rec.meta = Object.assign({}, rec.meta || {}, { avatar: clone(p) });
          }
        }
      } catch (_) {}
    }
    function createProfile(actor, patch) {
      if (!enabled()) return null;
      actor = actorId(actor);
      var p = make(actor, patch || {});
      profiles.set(actor, p);
      syncEntity(actor);
      emit('avatar:created', { actor: actor, profile: clone(p) });
      return clone(p);
    }
    function getProfile(actor) {
      actor = actorId(actor);
      if (!profiles.has(actor)) createProfile(actor, {});
      return clone(profiles.get(actor));
    }
    function updateProfile(actor, patch) {
      actor = actorId(actor);
      var current = profiles.get(actor) || make(actor, {});
      patch = normalizePatch(patch || {});
      var next = Object.assign({}, current, patch);
      next.palette = Object.assign({}, current.palette || {}, patch.palette || {});
      next.outfit = Object.assign({}, current.outfit || {}, patch.outfit || {});
      if (Array.isArray(patch.accessories)) next.accessories = patch.accessories.slice();
      next.updatedAt = now();
      profiles.set(actor, next);
      syncEntity(actor);
      emit('avatar:updated', { actor: actor, profile: clone(next) });
      return { ok: true, profile: clone(next) };
    }
    function equip(actor, slot, item) {
      if (SLOTS.indexOf(slot) === -1) return { ok: false, error: 'bad-slot' };
      var patch = { outfit: {} };
      patch.outfit[slot] = item || null;
      return updateProfile(actor, patch);
    }
    function unequip(actor, slot) { return equip(actor, slot, null); }
    function list() { var out = []; profiles.forEach(function (p) { out.push(clone(p)); }); return out; }
    function snapshot() { return { version: VERSION, profiles: list() }; }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      var items = Array.isArray(state) ? state : state.profiles;
      if (!Array.isArray(items)) return false;
      profiles.clear();
      items.forEach(function (p) { if (p && p.actor) profiles.set(p.actor, make(p.actor, p)); });
      profiles.forEach(function (_, actor) { syncEntity(actor); });
      emit('avatar:loaded', { count: profiles.size });
      return true;
    }
    function clear() { profiles.clear(); }
    function summary() { return { enabled: enabled(), profiles: profiles.size, slots: SLOTS.slice() }; }

    var API = { VERSION: VERSION, SLOTS: SLOTS.slice(), DEFAULT_PROFILE: clone(DEFAULT_PROFILE), createProfile: createProfile, getProfile: getProfile, updateProfile: updateProfile, equip: equip, unequip: unequip, list: list, snapshot: snapshot, load: load, clear: clear, summary: summary };
    Genesis.AvatarCustomizer = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') Genesis.Immortality.registerSystem('avatar-customizer', { snapshot: snapshot, load: load, summary: summary });
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('avatar-customizer', { status: 'validated', path: './src/genesis/avatar-customizer.js', gun: 'AVATAR' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
