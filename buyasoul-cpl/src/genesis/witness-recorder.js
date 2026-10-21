// GENESIS ENGINE — Witness Recorder Proof Packs (P65 / P119)
// Captures compact event evidence and seals it into hash-chained proof packs.

const DEFAULT_KEY = 'cpl-witness-proof-packs-v1';
function stable(value) { if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}'; return JSON.stringify(value); }
function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
function compact(detail) { try { const text = JSON.stringify(detail, (k, v) => { if (typeof v === 'function') return '[function]'; if (v && v.isObject3D) return `[Object3D:${v.name || v.type || 'unnamed'}]`; if (v && v.isVector3) return { x: Number(v.x.toFixed(3)), y: Number(v.y.toFixed(3)), z: Number(v.z.toFixed(3)) }; return v; }); return text && text.length > 900 ? text.slice(0, 900) + '…' : (text || '{}'); } catch (_) { return '{"unserializable":true}'; } }

export function install(Genesis, worldState, options = {}) {
  if (!Genesis || !worldState) return null;
  const proofKey = options.proofKey || DEFAULT_KEY;
  const worldStateKey = options.worldStateKey || null;
  const maxPacks = options.maxPacks || 30;
  const maxEvents = options.maxEvents || 24;
  const packEvery = options.packEvery || 4;
  worldState.witnessProofPacks = Array.isArray(worldState.witnessProofPacks) ? worldState.witnessProofPacks : [];
  let buffer = [], seq = 0;
  function persist() { try { localStorage.setItem(proofKey, JSON.stringify(worldState.witnessProofPacks)); } catch (_) {} if (worldStateKey) { try { localStorage.setItem(worldStateKey, JSON.stringify(worldState)); } catch (_) {} } }
  function record(type, detail = {}) { const event = { seq: ++seq, at: Date.now(), type, detailHash: hash(compact(detail)), detail: compact(detail) }; buffer = [event, ...buffer].slice(0, maxEvents); if (buffer.length >= packEvery) pack('auto:' + type); return event; }
  function pack(reason = 'manual') { const previous = worldState.witnessProofPacks[0] || null; const events = buffer.slice(0, maxEvents); const body = { version: 1, phase: 'P65/P119', reason, createdAt: Date.now(), previousHash: previous ? previous.packHash : null, eventCount: events.length, events }; const proof = { ...body, id: 'witness-' + body.createdAt.toString(36) + '-' + hash(stable(body)).slice(0, 6), packHash: hash(stable(body)) }; worldState.witnessProofPacks = [proof, ...(worldState.witnessProofPacks || [])].slice(0, maxPacks); persist(); try { window.dispatchEvent(new CustomEvent('genesis:witness:proof-pack', { detail: proof })); } catch (_) {} return proof; }
  function downloadLatest() { const latest = worldState.witnessProofPacks[0] || pack('download'); const blob = new Blob([JSON.stringify(latest, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = latest.id + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); return latest; }
  const watched = ['genesis:boot-ready', 'genesis:trust:delta', 'genesis:personality:drift', 'genesis:immortality:audit', 'genesis:prophet:archive', 'genesis:builder:schematic', 'genesis:drag:persist', 'genesis:npc:scale-pass', 'genesis:angel:life', 'genesis:scribe:live-books', 'genesis:scribe:book-open', 'genesis:memory:buildings', 'genesis:memory:building-open', 'genesis:chamber:enter', 'genesis:chamber:exit', 'genesis:chamber:feature', 'genesis:world:tune', 'genesis:world:command', 'genesis:camera:drift', 'genesis:population:audit'];
  for (const eventName of watched) window.addEventListener(eventName, (ev) => record(eventName, ev && ev.detail ? ev.detail : {}));
  if (window.__GENESIS_BOOT_READY) record('genesis:boot-ready:already-true', { ready: true });
  record('genesis:witness:install', { packs: worldState.witnessProofPacks.length }); pack('install');
  const api = { record, pack, downloadLatest, summary: () => ({ packs: (worldState.witnessProofPacks || []).length, buffer: buffer.length }) };
  Genesis.WitnessRecorder = api; return api;
}

export default { install };
