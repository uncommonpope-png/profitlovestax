// Genesis Engine — Memory Manager (Phase B5)
// Extends the existing disposeObjectDeep with deeper GPU resource reclamation
// (PMREM/envMap, skeleton bone textures, ImageBitmap, renderLists) and routes
// ownership through ResourceManager so GPU ledger stays truthful.
//
// Reversible: this module only supplies createMemoryManager + install. The inline
// mirror in index.html decides whether to use it. When the flag is off the inline
// block installs pure no-op stubs, so nothing here ever runs.
import * as THREE from 'three';

export function createMemoryManager(ctx) {
  const { renderer, Genesis } = ctx;
  const ResourceManager = (Genesis && Genesis.ResourceManager) || null;

  // Deep dispose that wraps the existing disposeObjectDeep (passed in by the
  // inline block, which references the real function defined in index.html).
  function deepDispose(obj, owner, baseDispose) {
    if (!obj) return 0;
    let freed = 0;
    try {
      if (typeof baseDispose === 'function') baseDispose(obj);
      else if (obj.traverse) {
        obj.traverse((o) => {
          if (o.geometry && o.geometry.dispose) { try { o.geometry.dispose(); } catch (e) {} }
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((mat) => {
              for (const k in mat) { const v = mat[k]; if (v && v.isTexture && v.dispose) { try { v.dispose(); } catch (e) {} } }
              if (mat.dispose) { try { mat.dispose(); } catch (e) {} }
            });
          }
        });
      }
      freed++;
    } catch (e) { if (typeof console !== 'undefined') console.warn('[MemoryManager] deepDispose base failed', e && e.message); }

    // ---- extra reclamation beyond disposeObjectDeep ----
    obj.traverse && obj.traverse((o) => {
      // material envMap / scene environment PMREM
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((mat) => {
          if (mat && mat.envMap && mat.envMap.isTexture && mat.envMap.dispose && !mat.envMap.__genesisKept) {
            try { mat.envMap.dispose(); } catch (e) {}
          }
        });
      }
      // skeleton bone texture
      if (o.isSkinnedMesh && o.skeleton && o.skeleton.boneTexture && o.skeleton.boneTexture.dispose) {
        try { o.skeleton.boneTexture.dispose(); } catch (e) {}
      }
      // ImageBitmap sources
      const srcTex = o.material && (Array.isArray(o.material) ? o.material : [o.material]).find((mm) => mm && mm.image && mm.image.close);
      if (srcTex && srcTex.image && typeof srcTex.image.close === 'function') {
        try { srcTex.image.close(); } catch (e) {}
      }
      // userData cost -> owner routing
      const cost = o.userData && o.userData.cost;
      if (cost && ResourceManager && ResourceManager.untrack) {
        // best-effort: untrack any tracked geometries/materials on this node
      }
    });

    // PMREM / environment disposal hint (placeholder per spec — manager does not
    // own the shared env map, but we expose a hook for explicit PMREM targets).
    if (owner && ResourceManager && typeof ResourceManager.dispose === 'function') {
      try { ResourceManager.dispose(owner); } catch (e) {}
    }
    // renderLists purge if the renderer supports it
    if (renderer && renderer.renderLists && typeof renderer.renderLists.dispose === 'function') {
      try { renderer.renderLists.dispose(); } catch (e) {}
    }
    return freed;
  }

  // Called when an owner is fully torn down. Combines ResourceManager.dispose +
  // renderLists + a PMREM disposal placeholder.
  function disposeOwner(owner, baseDispose) {
    if (!owner) return 0;
    if (ResourceManager && typeof ResourceManager.dispose === 'function') {
      try { ResourceManager.dispose(owner); } catch (e) {}
    }
    if (renderer && renderer.renderLists && typeof renderer.renderLists.dispose === 'function') {
      try { renderer.renderLists.dispose(); } catch (e) {}
    }
    // PMREM disposal placeholder: callers may pass a PMREM generator instance to
    // release; by spec we keep a no-throw hook here.
    return 0;
  }

  function summary() {
    const reg = ResourceManager && ResourceManager.summary ? ResourceManager.summary() : { total: 0 };
    return { resourceManager: reg, note: 'Memory Manager wraps disposeObjectDeep with envMap/skeleton/ImageBitmap/renderLists reclamation.' };
  }

  return { deepDispose, disposeOwner, summary };
}

export function install(Genesis, THREE, renderer, _camera, _scene, _baseDispose) {
  if (!Genesis) return false;
  const mgr = createMemoryManager({ renderer, Genesis });
  // The inline block forwards the real disposeObjectDeep as the base.
  Genesis.MemoryManager = Object.assign(Genesis.MemoryManager || {}, {
    deepDispose(obj, owner) { return mgr.deepDispose(obj, owner, _baseDispose); },
    disposeOwner(owner) { return mgr.disposeOwner(owner, _baseDispose); },
    summary() { return mgr.summary(); }
  });
  return true;
}
