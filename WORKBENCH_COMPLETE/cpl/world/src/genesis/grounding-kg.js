// grounding-kg.js — P84/P150 Hallucination Grounding Knowledge Graph
// ============================================================================
// Small in-engine graph of entities/facts used to validate commands and ground
// claims against world state. No LLM logic; CASCADE-safe validator substrate.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.GroundingKG) return;
    var nodes = new Map();
    var edges = [];
    function node(id, data) { if (!id) return null; var rec = Object.assign({ id: id, at: Date.now() }, nodes.get(id) || {}, data || {}); nodes.set(id, rec); return rec; }
    function fact(subject, predicate, object, weight) { if (!subject || !predicate) return null; var rec = { subject: subject, predicate: predicate, object: object, weight: typeof weight === 'number' ? weight : 1, at: Date.now() }; edges.push(rec); if (edges.length > 1000) edges.shift(); return rec; }
    function ingestEntity(e) { if (!e || !e.id) return null; var rec = node(e.id, { kind: e.kind || 'entity', tags: e.tags || [], meta: e.meta || {} }); fact(e.id, 'is_a', rec.kind, 1); (e.tags || []).forEach(function (t) { fact(e.id, 'tagged', t, 0.8); }); return rec; }
    function ingestWorld(list) { var n = 0; (list || []).forEach(function (e) { if (ingestEntity(e)) n++; }); return n; }
    function refreshFromRegistry() { try { if (Genesis.EntityRegistry && Genesis.EntityRegistry.snapshot) return ingestWorld(Genesis.EntityRegistry.snapshot()); } catch (_) {} return 0; }
    function hasNode(id) { return nodes.has(id); }
    function factsFor(id) { return edges.filter(function (e) { return e.subject === id || e.object === id; }); }
    function validateCommand(cmd) {
      if (!cmd || typeof cmd !== 'object') return { ok: false, error: 'bad-command' };
      refreshFromRegistry();
      if ((cmd.op === 'move' || cmd.op === 'delete') && !hasNode(cmd.id)) return { ok: false, error: 'ungrounded-entity:' + cmd.id };
      if (cmd.op === 'spawn' && typeof cmd.kind === 'string') return { ok: true, grounded: true, facts: ['spawn-kind:' + cmd.kind] };
      return { ok: true, grounded: true };
    }
    function groundText(text) { text = String(text || ''); var hits = []; nodes.forEach(function (v, k) { if (text.indexOf(k) !== -1 || (v.kind && text.indexOf(v.kind) !== -1)) hits.push(k); }); return { ok: hits.length > 0, hits: hits.slice(0, 10) }; }
    var API = { node: node, fact: fact, ingestEntity: ingestEntity, ingestWorld: ingestWorld, refreshFromRegistry: refreshFromRegistry, hasNode: hasNode, factsFor: factsFor, validateCommand: validateCommand, groundText: groundText, summary: function () { return { nodes: nodes.size, facts: edges.length }; } };
    Genesis.GroundingKG = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('grounding-kg', { status: 'validated', path: './src/genesis/grounding-kg.js', gun: '#57' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
