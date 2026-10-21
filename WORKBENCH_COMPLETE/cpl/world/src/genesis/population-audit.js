// GENESIS ENGINE — Population Audit (P78)
// Records visible/alive population counts as bounded proof data.

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const max = options.max || 24;
  worldState.populationAudit = worldState.populationAudit || { samples: [] };
  function sample(counts = {}, context = {}) {
    const entry = { at: Date.now(), phase: 'P78', counts: { ...counts }, context: { ...context } };
    const total = Object.values(entry.counts).reduce((n, v) => n + (Number(v) || 0), 0);
    entry.total = total;
    worldState.populationAudit.samples = [entry, ...(worldState.populationAudit.samples || [])].slice(0, max);
    worldState.populationAudit.latest = entry;
    saveWorldState();
    try { window.dispatchEvent(new CustomEvent('genesis:population:audit', { detail: entry })); } catch (_) {}
    return entry;
  }
  const api = { sample, summary: () => worldState.populationAudit };
  Genesis.PopulationAudit = api;
  return api;
}

export default { install };
