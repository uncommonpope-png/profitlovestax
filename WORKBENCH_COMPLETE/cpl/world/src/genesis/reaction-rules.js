// reaction-rules.js â€” SOUL-GUN: World Reaction Layer (Deus Ex / emergent-systems)
// When an agent acts, the WORLD reacts. This is the "consequence, not fluff"
// the article demands: a build must visibly answer, or it is hollow. The
// ENGINE decides reactions (rule-driven), never the agent â€” so the soul cannot
// script the world's response (CASCADE of consequence).
//
// Rules are declarative, engine-owned, offline-safe. If no rules exist, nothing
// fires (backward compatible). The engine iterates rules per applied entity.

function createReactionRules() {
  const rules = []; // { id, when(ctx), effect(ctx) }

  // ctx = { world, actor, entity, Registry }
  // when(ctx) -> bool (does this rule fire for this event?)
  // effect(ctx) -> mutates world + returns describe object (for witness)
  function addRule(id, whenFn, effectFn) {
    if (typeof whenFn !== 'function' || typeof effectFn !== 'function') return false;
    rules.push({ id: typeof id === 'string' ? id : ('rule' + rules.length), when: whenFn, effect: effectFn });
    return true;
  }

  // Evaluate all rules against an actor's just-applied entity. Returns the list
  // of effects that fired (so the engine can apply + witness them).
  // ONLY touches entities the rule itself is allowed to (engine-owned mutation);
  // it must NOT delete/move protected (non-actor) seed entities â€” same CASCADE
  // boundary as the CRITIC gate.
  function evaluate(world, actor, entity, Registry) {
    if (!Array.isArray(world)) return [];
    const ctx = { world: world, actor: actor, entity: entity, Registry: Registry };
    const fired = [];
    for (const rule of rules) {
      let match = false;
      try { match = rule.when(ctx); } catch (_) { match = false; }
      if (!match) continue;
      let desc = null;
      try { desc = rule.effect(ctx); } catch (_) { desc = null; }
      if (desc) fired.push({ rule: rule.id, desc });
    }
    return fired;
  }

  return { addRule: addRule, evaluate: evaluate, rules: function () { return rules.slice(); }, _rules: rules };
}

// The singleton. install() attaches it to a Genesis.
const ReactionRules = createReactionRules();

function install(Genesis) {
  if (!Genesis) return;
  if (Genesis.ReactionRules) return; // idempotent
  Genesis.ReactionRules = ReactionRules;
  if (typeof window !== 'undefined') window.GenesisReactionRules = ReactionRules;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, ReactionRules: ReactionRules };
if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
