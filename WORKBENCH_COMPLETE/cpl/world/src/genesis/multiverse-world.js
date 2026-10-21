// src/genesis/multiverse-world.js
// MULTIVERSE WORLD — continuous 3D space with 10 realm nodes
// Realms are physical locations in the SAME scene, ~200 units apart.
// Camera flies to a node; realm content wakes via SectorManager LOD.
// The CPL city is one node among many. Click a realm → camera flies in.
// Flag-gated by window.__GENESIS_MULTIVERSE_WORLD (default ON).

import * as THREE from 'three';

const REALM_COUNT = 10;
const RADIUS = 300;          // circle radius → adjacent nodes ~205 apart
const WAKE_DIST = 150;       // SectorManager: show realm within this distance
const ACTIVE_DIST = 60;      // realm mechanics activate when camera this close
const FLY_SPEED = 80;        // units per second camera fly

function generatePositions(count, radius) {
  const positions = [{ x: 0, y: 0, z: 0 }]; // CPL city at origin
  const step = (Math.PI * 2) / Math.max(1, count - 1);
  for (let i = 0; i < count - 1; i++) {
    const a = i * step;
    positions.push({ x: Math.cos(a) * radius, y: 0, z: Math.sin(a) * radius });
  }
  return positions;
}

function makeLabel(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#' + (colorHex || 0xffffff).toString(16).padStart(6, '0');
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(40, 10, 1);
  return spr;
}

