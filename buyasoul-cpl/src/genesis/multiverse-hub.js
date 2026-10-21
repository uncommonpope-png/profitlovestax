// src/genesis/multiverse-hub.js
// TRUE MULTIVERSE HUB — galaxy of 10 realm nodes in a separate scene.
// Spherical scatter, animated orbs, halos, beacons, labels, treasure icons.
// Realm 1 = Genesis Surface (main scene preview). Realms 2-10 use realm-world.js when available.
// Flag-gated by window.__GENESIS_MULTIVERSE_HUB (default ON).

import * as THREE from 'three';
import { hubPosition, generateMultiverse, generateRealm, THEME_PALETTES } from './realm-generator.js';

const REALM_COUNT = 10;
const HUB_RADIUS = 400;
const ORB_BASE_SIZE = 14;
const BEAM_HEIGHT = 160;

// ---- UI helpers ----
function makeLabel(text, colorHex, THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, 1024, 256);
  const hex = '#' + (colorHex || 0xffffff).toString(16).padStart(6, '0');
  ctx.shadowColor = hex;
  ctx.shadowBlur = 40;
  ctx.fillStyle = hex;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 512, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: true }));
  spr.scale.set(60, 15, 1);
  return spr;
}

function makeIconSprite(emoji, THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '96px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: true }));
  spr.scale.set(10, 10, 1);
  return spr;
}

const TYPE_ICONS = {
  combat: '⚔️', breeding: '🌸', districts: '🏙️', conversation: '💬',
  building: '🏗️', trading: '💰', exploration: '🧭', crafting: '🔨',
  governance: '⚖️', economy: '💎'
};

export class MultiverseHub {
  constructor(ctx) {
    this.THREE = ctx.THREE || window.THREE;
    this.camera = ctx.camera;
    this.controls = ctx.controls;
    this.renderer = ctx.renderer;
    this.mainScene = ctx.mainScene;

    this.hubScene = new this.THREE.Scene();
    this.hubScene.name = 'MultiverseHub';
    this.realmScene = new this.THREE.Scene();
    this.realmScene.name = 'RealmScene';
    this.hubCamera = this.camera.clone();
    this.hubCamera.name = 'hubCamera';

    this.hubScene.fog = new this.THREE.FogExp2(0x020208, 0.0012);

    this.realms = []; // { id, name, config, index, position, node, group, ring, beam, label, icon, realmInstance }
    this.activeRealm = null;
    this.mode = 'hub'; // 'hub' | 'transition' | 'realm'

    this.raycaster = new this.THREE.Raycaster();
    this.pointer = new this.THREE.Vector2();
    this.hoveredRealm = null;

    this.returnButton = null;
    this.transitionManager = null;

    this._time = 0;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    this._buildStarfield();

    // Attempt to load realm-world.js for advanced configs / Realm class
    let RealmClass = null;
    let generateRealmConfig = null;
    try {
      const rw = await import('./realm-world.js');
      RealmClass = rw.Realm || null;
      generateRealmConfig = rw.generateRealmConfig || null;
    } catch (e) {
      if (typeof console !== 'undefined') console.log('[MultiverseHub] realm-world.js not yet available; falling back to realm-generator');
    }

    // ---- Build configs ----
    const configs = [];
    // Realm 1: Genesis Surface (special gold anchor)
    configs.push({
      id: 'realm-1',
      index: 0,
      name: 'Genesis Surface',
      type: 'districts',
      themeName: 'Genesis Surface',
      palette: { primary: 0xffd700, secondary: 0xffaa00, fog: 0x0a0800 },
      mechanics: ['districts'],
      plt: { profit: 70, love: 80, tax: 30 },
      orb: { color: 0xffd700, glow: 0xffaa00, size: 18, pulseSpeed: 0.35 },
      cameraSpawn: [0, 25, 60],
      cameraLookAt: [0, 2, 0],
      isGenesis: true
    });

    // Realms 2-10
    if (generateRealmConfig) {
      for (let i = 1; i < REALM_COUNT; i++) {
        const cfg = generateRealmConfig(i, 'genesis-hub');
        if (cfg) {
          cfg.index = i;
          cfg.id = cfg.id || ('realm-' + (i + 1));
          if (!cfg.cameraSpawn) cfg.cameraSpawn = [0, 20, 80];
          if (!cfg.cameraLookAt) cfg.cameraLookAt = [0, 0, 0];
          configs.push(cfg);
        }
      }
    }
    // Fill any missing slots with realm-generator fallback
    while (configs.length < REALM_COUNT) {
      const idx = configs.length;
      const seed = 'genesis-hub-fallback-' + idx;
      const cfg = generateRealm(seed, idx);
      cfg.index = idx;
      cfg.id = cfg.id || ('realm-' + (idx + 1));
      cfg.cameraSpawn = [0, 20, 80];
      cfg.cameraLookAt = [0, 0, 0];
      configs.push(cfg);
    }

    // ---- Build nodes ----
    for (let i = 0; i < REALM_COUNT; i++) {
      const cfg = configs[i];
      const pos = (i === 0)
        ? new this.THREE.Vector3(0, 0, 0)
        : (() => {
            const p = hubPosition(i - 1, REALM_COUNT - 1, HUB_RADIUS);
            return new this.THREE.Vector3(p.x, p.y, p.z);
          })();
      const node = this._buildRealmNode(cfg, i, pos);
      this.realms.push({
        id: cfg.id,
        name: cfg.name,
        config: cfg,
        index: i,
        position: pos,
        node,               // orb mesh (click target)
        group: node.userData.group,
        ring: node.userData.ring,
        beam: node.userData.beam,
        label: node.userData.label,
        icon: node.userData.icon,
        realmInstance: null
      });
    }

    // Instantiate Realm worlds for 2-10 when realm-world.js is present
    if (RealmClass) {
      for (let i = 1; i < REALM_COUNT; i++) {
        const r = this.realms[i];
        try {
          r.realmInstance = new RealmClass({ id: r.id, config: r.config, THREE: this.THREE, scene: this.realmScene });
          if (typeof r.realmInstance.init === 'function') await r.realmInstance.init();
        } catch (e) {
          if (typeof console !== 'undefined') console.warn('[MultiverseHub] Realm init failed for', r.id, e);
        }
      }
    }

    // Default hub camera overview
    this.hubCamera.position.set(0, 120, 700);
    this.hubCamera.lookAt(0, 0, 0);

    this._createReturnButton();
    if (typeof console !== 'undefined') console.log('[MultiverseHub] Initialized —', this.realms.length, 'realms in galaxy view');
  }

