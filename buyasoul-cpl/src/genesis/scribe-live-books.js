// GENESIS ENGINE — Scribe Library Live Books (P72 / P127)
// Turns live Genesis memory state into clickable Scribe Realm books when hosted GSK memory is offline.

function cleanText(value, limit = 220) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit); }
function weightFromIndex(i, base = 0.72) { return Math.max(0.25, Math.min(1, base - i * 0.015)); }

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const max = options.max || 48;
  worldState.scribeLiveBooks = worldState.scribeLiveBooks || { renders: 0, opens: 0, lastCount: 0, events: [] };
  function remember(kind, detail = {}) { const state = worldState.scribeLiveBooks || { renders: 0, opens: 0, lastCount: 0, events: [] }; if (kind === 'render') state.renders = (state.renders || 0) + 1; if (kind === 'open') state.opens = (state.opens || 0) + 1; state.lastAt = Date.now(); state.events = [{ at: state.lastAt, kind, detail }, ...(state.events || [])].slice(0, 40); if (detail.count != null) state.lastCount = detail.count; worldState.scribeLiveBooks = state; saveWorldState(); try { window.dispatchEvent(new CustomEvent(kind === 'open' ? 'genesis:scribe:book-open' : 'genesis:scribe:live-books', { detail: { kind, ...detail, state } })); } catch (_) {} return state; }
  function add(out, source, type, summary, tags = [], weight = 0.6, id = '') { const text = cleanText(summary, 320); if (!text) return; out.push({ id: id || source + '-' + out.length, type, summary: text, source, tags, weight }); }
  function localMemoryData(reason = 'local') {
    const out = [];
    (worldState.memoryEvents || []).slice(0, 18).forEach((e, i) => add(out, 'memoryEvents', e.type || 'memory', e.summary || e.text, e.tags || ['memory'], weightFromIndex(i, 0.9), e.id));
    (worldState.prophecyArchive || []).slice(0, 8).forEach((p, i) => add(out, 'prophecyArchive', 'prophecy', p.text || p.summary, p.tags || ['prophecy'], weightFromIndex(i, 0.86), p.id));
    (worldState.builderSchematics || []).slice(0, 8).forEach((s, i) => add(out, 'builderSchematics', 'decision', 'SCHEMATIC — ' + (s.request || s.reply), s.tags || ['builder', 'schematic'], weightFromIndex(i, 0.82), s.id));
    (worldState.witnessProofPacks || []).slice(0, 4).forEach((p, i) => add(out, 'witnessProofPacks', 'event', 'WITNESS PACK ' + (p.id || '') + ' sealed ' + (p.eventCount || 0) + ' events; hash ' + (p.packHash || '?'), ['witness', 'proof'], weightFromIndex(i, 0.78), p.id));
    (worldState.witnessPacks || []).slice(-8).reverse().forEach((p, i) => add(out, 'witnessPacks', 'event', 'WITNESS — ' + (p.kind || 'event') + ' · ' + (p.note || p.id || 'recorded'), ['witness'], weightFromIndex(i, 0.76), p.id));
    if (worldState.immortalityAudit && worldState.immortalityAudit.surfaceHash) add(out, 'immortalityAudit', 'reflection', 'IMMORTALITY ' + worldState.immortalityAudit.status + ' — surface hash ' + worldState.immortalityAudit.surfaceHash, ['immortality', 'surface-a', 'surface-b'], 0.95, 'immortality-' + worldState.immortalityAudit.surfaceHash);
    Object.values(worldState.trustLedger || {}).slice(0, 8).forEach((t, i) => add(out, 'trustLedger', 'conversation', 'TRUST — ' + t.id + ' stands at ' + t.trust + ' after ' + (t.talks || 0) + ' talks.', ['trust', 'citizen'], weightFromIndex(i, 0.7), 'trust-' + t.id));
    Object.values(worldState.personalityProfiles || {}).slice(0, 8).forEach((p, i) => add(out, 'personalityProfiles', 'pattern', 'PERSONALITY — ' + p.id + ' agreeableness ' + Number(p.agreeableness || 0).toFixed(2) + ', openness ' + Number(p.openness || 0).toFixed(2) + '.', ['personality', 'drift'], weightFromIndex(i, 0.68), 'personality-' + p.id));
    if (!out.length) add(out, 'scribeSeed', 'memory', 'The Scribe shelf is awake. No live memories have been written yet; speak, build, and the books will grow.', ['scribe', 'seed'], 0.5, 'scribe-seed');
    const seen = new Set(); const memories = out.filter((m) => { const key = m.id || m.summary; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, max);
    return { memories, count: memories.length, offline: true, source: reason };
  }
  const api = { localMemoryData, recordRender: (data, source = 'unknown') => remember('render', { source, count: data && Array.isArray(data.memories) ? data.memories.length : 0 }), recordOpen: (memory) => remember('open', { id: memory && memory.id, type: memory && memory.type, summary: cleanText(memory && memory.summary, 160) }), summary: () => worldState.scribeLiveBooks };
  Genesis.ScribeLiveBooks = api; return api;
}

export default { install };
