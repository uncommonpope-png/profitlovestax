// GENESIS ENGINE — NPC GLB Scale Pass (P69)
// Normalizes rigged GLB citizens to a shared humanoid reference height and records audit evidence.

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function round(v) { return Number((Number(v) || 0).toFixed(4)); }

export function createNPCScalePass(options = {}) {
  const THREE = options.THREE || null;
  const targetHeight = options.targetHeight || 1.7;
  const minScale = options.minScale || 0.4;
  const maxScale = options.maxScale || 2.2;
  const records = [];
  let sink = null, seq = 0;
  function measure(root) { if (!THREE || !root) return { box: null, size: { x: 0, y: 0, z: 0 }, height: 0 }; const box = new THREE.Box3().setFromObject(root); const size = new THREE.Vector3(); box.getSize(size); return { box, size, height: size.y || Math.max(size.x, size.z) || 0 }; }
  function remember(entry) { records.unshift(entry); if (records.length > 80) records.pop(); if (sink) sink(entry); try { window.dispatchEvent(new CustomEvent('genesis:npc:scale-pass', { detail: entry })); } catch (_) {} return entry; }
  function normalize(clone, source, meta = {}) {
    const src = measure(source || clone);
    const sourceHeight = src.height || targetHeight;
    const rawScale = targetHeight / sourceHeight;
    const scale = clamp(rawScale, minScale, maxScale);
    if (clone && clone.scale && clone.scale.setScalar) clone.scale.setScalar(scale);
    const after = measure(clone);
    let groundLift = 0;
    if (clone && clone.position && after.box && Number.isFinite(after.box.min.y)) { groundLift = -after.box.min.y; clone.position.y += groundLift; }
    const entry = { id: 'npc-scale-' + (++seq), at: Date.now(), phase: 'P69', url: meta.url || 'unknown', npc: meta.npc || meta.label || 'citizen', targetHeight: round(targetHeight), sourceHeight: round(sourceHeight), rawScale: round(rawScale), scale: round(scale), finalHeight: round(after.height), groundLift: round(groundLift), clamped: Math.abs(rawScale - scale) > 0.0001 };
    if (clone && clone.userData) clone.userData.npcScalePass = entry;
    return remember(entry);
  }
  function setSink(fn, flush = true) { sink = typeof fn === 'function' ? fn : null; if (sink && flush) records.slice().reverse().forEach(sink); }
  return { normalize, measure, setSink, records, summary: () => ({ records: records.length, targetHeight, minScale, maxScale }) };
}

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  worldState.npcScaleAudit = Array.isArray(worldState.npcScaleAudit) ? worldState.npcScaleAudit : [];
  const api = options.api || Genesis.NPCScalePass || createNPCScalePass(options);
  const max = options.maxRecords || 120;
  api.setSink((entry) => { if (!worldState.npcScaleAudit.some((r) => r.id === entry.id && r.at === entry.at)) { worldState.npcScaleAudit = [entry, ...worldState.npcScaleAudit].slice(0, max); saveWorldState(); } }, true);
  Genesis.NPCScalePass = api;
  return api;
}

export default { createNPCScalePass, install };
