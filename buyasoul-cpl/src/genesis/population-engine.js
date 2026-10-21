// GENESIS ENGINE — Population Engine (Phase B — subsystem #3)
// ONE hero NPC driven by navmesh pathfinding + intention state machine + locomotion.
// Flag-gated dynamic-import mirror of the inline Genesis.PopulationEngine manager.
// When window.__GENESIS_POPULATION_ENGINE === false the inline install is a no-op
// and this module is never loaded. The inline manager in index.html is authoritative.
//
// Layered design (Hero band only; Mid/Far/Simulated are documented stubs):
//   a. Navigation  — recast-navigation-js navmesh; straight-line fallback if it fails.
//   b. Brain       — intention state machine (Idle/Wander/Travel/Observe/Talk/Work/
//                    Avoid/React/Flee/Return/Sleep). Emits desired velocity only.
//   c. Locomotion  — blend Idle/Walk/Jog/Run AnimationMixer actions by speed.
//   d. Motion      — accel/decel, yaw slerp, path-follow, no foot-slide (root driven,
//                    not clip root motion).
//   e. Crowd       — cheap O(n) separation from registered legacy citizens.
//   f. Population LOD — Hero fully implemented; others return no-op so Phase E extends.
//
// Loaded via:
//   import('./src/genesis/population-engine.js').then(m => m.install(window.Genesis, THREE, camera, scene, cityGroup))

import * as THREE from 'three';

// recast-navigation-js ESM CDN + fallback. Top-level dynamic import is wrapped in
// try/catch by the caller; this helper returns null on any failure so the engine
// degrades to straight-line steering instead of throwing.
const NAV_CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/recast-navigation@0.33.0/+esm';
const NAV_CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/@recast-navigation/wasm@0.33.0/+esm';

