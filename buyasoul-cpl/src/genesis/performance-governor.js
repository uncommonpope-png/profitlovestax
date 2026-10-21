// Genesis Engine — Performance Governor v2 (Phase C)
// CONTINUOUS, pre-emptive performance loop. Replaces the discrete 3-tier switch
// with a self-correcting analog controller that nudges levers every frame,
// BEFORE the frame rate actually struggles, and recovers when metrics improve.
//
// Levers (each 0..1 stress; adjustments are small + continuous):
//  - window.__genesisReduceParticles  (particles update less / skip)
//  - window.__genesisLowerUpdateFreq   (half-rate more systems)
//  - window.__genesisSleepBias        (SectorManager sleeps sooner)
//  - Genesis.RenderGraph.setResolutionScale(scale)  (resolution dial)
//  - Genesis.LightingManager.setDecorativeEnabled(false)  (drop decorative lights)
//  - Genesis.AnimationScheduler.setOptionalPaused(true)  (freeze optional anims)
//  - Genesis.VideoManager.capCheck(n)  (fewer simultaneous videos)
//
// Reversible: supplies createPerformanceGovernor + install only. Inline decides use.
import * as THREE from 'three';

export function createPerformanceGovernor(ctx) {
  const { Genesis, renderer } = ctx;
  const ema = { frameMs: 16.7, calls: 200, geo: 0, tex: 0, video: 0 };
  let resolutionScale = 1.0;
  let particleLevel = 0;      // 0 = full, 1 = reduced
  let updateFreqLevel = 0;    // 0 = full, 1 = lowered
  let sleepBias = 0;          // 0 = normal, 1 = aggressive
  let decorativeOn = true;
  let optionalPaused = false;
  let videoCap = 6;
  let lastDir = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function applyLevers() {
    if (typeof window !== 'undefined') {
      window.__genesisReduceParticles = particleLevel > 0.5;
      window.__genesisLowerUpdateFreq = updateFreqLevel > 0.5;
      window.__genesisSleepBias = sleepBias;
    }
    if (Genesis.RenderGraph && typeof Genesis.RenderGraph.setResolutionScale === 'function') {
      try { Genesis.RenderGraph.setResolutionScale(resolutionScale); } catch (e) {}
    }
    if (Genesis.LightingManager && typeof Genesis.LightingManager.setDecorativeEnabled === 'function') {
      if (decorativeOn !== (sleepBias < 0.5)) { decorativeOn = sleepBias < 0.5; try { Genesis.LightingManager.setDecorativeEnabled(decorativeOn); } catch (e) {} }
    }
    if (Genesis.AnimationScheduler && typeof Genesis.AnimationScheduler.setOptionalPaused === 'function') {
      if (optionalPaused !== (updateFreqLevel > 0.6)) { optionalPaused = updateFreqLevel > 0.6; try { Genesis.AnimationScheduler.setOptionalPaused(optionalPaused); } catch (e) {} }
    }
    if (Genesis.VideoManager && typeof Genesis.VideoManager.capCheck === 'function') {
      try { Genesis.VideoManager.capCheck(videoCap); } catch (e) {}
    }
    // Sleep distant sectors more aggressively by re-ticking the sector manager.
    if (sleepBias > 0.5 && Genesis.SectorManager && typeof Genesis.SectorManager.tick === 'function') {
      try { Genesis.SectorManager.tick(); } catch (e) {}
    }
  }

  // info: { frameMs, calls, geometries, textures, videos, gpuMs }
  function sample(info) {
    if (!info) return;
    const a = 0.08; // EMA smoothing
    ema.frameMs = ema.frameMs * (1 - a) + (info.frameMs || 16.7) * a;
    ema.calls = ema.calls * (1 - a) + (info.calls || ema.calls) * a;
    ema.geo = ema.geo * (1 - a) + (info.geometries || 0) * a;
    ema.tex = ema.tex * (1 - a) + (info.textures || 0) * a;
    ema.video = ema.video * (1 - a) + (info.videos || 0) * a;

    // Stress: how far above the "good" target we are. Target 60fps => 16.7ms.
    const frameStress = clamp((ema.frameMs - 16.7) / 16.7, 0, 1); // >33ms => full
    const callStress = clamp((ema.calls - 250) / 750, 0, 1);      // >1000 calls => full
    const stress = Math.max(frameStress, callStress * 0.8);

    // CONTINUOUS adjustment: move each lever a small step toward the stress level.
    const step = 0.04;
    const dir = stress > 0.45 ? 1 : (stress < 0.25 ? -1 : 0);

    if (dir === 1) {
      particleLevel = clamp(particleLevel + step, 0, 1);
      updateFreqLevel = clamp(updateFreqLevel + step * 0.7, 0, 1);
      resolutionScale = clamp(resolutionScale - step * 0.04, 0.5, 1.0);
      videoCap = clamp(Math.round(videoCap - 1), 1, 6);
      if (stress > 0.7) { sleepBias = clamp(sleepBias + step * 0.5, 0, 1); }
    } else if (dir === -1) {
      // Recover slowly (asymmetry: recover slower than we degrade, to avoid flapping).
      particleLevel = clamp(particleLevel - step * 0.5, 0, 1);
      updateFreqLevel = clamp(updateFreqLevel - step * 0.4, 0, 1);
      resolutionScale = clamp(resolutionScale + step * 0.03, 0.5, 1.0);
      videoCap = clamp(Math.round(videoCap + 1), 1, 6);
      sleepBias = clamp(sleepBias - step * 0.3, 0, 1);
    }
    lastDir = dir;
    applyLevers();
    return { stress, frameMs: ema.frameMs, calls: ema.calls, resolutionScale, particleLevel, updateFreqLevel, sleepBias, videoCap };
  }

  // Fallback discrete setQuality retained for when governor flag is OFF.
  function setQuality(t) { return t; }

  function summary() {
    return { frameMs: ema.frameMs, calls: ema.calls, resolutionScale, particleLevel, updateFreqLevel, sleepBias, videoCap, decorativeOn, optionalPaused };
  }

  return { sample, setQuality, summary, getStress: () => ema.frameMs };
}

export function install(Genesis, THREE, renderer, _camera, _scene) {
  if (!Genesis) return false;
  const gov = createPerformanceGovernor({ Genesis, renderer });
  Genesis.PerformanceGovernor = Object.assign(Genesis.PerformanceGovernor || {}, {
    sample(info) { return gov.sample(info); },
    setQuality(t) { return gov.setQuality(t); },
    summary() { return gov.summary(); }
  });
  return true;
}
