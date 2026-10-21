// Genesis Engine — Streaming Manager (Phase B2)
// Adds explicit load/unload lifecycle on top of the existing lazy-asset queue.
// Assets are loaded once (tracked via ResourceManager), and can be unloaded when
// their sector is exited (MemoryManager.deepDispose + ResourceManager.dispose).
//
// Reversible: supplies createStreamingManager + install only. Inline decides use.
import * as THREE from 'three';

export function createStreamingManager(ctx) {
  const { Genesis } = ctx;
  const assets = new Map(); // key -> { loaderFn, meta, loaded, object }
  const MemoryManager = (Genesis && Genesis.MemoryManager) || null;
  const ResourceManager = (Genesis && Genesis.ResourceManager) || null;
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

  function register(assetKey, loaderFn, meta = {}) {
    if (!assetKey || typeof loaderFn !== 'function') return false;
    if (assets.has(assetKey) && meta.loadOnce !== false) return false;
    assets.set(assetKey, { loaderFn, meta, state: 'queued', loaded: false, object: null, queuedAt: now(), invokedAt: 0, completedAt: 0, error: null, promise: null });
    return true;
  }

  function ensureLoaded(key) {
    const a = assets.get(key);
    if (!a) return null;
    if (a.state !== 'queued') return a.promise || a.object;
    a.state = 'loading';
    a.invokedAt = now();
    try {
      const result = a.loaderFn();
      if (result && typeof result.then === 'function') {
        a.promise = Promise.resolve(result).then((obj) => {
          a.object = obj || null;
          a.loaded = true;
          a.state = 'loaded';
          a.completedAt = now();
          if (obj && ResourceManager && typeof ResourceManager.track === 'function' && obj.userData) ResourceManager.track(obj, a.meta.owner || key, obj);
          return obj;
        }).catch((error) => {
          a.state = 'error';
          a.error = error && error.message ? error.message : String(error);
          a.completedAt = now();
          throw error;
        });
        return a.promise;
      }
      if (result != null) {
        a.object = result;
        a.loaded = true;
        a.state = 'loaded';
        a.completedAt = now();
        if (ResourceManager && typeof ResourceManager.track === 'function' && result.userData) ResourceManager.track(result, a.meta.owner || key, result);
      } else {
        a.state = 'invoked';
      }
      return result || null;
    } catch (error) {
      a.state = 'error';
      a.error = error && error.message ? error.message : String(error);
      a.completedAt = now();
      throw error;
    }
  }

  function unload(key) {
    const a = assets.get(key);
    if (!a || !a.loaded) return false;
    if (a.object && MemoryManager && typeof MemoryManager.deepDispose === 'function') {
      try { MemoryManager.deepDispose(a.object, a.meta.owner || key); } catch (e) {}
    } else if (a.object && ResourceManager && typeof ResourceManager.dispose === 'function') {
      try { ResourceManager.dispose(a.meta.owner || key); } catch (e) {}
    }
    a.loaded = false;
    a.object = null;
    a.promise = null;
    a.state = 'queued';
    a.queuedAt = now();
    a.invokedAt = 0;
    a.completedAt = 0;
    a.error = null;
    return true;
  }

  // Lazy unload of assets whose sector is no longer awake.
  function tick() {
    for (const [key, a] of assets) {
      if (!a.loaded) continue;
      const sectorId = a.meta.sector;
      if (sectorId && Genesis.SectorManager && typeof Genesis.SectorManager.isAwake === 'function') {
        if (!Genesis.SectorManager.isAwake(sectorId)) { try { unload(key); } catch (e) {} }
      }
    }
  }

  function summary() {
    const byTier = {};
    const requests = {};
    const states = {};
    let loaded = 0;
    for (const [key, asset] of assets) {
      if (asset.loaded) loaded++;
      states[asset.state] = (states[asset.state] || 0) + 1;
      const tier = asset.meta.tier || 'decor';
      byTier[tier] = (byTier[tier] || 0) + 1;
      requests[key] = { requestId: asset.meta.requestId || key, label: asset.meta.label || key, owner: asset.meta.owner || key, state: asset.state, loaded: asset.loaded, invoked: asset.invokedAt > 0, tier, priority: asset.meta.priority || 0, sector: asset.meta.sector || null, error: asset.error };
    }
    return { registered: assets.size, loaded, states, byTier, requests };
  }

  return { register, ensureLoaded, unload, tick, summary };
}

export function install(Genesis, THREE, _camera, _scene) {
  if (!Genesis) return false;
  const mgr = createStreamingManager({ Genesis });
  Genesis.StreamingManager = Object.assign(Genesis.StreamingManager || {}, {
    register(k, fn, meta) { return mgr.register(k, fn, meta); },
    ensureLoaded(k) { return mgr.ensureLoaded(k); },
    unload(k) { return mgr.unload(k); },
    tick() { return mgr.tick(); },
    summary() { return mgr.summary(); }
  });
  return true;
}
