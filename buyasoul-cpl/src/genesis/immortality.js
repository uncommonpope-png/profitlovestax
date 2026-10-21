// immortality.js — Step 5 (NEVER DIES): two-surface serialization + integrity + boot reload.
// Surface A = GSK's SELF (host-provided: bedrock identity_kernel, distilled memory, raw
// transcripts, narrative). Surface B = the WORLD (EntityRegistry snapshot delta).
// The engine owns BOTH stores; the save's checksum + version gate rejects corruption so
// GSK can never silently revive wrong. CASCADE: player cannot delete memory / rewrite self.
(function () {
  const VERSION = 1;

  // Deterministic, dependency-free checksum over a JSON-serializable payload.
  function checksum(obj) {
    const s = JSON.stringify(obj);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // Build a save payload from the two surfaces. Checksum covers everything but itself.
  function snapshot(surfaces) {
    const payload = {
      v: VERSION,
      at: Date.now(),
      self: (surfaces && surfaces.self) || null,        // Surface A: GSK SELF
      world: (surfaces && surfaces.world) || []         // Surface B: world entities
    };
    payload.checksum = checksum(payload);
    return payload;
  }

  // Integrity gate: version match + checksum match. Corruption = wrong revival -> reject.
  function validate(save) {
    if (!save || typeof save !== 'object') return { ok:false, error:'no-save' };
    if (save.v !== VERSION) return { ok:false, error:'version:' + save.v };
    const probe = checksum(Object.assign({}, save, { checksum: undefined }));
    if (probe !== save.checksum) return { ok:false, error:'checksum-mismatch' };
    return { ok:true };
  }

  // Boot reload: validate; on corruption, fall back to last-known-good (or clean boot).
  function load(save, lastGood) {
    const v = validate(save);
    if (!v.ok) {
      if (lastGood) { const lg = validate(lastGood); if (lg.ok) return { ok:true, fromLastGood:true, state:lastGood }; }
      return { ok:false, error:v.error };
    }
    return { ok:true, state:save };
  }

  const Immortality = { VERSION, checksum, snapshot, validate, load };
  if (typeof module !== 'undefined' && module.exports) module.exports = Immortality;
  if (typeof window !== 'undefined') window.GenesisImmortality = Immortality;
})();
