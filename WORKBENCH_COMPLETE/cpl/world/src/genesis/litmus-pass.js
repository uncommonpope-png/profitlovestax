// litmus-pass.js — P51 Days-Later Litmus PASS
// ============================================================================
// Proves GSK/world can reopen later with exact state integrity. It wraps the
// Immortality checksum contract with age/exactness checks and proof records.
(function () {
  var DAY_MS = 24 * 60 * 60 * 1000;
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.LitmusPass) return;

    var proofs = [];
    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function imm() {
      try { if (Genesis.Immortality) return Genesis.Immortality; } catch (_) {}
      try { if (typeof window !== 'undefined' && window.GenesisImmortality) return window.GenesisImmortality; } catch (_) {}
      if (typeof require !== 'undefined') { try { return require('./immortality'); } catch (_) {} }
      return null;
    }
    function checksum(obj) {
      var I = imm();
      if (I && typeof I.checksum === 'function') return I.checksum(obj);
      var s = JSON.stringify(obj); var h = 0x811c9dc5;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      return h >>> 0;
    }
    function mark(label, surfaces, opts) {
      opts = opts || {};
      var I = imm();
      var save = I && I.snapshot ? I.snapshot(surfaces || {}) : { v: 1, at: now(), self: (surfaces && surfaces.self) || null, world: (surfaces && surfaces.world) || [] };
      if (typeof opts.at === 'number') save.at = opts.at;
      save.litmusLabel = label || 'litmus';
      save.litmusHash = checksum({ self: save.self || null, world: save.world || [] });
      if (I && I.checksum) save.checksum = I.checksum(Object.assign({}, save, { checksum: undefined }));
      return save;
    }
    function verify(save, lastGood, opts) {
      opts = opts || {};
      var I = imm();
      var minAgeMs = typeof opts.minAgeMs === 'number' ? opts.minAgeMs : DAY_MS;
      var checkAt = typeof opts.now === 'number' ? opts.now : now();
      if (!save) return { ok: false, error: 'missing-save' };
      var ageMs = checkAt - (save.at || 0);
      if (ageMs < minAgeMs) return { ok: false, error: 'not-old-enough', ageMs: ageMs, minAgeMs: minAgeMs };
      var loaded = I && I.load ? I.load(save, lastGood || null) : { ok: true, state: save };
      if (!loaded.ok) return { ok: false, error: loaded.error || 'load-failed', ageMs: ageMs };
      var state = loaded.state || save;
      var expected = save.litmusHash || checksum({ self: save.self || null, world: save.world || [] });
      var actual = checksum({ self: state.self || null, world: state.world || [] });
      var ok = expected === actual;
      var proof = { ok: ok, label: save.litmusLabel || 'litmus', ageMs: ageMs, expectedHash: expected, actualHash: actual, fromLastGood: !!loaded.fromLastGood, at: checkAt };
      if (!ok) proof.error = 'exact-state-mismatch';
      proofs.push(proof); if (proofs.length > 50) proofs.shift();
      return proof;
    }
    function latest() { return proofs[proofs.length - 1] || null; }
    var API = { DAY_MS: DAY_MS, mark: mark, verify: verify, latest: latest, proofs: function () { return proofs.slice(); }, summary: function () { var l = latest(); return { proofs: proofs.length, latestOk: !!(l && l.ok), latest: l }; } };
    Genesis.LitmusPass = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('litmus-pass', { status: 'validated', path: './src/genesis/litmus-pass.js', gun: 'IMM' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
