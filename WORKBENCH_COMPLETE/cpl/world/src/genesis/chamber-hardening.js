// GENESIS ENGINE — 36 Chambers Hardening (P74 / P129)
// Makes chamber discovery/lifecycle durable, auditable, and bounded to exactly 36 chambers.

function now() { return Date.now(); }
function clampIndex(index, total) { return Math.max(0, Math.min(total - 1, index | 0)); }

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const total = options.total || 36;
  worldState.chamberLedger = worldState.chamberLedger || {};
  function ensure(index, meta = {}) { const idx = clampIndex(index, total); const key = String(idx); const prev = worldState.chamberLedger[key] || {}; return worldState.chamberLedger[key] = { index: idx, chamber: idx + 1, seed: 'chamber-' + (idx + 1).toString().padStart(2, '0'), biome: meta.biome || prev.biome || 'Unknown', discovered: !!(prev.discovered || meta.discovered), visits: prev.visits || 0, featureClicks: prev.featureClicks || 0, lifecycle: prev.lifecycle || 'idle', firstEnteredAt: prev.firstEnteredAt || 0, lastEnteredAt: prev.lastEnteredAt || 0, lastExitedAt: prev.lastExitedAt || 0, lastFeatureAt: prev.lastFeatureAt || 0 }; }
  function summary() { const rows = Object.values(worldState.chamberLedger || {}); return { total, discovered: rows.filter((r) => r.discovered).length, visits: rows.reduce((n, r) => n + (r.visits || 0), 0) }; }
  function emit(type, rec, detail = {}) { saveWorldState(); try { window.dispatchEvent(new CustomEvent('genesis:chamber:' + type, { detail: { ...detail, record: rec, summary: summary() } })); } catch (_) {} return rec; }
  function enter(index, meta = {}) { const rec = ensure(index, { ...meta, discovered: true }); const t = now(); rec.discovered = true; rec.visits = (rec.visits || 0) + 1; rec.firstEnteredAt = rec.firstEnteredAt || t; rec.lastEnteredAt = t; rec.lifecycle = 'active'; worldState.chambers = Array.from(new Set([...(worldState.chambers || []), rec.index])).filter((n) => Number.isInteger(n) && n >= 0 && n < total).sort((a, b) => a - b); return emit('enter', rec, { index: rec.index }); }
  function exit(index) { const rec = ensure(index); rec.lastExitedAt = now(); rec.lifecycle = 'idle'; return emit('exit', rec, { index: rec.index }); }
  function feature(index, name = 'Chamber') { const rec = ensure(index, { biome: name }); rec.featureClicks = (rec.featureClicks || 0) + 1; rec.lastFeatureAt = now(); if (name) rec.biome = name; return emit('feature', rec, { index: rec.index, name }); }
  for (let i = 0; i < total; i++) ensure(i, { discovered: (worldState.chambers || []).includes(i) });
  const api = { ensure, enter, exit, feature, summary }; Genesis.ChamberHardening = api; saveWorldState(); return api;
}

export default { install };
