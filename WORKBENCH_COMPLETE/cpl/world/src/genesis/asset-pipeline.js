// GENESIS ENGINE — Asset Pipeline (Phase A — subsystem #1)
// Flag-gated dynamic-import mirror of the inline Genesis.AssetPipeline manager.
// When window.__GENESIS_ASSET_PIPELINE === false the inline install is a no-op
// and this module is never loaded. Loaded via:
//   import('./src/genesis/asset-pipeline.js').then(m => m.install(window.Genesis, THREE, ...))
// Mirror only — the inline manager in index.html is authoritative.

import * as THREE from 'three';

// install signature matches the other Genesis manager modules:
//   install(Genesis, THREE, renderer, camera, scene, ...)
export function install(Genesis, THREE, renderer, camera, scene) {
  if (!Genesis) return null;

  const manifests = new Map();   // id -> manifest
  const loaded = new Map();      // id -> loaded object
  const errors = {};             // id -> error message

  function validate(manifest) {
    const errs = [];
    if (!manifest) { errs.push('manifest is required'); return { ok: false, errors: errs }; }
    if (!manifest.id) errs.push('manifest.id is required');
    if (!manifest.url) errs.push('manifest.url is required');
    if (!manifest.provenance || !manifest.provenance.license || !manifest.provenance.source) {
      // Non-fatal: warn, but the manifest is still allowed (validation.ok stays true).
      if (typeof console !== 'undefined') {
        console.warn('[AssetPipeline] manifest "' + (manifest.id || '?') + '" missing license/source provenance — CC0 audit gap');
      }
    }
    if (!manifest.cost) errs.push('manifest.cost is required');
    return { ok: errs.length === 0, errors: errs };
  }

  function registerAsset(manifest) {
    if (!manifest || !manifest.id) {
      if (typeof console !== 'undefined') console.warn('[AssetPipeline] registerAsset ignored: missing id');
      return false;
    }
    manifests.set(manifest.id, manifest);
    const v = validate(manifest);
    if (!v.ok) errors[manifest.id] = v.errors.join('; ');
    else delete errors[manifest.id];
    return true;
  }

  function load(id, onLoad, onError) {
    const manifest = manifests.get(id);
    if (!manifest) {
      const msg = 'unknown asset id: ' + id;
      if (typeof console !== 'undefined') console.warn('[AssetPipeline] ' + msg);
      if (typeof onError === 'function') onError(new Error(msg));
      return null;
    }
    // Route through the existing lazy queue so ResourceManager + StreamingManager track it.
    // enqueueLazyAsset(label, fn, tier, requestMeta) — 4th arg is consumed by the
    // StreamingManager observer (see streaming-manager inline wrapper).
    try {
      enqueueLazyAsset(id, () => {
        const loader = makeGLTF({ tier: manifest.tier || 'decor', owner: manifest.owner || id });
        return loader.load(manifest.url, (obj) => {
          loaded.set(id, obj);
          if (Genesis.ResourceManager && typeof Genesis.ResourceManager.track === 'function') {
            try { Genesis.ResourceManager.track(obj, manifest.owner || id, obj); } catch (e) {}
          }
          if (typeof onLoad === 'function') onLoad(obj);
        }, undefined, (err) => {
          errors[id] = (err && err.message) ? err.message : String(err);
          if (typeof onError === 'function') onError(err);
        });
      }, manifest.tier || 'decor', { owner: manifest.owner || id, sector: manifest.sector });
    } catch (err) {
      errors[id] = (err && err.message) ? err.message : String(err);
      if (typeof onError === 'function') onError(err);
    }
    return null;
  }

  function summary() {
    const byTier = {};
    const byOwner = {};
    for (const m of manifests.values()) {
      const t = m.tier || 'decor';
      byTier[t] = (byTier[t] || 0) + 1;
      const o = m.owner || 'unknown';
      byOwner[o] = (byOwner[o] || 0) + 1;
    }
    return {
      registered: manifests.size,
      loaded: loaded.size,
      byTier,
      byOwner,
      validationErrors: Object.keys(errors).length
    };
  }

  // Do not overwrite an inline-authoritative manager if it already exists.
  Genesis.AssetPipeline = Object.assign(Genesis.AssetPipeline || {}, {
    registerAsset,
    validate,
    load,
    summary
  });
  return Genesis.AssetPipeline;
}

export default { install };
