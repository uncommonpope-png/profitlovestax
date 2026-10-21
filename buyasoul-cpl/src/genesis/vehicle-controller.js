// GENESIS ENGINE — Vehicle Controller (Phase C — subsystem #4)
// ONE hero car driven by Rapier rigid-body physics. Flag-gated dynamic-import
// mirror of the inline Genesis.VehicleController manager.
//
// When window.__GENESIS_VEHICLE_CONTROLLER === false (the DEFAULT) the inline
// install is a no-op and this module is never loaded. The inline manager in
// index.html is authoritative.
//
// The car is a Rapier DYNAMIC rigid body. Steering / throttle / braking are
// expressed as impulses applied to the body; the floor + colliders already live
// in the shared _rapWorld. This module NEVER steps the world (that is
// updateRapier()'s job in index.html); it only reads state, applies impulses,
// and syncs the mesh from the body after the step.
//
// Loaded via:
//   import('./src/genesis/vehicle-controller.js').then(m => m.install(window.Genesis, THREE, camera, scene, cityGroup))

import * as THREE from 'three';

// Shared Rapier handle + world injected by the inline manager (they live in the
// main script scope and are not importable as ES-module globals). Mirrors how
// PopulationEngine reaches window-scoped helpers.
const G = (typeof window !== 'undefined') ? window : {};

// A simple AUTO waypoint loop radius (plaza loop) — 4 waypoints on a circle.
const LOOP_RADIUS = 25;

