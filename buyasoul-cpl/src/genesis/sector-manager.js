// GENESIS ENGINE — Sector Manager (manager #4)
// Partitions the world into named sectors; governs enter→active→sleep→dispose.
// Reads userData.cost.sleep + userData.cost.priority from the Cost Contract (Phase A).
// Loaded via flag-gated dynamic import(): import('./src/genesis/sector-manager.js').then(m=>m.install(window.Genesis, THREE, camera))

import * as THREE from 'three';

const SLEEP_PURGE_MS = 20000; // asleep longer than this => eligible for disposal

export function createSectorManager(THREE, camera, ResourceManager, Genesis = null) {
  const sectors = new Map(); // id -> { root, maxDistance, autoSleep, state, lastAwakeAt, asleepFor }
  const position = new THREE.Vector3();

  function _simulationActive(root) {
    const checker = Genesis && (Genesis.isSimulationActive || (Genesis.VerticalStackManager && Genesis.VerticalStackManager.isSimulationActive));
    return typeof checker !== 'function' || checker(root);
  }

  function _isInRange(root, maxDistance) {
    if (!root) return true;
    if (!root.parent) return false;
    if (!camera) return true;
    root.updateWorldMatrix(true, false);
    position.setFromMatrixPosition(root.matrixWorld);
    const d = camera.position.distanceToSquared(position);
    return d <= maxDistance * maxDistance;
  }

  function register(id, root, opts = {}) {
    sectors.set(id, {
      root, maxDistance: opts.maxDistance || 220, autoSleep: opts.autoSleep !== false,
      state: 'active', lastAwakeAt: performance.now(), asleepFor: 0,
      sleepReason: null, verticalSnapshot: null, disposed: false
    });
  }

  function _sleepCost(root) {
    let mode = 'distance';
    root.traverse((o) => { if (o.userData && o.userData.cost && o.userData.cost.sleep) mode = o.userData.cost.sleep; });
    return mode;
  }

  function sleep(id, reason = 'distance') {
    const s = sectors.get(id); if (!s) return;
    s.root.visible = false;
    s.state = 'asleep';
    s.sleepReason = reason;
    s.lastAsleepAt = performance.now();
    return true;
  }

  function wake(id) {
    const s = sectors.get(id); if (!s) return;
    if (!_simulationActive(s.root)) {
      s.state = 'asleep';
      s.sleepReason = 'vertical';
      return false;
    }
    s.root.visible = true;
    s.state = 'active';
    s.sleepReason = null;
    s.lastAwakeAt = performance.now();
    s.asleepFor = 0;
    s.disposed = false;
    return true;
  }

  function tick() {
    const now = performance.now();
    for (const [id, s] of sectors) {
      if (!_simulationActive(s.root)) {
        if (!s.verticalSnapshot) s.verticalSnapshot = { state: s.state, sleepReason: s.sleepReason };
        s.state = 'asleep';
        s.sleepReason = 'vertical';
        continue;
      }
      if (s.verticalSnapshot) {
        const snapshot = s.verticalSnapshot;
        s.verticalSnapshot = null;
        s.state = snapshot.state;
        s.sleepReason = snapshot.sleepReason;
      }
      if (!s.autoSleep) continue;
      const active = _isInRange(s.root, s.maxDistance);
      const costMode = _sleepCost(s.root);
      if (active) {
        if (s.state !== 'active') wake(id);
        if (ResourceManager && s.disposed) { s.disposed = false; } // would re-track on rebuild
      } else {
        if (s.state === 'active') sleep(id, 'distance');
        // eligibility for disposal: asleep + far + not 'never'
        if (costMode !== 'never' && ResourceManager) {
          s.asleepFor = now - (s.lastAsleepAt || now);
          if (s.asleepFor > SLEEP_PURGE_MS && !s.disposed) {
            ResourceManager.dispose(id);
            s.disposed = true;
          }
        }
      }
    }
  }

  function isAwake(id) { const s = sectors.get(id); return !!s && s.state === 'active'; }

  function summary() {
    const out = {};
    for (const [id, s] of sectors) {
      const simulationActive = _simulationActive(s.root);
      out[id] = {
        state: s.state,
        maxDistance: s.maxDistance,
        autoSleep: s.autoSleep,
        inRange: simulationActive ? _isInRange(s.root, s.maxDistance) : false,
        simulationActive,
        visible: !!(s.root && s.root.visible),
        asleepFor: Math.round(s.asleepFor || 0),
        disposed: !!s.disposed,
        sleepReason: s.sleepReason
      };
    }
    return out;
  }

  return { register, sleep, wake, tick, isAwake, summary, _sectors: sectors };
}

export function install(Genesis, THREE, camera, ResourceManager) {
  if (!Genesis) return null;
  const mgr = createSectorManager(THREE, camera, ResourceManager, Genesis);
  Genesis.SectorManager = mgr;
  return mgr;
}
