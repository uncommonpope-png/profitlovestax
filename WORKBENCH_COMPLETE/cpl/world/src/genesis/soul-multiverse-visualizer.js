// src/genesis/soul-multiverse-visualizer.js
// SOUL MULTIVERSE VISUALIZER — brings the fix-us/soul-multiverse theology into 3D.
// The existing CPL city is the Prime Universe. Around it:
//   - Fractal self-similar copies at larger scales (universes within universes)
//   - Quantum superposition nodes (ghostly probability clouds)
//   - Spectrum rings (colored torus bands representing soul frequencies)
//   - Nested universe bubbles (spheres containing smaller spheres)
//   - Timeline branches (diverging golden paths)
//   - Dimension layers (visual overlays: physical=opaque, quantum=glow, infinite=ethereal)
// All visible simultaneously. Camera freely orbits/pans/zooms.
// Flag-gated by window.__GENESIS_SOUL_MULTIVERSE (default ON).

import * as THREE from 'three';

const SPECTRUM_COLORS = [
  { name:'Red', min:400, max:484, hex:0xff0000, freq:442 },
  { name:'Orange', min:484, max:508, hex:0xff7f00, freq:496 },
  { name:'Yellow', min:508, max:526, hex:0xffff00, freq:517 },
  { name:'Green', min:526, max:606, hex:0x00ff00, freq:566 },
  { name:'Blue', min:606, max:668, hex:0x0000ff, freq:637 },
  { name:'Indigo', min:668, max:700, hex:0x4b0082, freq:684 },
  { name:'Violet', min:700, max:789, hex:0x9400d3, freq:744 },
  { name:'Ultraviolet', min:789, max:1000, hex:0x8f00ff, freq:895 }
];

function seededRng(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  return () => { s = (s * 16807) % 2147483647; return (s & 0x7fffffff) / 2147483647; };
}

export class SoulMultiverseVisualizer {
  constructor(ctx = {}) {
    this.THREE = ctx.THREE || window.THREE;
    this.scene = ctx.scene;
    this.camera = ctx.camera;
    this.root = new this.THREE.Group();
    this.root.name = 'SoulMultiverse';
    this._time = 0;
    this._seed = ctx.seed || 'Craig-Prime';
    this._rng = seededRng(this._seed);
    this._elements = []; // { type, mesh, update }
    this._quantumSouls = [];
    this._spectrumRings = [];
    this._fractalNodes = [];
    this._universeBubbles = [];
    this._timelines = [];
  }

  async init() {
    if (!this.scene) { if (typeof console !== 'undefined') console.warn('[SoulMultiverse] No scene'); return; }
    this.scene.add(this.root);
    
    // EXACTLY match the Lost World Bible camera setup
    if (this.camera && window.controls) {
      window.controls.enabled = true;
      window.controls.minDistance = 0.5;
      window.controls.maxDistance = 2000;
      window.controls.maxPolarAngle = Math.PI / 2.1;
      window.controls.enableDamping = true;
      window.controls.dampingFactor = 0.05;
      this.camera.position.set(0, 25, 40);
    }
    
    this._buildFractalField();
    this._buildQuantumCloud();
    this._buildSpectrumRings();
    this._buildUniverseBubbles();
    this._buildTimelineBranches();
    this._buildDimensionOverlay();
    if (typeof console !== 'undefined') console.log('[SoulMultiverse] Fractal multiverse initialized');
  }

