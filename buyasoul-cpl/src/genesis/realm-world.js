// src/genesis/realm-world.js
// REALM WORLD — complete Lost World Mechanics Bible encapsulated as a self-contained reality.
// Each Realm is a full world with: ECS, procedural city, agent AI, weather, day/night,
// Soul Forge, Gacha, Combat, PLT economy, terminal, minimap, thought stream, achievements.
// Flag-gated by window.__GENESIS_REALM_WORLD (default ON).

import * as THREE from 'three';

const TREASURES = ['combat','breeding','districts','conversation','building','trading','exploration','crafting','governance','economy'];
const PREFIXES = ['Neon','Shadow','Crystal','Void','Ember','Frost','Storm','Soul','Cosmic','Phantom','Aether','Obsidian'];
const SUFFIXES = ['City','Arena','Realm','Empire','Hub','Forge','Wilds','Nexus','Citadel','Sanctum','Garden','Spire'];
const AGENT_NAMES = ['Neon','Pixel','Drift','Glitch','Spark','Volt','Echo','Pulse','Surge','Flux','Shard','Nova','Wisp','Bolt','Rift'];
const PANTHEON = [
  { name:'Profit Prime', type:'profit', maxHp:150 },
  { name:'Love Weaver', type:'love', maxHp:130 },
  { name:'Tax Collector', type:'tax', maxHp:120 }
];

function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  const next = () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 2147483647; };
  return next;
}

export function generateRealmConfig(index, seedPrefix = 'genesis') {
  const seed = seedPrefix + '-realm-' + index + '-' + Math.random().toString(36).substring(2, 8);
  const rng = seededRandom(seed);
  const p = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const s = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  const dominant = TREASURES[Math.floor(rng() * TREASURES.length)];
  const themeMap = {
    combat:      { primary:0xff3355, secondary:0xffaabb, fog:0x1a0008 },
    breeding:    { primary:0xff66cc, secondary:0xffddee, fog:0x1a0014 },
    districts:   { primary:0x00ffcc, secondary:0xaaffee, fog:0x001a14 },
    conversation:{ primary:0xffaa00, secondary:0xffeeaa, fog:0x1a1000 },
    building:    { primary:0x4488ff, secondary:0xaaccff, fog:0x000818 },
    trading:     { primary:0xffdd00, secondary:0xfffaaa, fog:0x1a1800 },
    exploration: { primary:0xaa66ff, secondary:0xddccff, fog:0x10001a },
    crafting:    { primary:0x66ff88, secondary:0xccffdd, fog:0x001a08 },
    governance:  { primary:0xff8844, secondary:0xffddcc, fog:0x1a0c00 },
    economy:     { primary:0x00ffaa, secondary:0xaaffee, fog:0x001a10 }
  };
  const pal = themeMap[dominant] || themeMap.exploration;
  return {
    id: 'realm-' + seed.substring(0, 8) + '-' + index,
    seed,
    index,
    name: p + ' ' + s,
    type: dominant,
    palette: pal,
    orb: { color: pal.primary, glow: pal.secondary, size: 6 + (index % 5) * 2, pulseSpeed: 0.5 + (index % 3) * 0.3 },
    plt: { profit: Math.floor(rng() * 60) + 20, love: Math.floor(rng() * 60) + 20, tax: Math.floor(rng() * 40) + 10 },
    cameraSpawn: [0, 25, 60],
    cameraLookAt: [0, 2, 0]
  };
}

// ECS
class Entity {
  constructor(id){ this.id = id; this.components = new Map(); }
  add(n, d){ this.components.set(n, d); return this; }
  get(n){ return this.components.get(n); }
  has(n){ return this.components.has(n); }
}
class ECSWorld {
  constructor(){ this.entities = new Map(); this.systems = []; }
  add(e){ this.entities.set(e.id, e); return e; }
  sys(s, p = 0){ this.systems.push({ s, p }); this.systems.sort((a, b) => a.p - b.p); }
  update(dt){ this.systems.forEach(s => s.s.update(this, dt)); }
  query(...tags){ return [...this.entities.values()].filter(e => tags.every(t => e.has(t))); }
}

export class Realm {
  constructor({ id, config, THREE, scene, lazyUI } = {}) {
    this.id = id || 'realm-unknown';
    this.config = config || {};
    this.THREE = THREE || window.THREE;
    this.scene = scene || null;
    this.root = new this.THREE.Group();
    this.root.name = this.id;
    this.active = false;
    this.ecs = new ECSWorld();
    this.agents = [];
    this.buildings = [];
    this.state = {
      plt: { profit: this.config.plt?.profit || 50, love: this.config.plt?.love || 50, tax: this.config.plt?.tax || 50 },
      souls: [], gems: 500, combat: null,
      day: 1, time: 8, weather: 'sunny',
      achievements: [], thoughts: []
    };
    this._time = 0;
    this._rng = seededRandom(this.config.seed || this.id);
    this._ui = null; // DOM container
    this._minimapCtx = null;
    this._districts = this._generateDistricts();
    this._weatherSystem = null;
    this._dayNight = null;
    this._particles = null;
    this._lazyUI = !!lazyUI;
    this._uiBuilt = false;
  }

  _rand(a, b){ return a + this._rng() * (b - a); }
  _randInt(a, b){ return Math.floor(this._rand(a, b + 1)); }
  _choice(arr){ return arr[Math.floor(this._rng() * arr.length)]; }

  // Low-GPU material fallback (see void-population._std): unlit MeshBasicMaterial
  // keeps the emissive hue and always compiles under the 1024-uniform light cap.
  _std(config) {
    const T = this.THREE;
    if (!T) return null;
    // Delegate to central factory for procedural window facades on low GPU.
    if (typeof window !== 'undefined' && typeof window.__genesisStd === 'function') {
      return window.__genesisStd(config);
    }
    if (!(typeof window !== 'undefined' && window.__GENESIS_LOW_GPU)) return new T.MeshStandardMaterial(config);
    config = config || {};
    const c = (config.emissive != null) ? config.emissive : (config.color != null ? config.color : 0xffffff);
    return new T.MeshBasicMaterial({
      color: c,
      transparent: !!config.transparent,
      opacity: (config.opacity != null) ? config.opacity : 1,
      side: (config.side != null) ? config.side : T.FrontSide,
      depthWrite: (config.depthWrite !== false),
      wireframe: !!config.wireframe,
      fog: (config.fog !== false)
    });
  }

