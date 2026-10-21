// GENESIS ENGINE — Personality Drift (P49 / P124)
// Lightweight HEXACO-style drift driven by trust and interaction events.

const TRAITS = ['honesty', 'emotionality', 'extraversion', 'agreeableness', 'conscientiousness', 'openness'];
function id(x) { return String(x || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function clamp(x) { return Math.max(0, Math.min(1, Number(x) || 0)); }

export function install(Genesis, worldState, saveWorldState) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  worldState.personalityProfiles = worldState.personalityProfiles || {};

  function ensure(actor) {
    const key = id(actor);
    if (!worldState.personalityProfiles[key]) {
      worldState.personalityProfiles[key] = { id: key, honesty: 0.55, emotionality: 0.45, extraversion: 0.5, agreeableness: 0.55, conscientiousness: 0.5, openness: 0.6, driftEvents: [] };
    }
    return worldState.personalityProfiles[key];
  }

  function drift(actor, vector = {}, reason = 'interaction') {
    const p = ensure(actor);
    for (const t of TRAITS) if (vector[t] != null) p[t] = clamp(p[t] + Number(vector[t]));
    p.driftEvents = [{ at: Date.now(), reason, vector }, ...(p.driftEvents || [])].slice(0, 40);
    saveWorldState();
    try { window.dispatchEvent(new CustomEvent('genesis:personality:drift', { detail: { id: p.id, profile: p, reason, vector } })); } catch (_) {}
    return p;
  }

  function tone(actor) {
    const p = ensure(actor);
    if (p.agreeableness < 0.35) return 'guarded';
    if (p.extraversion > 0.65) return 'bright';
    if (p.emotionality > 0.65) return 'sensitive';
    if (p.openness > 0.7) return 'curious';
    return 'steady';
  }

  let lastTrustEvent = null;
  function handleTrustDelta(d = {}) {
    const delta = Number(d.delta) || 0;
    const actor = d.id || d.agentId || d.targetId || 'unknown';
    const key = actor + '|' + delta + '|' + (d.reason || d.event_type || 'trust');
    const t = Date.now();
    if (lastTrustEvent && lastTrustEvent.key === key && t - lastTrustEvent.at < 50) return;
    lastTrustEvent = { key, at: t };
    if (delta >= 0) drift(actor, { agreeableness: 0.005, extraversion: 0.002, emotionality: -0.001 }, 'positive-trust');
    else drift(actor, { agreeableness: -0.03, emotionality: 0.025, honesty: -0.01 }, 'negative-trust');
  }
  window.addEventListener('genesis:trust:delta', (ev) => handleTrustDelta(ev && ev.detail ? ev.detail : {}));
  if (Genesis.EventBridge && typeof Genesis.EventBridge.on === 'function') {
    try { Genesis.EventBridge.on('trust:change', (ev) => handleTrustDelta(ev && ev.payload ? ev.payload : ev)); } catch (_) {}
  }

  const api = { ensure, drift, tone, summary: () => ({ profiles: Object.keys(worldState.personalityProfiles || {}).length }) };
  Genesis.PersonalityDrift = api;
  return api;
}

export default { install };
