// Genesis Engine — Lighting Manager (Phase B8)
// Governs point-light population: enforces a hard cap (<=8 active point lights),
// disables lowest-priority decorative lights first, and exposes a master
// decorative switch the Performance Governor can flip. Observes, never removes.
//
// Reversible: supplies createLightingManager + install only. Inline decides use.
import * as THREE from 'three';

export function createLightingManager(ctx) {
  const { Genesis, scene } = ctx;
  const lights = new Map(); // light -> meta { owner, decorative, cost, priority }
  let decorativeEnabled = true;
  const HARD_CAP = 8;

  function register(light, meta = {}) {
    if (!light || !light.isLight) return;
    lights.set(light, {
      owner: meta.owner || 'unknown',
      decorative: !!meta.decorative,
      cost: meta.cost || 1,
      priority: (typeof meta.priority === 'number') ? meta.priority : (meta.decorative ? 0 : 5)
    });
  }
  function deregister(light) { lights.delete(light); }

  function activePointLights() {
    let n = 0;
    for (const [l, m] of lights) {
      if (!l.isPointLight) continue;
      if (!l.visible) continue;
      if (m.decorative && !decorativeEnabled) continue;
      n++;
    }
    return n;
  }

  // Enforce the hard cap: if exceeded, disable lowest-priority decorative lights.
  function capCheck() {
    let over = activePointLights() - HARD_CAP;
    if (over <= 0) return 0;
    const decor = [];
    for (const [l, m] of lights) if (l.isPointLight && m.decorative && l.visible) decor.push([l, m]);
    decor.sort((a, b) => a[1].priority - b[1].priority);
    let disabled = 0;
    for (const [l] of decor) {
      if (over <= 0) break;
      l.visible = false;
      over--;
      disabled++;
    }
    return disabled;
  }

  function setDecorativeEnabled(v) {
    decorativeEnabled = !!v;
    for (const [l, m] of lights) if (l.isPointLight && m.decorative) l.visible = decorativeEnabled && (l.__genesisWasVisible !== false);
  }

  function tick() {
    // Keep the cap honest every frame (cheap). Recovery is automatic: when the
    // Governor re-enables decorative lights, the cap re-evaluates upward.
    capCheck();
  }

  function summary() { return { registered: lights.size, activePointLights: activePointLights(), decorativeEnabled, cap: HARD_CAP }; }

  return { register, deregister, capCheck, setDecorativeEnabled, tick, summary, HARD_CAP };
}

export function install(Genesis, THREE, _camera, scene) {
  if (!Genesis) return false;
  const mgr = createLightingManager({ Genesis, scene });
  Genesis.LightingManager = Object.assign(Genesis.LightingManager || {}, {
    register(l, meta) { return mgr.register(l, meta); },
    deregister(l) { return mgr.deregister(l); },
    capCheck() { return mgr.capCheck(); },
    setDecorativeEnabled(v) { return mgr.setDecorativeEnabled(v); },
    tick() { return mgr.tick(); },
    summary() { return mgr.summary(); }
  });
  return true;
}
