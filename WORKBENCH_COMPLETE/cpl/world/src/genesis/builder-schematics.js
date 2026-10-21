// GENESIS ENGINE — Builder Schematics (P36 / P140)
// Converts Builder commissions into durable saved schematic records and rehydrates them.

function safeText(s, n) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, n); }

export function install(Genesis, worldState, saveWorldState, ctx = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const { THREE, builderRealm, builderClickTargets = [], color = 0x9ecbff } = ctx;
  worldState.builderSchematics = worldState.builderSchematics || [];

  function archive(request, reply) {
    const entry = {
      id: 'schematic-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      type: 'builder-schematic',
      request: safeText(request, 240),
      reply: safeText(reply, 1200),
      at: Date.now(),
      realm: 'builder',
      tags: ['builder', 'schematic', 'world-object', 'memory']
    };
    worldState.builds = [...(worldState.builds || []), { request: entry.request.slice(0, 160), reply: entry.reply.slice(0, 600), at: entry.at, id: entry.id }].slice(-8);
    worldState.builderSchematics = [entry, ...(worldState.builderSchematics || [])].slice(0, 80);
    worldState.memoryEvents = [
      { id: entry.id, type: 'builder-schematic', at: entry.at, summary: entry.request.slice(0, 180), tags: entry.tags },
      ...(worldState.memoryEvents || [])
    ].slice(0, 250);
    saveWorldState();
    try { window.dispatchEvent(new CustomEvent('genesis:builder:schematic', { detail: entry })); } catch (_) {}
    return entry;
  }

  function materialize(entry, index = 0) {
    if (!THREE || !builderRealm || !entry || !entry.id) return null;
    if (builderRealm.getObjectByName && builderRealm.getObjectByName(entry.id)) return null;
    const g = new THREE.Group();
    g.name = entry.id;
    const angle = (index / 12) * Math.PI * 2;
    const radius = 34 + (index % 4) * 9;
    g.position.set(Math.cos(angle) * radius, 16 + (index % 5) * 3, Math.sin(angle) * radius);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    g.add(plane);
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.26, 64, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.75, roughness: 0.35, metalness: 0.38, wireframe: true }));
    g.add(knot);
    g.userData.schematic = true;
    g.userData.schematicId = entry.id;
    g.userData.blueprint = '📐 SAVED SCHEMATIC — ' + entry.request.slice(0, 90) + '\n\n' + entry.reply.slice(0, 420);
    g.traverse((o) => { if (o.isMesh) { o.userData.schematic = true; o.userData.schematicId = entry.id; o.userData.blueprint = g.userData.blueprint; builderClickTargets.push(o); } });
    builderRealm.add(g);
    builderRealm._schematics = builderRealm.children.filter((c) => c.userData && c.userData.schematic);
    return g;
  }

  function restoreAll() {
    return (worldState.builderSchematics || []).slice().reverse().map((entry, i) => materialize(entry, i)).filter(Boolean).length;
  }

  const api = { archive, materialize, restoreAll, summary: () => ({ saved: (worldState.builderSchematics || []).length }) };
  Genesis.BuilderSchematics = api;
  restoreAll();
  return api;
}

export default { install };