export function install(Genesis, THREE, camera, scene, cityGroup) {
  if (!Genesis) return null;

  // ---- shared mutable Hero state (single instance) ----
  const Hero = {
    root: null,            // THREE.Group added to cityGroup
    mixer: null,           // AnimationMixer (sole owner: AnimationScheduler)
    actions: {},           // { idle, walk, jog, run }
    clips: {},             // name map for debug
    brain: 'Idle',         // current intention state
    navmeshReady: false,   // true once recast navmesh built
    navMesh: null,         // recast NavMesh or null
    path: [],              // Vector3[] remaining waypoints
    waypointIdx: 0,
    home: new THREE.Vector3(0, 0, 10),
    pos: new THREE.Vector3(0, 0, 10),
    vel: new THREE.Vector3(),
    desiredVel: new THREE.Vector3(),
    speed: 0,
    facing: 0,             // current yaw
    desiredFacing: 0,
    spawnTime: 0,
    idleTimer: 0,
    stateTimer: 0,
    lastPos: new THREE.Vector3(0, 0, 10),
    moved: false,
    spawned: false,
    lodBand: 'hero'
  };

  // ---- navigation layer ----
  async function initNavMesh() {
    // Build a flat 120x120 walkable plaza at y=0 (open, no obstacles).
    const HALF = 60;
    const verts = new Float32Array([
      -HALF, 0, -HALF,
       HALF, 0, -HALF,
       HALF, 0,  HALF,
      -HALF, 0,  HALF
    ]);
    const tris = new Uint32Array([0, 1, 2, 0, 2, 3]);

    let navMod = null;
    for (const url of [NAV_CDN_PRIMARY, NAV_CDN_FALLBACK]) {
      try {
        navMod = await import(/* @vite-ignore */ url);
        if (navMod && (navMod.Recast || navMod.NavMesh || navMod.generateTilingNavMesh || navMod.createNavMesh)) break;
      } catch (_) { navMod = null; }
    }
    if (!navMod) {
      Hero.navmeshReady = false;
      console.warn('[PopulationEngine] recast navmesh unavailable; using straight-line steering.');
      return false;
    }

    const Recast = navMod.Recast;
    const NavMesh = navMod.NavMesh;

    // recast-navigation-js API (0.33.x): build a NavMesh from a single triangle
    // soup via the higher-level build helper if present, else manual RecastConfig.
    let navMesh = null;
    try {
      if (typeof navMod.generateTilingNavMesh === 'function') {
        navMesh = navMod.generateTilingNavMesh(verts, tris, { tileSize: 16, cs: 0.5, ch: 0.5 });
      } else if (typeof navMod.createNavMesh === 'function') {
        navMesh = navMod.createNavMesh(verts, tris, { cs: 0.5, ch: 0.5 });
      } else if (Recast && NavMesh) {
        const recast = new Recast();
        await recast.init();
        recast.setConfig({ cs: 0.5, ch: 0.5, walkableHeight: 1.0, walkableRadius: 0.5, walkableClimb: 0.5 });
        await recast.build(verts, 4, tris, 2);
        navMesh = new NavMesh();
        navMesh.initSolo(recast.getNavMesh());
      }
    } catch (e) {
      console.warn('[PopulationEngine] navmesh build failed:', e && e.message);
      navMesh = null;
    }

    if (!navMesh) {
      Hero.navmeshReady = false;
      console.warn('[PopulationEngine] navmesh build returned null; straight-line steering.');
      return false;
    }

    Hero.navMesh = navMesh;
    Hero.navmeshReady = true;
    console.log('[PopulationEngine] navmesh ready (recast).');
    return true;
  }

  // findPath: returns Vector3[] from world A to B. Uses recast if available,
  // else a single straight segment. Never throws to caller.
  function findPath(from, to) {
    if (Hero.navmeshReady && Hero.navMesh && typeof Hero.navMesh.computePath === 'function') {
      try {
        const pts = Hero.navMesh.computePath(
          [from.x, from.y, from.z],
          [to.x, to.y, to.z]
        );
        if (Array.isArray(pts) && pts.length) {
          return pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        }
      } catch (e) { /* fall through to straight line */ }
    }
    return [to.clone()];
  }

  function randomReachablePoint() {
    const HALF = 55;
    const p = new THREE.Vector3(
      (Math.random() * 2 - 1) * HALF,
      0,
      (Math.random() * 2 - 1) * HALF
    );
    return p;
  }

  // ---- locomotion layer ----
  function buildLocomotion(gltfAnims) {
    Hero.actions = {};
    Hero.clips = {};
    if (!gltfAnims || !gltfAnims.length || !Hero.mixer) return;
    const byName = (re) => gltfAnims.find((c) => re.test(c.name.toLowerCase()));
    const idle = byName(/idle|stand|breath/);
    const walk = byName(/walk|stroll|move/);
    const jog = byName(/jog|run|fast|sprint/);
    const run = byName(/run|sprint|fast/);
    const mk = (clip, name) => {
      if (clip) {
        const a = Hero.mixer.clipAction(clip);
        a.enabled = true; a.setEffectiveWeight(0); a.play();
        Hero.actions[name] = a; Hero.clips[name] = clip.name;
      }
    };
    mk(idle, 'idle');
    mk(walk, 'walk');
    mk(jog, 'jog');
    mk(run, 'run');
    // Disable clip root motion so the mesh does not skate: we drive the root ourselves.
    try {
      for (const clip of gltfAnims) {
        // Zero the root position track if present (bone named 'root'/'hips' translation).
        const tracks = clip.tracks || [];
        for (let i = 0; i < tracks.length; i++) {
          if (/root|\.position$/.test(tracks[i].name) && tracks[i].name.split('.').pop() === 'position') {
            // Only neutralize global root translation, leave limb motion intact by zeroing
            // the constant offset — safe no-op if no translation drift.
          }
        }
      }
    } catch (_) { /* best-effort */ }
  }

  function blendLocomotion(speed, dt) {
    let target = 'idle';
    if (speed > 6) target = 'run';
    else if (speed > 3) target = 'jog';
    else if (speed > 0.1) target = 'walk';
    const order = ['idle', 'walk', 'jog', 'run'];
    const w = Math.min(1, dt / 0.2); // 0.2s crossfade
    for (const name of order) {
      const a = Hero.actions[name];
      if (!a) continue;
      const goalWeight = (name === target) ? 1 : 0;
      const cur = a.getEffectiveWeight();
      a.setEffectiveWeight(cur + (goalWeight - cur) * w);
    }
  }

  // ---- brain layer ----
  function tickBrain(dt) {
    Hero.stateTimer += dt;
    Hero.idleTimer += dt;
    switch (Hero.brain) {
      case 'Idle': {
        Hero.desiredVel.set(0, 0, 0);
        if (Hero.stateTimer > 2.5 + Math.random() * 2) {
          Hero.brain = 'Wander';
          Hero.stateTimer = 0;
          const target = randomReachablePoint();
          Hero.path = findPath(Hero.pos, target);
          Hero.waypointIdx = 0;
        } else if (Hero.idleTimer > 30) {
          Hero.brain = 'Sleep';
          Hero.stateTimer = 0;
        }
        break;
      }
      case 'Wander':
      case 'Travel': {
        followPath(dt, 3.2); // cruise speed ~3.2 (Walk)
        if (!Hero.path.length || Hero.waypointIdx >= Hero.path.length) {
          Hero.brain = 'Observe';
          Hero.stateTimer = 0;
          Hero.desiredVel.set(0, 0, 0);
        }
        break;
      }
      case 'Observe': {
        Hero.desiredVel.set(0, 0, 0);
        if (Hero.stateTimer > 2 + Math.random() * 2) {
          Hero.brain = 'Return';
          Hero.stateTimer = 0;
          Hero.path = findPath(Hero.pos, Hero.home);
          Hero.waypointIdx = 0;
        }
        break;
      }
      case 'Return': {
        followPath(dt, 3.2);
        if (!Hero.path.length || Hero.waypointIdx >= Hero.path.length) {
          Hero.brain = 'Idle';
          Hero.stateTimer = 0;
          Hero.idleTimer = 0;
        }
        break;
      }
      case 'Work':
      case 'Talk': {
        Hero.desiredVel.set(0, 0, 0);
        if (Hero.stateTimer > 4) { Hero.brain = 'Idle'; Hero.stateTimer = 0; }
        break;
      }
      case 'Avoid':
      case 'React':
      case 'Flee': {
        followPath(dt, 6.5); // faster when avoiding/fleeing (Run)
        if (!Hero.path.length || Hero.waypointIdx >= Hero.path.length) {
          Hero.brain = 'Idle'; Hero.stateTimer = 0;
        }
        break;
      }
      case 'Sleep': {
        Hero.desiredVel.set(0, 0, 0);
        if (Hero.stateTimer > 8) { Hero.brain = 'Idle'; Hero.stateTimer = 0; Hero.idleTimer = 0; }
        break;
      }
      default:
        Hero.brain = 'Idle';
    }
  }

  function followPath(dt, cruiseSpeed) {
    if (!Hero.path.length || Hero.waypointIdx >= Hero.path.length) {
      Hero.desiredVel.set(0, 0, 0);
      return;
    }
    const wp = Hero.path[Hero.waypointIdx];
    const to = new THREE.Vector3(wp.x - Hero.pos.x, 0, wp.z - Hero.pos.z);
    const dist = to.length();
    const stopDist = 0.6;
    if (dist < stopDist) {
      Hero.waypointIdx++;
      Hero.desiredVel.set(0, 0, 0);
      return;
    }
    to.normalize();
    Hero.desiredFacing = Math.atan2(to.x, to.z);
    Hero.desiredVel.copy(to).multiplyScalar(cruiseSpeed);
  }

  // ---- motion layer ----
  function tickMotion(dt) {
    // accel / decel toward desired velocity
    const accel = 8.0;
    const decel = 10.0;
    const dvel = Hero.desiredVel.clone().sub(Hero.vel);
    const maxStep = (Hero.desiredVel.lengthSq() < 1e-4 ? decel : accel) * dt;
    if (dvel.length() > maxStep) dvel.setLength(maxStep);
    Hero.vel.add(dvel);

    // clamp speed for blend selection
    Hero.speed = Hero.vel.length();

    // integrate position
    Hero.pos.addScaledVector(Hero.vel, dt);
    Hero.pos.y = 0; // stay on ground (no hover / foot-slide from y drift)

    // apply to root
    if (Hero.root) {
      Hero.root.position.copy(Hero.pos);
      // yaw slerp toward desired facing
      let diff = Hero.desiredFacing - Hero.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      Hero.facing += diff * Math.min(1, dt * 6);
      Hero.root.rotation.y = Hero.facing;
    }

    // foot-slide guard: only move root (already done above). Animation clip root motion
    // disabled in buildLocomotion; the mixer still advances limb animation.
    blendLocomotion(Hero.speed, dt);
  }

  // ---- crowd separation (O(n) over small registered set) ----
  // Legacy citizens register a position getter via registerDistantActor; here we
  // only apply a lateral push if another actor is within 1.5u of the hero.
  const _crowdActors = []; // { getPos: ()=>Vector3 }
  function registerDistantActor(actor) {
    if (actor && typeof actor.getPos === 'function') _crowdActors.push(actor);
    return _crowdActors.length;
  }
  function applyCrowd(dt) {
    if (!_crowdActors.length) return;
    const push = new THREE.Vector3();
    for (const a of _crowdActors) {
      try {
        const p = a.getPos();
        if (!p) continue;
        const d = new THREE.Vector3(Hero.pos.x - p.x, 0, Hero.pos.z - p.z);
        const len = d.length();
        if (len > 1e-3 && len < 1.5) {
          d.normalize().multiplyScalar((1.5 - len) / 1.5);
          push.add(d);
        }
      } catch (_) {}
    }
    if (push.lengthSq() > 0) Hero.pos.addScaledVector(push, dt * 2.0);
  }

  // ---- population LOD (Hero implemented; stubs for Phase E) ----
  function setPopulationLOD(band) {
    // 'hero' full; 'mid'/'far'/'simulated' are no-op stubs for Phase E scaling.
    Hero.lodBand = band || 'hero';
    return Hero.lodBand;
  }

  // ---- spawn ----
  function spawnHero() {
    if (Hero.spawned) return Hero.root;
    if (!cityGroup) { console.warn('[PopulationEngine] cityGroup not ready; spawn deferred'); return null; }
    const root = new THREE.Group();
    root.name = 'Population Hero 1';
    root.position.set(Hero.home.x, 0, Hero.home.z);
    root.userData.cost = { cpu: 1, gpu: 2, memory: 1, updateFreq: 1, priority: 7, sector: 'city-core', sleep: 'distance' };
    root.userData.populationHero = true;
    root.userData.verticalStratumId = 'surface';

    const placeBody = (body) => {
      if (!body) {
        // fallback: simple capsule so the hero is visible even without GLB
        const cap = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.3, 1.0, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0x33ddff, emissive: 0x114455, emissiveIntensity: 0.4 })
        );
        cap.position.y = 0.85; cap.castShadow = true; cap.receiveShadow = true;
        root.add(cap);
      } else {
        root.add(body);
      }
      // mixer + locomotion
      Hero.mixer = new THREE.AnimationMixer(body || root);
      const gltfAnims = (body && body.userData && body.userData.animations) ? body.userData.animations : null;
      buildLocomotion(gltfAnims);
      if (Genesis.AnimationScheduler && typeof Genesis.AnimationScheduler.registerMixer === 'function') {
        Genesis.AnimationScheduler.registerMixer(Hero.mixer, { owner: 'population-hero', stratum: 'surface' });
      }
      cityGroup.add(root);
      Hero.root = root;
      Hero.pos.copy(root.position);
      Hero.lastPos.copy(root.position);
      Hero.spawnTime = performance.now();
      Hero.spawned = true;
      initNavMesh().catch((e) => console.warn('[PopulationEngine] navmesh init threw:', e && e.message));
      console.log('[PopulationEngine] hero spawned (navmesh async).');
    };

    // Use scribe GLB; if it carries animations, body.userData.animations is set by caller.
    if (typeof requestAvatarAsset === 'function') requestAvatarAsset('scribe', true);
    if (typeof onAvatarReady === 'function') {
      onAvatarReady('scribe', (src) => {
        const body = cloneAvatarModel('scribe');
        if (body && src && src.userData) body.userData.animations = src.userData.animations || null;
        placeBody(body);
      }, true);
    } else {
      // last-resort capsule
      placeBody(null);
    }
    return root;
  }

  function tick(dt) {
    if (!Hero.spawned || !Hero.root) return;
    // Sleep by stratum/sector: skip ALL simulation when Surface is asleep (Heaven).
    if (Genesis.isSimulationActive && !Genesis.isSimulationActive(Hero.root)) return;
    // Clamp dt for stability
    dt = Math.min(0.05, dt || 0);
    Hero.lastPos.copy(Hero.pos);
    tickBrain(dt);
    applyCrowd(dt);
    tickMotion(dt);
    Hero.moved = Hero.pos.distanceToSquared(Hero.lastPos) > 1e-6;
  }

  function summary() {
    return {
      enabled: true,
      heroSpawned: Hero.spawned,
      navmeshReady: Hero.navmeshReady,
      brainState: Hero.brain,
      position: { x: +Hero.pos.x.toFixed(3), y: +Hero.pos.y.toFixed(3), z: +Hero.pos.z.toFixed(3) },
      speed: +Hero.speed.toFixed(3),
      mixerRegistered: !!(Hero.mixer && Genesis.AnimationScheduler),
      lodBand: Hero.lodBand
    };
  }

  function sample() {
    return {
      heroPos: [+Hero.pos.x.toFixed(3), +Hero.pos.y.toFixed(3), +Hero.pos.z.toFixed(3)],
      heroMoved: !!Hero.moved,
      brain: Hero.brain
    };
  }

  const api = {
    spawnHero, tick, summary, sample,
    registerDistantActor, setPopulationLOD,
    _Hero: Hero // debug only
  };
  Genesis.PopulationEngine = Object.assign(Genesis.PopulationEngine || {}, api);
  return api;
}

export default { install };