export function install(Genesis, THREE, camera, scene, cityGroup) {
  if (!Genesis) return null;

  // ---- shared mutable hero-car state (single instance) ----
  const Car = {
    root: null,                 // THREE.Group ('Genesis Hero Car 1') added to cityGroup
    mesh: null,                 // the GLB model inside root (we drive root from body)
    body: null,                 // RAPIER RigidBody (dynamic)
    collider: null,             // RAPIER Collider
    wheelNodes: [],             // child meshes whose name looks like a wheel
    half: new THREE.Vector3(2, 0.5, 1), // collider half-extents (x,y,z)
    spawnX: 0, spawnZ: 25,      // spawn near the plaza edge
    spawned: false,
    enabled: true,
    mode: 'AUTO',               // 'AUTO' | 'MANUAL'
    waypoints: [],
    wpIdx: 0,
    speed: 0,
    collisions: 0,
    cameraAttached: false,
    lastPos: new THREE.Vector3(),
    roll: 0
  };

  // Reusable temporaries (avoid per-frame allocation).
  const _fwd = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _toWp = new THREE.Vector3();
  const _lin = { x: 0, y: 0, z: 0 };
  const _q = new THREE.Quaternion();
  const _targetQ = new THREE.Quaternion();
  const _euler = new THREE.Euler();
  const _up = new THREE.Vector3(0, 1, 0);

  function buildWaypoints() {
    Car.waypoints = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      Car.waypoints.push(new THREE.Vector3(Math.cos(a) * LOOP_RADIUS, 0, Math.sin(a) * LOOP_RADIUS));
    }
    Car.wpIdx = 0;
  }

  // Normalize + center the GLB, wrap in a named group, build the Rapier body.
  function placeCar(model) {
    if (!model) { console.warn('[VehicleController] no model; skip spawn'); return null; }
    if (!G.RAPIER || !G._rapWorld || !G._rapReady) {
      console.warn('[VehicleController] Rapier not ready; skip spawn');
      return null;
    }

    const { box, size, center } = (typeof G.measureAsset === 'function')
      ? G.measureAsset(model)
      : { box: null, size: new THREE.Vector3(4, 1, 2), center: new THREE.Vector3() };

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 4 / maxDim; // aim for maxDim ~ 4 world units
    model.position.set(-center.x, -box.min.y, -center.z); // sit on y=0, center on origin (XZ)

    const root = new THREE.Group();
    root.name = 'Genesis Hero Car 1';
    root.add(model);
    root.scale.setScalar(s);
    root.position.set(Car.spawnX, 1.2, Car.spawnZ); // body spawns at y=1.2
    root.userData.cost = { cpu: 1, gpu: 2, memory: 1, updateFreq: 1, priority: 7, sector: 'city-core', sleep: 'distance' };
    root.userData.heroCar = true;
    root.userData.verticalStratumId = 'surface';

    // Find wheel nodes for spin (best-effort; skip if none/unknown).
    Car.wheelNodes = [];
    model.traverse((c) => {
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
      const n = (c.name || '').toLowerCase();
      if (/wheel|tire|tyre|rim/i.test(n)) Car.wheelNodes.push(c);
    });

    // Rapier dynamic body + cuboid collider sized to the (unscaled) car bbox.
    const hx = Math.max(0.5, size.x * 0.5);
    const hy = Math.max(0.3, size.y * 0.5);
    const hz = Math.max(0.5, size.z * 0.5);
    Car.half.set(hx, hy, hz);

    const bd = G.RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(Car.spawnX, 1.2, Car.spawnZ)
      .setCanSleep(false);
    const body = G._rapWorld.createRigidBody(bd);

    const cd = G.RAPIER.ColliderDesc.cuboid(hx, hy, hz)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setDensity(1.0);
    const collider = G._rapWorld.createCollider(cd, body);

    // Track + attach.
    if (Genesis.ResourceManager && typeof Genesis.ResourceManager.track === 'function') {
      Genesis.ResourceManager.track(model, 'hero-car', model);
    }
    if (cityGroup) cityGroup.add(root);

    Car.root = root;
    Car.mesh = model;
    Car.body = body;
    Car.collider = collider;
    Car.lastPos.copy(root.position);
    Car.spawned = true;
    Car.speed = 0;
    Car.roll = 0;
    Car.collisions = 0;
    buildWaypoints();
    console.log('[VehicleController] hero car spawned (wheels=' + Car.wheelNodes.length + ', half=' + hx.toFixed(2) + ',' + hy.toFixed(2) + ',' + hz.toFixed(2) + ')');
    return root;
  }

  // Spawn: defers to Rapier-ready + __cplReady (mirrors primeNpcBodies / world-assets).
  function spawnHeroCar() {
    if (Car.spawned) return Car.root;
    if (!cityGroup) { console.warn('[VehicleController] cityGroup not ready; spawn deferred'); return null; }
    if (!G.RAPIER || !G._rapWorld || !G._rapReady) {
      // Re-arm: try again on next Rapier-ready / cpl:ready.
      if (typeof window !== 'undefined' && !window.__genesisHeroCarRapierWait) {
        window.__genesisHeroCarRapierWait = true;
        const tryAgain = () => { window.__genesisHeroCarRapierWait = false; spawnHeroCar(); };
        if (window.__cplReady) setTimeout(tryAgain, 200);
        else window.addEventListener('cpl:ready', tryAgain, { once: true, passive: true });
      }
      return null;
    }

    Car.mode = (typeof window !== 'undefined' && window.__heroCarManual) ? 'MANUAL' : 'AUTO';

    const loader = (typeof G.makeGLTF === 'function')
      ? G.makeGLTF({ tier: 'world', owner: 'hero-car' })
      : null;
    if (!loader) { console.warn('[VehicleController] makeGLTF unavailable; skip'); return null; }

    loader.load(
      'assets/recent/cars/bmw_e39_free.glb',
      (gltf) => { try { placeCar(gltf && gltf.scene); } catch (e) { console.warn('[VehicleController] placeCar threw:', e && e.message); } },
      undefined,
      (err) => { console.warn('[VehicleController] hero GLB load failed; skip spawn:', err); }
    );
    return null;
  }

  // Apply engine/steer forces. Called inside tick() AFTER updateRapier() has
  // stepped the world for THIS frame — we read+modify the body for NEXT step.
  function applyControls(dt) {
    if (!Car.body) return;
    const body = Car.body;
    const t = body.translation();
    const q = body.rotation();
    _q.set(q.x, q.y, q.z, q.w);

    // Forward = local +Z rotated by body quaternion; Right = local +X.
    _fwd.set(0, 0, 1).applyQuaternion(_q);
    _fwd.y = 0; if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, 1);
    _fwd.normalize();
    _right.set(1, 0, 0).applyQuaternion(_q);
    _right.y = 0; _right.normalize();

    const lin = body.linvel();
    const fwdSpeed = lin.x * _fwd.x + lin.z * _fwd.z; // signed speed along forward
    Car.speed = Math.sqrt(lin.x * lin.x + lin.z * lin.z);

    // ---- desired heading ----
    let desiredYaw = null;
    if (Car.mode === 'MANUAL') {
      // Manual: external controller sets window.__heroCarInput = {throttle,steer}
      const inp = (typeof window !== 'undefined' && window.__heroCarInput) || { throttle: 0, steer: 0 };
      driveThrottle(inp.throttle || 0, body, _fwd, dt);
      steerManual(inp.steer || 0, body, _fwd, _right, dt);
      return;
    }

    // AUTO: steer toward next waypoint on the loop.
    if (Car.waypoints.length) {
      const wp = Car.waypoints[Car.wpIdx];
      _toWp.set(wp.x - t.x, 0, wp.z - t.z);
      const dist = _toWp.length();
      if (dist < 3.0) { Car.wpIdx = (Car.wpIdx + 1) % Car.waypoints.length; }
      _toWp.normalize();
      desiredYaw = Math.atan2(_toWp.x, _toWp.z); // forward is +Z
    }

    // Auto throttle: cruise, ease near the waypoint to avoid overshoot.
    const cruise = 9.0;
    driveThrottle(0.9, body, _fwd, dt); // steady throttle; lateral grip + steering shape the path

    if (desiredYaw !== null) {
      // Current yaw from forward vector.
      const curYaw = Math.atan2(_fwd.x, _fwd.z);
      let diff = desiredYaw - curYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      // Speed-scaled steering: no authority at zero speed, capped at cruise.
      const speedFactor = Math.min(1, Car.speed / 4.0);
      const steerImpulse = diff * 2.4 * speedFactor * dt; // torque-ish about Y
      // angular impulse via applyTorqueImpulse
      try {
        if (typeof body.applyTorqueImpulse === 'function') {
          body.applyTorqueImpulse({ x: 0, y: steerImpulse * 8, z: 0 }, true);
        } else {
          // Fallback: nudge linear velocity toward desired heading.
          const blend = Math.min(1, dt * 2.0);
          const target = _toWp.clone().multiplyScalar(Car.speed);
          const nv = { x: lin.x + (target.x - lin.x) * blend, y: lin.y, z: lin.z + (target.z - lin.z) * blend };
          body.setLinvel(nv, true);
        }
      } catch (_) { /* best-effort */ }
    }
  }

  function driveThrottle(throttle, body, fwd, dt) {
    // throttle in [-1,1]; positive = forward, negative = brake/reverse.
    const MAX_F = 6.0;
    const f = throttle * MAX_F;
    const imp = { x: fwd.x * f * dt, y: 0, z: fwd.z * f * dt };
    try { body.applyImpulse(imp, true); } catch (_) {}

    // Lateral tire friction: damp sideways velocity (grip).
    const lin = body.linvel();
    const sideComp = lin.x * -_right.x + lin.z * -_right.z; // along -right (sideways)
    const sideVel = { x: _right.x * sideComp, z: _right.z * sideComp };
    const grip = 0.85; // how much lateral velocity to cancel per tick
    const cancel = {
      x: -sideVel.x * grip,
      y: 0,
      z: -sideVel.z * grip
    };
    try { body.applyImpulse(cancel, true); } catch (_) {}
  }

  function steerManual(steer, body, fwd, right, dt) {
    const speedFactor = Math.min(1, Car.speed / 4.0);
    const steerImpulse = steer * 2.4 * speedFactor * dt;
    try {
      if (typeof body.applyTorqueImpulse === 'function') body.applyTorqueImpulse({ x: 0, y: steerImpulse * 8, z: 0 }, true);
    } catch (_) {}
  }

  function tick(dt) {
    if (!Car.spawned || !Car.root || !Car.body) return;
    // Sleep by stratum/sector: skip ALL simulation when Surface asleep (Heaven).
    if (Genesis.isSimulationActive && typeof Genesis.isSimulationActive === 'function' && !Genesis.isSimulationActive(Car.root)) {
      // still allow mesh sync so it rests at last physics pose
      return;
    }
    dt = Math.min(0.05, dt || 0);

    // Apply controls (impulses) for the NEXT physics step.
    applyControls(dt);

    // Sync mesh from body (the step already happened this frame in updateRapier).
    const t = Car.body.translation();
    const q = Car.body.rotation();
    Car.root.position.set(t.x, t.y, t.z);

    // Clamp y: never sink below floor contact, never hover above rest.
    // The cuboid half-height hy means resting center y ≈ hy + floorTop(0).
    const restY = Car.half.y; // floor top at 0; collider half-height keeps center at ~hy
    if (Car.root.position.y < restY - 0.05) Car.root.position.y = restY - 0.05; // hard floor clamp
    if (Car.root.position.y > restY + 1.5) Car.root.position.y = restY + 1.5;   // anti-hover clamp

    // Visual body-roll: lean into lateral accel.
    const lin = Car.body.linvel();
    const lateral = lin.x * -_right.x + lin.z * -_right.z;
    const targetRoll = THREE.MathUtils.clamp(-lateral * 0.04, -0.25, 0.25);
    Car.roll += (targetRoll - Car.roll) * Math.min(1, dt * 6);

    _q.set(q.x, q.y, q.z, q.w);
    // Add roll about the forward axis.
    _euler.set(0, 0, 0, 'XYZ');
    _q.normalize();
    // Compose: roll quaternion (about local Z = forward) * physics quaternion.
    const rollQ = new THREE.Quaternion().setFromAxisAngle(_fwd.clone().normalize(), Car.roll);
    _targetQ.copy(rollQ).multiply(_q);
    Car.root.quaternion.slerp(_targetQ, Math.min(1, dt * 8));

    // Wheel spin by speed.
    if (Car.wheelNodes.length && Car.speed > 0.01) {
      const spin = (Car.speed * dt) / Math.max(0.3, Car.half.z);
      for (const w of Car.wheelNodes) w.rotation.x += spin;
    }

    // Impact detection: a sudden large change in linear velocity between frames
    // (collision with floor/wall/another body) increments the collision counter.
    // We compare against last frame's velocity (Car.prevLin) — set after read.
    if (Car.prevLin) {
      const dv = Math.hypot(lin.x - Car.prevLin.x, lin.z - Car.prevLin.z);
      if (dv > 4.0 && (Car.speed > 1.0)) Car.collisions++;
    }
    Car.prevLin = { x: lin.x, y: lin.y, z: lin.z };

    Car.lastPos.set(t.x, t.y, t.z);
    Car.cameraAttached = !!(typeof window !== 'undefined' && (window.__heroChaseCam || (Car.mode === 'MANUAL' && window.__heroChaseCam !== false)));
  }

  // Chase camera target (null when chase off). Returns {pos, look}.
  function getChaseCameraTarget() {
    if (!Car.spawned || !Car.root || !Car.body) return null;
    const chaseOn = (typeof window !== 'undefined') && (window.__heroChaseCam || (Car.mode === 'MANUAL' && window.__heroChaseCam !== false));
    if (!chaseOn) return null;
    const t = Car.body.translation();
    const q = Car.body.rotation();
    _q.set(q.x, q.y, q.z, q.w);
    _fwd.set(0, 0, 1).applyQuaternion(_q); _fwd.y = 0; _fwd.normalize();
    const pos = { x: t.x - _fwd.x * 9, y: t.y + 4.0, z: t.z - _fwd.z * 9 };
    const look = { x: t.x + _fwd.x * 4, y: t.y + 1.0, z: t.z + _fwd.z * 4 };
    Car.cameraAttached = true;
    return { pos, look };
  }

  function summary() {
    const t = Car.body ? Car.body.translation() : { x: 0, y: 0, z: 0 };
    return {
      enabled: Car.enabled,
      spawned: Car.spawned,
      rapierReady: !!G._rapReady,
      mode: Car.mode,
      speed: +Car.speed.toFixed(3),
      position: { x: +t.x.toFixed(3), y: +t.y.toFixed(3), z: +t.z.toFixed(3) },
      collisions: Car.collisions,
      cameraAttached: Car.cameraAttached
    };
  }

  function setMode(m) { Car.mode = (m === 'MANUAL') ? 'MANUAL' : 'AUTO'; return Car.mode; }
  function incrementCollisions() { Car.collisions++; }

  const api = {
    spawnHeroCar, tick, summary,
    getChaseCameraTarget,
    setMode,
    _Car: Car // debug only
  };
  Genesis.VehicleController = Object.assign(Genesis.VehicleController || {}, api);
  return api;
}

export default { install };
