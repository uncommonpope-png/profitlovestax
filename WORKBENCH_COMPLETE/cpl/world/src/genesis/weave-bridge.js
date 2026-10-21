// src/genesis/weave-bridge.js
// THE WEAVE — Cross-realm PLT synchronization spine
// Extends the Lost World WeaveBridge concept into the Genesis Engine.
// Every realm (CPL, Soul Forge Nexus, Lost World, etc.) shares one PLT field
// through the Weave. Actions in one realm ripple to all others.
// Flag-gated by window.__GENESIS_WEAVE_BRIDGE (default ON).
export function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.WeaveBridge) return; // idempotent

    // Shared state across all realms — the universal PLT field
    const state = {
      plt: { profit: 50, love: 50, tax: 50 },
      realms: new Map(),      // id -> { name, type, plt, mechanics, lastSync }
      souls: [],              // forge/gacha souls shared across weave
      events: [],             // capped recent cross-realm events
      gems: 500
    };

    const listeners = new Map(); // eventType -> Set<fn>

    function emit(eventType, payload) {
      if (!eventType) return;
      payload = payload || {};
      const evt = { type: eventType, payload, at: Date.now(), realm: payload.realm || 'unknown' };
      state.events.push(evt);
      if (state.events.length > 250) state.events.shift();
      const set = listeners.get(eventType);
      if (set) {
        for (const fn of Array.from(set)) {
          try { fn(evt); } catch (e) { if (typeof console !== 'undefined') console.warn('[WeaveBridge] listener error on', eventType, e); }
        }
      }
      const wild = listeners.get('*');
      if (wild) {
        for (const fn of Array.from(wild)) {
          try { fn(evt); } catch (e) { if (typeof console !== 'undefined') console.warn('[WeaveBridge] wildcard error', e); }
        }
      }
      // Also route through EventBridge if present
      if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
        try { Genesis.EventBridge.emit('weave:' + eventType, payload); } catch (_) {}
      }
    }

    function on(eventType, fn) {
      if (!eventType || typeof fn !== 'function') return function () {};
      if (!listeners.has(eventType)) listeners.set(eventType, new Set());
      listeners.get(eventType).add(fn);
      return function off() { const s = listeners.get(eventType); if (s) s.delete(fn); };
    }

    // Update global PLT — called by any realm's updatePLT
    function syncPLT(realmId, partial) {
      if (!realmId || !partial) return;
      const realm = state.realms.get(realmId);
      if (realm) {
        if (typeof partial.profit === 'number') realm.plt.profit = clamp(realm.plt.profit + partial.profit);
        if (typeof partial.love === 'number') realm.plt.love = clamp(realm.plt.love + partial.love);
        if (typeof partial.tax === 'number') realm.plt.tax = clamp(realm.plt.tax + partial.tax);
        realm.lastSync = Date.now();
      }
      // Global field absorbs weighted delta
      if (typeof partial.profit === 'number') state.plt.profit = clamp(state.plt.profit + partial.profit * 0.3);
      if (typeof partial.love === 'number') state.plt.love = clamp(state.plt.love + partial.love * 0.3);
      if (typeof partial.tax === 'number') state.plt.tax = clamp(state.plt.tax + partial.tax * 0.3);
      emit('plt', { realm: realmId, plt: state.plt, realmPLT: realm ? realm.plt : null });
    }

    function clamp(v) { return Math.max(0, Math.min(100, v)); }

    // Register a realm into the weave
    function registerRealm(id, config) {
      if (!id) return;
      state.realms.set(id, {
        id,
        name: config.name || id,
        type: config.type || 'standard',
        plt: config.plt || { profit: 50, love: 50, tax: 50 },
        mechanics: config.mechanics || [],
        seed: config.seed || null,
        registeredAt: Date.now(),
        lastSync: Date.now()
      });
      emit('realm:registered', { id, name: config.name, type: config.type });
      return state.realms.get(id);
    }

    function getRealm(id) { return state.realms.get(id) || null; }
    function listRealms() { return Array.from(state.realms.values()); }

    // Soul forge / gacha shared across weave
    function addSoul(soul) {
      if (!soul) return;
      state.souls.push(soul);
      emit('soul:forged', { soul, total: state.souls.length });
    }
    function pullGacha() {
      const roll = Math.random();
      const rarity = roll < 0.15 ? 'legendary' : roll < 0.40 ? 'rare' : 'common';
      const stats = rarity === 'legendary' ? 100 : rarity === 'rare' ? 75 : 50;
      const type = ['profit', 'love', 'tax'][Math.floor(Math.random() * 3)];
      const soul = {
        id: 'soul-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        name: 'Orb-' + Date.now(),
        type, rarity,
        plt: { profit: stats + Math.floor(Math.random() * 20), love: stats + Math.floor(Math.random() * 20), tax: stats + Math.floor(Math.random() * 20) },
        level: 1, skills: ['gacha-summoned'], forgedAt: Date.now()
      };
      state.souls.push(soul);
      state.gems = Math.max(0, state.gems - 100);
      emit('soul:gacha', { soul, rarity, gems: state.gems });
      return soul;
    }

    function summary() {
      return {
        enabled: true,
        globalPLT: state.plt,
        realms: listRealms().map(r => ({ id: r.id, name: r.name, type: r.type, plt: r.plt })),
        realmCount: state.realms.size,
        soulCount: state.souls.length,
        gems: state.gems,
        lastEvents: state.events.slice(-12).map(e => e.type)
      };
    }

    const WeaveBridge = {
      emit, on,
      syncPLT,
      registerRealm,
      getRealm, listRealms,
      addSoul, pullGacha,
      get gems() { return state.gems; },
      set gems(v) { state.gems = Math.max(0, v); },
      get souls() { return state.souls; },
      get plt() { return state.plt; },
      summary
    };

    Genesis.WeaveBridge = WeaveBridge;
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('weave-bridge', { status: 'validated', path: './src/genesis/weave-bridge.js' });
    }
    if (typeof console !== 'undefined') console.log('[WeaveBridge] Initialized — cross-realm PLT spine active');
    return WeaveBridge;
  }

  if (typeof window !== 'undefined' && window.Genesis && !window.Genesis.WeaveBridge) install(window.Genesis);
