// GENESIS ENGINE — Scale Engine (Phase E — bounded population + instanced traffic)
// Flag-gated dynamic-import mirror of the inline Genesis.ScaleEngine manager.
// When window.__GENESIS_SCALE_ENGINE !== true the inline install is a no-op stub
// and this module is never loaded. The inline manager in index.html is authoritative.
//
// Purpose: prove that scaling population + traffic does NOT cause linear
// mixer/brain/render cost. All extra population lives in bounded LOD bands:
//   HERO_BAND = 1  (already owned by PopulationEngine)
//   NEAR_BAND  = up to 8 rigged NPCs (real mixers, cheaper brain tick)
//   MID_BAND   = up to 16 capsule walkers (sine bob + coarse nav, NO mixer)
//   FAR_BAND   = up to 24 impostor planes (frozen, updated only when in-range)
// Only HERO + NEAR use AnimationMixers (<= 9 total). MID/FAR add ZERO mixers.
// Traffic: a single InstancedMesh renders the existing 28 groundCars as 1 draw call.
//
// Loaded via:
//   import('./src/genesis/scale-engine.js').then(m => m.install(window.Genesis, THREE, camera, scene, cityGroup))

import * as THREE from 'three';

// Per-tier band caps. 'low' is lighter; 'high' is full.
const TIER_CAPS = {
  low:  { near: 2,  mid: 4,  far: 6 },
  medium: { near: 5,  mid: 10, far: 14 },
  high: { near: 8,  mid: 16, far: 24 }
};