export function createMultiverseWorld(ctx = {}) {
  const THREE = ctx.THREE || window.THREE;
  const scene = ctx.scene;
  const camera = ctx.camera;
  const controls = ctx.controls;
  const Genesis = ctx.Genesis;
  if (!THREE || !scene || !camera) { if (typeof console !== 'undefined') console.warn('[MultiverseWorld] needs THREE + scene + camera'); return null; }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const realms = [];       // { id, name, type, position, root, marker, label, active, realmApi }
  let cameraTarget = null; // { position, lookAt, onArrive }
  let activeRealmId = null;

  // ---- Positions ----
  const positions = generatePositions(REALM_COUNT, RADIUS);

  // ---- Build realm markers + content ----
  function buildRealm(realmConfig, index) {
    const pos = positions[index];
    const id = realmConfig.id || ('realm-' + index);
    const name = realmConfig.name || ('Realm ' + index);
    const color = realmConfig.orb?.color || 0xaaaaaa;
    const glow = realmConfig.orb?.glow || 0xffffff;

    // Marker orb (clickable) — LARGE so visible from the city
    const orbSize = (realmConfig.orb?.size || 5) * 2.5;
    const geo = new THREE.SphereGeometry(orbSize, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.4 });
    const marker = new THREE.Mesh(geo, mat);
    marker.position.set(pos.x, pos.y + orbSize + 2, pos.z);
    marker.userData.realmId = id;
    marker.userData.isRealmMarker = true;
    scene.add(marker);

    // Halo ring
    const ringGeo = new THREE.TorusGeometry(orbSize * 1.6, 0.5, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(marker.position);
    scene.add(ring);

    // Sky beacon — tall vertical beam so marker is visible from anywhere
    const beamGeo = new THREE.CylinderGeometry(0.8, 2.5, 120, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos.x, pos.y + 60, pos.z);
    scene.add(beam);

    // Label
    const label = makeLabel(name, glow);
    label.position.set(pos.x, pos.y + orbSize + 18, pos.z);
    scene.add(label);

    // Realm content root (holds all 3D objects for this realm)
    const root = new THREE.Group();
    root.name = id + '-content';
    root.position.set(pos.x, pos.y, pos.z);
    root.visible = false; // SectorManager will toggle
    scene.add(root);

    // Register with SectorManager for LOD
    if (Genesis && Genesis.SectorManager) {
      Genesis.SectorManager.register(id, root, { maxDistance: WAKE_DIST, autoSleep: true });
    }

    const entry = {
      id, name, type: realmConfig.type || 'standard',
      position: pos, root, marker, ring, beam, label,
      realmApi: realmConfig.nexusApi || null,
      active: false, index
    };
    realms.push(entry);

    // WeaveBridge registration
    if (Genesis && Genesis.WeaveBridge) {
      Genesis.WeaveBridge.registerRealm(id, {
        name, type: realmConfig.type, plt: realmConfig.plt || { profit: 50, love: 50, tax: 50 },
        mechanics: realmConfig.mechanics || [], seed: realmConfig.seed || null
      });
    }
    return entry;
  }

  // ---- Camera fly ----
  function flyTo(realmId) {
    const r = realms.find(x => x.id === realmId);
    if (!r) return;
    const offset = { x: 0, y: 25, z: 60 };
    cameraTarget = {
      position: new THREE.Vector3(r.position.x + offset.x, r.position.y + offset.y, r.position.z + offset.z),
      lookAt: new THREE.Vector3(r.position.x, r.position.y, r.position.z),
      realmId
    };
    if (typeof console !== 'undefined') console.log('[Multiverse] Flying to', r.name);
  }

  // ---- Click handling ----
  function handleClick(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(realms.map(r => r.marker), false);
    if (hits.length > 0) {
      const realmId = hits[0].object.userData.realmId;
      flyTo(realmId);
      return realmId;
    }
    return null;
  }

  function handleHover(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(realms.map(r => r.marker), false);
    for (const r of realms) { r.marker.scale.setScalar(1); r.hovered = false; }
    if (hits.length > 0) {
      const realmId = hits[0].object.userData.realmId;
      const r = realms.find(x => x.id === realmId);
      if (r) { r.marker.scale.setScalar(1.3); r.hovered = true; }
    }
  }

  // ---- Update loop ----
  function update(dt) {
    const t = performance.now() * 0.001;

    // Animate markers
    for (const r of realms) {
      r.marker.rotation.y += dt * 0.3;
      const pulse = 1 + Math.sin(t * 1.5 + r.index) * 0.05;
      r.marker.scale.setScalar((r.hovered ? 1.3 : 1) * pulse);
      r.ring.rotation.z += dt * 0.2;
      r.ring.material.opacity = 0.4 + (Math.sin(t * 2 + r.index) * 0.5 + 0.5) * 0.2;
      if (r.beam) {
        r.beam.material.opacity = 0.05 + (Math.sin(t * 1.2 + r.index) * 0.5 + 0.5) * 0.06;
        r.beam.rotation.y += dt * 0.1;
      }
      r.label.position.set(r.position.x, r.position.y + (r.marker.geometry?.parameters?.radius || 12) + 20, r.position.z);
    }

    // Camera fly
    if (cameraTarget) {
      const p = camera.position;
      const target = cameraTarget.position;
      const dx = target.x - p.x, dy = target.y - p.y, dz = target.z - p.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2) {
        // Arrived
        p.copy(target);
        if (controls && controls.target) {
          controls.target.copy(cameraTarget.lookAt);
          controls.update();
        }
        activeRealmId = cameraTarget.realmId;
        if (typeof console !== 'undefined') console.log('[Multiverse] Arrived at', activeRealmId);
        cameraTarget = null;
      } else {
        const speed = Math.min(FLY_SPEED * dt, dist * 0.15);
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
        p.z += (dz / dist) * speed;
        if (controls && controls.target) {
          controls.target.lerp(cameraTarget.lookAt, 0.05);
          controls.update();
        }
      }
    }

    // Track active realm by proximity
    let closest = null;
    let closestDist = Infinity;
    for (const r of realms) {
      const dx = r.position.x - camera.position.x;
      const dz = r.position.z - camera.position.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < closestDist) { closestDist = d; closest = r; }
      // Activate mechanics when very close
      const wasActive = r.active;
      r.active = d < ACTIVE_DIST;
      if (r.active && !wasActive && r.realmApi && typeof r.realmApi.update === 'function') {
        if (typeof console !== 'undefined') console.log('[Multiverse] Mechanics active:', r.name);
      }
    }
  }

  function getActiveRealm() { return realms.find(r => r.id === activeRealmId) || null; }
  function getRealm(id) { return realms.find(r => r.id === id) || null; }

  function summary() {
    return {
      realmCount: realms.length,
      activeRealm: activeRealmId,
      flying: !!cameraTarget,
      realms: realms.map(r => ({ id: r.id, name: r.name, type: r.type, pos: r.position, active: r.active }))
    };
  }

  return {
    buildRealm,
    flyTo,
    handleClick,
    handleHover,
    update,
    getActiveRealm,
    getRealm,
    realms,
    summary,
    REALM_COUNT, RADIUS, WAKE_DIST, ACTIVE_DIST
  };
}

export function install(Genesis, THREE, camera, scene, controls) {
  if (!Genesis) return null;
  if (Genesis.MultiverseWorld) return Genesis.MultiverseWorld;
  if (!window.__GENESIS_MULTIVERSE_WORLD && window.__GENESIS_MULTIVERSE_WORLD !== undefined) return null;

  const world = createMultiverseWorld({ THREE: THREE || window.THREE, scene, camera, controls, Genesis });
  if (!world) return null;

  Genesis.MultiverseWorld = world;
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('multiverse-world', { status: 'validated', path: './src/genesis/multiverse-world.js' });
  }
  if (typeof console !== 'undefined') console.log('[MultiverseWorld] Initialized — 10 realms in continuous space, ~200 units apart');
  return world;
}
