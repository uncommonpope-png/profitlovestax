// Genesis Engine — Cinematic Renderer (Phase D)
// Realm-specific look profiles + selective post + explicit Render Graph pass
// ownership. Inert until window.__GENESIS_CINEMATIC_RENDERER === true (default OFF).
//
// DESIGN NOTES (read before editing):
//  - This module does NOT own scene.fog or bloomPass.strength. The inline
//    AtmosphereController (index.html) writes scene.fog.color/density and
//    bloomPass.strength EVERY frame. Per the directive, fog is only set "if no
//    fog already owned by another system" — it IS owned, so we never touch it
//    (we preserve the prior owner and only report its state). The artists' bloom
//    threshold (NOT overwritten per-frame) is our durable bloom knob.
//  - bloomPass.enabled and renderer.toneMappingExposure are free (not owned by
//    the controller) and are the safe, reversible levers we drive.
//  - The module cannot reach the inline bloomPass/vignettePass directly (separate
//    module scope), so the inline installer wires them via setRefs({bloomPass,
//    vignettePass}) after install(). All access is guarded + try/catch so a
//    missing pass instance never throws to top level.
//  - No new point lights are ever created; we only toggle the existing decorative
//    switch (which the PerformanceGovernor also owns — we defer to it on tier
//    change and only assert a stratum hint on transition, never every frame).
//
// Reversible: supplies createCinematicRenderer + install only. Inline decides use.

import * as THREE from 'three';

// Realm look profiles. saturation/contrast/reflection are documented intent; the
// durable, conflict-free levers we actually apply are: exposure, bloomThreshold,
// bloomEnabled (tier), decorativeEnabled (stratum hint), vignette darkness.
export const LOOK_PROFILES = Object.freeze({
  surface: Object.freeze({
    exposure: 1.0, contrast: 1.05, saturation: 1.08,
    bloom: 0.55, bloomThreshold: 0.78,
    fog: Object.freeze({ color: 0x0a0a16, density: 0.012 }),
    shadow: true, reflection: 0.6, vignette: 0.35
  }),
  heaven: Object.freeze({
    exposure: 1.25, contrast: 1.12, saturation: 1.18,
    bloom: 0.8, bloomThreshold: 0.65,
    fog: Object.freeze({ color: 0x10203a, density: 0.006 }),
    shadow: true, reflection: 0.85, vignette: 0.25
  }),
  darkCity: Object.freeze({
    exposure: 0.7, contrast: 1.3, saturation: 0.85,
    bloom: 0.4, bloomThreshold: 0.9,
    fog: Object.freeze({ color: 0x05050a, density: 0.03 }),
    shadow: false, reflection: 0.2, vignette: 0.55
  })
});

function tierBloomMultiplier(tier) {
  if (tier === 'low') return 0;        // bloom disabled (handled via .enabled)
  if (tier === 'medium') return 0.5;   // half bloom strength intent
  return 1.0;                          // high: full
}