  _buildStarfield() {
    const count = 6000;
    const geo = new this.THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 800 + Math.random() * 2400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = new this.THREE.Color().setHSL(Math.random(), 0.4 + Math.random() * 0.4, 0.6 + Math.random() * 0.35);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new this.THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new this.THREE.BufferAttribute(col, 3));
    const mat = new this.THREE.PointsMaterial({ size: 2.5, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
    const stars = new this.THREE.Points(geo, mat);
    this.hubScene.add(stars);
    this._starfield = stars;
  }

  _buildRealmNode(cfg, index, position) {
    const color = cfg.orb?.color || 0xaaaaaa;
    const glow = cfg.orb?.glow || 0xffffff;
    const size = cfg.orb?.size || ORB_BASE_SIZE;
    const pulseSpeed = cfg.orb?.pulseSpeed || 0.5;

    const group = new this.THREE.Group();
    group.position.copy(position);
    this.hubScene.add(group);

    // Main glowing orb (click target)
    const orbGeo = new this.THREE.SphereGeometry(size, 48, 48);
    const orbMat = new this.THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.2,
      metalness: 0.2, roughness: 0.3,
      transparent: true, opacity: 0.95
    });
    const orb = new this.THREE.Mesh(orbGeo, orbMat);
    orb.userData.realmId = cfg.id;
    orb.userData.isRealmNode = true;
    orb.userData.pulseSpeed = pulseSpeed;
    orb.userData.baseScale = 1;
    orb.userData.baseEmissive = 1.2;
    group.add(orb);

