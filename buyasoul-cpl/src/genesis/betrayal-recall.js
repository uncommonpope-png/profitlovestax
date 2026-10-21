// betrayal-recall.js — P47 / P-B Betrayal Recall (full wire)
// ===========================================================================
// Layers on top of TrustLedger (P-A) and TrustDialogue (P-C). Adds:
//   1. Specific betrayal event recording (what, where, when, who witnessed)
//   2. Gossip propagation — betrayed citizens tell nearby friends
//   3. Dialogue templates that reference specific betrayal events
//   4. World reaction hooks (mood shift via EventBridge)
//   5. Persistence through Immortality
//
// DESIGN: pure event-reactive module. It listens for trust:betrayal events
// from TrustLedger and extends them with narrative context. Behaviors
// (P-D) call recall() when selecting their intent.
//
// Flag __GENESIS_BETRAYAL_RECALL (default ON, requires TrustLedger).
// ===========================================================================
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.BetrayalRecall) return; // idempotent

    var FLAG = '__GENESIS_BETRAYAL_RECALL';

    function flagOn() {
      return (typeof window === 'undefined') || window[FLAG] !== false;
    }

    // ── Betrayal event store ─────────────────────────────────────────────
    // betrayalId -> { agentId, targetId, eventType, description, at, pos,
    //                 severity, witnesses[], gossipedTo[], recalled }
    var betrayals = new Map();
    var _seq = 0;

    // ── Betrayal dialogue templates ──────────────────────────────────────
    // These reference specific event types so the citizen can say WHAT
    // the player did, not just "I remember what you did."
    var DIALOGUE_TEMPLATES = {
      theft: [
        'I remember when you took what was not yours.',
        'You stole from us. I have not forgotten.',
        'Thief. That is all you will ever be to me.',
        'You think I would trade with someone who steals?'
      ],
      attack: [
        'You raised your hand against me. I remember.',
        'I still bear the mark of your violence.',
        'You attacked me and expect hospitality?',
        'Violence is all you bring to this city.'
      ],
      betrayal: [
        'You were our friend. Then you turned on us.',
        'Trust takes years to build and seconds to shatter. You shattered it.',
        'I welcomed you here. I will not make that mistake again.',
        'You smile now, but I know what lurks beneath.'
      ],
      sabotage: [
        'You broke what we built. For what?',
        'I saw you. I know what you did to the works.',
        'You destroy and call it progress.',
        'The city remembers every stone you cracked.'
      ],
      default: [
        'I remember what you did. Do not pretend otherwise.',
        'You have a lot of nerve showing your face here.',
        'Do not act like we are allies. I know the truth.',
        'Some debts cannot be repaid. Some betrayals cannot be forgiven.'
      ]
    };

    function pick(list) {
      if (!list || !list.length) return null;
      return list[Math.floor(Math.random() * list.length)];
    }

    // ── Match event type to dialogue pool ────────────────────────────────
    function poolForEvent(eventType) {
      var et = (eventType || '').toLowerCase();
      if (et.indexOf('theft') !== -1 || et.indexOf('steal') !== -1 || et.indexOf('take') !== -1) return 'theft';
      if (et.indexOf('attack') !== -1 || et.indexOf('hit') !== -1 || et.indexOf('damage') !== -1) return 'attack';
      if (et.indexOf('betray') !== -1 || et.indexOf('deceive') !== -1 || et.indexOf('lie') !== -1) return 'betrayal';
      if (et.indexOf('sabotage') !== -1 || et.indexOf('break') !== -1 || et.indexOf('destroy') !== -1) return 'sabotage';
      return 'default';
    }

    // ── Record a betrayal event ──────────────────────────────────────────
    // Called by behaviors or directly when a trust-betraying action occurs.
    function record(agentId, targetId, eventType, description, severity, pos) {
      if (!flagOn()) return null;
      if (!agentId || !targetId) return null;
      var id = 'betrayal-' + (++_seq) + '-' + Date.now().toString(36);
      var entry = {
        id: id,
        agentId: agentId,
        targetId: targetId,
        eventType: eventType || 'betrayal',
        description: description || 'Unknown betrayal',
        severity: typeof severity === 'number' ? Math.max(0, Math.min(1, severity)) : 0.5,
        at: Date.now(),
        pos: pos || null,
        witnesses: [],
        gossipedTo: [],
        recalled: false
      };
      betrayals.set(id, entry);

      // Record episodic memory for the betrayed citizen
      if (Genesis.CitizenAI && typeof Genesis.CitizenAI.addEpisode === 'function') {
        try {
          Genesis.CitizenAI.addEpisode(agentId, 'betrayal_' + eventType,
            'Betrayed by ' + targetId + ': ' + description,
            [targetId], pos, 'negative', ['betrayal', eventType, targetId]);
        } catch (e) { /* memory is a nicety */ }
      }

      // Emit enriched betrayal event
      if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
        Genesis.EventBridge.emit('betrayal:recorded', {
          id: id,
          agentId: agentId,
          targetId: targetId,
          eventType: eventType,
          description: description,
          severity: severity,
          at: entry.at,
          pos: pos
        });
      }

      // ── Gossip propagation: tell nearby friends ────────────────────────
      _gossip(entry);

      return entry;
    }

    // ── Gossip: notify nearby FRIEND citizens about the betrayal ─────────
    // They lose a small amount of trust (guilt by association).
    function _gossip(betrayalEntry) {
      if (!Genesis.EntityRegistry || !Genesis.TrustLedger) return;
      try {
        var snap = Genesis.EntityRegistry.snapshot();
        var betrayedPos = betrayalEntry.pos;
        if (!betrayedPos) return;
        var gossipRadius = 30; // how far gossip travels
        var told = [];

        for (var i = 0; i < snap.length; i++) {
          var entity = snap[i];
          if (!entity || entity.id === betrayalEntry.agentId) continue;
          if (entity.kind !== 'citizen') continue;
          var ePos = entity.pos;
          if (!ePos) continue;
          var dx = ePos.x - betrayedPos.x;
          var dz = ePos.z - betrayedPos.z;
          var dist = Math.hypot(dx, dz);
          if (dist > gossipRadius) continue;

          // Only affect FRIEND-band citizens (they care about what happened)
          var band = Genesis.TrustLedger.getBand(entity.id, betrayalEntry.targetId || 'player');
          if (band !== 'FRIEND') continue;

          // Small trust loss from gossip — they heard their friend was wronged
          var gossipDelta = -(0.3 + betrayalEntry.severity * 0.5);
          Genesis.TrustLedger.addTrustDelta(
            entity.id,
            betrayalEntry.targetId || 'player',
            gossipDelta,
            'gossip',
            'Heard ' + betrayalEntry.agentId + ' was betrayed: ' + betrayalEntry.description,
            'betrayal-recall'
          );
          told.push(entity.id);
        }

        // Record who we gossiped to
        betrayalEntry.witnesses = betrayalEntry.witnesses.concat(told);
        if (told.length > 0 && Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
          Genesis.EventBridge.emit('betrayal:gossip', {
            betrayalId: betrayalEntry.id,
            agentId: betrayalEntry.agentId,
            targetId: betrayalEntry.targetId,
            gossipedTo: told,
            count: told.length
          });
        }
      } catch (e) { /* gossip is social, never fatal */ }
    }

    // ── Recall betrayals for an agent-target pair ─────────────────────────
    // Returns the most severe betrayals with full narrative context.
    function recall(agentId, targetId, limit) {
      if (!flagOn()) return [];
      limit = limit || 3;
      var results = [];
      for (var entry of betrayals.values()) {
        if (entry.agentId === agentId && entry.targetId === targetId) {
          results.push(entry);
        }
      }
      // Sort by severity descending, then by time descending
      results.sort(function (a, b) {
        if (a.severity !== b.severity) return b.severity - a.severity;
        return b.at - a.at;
      });
      return results.slice(0, limit);
    }

    // ── Generate dialogue referencing a specific betrayal ─────────────────
    // Returns { say: "..." } or null if no betrayals found.
    function sayRecall(agentId, targetId) {
      if (!flagOn()) return null;
      var recent = recall(agentId, targetId, 1);
      if (!recent.length) return null;

      var ev = recent[0];
      var pool = DIALOGUE_TEMPLATES[poolForEvent(ev.eventType)] || DIALOGUE_TEMPLATES.default;
      var text = pick(pool);
      if (!text) return null;

      // Mark as recalled (so we don't keep saying the same thing)
      ev.recalled = true;
      ev.at = Date.now(); // refresh timestamp

      return {
        say: text,
        meta: {
          betrayalId: ev.id,
          eventType: ev.eventType,
          severity: ev.severity,
          description: ev.description
        }
      };
    }

    // ── Get full betrayal state for UI / debug ───────────────────────────
    function summary() {
      var total = betrayals.size;
      var byType = {};
      var activeTargets = new Set();
      for (var entry of betrayals.values()) {
        byType[entry.eventType] = (byType[entry.eventType] || 0) + 1;
        activeTargets.add(entry.targetId);
      }
      return {
        enabled: flagOn(),
        totalBetrayals: total,
        byType: byType,
        uniqueTargets: activeTargets.size,
        gossipedEvents: Array.from(betrayals.values()).filter(function (e) { return e.witnesses.length > 0; }).length
      };
    }

    // ── Persistence via Immortality ──────────────────────────────────────
    function snapshot() {
      var out = {};
      for (var entry of betrayals.values()) {
        out[entry.id] = {
          agentId: entry.agentId,
          targetId: entry.targetId,
          eventType: entry.eventType,
          description: entry.description,
          severity: entry.severity,
          at: entry.at,
          pos: entry.pos,
          witnesses: entry.witnesses,
          gossipedTo: entry.gossipedTo,
          recalled: entry.recalled
        };
      }
      return out;
    }

    function load(state) {
      if (!state || typeof state !== 'object') return false;
      betrayals.clear();
      _seq = 0;
      for (var id in state) {
        if (!state.hasOwnProperty(id)) continue;
        var e = state[id];
        betrayals.set(id, {
          id: id,
          agentId: e.agentId,
          targetId: e.targetId,
          eventType: e.eventType || 'betrayal',
          description: e.description || '',
          severity: typeof e.severity === 'number' ? e.severity : 0.5,
          at: e.at || 0,
          pos: e.pos || null,
          witnesses: e.witnesses || [],
          gossipedTo: e.gossipedTo || [],
          recalled: e.recalled || false
        });
        var num = parseInt(id.split('-')[1], 10);
        if (!isNaN(num) && num > _seq) _seq = num;
      }
      return true;
    }

    // ── Wire EventBridge listener for trust:betrayal ─────────────────────
    // When TrustLedger emits trust:betrayal, we auto-record it.
    function onTrustBetrayal(ev) {
      if (!ev || !ev.agentId || !ev.targetId) return;
      record(
        ev.agentId,
        ev.targetId,
        'betrayal',
        ev.description || 'Trust fell to hostile',
        0.7,
        null
      );
    }

    if (Genesis.EventBridge && typeof Genesis.EventBridge.on === 'function') {
      try { Genesis.EventBridge.on('trust:betrayal', function (ev) { onTrustBetrayal(ev && ev.payload ? ev.payload : ev); }); } catch (_) {}
    }
    // Also listen on window event
    if (typeof window !== 'undefined') {
      try {
        window.addEventListener('genesis:trust:betrayal', function (ev) {
          if (ev && ev.detail) onTrustBetrayal(ev.detail);
        });
      } catch (_) {}
    }

    // ── Expose API ───────────────────────────────────────────────────────
    var BetrayalRecall = {
      flag: FLAG,
      isEnabled: function () { return flagOn(); },
      record: record,
      recall: recall,
      sayRecall: sayRecall,
      summary: summary,
      snapshot: snapshot,
      load: load,
      DIALOGUE_TEMPLATES: DIALOGUE_TEMPLATES
    };

    Genesis.BetrayalRecall = BetrayalRecall;

    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') {
      Genesis.Immortality.registerSystem('betrayal-recall', {
        snapshot: BetrayalRecall.snapshot,
        load: BetrayalRecall.load,
        summary: BetrayalRecall.summary
      });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('betrayal-recall', { status: 'validated', path: './src/genesis/betrayal-recall.js', gun: 'RECALL' });
    }
    if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
      Genesis.EventBridge.emit('betrayal-recall:ready', { at: Date.now() });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
