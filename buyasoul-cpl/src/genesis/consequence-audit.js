// consequence-audit.js — P38/P142 Full Consequence Loop Audit
// ============================================================================
// Watches EventBridge and proves emitted events have visible/engine reactions.
// Additive: does not change EventBridge; it listens and reports missing links.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.ConsequenceAudit) return;

    var FLAG = '__GENESIS_CONSEQUENCE_AUDIT';
    var DEFAULT_WINDOW_MS = 2000;
    var emitted = [];
    var reactions = [];
    var expectations = new Map();

    function flagOn() { try { return (typeof window === 'undefined') || window[FLAG] !== false; } catch (_) { return true; } }
    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function pushCapped(list, rec, cap) { list.push(rec); if (list.length > (cap || 300)) list.shift(); }
    function arr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

    var defaultPairs = {
      'agent:gather': ['agent:react', 'world:reaction', 'plt:recorded'],
      'agent:build': ['agent:react', 'world:reaction', 'builder:schematic', 'prophet:archive'],
      'agent:trade': ['agent:react', 'trust:change', 'merchant:purchase', 'plt:recorded'],
      'agent:say': ['dialogue:shown', 'genesis:interact:talk', 'trust-dialogue:say'],
      'trust:change': ['agent:react', 'trust-dialogue:say', 'world:reaction'],
      'trust:betrayal': ['betrayal:recorded', 'agent:betrayal', 'agent:threaten'],
      'betrayal:recorded': ['betrayal:gossip', 'agent:betrayal', 'agent:threaten'],
      'world:mutation': ['world:reaction', 'immortality:snapshot', 'plt:recorded'],
      'quest:complete': ['quest:consequence', 'prophet:archive', 'world:reaction'],
      'skill:unlocked': ['skill:recommendation', 'agent:say', 'prophet:archive']
    };

    function expect(eventType, reactionTypes, opts) {
      if (!eventType) return false;
      expectations.set(eventType, { reactions: arr(reactionTypes), windowMs: (opts && opts.windowMs) || DEFAULT_WINDOW_MS, required: !(opts && opts.optional) });
      return true;
    }
    function seedDefaults() { Object.keys(defaultPairs).forEach(function (k) { expect(k, defaultPairs[k]); }); }
    function isReactionFor(evt, candidate) {
      if (!evt || !candidate) return false;
      var spec = expectations.get(evt.type);
      if (!spec) return false;
      if (spec.reactions.indexOf(candidate.type) === -1) return false;
      if (candidate.at < evt.at) return false;
      return (candidate.at - evt.at) <= spec.windowMs;
    }
    function recordReaction(type, payload) {
      var rec = { type: type, payload: payload || {}, at: now(), source: 'manual' };
      pushCapped(reactions, rec);
      return rec;
    }
    function onEvent(evt) {
      if (!flagOn() || !evt || !evt.type) return;
      var rec = { type: evt.type, payload: evt.payload || {}, at: evt.at || now(), source: 'event-bridge' };
      pushCapped(emitted, rec);
      // Any event can be a reaction to prior expected events.
      pushCapped(reactions, rec);
    }
    function audit(opts) {
      opts = opts || {};
      var since = opts.since || 0;
      var onlyExpected = opts.onlyExpected !== false;
      var missing = [];
      var satisfied = [];
      emitted.filter(function (e) { return e.at >= since; }).forEach(function (evt) {
        var spec = expectations.get(evt.type);
        if (!spec) { if (!onlyExpected) satisfied.push({ event: evt.type, state: 'untracked' }); return; }
        var found = reactions.find(function (r) { return r !== evt && isReactionFor(evt, r); });
        if (found) satisfied.push({ event: evt.type, reaction: found.type, latencyMs: found.at - evt.at });
        else if (spec.required) missing.push({ event: evt.type, expected: spec.reactions.slice(), windowMs: spec.windowMs, at: evt.at });
      });
      return { ok: missing.length === 0, emitted: emitted.length, tracked: expectations.size, satisfied: satisfied, missing: missing };
    }
    function clear() { emitted = []; reactions = []; return true; }

    seedDefaults();
    if (Genesis.EventBridge && typeof Genesis.EventBridge.on === 'function') Genesis.EventBridge.on('*', onEvent);

    var API = { expect: expect, recordReaction: recordReaction, audit: audit, clear: clear, summary: function () { var r = audit(); return { enabled: flagOn(), tracked: expectations.size, emitted: emitted.length, missing: r.missing.length, ok: r.ok }; } };
    Genesis.ConsequenceAudit = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('consequence-audit', { status: 'validated', path: './src/genesis/consequence-audit.js', gun: 'AUDIT' });
    if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit('consequence-audit:ready', { at: now() });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