export function install(Genesis, THREE, camera, scene, cityGroup) {
  if (!Genesis) return null;

  // ---- shared state ----
  const state = {
    enabled: false,
    tier: 'high',
    caps: { near: 8, mid: 16, far: 24 },
    near: [],   // { root, mixer, brain, pos, vel, path, wpIdx, lastBrainTick, home }
    mid: [],    // { root, pos, t, phase, target, lastStep, home }
    far: [],    // { root, pos, frozen }
    trafficMesh: null,
    trafficCount: 0,
    hideOriginals: false,
    mixersRegistered: 0,
    frame: 0,
    surfaceActive: true
  };

  // Reusable temporaries.
  const _v = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const _m = new THREE.Matrix4();
  const _up = new THREE.Vector3(0, 1, 0);
  const _fwd = new THREE.Vector3();

  // ---- helpers reaching script-scoped globals (best-effort) ----
  const G = (typeof window !== 'undefined') ? window : {};
  function cloneAvatarModel(kind) {
    try {
      if (typeof G.cloneAvatarModel === 'function') return G.cloneAvatarModel(kind);
      if (typeof cloneAvatarModel !== 'undefined') return cloneAvatarModel(kind);
    } catch (_) {}
    return null;
  }
  function requestAvatarAsset(kind, priority) {
    try {
      if (typeof G.requestAvatarAsset === 'function') return G.requestAvatarAsset(kind, priority);
      if (typeof requestAvatarAsset !== 'undefined') return requestAvatarAsset(kind, priority);
    } catch (_) {}
  }
  function getWalkerKinds() {
    if (G.NPC_WALKER_KINDS && Array.isArray(G.NPC_WALKER_KINDS) && G.NPC_WALKER_KINDS.length) return G.NPC_WALKER_KINDS;
    try { if (typeof NPC_WALKER_KINDS !== 'undefined' && Array.isArray(NPC_WALKER_KINDS)) return NPC_WALKER_KINDS; } catch (_) {}
    return null;
  }
  function getTier() {
    try {
      if (typeof perf !== 'undefined' && perf && perf.tier) return perf.tier;
    } catch (_) {}
    if (Genesis.PerformanceGovernor && typeof Genesis.PerformanceGovernor.summary === 'function') {
      const s = Genesis.PerformanceGovernor.summary();
      if (s && s.tier) return s.tier;
    }
    return state.tier || 'high';
  }

  function randomPointInPlaza(half) {
    half = half || 50;
    return new THREE.Vector3((Math.random() * 2 - 1) * half, 0, (Math.random() * 2 - 1) * half);
  }

  // ---- population spawning ----
  function spawnNearActor(i, kinds) {
    const root = new THREE.Group();
    root.name = 'ScaleEngine NEAR ' + (i + 1);
    root.userData.cost = { cpu: 1, gpu: 2, memory: 1, updateFreq: 0.2, priority: 6, sector: 'city-core', sleep: 'distance' };
    root.userData.verticalStratumId = 'surface';
    root.userData.scaleNear = true;

    const kind = (kinds && kinds.length) ? kinds[i % kinds.length] : null;
    const actor = {
      root, mixer: null, brain: 'Wander', pos: randomPointInPlaza(45),
      vel: new THREE.Vector3(), path: [], wpIdx: 0, lastBrainTick: 0,
      home: new THREE.Vector3(0, 0, 10), facing: Math.random() * Math.PI * 2, desiredFacing: 0
    };
    root.position.copy(actor.pos);

    const placeBody = (body) => {
      if (!body) {
        const cap = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.3, 1.0, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0x66ffcc, emissive: 0x114433, emissiveIntensity: 0.4 })
        );
        cap.position.y = 0.85; cap.castShadow = true; cap.receiveShadow = true;
        root.add(cap);
      } else {
        root.add(body);
      }
      actor.mixer = new THREE.AnimationMixer(body || root);
      const anims = (body && body.userData && body.userData.animations) ? body.userData.animations : null;
      if (anims && anims.length) {
        const idle = anims.find((c) => /idle|stand|breath/i.test(c.name));
        const walk = anims.find((c) => /walk|stroll|move/i.test(c.name));
        if (idle) { const a = actor.mixer.clipAction(idle); a.enabled = true; a.setEffectiveWeight(1); a.play(); actor._idle = a; }
        if (walk) { const a = actor.mixer.clipAction(walk); a.enabled = true; a.setEffectiveWeight(0); a.play(); actor._walk = a; }
      }
      if (Genesis.AnimationScheduler && typeof Genesis.AnimationScheduler.registerMixer === 'function') {
        Genesis.AnimationScheduler.registerMixer(actor.mixer, { owner: 'scale-near', stratum: 'surface' });
        state.mixersRegistered++;
      }
      cityGroup.add(root);
      actor.spawned = true;
    };

    if (kind && typeof requestAvatarAsset === 'function') requestAvatarAsset(kind, false);
    if (typeof G.onAvatarReady === 'function') {
      G.onAvatarReady(kind, (src) => {
        const body = cloneAvatarModel(kind);
        if (body && src && src.userData) body.userData.animations = src.userData.animations || null;
        placeBody(body);
      }, false);
    } else {
      placeBody(null);
    }
    return actor;
  }

  function spawnMidActor(i) {
    const root = new THREE.Group();
    root.name = 'ScaleEngine MID ' + (i + 1);
    const cap = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.9, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x8899aa, emissive: 0x222a33, emissiveIntensity: 0.25 })
    );
    cap.position.y = 0.8; cap.castShadow = true;
    root.add(cap);
    root.position.copy(randomPointInPlaza(48));
    root.userData.cost = { cpu: 0.3, gpu: 1, memory: 0.5, updateFreq: 0.5, priority: 4, sector: 'city-core', sleep: 'distance' };
    root.userData.verticalStratumId = 'surface';
    root.userData.scaleMid = true;
    cityGroup.add(root);
    // MID band NEVER registers a mixer -> zero mixer cost.
    if (Genesis.ResourceManager && typeof Genesis.ResourceManager.track === 'function') {
      Genesis.ResourceManager.track(cap.geometry, 'scale-mid', cap);
    }
    return {
      root, pos: root.position.clone(), t: Math.random() * 10, phase: Math.random() * Math.PI * 2,
      target: randomPointInPlaza(46), lastStep: 0, home: new THREE.Vector3(0, 0, 10), speed: 1.4 + Math.random() * 0.8
    };
  }

  function spawnFarActor(i) {
    const root = new THREE.Group();
    root.name = 'ScaleEngine FAR ' + (i + 1);
    // Single shared billboard plane (frozen pose). A basic plane with a neutral
    // material. No skeleton, no mixer, no per-frame motion.
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x556070, emissive: 0x1a2028, emissiveIntensity: 0.2, side: THREE.DoubleSide })
    );
    plane.position.y = 0.85;
    root.add(plane);
    root.position.copy(randomPointInPlaza(55));
    root.userData.cost = { cpu: 0.05, gpu: 0.5, memory: 0.2, updateFreq: 0, priority: 2, sector: 'city-core', sleep: 'distance' };
    root.userData.verticalStratumId = 'surface';
    root.userData.scaleFar = true;
    cityGroup.add(root);
    // FAR band NEVER registers a mixer -> zero mixer cost.
    if (Genesis.ResourceManager && typeof Genesis.ResourceManager.track === 'function') {
      Genesis.ResourceManager.track(plane.geometry, 'scale-far', plane);
    }
    return { root, pos: root.position.clone(), frozen: true };
  }

  function buildPopulation() {
    const kinds = getWalkerKinds();
    for (let i = 0; i < state.caps.near; i++) state.near.push(spawnNearActor(i, kinds));
    for (let i = 0; i < state.caps.mid; i++) state.mid.push(spawnMidActor(i));
    for (let i = 0; i < state.caps.far; i++) state.far.push(spawnFarActor(i));
    console.log('[ScaleEngine] population built: near=' + state.near.length + ' mid=' + state.mid.length + ' far=' + state.far.length);
  }

  // ---- traffic InstancedMesh (28 cars -> 1 draw call) ----
  function buildTrafficMesh() {
    const geo = new THREE.BoxGeometry(1.0, 0.6, 2.0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2b6cff, emissive: 0x0a1a40, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.4 });
    const count = (G.groundCars && Array.isArray(G.groundCars)) ? G.groundCars.length : 28;
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.name = 'ScaleEngine Instanced Traffic';
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.userData.scaleTraffic = true;
    // Start all hidden (will be updated each tick from groundCars).
    for (let i = 0; i < count; i++) { _m.makeScale(0, 0, 0); mesh.setMatrixAt(i, _m); }
    mesh.instanceMatrix.needsUpdate = true;
    if (cityGroup) cityGroup.add(mesh);
    state.trafficMesh = mesh;
    state.trafficCount = count;

    // Hide the original 28 per-mesh groups ONLY when flag ON (reversible: OFF leaves them).
    if (G.groundCars && Array.isArray(G.groundCars)) {
      for (const car of G.groundCars) { if (car && car.group) car.group.visible = false; }
      state.hideOriginals = true;
    }
    console.log('[ScaleEngine] instanced traffic mesh created (count=' + count + ')');
  }

  // ---- brain (NEAR band) — cheaper: only every 0.2s ----
  function tickNearBrain(actor, dt) {
    actor.lastBrainTick += dt;
    if (actor.lastBrainTick < 0.2) return;
    actor.lastBrainTick = 0;
    // Simple Wander state machine: pick a new random target when reached.
    if (actor.brain === 'Wander') {
      _v.subVectors(actor.target || actor.pos, actor.pos); _v.y = 0;
      if (_v.lengthSq() < 0.5 || !actor.path.length) {
        actor.target = randomPointInPlaza(45);
        actor.path = [actor.target.clone()];
        actor.wpIdx = 0;
      }
    }
    const wp = (actor.path && actor.path[actor.wpIdx]) ? actor.path[actor.wpIdx] : actor.target;
    if (wp) {
      _v.subVectors(wp, actor.pos); _v.y = 0;
      const d = _v.length();
      if (d < 0.6) { actor.wpIdx++; if (actor.wpIdx >= actor.path.length) actor.brain = 'Observe'; }
      else { _v.normalize(); actor.desiredFacing = Math.atan2(_v.x, _v.z); actor.vel.copy(_v).multiplyScalar(2.6); }
    }
    if (actor.brain === 'Observe') {
      actor.vel.set(0, 0, 0);
      if (Math.random() < 0.02) { actor.brain = 'Wander'; actor.target = randomPointInPlaza(45); actor.path = [actor.target.clone()]; actor.wpIdx = 0; }
    }
  }

  function tickNear(actor, dt) {
    tickNearBrain(actor, dt);
    // motion integrate (root driven, not clip root motion)
    actor.pos.addScaledVector(actor.vel, dt);
    actor.pos.y = 0;
    let diff = actor.desiredFacing - actor.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    actor.facing += diff * Math.min(1, dt * 6);
    actor.root.position.copy(actor.pos);
    actor.root.rotation.y = actor.facing;
    // blend mixer
    const sp = actor.vel.length();
    const wW = Math.min(1, sp / 1.5);
    if (actor._idle) actor._idle.setEffectiveWeight(1 - wW);
    if (actor._walk) actor._walk.setEffectiveWeight(wW);
  }

  function tickMid(actor, dt) {
    // Coarse update every 0.5s. In-between frames only a cheap sine bob (no nav cost).
    actor.lastStep += dt;
    if (actor.lastStep >= 0.5) {
      actor.lastStep = 0;
      _v.subVectors(actor.target, actor.pos); _v.y = 0;
      const d = _v.length();
      if (d < 0.8) { actor.target = randomPointInPlaza(46); }
      else {
        _v.normalize();
        actor.pos.x += _v.x * actor.speed * 0.5;
        actor.pos.z += _v.z * actor.speed * 0.5;
        actor.root.rotation.y = Math.atan2(_v.x, _v.z);
      }
    }
    // walk-bob: visually alive, zero navmesh/mixer cost.
    actor.phase += dt * 6;
    actor.root.position.set(actor.pos.x, Math.abs(Math.sin(actor.phase)) * 0.08, actor.pos.z);
  }

  function tickFar(actor, dt, inRange) {
    // Frozen. Only repositioned when SectorManager says in-range (rare).
    if (!inRange) return;
    // If in range, allow a very slow drift (cheap, no mixer).
    actor.root.rotation.y += dt * 0.05;
  }

  function syncTraffic() {
    if (!state.trafficMesh) return;
    const cars = (G.groundCars && Array.isArray(G.groundCars)) ? G.groundCars : null;
    if (!cars) return;
    const n = Math.min(state.trafficCount, cars.length);
    for (let i = 0; i < n; i++) {
      const g = cars[i] && cars[i].group;
      if (!g) { _m.makeScale(0, 0, 0); state.trafficMesh.setMatrixAt(i, _m); continue; }
      g.updateMatrixWorld();
      state.trafficMesh.setMatrixAt(i, g.matrixWorld);
    }
    state.trafficMesh.instanceMatrix.needsUpdate = true;
  }

  // ---- lifecycle ----
  function enable() {
    if (state.enabled) return;
    state.enabled = true;
    state.tier = getTier();
    state.caps = TIER_CAPS[state.tier] || TIER_CAPS.high;
    // Extend PopulationEngine LOD if the method exists (Phase B hook).
    if (Genesis.PopulationEngine && typeof Genesis.PopulationEngine.setPopulationLOD === 'function') {
      try { Genesis.PopulationEngine.setPopulationLOD('on'); } catch (_) {}
    }
    buildPopulation();
    buildTrafficMesh();
    console.log('[ScaleEngine] ENABLED (tier=' + state.tier + ')');
  }

  function disable() {
    if (!state.enabled) return;
    state.enabled = false;
    // Restore original ground cars visible.
    if (state.hideOriginals && G.groundCars && Array.isArray(G.groundCars)) {
      for (const car of G.groundCars) { if (car && car.group) car.group.visible = true; }
    }
    // Remove instanced mesh.
    if (state.trafficMesh && state.trafficMesh.parent) state.trafficMesh.parent.remove(state.trafficMesh);
    if (state.trafficMesh && state.trafficMesh.geometry) state.trafficMesh.geometry.dispose();
    if (state.trafficMesh && state.trafficMesh.material) state.trafficMesh.material.dispose();
    state.trafficMesh = null;
    // Remove all bands.
    const all = [...state.near.map((a) => a.root), ...state.mid.map((a) => a.root), ...state.far.map((a) => a.root)];
    for (const r of all) { if (r && r.parent) r.parent.remove(r); }
    state.near = []; state.mid = []; state.far = [];
    state.mixersRegistered = 0;
    state.trafficCount = 0;
    state.hideOriginals = false;
    console.log('[ScaleEngine] DISABLED (world restored)');
  }

  function tick(dt) {
    if (!state.enabled) return;
    dt = Math.min(0.05, dt || 0);
    state.frame++;
    // Sleep gate: when Surface is asleep (Heaven), skip ALL simulation -> zero CPU.
    const surfaceActive = Genesis.isSimulationActive ? Genesis.isSimulationActive(cityGroup) : true;
    state.surfaceActive = surfaceActive;
    if (!surfaceActive) return;

    // NEAR band: cheap mixer-driven locomotion.
    for (const a of state.near) {
      if (!a.spawned || !a.root) continue;
      if (Genesis.isSimulationActive && !Genesis.isSimulationActive(a.root)) continue;
      tickNear(a, dt);
    }
    // MID band: coarse nav + sine bob, NO mixer.
    for (const a of state.mid) {
      if (!a.root) continue;
      if (Genesis.isSimulationActive && !Genesis.isSimulationActive(a.root)) continue;
      tickMid(a, dt);
    }
    // FAR band: frozen; update only if SectorManager says in-range.
    const smInRange = (Genesis.SectorManager && typeof Genesis.SectorManager.isAwake === 'function')
      ? Genesis.SectorManager.isAwake('city-core') : true;
    for (const a of state.far) {
      if (!a.root) continue;
      // Far actors sleep by distance (Visibility priority handles render). We only
      // drift them when the sector is awake AND within a near distance heuristic.
      const camPos = (camera && camera.position) ? camera.position : null;
      let inRange = smInRange;
      if (camPos) {
        const dx = a.pos.x - camPos.x, dz = a.pos.z - camPos.z;
        inRange = smInRange && (dx * dx + dz * dz) < (60 * 60);
      }
      tickFar(a, dt, inRange);
    }
    // Traffic: sync instanced mesh from the (still-running) legacy groundCars loop.
    syncTraffic();
  }

  function summary() {
    return {
      enabled: state.enabled,
      tier: state.tier,
      bands: {
        hero: (Genesis.PopulationEngine && Genesis.PopulationEngine.summary) ? (Genesis.PopulationEngine.summary().heroSpawned ? 1 : 0) : 0,
        near: state.near.length,
        mid: state.mid.length,
        far: state.far.length
      },
      mixersRegistered: state.mixersRegistered,
      instancedTrafficCount: state.trafficCount,
      drawCallEstimate: state.enabled ? 1 + state.near.length + Math.ceil(state.mid.length / 0) : 0,
      tier: state.tier,
      surfaceActive: state.surfaceActive
    };
  }

  function sample() {
    const near = state.near.map((a) => [+a.pos.x.toFixed(2), +a.pos.y.toFixed(2), +a.pos.z.toFixed(2)]);
    const mid = state.mid.map((a) => [+a.pos.x.toFixed(2), +a.pos.y.toFixed(2), +a.pos.z.toFixed(2)]);
    const far = state.far.map((a) => [+a.pos.x.toFixed(2), +a.pos.y.toFixed(2), +a.pos.z.toFixed(2)]);
    return { enabled: state.enabled, near, mid, far, frame: state.frame };
  }

  const api = {
    enable, disable, tick, summary, sample,
    _state: state, // debug only
    BAND_CAPS: TIER_CAPS
  };
  Genesis.ScaleEngine = Object.assign(Genesis.ScaleEngine || {}, api);
  return api;
}

export default { install };