  // ---- 1. FRACTAL FIELD — self-similar city copies at every scale ----
  _buildFractalField() {
    // Create 5 fractal recursion levels of the "city pattern"
    // Each level is a simplified geometric representation that echoes the city's structure
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      const scale = Math.pow(3, i); // 3x, 9x, 27x, 81x, 243x
      const dist = scale * 80; // distance from center
      const count = Math.max(1, 6 - i); // fewer copies at larger scales
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2 + (i * 1.2);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = i * 40; // height increases with scale
        const fractalNode = this._createFractalNode(scale, i);
        fractalNode.position.set(x, y, z);
        this.root.add(fractalNode);
        this._fractalNodes.push({ mesh: fractalNode, level: i, baseScale: scale, angle, dist });
      }
    }
  }

  _createFractalNode(scale, level) {
    const group = new this.THREE.Group();
    const t = this._rng();
    // Core — a glowing icosahedron representing the "universe seed"
    const coreGeo = new this.THREE.IcosahedronGeometry(2 * scale, 1);
    const coreMat = new this.THREE.MeshStandardMaterial({
      color: 0x44aaff,
      emissive: 0x2266ff,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    const core = new this.THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbital rings — representing "dimensions" or "timelines"
    const ringCount = 2 + level;
    for (let r = 0; r < ringCount; r++) {
      const ringGeo = new this.THREE.TorusGeometry(scale * (2 + r * 0.8), 0.15 * scale, 8, 64);
      const ringMat = new this.THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.15
      });
      const ring = new this.THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + r * 0.4;
      ring.rotation.y = r * 0.6;
      group.add(ring);
    }

    // Miniature "buildings" — tetrahedrons representing the self-similar city pattern
    const buildingCount = 4 + level * 2;
    for (let b = 0; b < buildingCount; b++) {
      const bGeo = new this.THREE.TetrahedronGeometry(0.3 * scale, 0);
      const bMat = new this.THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        emissive: 0x0088aa,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5
      });
      const bMesh = new this.THREE.Mesh(bGeo, bMat);
      const ba = (b / buildingCount) * Math.PI * 2;
      const br = scale * (1.5 + this._rng() * 1.5);
      bMesh.position.set(Math.cos(ba) * br, (this._rng() - 0.5) * scale * 0.5, Math.sin(ba) * br);
      group.add(bMesh);
    }

    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#66ccff';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Universe-${level} (scale ${scale}x)`, 256, 75);
    const tex = new this.THREE.CanvasTexture(canvas);
    const label = new this.THREE.Sprite(new this.THREE.SpriteMaterial({ map: tex, transparent: true }));
    label.position.y = scale * 3.5;
    label.scale.set(scale * 4, scale, 1);
    group.add(label);

    return group;
  }

  // ---- 2. QUANTUM CLOUD — souls in superposition ----
  _buildQuantumCloud() {
    const soulCount = 12;
    for (let i = 0; i < soulCount; i++) {
      const angle = (i / soulCount) * Math.PI * 2;
      const dist = 60 + this._rng() * 40;
      const group = new this.THREE.Group();
      group.position.set(Math.cos(angle) * dist, 15 + this._rng() * 20, Math.sin(angle) * dist);

      // Probability cloud — multiple ghostly spheres
      const states = 3 + Math.floor(this._rng() * 4);
      for (let s = 0; s < states; s++) {
        const geo = new this.THREE.SphereGeometry(1.5 + s * 0.5, 16, 16);
        const mat = new this.THREE.MeshBasicMaterial({
          color: 0xff66aa,
          transparent: true,
          opacity: 0.08 - s * 0.015
        });
        const mesh = new this.THREE.Mesh(geo, mat);
        mesh.position.set((this._rng() - 0.5) * 3, s * 0.8, (this._rng() - 0.5) * 3);
        group.add(mesh);
      }

      // Central "collapsed" soul core
      const coreGeo = new this.THREE.SphereGeometry(0.6, 16, 16);
      const coreMat = new this.THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 0.8
      });
      const core = new this.THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Quantum label
      const names = ['Creator', 'Observer', 'Weaver', 'Witness', 'Builder', 'Resting'];
      const name = names[Math.floor(this._rng() * names.length)];
      const cvs = document.createElement('canvas');
      cvs.width = 256; cvs.height = 64;
      const c = cvs.getContext('2d');
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, 256, 64);
      c.fillStyle = '#ff66aa'; c.font = 'bold 20px Georgia'; c.textAlign = 'center';
      c.fillText(`Ψ ${name}`, 128, 40);
      const t = new this.THREE.CanvasTexture(cvs);
      const spr = new this.THREE.Sprite(new this.THREE.SpriteMaterial({ map: t, transparent: true }));
      spr.position.y = 3.5; spr.scale.set(4, 1, 1);
      group.add(spr);

      this.root.add(group);
      this._quantumSouls.push({
        mesh: group,
        name,
        states,
        collapsed: false,
        angle,
        dist,
        baseY: group.position.y
      });
    }
  }

  // ---- 3. SPECTRUM RINGS — soul frequencies as colored torus bands ----
  _buildSpectrumRings() {
    for (let i = 0; i < SPECTRUM_COLORS.length; i++) {
      const spec = SPECTRUM_COLORS[i];
      const innerR = 120 + i * 25;
      const tubeR = 4;
      const geo = new this.THREE.TorusGeometry(innerR, tubeR, 16, 128);
      const mat = new this.THREE.MeshStandardMaterial({
        color: spec.hex,
        emissive: spec.hex,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.25,
        side: this.THREE.DoubleSide
      });
      const ring = new this.THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2 + (i * 0.15);
      ring.rotation.y = i * 0.2;
      this.root.add(ring);
      this._spectrumRings.push({ mesh: ring, color: spec, innerR, speed: 0.02 + i * 0.01 });
    }
  }

  // ---- 4. UNIVERSE BUBBLES — nested spheres containing smaller spheres ----
  _buildUniverseBubbles() {
    const positions = [
      { x: 200, z: 200 }, { x: -200, z: 200 }, { x: 200, z: -200 }, { x: -200, z: -200 },
      { x: 300, z: 0 }, { x: -300, z: 0 }, { x: 0, z: 300 }, { x: 0, z: -300 }
    ];
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const group = new this.THREE.Group();
      group.position.set(pos.x, 40 + this._rng() * 30, pos.z);

      // Outer bubble
      const outerGeo = new this.THREE.SphereGeometry(15 + this._rng() * 10, 32, 32);
      const outerMat = new this.THREE.MeshStandardMaterial({
        color: 0x6644ff,
        emissive: 0x3311aa,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.15,
        side: this.THREE.DoubleSide
      });
      const outer = new this.THREE.Mesh(outerGeo, outerMat);
      group.add(outer);

      // Inner bubbles (nested universes)
      const innerCount = 2 + Math.floor(this._rng() * 3);
      for (let j = 0; j < innerCount; j++) {
        const innerGeo = new this.THREE.SphereGeometry(3 + j * 2, 16, 16);
        const innerMat = new this.THREE.MeshBasicMaterial({
          color: 0xaa88ff,
          transparent: true,
          opacity: 0.1 + j * 0.05
        });
        const inner = new this.THREE.Mesh(innerGeo, innerMat);
        inner.position.set((this._rng() - 0.5) * 8, j * 3, (this._rng() - 0.5) * 8);
        group.add(inner);
      }

      // Connecting threads (causality lines)
      const lineGeo = new this.THREE.BufferGeometry();
      const linePos = new Float32Array([
        0, 0, 0,
        -pos.x * 0.3, -40, -pos.z * 0.3
      ]);
      lineGeo.setAttribute('position', new this.THREE.BufferAttribute(linePos, 3));
      const lineMat = new this.THREE.LineBasicMaterial({ color: 0x6644ff, transparent: true, opacity: 0.2 });
      const line = new this.THREE.Line(lineGeo, lineMat);
      group.add(line);

      this.root.add(group);
      this._universeBubbles.push({ mesh: group, pos, outer, inners: innerCount });
    }
  }

  // ---- 5. TIMELINE BRANCHES — diverging golden paths ----
  _buildTimelineBranches() {
    const branchCount = 6;
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2 + 0.3;
      const points = [];
      const segments = 20;
      const length = 150 + this._rng() * 100;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const x = Math.cos(angle + t * 0.5) * t * length;
        const z = Math.sin(angle + t * 0.5) * t * length;
        const y = Math.sin(t * Math.PI) * 20 + t * 30;
        points.push(new this.THREE.Vector3(x, y, z));
      }
      const curve = new this.THREE.CatmullRomCurve3(points);
      const tubeGeo = new this.THREE.TubeGeometry(curve, 64, 0.3, 8, false);
      const tubeMat = new this.THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.4
      });
      const tube = new this.THREE.Mesh(tubeGeo, tubeMat);
      this.root.add(tube);

      // End node — the "alternate reality"
      const endGeo = new this.THREE.OctahedronGeometry(2, 0);
      const endMat = new this.THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8
      });
      const endNode = new this.THREE.Mesh(endGeo, endMat);
      endNode.position.copy(points[points.length - 1]);
      this.root.add(endNode);

      this._timelines.push({ tube, endNode, angle, length });
    }
  }

  // ---- 6. DIMENSION OVERLAY — visual layers for Physical/Quantum/Infinite dimensions ----
  _buildDimensionOverlay() {
    // Physical dimension — the ground plane (already exists as the city)
    // Quantum dimension — a glowing grid that hovers above
    const quantumGrid = new this.THREE.GridHelper(600, 60, 0xff66aa, 0x330022);
    quantumGrid.position.y = 80;
    quantumGrid.material.opacity = 0.08;
    quantumGrid.material.transparent = true;
    this.root.add(quantumGrid);

    // Infinite dimension — a higher ethereal plane
    const infiniteGrid = new this.THREE.GridHelper(900, 40, 0x44aaff, 0x001133);
    infiniteGrid.position.y = 160;
    infiniteGrid.material.opacity = 0.05;
    infiniteGrid.material.transparent = true;
    this.root.add(infiniteGrid);

    // Dimension labels
    const dims = [
      { name: 'Physical', y: 5, color: '#00ffcc' },
      { name: 'Quantum', y: 85, color: '#ff66aa' },
      { name: 'Infinite', y: 165, color: '#44aaff' }
    ];
    for (const d of dims) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = d.color;
      ctx.font = 'bold 36px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.name} Dimension`, 256, 75);
      const tex = new this.THREE.CanvasTexture(canvas);
      const spr = new this.THREE.Sprite(new this.THREE.SpriteMaterial({ map: tex, transparent: true }));
      spr.position.set(0, d.y, 0);
      spr.scale.set(30, 7.5, 1);
      this.root.add(spr);
    }
  }

  // ---- Update loop ----
  update(dt) {
    this._time += dt;
    const t = this._time;

    // Animate fractal nodes (slow rotation + pulse)
    for (const f of this._fractalNodes) {
      f.mesh.rotation.y += dt * 0.1 / f.level;
      f.mesh.children[0].scale.setScalar(1 + Math.sin(t * 0.5 + f.level) * 0.05);
    }

    // Animate quantum souls (probability cloud drift)
    for (const q of this._quantumSouls) {
      q.mesh.position.y = q.baseY + Math.sin(t * 0.8 + q.angle) * 3;
      q.mesh.rotation.y += dt * 0.2;
      // Probability states breathe
      for (let i = 1; i < q.mesh.children.length - 2; i++) {
        const child = q.mesh.children[i];
        if (child && child.material && child.material.opacity !== undefined) {
          child.material.opacity = 0.08 - (i - 1) * 0.015 + Math.sin(t * 2 + i) * 0.02;
        }
      }
    }

    // Animate spectrum rings (slow rotation at different speeds)
    for (const s of this._spectrumRings) {
      s.mesh.rotation.z += dt * s.speed;
      s.mesh.material.opacity = 0.25 + Math.sin(t * 0.3 + s.color.freq * 0.001) * 0.1;
    }

    // Animate universe bubbles (gentle float)
    for (const u of this._universeBubbles) {
      u.mesh.position.y += Math.sin(t * 0.4 + u.pos.x * 0.01) * 0.02;
      u.mesh.rotation.y += dt * 0.05;
    }

    // Animate timeline branches (pulse emissive)
    for (const tl of this._timelines) {
      tl.tube.material.emissiveIntensity = 0.5 + Math.sin(t * 1.5 + tl.angle) * 0.3;
      tl.endNode.rotation.y += dt * 0.8;
      tl.endNode.scale.setScalar(1 + Math.sin(t * 2 + tl.angle) * 0.2);
    }
  }

  dispose() {
    this.scene.remove(this.root);
    // Deep cleanup
    this.root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}

// Genesis install helper
export function install(Genesis, ctx) {
  if (!Genesis) return null;
  if (Genesis.SoulMultiverseVisualizer) return Genesis.SoulMultiverseVisualizer;
  if (typeof window !== 'undefined' && window.__GENESIS_SOUL_MULTIVERSE === false) return null;

  const viz = new SoulMultiverseVisualizer(ctx || {});
  viz.init();
  Genesis.SoulMultiverseVisualizer = viz;
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('soul-multiverse', { status: 'validated', path: './src/genesis/soul-multiverse-visualizer.js' });
  }
  if (typeof console !== 'undefined') console.log('[SoulMultiverse] Visualizer installed — fractal multiverse active');
  return viz;
}
