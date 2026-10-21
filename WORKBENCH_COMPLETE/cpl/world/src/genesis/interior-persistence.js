// interior-persistence.js — GENESIS INTERIORS: exact restore for homes + avatars
// =================================================================================
// Aggregates all interior/apartment systems into one deterministic save surface.
// This is Wallmeria-compatible product state: portable JSON, no localhost paths,
// no Craig-PC dependency. The hash ignores the snapshot timestamp and covers only
// the durable systems payload so exact restore is provable.
(function () {
  var VERSION = 1;
  var KEY = 'genesis:interiors-save';
  var SYSTEMS = [
    ['properties', 'PropertyLedger'],
    ['interiors', 'InteriorInstanceManager'],
    ['doors', 'DoorPortalManager'],
    ['decor', 'InteriorCustomizer'],
    ['avatars', 'AvatarCustomizer'],
    ['commerce', 'ApartmentCommerce']
  ];

  function checksum(obj) {
    var s = JSON.stringify(obj);
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.InteriorPersistence) return;

    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function emit(type, payload) { try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload || {}); } catch (_) {} }
    function collectSystems() {
      var out = {};
      SYSTEMS.forEach(function (pair) {
        var key = pair[0], name = pair[1];
        var sys = Genesis[name];
        if (sys && typeof sys.snapshot === 'function') out[key] = sys.snapshot();
      });
      return out;
    }
    function snapshot(meta) {
      var systems = collectSystems();
      var payload = { version: VERSION, at: now(), systems: systems, meta: Object.assign({ doctrine: 'GENESIS_INTERIORS_TWO_SURFACE_SAVE' }, meta || {}) };
      payload.hash = checksum({ version: payload.version, systems: payload.systems });
      return payload;
    }
    function validate(save) {
      if (!save || typeof save !== 'object') return { ok: false, error: 'no-save' };
      if (save.version !== VERSION) return { ok: false, error: 'version:' + save.version };
      var h = checksum({ version: save.version, systems: save.systems || {} });
      if (h !== save.hash) return { ok: false, error: 'hash-mismatch', expected: save.hash, actual: h };
      return { ok: true, hash: h };
    }
    function restore(save) {
      var v = validate(save);
      if (!v.ok) return v;
      var systems = save.systems || {};
      SYSTEMS.forEach(function (pair) {
        var key = pair[0], name = pair[1];
        var sys = Genesis[name];
        if (sys && typeof sys.load === 'function' && systems[key]) sys.load(clone(systems[key]));
      });
      emit('interiors:restored', { hash: save.hash, systems: Object.keys(systems) });
      return { ok: true, hash: save.hash };
    }
    function prove(save) {
      var r = restore(save);
      if (!r.ok) return r;
      var after = snapshot({ proof: true });
      return { ok: after.hash === save.hash, expectedHash: save.hash, actualHash: after.hash, restored: r.ok };
    }
    function saveToStorage(storage) {
      storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (!storage || !storage.setItem) return { ok: false, error: 'no-storage' };
      var s = snapshot({ storage: KEY });
      storage.setItem(KEY, JSON.stringify(s));
      emit('interiors:saved', { hash: s.hash, key: KEY });
      return { ok: true, save: s, key: KEY };
    }
    function loadFromStorage(storage) {
      storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (!storage || !storage.getItem) return { ok: false, error: 'no-storage' };
      var raw = storage.getItem(KEY);
      if (!raw) return { ok: false, error: 'missing-save' };
      try { return restore(JSON.parse(raw)); } catch (e) { return { ok: false, error: 'parse:' + (e && e.message) }; }
    }
    function summary() {
      var s = snapshot({ summary: true });
      var counts = {};
      SYSTEMS.forEach(function (pair) {
        var key = pair[0], name = pair[1], sys = Genesis[name];
        counts[key] = sys && typeof sys.summary === 'function' ? sys.summary() : null;
      });
      return { enabled: true, hash: s.hash, systems: Object.keys(s.systems), counts: counts };
    }

    var API = { VERSION: VERSION, KEY: KEY, checksum: checksum, snapshot: snapshot, validate: validate, restore: restore, prove: prove, saveToStorage: saveToStorage, loadFromStorage: loadFromStorage, summary: summary };
    Genesis.InteriorPersistence = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') Genesis.Immortality.registerSystem('interior-persistence', { snapshot: snapshot, load: restore, summary: summary });
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('interior-persistence', { status: 'validated', path: './src/genesis/interior-persistence.js', gun: 'SAVE' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, checksum: checksum };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
