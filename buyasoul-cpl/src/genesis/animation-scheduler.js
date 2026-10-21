// Genesis Engine — Animation Scheduler (Phase B7 / Genesis Phase 0)
// Single owner for every registered AnimationMixer. Vertical state, visibility,
// distance, optional pausing, and same-frame duplicate ticks are enforced here.
import * as THREE from 'three';

export function createAnimationScheduler(ctx) {
  const { Genesis, camera } = ctx;
  const mixers = new Map();
  const position = new THREE.Vector3();
  let optionalPaused = false;
  let activeThisTick = 0;
  let sleepingThisTick = 0;
  let optionalPausedThisTick = 0;
  let updates = 0;
  let tickCount = 0;
  let doubleTickSkips = 0;
  let lastTickToken = null;

  function stratumId(root) {
    let node = root;
    while (node) {
      if (node.userData && node.userData.verticalStratumId) return node.userData.verticalStratumId;
      node = node.parent;
    }
    return 'legacy';
  }

  function registerMixer(mixer, meta = {}) {
    if (!mixer) return mixer;
    const previous = mixers.get(mixer) || {};
    mixers.set(mixer, Object.assign(previous, {
      root: meta.root || previous.root || (mixer.getRoot ? mixer.getRoot() : null),
      maxDistance: meta.maxDistance || previous.maxDistance || 180,
      owner: meta.owner || previous.owner || 'unknown',
      critical: meta.critical != null ? !!meta.critical : !!previous.critical,
      optional: meta.optional != null ? !!meta.optional : !!previous.optional,
      tickState: previous.tickState || 'registered'
    }));
    return mixer;
  }

  function deregisterMixer(mixer) { return mixers.delete(mixer); }

  function isActive(root, meta) {
    if (!root) return true;
    if (Genesis.isSimulationActive && !Genesis.isSimulationActive(root)) return false;
    if (Genesis.lifecycle && typeof Genesis.lifecycle.isSectorActive === 'function') {
      if (!Genesis.lifecycle.isSectorActive(root, { root, maxDistance: meta.maxDistance, sleepWhenFar: true, allowWhenHidden: !!meta.critical })) return false;
    } else if (camera && root.parent) {
      root.updateWorldMatrix(true, false);
      position.setFromMatrixPosition(root.matrixWorld);
      if (camera.position.distanceToSquared(position) > meta.maxDistance * meta.maxDistance) return false;
    }
    return true;
  }

  function tick(dt, frameToken) {
    if (frameToken != null && frameToken === lastTickToken) {
      doubleTickSkips++;
      return false;
    }
    if (frameToken != null) lastTickToken = frameToken;
    tickCount++;
    activeThisTick = 0;
    sleepingThisTick = 0;
    optionalPausedThisTick = 0;
    for (const [mixer, meta] of mixers) {
      if (meta.optional && optionalPaused) {
        meta.tickState = 'optional-paused';
        optionalPausedThisTick++;
        continue;
      }
      if (!isActive(meta.root, meta)) {
        meta.tickState = 'sleeping';
        sleepingThisTick++;
        continue;
      }
      try {
        mixer.update(dt);
        meta.tickState = 'active';
        activeThisTick++;
        updates++;
      } catch (_) {
        meta.tickState = 'error';
        sleepingThisTick++;
      }
    }
    return true;
  }

  function setOptionalPaused(value) { optionalPaused = !!value; }
  function sweepAndRegister() { return mixers.size; }

  function summary() {
    const byOwner = {};
    const byStratum = {};
    for (const meta of mixers.values()) {
      const owner = meta.owner || 'unknown';
      const stratum = stratumId(meta.root);
      const ownerCounts = byOwner[owner] || (byOwner[owner] = { registered: 0, active: 0, sleeping: 0, optionalPaused: 0 });
      const stratumCounts = byStratum[stratum] || (byStratum[stratum] = { registered: 0, active: 0, sleeping: 0, optionalPaused: 0 });
      ownerCounts.registered++;
      stratumCounts.registered++;
      if (meta.tickState === 'active') {
        ownerCounts.active++;
        stratumCounts.active++;
      } else if (meta.tickState === 'optional-paused') {
        ownerCounts.optionalPaused++;
        stratumCounts.optionalPaused++;
      } else {
        ownerCounts.sleeping++;
        stratumCounts.sleeping++;
      }
    }
    return {
      registered: mixers.size,
      activeThisTick,
      sleepingThisTick,
      optionalPausedThisTick,
      pausedThisTick: sleepingThisTick + optionalPausedThisTick,
      optionalPaused,
      tickCount,
      doubleTickSkips,
      updates,
      byOwner,
      byStratum
    };
  }

  return { registerMixer, deregisterMixer, tick, setOptionalPaused, sweepAndRegister, summary };
}

export function install(Genesis, _THREE, camera, _scene) {
  if (!Genesis) return false;
  const manager = createAnimationScheduler({ Genesis, camera });
  Genesis.AnimationScheduler = Object.assign(Genesis.AnimationScheduler || {}, {
    registerMixer(mixer, meta) { return manager.registerMixer(mixer, meta); },
    deregisterMixer(mixer) { return manager.deregisterMixer(mixer); },
    tick(dt, frameToken) { return manager.tick(dt, frameToken); },
    setOptionalPaused(value) { return manager.setOptionalPaused(value); },
    sweepAndRegister() { return manager.sweepAndRegister(); },
    summary() { return manager.summary(); }
  });
  return true;
}
