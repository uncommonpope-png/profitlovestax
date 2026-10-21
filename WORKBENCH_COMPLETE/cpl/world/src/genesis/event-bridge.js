// src/genesis/event-bridge.js — P-F Event Bridge / Triggers (Genie Engine graft)
// ===========================================================================
// THE SPINE. Every consequence in the living world flows through here:
//   trust changes, resource earns, world events, citizen actions.
// A Trigger = { when(eventType), if(condition), do(action) } — the exact shape
// Ensemble Studios used for the Age of Empires scenario editor (event-driven
// programming). Other systems (dialogue, quests, world-reaction) subscribe or
// register triggers instead of hard-coding couplings.
// Always-on (no flag gate) — it is infrastructure, not a feature.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.EventBridge) return; // idempotent

    const listeners = new Map(); // eventType -> Set<fn>
    const triggers = new Map();  // id -> { when, condition, action, once, id }
    const history = [];          // capped recent events (debug / audit)
    let seq = 0;

    function emit(eventType, payload) {
      if (!eventType) return;
      payload = payload || {};
      const evt = { type: eventType, payload, at: Date.now() };
      history.push(evt);
      if (history.length > 250) history.shift();

      // Direct listeners
      const set = listeners.get(eventType);
      if (set) {
        for (const fn of Array.from(set)) {
          try { fn(evt); } catch (e) { if (typeof console !== 'undefined') console.warn('[EventBridge] listener error on', eventType, e); }
        }
      }
      // Wildcard listeners
      const wild = listeners.get('*');
      if (wild) {
        for (const fn of Array.from(wild)) {
          try { fn(evt); } catch (e) { if (typeof console !== 'undefined') console.warn('[EventBridge] wildcard listener error', e); }
        }
      }
      // Triggers (Genie condition->action)
      for (const [id, t] of Array.from(triggers)) {
        if (t.when !== eventType && t.when !== '*') continue;
        let ok = true;
        try { ok = t.condition ? !!t.condition(payload, evt) : true; } catch (e) { ok = false; }
        if (ok) {
          try { t.action(payload, evt); } catch (e) { if (typeof console !== 'undefined') console.warn('[EventBridge] trigger action error', id, e); }
          if (t.once) triggers.delete(id);
        }
      }
    }

    function on(eventType, fn) {
      if (!eventType || typeof fn !== 'function') return function () {};
      if (!listeners.has(eventType)) listeners.set(eventType, new Set());
      listeners.get(eventType).add(fn);
      return function off() { off(eventType, fn); };
    }
    function off(eventType, fn) {
      const set = listeners.get(eventType);
      if (set) set.delete(fn);
    }
    function once(eventType, fn) {
      const wrap = function (evt) { off(eventType, wrap); fn(evt); };
      return on(eventType, wrap);
    }
    function registerTrigger(spec) {
      if (!spec || !spec.when || typeof spec.action !== 'function') return null;
      const id = spec.id || ('trig_' + (++seq));
      triggers.set(id, { when: spec.when, condition: spec.condition, action: spec.action, once: !!spec.once, id: id });
      return id;
    }
    function unregisterTrigger(id) { return triggers.delete(id); }
    function clearTriggers() { triggers.clear(); }

    const EventBridge = {
      emit: emit,
      on: on,
      off: off,
      once: once,
      registerTrigger: registerTrigger,
      unregisterTrigger: unregisterTrigger,
      clearTriggers: clearTriggers,
      isEnabled: function () { return true; },
      summary: function () {
        return {
          enabled: true,
          listeners: listeners.size,
          triggers: triggers.size,
          history: history.length,
          lastEvents: history.slice(-12).map(function (e) { return e.type; })
        };
      }
    };

    Genesis.EventBridge = EventBridge;

    if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.registerSystem === 'function') {
      Genesis.GenesisKernel.registerSystem('event-bridge', function () { /* event-driven; nothing per-frame */ });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('event-bridge', { status: 'validated', path: './src/genesis/event-bridge.js', gun: 'BRIDGE' });
    }
    // Announce so late systems can hook
    emit('event-bridge:ready', { at: Date.now() });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
