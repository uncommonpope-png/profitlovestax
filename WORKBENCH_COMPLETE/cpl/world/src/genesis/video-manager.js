// Genesis Engine — Video Manager (Phase B9)
// Governs billboard videos: registers each (videoEl, plane, meta), counts active
// playbacks, and can pause videos beyond a cap to protect the frame budget.
//
// Reversible: supplies createVideoManager + install only. Inline decides use.
import * as THREE from 'three';

export function createVideoManager(ctx) {
  const { Genesis } = ctx;
  const entries = new Map(); // videoEl -> { plane, meta, active }

  function register(videoEl, plane, meta = {}) {
    if (!videoEl) return;
    entries.set(videoEl, { plane, meta, active: !videoEl.paused });
  }
  function unregister(videoEl) { return entries.delete(videoEl); }
  function setActive(videoEl, active) { const record = entries.get(videoEl); if (record) record.active = !!active; }

  function count() { let active = 0; for (const [video, record] of entries) if (record.active && !video.paused) active++; return active; }

  // Pause videos beyond maxActive (keep first maxActive registered; pause rest).
  function capCheck(maxActive) {
    const cap = (typeof maxActive === 'number') ? maxActive : 4;
    const list = [...entries.entries()];
    let paused = 0;
    for (let i = cap; i < list.length; i++) {
      const [v, rec] = list[i];
      if (rec.active) { try { v.pause(); } catch (e) {} if (rec.plane) rec.plane.visible = false; rec.active = false; paused++; }
    }
    return paused;
  }

  function tick() {
    // cheap bookkeeping; cap enforced on demand by Governor
  }

  function summary() { return { registered: entries.size, active: count() }; }

  return { register, unregister, setActive, activeCount: count, capCheck, tick, summary };
}

export function install(Genesis, THREE, _camera, _scene) {
  if (!Genesis) return false;
  const mgr = createVideoManager({ Genesis });
  Genesis.VideoManager = Object.assign(Genesis.VideoManager || {}, {
    register(v, p, meta) { return mgr.register(v, p, meta); },
    unregister(v) { return mgr.unregister(v); },
    setActive(v, active) { return mgr.setActive(v, active); },
    activeCount() { return mgr.activeCount(); },
    capCheck(max) { return mgr.capCheck(max); },
    tick() { return mgr.tick(); },
    summary() { return mgr.summary(); }
  });
  return true;
}
