// affordance-model.js — P83/P149 Citizen Action-Set Affordance Model
// ============================================================================
// Turns entities into scored possible actions. Interactions already exposed
// hover/talk; this gives citizens a model for choosing what each object affords.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AffordanceModel) return;
    var defs = new Map();
    function define(kind, actions) { defs.set(kind, Array.isArray(actions) ? actions.slice() : []); return true; }
    function baseActions(kind) { return defs.get(kind) || defs.get('*') || []; }
    function band(actor, target) { try { return Genesis.TrustLedger && Genesis.TrustLedger.getBand ? Genesis.TrustLedger.getBand(actor || 'agent://gsk', target || 'player') : 'NEUTRAL'; } catch (_) { return 'NEUTRAL'; } }
    function energy(actor) { try { var p = Genesis.ResourcePool && Genesis.ResourcePool.get ? Genesis.ResourcePool.get(actor || 'agent://gsk') : null; return p ? p.energy : 100; } catch (_) { return 100; } }
    function forEntity(entity, ctx) {
      entity = entity || {}; ctx = ctx || {};
      var kind = entity.kind || (entity.meta && entity.meta.kind) || '*';
      var actions = baseActions(kind).map(function (a) { return Object.assign({}, a); });
      if (entity.affordance && actions.indexOf(entity.affordance) === -1) actions.push({ id: entity.affordance, verb: entity.affordance, score: 0.5 });
      var b = band(ctx.actor, entity.id || ctx.target);
      var e = energy(ctx.actor);
      actions.forEach(function (a) {
        var s = typeof a.score === 'number' ? a.score : 0.5;
        if (a.requiresBand && a.requiresBand !== b) s -= 0.4;
        if (a.minEnergy && e < a.minEnergy) s -= 0.5;
        if (b === 'FRIEND' && (a.id === 'talk' || a.id === 'trade' || a.id === 'socialize')) s += 0.25;
        if (b === 'HOSTILE' && (a.id === 'flee' || a.id === 'threaten')) s += 0.4;
        a.score = Math.max(0, Math.min(1, s));
      });
      actions.sort(function (a, b2) { return b2.score - a.score; });
      return actions;
    }
    function best(entity, ctx) { var a = forEntity(entity, ctx); return a[0] || null; }
    function seed() {
      define('*', [{ id: 'inspect', verb: 'inspect', score: 0.35 }]);
      define('citizen', [{ id: 'talk', verb: 'talk', score: 0.7 }, { id: 'trade', verb: 'trade', score: 0.55 }, { id: 'socialize', verb: 'socialize', requiresBand: 'FRIEND', score: 0.5 }, { id: 'flee', verb: 'flee', requiresBand: 'HOSTILE', score: 0.2 }]);
      define('resource', [{ id: 'gather', verb: 'gather', minEnergy: 5, score: 0.75 }]);
      define('building', [{ id: 'enter', verb: 'enter', score: 0.5 }, { id: 'inspect', verb: 'inspect', score: 0.45 }]);
      define('book', [{ id: 'read', verb: 'read', score: 0.8 }, { id: 'buy', verb: 'buy', score: 0.5 }]);
    }
    seed();
    var API = { define: define, forEntity: forEntity, best: best, summary: function () { return { kinds: Array.from(defs.keys()), totalActions: Array.from(defs.values()).reduce(function (n, a) { return n + a.length; }, 0) }; } };
    Genesis.AffordanceModel = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('affordance-model', { status: 'validated', path: './src/genesis/affordance-model.js', gun: 'FSM' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
