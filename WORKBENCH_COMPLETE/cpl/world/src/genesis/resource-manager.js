// GENESIS ENGINE — Resource Manager (manager #1)
// Extracted module target for the P8 static ES-module split.
// Three.js is ONLY the renderer. This manager governs GPU resource ownership + cost.
//
// Loaded via flag-gated dynamic import() from index.html:
//   import('./src/genesis/resource-manager.js').then(m => m.install(window.Genesis, THREE, renderer))
//
// When __GENESIS_RESOURCE_MANAGER === false it is never imported (no-op).

import * as THREE from 'three';

export function createResourceManager(THREE, renderer) {
  const registry = new Set(); // { res, type, owner, cost }

  function _typeOf(res) {
    if (!res) return 'unknown';
    if (res.isBufferGeometry || res.isGeometry) return 'geometry';
    if (res.isMaterial) return 'material';
    if (res.isTexture) return 'texture';
    if (res.isWebGLRenderTarget) return 'rt';
    return 'unknown';
  }

  function track(res, owner, obj) {
    if (!res) return;
    const type = _typeOf(res);
    if (type === 'unknown') return;
    const cost = (obj && obj.userData && obj.userData.cost) ? obj.userData.cost : null;
    registry.add({ res, type, owner: owner || 'unknown', cost });
  }

  function untrack(res) {
    for (const e of registry) { if (e.res === res) { registry.delete(e); break; } }
  }

  function audit() {
    const info = (renderer && renderer.info && renderer.info.memory) ? renderer.info.memory : { geometries: 0, textures: 0 };
    let geo = 0, tex = 0;
    for (const e of registry) { if (e.type === 'geometry') geo++; else if (e.type === 'texture') tex++; }
    const orphansGeo = geo - info.geometries;
    const orphansTex = tex - info.textures;
    return {
      trackedGeometries: geo, liveGeometries: info.geometries, orphansGeo,
      trackedTextures: tex, liveTextures: info.textures, orphansTex,
      total: registry.size,
      healthy: orphansGeo <= 0 && orphansTex <= 0
    };
  }

  function dispose(owner) {
    let n = 0;
    for (const e of [...registry]) {
      if (e.owner !== owner) continue;
      try {
        if (e.type === 'geometry' && e.res.dispose) e.res.dispose();
        else if (e.type === 'material') { if (e.res.map && e.res.map.dispose) e.res.map.dispose(); if (e.res.dispose) e.res.dispose(); }
        else if (e.type === 'texture' && e.res.dispose) e.res.dispose();
        else if (e.type === 'rt' && e.res.dispose) e.res.dispose();
      } catch (_) { /* best-effort */ }
      registry.delete(e); n++;
    }
    return n;
  }

  function summary() {
    const byOwner = {};
    for (const e of registry) byOwner[e.owner] = (byOwner[e.owner] || 0) + 1;
    return { total: registry.size, byOwner, audit: audit() };
  }

  return { track, untrack, audit, dispose, summary, _registry: registry };
}

export function install(Genesis, THREE, renderer) {
  if (!Genesis) return null;
  const mgr = createResourceManager(THREE, renderer);
  Genesis.ResourceManager = mgr;
  return mgr;
}
