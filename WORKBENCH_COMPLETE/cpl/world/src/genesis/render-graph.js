// Genesis Engine — Render Graph (Phase B3)
// Owns the post-processing composition as a first-class, governor-adjustable pass.
// addPass(pass, meta), setResolutionScale(scale) (clamped), compose() (mirrors
// effectComposer.render() unless overridden), tick().
//
// Reversible: supplies createRenderGraph + install only. Inline decides use.
import * as THREE from 'three';

export function createRenderGraph(ctx) {
  const { renderer, effectComposer, scene, camera, basePixelRatio } = ctx;
  const passes = new Map();
  let resolutionScale = 1.0;
  let appliedDPR = renderer && renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
  let lastResizeAt = 0;
  let lastPath = 'failed';
  let lastError = null;
  let composeCount = 0;
  let fallbackCount = 0;
  let lastRenderedAt = 0;
  const baseDPR = (typeof basePixelRatio === 'number' && basePixelRatio > 0) ? basePixelRatio : 1;
  const MIN_SCALE = 0.5, MAX_SCALE = 1.0;
  const RESIZE_INTERVAL_MS = 1000;
  const DPR_EPSILON = 0.03;
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

  function addPass(pass, meta = {}) {
    if (!pass) return;
    passes.set(pass, { owner: meta.owner || 'unknown', optional: !!meta.optional });
    if (effectComposer && typeof effectComposer.addPass === 'function') {
      try { effectComposer.addPass(pass); } catch (e) {}
    }
  }
  function setResolutionScale(scale) {
    resolutionScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    const dpr = Math.max(0.5, Math.min(2, baseDPR * resolutionScale));
    const now = performance.now();
    if (Math.abs(dpr - appliedDPR) < DPR_EPSILON || (now - lastResizeAt) < RESIZE_INTERVAL_MS) return appliedDPR;
    try {
      renderer.setPixelRatio(dpr);
      if (effectComposer && typeof effectComposer.setPixelRatio === 'function') effectComposer.setPixelRatio(dpr);
      if (effectComposer && typeof effectComposer.setSize === 'function') effectComposer.setSize(window.innerWidth, window.innerHeight);
      appliedDPR = dpr;
      lastResizeAt = now;
    } catch (e) {}
    return appliedDPR;
  }
  function compose() {
    composeCount++;
    if (effectComposer && typeof effectComposer.render === 'function') {
      try {
        effectComposer.render();
        lastPath = 'composer';
        lastError = null;
        lastRenderedAt = now();
        return true;
      } catch (error) {
        const composerError = error && error.message ? error.message : String(error);
        lastError = composerError;
        fallbackCount++;
        try {
          renderer.render(scene || renderer.__genesisScene, camera || renderer.__genesisCamera);
          lastPath = 'raw-fallback';
          lastRenderedAt = now();
          return true;
        } catch (fallbackError) {
          lastPath = 'failed';
          lastError = `composer: ${composerError}; raw fallback: ${fallbackError && fallbackError.message ? fallbackError.message : String(fallbackError)}`;
          return false;
        }
      }
    }
    try {
      renderer.render(scene || renderer.__genesisScene, camera || renderer.__genesisCamera);
      lastPath = 'raw';
      lastError = null;
      lastRenderedAt = now();
      return true;
    } catch (error) {
      lastPath = 'failed';
      lastError = error && error.message ? error.message : String(error);
      return false;
    }
  }
  function tick() {}
  function summary() { return { passes: passes.size, resolutionScale, baseDPR, lastPath, lastError, composeCount, fallbackCount, lastRenderedAt }; }
  return { addPass, setResolutionScale, compose, tick, summary, getResolutionScale: () => resolutionScale };
}

export function install(Genesis, THREE, renderer, camera, scene, effectComposer, basePixelRatio) {
  if (!Genesis) return false;
  const mgr = createRenderGraph({ renderer, effectComposer, scene, camera, basePixelRatio });
  Genesis.RenderGraph = Object.assign(Genesis.RenderGraph || {}, {
    addPass(p, meta) { return mgr.addPass(p, meta); },
    setResolutionScale(s) { return mgr.setResolutionScale(s); },
    compose() { return mgr.compose(); },
    tick() { return mgr.tick(); },
    getResolutionScale() { return mgr.getResolutionScale(); },
    summary() { return mgr.summary(); }
  });
  return true;
}
