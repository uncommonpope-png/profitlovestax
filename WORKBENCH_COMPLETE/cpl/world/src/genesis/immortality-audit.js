// GENESIS ENGINE — Two-Surface Immortality Audit (P51 / P52 / P132)
// Surface A = self/identity continuity. Surface B = world consequence continuity.

const DEFAULT_PROOF_KEY = 'cpl-immortality-audit-v1';
function count(v) { if (Array.isArray(v)) return v.length; if (v && typeof v === 'object') return Object.keys(v).length; return 0; }
function stable(value) { if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}'; return JSON.stringify(value); }
function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }

export function install(Genesis, worldState, options = {}) {
  if (!Genesis || !worldState) return null;
  const proofKey = options.proofKey || DEFAULT_PROOF_KEY;
  const worldStateKey = options.worldStateKey || null;
  worldState.immortalityAudit = worldState.immortalityAudit || {};
  function readPrevious() { try { return JSON.parse(localStorage.getItem(proofKey) || 'null'); } catch (_) { return null; } }
  function persist(proof) { try { localStorage.setItem(proofKey, JSON.stringify(proof)); } catch (_) {} if (worldStateKey) { try { localStorage.setItem(worldStateKey, JSON.stringify(worldState)); } catch (_) {} } }
  function surfaces(reason = 'checkpoint') {
    const self = { identity: 'GSK', role: 'MIND', route: worldState.agentRoute || 'GSK', playerKind: worldState.playerKind || 'gsk', trustSubjects: count(worldState.trustLedger), personalityProfiles: count(worldState.personalityProfiles), reason };
    const world = { questsComplete: Object.values(worldState.quests || {}).filter(Boolean).length, metDenizens: count(worldState.metDenizens), chambers: count(worldState.chambers), contracts: count(worldState.contracts), builds: count(worldState.builds), schematics: count(worldState.builderSchematics), prophecies: count(worldState.prophecies), prophecyArchive: count(worldState.prophecyArchive), memoryEvents: count(worldState.memoryEvents), dragPositions: count(worldState.dragPositions), npcScaleAudit: count(worldState.npcScaleAudit), angelLifeEvents: worldState.angelLifeStats && Array.isArray(worldState.angelLifeStats.events) ? worldState.angelLifeStats.events.length : 0, scribeLiveBookEvents: worldState.scribeLiveBooks && Array.isArray(worldState.scribeLiveBooks.events) ? worldState.scribeLiveBooks.events.length : 0, memoryBuildings: worldState.memoryBuildings && worldState.memoryBuildings.count ? worldState.memoryBuildings.count : 0, chamberLedger: count(worldState.chamberLedger), liveTuningEvents: worldState.liveTuning && Array.isArray(worldState.liveTuning.history) ? worldState.liveTuning.history.length : 0, ambientDriftEvents: worldState.ambientDriftCam && Array.isArray(worldState.ambientDriftCam.events) ? worldState.ambientDriftCam.events.length : 0, trustLedger: count(worldState.trustLedger), personalityProfiles: count(worldState.personalityProfiles), pltEntries: count(worldState.pltLedger), witnessPacks: count(worldState.witnessPacks), witnessProofPacks: count(worldState.witnessProofPacks) };
    return { self, world };
  }
  function checkpoint(reason = 'checkpoint') {
    const previous = readPrevious();
    const s = surfaces(reason);
    const surfaceHash = hash(stable(s));
    const proof = { version: 1, phase: 'P51/P52/P132', savedAt: Date.now(), reopenCount: previous && Number.isFinite(previous.reopenCount) ? previous.reopenCount + 1 : 0, survivedReopen: !!previous, previousHash: previous ? previous.surfaceHash : null, surfaceHash, status: previous ? 'PASS' : 'PENDING_FIRST_REOPEN', surfaces: s };
    worldState.immortalityAudit = proof; persist(proof);
    try { window.dispatchEvent(new CustomEvent('genesis:immortality:audit', { detail: proof })); } catch (_) {}
    return proof;
  }
  const events = ['genesis:boot-ready', 'genesis:trust:delta', 'genesis:personality:drift', 'genesis:prophet:archive', 'genesis:builder:schematic', 'genesis:drag:persist', 'genesis:npc:scale-pass', 'genesis:angel:life', 'genesis:scribe:live-books', 'genesis:scribe:book-open', 'genesis:memory:buildings', 'genesis:memory:building-open', 'genesis:chamber:enter', 'genesis:chamber:exit', 'genesis:chamber:feature', 'genesis:world:tune', 'genesis:world:command', 'genesis:camera:drift'];
  for (const eventName of events) window.addEventListener(eventName, () => checkpoint(eventName));
  const api = { checkpoint, surfaces, summary: () => worldState.immortalityAudit || checkpoint('summary') };
  Genesis.ImmortalityAudit = api; checkpoint('install'); return api;
}

export default { install };