    // Inner bright core
    const coreGeo = new this.THREE.SphereGeometry(size * 0.55, 32, 32);
    const coreMat = new this.THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.6 });
    const core = new this.THREE.Mesh(coreGeo, coreMat);
    core.userData.baseOpacity = 0.6;
    group.add(core);

    // Primary halo ring
    const ringGeo = new this.THREE.TorusGeometry(size * 1.8, 0.6, 16, 64);
    const ringMat = new this.THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.45, side: this.THREE.DoubleSide });
    const ring = new this.THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.userData.baseOpacity = 0.45;
    group.add(ring);

    // Secondary tilted ring
    const ring2Geo = new this.THREE.TorusGeometry(size * 1.4, 0.3, 12, 48);
    const ring2Mat = new this.THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.25, side: this.THREE.DoubleSide });
    const ring2 = new this.THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    group.add(ring2);

    // Sky beacon beam
    const beamGeo = new this.THREE.CylinderGeometry(0.6, 3.2, BEAM_HEIGHT, 12, 1, true);
    const beamMat = new this.THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.1, side: this.THREE.DoubleSide, depthWrite: false });
    const beam = new this.THREE.Mesh(beamGeo, beamMat);
    beam.position.y = BEAM_HEIGHT / 2;
    beam.userData.baseOpacity = 0.1;
    group.add(beam);

    // Label
    const label = makeLabel(cfg.name, glow, this.THREE);
    label.position.y = size + 22;
    group.add(label);

    // Dominant treasure / type icon
    const iconEmoji = TYPE_ICONS[cfg.type] || '✨';
    const icon = makeIconSprite(iconEmoji, this.THREE);
    icon.position.y = size + 38;
    group.add(icon);

    // Link for easy retrieval
    orb.userData.group = group;
    orb.userData.ring = ring;
    orb.userData.beam = beam;
    orb.userData.label = label;
    orb.userData.icon = icon;
    orb.userData.core = core;
    orb.userData.ring2 = ring2;

    return orb;
  }

  enterRealm(realmId) {
    const realm = this.getRealm(realmId);
    if (!realm) {
      if (typeof console !== 'undefined') console.warn('[MultiverseHub] Unknown realm:', realmId);
      return;
    }
    if (this.mode === 'realm' && this.activeRealm && this.activeRealm.id === realmId) return;
    if (!this.transitionManager) {
      if (typeof console !== 'undefined') console.warn('[MultiverseHub] No TransitionManager attached');
      return;
    }
    const from = (this.mode === 'hub') ? null : (this.activeRealm || null);
    this.transitionManager.startTransition(from, realm);
  }

  returnToHub() {
    if (this.mode !== 'realm') return;
    if (!this.transitionManager) return;
    const from = this.activeRealm;
    const to = { isHub: true, id: 'hub', node: this.realms[0] ? this.realms[0].node : null, name: 'Multiverse Hub' };
    this.transitionManager.startTransition(from, to);
  }

  update(dt) {
    if (!this._initialized) return;
    this._time += dt;
    const t = this._time;

    // Animate nodes
    for (const r of this.realms) {
      const orb = r.node;
      if (!orb) continue;
      // Let TransitionManager own the target node during flight
      if (this.transitionManager && this.transitionManager.isTransitioning && this.transitionManager.toRealm === r) continue;

      const ps = orb.userData.pulseSpeed || 0.5;
      const pulse = 1 + Math.sin(t * ps * 2 + r.index) * 0.06;
      const hoverScale = (this.hoveredRealm === r) ? 1.25 : 1.0;
      orb.scale.setScalar(orb.userData.baseScale * pulse * hoverScale);

      const core = orb.userData.core;
      if (core) core.scale.setScalar(0.9 + Math.sin(t * ps * 3 + r.index) * 0.12);

      const ring = orb.userData.ring;
      if (ring) {
        ring.rotation.z += dt * 0.15;
        ring.material.opacity = (ring.userData.baseOpacity || 0.45) + Math.sin(t * 2 + r.index) * 0.15;
      }
      const ring2 = orb.userData.ring2;
      if (ring2) {
        ring2.rotation.x += dt * 0.1;
        ring2.rotation.y += dt * 0.08;
      }
      const beam = orb.userData.beam;
      if (beam) {
        beam.material.opacity = (beam.userData.baseOpacity || 0.1) + Math.sin(t * 1.3 + r.index) * 0.05;
        beam.rotation.y += dt * 0.12;
      }
      const icon = orb.userData.icon;
      if (icon) {
        icon.position.y = (orb.geometry?.parameters?.radius || ORB_BASE_SIZE) + 38 + Math.sin(t * 2 + r.index) * 2;
      }
    }

    // Gentle starfield drift
    if (this._starfield) {
      this._starfield.rotation.y += dt * 0.005;
    }

    // Visibility management
    if (this.mode === 'hub') {
      if (this.mainScene) this.mainScene.visible = false;
      // Sync hub camera to main camera so OrbitControls drive the view
      if (this.camera && this.hubCamera) {
        this.hubCamera.position.copy(this.camera.position);
        this.hubCamera.quaternion.copy(this.camera.quaternion);
        this.hubCamera.aspect = this.camera.aspect;
        this.hubCamera.updateProjectionMatrix();
      }
      if (this.renderer) {
        this.renderer.render(this.hubScene, this.hubCamera);
      }
    } else if (this.mode === 'realm') {
      if (this.mainScene) {
        // Realm 1 is the main scene; others use the dedicated realmScene
        this.mainScene.visible = (this.activeRealm && this.activeRealm.id === 'realm-1');
      }
      // For non-Genesis realms, the hub renders the realm scene directly
      if (this.activeRealm && this.activeRealm.id !== 'realm-1') {
        if (this.renderer) {
          this.renderer.render(this.realmScene, this.camera);
        }
      }
    }
  }

  handleClick(clientX, clientY) {
    if (this.mode !== 'hub') return null;
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.hubCamera);
    const targets = this.realms.map(r => r.node).filter(Boolean);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      const realmId = hits[0].object.userData.realmId;
      this.enterRealm(realmId);
      return realmId;
    }
    return null;
  }

  handleHover(clientX, clientY) {
    if (this.mode !== 'hub') {
      this.hoveredRealm = null;
      for (const r of this.realms) {
        if (r.node) r.node.scale.setScalar(r.node.userData.baseScale || 1);
      }
      document.body.style.cursor = 'default';
      return;
    }
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.hubCamera);
    const targets = this.realms.map(r => r.node).filter(Boolean);
    const hits = this.raycaster.intersectObjects(targets, false);
    const prev = this.hoveredRealm;
    if (hits.length > 0) {
      const realmId = hits[0].object.userData.realmId;
      this.hoveredRealm = this.realms.find(r => r.id === realmId) || null;
    } else {
      this.hoveredRealm = null;
    }
    if (prev !== this.hoveredRealm) {
      for (const r of this.realms) {
        if (r !== this.hoveredRealm && r.node) {
          r.node.scale.setScalar(r.node.userData.baseScale || 1);
        }
      }
    }
    document.body.style.cursor = this.hoveredRealm ? 'pointer' : 'default';
  }

  getRealm(id) {
    return this.realms.find(r => r.id === id) || null;
  }

  _createReturnButton() {
    if (this.returnButton) return;
    const btn = document.createElement('button');
    btn.id = 'multiverse-return-btn';
    btn.textContent = 'Return to Multiverse';
    btn.style.cssText = [
      'position: fixed', 'top: 20px', 'right: 20px',
      'z-index: 1000', 'padding: 10px 18px',
      'font-family: Georgia, serif', 'font-size: 14px', 'letter-spacing: 1px',
      'color: #ffdd99', 'background: rgba(0,0,0,0.65)',
      'border: 1px solid rgba(255,200,120,0.4)', 'border-radius: 24px',
      'cursor: pointer', 'pointer-events: auto', 'display: none',
      'box-shadow: 0 0 18px rgba(255,180,60,0.15)', 'backdrop-filter: blur(6px)',
      'transition: opacity 0.3s ease'
    ].join(';');
    btn.addEventListener('click', () => this.returnToHub());
    document.body.appendChild(btn);
    this.returnButton = btn;
  }

  showReturnButton() {
    if (this.returnButton) {
      this.returnButton.style.display = 'block';
      requestAnimationFrame(() => { if (this.returnButton) this.returnButton.style.opacity = '1'; });
    }
  }

  hideReturnButton() {
    if (this.returnButton) {
      this.returnButton.style.opacity = '0';
      setTimeout(() => { if (this.returnButton) this.returnButton.style.display = 'none'; }, 300);
    }
  }

  get summary() {
    return {
      realmCount: this.realms.length,
      activeRealm: this.activeRealm ? this.activeRealm.id : null,
      mode: this.mode,
      hovering: this.hoveredRealm ? this.hoveredRealm.id : null
    };
  }
}

// Genesis registry install helper
export function install(Genesis, ctx) {
  if (!Genesis) return null;
  if (Genesis.MultiverseHub) return Genesis.MultiverseHub;
  if (typeof window !== 'undefined' && window.__GENESIS_MULTIVERSE_HUB === false) return null;

  const hub = new MultiverseHub(ctx || {});
  hub.init().then(() => {
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('multiverse-hub', { status: 'validated', path: './src/genesis/multiverse-hub.js' });
    }
    if (typeof console !== 'undefined') console.log('[MultiverseHub] Installed and ready');
  });
  Genesis.MultiverseHub = hub;
  return hub;
}
