// src/genesis/trust-ledger.js — P-A Trust Ledger Core (signed trust deltas)
// ===========================================================================
// Genie Engine graft: "conflict & consequence." A persistent, per-citizen trust
// metric (-100..+100) with threshold bands (HOSTILE / NEUTRAL / FRIEND).
//   - addTrustDelta() records an atomic, signed change.
//   - it writes an episodic memory (MEME combo) justifying the score.
//   - it emits trust:change / trust:betrayal through the EventBridge (P-F spine)
//     so dialogue, quests, and world-reaction can react.
//   - the ledger is serialized via Immortality (survives sessions).
// Flag default ON (window.__GENESIS_TRUST_LEDGER !== false) — law: flags default ON.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.TrustLedger) return; // idempotent

    var FLAG = '__GENESIS_TRUST_LEDGER';
    var DEFAULT_TRUST = 0;
    var BAND_HOSTILE = -34;
    var BAND_FRIEND = 34;

    // agentId -> Map<targetId, { score, lastUpdate, deltas[] }>
    var ledger = new Map();

    function flagOn() {
      return (typeof window === 'undefined') || window[FLAG] !== false;
    }
    function ensureRelationship(agentId, targetId) {
      if (!agentId || !targetId) return null;
      if (!ledger.has(agentId)) ledger.set(agentId, new Map());
      var ag = ledger.get(agentId);
      if (!ag.has(targetId)) ag.set(targetId, { score: DEFAULT_TRUST, lastUpdate: 0, deltas: [] });
      return ag.get(targetId);
    }
    function band(score) {
      if (score <= BAND_HOSTILE) return 'HOSTILE';
      if (score >= BAND_FRIEND) return 'FRIEND';
      return 'NEUTRAL';
    }
    function posOf(entity) {
      if (entity && entity.obj && entity.obj.position) {
        var p = entity.obj.position;
        return { x: p.x, y: p.y, z: p.z };
      }
      return entity && entity.pos ? entity.pos : null;
    }

    function addTrustDelta(agentId, targetId, delta, event_type, description, signature) {
      event_type = event_type || 'unknown';
      description = description || '';
      if (!flagOn()) return { ok: false, error: 'TrustLedger disabled' };
      var rel = ensureRelationship(agentId, targetId);
      if (!rel) return { ok: false, error: 'Invalid agentId/targetId' };

      var prev = rel.score;
      rel.score = Math.max(-100, Math.min(100, rel.score + (delta || 0)));
      rel.lastUpdate = Date.now();
      var newDelta = { delta: delta, event_type: event_type, description: description, timestamp: rel.lastUpdate, signature: signature || null, fromBand: band(prev), toBand: band(rel.score) };
      rel.deltas.push(newDelta);

      // ── MEME combo: memories justify the score ──
      if (Genesis.CitizenAI && typeof Genesis.CitizenAI.addEpisode === 'function') {
        var agentEntity = Genesis.EntityRegistry && Genesis.EntityRegistry.get ? Genesis.EntityRegistry.get(agentId) : null;
        var targetEntity = Genesis.EntityRegistry && Genesis.EntityRegistry.get ? Genesis.EntityRegistry.get(targetId) : null;
        var pos = posOf(agentEntity);
        var sentiment = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
        try {
          Genesis.CitizenAI.addEpisode(agentId, 'trust_' + event_type, 'Trust ' + (delta >= 0 ? 'gained' : 'lost') + ' with ' + targetId + ': ' + description, [targetId], pos, sentiment, ['trust', targetId]);
          if (targetEntity && targetEntity.kind === 'citizen') {
            Genesis.CitizenAI.addEpisode(targetId, 'trust_received_' + event_type, 'Trust from ' + agentId + ': ' + description, [agentId], posOf(targetEntity), sentiment, ['trust', agentId]);
          }
        } catch (e) { /* memory is a nicety, never fatal */ }
      }

      // ── EventBridge spine: let the world react (Genie trigger graft) ──
      if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
        Genesis.EventBridge.emit('trust:change', {
          agentId: agentId, targetId: targetId, delta: delta,
          prevScore: prev, score: rel.score,
          fromBand: band(prev), toBand: band(rel.score),
          event_type: event_type, description: description
        });
        if (rel.score <= BAND_HOSTILE && prev > BAND_HOSTILE) {
          Genesis.EventBridge.emit('trust:betrayal', { agentId: agentId, targetId: targetId, score: rel.score, description: description });
        }
      }

      return { ok: true, agentId: agentId, targetId: targetId, newScore: rel.score, delta: delta, band: band(rel.score) };
    }

    function getTrust(agentId, targetId) {
      if (!flagOn()) return DEFAULT_TRUST;
      var ag = ledger.get(agentId);
      var rel = ag && ag.get(targetId);
      return rel ? rel.score : DEFAULT_TRUST;
    }
    function getBand(agentId, targetId) {
      return band(getTrust(agentId, targetId));
    }
    // P-B scaffold: recall recent negative episodes for a betrayed relationship
    function betrayalRecall(agentId, targetId, limit) {
      var ag = ledger.get(agentId);
      var rel = ag && ag.get(targetId);
      if (!rel) return [];
      return rel.deltas.filter(function (d) { return d.delta < 0; }).slice(-(limit || 5));
    }
    function betrayalState(agentId, targetId) {
      return { band: getBand(agentId, targetId), score: getTrust(agentId, targetId), recent: betrayalRecall(agentId, targetId) };
    }

    function snapshot() {
      var out = {};
      for (var a of ledger.keys()) {
        var ad = ledger.get(a); out[a] = {};
        for (var t of ad.keys()) {
          var r = ad.get(t);
          out[a][t] = { score: r.score, lastUpdate: r.lastUpdate, deltas: r.deltas };
        }
      }
      return out;
    }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      ledger.clear();
      for (var a in state) {
        if (!state.hasOwnProperty(a)) continue;
        var ad = state[a];
        if (!ad || typeof ad !== 'object') continue;
        var ag = new Map();
        for (var t in ad) {
          if (!ad.hasOwnProperty(t)) continue;
          var r = ad[t];
          if (r && typeof r.score === 'number') ag.set(t, { score: r.score, lastUpdate: r.lastUpdate || 0, deltas: r.deltas || [] });
        }
        ledger.set(a, ag);
      }
      return true;
    }

    var TrustLedger = {
      flag: FLAG,
      isEnabled: function () { return flagOn(); },
      addTrustDelta: addTrustDelta,
      getTrust: getTrust,
      getBand: getBand,
      betrayalRecall: betrayalRecall,
      betrayalState: betrayalState,
      band: band,
      snapshot: snapshot,
      load: load,
      summary: function () {
        var total = 0;
        for (var ag of ledger.values()) for (var r of ag.values()) total += r.deltas.length;
        return { enabled: flagOn(), relationships: ledger.size, totalDeltas: total };
      }
    };

    Genesis.TrustLedger = TrustLedger;

    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') {
      Genesis.Immortality.registerSystem('trust-ledger', {
        snapshot: TrustLedger.snapshot,
        load: TrustLedger.load,
        summary: TrustLedger.summary
      });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('trust-ledger', { status: 'validated', path: './src/genesis/trust-ledger.js', gun: 'TRUST' });
    }
    if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
      Genesis.EventBridge.emit('trust-ledger:ready', { at: Date.now() });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
