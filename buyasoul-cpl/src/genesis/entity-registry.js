// EntityRegistry — Phase 1 Foundation (Step 4)
// Addressable identity for every world object so external agents and the
// multiplayer milestone can perceive/act on entities by stable id.
// Flag-gated by window.__GENESIS_ENTITY_REGISTRY (default OFF). When OFF this
// file is never imported and the monolith's object graph is untouched.
// When ON, it wraps (never replaces) the existing scene graph: registration is
// opt-in via register()/registerMany(); the legacy animate() loop does not
// depend on it, so there is zero behavioral delta on the live floor.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.EntityRegistry) return; // idempotent

    const byId = new Map();        // id -> record
    const byKind = new Map();      // kind -> Set(id)
    let seq = 0;

    const Registry = {
      // Register an entity. obj may be a THREE.Object3D or any handle.
      // Returns the stable id (auto-generated if none supplied).
      register(obj, opts) {
        opts = opts || {};
        const id = opts.id || ('ent_' + (++seq));
        const kind = opts.kind || (obj && obj.type) || 'unknown';
        const record = {
          id,
          kind,
          obj: obj || null,
          owner: opts.owner || 'world',
          tags: opts.tags || [],
          registeredAt: Date.now(),
          meta: opts.meta || {}
        };
        byId.set(id, record);
        if (!byKind.has(kind)) byKind.set(kind, new Set());
        byKind.get(kind).add(id);
        return id;
      },
      // Bulk-register an iterable of { obj, opts } without touching order.
      registerMany(items) {
        const ids = [];
        if (!items) return ids;
        for (const it of items) {
          if (!it) continue;
          ids.push(this.register(it.obj, it.opts));
        }
        return ids;
      },
      get(id) { return byId.get(id) || null; },
      has(id) { return byId.has(id); },
      // Resolve the live object handle (THREE.Object3D) for an id.
      resolve(id) { const r = byId.get(id); return r ? r.obj : null; },
      find(kind) {
        const set = byKind.get(kind);
        if (!set) return [];
        return Array.from(set).map((id) => byId.get(id)).filter(Boolean);
      },
      // Filter by tag. Used by agents to scope perception/action.
      queryByTag(tag) {
        const out = [];
        for (const r of byId.values()) if (r.tags && r.tags.indexOf(tag) !== -1) out.push(r);
        return out;
      },
      unregister(id) {
        const r = byId.get(id);
        if (!r) return false;
        byId.delete(id);
        const set = byKind.get(r.kind);
        if (set) set.delete(id);
        return true;
      },
      // Perception snapshot for external agents and Surface B persistence.
      // Include record meta so consequence state survives save/load.
      snapshot() {
        const out = [];
        for (const r of byId.values()) {
          const o = r.obj;
          let pos = null;
          if (o && o.position) pos = { x: o.position.x, y: o.position.y, z: o.position.z };
          out.push({ id: r.id, kind: r.kind, owner: r.owner, tags: r.tags, pos, meta: r.meta || {} });
        }
        return out;
      },
      count() { return byId.size; },
      clear() { byId.clear(); byKind.clear(); seq = 0; },
      summary() {
        const kinds = {};
        for (const [k, set] of byKind) kinds[k] = set.size;
        return { enabled: true, entityCount: byId.size, kinds };
      }
    };

    Genesis.EntityRegistry = Registry;
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('entity-registry', { status: 'validated', path: './src/genesis/entity-registry.js' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