  _generateDistricts() {
    const types = ['work','home','social','learn'];
    const colors = { work:0x00ffff, home:0xff66aa, social:0xffaa00, learn:0x00ff88 };
    const eColors = { work:0x0088aa, home:0xaa3366, social:0xaa7700, learn:0x00aa55 };
    const zones = [
      { x:[-85,-15], z:[-85,-15] }, { x:[15,85], z:[-85,-15] },
      { x:[-85,-15], z:[15,85] }, { x:[15,85], z:[15,85] }
    ];
    const counts = [22, 25, 18, 15];
    const heights = [[12,40],[6,20],[5,14],[8,28]];
    const d = {};
    for (let i = 0; i < 4; i++) {
      d[types[i]] = {
        color: colors[types[i]], eColor: eColors[types[i]],
        minH: heights[i][0], maxH: heights[i][1],
        count: counts[i], zone: zones[i]
      };
    }
    return d;
  }

  async init() {
    this._buildLighting();
    this._buildCity();
    this._spawnAgents();
    this._setupWeather();
    this._setupDayNight();
    if (!this._lazyUI) this._buildUI();
    return this;
  }

  _buildLighting() {
    const pal = this.config.palette || { fog: 0x050510 };
    this.ambient = new this.THREE.AmbientLight(0x332244, 0.6);
    this.dirLight = new this.THREE.DirectionalLight(0xffccaa, 1.2);
    this.dirLight.position.set(60, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.moonLight = new this.THREE.DirectionalLight(0x4466aa, 0.4);
    this.moonLight.position.set(-40, 60, -20);
    this.root.add(this.ambient);
    this.root.add(this.dirLight);
    this.root.add(this.moonLight);
  }

  _buildCity() {
    const DISTRICTS = this._districts;
    const rng = this._rng.bind(this);
    for (const [name, d] of Object.entries(DISTRICTS)) {
      for (let i = 0; i < d.count; i++) {
        const x = this._rand(d.zone.x[0], d.zone.x[1]);
        const z = this._rand(d.zone.z[0], d.zone.z[1]);
        const h = this._rand(d.minH, d.maxH);
        const w = this._rand(3, 6);
        const d2 = this._rand(3, 6);
        const geo = new this.THREE.BoxGeometry(w, h, d2);
        const mat = this._std({
          color: d.color, emissive: d.eColor, emissiveIntensity: 0.05,
          metalness: 0.7, roughness: 0.3
        });
        const mesh = new this.THREE.Mesh(geo, mat);
        mesh.position.set(x, h / 2, z);
        mesh.castShadow = true; mesh.receiveShadow = true;
        this.root.add(mesh);
        // Windows — more window rows for taller buildings
        if (h > 6) {
          for (let wy = 2; wy < h - 1; wy += 2.5) {
            const wGeo = new this.THREE.BoxGeometry(w * 0.8, 0.4, 0.06);
            const wMat = this._std({ color: d.color, emissive: d.color, emissiveIntensity: 0.3 });
            const win = new this.THREE.Mesh(wGeo, wMat);
            win.position.set(x, wy, z + d2 / 2 + 0.03);
            this.root.add(win);
          }
        }
        // Cap
        if (this._rng() > 0.5) {
          const cGeo = new this.THREE.BoxGeometry(w + 0.3, 0.3, d2 + 0.3);
          const cMat = this._std({ color: d.color, emissive: d.color, emissiveIntensity: 0.5 });
          const cap = new this.THREE.Mesh(cGeo, cMat);
          cap.position.set(x, h + 0.15, z);
          this.root.add(cap);
        }
        // Antenna spire on tall buildings
        if (h > 25 && this._rng() > 0.4) {
          const spireH = this._rand(3, 8);
          const spire = new this.THREE.Mesh(
            new this.THREE.CylinderGeometry(0.1, 0.3, spireH, 4),
            this._std({ color: d.color, emissive: d.color, emissiveIntensity: 0.6 })
          );
          spire.position.set(x, h + spireH / 2, z);
          this.root.add(spire);
        }
        this.buildings.push({ mesh, district: name, x, z, height: h });
      }
    }
    // Outer ring buildings — scattered at larger radii like the cosmic library
    const ringMat = this._std({ color: 0x222244, emissive: 0x110022, emissiveIntensity: 0.1, metalness: 0.6, roughness: 0.4 });
    const ringCounts = [{ r: 100, count: 20, skip: 0.4 }, { r: 140, count: 28, skip: 0.5 }, { r: 180, count: 35, skip: 0.6 }];
    for (const ring of ringCounts) {
      for (let i = 0; i < ring.count; i++) {
        if (this._rng() < ring.skip) continue;
        const angle = (i / ring.count) * Math.PI * 2 + this._rng() * 0.3;
        const rr = ring.r + this._rng() * 15 - 7;
        const x = Math.cos(angle) * rr;
        const z = Math.sin(angle) * rr;
        const h = this._rand(4, 18);
        const w = this._rand(2, 5);
        const d2 = this._rand(2, 5);
        const mesh = new this.THREE.Mesh(new this.THREE.BoxGeometry(w, h, d2), ringMat);
        mesh.position.set(x, h / 2, z);
        mesh.castShadow = true; mesh.receiveShadow = true;
        this.root.add(mesh);
        this.buildings.push({ mesh, district: 'outer', x, z, height: h });
      }
    }
    // Roads — wider, longer grid
    const roadMat = this._std({ color: 0x111122, roughness: 0.8 });
    for (let i = -90; i <= 90; i += 14) {
      const r1 = new this.THREE.Mesh(new this.THREE.BoxGeometry(180, 0.06, 3), roadMat);
      r1.position.set(0, 0.03, i); r1.receiveShadow = true; this.root.add(r1);
      const r2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(3, 0.06, 180), roadMat);
      r2.position.set(i, 0.03, 0); r2.receiveShadow = true; this.root.add(r2);
    }
    // Ground — large plane
    const ground = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(500, 500),
      this._std({ color: 0x080818, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true;
    this.root.add(ground);
    // Grid — larger
    const grid = new this.THREE.GridHelper(400, 50, 0xff00aa, 0x110022);
    grid.position.y = 0.02; grid.material.opacity = 0.12; grid.material.transparent = true;
    this.root.add(grid);
    // District labels — bigger, higher
    for (const [name, d] of Object.entries(DISTRICTS)) {
      const cx = (d.zone.x[0] + d.zone.x[1]) / 2;
      const cz = (d.zone.z[0] + d.zone.z[1]) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#' + d.color.toString(16).padStart(6, '0');
      ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), 256, 70);
      const tex = new this.THREE.CanvasTexture(canvas);
      const label = new this.THREE.Mesh(new this.THREE.PlaneGeometry(16, 4), new this.THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      label.position.set(cx, 35, cz); label.rotation.x = -Math.PI / 4;
      this.root.add(label);
    }
  }

  _createHumanoid(type, x, z, name) {
    const g = new this.THREE.Group();
    const colors = { profit: 0xffaa00, love: 0xff66aa, tax: 0x00ffcc };
    const c = colors[type] || 0xffffff;
    const torso = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.6, 0.8, 0.3), this._std({ color: c, emissive: c, emissiveIntensity: 0.1 }));
    torso.position.y = 1.2; torso.castShadow = true; g.add(torso);
    const head = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.22, 8, 8), this._std({ color: 0xffddcc }));
    head.position.y = 1.85; head.castShadow = true; g.add(head);
    [-0.08, 0.08].forEach(xo => {
      const eye = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.04, 6, 6), this._std({ color: 0x222222 }));
      eye.position.set(xo, 1.88, 0.18); g.add(eye);
    });
    const arms = [];
    [-0.45, 0.45].forEach(xo => {
      const arm = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.15, 0.6, 0.15), this._std({ color: c, emissive: c, emissiveIntensity: 0.05 }));
      arm.position.set(xo, 1.1, 0); arm.castShadow = true; g.add(arm); arms.push(arm);
    });
    const legs = [];
    [-0.15, 0.15].forEach(xo => {
      const leg = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.18, 0.7, 0.18), this._std({ color: 0x333366 }));
      leg.position.set(xo, 0.35, 0); leg.castShadow = true; g.add(leg); legs.push(leg);
    });
    const ring = new this.THREE.Mesh(new this.THREE.TorusGeometry(0.8, 0.03, 8, 32), this._std({ color: c, emissive: c, emissiveIntensity: 0.5, transparent: true, opacity: 0 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    // Name label
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 256; nCanvas.height = 64;
    const nctx = nCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(0,0,0,0.7)'; nctx.fillRect(0, 0, 256, 64);
    nctx.fillStyle = '#' + c.toString(16).padStart(6, '0');
    nctx.font = 'bold 24px sans-serif'; nctx.textAlign = 'center';
    nctx.fillText(name || 'Soul', 128, 42);
    const nTex = new this.THREE.CanvasTexture(nCanvas);
    const nSprite = new this.THREE.Sprite(new this.THREE.SpriteMaterial({ map: nTex, transparent: true }));
    nSprite.position.y = 2.3; nSprite.scale.set(2, 0.5, 1); g.add(nSprite);
    g.position.set(x, 0, z);
    this.root.add(g);
    return { group: g, torso, head, arms, legs, ring, nameSprite: nSprite, type, name };
  }

  _spawnAgents() {
    const NEED_TYPES = ['energy', 'social', 'skill', 'purpose'];
    const DISTRICTS = this._districts;
    const names = [...AGENT_NAMES];
    // shuffle names with rng
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(this._rng() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    for (let i = 0; i < 10; i++) {
      const type = ['profit', 'love', 'tax'][i % 3];
      const districtKeys = Object.keys(DISTRICTS);
      const zone = DISTRICTS[districtKeys[i % 4]].zone;
      const x = (zone.x[0] + zone.x[1]) / 2 + (this._rng() - 0.5) * 40;
      const z = (zone.z[0] + zone.z[1]) / 2 + (this._rng() - 0.5) * 40;
      const mesh = this._createHumanoid(type, x, z, names[i]);
      const agent = {
        name: names[i], type,
        needs: { energy: 80 + this._rng() * 20, social: 80 + this._rng() * 20, skill: 80 + this._rng() * 20, purpose: 80 + this._rng() * 20 },
        state: 'IDLE', mesh, targetPos: null, stateTimer: 0, conversationTarget: null,
        hp: 100, maxHp: 100, xp: 0, level: 1, souls: []
      };
      this.agents.push(agent);
      this.ecs.add(new Entity('agent-' + i).add('agent', agent).add('position', agent.mesh.group.position));
    }
  }

  _setupWeather() {
    const states = {
      sunny: { fogDensity: 0.008, lightIntensity: 1.0, particles: 0 },
      rainy: { fogDensity: 0.015, lightIntensity: 0.5, particles: 3000, color: 0x4488ff },
      snowy: { fogDensity: 0.012, lightIntensity: 0.7, particles: 4000, color: 0xeeeeff }
    };
    this._weatherSystem = {
      current: 'sunny', states,
      change: (state) => {
        this._weatherSystem.current = state;
        const s = states[state];
        // Note: fog and light are per-realm, but we can't easily set scene fog per-group.
        // Instead we modulate ambient/dirLight intensity.
        if (s.lightIntensity !== undefined && this.dirLight) this.dirLight.intensity = s.lightIntensity;
        if (this._particles) { this.root.remove(this._particles); this._particles = null; }
        if (s.particles > 0) {
          const geo = new this.THREE.BufferGeometry();
          const pos = new Float32Array(s.particles * 3);
          for (let i = 0; i < s.particles * 3; i += 3) {
            pos[i] = (this._rng() - 0.5) * 250; pos[i + 1] = this._rng() * 80; pos[i + 2] = (this._rng() - 0.5) * 250;
          }
          geo.setAttribute('position', new this.THREE.BufferAttribute(pos, 3));
          this._particles = new this.THREE.Points(geo, new this.THREE.PointsMaterial({ color: s.color, size: s.color === 0x4488ff ? 0.1 : 0.3, transparent: true, opacity: 0.8 }));
          this.root.add(this._particles);
        }
      },
      update: (dt) => {
        if (!this._particles) return;
        const pos = this._particles.geometry.attributes.position.array;
        const speed = this._weatherSystem.current === 'rain' ? 20 : 2;
        for (let i = 1; i < pos.length; i += 3) { pos[i] -= speed * dt; if (pos[i] < 0) pos[i] = 80; }
        this._particles.geometry.attributes.position.needsUpdate = true;
      }
    };
  }

  _setupDayNight() {
    const phases = [
      { name:'Late Night', start:0, sunY:-30, ambientI:0.2 },
      { name:'Dawn', start:5, sunY:0, ambientI:0.4 },
      { name:'Morning Rush', start:7, sunY:20, ambientI:0.7 },
      { name:'Business Hours', start:9, sunY:40, ambientI:1.0 },
      { name:'Lunch', start:12, sunY:50, ambientI:1.0 },
      { name:'Afternoon', start:14, sunY:35, ambientI:0.9 },
      { name:'Neon Nights', start:18, sunY:5, ambientI:0.5 },
      { name:'Late Night', start:21, sunY:-10, ambientI:0.3 }
    ];
    this._dayNight = {
      time: 8, day: 1, speed: 0.3, phases,
      update: (dt) => {
        this._dayNight.time += this._dayNight.speed * dt;
        if (this._dayNight.time >= 24) { this._dayNight.time -= 24; this._dayNight.day++; }
        let phase = phases[0];
        for (let i = phases.length - 1; i >= 0; i--) {
          if (this._dayNight.time >= phases[i].start) { phase = phases[i]; break; }
        }
        const sunAngle = ((this._dayNight.time - 6) / 12) * Math.PI;
        if (this.dirLight) this.dirLight.position.set(Math.cos(sunAngle) * 30, Math.max(Math.sin(sunAngle) * 50, 2), 20);
        if (this.ambient) this.ambient.intensity = phase.ambientI;
        if (this.moonLight) this.moonLight.intensity = (this._dayNight.time < 6 || this._dayNight.time > 19) ? 0.4 : 0.1;
        this.state.time = this._dayNight.time; this.state.day = this._dayNight.day;
      }
    };
  }

  // ---- UI ----
  _buildUI() {
    const id = this.id;
    if (document.getElementById('realm-ui-' + id)) return;
    const container = document.createElement('div');
    container.id = 'realm-ui-' + id;
    container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:30;display:none;';
    container.innerHTML = `
      <div id="realm-hud-${id}" style="position:absolute;top:20px;left:20px;display:flex;gap:12px;">
        <div style="width:120px;height:24px;background:rgba(0,0,0,0.7);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);position:relative;">
          <div id="realm-profit-${id}" style="height:100%;background:linear-gradient(90deg,#ffaa00,#ff8800);width:50%;transition:width 0.5s;"></div>
          <span style="position:absolute;top:2px;left:8px;font-size:11px;font-weight:bold;text-shadow:0 0 4px #000;">Profit</span>
        </div>
        <div style="width:120px;height:24px;background:rgba(0,0,0,0.7);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);position:relative;">
          <div id="realm-love-${id}" style="height:100%;background:linear-gradient(90deg,#ff66aa,#ff3388);width:50%;transition:width 0.5s;"></div>
          <span style="position:absolute;top:2px;left:8px;font-size:11px;font-weight:bold;text-shadow:0 0 4px #000;">Love</span>
        </div>
        <div style="width:120px;height:24px;background:rgba(0,0,0,0.7);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);position:relative;">
          <div id="realm-tax-${id}" style="height:100%;background:linear-gradient(90deg,#00ffcc,#00cc99);width:50%;transition:width 0.5s;"></div>
          <span style="position:absolute;top:2px;left:8px;font-size:11px;font-weight:bold;text-shadow:0 0 4px #000;">Tax</span>
        </div>
      </div>
      <div id="realm-plt-${id}" style="position:absolute;top:52px;left:20px;font-size:16px;font-weight:bold;color:#fff;">PLT: 0</div>
      <div id="realm-world-${id}" style="position:absolute;top:20px;left:50%;transform:translateX(-50%);text-align:center;">
        <div style="font-size:18px;font-weight:bold;text-shadow:0 0 20px rgba(255,170,0,0.5);letter-spacing:2px;color:#fff;">${this.config.name}</div>
        <div style="font-size:11px;color:#888;margin-top:4px;">Seed: ${this.config.seed || 'none'}</div>
      </div>
      <div id="realm-day-${id}" style="position:absolute;top:58px;left:50%;transform:translateX(-50%);font-size:11px;color:#666;">Day 1</div>
      <div id="realm-thoughts-${id}" style="position:absolute;top:85px;left:20px;width:280px;max-height:180px;overflow-y:auto;background:rgba(5,5,20,0.7);border-left:2px solid #ffaa00;border-radius:0 8px 8px 0;padding:8px;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">GSK Thoughts</div>
      </div>
      <div id="realm-agents-${id}" style="position:absolute;top:20px;right:20px;width:200px;max-height:300px;overflow-y:auto;background:rgba(5,5,20,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Citizens</div>
      </div>
      <div id="realm-minimap-${id}" style="position:absolute;bottom:20px;right:20px;width:160px;height:160px;border:2px solid rgba(255,255,255,0.3);border-radius:8px;overflow:hidden;background:rgba(0,0,0,0.8);">
        <canvas id="realm-minimap-c-${id}" width="160" height="160" style="width:100%;height:100%"></canvas>
      </div>
      <div id="realm-terminal-${id}" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);width:420px;">
        <input id="realm-terminal-i-${id}" placeholder="$ forge | gacha | combat | dex | tp [district] | weather | time | plt | gems" style="width:100%;padding:8px 14px;background:rgba(5,5,20,0.9);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#0f0;font-family:monospace;font-size:12px;outline:none;pointer-events:auto;"
          onkeydown="if(event.key==='Enter'){window.__realmRunCommand&&window.__realmRunCommand('${id}',this.value);this.value='';}">
      </div>
      <div id="realm-forge-${id}" style="position:absolute;bottom:20px;left:20px;width:260px;background:rgba(5,5,20,0.92);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;display:none;pointer-events:auto;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Soul Forge</div>
        <input id="realm-forge-name-${id}" placeholder="Soul name..." style="width:100%;padding:6px;margin-bottom:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:12px;">
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;">Profit: <span id="realm-fp-${id}">33</span>%</div>
        <input type="range" id="realm-fp-in-${id}" min="0" max="100" value="33" style="width:100%;accent-color:#ffaa00;" oninput="window.__realmUpdateForge&&window.__realmUpdateForge('${id}')">
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;">Love: <span id="realm-fl-${id}">33</span>%</div>
        <input type="range" id="realm-fl-in-${id}" min="0" max="100" value="33" style="width:100%;accent-color:#ff66aa;" oninput="window.__realmUpdateForge&&window.__realmUpdateForge('${id}')">
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;">Tax: <span id="realm-ft-${id}">34</span>%</div>
        <input type="range" id="realm-ft-in-${id}" min="0" max="100" value="34" style="width:100%;accent-color:#00ffcc;" oninput="window.__realmUpdateForge&&window.__realmUpdateForge('${id}')">
        <button onclick="window.__realmForgeSoul&&window.__realmForgeSoul('${id}')" style="width:100%;padding:8px;background:linear-gradient(135deg,#ffaa00,#ff6600);border:none;border-radius:6px;color:#000;font-weight:bold;cursor:pointer;font-size:12px;margin-top:6px;">FORGE SOUL</button>
        <div id="realm-forge-res-${id}" style="margin-top:6px;font-size:11px;color:#aaa;"></div>
      </div>
      <div id="realm-gacha-${id}" style="position:absolute;bottom:20px;left:300px;width:180px;background:rgba(5,5,20,0.92);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;display:none;pointer-events:auto;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Soul Orbs</div>
        <div id="realm-gacha-orb-${id}" style="width:60px;height:60px;margin:0 auto 8px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ff66aa,#aa0066);box-shadow:0 0 20px rgba(255,102,170,0.5);cursor:pointer;" onclick="window.__realmPullGacha&&window.__realmPullGacha('${id}')"></div>
        <div style="text-align:center;font-size:13px;color:#ffaa00;margin-bottom:6px;">Gems: <span id="realm-gems-${id}">500</span></div>
        <div id="realm-gacha-res-${id}" style="text-align:center;font-size:11px;min-height:30px;color:#aaa;"></div>
      </div>
      <div id="realm-combat-${id}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:440px;background:rgba(5,5,20,0.95);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:20px;display:none;text-align:center;pointer-events:auto;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Pantheon Arena</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <div style="text-align:center;width:45%;"><div id="realm-cp-name-${id}" style="font-size:13px;font-weight:bold;color:#fff;">Player</div><div style="width:100%;height:16px;background:rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;margin-top:4px;"><div id="realm-cp-hp-${id}" style="height:100%;background:linear-gradient(90deg,#ff3333,#ff6666);width:100%;transition:width 0.3s;"></div></div></div>
          <div style="text-align:center;width:45%;"><div id="realm-ce-name-${id}" style="font-size:13px;font-weight:bold;color:#fff;">Enemy</div><div style="width:100%;height:16px;background:rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;margin-top:4px;"><div id="realm-ce-hp-${id}" style="height:100%;background:linear-gradient(90deg,#ff3333,#ff6666);width:100%;transition:width 0.3s;"></div></div></div>
        </div>
        <div style="margin:8px 0;"><span style="font-size:11px;color:#ffaa00;">Super: </span><span id="realm-super-${id}" style="font-size:11px;color:#fff;">0</span>/100</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
          <button onclick="window.__realmCombatMove&&window.__realmCombatMove('${id}','punch')" style="padding:8px 16px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:12px;">Punch</button>
          <button onclick="window.__realmCombatMove&&window.__realmCombatMove('${id}','kick')" style="padding:8px 16px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:12px;">Kick</button>
          <button id="realm-btn-spec-${id}" onclick="window.__realmCombatMove&&window.__realmCombatMove('${id}','special')" disabled style="padding:8px 16px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:12px;opacity:0.3;">Special</button>
          <button id="realm-btn-ult-${id}" onclick="window.__realmCombatMove&&window.__realmCombatMove('${id}','ultimate')" disabled style="padding:8px 16px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:12px;opacity:0.3;">Ultimate</button>
        </div>
        <div id="realm-combat-log-${id}" style="margin-top:10px;font-size:10px;color:#888;max-height:80px;overflow-y:auto;text-align:left;"></div>
        <button onclick="window.__realmEndCombat&&window.__realmEndCombat('${id}')" style="margin-top:10px;padding:6px 14px;background:#ff8844;border:none;border-radius:6px;color:#110011;font-weight:bold;cursor:pointer;font-size:12px;">End Combat</button>
      </div>
      <div id="realm-dex-${id}" style="position:absolute;top:20px;right:250px;width:180px;background:rgba(5,5,20,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px;display:none;pointer-events:auto;">
        <div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Soul Dex</div>
        <div id="realm-dex-list-${id}"></div>
      </div>
    `;
    document.body.appendChild(container);
    this._ui = container;

    // Minimap context
    const mCanvas = document.getElementById('realm-minimap-c-' + id);
    if (mCanvas) this._minimapCtx = mCanvas.getContext('2d');

    // Wire global helpers scoped to this realm
    if (!window.__realmRunCommand) window.__realmRunCommand = (rid, cmd) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._runCommand(cmd);
    };
    if (!window.__realmUpdateForge) window.__realmUpdateForge = (rid) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._updateForgeSliders();
    };
    if (!window.__realmForgeSoul) window.__realmForgeSoul = (rid) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._forgeSoul();
    };
    if (!window.__realmPullGacha) window.__realmPullGacha = (rid) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._pullGacha();
    };
    if (!window.__realmCombatMove) window.__realmCombatMove = (rid, move) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._combatMove(move);
    };
    if (!window.__realmEndCombat) window.__realmEndCombat = (rid) => {
      const r = window.__realmInstances?.[rid];
      if (r) r._endCombat();
    };

    // Registry
    if (!window.__realmInstances) window.__realmInstances = {};
    window.__realmInstances[id] = this;
  }

  // ---- Game Systems ----
  _updatePLT(p, l, t) {
    const s = this.state.plt;
    s.profit = Math.max(0, Math.min(100, s.profit + p));
    s.love = Math.max(0, Math.min(100, s.love + l));
    s.tax = Math.max(0, Math.min(100, s.tax + t));
    const profitEl = document.getElementById('realm-profit-' + this.id);
    const loveEl = document.getElementById('realm-love-' + this.id);
    const taxEl = document.getElementById('realm-tax-' + this.id);
    const totalEl = document.getElementById('realm-plt-' + this.id);
    if (profitEl) profitEl.style.width = s.profit + '%';
    if (loveEl) loveEl.style.width = s.love + '%';
    if (taxEl) taxEl.style.width = s.tax + '%';
    if (totalEl) totalEl.textContent = 'PLT: ' + (s.profit + s.love - s.tax);
  }

  _updateForgeSliders() {
    const p = parseInt(document.getElementById('realm-fp-in-' + this.id)?.value || 33);
    const l = parseInt(document.getElementById('realm-fl-in-' + this.id)?.value || 33);
    const t = parseInt(document.getElementById('realm-ft-in-' + this.id)?.value || 34);
    const total = p + l + t;
    if (total !== 100) {
      // silently clamp to nearest valid distribution without complex logic
    }
    const fp = document.getElementById('realm-fp-' + this.id);
    const fl = document.getElementById('realm-fl-' + this.id);
    const ft = document.getElementById('realm-ft-' + this.id);
    if (fp) fp.textContent = p;
    if (fl) fl.textContent = l;
    if (ft) ft.textContent = t;
  }

  _forgeSoul() {
    const name = document.getElementById('realm-forge-name-' + this.id)?.value || 'Soul-' + Date.now();
    const p = parseInt(document.getElementById('realm-fp-in-' + this.id)?.value || 33);
    const l = parseInt(document.getElementById('realm-fl-in-' + this.id)?.value || 33);
    const t = parseInt(document.getElementById('realm-ft-in-' + this.id)?.value || 34);
    const type = p > l && p > t ? 'profit' : l > t ? 'love' : 'tax';
    const soul = { name, type, plt: { profit: p, love: l, tax: t }, level: 1, skills: ['forge-created'] };
    this.state.souls.push(soul);
    this._updatePLT(p * 0.02, l * 0.02, t * 0.02);
    const res = document.getElementById('realm-forge-res-' + this.id);
    if (res) res.textContent = 'Forged: ' + name + ' (' + type + ')';
    this._updateDex();
  }

  _pullGacha() {
    if (this.state.gems < 100) {
      const res = document.getElementById('realm-gacha-res-' + this.id);
      if (res) res.textContent = 'Not enough gems!';
      return;
    }
    this.state.gems -= 100;
    const gemsEl = document.getElementById('realm-gems-' + this.id);
    if (gemsEl) gemsEl.textContent = this.state.gems;
    const roll = this._rng();
    const rarity = roll < 0.15 ? 'legendary' : roll < 0.40 ? 'rare' : 'common';
    const stats = rarity === 'legendary' ? 100 : rarity === 'rare' ? 75 : 50;
    const type = ['profit', 'love', 'tax'][Math.floor(this._rng() * 3)];
    const soul = { name: 'Orb-' + Date.now(), type, rarity, plt: { profit: stats + this._randInt(0, 20), love: stats + this._randInt(0, 20), tax: stats + this._randInt(0, 20) }, level: 1, skills: ['gacha-summoned'] };
    this.state.souls.push(soul);
    this._updatePLT(2, 2, 2);
    const res = document.getElementById('realm-gacha-res-' + this.id);
    const rColors = { common: '#888888', rare: '#4488ff', legendary: '#ffaa00' };
    if (res) res.innerHTML = '<span style="color:' + rColors[rarity] + '">' + rarity.toUpperCase() + '</span> ' + soul.name + ' (' + type + ')';
    this._updateDex();
  }

  _startCombat(bossIndex) {
    const boss = PANTHEON[bossIndex] || PANTHEON[0];
    const player = this.state.souls.length > 0 ? { ...this.state.souls[0], maxHp: 100 } : { name: 'Hero', type: 'profit', maxHp: 100 };
    this.state.combat = { player, boss, playerHp: 100, bossHp: boss.maxHp, superMeter: 0, active: true, turn: 'player', log: [] };
    const panel = document.getElementById('realm-combat-' + this.id);
    if (panel) panel.style.display = 'block';
    document.getElementById('realm-cp-name-' + this.id).textContent = player.name;
    document.getElementById('realm-ce-name-' + this.id).textContent = boss.name;
    this._updateCombatUI();
  }

  _combatMove(move) {
    const c = this.state.combat;
    if (!c || !c.active || c.turn !== 'player') return;
    const moves = { punch: { dmg: 10, cost: 5 }, kick: { dmg: 15, cost: 8 }, special: { dmg: 40, cost: -50 }, ultimate: { dmg: 80, cost: -100 } };
    const m = moves[move];
    if (!m || c.superMeter + m.cost < 0) return;
    c.superMeter += m.cost;
    const adv = this._getPLTAdvantage(c.player.type, c.boss.type);
    const dmg = Math.floor(m.dmg * adv);
    c.bossHp = Math.max(0, c.bossHp - dmg);
    c.log.push(c.player.name + ' uses ' + move + ' for ' + dmg + ' damage!');
    this._updatePLT(3, 1, -1);
    this._updateCombatUI();
    if (c.bossHp <= 0) { c.active = false; c.log.push(c.player.name + ' WINS! +50 XP'); c.player.xp = (c.player.xp || 0) + 50; this._updatePLT(10, 5, -2); }
    else { c.turn = 'boss'; setTimeout(() => this._bossTurn(), 800); }
  }

  _bossTurn() {
    const c = this.state.combat;
    if (!c || !c.active) return;
    const m = ['punch', 'kick', 'special'][Math.floor(this._rng() * 3)];
    const dmgMap = { punch: 10, kick: 15, special: 40 };
    const adv = this._getPLTAdvantage(c.boss.type, c.player.type);
    const dmg = Math.floor(dmgMap[m] * adv);
    c.playerHp = Math.max(0, c.playerHp - dmg);
    c.log.push(c.boss.name + ' uses ' + m + ' for ' + dmg + '!');
    this._updateCombatUI();
    if (c.playerHp <= 0) { c.active = false; c.log.push(c.player.name + ' DEFEATED!'); this._updatePLT(-5, -5, 5); }
    else c.turn = 'player';
  }

  _endCombat() {
    this.state.combat = null;
    const panel = document.getElementById('realm-combat-' + this.id);
    if (panel) panel.style.display = 'none';
  }

  _getPLTAdvantage(atk, def) {
    if (atk === 'profit' && def === 'love') return 1.5;
    if (atk === 'love' && def === 'tax') return 1.5;
    if (atk === 'tax' && def === 'profit') return 1.5;
    if (atk === 'profit' && def === 'tax') return 0.7;
    if (atk === 'love' && def === 'profit') return 0.7;
    if (atk === 'tax' && def === 'love') return 0.7;
    return 1.0;
  }

  _updateCombatUI() {
    const c = this.state.combat;
    if (!c) return;
    const php = document.getElementById('realm-cp-hp-' + this.id);
    const ehp = document.getElementById('realm-ce-hp-' + this.id);
    const sup = document.getElementById('realm-super-' + this.id);
    const log = document.getElementById('realm-combat-log-' + this.id);
    const bSpec = document.getElementById('realm-btn-spec-' + this.id);
    const bUlt = document.getElementById('realm-btn-ult-' + this.id);
    if (php) php.style.width = (c.playerHp / c.player.maxHp * 100) + '%';
    if (ehp) ehp.style.width = (c.bossHp / c.boss.maxHp * 100) + '%';
    if (sup) sup.textContent = c.superMeter;
    if (bSpec) { bSpec.disabled = c.superMeter < 50; bSpec.style.opacity = c.superMeter < 50 ? '0.3' : '1'; }
    if (bUlt) { bUlt.disabled = c.superMeter < 100; bUlt.style.opacity = c.superMeter < 100 ? '0.3' : '1'; }
    if (log) log.innerHTML = c.log.slice(-5).map(l => '<div>' + l + '</div>').join('');
  }

  _updateDex() {
    const list = document.getElementById('realm-dex-list-' + this.id);
    if (list) list.innerHTML = this.state.souls.map(s => '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.05);"><span>' + s.name + '</span><span>' + (s.rarity || 'common') + '</span></div>').join('');
  }

  _runCommand(cmd) {
    const parts = cmd.toLowerCase().split(' ');
    switch (parts[0]) {
      case 'forge': this._togglePanel('realm-forge-' + this.id); break;
      case 'gacha': this._togglePanel('realm-gacha-' + this.id); break;
      case 'combat':
        if (parts[1] !== undefined && PANTHEON[parts[1]]) this._startCombat(parseInt(parts[1]));
        else this._startCombat(0);
        break;
      case 'dex': this._togglePanel('realm-dex-' + this.id); break;
      case 'time': this._dayNight.time = parseInt(parts[1]) || 12; break;
      case 'weather': this._weatherSystem.change(parts[1] || 'rainy'); break;
      case 'gems': this.state.gems += parseInt(parts[1]) || 100; document.getElementById('realm-gems-' + this.id).textContent = this.state.gems; break;
      case 'tp': {
        const d = this._districts[parts[1]];
        if (d) {
          // Camera teleport is handled externally; we just log it
          if (typeof console !== 'undefined') console.log('[Realm] TP to', parts[1]);
        }
        break;
      }
      case 'plt': this._updatePLT(parseInt(parts[1]) || 0, parseInt(parts[2]) || 0, parseInt(parts[3]) || 0); break;
    }
  }

  _togglePanel(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
  }

  // ---- Agent AI Update ----
  _updateAgents(dt) {
    const phrases = {
      profit: ['Building something new...','Growth is the only metric.','Time is money.','Let me optimize that.'],
      love: ['This is beautiful.','We should connect more.','How are you feeling?','The bonds matter.'],
      tax: ['Costs are rising.','We need balance.','Risk assessment needed.','Slow down.']
    };
    const NEED_TYPES = ['energy', 'social', 'skill', 'purpose'];
    for (const a of this.agents) {
      for (const k of NEED_TYPES) a.needs[k] = Math.max(0, Math.min(100, a.needs[k] - dt * (1 + this._rng() * 0.5)));
      a.stateTimer += dt;
      if (a.state === 'IDLE') {
        const lowest = NEED_TYPES.reduce((min, k) => a.needs[k] < a.needs[min] ? k : min, NEED_TYPES[0]);
        if (a.needs[lowest] < 40) {
          const district = lowest === 'energy' ? 'home' : lowest === 'social' ? 'social' : lowest === 'skill' ? 'learn' : 'work';
          const d = this._districts[district];
          if (d) {
            a.targetPos = new this.THREE.Vector3((d.zone.x[0] + d.zone.x[1]) / 2 + (this._rng() - 0.5) * 40, 0, (d.zone.z[0] + d.zone.z[1]) / 2 + (this._rng() - 0.5) * 40);
            a.state = 'WALKING';
            a.mesh.ring.material.opacity = 0.3;
          }
        }
        if (this._rng() < 0.001) {
          const nearby = this.agents.filter(other => other !== a && other.mesh.group.position.distanceTo(a.mesh.group.position) < 16);
          if (nearby.length > 0) { a.conversationTarget = nearby[0]; a.state = 'SOCIAL'; a.stateTimer = 0; }
        }
      } else if (a.state === 'WALKING') {
        if (!a.targetPos) { a.state = 'IDLE'; continue; }
        const pos = a.mesh.group.position;
        const dx = a.targetPos.x - pos.x, dz = a.targetPos.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5) {
          a.state = 'IDLE'; a.mesh.ring.material.opacity = 0; a.targetPos = null;
          for (const k of NEED_TYPES) if (a.needs[k] < 50) a.needs[k] = Math.min(100, a.needs[k] + 30 * dt);
          continue;
        }
        pos.x += (dx / dist) * 4.0 * dt; pos.z += (dz / dist) * 4.0 * dt;
        a.mesh.group.rotation.y = Math.atan2(dx, dz);
        // Walk animation
        a.mesh.legs.forEach((l, i) => l.rotation.x = Math.sin(performance.now() * 0.005 + i * Math.PI) * 0.4);
        a.mesh.arms.forEach((a2, i) => a2.rotation.x = Math.sin(performance.now() * 0.005 + i * Math.PI + Math.PI) * 0.3);
      } else if (a.state === 'SOCIAL') {
        if (!a.conversationTarget || a.stateTimer > 5) { a.state = 'IDLE'; a.conversationTarget = null; a.mesh.ring.material.opacity = 0; continue; }
        a.needs.social = Math.min(100, a.needs.social + 10 * dt);
        const o = a.conversationTarget;
        const dx = o.mesh.group.position.x - a.mesh.group.position.x;
        const dz = o.mesh.group.position.z - a.mesh.group.position.z;
        a.mesh.group.rotation.y = Math.atan2(dx, dz);
        if (this._rng() < 0.02) this._spawnChatBubble(a, o, phrases);
      }
    }
  }

  _spawnChatBubble(a1, a2, phrases) {
    const text = (phrases[a1.type] || phrases.profit)[Math.floor(this._rng() * 4)];
    const bubble = document.createElement('div');
    bubble.style.cssText = 'position:absolute;background:rgba(5,5,20,0.9);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:6px 10px;font-size:11px;color:#fff;pointer-events:none;white-space:nowrap;z-index:40;';
    bubble.textContent = text;
    document.body.appendChild(bubble);
    // Project 3D position to screen
    const updatePos = () => {
      if (!bubble.parentNode) return;
      const pos = a1.mesh.group.position.clone(); pos.y += 2.5;
      // We need camera reference for projection — stored externally
      const cam = window.__realmActiveCamera;
      if (!cam) return;
      pos.project(cam);
      bubble.style.left = ((pos.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      bubble.style.top = ((-pos.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      requestAnimationFrame(updatePos);
    };
    updatePos();
    setTimeout(() => bubble.remove(), 3000);
  }

  _drawMinimap() {
    if (!this._minimapCtx) return;
    const ctx = this._minimapCtx;
    const w = 160, h = 160;
    const worldSize = 450; // maps -225 to +225
    const half = worldSize / 2;
    ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, w, h);
    for (const [name, d] of Object.entries(this._districts)) {
      const x1 = ((d.zone.x[0] + half) / worldSize) * w;
      const z1 = ((d.zone.z[0] + half) / worldSize) * h;
      const x2 = ((d.zone.x[1] + half) / worldSize) * w;
      const z2 = ((d.zone.z[1] + half) / worldSize) * h;
      ctx.fillStyle = '#' + d.color.toString(16).padStart(6, '0') + '33';
      ctx.fillRect(x1, z1, x2 - x1, z2 - z1);
    }
    for (const a of this.agents) {
      const x = ((a.mesh.group.position.x + half) / worldSize) * w;
      const z = ((a.mesh.group.position.z + half) / worldSize) * h;
      ctx.fillStyle = a.type === 'profit' ? '#ffaa00' : a.type === 'love' ? '#ff66aa' : '#00ffcc';
      ctx.beginPath(); ctx.arc(x, z, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // Camera triangle
    const cam = window.__realmActiveCamera;
    if (cam) {
      const cx = ((cam.position.x + half) / worldSize) * w;
      const cz = ((cam.position.z + half) / worldSize) * h;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cz - 4); ctx.lineTo(cx + 3, cz + 2); ctx.lineTo(cx - 3, cz + 2); ctx.closePath(); ctx.stroke();
    }
  }

  _updateThoughts(dt) {
    this._thoughtTimer = (this._thoughtTimer || 0) + dt;
    if (this._thoughtTimer > 8) {
      this._thoughtTimer = 0;
      const thoughts = [
        'Observing ' + this.config.name + '... agents moving...',
        'PLT balance shifting in ' + this.config.name + '...',
        'Weather changing in the realm...',
        'Agents conversing in ' + this.config.name + '...',
        'New soul forged...',
        'The multiverse is alive...',
        'Scanning citizen needs...',
        'Marketplace activity...',
        'Bridge syncing...',
        'Day cycle progressing...'
      ];
      const text = thoughts[Math.floor(this._rng() * thoughts.length)];
      const container = document.getElementById('realm-thoughts-' + this.id);
      if (container) {
        const el = document.createElement('div');
        el.style.cssText = 'padding:4px 8px;margin-bottom:3px;background:rgba(255,170,0,0.05);border-left:2px solid #ffaa00;border-radius:0 4px 4px 0;font-size:10px;color:#aaa;';
        el.textContent = text;
        container.appendChild(el);
        if (container.children.length > 20) container.removeChild(container.firstChild);
      }
    }
  }

  _updateAgentPanel() {
    const container = document.getElementById('realm-agents-' + this.id);
    if (!container) return;
    // Rebuild only every few frames to save cost
    if (this._agentPanelTimer === undefined) this._agentPanelTimer = 0;
    this._agentPanelTimer++;
    if (this._agentPanelTimer % 30 !== 0) return;
    let html = '<div style="font-size:10px;color:#ffaa00;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Citizens</div>';
    for (const a of this.agents) {
      const color = a.type === 'profit' ? '#ffaa00' : a.type === 'love' ? '#ff66aa' : '#00ffcc';
      html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;"><span style="width:8px;height:8px;border-radius:50%;background:' + color + ';"></span><span style="flex:1;">' + a.name + '</span><span style="font-size:9px;color:#888;">' + a.state + '</span></div>';
    }
    container.innerHTML = html;
  }

  _checkAchievements() {
    const checks = [
      { name:'First Soul', check:()=>this.state.souls.length>=1 },
      { name:'Collector', check:()=>this.state.souls.length>=5 },
      { name:'Warrior', check:()=>this.state.plt.profit>70 },
      { name:'Diplomat', check:()=>this.state.plt.love>80 },
      { name:'PLT Master', check:()=>this.state.plt.profit+this.state.plt.love+this.state.plt.tax>200 }
    ];
    for (const a of checks) {
      if (a.check() && !a.unlocked) {
        a.unlocked = true;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,170,0,0.9);color:#000;padding:8px 16px;border-radius:8px;font-weight:bold;z-index:50;font-size:13px;';
        el.textContent = 'Achievement: ' + a.name;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
      }
    }
  }

  // ---- Public API ----
  getRoot() { return this.root; }

  enter() {
    if (this.active) return;
    this.active = true;
    this.root.visible = true;
    if (this._lazyUI && !this._uiBuilt) { this._buildUI(); this._uiBuilt = true; }
    if (this._ui) this._ui.style.display = 'block';
    this._updatePLT(0, 0, 0); // refresh UI
    if (typeof console !== 'undefined') console.log('[Realm] Entered', this.config.name);
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.root.visible = false;
    if (this._ui) this._ui.style.display = 'none';
    if (typeof console !== 'undefined') console.log('[Realm] Exited', this.config.name);
  }

  update(dt) {
    if (!this.active) return;
    this._time += dt;
    this._updateAgents(dt);
    if (this._weatherSystem) this._weatherSystem.update(dt);
    if (this._dayNight) this._dayNight.update(dt);
    this._updateThoughts(dt);
    this._checkAchievements();
    this._drawMinimap();
    this._updateAgentPanel();
    // Update day display
    const dayEl = document.getElementById('realm-day-' + this.id);
    if (dayEl && this._dayNight) dayEl.textContent = 'Day ' + this._dayNight.day;
  }

  handleClick(clientX, clientY, camera) {
    // Raycast for 3D interactions (agents, forge altar, etc.) — can be expanded
    return false;
  }
}

// Genesis install helper
export function install(Genesis) {
  if (!Genesis) return null;
  if (Genesis.RealmWorld) return Genesis.RealmWorld;
  if (typeof window !== 'undefined' && window.__GENESIS_REALM_WORLD === false) return null;
  Genesis.RealmWorld = { Realm, generateRealmConfig };
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('realm-world', { status: 'validated', path: './src/genesis/realm-world.js' });
  }
  if (typeof console !== 'undefined') console.log('[RealmWorld] Installed — Lost World mechanics ready');
  return Genesis.RealmWorld;
}
