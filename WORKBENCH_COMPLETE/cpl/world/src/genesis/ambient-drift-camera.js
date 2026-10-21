// GENESIS ENGINE — Ambient Drift Camera (P77)
// Adds tiny idle camera motion so the world breathes without stealing control.

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const amp = options.amp || 0.08;
  const ampY = options.ampY || 0.035;
  const saveEveryMs = options.saveEveryMs || 15000;
  worldState.ambientDriftCam = worldState.ambientDriftCam || { ticks: 0, activeTicks: 0, events: [] };
  let phase = 0, intensity = 0, lastSave = 0;
  function offset(dt, ctx = {}) {
    const idle = !!ctx.idle;
    phase += Math.max(0, Math.min(0.08, dt || 0.016));
    intensity += ((idle ? 1 : 0) - intensity) * Math.min(1, (dt || 0.016) * 2.0);
    const state = worldState.ambientDriftCam || { ticks: 0, activeTicks: 0, events: [] };
    state.ticks = (state.ticks || 0) + 1; if (intensity > 0.05) state.activeTicks = (state.activeTicks || 0) + 1;
    const t = Date.now();
    if (t - lastSave > saveEveryMs) { lastSave = t; state.lastAt = t; state.intensity = Number(intensity.toFixed(3)); state.events = [{ at: t, intensity: state.intensity, idle }, ...(state.events || [])].slice(0, 12); worldState.ambientDriftCam = state; saveWorldState(); try { window.dispatchEvent(new CustomEvent('genesis:camera:drift', { detail: state })); } catch (_) {} }
    if (intensity <= 0.001) return null;
    return { x: Math.sin(phase * 0.73) * amp * intensity, y: Math.sin(phase * 0.47 + 1.3) * ampY * intensity, z: Math.cos(phase * 0.61) * amp * intensity };
  }
  const api = { offset, summary: () => worldState.ambientDriftCam }; Genesis.AmbientDriftCam = api; return api;
}

export default { install };