export function createCinematicRenderer(ctx) {
  const { Genesis, renderer, scene } = ctx;
  // Wired by the inline installer (module scope cannot see inline bloomPass).
  let bloomPass = null;
  let vignettePass = null;
  let enabled = false;
  let activeLook = 'surface';
  let currentTier = (typeof ctx.perfTier === 'function') ? ctx.perfTier() : 'high';
  // Baseline snapshot (restored on disable/teardown).
  const baseline = {
    exposure: (renderer && typeof renderer.toneMappingExposure === 'number') ? renderer.toneMappingExposure : 1.0,
    bloomThreshold: (bloomPass && typeof bloomPass.threshold === 'number') ? bloomPass.threshold : 0.4,
    decorativeEnabled: true,
    vignetteDarkness: 0.7
  };

  function setRefs(refs) {
    if (refs && refs.bloomPass) bloomPass = refs.bloomPass;
    if (refs && refs.vignettePass) vignettePass = refs.vignettePass;
    // Re-snapshot baseline threshold once the real pass is known.
    if (bloomPass && typeof bloomPass.threshold === 'number') baseline.bloomThreshold = bloomPass.threshold;
    if (vignettePass && vignettePass.uniforms && vignettePass.uniforms['darkness'] && typeof vignettePass.uniforms['darkness'].value === 'number') {
      baseline.vignetteDarkness = vignettePass.uniforms['darkness'].value;
    }
    return true;
  }

  function getProfile(stratumId) {
    if (LOOK_PROFILES[stratumId]) return LOOK_PROFILES[stratumId];
    return LOOK_PROFILES.surface;
  }

  function applyLook(stratumId) {
    if (!enabled) return false;
    try {
      const profile = getProfile(stratumId);
      activeLook = stratumId in LOOK_PROFILES ? stratumId : 'surface';

      // 1) Tone mapping exposure — free lever.
      if (renderer && typeof renderer.toneMappingExposure === 'number') {
        renderer.toneMappingExposure = profile.exposure;
      }

      // 2) Bloom threshold — durable (NOT overwritten per-frame by controller).
      //    bloomPass.strength is owned by AtmosphereController; we do NOT force it
      //    every frame. We drive .enabled by tier (selective post).
      if (bloomPass) {
        try {
          if (typeof bloomPass.threshold === 'number') bloomPass.threshold = profile.bloomThreshold;
          if (typeof bloomPass.enabled === 'boolean') {
            const mult = tierBloomMultiplier(currentTier);
            bloomPass.enabled = (currentTier !== 'low') && (profile.bloom > 0) && mult > 0;
          }
        } catch (e) { /* missing instance — degrade gracefully */ }
      }

      // 3) Vignette darkness — free lever (not owned per-frame).
      if (vignettePass && vignettePass.uniforms && vignettePass.uniforms['darkness']) {
        try { vignettePass.uniforms['darkness'].value = profile.vignette; } catch (e) {}
      }

      // 4) Decorative lights — stratum hint. Governor owns this lever; we only
      //    assert on stratum transition (not per frame), so no fight loop.
      if (Genesis && Genesis.LightingManager && typeof Genesis.LightingManager.setDecorativeEnabled === 'function') {
        try { Genesis.LightingManager.setDecorativeEnabled(stratumId !== 'darkCity'); } catch (e) {}
      }

      // 5) Fog is OWNED by AtmosphereController — we never set scene.fog here.
      return true;
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[CinematicRenderer] applyLook failed:', e && e.message);
      return false;
    }
  }

  function setTier(tier) {
    currentTier = tier || currentTier;
    if (enabled) applyLook(activeLook); // re-apply so bloom.enabled reflects tier
    return currentTier;
  }

  // Restore everything we touched back to baseline. Called on disable/teardown.
  function restore() {
    try {
      if (renderer && typeof renderer.toneMappingExposure === 'number') renderer.toneMappingExposure = baseline.exposure;
      if (bloomPass) {
        try {
          if (typeof bloomPass.threshold === 'number') bloomPass.threshold = baseline.bloomThreshold;
          if (typeof bloomPass.enabled === 'boolean') bloomPass.enabled = (currentTier !== 'low');
        } catch (e) {}
      }
      if (vignettePass && vignettePass.uniforms && vignettePass.uniforms['darkness']) {
        try { vignettePass.uniforms['darkness'].value = baseline.vignetteDarkness; } catch (e) {}
      }
      if (Genesis && Genesis.LightingManager && typeof Genesis.LightingManager.setDecorativeEnabled === 'function') {
        try { Genesis.LightingManager.setDecorativeEnabled(baseline.decorativeEnabled); } catch (e) {}
      }
      // We never changed scene.fog, so nothing to restore there.
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[CinematicRenderer] restore failed:', e && e.message);
    }
    return true;
  }

  function enable() {
    if (enabled) return true;
    enabled = true;
    // Snapshot baseline only once, on first enable.
    if (renderer && typeof renderer.toneMappingExposure === 'number') baseline.exposure = renderer.toneMappingExposure;
    if (Genesis && Genesis.LightingManager && typeof Genesis.LightingManager.summary === 'function') {
      try { baseline.decorativeEnabled = !!Genesis.LightingManager.summary().decorativeEnabled; } catch (e) {}
    }
    applyLook(activeLook);
    return true;
  }

  function disable() {
    if (!enabled) return true;
    enabled = false;
    restore();
    return true;
  }

  function summary() {
    return {
      enabled,
      activeLook,
      exposure: (renderer && typeof renderer.toneMappingExposure === 'number') ? renderer.toneMappingExposure : null,
      bloomStrength: (bloomPass && typeof bloomPass.strength === 'number') ? bloomPass.strength : null,
      bloomThreshold: (bloomPass && typeof bloomPass.threshold === 'number') ? bloomPass.threshold : null,
      bloomEnabled: (bloomPass && typeof bloomPass.enabled === 'boolean') ? bloomPass.enabled : null,
      fogDensity: (scene && scene.fog && scene.fog.density != null) ? scene.fog.density : null,
      decorativeEnabled: (Genesis && Genesis.LightingManager && typeof Genesis.LightingManager.summary === 'function')
        ? !!Genesis.LightingManager.summary().decorativeEnabled : null,
      tier: currentTier
    };
  }

  return {
    setRefs, applyLook, setTier, enable, disable, restore, summary,
    LOOK_PROFILES,
    isEnabled: () => enabled
  };
}

export function install(Genesis, THREE, renderer, camera, scene, effectComposer, perfTier) {
  if (!Genesis) return false;
  // perfTier: optional () => 'low'|'medium'|'high' supplier (kept as 7th arg to
  // preserve the requested install(Genesis, THREE, renderer, camera, scene,
  // effectComposer) shape — callers may omit it).
  const getTier = (typeof perfTier === 'function')
    ? perfTier
    : () => (Genesis && Genesis.PerformanceGovernor && typeof Genesis.PerformanceGovernor.summary === 'function'
        ? (Genesis.PerformanceGovernor.summary().tier || 'high') : 'high');
  const mgr = createCinematicRenderer({ Genesis, renderer, scene, perfTier: getTier });

  Genesis.CinematicRenderer = Object.assign(Genesis.CinematicRenderer || {}, {
    setRefs(r) { return mgr.setRefs(r); },
    applyLook(id) { return mgr.applyLook(id); },
    setTier(t) { return mgr.setTier(t); },
    enable() { return mgr.enable(); },
    disable() { return mgr.disable(); },
    restore() { return mgr.restore(); },
    summary() { return mgr.summary(); },
    LOOK_PROFILES
  });
  return true;
}
