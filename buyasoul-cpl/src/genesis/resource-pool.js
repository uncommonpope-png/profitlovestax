// resource-pool.js â€” SOUL-GUN: Central Constraint Gate (MDA mechanics)
// The Elden Ring lesson made spatial: ONE shared energy pool gates an agent's
// world-actions. GSK (and every citizen) decides the AMOUNT; the ENGINE owns the
// pool + spend. This is what turns "can act" into "acts under real scarcity" â€”
// the Dynamics that make a soul feel alive (not omnipotent).
//
// Offline-safe: if the pool is never registered, spend()/regen() are harmless
// no-ops and commands stay cost-free (backward compatible when the gun is OFF).

function createResourcePool() {
  const DEFAULT_MAX = 100;
  const DEFAULT_REGEN = 1; // per regen() call (EngineScheduler tick)
  const pools = new Map(); // owner (agent://id) -> { energy, max, regen, profit, love, tax }

  function ensure(owner, max, regen) {
    if (typeof owner !== 'string' || !owner) return null;
    if (!pools.has(owner)) {
      pools.set(owner, {
        energy: (typeof max === 'number' && max > 0) ? max : DEFAULT_MAX,
        max: (typeof max === 'number' && max > 0) ? max : DEFAULT_MAX,
        regen: (typeof regen === 'number' && regen >= 0) ? regen : DEFAULT_REGEN,
        profit: 0, // Initialize PLT scores
        love: 0,
        tax: 0
      });
    }
    return pools.get(owner);
  }

  // CASCADE: spend only what exists. Never negative. Rejects (returns false)
  // instead of allowing an over-draw â€” the agent must pace (the article's law).
  function spend(owner, amount) {
    const p = ensure(owner);
    if (!p) return false;
    const n = (typeof amount === 'number' && amount >= 0) ? amount : 0;
    if (n > p.energy) return false; // insufficient -> rejected, no mutation
    p.energy -= n;
    p.tax += n; // Spending contributes to tax
    return true;
  }

  // Passive recovery (stamina regen), driven once per EngineScheduler tick.
  function regen(owner) {
    const p = ensure(owner);
    if (!p) return;
    const preRegenEnergy = p.energy;
    p.energy = Math.min(p.max, p.energy + p.regen);
    const actualRegen = p.energy - preRegenEnergy;
    p.profit += actualRegen; // Regeneration contributes to profit
  }
  
  // Directly add/subtract PLT scores (e.g., for specific actions/events)
  function addPLT(owner, profitDelta = 0, loveDelta = 0, taxDelta = 0) {
    const p = ensure(owner);
    if (!p) return;
    p.profit += profitDelta;
    p.love += loveDelta;
    p.tax += taxDelta;
  }

  // Regenerate every pool (called once per global tick by the engine).
  function regenAll() {
    for (const p of pools.values()) p.energy = Math.min(p.max, p.energy + p.regen);
  }

  function get(owner) {
    const p = pools.get(owner);
    return p ? { energy: p.energy, max: p.max, regen: p.regen, profit: p.profit, love: p.love, tax: p.tax } : null;
  }

  // Surface B (Step 5 immortality): serialize pool state so energy persists
  // across reloads â€” GSK wakes mid-stamina, not full.
  function snapshot() {
    const out = {};
    for (const [k, p] of pools) out[k] = { energy: p.energy, max: p.max, regen: p.regen, profit: p.profit, love: p.love, tax: p.tax };
    return out;
  }
  function load(state) {
    if (!state || typeof state !== 'object') return false;
    for (const k of Object.keys(state)) {
      const s = state[k];
      if (s && typeof s.energy === 'number') {
        pools.set(k, {
          energy: s.energy,
          max: s.max || DEFAULT_MAX,
          regen: (typeof s.regen === 'number') ? s.regen : DEFAULT_REGEN,
          profit: s.profit || 0,
          love: s.love || 0,
          tax: s.tax || 0
        });
      }
    }
    return true;
  }

  return { ensure, spend, regen, regenAll, get, addPLT, snapshot, load, _pools: pools };
}

// The singleton (shared across the app). install() attaches it to a Genesis.
const ResourcePool = createResourcePool();

function install(Genesis) {
  if (!Genesis) return;
  if (Genesis.ResourcePool) return; // idempotent
  Genesis.ResourcePool = ResourcePool;
  if (typeof window !== 'undefined') window.GenesisResourcePool = ResourcePool;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, ResourcePool: ResourcePool };
if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
