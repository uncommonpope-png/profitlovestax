// GENESIS ENGINE — PLT Ledger (P138 / P183)
// Signed per-action Profit + Love - Tax audit trail.

function clampNum(n) { return Number.isFinite(Number(n)) ? Number(n) : 0; }

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const max = options.max || 300;

  function record(action, delta = {}, meta = {}) {
    const profit = clampNum(delta.profit);
    const love = clampNum(delta.love);
    const tax = clampNum(delta.tax);
    const entry = {
      id: 'plt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      at: Date.now(),
      action: String(action || 'unknown'),
      actor: meta.actor || 'genesis',
      phase: meta.phase || null,
      profit,
      love,
      tax,
      score: Number((profit + love - tax).toFixed(3)),
      meta
    };
    worldState.pltLedger = [entry, ...(worldState.pltLedger || [])].slice(0, max);
    saveWorldState();
    try { window.dispatchEvent(new CustomEvent('genesis:plt:record', { detail: entry })); } catch (_) {}
    return entry;
  }

  function summary(limit = 300) {
    const rows = (worldState.pltLedger || []).slice(0, limit);
    const totals = rows.reduce((acc, e) => {
      acc.profit += clampNum(e.profit);
      acc.love += clampNum(e.love);
      acc.tax += clampNum(e.tax);
      acc.score += clampNum(e.score);
      return acc;
    }, { profit: 0, love: 0, tax: 0, score: 0 });
    return { count: rows.length, totals };
  }

  const api = { record, summary, list: (n = 50) => (worldState.pltLedger || []).slice(0, n) };
  Genesis.PLT = Object.assign(Genesis.PLT || {}, api);

  window.addEventListener('genesis:prophet:archive', (ev) => {
    const text = ev && ev.detail && ev.detail.text ? ev.detail.text : '';
    record('prophecy.archived', { profit: 0.4, love: 0.8, tax: 0.15 }, { actor: 'prophet', phase: 'P37/P126', text: text.slice(0, 180) });
  });
  window.addEventListener('genesis:boot-ready', (ev) => {
    record('boot.ready', { profit: 0.3, love: 0.5, tax: 0.05 }, { actor: 'genesis', phase: 'P106/P107', reason: ev && ev.detail && ev.detail.reason });
  }, { once: true });

  return api;
}

export default { install };
